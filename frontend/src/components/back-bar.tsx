import { ArrowLeftIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

/** "← Back to bookings ──────── #12", as in the reference's step header. */
export function BackBar({ href, label, trailing }: { href: string; label: string; trailing?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <Link
        href={href}
        className="text-ink hover:text-ink-soft focus-visible:ring-ink inline-flex items-center gap-2 rounded-full py-1 pr-2 text-[14px] focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {label}
      </Link>
      <span aria-hidden className="bg-ink/70 h-px flex-1" />
      {trailing && <span className="tabular text-muted-ink text-[13px]">{trailing}</span>}
    </div>
  )
}
