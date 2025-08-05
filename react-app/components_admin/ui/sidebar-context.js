import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SIDEBAR_CONSTANTS } from "./sidebar-styles";

const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

// 개별 훅들로 분리하여 성능 최적화
export function useSidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return toggleSidebar;
}

export function useSidebarState() {
  const { state, open } = useSidebar();
  return { state, open };
}

export function useSidebarMobile() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  return { isMobile, openMobile, setOpenMobile };
}

// 메인 상태 관리 훅
export function useSidebarCore(defaultOpen, openProp, setOpenProp) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);
  const [_open, _setOpen] = useState(defaultOpen);
  
  const open = openProp ?? _open;
  
  const setOpen = useCallback(value => {
    const openState = typeof value === "function" ? value(open) : value;
    if (setOpenProp) {
      setOpenProp(openState);
    } else {
      _setOpen(openState);
    }
    document.cookie = `${SIDEBAR_CONSTANTS.COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_CONSTANTS.COOKIE_MAX_AGE}`;
  }, [setOpenProp, open]);

  const toggleSidebar = useCallback(() => {
    return isMobile ? setOpenMobile(open => !open) : setOpen(open => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  const state = useMemo(() => open ? "expanded" : "collapsed", [open]);

  return {
    isMobile,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    toggleSidebar,
    state
  };
}

// 키보드 단축키 훅 (분리하여 필요한 곳에서만 사용)
export function useSidebarKeyboard(toggleSidebar) {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === SIDEBAR_CONSTANTS.KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
}

// 레거시 호환성을 위한 통합 훅
export function useSidebarState(defaultOpen, openProp, setOpenProp) {
  return useSidebarCore(defaultOpen, openProp, setOpenProp);
}

export { SidebarContext };
