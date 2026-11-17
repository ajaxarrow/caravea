import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <p className="display text-ink/15 tabular text-[96px]">404</p>
      <h1 className="mt-2 text-2xl font-normal tracking-tight">This page doesn&apos;t exist</h1>
      <p className="text-muted-ink mt-2">Check the address, or head back to the bookings list.</p>
      <Link href="/bookings" className={buttonVariants({ className: "mt-8" })}>
        Back to bookings
      </Link>
    </main>
  )
}
