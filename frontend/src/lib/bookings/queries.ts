import "server-only"

import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"

import { api, NotFoundError } from "@/lib/api"

import { tags } from "./cache"
import type { BookingsQuery } from "./search-params"
import type { Booking, BookingPage, Workshop } from "./types"

const PER_PAGE = 10

/** Always fresh: bookings change under several staff at once (see cache.ts). */
export async function getBookings({ status, page }: BookingsQuery): Promise<BookingPage> {
  const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
  if (status) params.set("status", status)

  return api<BookingPage>(`/bookings?${params}`)
}

/**
 * Always fresh, but deduplicated within one render: the detail page's
 * metadata and body both ask for the same booking and share one request.
 * Returns null when the booking doesn't exist.
 */
export const getBooking = cache(async (id: string): Promise<Booking | null> => {
  try {
    const { data } = await api<{ data: Booking }>(`/bookings/${id}`)
    return data
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
})

/** Bays and timezone change rarely; cache for hours. */
export async function getWorkshop(): Promise<Workshop> {
  "use cache"
  cacheTag(tags.workshop)
  cacheLife("hours")

  const { data } = await api<{ data: Workshop }>("/workshop")
  return data
}
