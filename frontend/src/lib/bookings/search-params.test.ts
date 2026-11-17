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
  it("accepts a UUID and normalises it to lower case", () => {
    expect(parseBookingId("0194F3A2-7C1E-7B2A-9C4D-1A2B3C4D5E6F")).toBe("0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6f")
  })

  it.each([
    "42",
    "abc",
    "",
    "0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6", // one char short
    "0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6fz",
    "0194f3a27c1e7b2a9c4d1a2b3c4d5e6f", // no dashes
    "../0194f3a2-7c1e-7b2a-9c4d-1a2b3c4d5e6f",
  ])("rejects %j", (raw) => {
    expect(parseBookingId(raw)).toBeNull()
  })

  it("rejects non-strings (Server Action arguments are untrusted)", () => {
    expect(parseBookingId(42)).toBeNull()
    expect(parseBookingId(null)).toBeNull()
  })
})
