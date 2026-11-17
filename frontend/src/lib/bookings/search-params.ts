import { isBookingStatus, type BookingStatus } from "./types"

export type BookingsQuery = {
  status: BookingStatus | null
  page: number
}

type RawSearchParams = Record<string, string | string[] | undefined>

/**
 * The URL is the source of truth for the list's filter and page.
 * Anything malformed falls back to the default rather than erroring, so a
 * hand-edited or stale link still lands somewhere useful.
 */
export function parseBookingsQuery(searchParams: RawSearchParams): BookingsQuery {
  const status = first(searchParams.status)
  const page = Number(first(searchParams.page))

  return {
    status: isBookingStatus(status) ? status : null,
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  }
}

/** Builds a canonical list URL, omitting defaults (`/bookings`, not `/bookings?page=1`). */
export function bookingsHref({ status = null, page = 1 }: Partial<BookingsQuery> = {}): string {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (page > 1) params.set("page", String(page))

  const qs = params.toString()
  return qs ? `/bookings?${qs}` : "/bookings"
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Route param (or Server Action argument) → booking id, or null for anything
 * that isn't a UUID. Rejecting junk here means it never reaches the API.
 */
export function parseBookingId(raw: unknown): string | null {
  return typeof raw === "string" && UUID.test(raw) ? raw.toLowerCase() : null
}
