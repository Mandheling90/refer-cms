import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-base font-normal transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white hover:bg-primary/85 active:bg-primary/70",
        secondary:
          "bg-src-secondary text-white hover:bg-src-secondary/85 active:bg-src-secondary/70",
        point:
          "bg-src-point text-white hover:bg-src-point/85 active:bg-src-point/70",
        destructive:
          "bg-destructive text-white hover:bg-destructive/85 active:bg-destructive/70",
        blue:
          "bg-src-blue text-white hover:bg-src-blue/85 active:bg-src-blue/70",
        dark:
          "bg-src-darken text-src-white hover:bg-src-darken/85 active:bg-src-darken/70",
        outline:
          "border border-src-darken bg-background text-foreground hover:bg-gray-200 active:bg-gray-300",
        "outline-red":
          "border border-src-red bg-background text-src-red hover:bg-gray-200 active:bg-gray-300",
        "outline-blue":
          "border border-src-blue bg-background text-src-blue hover:bg-gray-200 active:bg-gray-300",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 min-w-20 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1 px-3 text-sm has-[>svg]:px-2.5",
        md: "h-10 gap-2 px-4 has-[>svg]:px-3",
        lg: "h-[50px] gap-3 px-6 text-xl font-semibold has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
