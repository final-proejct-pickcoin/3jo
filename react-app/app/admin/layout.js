"use client";
import React, { useEffect, useState } from "react";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { useRouter } from "next/navigation";
import { AuthProvider } from "../../context/AuthContext";
// export const metadata = {
//   title: 'pickCoin',
//   description: 'Created with v0',
//   generator: 'v0.dev'
// };
export default function RootLayout({
  children
}) {

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");
  useEffect(() => {
    
    // console.log("토큰:", token);
    if (!token) {
      router.replace("/admin");
    } else {
      setLoading(false);
    }
  }, [router]);

  
  if (loading) return <div>Loading...</div>;
  if (!token) return null; // redirect 중이므로 아무것도 안 보여줌

//   return /*#__PURE__*/React.createElement("html", {
//     lang: "en"
//   }, /*#__PURE__*/React.createElement("head", null, /*#__PURE__*/React.createElement("style", null, `
// html {
//   font-family: ${GeistSans.style.fontFamily};
//   --font-sans: ${GeistSans.variable};
//   --font-mono: ${GeistMono.variable};
// }
//         `)), /*#__PURE__*/React.createElement("body", null, children));
  return <>{children}</>;
}