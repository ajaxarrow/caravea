"use client"

import { cn } from "cn"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createContext, use, useTransition, type ComponentProps } from "react"

/*
 * Filter and pagination links change only the URL's search params, so Next
 * keeps the current list on screen until the next one is ready, with no
 * sign anything is happening. These links run that navigation in a
 * transition instead, and the wrapper dims the current list and announces
 * "Loading bookings" while it's pending — no layout jump back to a skeleton.
 */

const NavigateContext = createContext<((href: string) => void) | null>(null)

export function ListNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }))

  return (
    <NavigateContext value={navigate}>
      <div aria-busy={pending} className="relative">
        {pending && (
          <div
            role="status"
            aria-label="Loading bookings"
            className="absolute inset-x-0 -top-px z-20 h-0.5 overflow-hidden"
          >
            <span className="bg-ink block h-full w-1/3 animate-[list-progress_1s_ease-in-out_infinite]" />
          </div>
        )}
        <div className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50")}>
          {children}
        </div>
      </div>
    </NavigateContext>
  )
}

/** A `<Link>` that reports its pending state to the surrounding list. */
export function ListLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const navigate = use(NavigateContext)

  return (
    <Link
      href={href}
      scroll={false}
      onClick={(event) => {
        onClick?.(event)
        // Leave new-tab / modified clicks to the browser.
        if (
          !navigate ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        navigate(href)
      }}
      {...props}
    />
  )
}
