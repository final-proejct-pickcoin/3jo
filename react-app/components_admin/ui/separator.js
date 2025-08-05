"use client";

import { forwardRef, memo } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

// 공통 스타일
const baseStyles = "shrink-0 bg-border";
const horizontalStyles = "h-[1px] w-full";
const verticalStyles = "h-full w-[1px]";

const Separator = memo(forwardRef(({ 
  className, 
  orientation = "horizontal", 
  decorative = true, 
  ...props 
}, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      baseStyles,
      orientation === "horizontal" ? horizontalStyles : verticalStyles,
      className
    )}
    {...props}
  />
)));
export { Separator };