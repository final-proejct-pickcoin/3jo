"use client"
import { useEffect } from "react"

export default function KakaoScript() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://developers.kakao.com/sdk/js/kakao.min.js"
    script.async = true
    script.onload = () => {
      console.log("✅ Kakao SDK loaded")
      window.Kakao.init("4ab1a21ffcd635a59a5a72c3f1c37903") // 여기에 JS 키
      console.log("Kakao Initialized?", window.Kakao.isInitialized()) // true 나오면 정상
    }
    document.body.appendChild(script)
  }, [])

  return null
}