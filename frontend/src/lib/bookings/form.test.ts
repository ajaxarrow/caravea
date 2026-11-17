import { describe, expect, it } from "vitest"

import { mapValidationErrors, readBookingForm, toApiPayload } from "./form"

function formData(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe("readBookingForm", () => {
  it("reads and trims every booking field", () => {
    const values = readBookingForm(
      formData({
        customer_name: "  Jane Citizen ",
        customer_email: "jane@example.com",
        rego: "abc 123",
        service_bay: "2",
        starts_at: "2030-03-06T09:00",
        ends_at: "2030-03-06T11:00",
        status: "confirmed",
        notes: "",
        $ACTION_ID_abc: "ignored",
      }),
    )

    expect(values).toEqual({
      customer_name: "Jane Citizen",
      customer_email: "jane@example.com",
      rego: "abc 123",
      service_bay: "2",
      starts_at: "2030-03-06T09:00",
      ends_at: "2030-03-06T11:00",
      status: "confirmed",
      notes: "",
    })
  })

  it("fills missing fields with empty strings", () => {
    expect(readBookingForm(formData({})).customer_name).toBe("")
  })
})

describe("toApiPayload", () => {
  const values = {
    customer_name: "Jane",
    customer_email: "jane@example.com",
    rego: "ABC123",
    service_bay: "3",
    starts_at: "2030-03-06T09:00",
    ends_at: "2030-03-06T11:00",
    status: "",
    notes: "",
  }

  it("sends the bay as a number, blank notes as null and defaults status", () => {
    expect(toApiPayload(values)).toMatchObject({ service_bay: 3, notes: null, status: "pending" })
  })

  it("passes wall-clock times through untouched for Laravel to interpret", () => {
    expect(toApiPayload(values)).toMatchObject({ starts_at: "2030-03-06T09:00", ends_at: "2030-03-06T11:00" })
  })

  it("leaves a non-numeric bay as-is so the API can reject it", () => {
    expect(toApiPayload({ ...values, service_bay: "bay-one" }).service_bay).toBe("bay-one")
  })
})

describe("mapValidationErrors", () => {
  it("puts each Laravel error next to its field, first message only", () => {
    const { fieldErrors, unmatched } = mapValidationErrors({
      service_bay: ["Bay 1 is already booked 9:00am – 11:00am on Wed 6 Mar.", "second"],
      ends_at: ["The end time must be after the start time."],
    })

    expect(fieldErrors).toEqual({
      service_bay: "Bay 1 is already booked 9:00am – 11:00am on Wed 6 Mar.",
      ends_at: "The end time must be after the start time.",
    })
    expect(unmatched).toEqual([])
  })

  it("never drops errors for fields the form doesn't render", () => {
    expect(mapValidationErrors({ company_id: ["Not allowed."] }).unmatched).toEqual(["Not allowed."])
  })
})
