"use client";

import { forwardRef, memo } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// 스타일 상수
const CHECKBOX_STYLES = {
  root: "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  indicator: "flex items-center justify-center text-current",
  icon: "h-4 w-4"
};

const Checkbox = memo(forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(CHECKBOX_STYLES.root, className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={CHECKBOX_STYLES.indicator}>
      <Check className={CHECKBOX_STYLES.icon} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)));

Checkbox.displayName = "Checkbox";

export { Checkbox };
