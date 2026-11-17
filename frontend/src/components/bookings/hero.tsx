import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

/**
 * Dusk-on-the-highway panel, after the reference's photographic hero. Drawn
 * in CSS + SVG so there is no image to load; it is static and lives in the
 * prerendered shell, so it paints before any booking data arrives.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-[28px] bg-[#7d7f92] px-6 pt-16 pb-28 text-center sm:pt-20 sm:pb-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 78%, #f2b56b 0%, rgba(232,150,102,0.85) 22%, rgba(178,128,135,0.55) 48%, rgba(125,127,146,0) 75%), linear-gradient(180deg, #6c7389 0%, #9a8c98 52%, #d39a78 78%, #3b3436 100%)",
        }}
      />
      <svg
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-[46%] w-full"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
      >
        <path
          d="M0 92 C 160 60 300 74 430 88 S 720 70 860 82 S 1100 64 1200 80 V220 H0Z"
          fill="#5d5059"
          opacity="0.55"
        />
        <path d="M0 124 C 220 104 380 116 560 118 S 940 100 1200 116 V220 H0Z" fill="#3a3236" />
        <path d="M540 118 L660 118 L1020 220 L180 220Z" fill="#2b2629" />
        <path d="M600 122 L600 220" stroke="#e9c79b" strokeWidth="3" strokeDasharray="10 14" opacity="0.7" />
      </svg>

      <h1 id="hero-title" className="display mx-auto max-w-[14ch] text-[44px] text-white sm:text-[64px]">
        Every bay, on&nbsp;schedule
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15px] text-white/80">
        Book customers&apos; caravans into your service bays and keep the workshop day running on time.
      </p>

      <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
        <Link
          href="/bookings/new"
          className="group bg-surface flex w-full max-w-md items-center gap-4 rounded-full py-2 pr-2 pl-6 text-left shadow-[0_8px_30px_rgba(20,16,18,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a3236] focus-visible:outline-none"
        >
          <span className="flex-1">
            <span className="text-muted-ink block text-[12px]">New booking</span>
            <span className="text-ink block text-[15px]">Pick a bay and a time</span>
          </span>
          <span aria-hidden className="bg-line h-8 w-px" />
          <span className="hidden flex-1 sm:block">
            <span className="text-muted-ink block text-[12px]">Overlaps</span>
            <span className="text-ink block text-[15px]">Checked for you</span>
          </span>
          <span className="bg-ink group-hover:bg-ink-soft flex size-11 items-center justify-center rounded-full text-white transition-colors">
            <ArrowUpRightIcon className="size-4" weight="bold" aria-hidden />
          </span>
        </Link>
      </div>
    </section>
  )
}
