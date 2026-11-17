import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function BookingNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <div className="border-line bg-surface flex flex-col items-center rounded-3xl border px-6 py-16 text-center">
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
    </main>
  )
}
