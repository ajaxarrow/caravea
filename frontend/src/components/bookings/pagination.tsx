import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr"
import { cn } from "cn"
import Link from "next/link"

import { bookingsHref } from "@/lib/bookings/search-params"
import type { BookingStatus } from "@/lib/bookings/types"

/** "2 / 5" with a progress line, as in the reference's step indicator. */
export function Pagination({
  status,
  page,
  lastPage,
  from,
  to,
  total,
}: {
  status: BookingStatus | null
  page: number
  lastPage: number
  from: number | null
  to: number | null
  total: number
}) {
  if (lastPage <= 1) return null

  const progress = Math.min(100, (page / lastPage) * 100)

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center gap-4">
      <PageLink href={page > 1 ? bookingsHref({ status, page: page - 1 }) : null} label="Previous page">
        <CaretLeftIcon className="size-4" aria-hidden />
      </PageLink>

      <div className="flex flex-1 items-center gap-4">
        <span aria-hidden className="bg-line relative h-px flex-1">
          <span className="bg-ink absolute inset-y-0 left-0" style={{ width: `${progress}%` }} />
        </span>
        <p className="tabular text-muted-ink text-[13px]">
          <span aria-hidden>
            <span className="text-ink">{page}</span> / {lastPage}
          </span>
          <span className="sr-only">
            Page {page} of {lastPage}, showing {from}–{to} of {total} bookings
          </span>
        </p>
      </div>

      <PageLink href={page < lastPage ? bookingsHref({ status, page: page + 1 }) : null} label="Next page">
        <CaretRightIcon className="size-4" aria-hidden />
      </PageLink>
    </nav>
  )
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const className = cn(
    "flex size-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors",
    href ? "hover:border-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none" : "opacity-40",
  )

  if (!href) {
    return (
      <span aria-disabled className={className}>
        {children}
        <span className="sr-only">{label}</span>
      </span>
    )
  }

  return (
    <Link href={href} className={className} scroll={false}>
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}
