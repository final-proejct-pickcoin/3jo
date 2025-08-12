"use client";
import React, { useEffect, useState } from "react";
import './globals.css';
import { useRouter } from "next/navigation";
// import { cookies } from "next/headers";

export default function RootLayout({children}) {

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  function isTokenExpired(token) {
    try {
      const [payloadBase64] = token.split('.');
      const payload = JSON.parse(atob(payloadBase64));
      const exp = payload.exp;
      return Date.now() >= exp * 1000;
    } catch (e) {
      return true; // 파싱 실패 시 만료된 것으로 간주
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const sub = localStorage.getItem("sub");

    if (token && sub && !isTokenExpired(token)) {
      setAuthenticated(true);
    }else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("sub");
      router.replace("/admin");  // 로그인 안됐으면 login 페이지로 리디렉션
    }
    setReady(true);
  }, []);
  
  return <>{children}</>

}

