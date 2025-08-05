"use client";

import { memo } from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

// 공통 스타일
const panelGroupStyles = "flex h-full w-full data-[panel-group-direction=vertical]:flex-col";
const handleStyles = [
  "relative flex w-px items-center justify-center bg-border",
  "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
  "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
  "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1",
  "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
  "data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90"
].join(" ");
const gripStyles = "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border";
const iconClass = "h-2.5 w-2.5";

const ResizablePanelGroup = memo(({ className, ...props }) => (
  <ResizablePrimitive.PanelGroup
    className={cn(panelGroupStyles, className)}
    {...props}
  />
));

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = memo(({ withHandle, className, ...props }) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(handleStyles, className)}
    {...props}
  >
    {withHandle && (
      <div className={gripStyles}>
        <GripVertical className={iconClass} />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
));
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };