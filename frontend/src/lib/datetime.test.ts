import { describe, expect, it } from "vitest"

import {
  formatDate,
  formatDuration,
  formatLongDate,
  formatTime,
  timeZoneCity,
  timeZoneName,
  toDateTimeLocal,
} from "./datetime"

const MELBOURNE = "Australia/Melbourne"

describe("workshop-time formatting", () => {
  // 22:00 UTC on 5 March = 9:00am on Wed 6 March in Melbourne (AEDT, UTC+11).
  const iso = "2030-03-05T22:00:00Z"

  it("formats in the workshop timezone, not the machine's", () => {
    expect(formatTime(iso, MELBOURNE)).toBe("9:00am")
    expect(formatDate(iso, MELBOURNE)).toBe("Wed 6 Mar")
    expect(formatLongDate(iso, MELBOURNE)).toBe("Wednesday 6 March 2030")
  })

  it("handles afternoon times", () => {
    expect(formatTime("2030-03-06T04:30:00Z", MELBOURNE)).toBe("3:30pm")
  })

  it("respects daylight saving", () => {
    // July is AEST (UTC+10): 23:00 UTC is 9am, not 10am.
    expect(formatTime("2030-07-01T23:00:00Z", MELBOURNE)).toBe("9:00am")
    expect(timeZoneName(MELBOURNE, "2030-07-01T00:00:00Z")).toBe("AEST")
    expect(timeZoneName(MELBOURNE, "2030-01-01T00:00:00Z")).toBe("AEDT")
  })
})

describe("toDateTimeLocal", () => {
  it("produces a datetime-local value in workshop time", () => {
    expect(toDateTimeLocal("2030-03-05T22:00:00Z", MELBOURNE)).toBe("2030-03-06T09:00")
  })

  it("uses a 24-hour clock, including midnight", () => {
    expect(toDateTimeLocal("2030-03-05T13:00:00Z", MELBOURNE)).toBe("2030-03-06T00:00")
    expect(toDateTimeLocal("2030-03-06T06:45:00Z", MELBOURNE)).toBe("2030-03-06T17:45")
  })
})

describe("formatDuration", () => {
  it.each([
    ["2030-03-06T09:00:00Z", "2030-03-06T11:00:00Z", "2h"],
    ["2030-03-06T09:00:00Z", "2030-03-06T11:30:00Z", "2h 30m"],
    ["2030-03-06T09:00:00Z", "2030-03-06T09:05:00Z", "5m"],
    ["2030-03-06T09:00:00Z", "2030-03-07T11:00:00Z", "1d 2h"],
    ["2030-03-06T09:00:00Z", "2030-03-08T09:00:00Z", "2d"],
  ])("%s → %s is %s", (start, end, expected) => {
    expect(formatDuration(start, end)).toBe(expected)
  })
})

describe("timeZoneCity", () => {
  it.each([
    ["Australia/Melbourne", "Melbourne"],
    ["America/Los_Angeles", "Los Angeles"],
    ["UTC", "UTC"],
  ])("%s → %s", (tz, city) => {
    expect(timeZoneCity(tz)).toBe(city)
  })
})
