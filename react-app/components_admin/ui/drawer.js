"use client";

import { forwardRef, memo } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

// 스타일 상수
const DRAWER_STYLES = {
  overlay: "fixed inset-0 z-50 bg-black/80",
  content: "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
  handle: "mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted",
  header: "grid gap-1.5 p-4 text-center sm:text-left",
  footer: "mt-auto flex flex-col gap-2 p-4",
  title: "text-lg font-semibold leading-none tracking-tight",
  description: "text-sm text-muted-foreground"
};

// 메모화된 기본 Drawer 컴포넌트
const Drawer = memo(({ shouldScaleBackground = true, ...props }) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
));
Drawer.displayName = "Drawer";

// 기본 컴포넌트들
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;

// 메모화된 Content 컴포넌트 (Overlay와 Portal 자동 포함)
const DrawerContent = memo(forwardRef(({ className, children, ...props }, ref) => (
  <DrawerPrimitive.Portal>
    <DrawerPrimitive.Overlay className={DRAWER_STYLES.overlay} />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(DRAWER_STYLES.content, className)}
      {...props}
    >
      <div className={DRAWER_STYLES.handle} />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPrimitive.Portal>
)));
DrawerContent.displayName = "DrawerContent";

// 메모화된 Header 컴포넌트
const DrawerHeader = memo(({ className, ...props }) => (
  <div className={cn(DRAWER_STYLES.header, className)} {...props} />
));
DrawerHeader.displayName = "DrawerHeader";

// 메모화된 Footer 컴포넌트
const DrawerFooter = memo(({ className, ...props }) => (
  <div className={cn(DRAWER_STYLES.footer, className)} {...props} />
));
DrawerFooter.displayName = "DrawerFooter";

// 메모화된 Title 컴포넌트
const DrawerTitle = memo(forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(DRAWER_STYLES.title, className)}
    {...props}
  />
)));
DrawerTitle.displayName = "DrawerTitle";

// 메모화된 Description 컴포넌트
const DrawerDescription = memo(forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn(DRAWER_STYLES.description, className)}
    {...props}
  />
)));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
