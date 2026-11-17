import { cn } from "cn"

import type { BookingStatus } from "@/lib/bookings/types"

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
}

const DOT: Record<BookingStatus, string> = {
  pending: "bg-status-pending",
  confirmed: "bg-status-confirmed",
  cancelled: "bg-status-cancelled",
}

export function StatusDot({ status, className }: { status: BookingStatus; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", DOT[status], className)} />
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "border-line bg-surface text-ink inline-flex h-7 items-center gap-2 rounded-full border px-3 text-[13px]",
        status === "cancelled" && "text-muted-ink",
        className,
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  )
}
