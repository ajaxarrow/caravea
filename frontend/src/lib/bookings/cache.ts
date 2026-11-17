/**
 * What Next.js caches, and why so little.
 *
 * Bookings are NOT cached in Next. They're live data that several staff edit,
 * and the Laravel query behind them is indexed and cheap. They were first
 * cached with tags and expired with updateTag(), but the e2e suite caught
 * Next 16.4 serving a list from before a write: its tag manifest is stamped
 * by two clocks (performance.now() and Date.now()), and when those drift
 * apart an "expired" tag looks like it expires in the future. For live
 * operational data, reading fresh is the honest choice.
 *
 * The workshop's bays and timezone change rarely and are needed on every
 * page, so they are cached for hours under one tag.
 */
export const tags = {
  workshop: "workshop",
} as const
