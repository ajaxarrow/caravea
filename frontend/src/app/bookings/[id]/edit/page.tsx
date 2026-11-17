import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { BackBar } from "@/components/back-bar"
import { BookingForm } from "@/components/bookings/booking-form"
import { BookingFormSkeleton } from "@/components/bookings/form-skeleton"
import { updateBooking } from "@/lib/bookings/actions"
import { getBooking, getWorkshop } from "@/lib/bookings/queries"
import { parseBookingId } from "@/lib/bookings/search-params"
import { timeZoneCity, toDateTimeLocal } from "@/lib/datetime"

export const metadata: Metadata = {
  title: "Edit booking",
}

export default function EditBookingPage({ params }: PageProps<"/bookings/[id]/edit">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
      <Suspense
        fallback={
          <>
            <BackBar href="/bookings" label="Back to bookings" />
            <h1 className="display mb-8 text-[40px] sm:text-[52px]">Edit booking</h1>
            <BookingFormSkeleton />
          </>
        }
      >
        <EditBooking params={params} />
      </Suspense>
    </main>
  )
}

async function EditBooking({ params }: Pick<PageProps<"/bookings/[id]/edit">, "params">) {
  const id = parseBookingId((await params).id)
  if (!id) notFound()

  const [booking, workshop] = await Promise.all([getBooking(id), getWorkshop()])
  if (!booking) notFound()

  const tz = workshop.timezone

  return (
    <>
      <BackBar href={`/bookings/${id}`} label="Back to booking" trailing={`#${id}`} />
      <h1 className="display mb-8 text-[40px] sm:text-[52px]">Edit booking</h1>
      <BookingForm
        mode="edit"
        action={updateBooking.bind(null, id)}
        initialValues={{
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          rego: booking.rego,
          service_bay: String(booking.service_bay.id),
          starts_at: toDateTimeLocal(booking.starts_at, tz),
          ends_at: toDateTimeLocal(booking.ends_at, tz),
          status: booking.status,
          notes: booking.notes ?? "",
        }}
        bays={workshop.service_bays}
        timeZoneCity={timeZoneCity(tz)}
        cancelHref={`/bookings/${id}`}
      />
    </>
  )
}
