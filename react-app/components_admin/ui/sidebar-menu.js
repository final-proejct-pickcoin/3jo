import { forwardRef, memo, useMemo } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components_admin/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components_admin/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { SIDEBAR_STYLES, COMPLEX_STYLES, MENU_BUTTON_BASE } from "./sidebar-styles";

export const SidebarMenu = memo(forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn(SIDEBAR_STYLES.menu, className)}
    {...props}
  />
)));

export const SidebarMenuItem = memo(forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn(SIDEBAR_STYLES.menuItem, className)}
    {...props}
  />
)));

export const sidebarMenuButtonVariants = cva(MENU_BUTTON_BASE, {
  variants: {
    variant: {
      default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
    },
    size: {
      default: "h-8 text-sm",
      sm: "h-7 text-xs",
      lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default"
  }
});

export const SidebarMenuButton = memo(forwardRef(({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  
  const button = (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = { children: tooltip };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}));

export const SidebarMenuAction = memo(forwardRef(({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button";
  
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        COMPLEX_STYLES.menuAction,
        showOnHover && "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  );
}));

export const SidebarMenuBadge = memo(forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(COMPLEX_STYLES.menuBadge, className)}
    {...props}
  />
)));

export const SidebarMenuSkeleton = memo(forwardRef(({
  className,
  showIcon = false,
  ...props
}, ref) => {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, []);
  
  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn(COMPLEX_STYLES.menuSkeleton, className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={{ "--skeleton-width": width }}
      />
    </div>
  );
}));

export const SidebarMenuSub = memo(forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(COMPLEX_STYLES.menuSub, className)}
    {...props}
  />
)));

export const SidebarMenuSubItem = memo(forwardRef((props, ref) => (
  <li ref={ref} {...props} />
)));

export const SidebarMenuSubButton = memo(forwardRef(({
  asChild = false,
  size = "md",
  isActive,
  className,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "a";
  
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        COMPLEX_STYLES.menuSubButton,
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        className
      )}
      {...props}
    />
  );
}));
