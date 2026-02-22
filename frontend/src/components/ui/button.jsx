import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground shadow-[0_10px_24px_-16px_rgba(154,66,8,0.8)] hover:bg-primary/92 hover:shadow-[0_14px_28px_-16px_rgba(154,66,8,0.9)]",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    outline: "border border-input bg-background/95 hover:bg-accent hover:text-accent-foreground shadow-[0_8px_18px_-14px_rgba(32,23,15,0.45)]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-sm",
    ghost: "hover:bg-accent/85 hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-10 w-10",
  },
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-[0.925rem] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 [&_svg]:shrink-0 [&_svg]:stroke-[2.05]",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
