import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      // Height comes from padding + line-height rather than a flat 56px,
      // so the control grows with its text instead of clipping it.
      "flex w-full rounded-2xl border border-border bg-white px-5 py-4 text-base leading-6 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
