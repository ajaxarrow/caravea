import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-line bg-surface text-ink placeholder:text-muted-ink hover:border-line-strong focus-visible:border-ink focus-visible:ring-ink/10 aria-invalid:border-danger aria-invalid:ring-danger/10 flex field-sizing-content min-h-24 w-full rounded-xl border px-3.5 py-3 text-[15px] transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
