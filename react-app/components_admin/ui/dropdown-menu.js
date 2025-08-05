"use client";

import { forwardRef, memo } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DROPDOWN_MENU_STYLES } from "./dropdown-menu-styles";

// 기본 컴포넌트들
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// 공통 inset 처리 함수
const getInsetClassName = (baseStyle, inset, className) => 
  cn(baseStyle, inset && DROPDOWN_MENU_STYLES.inset, className);

// 메모화된 SubTrigger 컴포넌트
const DropdownMenuSubTrigger = memo(forwardRef(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={getInsetClassName(DROPDOWN_MENU_STYLES.subTrigger, inset, className)}
    {...props}
  >
    {children}
    <ChevronRight className={DROPDOWN_MENU_STYLES.chevronIcon} />
  </DropdownMenuPrimitive.SubTrigger>
)));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

// 메모화된 SubContent 컴포넌트
const DropdownMenuSubContent = memo(forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(DROPDOWN_MENU_STYLES.subContent, className)}
    {...props}
  />
)));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// 메모화된 Content 컴포넌트 (Portal 자동 포함)
const DropdownMenuContent = memo(forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(DROPDOWN_MENU_STYLES.content, className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
)));
DropdownMenuContent.displayName = "DropdownMenuContent";

// 메모화된 Item 컴포넌트
const DropdownMenuItem = memo(forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={getInsetClassName(DROPDOWN_MENU_STYLES.item, inset, className)}
    {...props}
  />
)));
DropdownMenuItem.displayName = "DropdownMenuItem";

// 공통 인디케이터 아이템 컴포넌트
const IndicatorItem = memo(({ Primitive, className, children, icon: Icon, iconClassName, ...props }, ref) => (
  <Primitive ref={ref} className={cn(className)} {...props}>
    <span className={DROPDOWN_MENU_STYLES.indicator}>
      <DropdownMenuPrimitive.ItemIndicator>
        <Icon className={iconClassName} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </Primitive>
));

// 메모화된 CheckboxItem 컴포넌트
const DropdownMenuCheckboxItem = memo(forwardRef(({ className, children, checked, ...props }, ref) => (
  <IndicatorItem
    ref={ref}
    Primitive={DropdownMenuPrimitive.CheckboxItem}
    className={cn(DROPDOWN_MENU_STYLES.checkboxItem, className)}
    checked={checked}
    icon={Check}
    iconClassName={DROPDOWN_MENU_STYLES.checkIcon}
    {...props}
  >
    {children}
  </IndicatorItem>
)));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// 메모화된 RadioItem 컴포넌트
const DropdownMenuRadioItem = memo(forwardRef(({ className, children, ...props }, ref) => (
  <IndicatorItem
    ref={ref}
    Primitive={DropdownMenuPrimitive.RadioItem}
    className={cn(DROPDOWN_MENU_STYLES.radioItem, className)}
    icon={Circle}
    iconClassName={DROPDOWN_MENU_STYLES.radioIcon}
    {...props}
  >
    {children}
  </IndicatorItem>
)));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// 메모화된 Label 컴포넌트
const DropdownMenuLabel = memo(forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={getInsetClassName(DROPDOWN_MENU_STYLES.label, inset, className)}
    {...props}
  />
)));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// 메모화된 Separator 컴포넌트
const DropdownMenuSeparator = memo(forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(DROPDOWN_MENU_STYLES.separator, className)}
    {...props}
  />
)));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// 메모화된 Shortcut 컴포넌트
const DropdownMenuShortcut = memo(({ className, ...props }) => (
  <span className={cn(DROPDOWN_MENU_STYLES.shortcut, className)} {...props} />
));
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
