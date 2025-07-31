"use client";
import React, { useEffect, useState } from "react";
import './globals.css';
import { useRouter } from "next/navigation";
// import { cookies } from "next/headers";

export default function RootLayout({children}) {

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const sub = localStorage.getItem("sub");

    if (token && sub) {
      setAuthenticated(true);
    }else {
      router.replace("/admin");  // 로그인 안됐으면 login 페이지로 리디렉션
    }
    setReady(true);
  }, []);

  
  
  return <>{children}</>
  

}

