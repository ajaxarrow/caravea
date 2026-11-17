import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { api, NotFoundError } from "@/lib/api"

import { BOOKINGS_CACHE_LIFE, tags } from "./cache"
import type { BookingsQuery } from "./search-params"
import type { Booking, BookingPage, Workshop } from "./types"

const PER_PAGE = 10

export async function getBookings({ status, page }: BookingsQuery): Promise<BookingPage> {
  "use cache"
  cacheTag(tags.list)
  cacheLife(BOOKINGS_CACHE_LIFE)

  const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
  if (status) params.set("status", status)

  return api<BookingPage>(`/bookings?${params}`)
}

/** Returns null when the booking doesn't exist, so the page can call notFound(). */
export async function getBooking(id: number): Promise<Booking | null> {
  "use cache"
  cacheTag(tags.booking(id))
  cacheLife(BOOKINGS_CACHE_LIFE)

  try {
    const { data } = await api<{ data: Booking }>(`/bookings/${id}`)
    return data
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
}

/** Bays and timezone change rarely; cache for hours. */
export async function getWorkshop(): Promise<Workshop> {
  "use cache"
  cacheTag(tags.workshop)
  cacheLife("hours")

  const { data } = await api<{ data: Workshop }>("/workshop")
  return data
}
