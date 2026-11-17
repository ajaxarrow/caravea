"use server"

import { updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { api, ApiError, ValidationError } from "@/lib/api"

import { tags } from "./cache"
import { mapValidationErrors, readBookingForm, toApiPayload, type BookingFormState } from "./form"
import { parseBookingId } from "./search-params"
import { isBookingStatus, type Booking, type BookingFormValues, type BookingStatus } from "./types"

/*
 * Server Actions are public HTTP endpoints, whatever page renders them.
 * Every argument is re-validated here. Laravel is still the authority on
 * the data itself — these actions forward its errors rather than duplicate
 * its rules.
 */

export async function createBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const values = readBookingForm(formData)

  let booking: Booking
  try {
    const response = await api<{ data: Booking }>("/bookings", { method: "POST", body: toApiPayload(values) })
    booking = response.data
  } catch (error) {
    return failedState(error, values, _prev)
  }

  updateTag(tags.list)
  redirect(`/bookings/${booking.id}?saved=created`)
}

export async function updateBooking(
  id: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  assertId(id)
  const values = readBookingForm(formData)

  try {
    await api(`/bookings/${id}`, { method: "PUT", body: toApiPayload(values) })
  } catch (error) {
    return failedState(error, values, _prev)
  }

  updateTag(tags.list)
  updateTag(tags.booking(id))
  redirect(`/bookings/${id}?saved=updated`)
}

export type QuickActionResult = { ok: true } | { ok: false; message: string }

/** Confirm / cancel / re-open straight from the list or detail page. */
export async function setBookingStatus(id: string, status: BookingStatus): Promise<QuickActionResult> {
  assertId(id)
  if (!isBookingStatus(status)) return { ok: false, message: "Unknown status." }

  try {
    await api(`/bookings/${id}`, { method: "PATCH", body: { status } })
  } catch (error) {
    return { ok: false, message: messageFor(error) }
  }

  // Re-renders the current route in this same response, so the list
  // reflects the change without a reload.
  updateTag(tags.list)
  updateTag(tags.booking(id))
  return { ok: true }
}

export async function deleteBooking(id: string): Promise<QuickActionResult> {
  assertId(id)

  try {
    await api(`/bookings/${id}`, { method: "DELETE" })
  } catch (error) {
    return { ok: false, message: messageFor(error) }
  }

  updateTag(tags.list)
  updateTag(tags.booking(id))
  redirect("/bookings?saved=deleted")
}

function failedState(error: unknown, values: BookingFormValues, prev: BookingFormState): BookingFormState {
  const attempt = prev.status === "error" ? prev.attempt + 1 : 1

  if (error instanceof ValidationError) {
    const { fieldErrors, unmatched } = mapValidationErrors(error.errors)
    return {
      status: "error",
      message: unmatched[0] ?? "Some details need fixing before this booking can be saved.",
      fieldErrors,
      values,
      attempt,
    }
  }

  return { status: "error", message: messageFor(error), fieldErrors: {}, values, attempt }
}

function messageFor(error: unknown): string {
  if (error instanceof ValidationError) {
    return Object.values(error.errors)[0]?.[0] ?? error.message
  }
  if (error instanceof ApiError && error.status === 404) {
    return "This booking no longer exists."
  }
  // Don't leak internals; the server log has the detail.
  console.error(error)
  return "Something went wrong talking to the bookings service. Please try again."
}

function assertId(id: string): void {
  if (parseBookingId(id) === null) throw new Error("Invalid booking id")
}
