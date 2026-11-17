import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

/**
 * Rendered directly (not via `notFound()`) when a booking id is malformed
 * or unknown. These pages stream, so `notFound()` would only ever abort the
 * streamed component mid-render — which also trips React's dev profiler
 * ("Performance.measure … cannot be negative"). Returning the UI gives the
 * same result, and React hoists the robots meta into <head>.
 */
export function BookingNotFound() {
  return (
    <div className="border-line bg-surface flex flex-col items-center rounded-3xl border px-6 py-16 text-center">
      <meta name="robots" content="noindex" />
      <span className="bg-canvas text-ink flex size-12 items-center justify-center rounded-full">
        <MagnifyingGlassIcon className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-normal tracking-tight">Booking not found</h1>
      <p className="text-muted-ink mt-2 max-w-md text-[15px]">
        There&apos;s no booking at this address. It may have been deleted, or the link is wrong.
      </p>
      <div className="mt-8 flex gap-2">
        <Link href="/bookings" className={buttonVariants()}>
          Back to bookings
        </Link>
        <Link href="/bookings/new" className={buttonVariants({ variant: "outline" })}>
          New booking
        </Link>
      </div>
    </div>
  )
}
