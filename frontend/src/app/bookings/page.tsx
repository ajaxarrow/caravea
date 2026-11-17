import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { BookingRow } from "@/components/bookings/booking-row"
import { Hero } from "@/components/bookings/hero"
import { Pagination } from "@/components/bookings/pagination"
import { SavedNotice } from "@/components/bookings/saved-notice"
import { BookingListSkeleton } from "@/components/bookings/skeletons"
import { STATUS_LABELS } from "@/components/bookings/status-badge"
import { StatusFilter } from "@/components/bookings/status-filter"
import { buttonVariants } from "@/components/ui/button"
import { getBookings, getWorkshop } from "@/lib/bookings/queries"
import { bookingsHref, parseBookingsQuery } from "@/lib/bookings/search-params"
import { timeZoneCity } from "@/lib/datetime"

export const metadata: Metadata = {
  title: "Bookings",
}

/*
 * The page itself never awaits anything, so the header and hero are part
 * of the prerendered static shell and paint immediately. Only the results
 * depend on the URL; they stream in behind the skeleton.
 */
export default function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <Hero />
      <section aria-labelledby="bookings-title" className="mt-12">
        <Suspense fallback={<BookingListSkeleton />}>
          <BookingResults searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  )
}

async function BookingResults({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  const raw = await searchParams
  const query = parseBookingsQuery(raw)
  const [{ data: bookings, meta }, workshop] = await Promise.all([getBookings(query), getWorkshop()])

  const outOfRange = bookings.length === 0 && meta.total > 0

  return (
    <>
      <SavedNotice saved={raw.saved} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h2 id="bookings-title" className="text-2xl font-normal tracking-tight">
          {query.status ? `${STATUS_LABELS[query.status]} bookings` : "Workshop bookings"}
        </h2>
        <p className="text-[13px] text-muted-ink">
          Times shown in {timeZoneCity(workshop.timezone)} time
        </p>
      </div>

      <StatusFilter active={query.status} counts={meta.status_counts} />

      {bookings.length > 0 ? (
        <ul className="mt-8 flex flex-col gap-3">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} timeZone={workshop.timezone} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={outOfRange ? `There is no page ${query.page}` : "No bookings here yet"}
          body={
            outOfRange
              ? `This list only has ${meta.last_page} ${meta.last_page === 1 ? "page" : "pages"}.`
              : query.status
                ? `Nothing is ${query.status} right now.`
                : "Book a caravan into a service bay to get started."
          }
          action={
            outOfRange
              ? { href: bookingsHref({ status: query.status }), label: "Go to the first page" }
              : { href: "/bookings/new", label: "New booking" }
          }
        />
      )}

      <Pagination
        status={query.status}
        page={meta.current_page}
        lastPage={meta.last_page}
        from={meta.from}
        to={meta.to}
        total={meta.total}
      />
    </>
  )
}

function EmptyState({ title, body, action }: { title: string; body: string; action: { href: string; label: string } }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
      <p className="text-lg text-ink">{title}</p>
      <p className="mt-1 text-[15px] text-muted-ink">{body}</p>
      <Link href={action.href} className={buttonVariants({ className: "mt-6" })}>
        {action.label}
      </Link>
    </div>
  )
}
