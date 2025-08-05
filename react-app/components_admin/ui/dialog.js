"use client";

import { forwardRef, memo } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// 스타일 상수
const DIALOG_STYLES = {
  overlay: "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  content: "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  closeButton: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
  header: "flex flex-col space-y-1.5 text-center sm:text-left",
  footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
  title: "text-lg font-semibold leading-none tracking-tight",
  description: "text-sm text-muted-foreground",
  closeIcon: "h-4 w-4"
};

// 기본 컴포넌트들
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// 메모화된 Content 컴포넌트 (Overlay 자동 포함)
const DialogContent = memo(forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Overlay className={DIALOG_STYLES.overlay} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(DIALOG_STYLES.content, className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className={DIALOG_STYLES.closeButton}>
        <X className={DIALOG_STYLES.closeIcon} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
)));
DialogContent.displayName = "DialogContent";

// 메모화된 Header 컴포넌트
const DialogHeader = memo(({ className, ...props }) => (
  <div className={cn(DIALOG_STYLES.header, className)} {...props} />
));
DialogHeader.displayName = "DialogHeader";

// 메모화된 Footer 컴포넌트
const DialogFooter = memo(({ className, ...props }) => (
  <div className={cn(DIALOG_STYLES.footer, className)} {...props} />
));
DialogFooter.displayName = "DialogFooter";

// 메모화된 Title 컴포넌트
const DialogTitle = memo(forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(DIALOG_STYLES.title, className)}
    {...props}
  />
)));
DialogTitle.displayName = "DialogTitle";

// 메모화된 Description 컴포넌트
const DialogDescription = memo(forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(DIALOG_STYLES.description, className)}
    {...props}
  />
)));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
