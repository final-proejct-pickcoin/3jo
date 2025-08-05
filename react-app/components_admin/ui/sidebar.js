"use client";

// CSS 파일 import (성능 최적화)
import "./sidebar.css";

// 분리된 모듈들 import (Tree-shaking 최적화)
import { useSidebar } from "./sidebar-context";
import { Sidebar, SidebarProvider } from "./sidebar-core";
import {
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarInset
} from "./sidebar-layout";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "./sidebar-menu";
import {
  SidebarTrigger,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent
} from "./sidebar-controls";

// 모든 컴포넌트와 훅을 export (Tree-shaking 지원)
export {
  // Core Components
  Sidebar,
  SidebarProvider,
  
  // Layout Components
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarSeparator,
  
  // Group Components
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  
  // Menu Components
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  
  // Control Components
  SidebarRail,
  SidebarTrigger,
  
  // Hooks
  useSidebar
};