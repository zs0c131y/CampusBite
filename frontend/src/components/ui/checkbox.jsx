import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 align-middle">
      <input
        {...props}
        ref={ref}
        type="checkbox"
        className={cn(
          "peer m-0 h-5 w-5 cursor-pointer appearance-none rounded-md border border-input bg-card transition-colors hover:border-primary checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
      <Check
        size={14}
        strokeWidth={3}
        aria-hidden="true"
        className="pointer-events-none absolute left-[3px] top-[3px] text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
  );
});
