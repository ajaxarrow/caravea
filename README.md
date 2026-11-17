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
| `backend` | `php artisan test` | 70 Pest tests: CRUD, pagination and filters, every validation rule, overlap edge cases, N+1 guard, and a real multi-process race |
| `frontend` | `npm test` | Vitest: URL parsing, workshop-timezone formatting (incl. DST), Laravel error → field mapping |
| `frontend` | `npm run e2e` | Playwright on the full stack (own SQLite DB + production build): create, field errors, overlap error, URL filter/pagination, in-place list updates with no reload, edit, not-found |

`npm run e2e` starts both servers itself. Run `npx playwright install chromium` the first time.

## What's where

- **Overlap rule:** [`BookingScheduler`](backend/app/Services/BookingScheduler.php) is the only write path.
  [`ConcurrentBookingTest`](backend/tests/Feature/Bookings/ConcurrentBookingTest.php) proves it under a real race.
- **Validation:** [`BookingRequest`](backend/app/Http/Requests/Bookings/BookingRequest.php) and its Store/Update
  subclasses. Times arrive as the dealer's wall-clock time and are stored in UTC.
- **Data and caching:** [`queries.ts`](frontend/src/lib/bookings/queries.ts) (reads),
  [`actions.ts`](frontend/src/lib/bookings/actions.ts) (writes), [`cache.ts`](frontend/src/lib/bookings/cache.ts) (tags).
- **List:** [`app/bookings/page.tsx`](frontend/src/app/bookings/page.tsx). `?status=&page=` is the only state.

## Senior write-up

**Caching and revalidation.** Reads are `'use cache'` functions with narrow tags: `bookings:list` and
`bookings:{id}`. Every Server Action calls `updateTag` on just the tags it affects, so the author sees the change
immediately: Next re-renders the current route in the action's own response, which is how the list updates without a
reload. Bookings have a short lifetime (30s revalidate, 5min expire), because other staff edit the same data and this
app isn't told about changes made elsewhere. A stale list can never cause a double booking, because the API re-checks
every write. Bays and the timezone are cached for hours. The pages read `searchParams` and `params` inside
`<Suspense>`, so the header and hero are in the static shell and paint instantly while results stream. Trade-off: a
missing booking renders the not-found UI with `noindex` but a 200 status, since the shell has already been sent.
That's fine for a staff tool. A public page would check in Proxy instead.

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
3. Prefix cache tags with the company (`c:{id}:bookings:list`) so one dealer's write never expires another's
   cache, and move to a shared cache handler (`'use cache: remote'`/Redis) once there's more than one Next instance.
4. Emit a `BookingChanged` event (Reverb plus tag revalidation) so other staff see changes live instead of
   within 30s.
5. Move to Postgres with the exclusion constraint above, and composite indexes leading with `company_id`.

**Next with more time:** a day/bay calendar view, the Proxy 404, sending the edited booking's `updated_at` to catch
lost updates between two editors, and the e2e suite in CI.
