"use client"

import { ArrowClockwiseIcon, WarningIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect } from "react"

import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Covers the list, detail, edit and new-booking pages. Server errors arrive with a
 * generic message in production, so we don't echo it; the digest ties the
 * screen to the server log entry.
 */
export default function BookingsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 sm:px-6">
      <div
        role="alert"
        className="border-line bg-surface mt-4 flex flex-col items-center rounded-3xl border px-6 py-16 text-center"
      >
        <span className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-full">
          <WarningIcon className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-normal tracking-tight">Something went wrong loading this page</h1>
        <p className="text-muted-ink mt-2 max-w-md text-[15px]">
          The bookings service may be unavailable. Try again, or go back to the bookings list.
        </p>
        <div className="mt-8 flex gap-2">
          <Button onClick={() => retry()}>
            <ArrowClockwiseIcon aria-hidden />
            Try again
          </Button>
          <Link href="/bookings" className={buttonVariants({ variant: "outline" })}>
            Back to bookings
          </Link>
        </div>
        {digest && <p className="text-muted-ink mt-6 text-[12px]">Reference {digest}</p>}
      </div>
    </main>
  )
}
