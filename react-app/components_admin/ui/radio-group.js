"use client";

import { forwardRef, memo } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// 공통 스타일
const radioItemStyles = [
  "aspect-square h-4 w-4 rounded-full border border-primary text-primary",
  "ring-offset-background focus:outline-none focus-visible:ring-2",
  "focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50"
].join(" ");

const circleIconClass = "h-2.5 w-2.5 fill-current text-current";

const RadioGroup = memo(forwardRef(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    className={cn("grid gap-2", className)}
    ref={ref}
    {...props}
  />
)));

const RadioGroupItem = memo(forwardRef(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(radioItemStyles, className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <Circle className={circleIconClass} />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
)));
export { RadioGroup, RadioGroupItem };