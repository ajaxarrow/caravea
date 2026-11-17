import { EnvelopeSimpleIcon, NoteIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr"
import { cn } from "cn"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { BackBar } from "@/components/back-bar"
import { DeleteBooking } from "@/components/bookings/delete-booking"
import { QuickStatus } from "@/components/bookings/quick-status"
import { SavedNotice } from "@/components/bookings/saved-notice"
import { BookingDetailSkeleton } from "@/components/bookings/skeletons"
import { STATUS_LABELS, StatusDot } from "@/components/bookings/status-badge"
import { CaravanIcon } from "@/components/caravan-icon"
import { buttonVariants } from "@/components/ui/button"
import { getBooking, getWorkshop } from "@/lib/bookings/queries"
import { parseBookingId } from "@/lib/bookings/search-params"
import type { Booking } from "@/lib/bookings/types"
import { formatDate, formatDuration, formatLongDate, formatTime, timeZoneName } from "@/lib/datetime"

export async function generateMetadata({ params }: PageProps<"/bookings/[id]">): Promise<Metadata> {
  const id = parseBookingId((await params).id)
  const booking = id ? await getBooking(id) : null
  return { title: booking ? `${booking.rego} for ${booking.customer_name}` : "Booking not found" }
}

export default function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <BackBar href="/bookings" label="Back to bookings" />
      <Suspense fallback={<BookingDetailSkeleton />}>
        <BookingDetail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function BookingDetail({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const id = parseBookingId((await params).id)
  if (!id) notFound()

  const [booking, workshop, { saved }] = await Promise.all([getBooking(id), getWorkshop(), searchParams])
  if (!booking) notFound()

  const tz = workshop.timezone
  const cancelled = booking.status === "cancelled"

  return (
    <>
      <SavedNotice saved={saved} />
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Booking card */}
        <article aria-labelledby="booking-title" className="border-line bg-surface rounded-3xl border p-5 sm:p-7">
          <header className="flex items-center gap-4">
            <span className="bg-canvas text-ink flex size-14 shrink-0 items-center justify-center rounded-2xl">
              <CaravanIcon className="size-8" />
            </span>
            <div className="min-w-0">
              <h1 id="booking-title" className="text-ink truncate text-[22px] tracking-tight">
                {booking.customer_name}
              </h1>
              <p className="text-muted-ink mt-0.5 text-[13px]">
                Registration <span className="text-ink-soft font-medium tracking-wide">{booking.rego}</span>
              </p>
            </div>
          </header>

          <Timeline booking={booking} timeZone={tz} />

          <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Service bay">{booking.service_bay.name}</Tile>
            <Tile label="Time in bay">{formatDuration(booking.starts_at, booking.ends_at)}</Tile>
            <Tile label="Status">
              <span className="inline-flex items-center gap-2">
                <StatusDot status={booking.status} />
                {STATUS_LABELS[booking.status]}
              </span>
            </Tile>
          </dl>

          <div className="border-line mt-6 border-t pt-6">
            <h2 className="text-muted-ink flex items-center gap-2 text-[13px]">
              <NoteIcon className="size-4" aria-hidden />
              Notes for the workshop
            </h2>
            <p className={cn("mt-2 text-[15px] whitespace-pre-line", booking.notes ? "text-ink" : "text-muted-ink")}>
              {booking.notes ?? "No notes added."}
            </p>
          </div>
        </article>

        {/* Summary panel */}
        <aside
          aria-label="Booking summary"
          className="border-line bg-surface flex flex-col rounded-3xl border p-5 sm:p-7"
        >
          <p className="text-muted-ink text-[13px]">{formatLongDate(booking.starts_at, tz)}</p>
          <p
            className={cn(
              "display text-ink tabular mt-2 text-[64px] sm:text-[80px]",
              cancelled && "text-ink/30 line-through decoration-2",
            )}
          >
            {formatTime(booking.starts_at, tz)}
          </p>
          <p className="text-muted-ink text-[13px]">
            Drop-off, {booking.service_bay.name}. Times in {timeZoneName(tz, booking.starts_at)}.
          </p>

          <dl className="border-line mt-8 space-y-3 border-t pt-6 text-[14px]">
            <Row label="Customer email">
              <a
                href={`mailto:${booking.customer_email}`}
                className="text-ink inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <EnvelopeSimpleIcon className="size-4" aria-hidden />
                {booking.customer_email}
              </a>
            </Row>
            <Row label="Reference">
              <span className="text-ink-soft tabular text-[12px] break-all">{booking.id}</span>
            </Row>
            <Row label="Booked">{formatDate(booking.created_at, tz)}</Row>
            <Row label="Last changed">
              {formatDate(booking.updated_at, tz)}, {formatTime(booking.updated_at, tz)}
            </Row>
          </dl>

          <div className="mt-auto space-y-3 pt-8">
            <Link href={`/bookings/${booking.id}/edit`} className={buttonVariants({ size: "lg", className: "w-full" })}>
              <PencilSimpleIcon aria-hidden />
              Edit booking
            </Link>
            <QuickStatus
              bookingId={booking.id}
              status={booking.status}
              customerName={booking.customer_name}
              className="items-stretch [&_p]:text-left [&>div]:grid [&>div]:auto-cols-fr [&>div]:grid-flow-col"
            />
            <DeleteBooking bookingId={booking.id} />
          </div>
        </aside>
      </div>
    </>
  )
}

function Timeline({ booking, timeZone }: { booking: Booking; timeZone: string }) {
  const stops = [
    { label: "Drop-off", at: booking.starts_at, filled: true },
    { label: "Ready for pick-up", at: booking.ends_at, filled: false },
  ]

  return (
    <ol className="border-line relative mt-7 space-y-6 border-t pt-7">
      <span aria-hidden className="bg-ink absolute top-[calc(1.75rem+0.6rem)] bottom-[0.6rem] left-[4.5px] w-px" />
      {stops.map((stop) => (
        <li key={stop.label} className="relative grid grid-cols-[auto_1fr_auto] items-start gap-4">
          <span
            aria-hidden
            className={cn(
              "border-ink mt-1.5 size-2.5 rounded-full border-[1.5px]",
              stop.filled ? "bg-ink" : "bg-surface",
            )}
          />
          <div>
            <p className="text-ink text-[16px]">{stop.label}</p>
            <p className="text-muted-ink text-[13px]">
              {formatDate(stop.at, timeZone)}, {booking.service_bay.name}
            </p>
          </div>
          <time dateTime={stop.at} className="tabular text-ink text-[18px]">
            {formatTime(stop.at, timeZone)}
          </time>
        </li>
      ))}
    </ol>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-line rounded-2xl border px-4 py-3">
      <dt className="text-muted-ink text-[12px]">{label}</dt>
      <dd className="text-ink mt-1 text-[15px]">{children}</dd>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <dt className="text-muted-ink">{label}</dt>
      <dd className="text-ink text-right">{children}</dd>
    </div>
  )
}
