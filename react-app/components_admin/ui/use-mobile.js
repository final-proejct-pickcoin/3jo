import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    mql.addEventListener("change", checkMobile);
    checkMobile(); // 초기값 설정
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  return isMobile;
}