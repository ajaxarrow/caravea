/**
 * Cache tags shared by the cached reads (queries.ts) and the mutations that
 * invalidate them (actions.ts). Kept narrow on purpose: editing one booking
 * expires the list and that booking's detail page, not every detail page.
 */
export const tags = {
  list: "bookings:list",
  booking: (id: number) => `bookings:${id}`,
  workshop: "workshop",
} as const

/**
 * Bookings are live operational data that several staff edit. Our own
 * writes are visible immediately (actions call updateTag); this lifetime
 * only bounds how long a change made *elsewhere* can take to appear.
 * Staleness can't cause a double booking — the API re-checks every write.
 */
export const BOOKINGS_CACHE_LIFE = { stale: 30, revalidate: 30, expire: 300 }
