import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr"
import { cn } from "cn"
import Link from "next/link"

import { CaravanIcon } from "@/components/caravan-icon"
import type { Booking } from "@/lib/bookings/types"
import { formatDate } from "@/lib/datetime"

import { QuickStatus } from "./quick-status"
import { RouteLine } from "./route-line"
import { StatusBadge } from "./status-badge"

export function BookingRow({ booking, timeZone }: { booking: Booking; timeZone: string }) {
  const cancelled = booking.status === "cancelled"

  return (
    <li className="group border-line bg-surface hover:border-line-strong relative grid grid-cols-1 gap-5 rounded-3xl border p-5 transition-colors md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_auto] md:items-center md:gap-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_22rem]">
      <div className="flex min-w-0 items-center gap-4">
        <span className="bg-canvas text-ink flex size-12 shrink-0 items-center justify-center rounded-2xl">
          <CaravanIcon className="size-7" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/bookings/${booking.id}`}
            className="text-ink focus-visible:after:ring-ink block truncate text-[16px] after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2"
          >
            {booking.customer_name}
          </Link>
          <p className="text-muted-ink mt-0.5 flex items-center gap-2 text-[13px]">
            <span className="border-line text-ink-soft rounded-md border px-1.5 py-px font-medium tracking-wide">
              {booking.rego}
            </span>
            <span className="truncate">{booking.service_bay.name}</span>
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn("text-muted-ink mb-2 text-[13px]", cancelled && "line-through")}>
          {formatDate(booking.starts_at, timeZone)}
        </p>
        <RouteLine startsAt={booking.starts_at} endsAt={booking.ends_at} timeZone={timeZone} muted={cancelled} />
      </div>

      {/* Sits above the row-wide link so the buttons stay clickable. */}
      <div className="relative z-10 flex items-center justify-between gap-3 md:justify-end">
        <StatusBadge status={booking.status} />
        <QuickStatus bookingId={booking.id} status={booking.status} customerName={booking.customer_name} />
        <span
          aria-hidden
          className="border-line text-ink group-hover:border-ink group-hover:bg-ink hidden size-9 items-center justify-center rounded-full border transition-colors group-hover:text-white lg:flex"
        >
          <ArrowUpRightIcon className="size-4" />
        </span>
      </div>
    </li>
  )
}
