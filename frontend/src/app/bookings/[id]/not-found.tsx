import { BookingNotFound } from "@/components/bookings/booking-not-found"

/** Fallback for any `notFound()` raised elsewhere in this segment. */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <BookingNotFound />
    </main>
  )
}
