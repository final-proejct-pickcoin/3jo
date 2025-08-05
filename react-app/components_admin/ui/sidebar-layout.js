import { forwardRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components_admin/ui/input";
import { Separator } from "@/components_admin/ui/separator";
import { SIDEBAR_STYLES } from "./sidebar-styles";

export const SidebarInput = memo(forwardRef(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    data-sidebar="input"
    className={cn(SIDEBAR_STYLES.input, className)}
    {...props}
  />
)));

export const SidebarHeader = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn(SIDEBAR_STYLES.headerFooter, className)}
    {...props}
  />
)));

export const SidebarFooter = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn(SIDEBAR_STYLES.headerFooter, className)}
    {...props}
  />
)));

export const SidebarSeparator = memo(forwardRef(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    data-sidebar="separator"
    className={cn(SIDEBAR_STYLES.separator, className)}
    {...props}
  />
)));

export const SidebarContent = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn(SIDEBAR_STYLES.content, className)}
    {...props}
  />
)));

export const SidebarInset = memo(forwardRef(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "relative flex min-h-svh flex-1 flex-col bg-background",
      "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
      className
    )}
    {...props}
  />
)));
