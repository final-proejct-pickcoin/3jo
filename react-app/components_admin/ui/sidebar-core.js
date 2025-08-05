import { forwardRef, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components_admin/ui/sheet";
import { TooltipProvider } from "@/components_admin/ui/tooltip";
import { SidebarContext, useSidebar, useSidebarCore, useSidebarKeyboard } from "./sidebar-context";
import { SIDEBAR_CONSTANTS, SIDEBAR_STYLES } from "./sidebar-styles";

// Provider 컴포넌트
export const SidebarProvider = memo(forwardRef(({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}, ref) => {
  const sidebarState = useSidebarCore(defaultOpen, openProp, setOpenProp);
  useSidebarKeyboard(sidebarState.toggleSidebar);
  
  const contextValue = useMemo(() => sidebarState, [sidebarState]);

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={{
            "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH,
            "--sidebar-width-icon": SIDEBAR_CONSTANTS.WIDTH_ICON,
            ...style
          }}
          className={cn("group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}));

// 모바일 사이드바 컴포넌트
const MobileSidebar = memo(({ openMobile, setOpenMobile, side, children, ...props }) => (
  <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
    <SheetContent
      data-sidebar="sidebar"
      data-mobile="true"
      className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
      style={{ "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH_MOBILE }}
      side={side}
    >
      <div className="flex h-full w-full flex-col">
        {children}
      </div>
    </SheetContent>
  </Sheet>
));

// 데스크톱 사이드바 컴포넌트
const DesktopSidebar = memo(({ state, collapsible, variant, side, className, children, ...props }) => {
  const sidebarStyles = useMemo(() => ({
    outer: cn(
      "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
      "group-data-[collapsible=offcanvas]:w-0",
      "group-data-[side=right]:rotate-180",
      variant === "floating" || variant === "inset"
        ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
        : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
    ),
    inner: cn(
      "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
      side === "left"
        ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
        : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
      variant === "floating" || variant === "inset"
        ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
        : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
      className
    )
  }), [side, variant, className]);

  return (
    <div
      className="group peer hidden md:block text-sidebar-foreground"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      <div className={sidebarStyles.outer} />
      <div className={sidebarStyles.inner} {...props}>
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
        >
          {children}
        </div>
      </div>
    </div>
  );
});

// 메인 Sidebar 컴포넌트
export const Sidebar = memo(forwardRef(({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <div
        className={cn(SIDEBAR_STYLES.base, className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileSidebar 
        openMobile={openMobile} 
        setOpenMobile={setOpenMobile} 
        side={side} 
        {...props}
      >
        {children}
      </MobileSidebar>
    );
  }

  return (
    <DesktopSidebar
      ref={ref}
      state={state}
      collapsible={collapsible}
      variant={variant}
      side={side}
      className={className}
      {...props}
    >
      {children}
    </DesktopSidebar>
  );
}));
