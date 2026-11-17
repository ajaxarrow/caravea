"use client"

import { cn } from "cn"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { setBookingStatus } from "@/lib/bookings/actions"
import type { BookingStatus } from "@/lib/bookings/types"

const NEXT_ACTIONS: Record<BookingStatus, { to: BookingStatus; label: string }[]> = {
  pending: [
    { to: "confirmed", label: "Confirm" },
    { to: "cancelled", label: "Cancel" },
  ],
  confirmed: [{ to: "cancelled", label: "Cancel" }],
  cancelled: [{ to: "pending", label: "Reopen" }],
}

/**
 * One-click status changes. The Server Action expires the cache tags and
 * ships the re-rendered list back in the same response, so the row (and the
 * counts above it) update in place without a page reload.
 */
export function QuickStatus({
  bookingId,
  status,
  customerName,
  className,
}: {
  bookingId: number
  status: BookingStatus
  customerName: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function change(to: BookingStatus) {
    setError(null)
    startTransition(async () => {
      const result = await setBookingStatus(bookingId, to)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <div className="flex gap-1.5" aria-busy={isPending}>
        {NEXT_ACTIONS[status].map(({ to, label }) => (
          <Button
            key={to}
            size="sm"
            variant={to === "confirmed" ? "default" : "outline"}
            disabled={isPending}
            onClick={() => change(to)}
            aria-label={`${label} booking for ${customerName}`}
          >
            {label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-danger max-w-64 text-right text-[12px] leading-snug">
          {error}
        </p>
      )}
    </div>
  )
}
