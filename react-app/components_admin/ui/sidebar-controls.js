import { forwardRef, memo } from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components_admin/ui/button";
import { useSidebar } from "./sidebar-context";
import { SIDEBAR_STYLES, COMPLEX_STYLES } from "./sidebar-styles";

// Trigger 컴포넌트
export const SidebarTrigger = memo(forwardRef(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn(SIDEBAR_STYLES.trigger, className)}
      onClick={event => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}));

// Rail 컴포넌트
export const SidebarRail = memo(forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  
  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(COMPLEX_STYLES.rail, className)}
      {...props}
    />
  );
}));

// Group 컴포넌트들
export const SidebarGroup = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group"
    className={cn(SIDEBAR_STYLES.group, className)}
    {...props}
  />
)));

export const SidebarGroupLabel = memo(forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(COMPLEX_STYLES.groupLabel, className)}
      {...props}
    />
  );
}));

export const SidebarGroupAction = memo(forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(COMPLEX_STYLES.groupAction, className)}
      {...props}
    />
  );
}));

export const SidebarGroupContent = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
)));
