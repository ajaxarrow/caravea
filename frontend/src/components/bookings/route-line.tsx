import { cn } from "cn"

import { formatDuration, formatTime } from "@/lib/datetime"

/**
 * Start ●──── duration ────● end. The reference's journey line, repurposed
 * for how long a caravan occupies the bay.
 */
export function RouteLine({
  startsAt,
  endsAt,
  timeZone,
  muted = false,
}: {
  startsAt: string
  endsAt: string
  timeZone: string
  muted?: boolean
}) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-3", muted && "opacity-50")}>
      <time dateTime={startsAt} className="tabular text-[15px] text-ink">
        {formatTime(startsAt, timeZone)}
      </time>
      <span className="relative flex items-center">
        <span aria-hidden className="size-2 rounded-full bg-ink" />
        <span aria-hidden className="h-px flex-1 bg-ink/70" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-surface px-2 text-[12px] text-muted-ink">
          <span className="sr-only">Duration </span>
          {formatDuration(startsAt, endsAt)}
        </span>
        <span aria-hidden className="size-2 rounded-full border-[1.5px] border-ink bg-surface" />
      </span>
      <time dateTime={endsAt} className="tabular text-[15px] text-ink">
        {formatTime(endsAt, timeZone)}
      </time>
    </div>
  )
}
