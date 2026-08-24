import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      // min-height in `lh` so the box is a number of text lines rather
      // than a flat 128px — it then tracks the font size instead of
      // shrinking to four cramped lines as the type scale grows.
      "flex min-h-[6lh] w-full rounded-2xl border border-border bg-white px-5 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
