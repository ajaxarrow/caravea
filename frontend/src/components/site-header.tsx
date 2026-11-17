import { CheckCircleIcon, ClockIcon, ListBulletsIcon, PlusIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { bookingsHref } from "@/lib/bookings/search-params"

const shortcuts = [
  { href: bookingsHref(), label: "All bookings", Icon: ListBulletsIcon },
  { href: bookingsHref({ status: "pending" }), label: "Pending bookings", Icon: ClockIcon },
  { href: bookingsHref({ status: "confirmed" }), label: "Confirmed bookings", Icon: CheckCircleIcon },
]

export function SiteHeader() {
  return (
    <header className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
      <Link href="/bookings" className="text-ink justify-self-start text-[17px] font-semibold tracking-[-0.03em]">
        Caravea
        <span className="sr-only"> workshop bookings</span>
      </Link>

      <nav
        aria-label="Bookings"
        className="bg-surface hidden items-center gap-1 rounded-full p-1 shadow-[0_1px_2px_rgba(35,35,35,0.06)] md:flex"
      >
        {shortcuts.map(({ href, label, Icon }, i) => (
          <span key={href} className="flex items-center">
            {i > 0 && <span aria-hidden className="bg-line mx-1 h-4 w-px" />}
            <Link
              href={href}
              title={label}
              className="text-ink-soft hover:bg-accent hover:text-ink focus-visible:ring-ink flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon className="size-4" aria-hidden />
              <span className="sr-only">{label}</span>
            </Link>
          </span>
        ))}
        <span aria-hidden className="bg-line mx-1 h-4 w-px" />
        <Link
          href="/bookings/new"
          title="New booking"
          className="bg-ink hover:bg-ink-soft focus-visible:ring-ink flex size-8 items-center justify-center rounded-full text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <PlusIcon className="size-4" weight="bold" aria-hidden />
          <span className="sr-only">New booking</span>
        </Link>
      </nav>

      <Link
        href="/bookings/new"
        className={buttonVariants({ variant: "outline", size: "sm", className: "justify-self-end" })}
      >
        New booking
      </Link>
    </header>
  )
}
