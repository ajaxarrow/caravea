import type { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"

import { BackBar } from "@/components/back-bar"
import { BookingForm } from "@/components/bookings/booking-form"
import { BookingFormSkeleton } from "@/components/bookings/form-skeleton"
import { createBooking } from "@/lib/bookings/actions"
import { getWorkshop } from "@/lib/bookings/queries"
import { timeZoneCity } from "@/lib/datetime"

export const metadata: Metadata = {
  title: "New booking",
}

const EMPTY = {
  customer_name: "",
  customer_email: "",
  rego: "",
  service_bay: "",
  starts_at: "",
  ends_at: "",
  status: "pending",
  notes: "",
}

export default function NewBookingPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
      <BackBar href="/bookings" label="Back to bookings" />
      <h1 className="display mb-8 text-[40px] sm:text-[52px]">New booking</h1>
      <Suspense fallback={<BookingFormSkeleton />}>
        <NewBookingForm />
      </Suspense>
    </main>
  )
}

async function NewBookingForm() {
  // Render at request time: bays come from the API, which needn't be
  // reachable during `next build`. getWorkshop() is still cached for hours.
  await connection()
  const workshop = await getWorkshop()

  return (
    <BookingForm
      mode="create"
      action={createBooking}
      initialValues={EMPTY}
      bays={workshop.service_bays}
      timeZoneCity={timeZoneCity(workshop.timezone)}
      cancelHref="/bookings"
    />
  )
}
