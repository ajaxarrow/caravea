# Caravea – Workshop bookings

Customers book their caravan in for a service in one of the dealer's service bays.

```
backend/    Laravel 13 API (SQLite, Form Requests, Pest)
frontend/   Next.js 16 App Router + TypeScript (Server Components, Server Actions, Tailwind, shadcn/ui, Phosphor)
```

**Why one repo, two folders?** This is a single module, and the API and UI change together: a new validation rule
and the field that shows its error ship in one commit. One repo keeps them reviewable as one pull request. In the
platform the backend would be a module inside the existing Laravel monolith and the frontend part of the shared
Next.js app, so the folders are already split along that line.

No auth on purpose: the brief scopes this to the bookings module. `authorize()` and the Server Actions are where it
plugs in (see the last section).

## Run it

Needs PHP 8.3+, Composer, Node 20+.

```bash
# API → http://127.0.0.1:8000
cd backend
composer install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed          # 4 bays, ~3 weeks of bookings
php artisan serve

# UI → http://localhost:3000
cd frontend
npm install
cp .env.example .env.local          # API_URL=http://127.0.0.1:8000/api
npm run dev
```

## Tests

| Where | Command | Covers |
| --- | --- | --- |
| `backend` | `php artisan test` | 73 Pest tests: CRUD, pagination and filters, every validation rule, overlap edge cases, N+1 guard, and a real multi-process race |
| `frontend` | `npm test` | Vitest: URL parsing, workshop-timezone formatting (incl. DST), Laravel error → field mapping |
| `frontend` | `npm run e2e` | Playwright on the full stack (own SQLite DB + production build): create, field errors, overlap error, URL filter/pagination, in-place list updates with no reload, edit, not-found |
| `frontend` | `npm run e2e` (`states` suite) | Every page's loading and error state, and every write's saving and failure state. A test-only proxy between Next and Laravel ([`fault-proxy.mjs`](frontend/e2e/support/fault-proxy.mjs)) makes chosen API calls slow, fail, or unreachable. Any uncaught browser error fails a test |

`npm run e2e` starts Laravel, the fault proxy and Next itself. Run `npx playwright install chromium` the first time.

## What's where

- **Overlap rule:** [`BookingScheduler`](backend/app/Services/BookingScheduler.php) is the only write path.
  [`ConcurrentBookingTest`](backend/tests/Feature/Bookings/ConcurrentBookingTest.php) proves it under a real race.
- **Validation:** [`BookingRequest`](backend/app/Http/Requests/Bookings/BookingRequest.php) and its Store/Update
  subclasses. Times arrive as the dealer's wall-clock time and are stored in UTC.
- **Data and caching:** [`queries.ts`](frontend/src/lib/bookings/queries.ts) (reads),
  [`actions.ts`](frontend/src/lib/bookings/actions.ts) (writes), [`cache.ts`](frontend/src/lib/bookings/cache.ts) (what's
  cached, and why so little).
- **Ids:** bookings use UUIDv7 primary keys, so they can't be guessed or enumerated from a URL, and they stay
  time-ordered for the index. Malformed ids are rejected before any query, in both Laravel and Next.
- **List:** [`app/bookings/page.tsx`](frontend/src/app/bookings/page.tsx). `?status=&page=` is the only state.

## Senior write-up

**Caching and revalidation.** Bookings are not cached in Next. They're live data that several staff edit, and
the Laravel query behind them is indexed and cheap. React `cache()` only dedupes reads within one render. I started
with `'use cache'` plus narrow tags expired by `updateTag`, but the fault-injection e2e suite caught Next 16.4 serving
a list from before a write. Its tag manifest is stamped with two different clocks (`performance.now()` and
`Date.now()`), and once they drift apart a just-expired tag looks like it expires in the future. For operational
data, reading fresh beats a cache I can't trust. What is cached: the bays and timezone (`'use cache'`, hours, tag
`workshop`). After a write, actions redirect, or call `refresh()` to re-render the current route in the same response,
which is how the list updates without a reload. Pages read `searchParams`/`params` inside `<Suspense>`, so the header
and hero are a prerendered static shell that paints instantly while data streams. A missing booking renders the
not-found UI with a 200 (the shell has already been sent). An `X-Robots-Tag: noindex` header keeps the whole internal
tool out of search engines.

**Two simultaneous bookings.** Validation alone can't hold this: both requests pass it before either writes. So the
check runs inside the write transaction, after taking a lock both requests need. The first statement is an `UPDATE`
on the bay's row. On MySQL and Postgres that's a row lock on that bay only. On SQLite it's the write lock, where
`lockForUpdate()` is a no-op. The overlap query (half-open ranges, so back-to-back is fine, and cancelled bookings are
ignored) then sees whatever the previous lock holder committed. The loser gets a normal 422 on `service_bay`. The
race test fires 8 processes at the same slot and asserts 1 created and 7 clean conflicts. With the lock removed it
fails with "database is locked" (on MySQL that would be duplicate rows). On Postgres I'd add an exclusion constraint
(`EXCLUDE USING gist (service_bay_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status <> 'cancelled')`)
as a database-level backstop.

**As one module for 200 dealers, first I'd:**

1. Add `company_id` to bays and bookings with a global scope that fails closed, and resolve route-model bindings
   through it, so `/bookings/{id}` from another dealer is a 404. Policies replace `authorize(): true`. Add a test
   that every query on these models is company-scoped.
2. Make the timezone per company instead of app config, which is already the only thing read for it.
3. Key the cached workshop data by company, and if read load ever justifies caching bookings, do it with a shared
   handler (Redis via `'use cache: remote'`) and per-company tags, not the in-memory default.
4. Emit a `BookingChanged` event (Reverb plus tag revalidation) so other staff see changes live instead of
   within 30s.
5. Move to Postgres with the exclusion constraint above, and composite indexes leading with `company_id`.

**Next with more time:** a day/bay calendar view, the Proxy 404, sending the edited booking's `updated_at` to catch
lost updates between two editors, and the e2e suite in CI.
