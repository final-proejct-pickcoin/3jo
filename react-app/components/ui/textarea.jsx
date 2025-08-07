
import * as React from "react"

import { cn } from "@/lib/utils"

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder",
      className,
    )}
    ref={ref}
    {...props}
  />
))
