import { describe, expect, it } from "vitest"

import { bookingsHref, parseBookingId, parseBookingsQuery } from "./search-params"

describe("parseBookingsQuery", () => {
  it("reads status and page from the URL", () => {
    expect(parseBookingsQuery({ status: "confirmed", page: "2" })).toEqual({ status: "confirmed", page: 2 })
  })

  it("defaults to all statuses, page 1", () => {
    expect(parseBookingsQuery({})).toEqual({ status: null, page: 1 })
  })

  it.each([
    ["unknown status", { status: "finished" }],
    ["status in the wrong case", { status: "CONFIRMED" }],
  ])("ignores an %s", (_, params) => {
    expect(parseBookingsQuery(params).status).toBeNull()
  })

  it.each(["0", "-3", "1.5", "abc", "", "99999999999999999999"])("falls back to page 1 for %j", (page) => {
    expect(parseBookingsQuery({ page }).page).toBe(1)
  })

  it("uses the first value when a param is repeated", () => {
    expect(parseBookingsQuery({ status: ["pending", "confirmed"], page: ["3", "4"] })).toEqual({
      status: "pending",
      page: 3,
    })
  })
})

describe("bookingsHref", () => {
  it("omits defaults", () => {
    expect(bookingsHref()).toBe("/bookings")
    expect(bookingsHref({ status: null, page: 1 })).toBe("/bookings")
  })

  it("keeps the filter when paging", () => {
    expect(bookingsHref({ status: "pending", page: 3 })).toBe("/bookings?status=pending&page=3")
  })

  it("round-trips through the parser", () => {
    const query = { status: "cancelled" as const, page: 4 }
    const url = new URL(bookingsHref(query), "http://x")
    expect(parseBookingsQuery(Object.fromEntries(url.searchParams))).toEqual(query)
  })
})

describe("parseBookingId", () => {
  it("accepts positive integers", () => {
    expect(parseBookingId("42")).toBe(42)
  })

  it.each(["0", "-1", "1.5", "abc", "1e3", " 7", "", "1234567890123456"])("rejects %j", (raw) => {
    expect(parseBookingId(raw)).toBeNull()
  })
})
