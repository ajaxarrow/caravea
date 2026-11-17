import type { SVGProps } from "react"

/**
 * Side-on caravan, drawn on Phosphor's 256 grid with its "regular" stroke
 * weight so it sits naturally next to Phosphor icons. Phosphor has no
 * caravan glyph.
 */
export function CaravanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M200 176h-96M64 176H40a16 16 0 0 1-16-16V80a24 24 0 0 1 24-24h128a24 24 0 0 1 24 24v96" />
      <circle cx="84" cy="180" r="20" />
      <rect x="56" y="88" width="64" height="40" rx="8" />
      <path d="M152 176V96a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v80" />
      <path d="M200 160h24l16 16" />
    </svg>
  )
}
