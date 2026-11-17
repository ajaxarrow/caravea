import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink transition-colors outline-none placeholder:text-muted-ink hover:border-line-strong focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/10 [&::-webkit-calendar-picker-indicator]:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
