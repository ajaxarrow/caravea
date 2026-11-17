import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ink text-white hover:bg-ink-soft",
        outline: "border-line bg-surface text-ink hover:border-line-strong",
        ghost: "text-ink hover:bg-accent",
        destructive: "border-line bg-surface text-danger hover:border-danger/40 hover:bg-danger/5",
        link: "rounded-none px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-1.5",
        sm: "h-8 gap-1.5 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-1",
        lg: "h-12 gap-2.5 px-6 text-[15px] has-data-[icon=inline-end]:pr-2",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" data-variant={variant} className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

/**
 * The circular badge that sits at the end of a pill button, as in the
 * reference's "View details" buttons.
 */
function ButtonIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-icon="inline-end"
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full bg-white/12 [&_svg]:size-3.5",
        "group-data-[variant=outline]/button:bg-ink group-data-[variant=outline]/button:text-white",
        className,
      )}
      {...props}
    />
  )
}

export { Button, ButtonIcon, buttonVariants }
