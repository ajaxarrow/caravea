"use client"

import { TrashIcon } from "@phosphor-icons/react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { deleteBooking } from "@/lib/bookings/actions"

/** Two-step delete: the first click asks, the second deletes. */
export function DeleteBooking({ bookingId }: { bookingId: number }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <Button variant="ghost" className="w-full text-danger hover:bg-danger/5" onClick={() => setConfirming(true)}>
        <TrashIcon aria-hidden />
        Delete booking
      </Button>
    )
  }

  return (
    <div role="group" aria-label="Confirm delete" className="rounded-2xl border border-danger/30 bg-danger/5 p-4">
      <p className="text-[14px] text-ink">Delete this booking? This can&apos;t be undone. To keep a record, cancel it instead.</p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteBooking(bookingId)
              if (!result.ok) setError(result.message)
            })
          }
        >
          {isPending ? "Deleting…" : "Delete booking"}
        </Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
          Keep it
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
