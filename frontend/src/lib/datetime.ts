/**
 * Booking times travel as UTC ISO strings and are always shown in the
 * workshop's timezone, never the viewer's browser timezone — a dealer in
 * Melbourne checking from Perth still needs to see Melbourne times.
 */

function parts(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const values = new Intl.DateTimeFormat("en-AU", { timeZone, ...options })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {})
  return values
}

/** "9:00am" */
export function formatTime(iso: string, timeZone: string): string {
  const p = parts(iso, timeZone, { hour: "numeric", minute: "2-digit", hour12: true })
  return `${p.hour}:${p.minute}${p.dayPeriod.toLowerCase()}`
}

/** "Wed 6 Mar" */
export function formatDate(iso: string, timeZone: string): string {
  const p = parts(iso, timeZone, { weekday: "short", day: "numeric", month: "short" })
  return `${p.weekday} ${p.day} ${p.month}`
}

/** "Wednesday 6 March 2030" */
export function formatLongDate(iso: string, timeZone: string): string {
  const p = parts(iso, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`
}

/** "2h 30m", "45m", "1d 2h" */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return mins > 0 ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${hours}h`
  return `${mins}m`
}

/**
 * Value for an `<input type="datetime-local">`, in workshop time:
 * "2030-03-06T09:00". The API interprets it in the same timezone.
 */
export function toDateTimeLocal(iso: string, timeZone: string): string {
  const p = parts(iso, timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Short zone name in effect at a given instant, e.g. "AEDT" or "AEST". */
export function timeZoneName(timeZone: string, atIso: string): string {
  return parts(atIso, timeZone, { timeZoneName: "short" }).timeZoneName
}

/** "Australia/Melbourne" → "Melbourne". Stable across DST, unlike "AEDT". */
export function timeZoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ")
}
