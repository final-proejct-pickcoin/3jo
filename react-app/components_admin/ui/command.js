"use client";

import { forwardRef, memo, useCallback } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components_admin/ui/dialog";
import { COMMAND_STYLES } from "./command-styles";

// 메모화된 기본 Command 컴포넌트
const Command = memo(forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(COMMAND_STYLES.root, className)}
    {...props}
  />
)));
Command.displayName = "Command";

// 메모화된 Command Dialog 컴포넌트
const CommandDialog = memo(({ children, ...props }) => {
  const renderDialogContent = useCallback(() => (
    <DialogContent className={COMMAND_STYLES.dialog}>
      <Command className={COMMAND_STYLES.dialogCommand}>
        {children}
      </Command>
    </DialogContent>
  ), [children]);

  return (
    <Dialog {...props}>
      {renderDialogContent()}
    </Dialog>
  );
});
CommandDialog.displayName = "CommandDialog";

// 메모화된 Command Input 컴포넌트
const CommandInput = memo(forwardRef(({ className, ...props }, ref) => (
  <div className={COMMAND_STYLES.inputWrapper} cmdk-input-wrapper="">
    <Search className={COMMAND_STYLES.searchIcon} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(COMMAND_STYLES.input, className)}
      {...props}
    />
  </div>
)));
CommandInput.displayName = "CommandInput";

// 메모화된 Command List 컴포넌트
const CommandList = memo(forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(COMMAND_STYLES.list, className)}
    {...props}
  />
)));
CommandList.displayName = "CommandList";

// 메모화된 Command Empty 컴포넌트
const CommandEmpty = memo(forwardRef((props, ref) => (
  <CommandPrimitive.Empty 
    ref={ref} 
    className={COMMAND_STYLES.empty} 
    {...props} 
  />
)));
CommandEmpty.displayName = "CommandEmpty";

// 메모화된 Command Group 컴포넌트
const CommandGroup = memo(forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(COMMAND_STYLES.group, className)}
    {...props}
  />
)));
CommandGroup.displayName = "CommandGroup";

// 메모화된 Command Separator 컴포넌트
const CommandSeparator = memo(forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(COMMAND_STYLES.separator, className)}
    {...props}
  />
)));
CommandSeparator.displayName = "CommandSeparator";

// 메모화된 Command Item 컴포넌트
const CommandItem = memo(forwardRef(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(COMMAND_STYLES.item, className)}
    {...props}
  />
)));
CommandItem.displayName = "CommandItem";

// 메모화된 Command Shortcut 컴포넌트
const CommandShortcut = memo(({ className, ...props }) => (
  <span className={cn(COMMAND_STYLES.shortcut, className)} {...props} />
));
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
