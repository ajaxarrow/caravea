import * as React from "react"
import { cn } from "cn"
import { CaretDownIcon } from "@phosphor-icons/react/ssr"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-full has-[select:disabled]:opacity-50", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="border-line bg-surface text-ink hover:border-line-strong focus-visible:border-ink focus-visible:ring-ink/10 aria-invalid:border-danger aria-invalid:ring-danger/10 h-11 w-full min-w-0 appearance-none rounded-xl border pr-10 pl-3.5 text-[15px] transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed aria-invalid:ring-2"
        {...props}
      />
      <CaretDownIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option data-slot="native-select-option" className={cn("bg-[Canvas] text-[CanvasText]", className)} {...props} />
  )
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
