import { cn } from "cn"

import { bookingsHref } from "@/lib/bookings/search-params"
import type { BookingStatus, StatusCounts } from "@/lib/bookings/types"

import { ListLink } from "./list-navigation"

const OPTIONS: { status: BookingStatus | null; label: string }[] = [
  { status: null, label: "All bookings" },
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "cancelled", label: "Cancelled" },
]

/**
 * The counts are the filter. Each figure links to the list filtered by that
 * status, so the URL alone describes what is on screen.
 */
export function StatusFilter({ active, counts }: { active: BookingStatus | null; counts: StatusCounts }) {
  return (
    <nav aria-label="Filter by status" className="border-line grid grid-cols-2 border-y sm:grid-cols-4">
      {OPTIONS.map(({ status, label }, i) => {
        const isActive = status === active
        return (
          <ListLink
            key={label}
            href={bookingsHref({ status })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group focus-visible:ring-ink relative flex flex-col gap-1 px-5 py-6 transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none sm:py-8",
              i > 0 && "sm:border-line sm:border-l",
              i % 2 === 1 && "border-line border-l",
              i > 1 && "border-line border-t sm:border-t-0",
            )}
          >
            <span
              className={cn(
                "display tabular text-[44px] transition-colors sm:text-[56px]",
                isActive ? "text-ink" : "text-ink/30 group-hover:text-ink/60",
              )}
            >
              {counts[status ?? "all"]}
            </span>
            <span className={cn("text-[13px]", isActive ? "text-ink" : "text-muted-ink")}>{label}</span>
            {isActive && <span aria-hidden className="bg-ink absolute inset-x-5 -bottom-px h-0.5" />}
          </ListLink>
        )
      })}
    </nav>
  )
}
