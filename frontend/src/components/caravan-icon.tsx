import type { SVGProps } from "react"

/**
 * Side-on caravan, drawn on Phosphor's 256 grid with its "regular" stroke
 * weight so it sits naturally next to Phosphor icons. Phosphor has no
 * caravan glyph.
 */
export function CaravanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M196 176H112M60 176H44a20 20 0 0 1-20-20V84a28 28 0 0 1 28-28h116a28 28 0 0 1 28 28v92" />
      <circle cx="86" cy="180" r="22" />
      <rect x="60" y="92" width="72" height="40" rx="10" />
      <path d="M196 164h44" />
    </svg>
  )
}
