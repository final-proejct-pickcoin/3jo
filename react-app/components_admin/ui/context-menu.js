import { forwardRef, memo } from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTEXT_MENU_STYLES } from "./context-menu-styles";

// 기본 컴포넌트들
const ContextMenu = ContextMenuPrimitive.Root;
const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
const ContextMenuGroup = ContextMenuPrimitive.Group;
const ContextMenuPortal = ContextMenuPrimitive.Portal;
const ContextMenuSub = ContextMenuPrimitive.Sub;
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

// 메모화된 SubTrigger 컴포넌트
const ContextMenuSubTrigger = memo(forwardRef(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      CONTEXT_MENU_STYLES.subTrigger,
      inset && CONTEXT_MENU_STYLES.inset,
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className={CONTEXT_MENU_STYLES.chevronIcon} />
  </ContextMenuPrimitive.SubTrigger>
)));
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

// 메모화된 SubContent 컴포넌트
const ContextMenuSubContent = memo(forwardRef(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(CONTEXT_MENU_STYLES.subContent, className)}
    {...props}
  />
)));
ContextMenuSubContent.displayName = "ContextMenuSubContent";

// 메모화된 Content 컴포넌트
const ContextMenuContent = memo(forwardRef(({ className, ...props }, ref) => (
  <ContextMenuPortal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(CONTEXT_MENU_STYLES.content, className)}
      {...props}
    />
  </ContextMenuPortal>
)));
ContextMenuContent.displayName = "ContextMenuContent";

// 메모화된 Item 컴포넌트
const ContextMenuItem = memo(forwardRef(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      CONTEXT_MENU_STYLES.item,
      inset && CONTEXT_MENU_STYLES.inset,
      className
    )}
    {...props}
  />
)));
ContextMenuItem.displayName = "ContextMenuItem";

// 메모화된 CheckboxItem 컴포넌트
const ContextMenuCheckboxItem = memo(forwardRef(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(CONTEXT_MENU_STYLES.checkboxItem, className)}
    checked={checked}
    {...props}
  >
    <span className={CONTEXT_MENU_STYLES.indicator}>
      <ContextMenuPrimitive.ItemIndicator>
        <Check className={CONTEXT_MENU_STYLES.checkIcon} />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
)));
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

// 메모화된 RadioItem 컴포넌트
const ContextMenuRadioItem = memo(forwardRef(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(CONTEXT_MENU_STYLES.radioItem, className)}
    {...props}
  >
    <span className={CONTEXT_MENU_STYLES.indicator}>
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className={CONTEXT_MENU_STYLES.radioIcon} />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
)));
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

// 메모화된 Label 컴포넌트
const ContextMenuLabel = memo(forwardRef(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      CONTEXT_MENU_STYLES.label,
      inset && CONTEXT_MENU_STYLES.inset,
      className
    )}
    {...props}
  />
)));
ContextMenuLabel.displayName = "ContextMenuLabel";

// 메모화된 Separator 컴포넌트
const ContextMenuSeparator = memo(forwardRef(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn(CONTEXT_MENU_STYLES.separator, className)}
    {...props}
  />
)));
ContextMenuSeparator.displayName = "ContextMenuSeparator";

// 메모화된 Shortcut 컴포넌트
const ContextMenuShortcut = memo(({ className, ...props }) => (
  <span className={cn(CONTEXT_MENU_STYLES.shortcut, className)} {...props} />
));
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
