// Sidebar 스타일 상수 정의
export const SIDEBAR_CONSTANTS = {
  COOKIE_NAME: "sidebar:state",
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7,
  WIDTH: "16rem",
  WIDTH_MOBILE: "18rem", 
  WIDTH_ICON: "3rem",
  KEYBOARD_SHORTCUT: "b"
};

// 기본 스타일 상수
export const SIDEBAR_STYLES = {
  base: "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
  trigger: "h-7 w-7",
  input: "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
  headerFooter: "flex flex-col gap-2 p-2",
  separator: "mx-2 w-auto bg-sidebar-border",
  content: "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
  group: "relative flex w-full min-w-0 flex-col p-2",
  menu: "flex w-full min-w-0 flex-col gap-1",
  menuItem: "group/menu-item relative"
};

// 복합 스타일 (배열로 정의된 것들)
export const COMPLEX_STYLES = {
  groupLabel: [
    "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70",
    "outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
    "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0"
  ].join(" "),
  
  groupAction: [
    "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground",
    "outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    "focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 after:absolute after:-inset-2 after:md:hidden",
    "group-data-[collapsible=icon]:hidden"
  ].join(" "),
  
  menuSub: [
    "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
    "group-data-[collapsible=icon]:hidden"
  ].join(" "),
  
  menuSubButton: [
    "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground",
    "outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
    "active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4",
    "[&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent",
    "data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
  ].join(" "),
  
  menuAction: [
    "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0",
    "text-sidebar-foreground outline-none ring-sidebar-ring transition-transform",
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
    "peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
    "after:absolute after:-inset-2 after:md:hidden group-data-[collapsible=icon]:hidden"
  ].join(" "),
  
  menuActionSizeVariants: {
    sm: "peer-data-[size=sm]/menu-button:top-1",
    default: "peer-data-[size=default]/menu-button:top-1.5",
    lg: "peer-data-[size=lg]/menu-button:top-2.5"
  },
  
  rail: [
    "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px]",
    "hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
    "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
    "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
    "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
    "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
    "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2"
  ].join(" "),
  
  menuBadge: [
    "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums",
    "text-sidebar-foreground select-none pointer-events-none",
    "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
    "peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5",
    "group-data-[collapsible=icon]:hidden"
  ].join(" "),
  
  menuSkeleton: "rounded-md h-8 flex gap-2 px-2 items-center"
};

// CVA variants (Class Variance Authority를 위한 복잡한 variants)
export const MENU_BUTTON_BASE = [
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none",
  "ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  "focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none",
  "disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none",
  "aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium",
  "data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent",
  "data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8",
  "group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0"
].join(" ");
