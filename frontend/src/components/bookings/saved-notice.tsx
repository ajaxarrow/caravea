import { CheckIcon } from "@phosphor-icons/react/ssr"

const MESSAGES = {
  created: "Booking created.",
  updated: "Changes saved.",
  deleted: "Booking deleted.",
} as const

export function SavedNotice({ saved }: { saved: string | string[] | undefined }) {
  const key = Array.isArray(saved) ? saved[0] : saved
  if (!key || !(key in MESSAGES)) return null

  return (
    <p
      role="status"
      className="bg-ink animate-in fade-in slide-in-from-top-1 mb-4 inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[13px] text-white"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
        <CheckIcon className="size-3.5" weight="bold" aria-hidden />
      </span>
      {MESSAGES[key as keyof typeof MESSAGES]}
    </p>
  )
}
