import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    outline: "border border-input bg-transparent hover:bg-secondary hover:text-secondary-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-sm",
    ghost: "hover:bg-accent/85 hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
  },
  size: {
    default: "h-11 px-4 py-2",
    sm: "h-9 px-3 text-xs",
    lg: "h-12 px-6 text-sm",
    icon: "h-11 w-11",
  },
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-[0.925rem] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:stroke-[2.05]",
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
