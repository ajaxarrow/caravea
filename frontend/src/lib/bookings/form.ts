import { BOOKING_FIELDS, type BookingField, type BookingFormValues } from "./types"

export type FieldErrors = Partial<Record<BookingField, string>>

export type BookingFormState =
  | { status: "idle" }
  | {
      status: "error"
      /** Shown above the form: a summary, or an error not tied to a field. */
      message: string
      fieldErrors: FieldErrors
      /** Echoed back so the form can re-render with what the user typed. */
      values: BookingFormValues
      /** Changes on every failed submit; used to remount the form. */
      attempt: number
    }

export const IDLE: BookingFormState = { status: "idle" }

export function readBookingForm(formData: FormData): BookingFormValues {
  return Object.fromEntries(
    BOOKING_FIELDS.map((field) => {
      const value = formData.get(field)
      return [field, typeof value === "string" ? value.trim() : ""]
    }),
  ) as BookingFormValues
}

/** JSON body for the Laravel API. Blank optional fields are sent as null. */
export function toApiPayload(values: BookingFormValues): Record<string, string | number | null> {
  return {
    customer_name: values.customer_name,
    customer_email: values.customer_email,
    rego: values.rego,
    service_bay: /^\d+$/.test(values.service_bay) ? Number(values.service_bay) : values.service_bay,
    starts_at: values.starts_at,
    ends_at: values.ends_at,
    status: values.status || "pending",
    notes: values.notes === "" ? null : values.notes,
  }
}

/**
 * Laravel returns `{ errors: { field: [messages] } }`. Map each to the form
 * field it belongs to; anything we don't render a field for goes into the
 * general message so it is never silently dropped.
 */
export function mapValidationErrors(errors: Record<string, string[]>): {
  fieldErrors: FieldErrors
  unmatched: string[]
} {
  const fieldErrors: FieldErrors = {}
  const unmatched: string[] = []

  for (const [key, messages] of Object.entries(errors)) {
    const message = messages[0]
    if (!message) continue

    if ((BOOKING_FIELDS as readonly string[]).includes(key)) {
      fieldErrors[key as BookingField] = message
    } else {
      unmatched.push(message)
    }
  }

  return { fieldErrors, unmatched }
}
