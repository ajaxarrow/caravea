import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-ink transition-colors outline-none placeholder:text-muted-ink hover:border-line-strong focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/10",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
