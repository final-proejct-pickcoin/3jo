"use client"

import { createContext, useContext, useState, useEffect } from "react"

// JWT 파서 유틸 함수
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
}


const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState(null)

  // Google SDK 로드
  useEffect(() => {
    const loadGoogleSDK = async () => {
      if (!window.google?.accounts?.id) {
        await new Promise((resolve) => {
          const s = document.createElement("script")
          s.src = "https://accounts.google.com/gsi/client"
          s.async = true
          s.defer = true
          s.onload = resolve
          document.head.appendChild(s)
        })
      }
      console.log("✅ Google SDK Loaded")
    }
    loadGoogleSDK()

    // 로그인 상태 복원
    const token = sessionStorage.getItem("auth_token")
    const userData = sessionStorage.getItem("user_data")

    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setIsLoading(false)
  }, [])


  // 일반 로그인
  const login = async (email, password) => {
    setIsLoading(true)
    setLoginError(null)
    try {
      const formData = new URLSearchParams()
      formData.append("email", email)
      formData.append("password", password)

      const res = await fetch("http://localhost:8080/users/login", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const ErrorMsg = (await res.json())?.error || "로그인 실패"
        setLoginError(ErrorMsg)
        return
      }

      const data = await res.json()

      // email 필드 유연 처리
      const userEmail = data.email || data.sub || email
      if (!userEmail) {
        setLoginError("이메일 정보를 가져오지 못했습니다.")
        return
      }

      sessionStorage.setItem("auth_token", data.access_token)
      sessionStorage.setItem(
        "user_data",
        JSON.stringify({ email: userEmail, nickname: userEmail.split("@")[0] })
      )
      setUser({ email: userEmail, nickname: userEmail.split("@")[0] })
    } finally {
      setIsLoading(false)
    }
  }


  // 로그아웃
  const logout = () => {
    const userData = JSON.parse(sessionStorage.getItem("user_data"))
    const isKakaoUser = userData?.provider === "kakao"

    // 카카오 로그아웃
    if (isKakaoUser && window.Kakao?.Auth) {
      console.log("카카오 로그아웃 시도 중")
      window.Kakao.Auth.logout(() => {
        console.log("카카오 로그아웃 완료")
      })
    }

    // 세션 삭제
    sessionStorage.removeItem("auth_token")
    sessionStorage.removeItem("user_data")
    setUser(null)
  }


  // 회원가입
  const register = async (email, password, nickname) => {
    setIsLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("name", nickname) // 백엔드 UserController에서 name으로 받음

      const res = await fetch("http://localhost:8080/users/register", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("회원가입 실패")
      const data = await res.json()

      alert(data.success || data.error || "회원가입 완료! 이메일 인증 후 로그인하세요.")
      return data
    } finally {
      setIsLoading(false)
    }
  }


  // 소셜 로그인(카카오/구글)
  const socialLogin = async (provider, email, providerId) => {
    try {
      const formData = new URLSearchParams()
      formData.append("provider", provider)
      formData.append("email", email)
      if (providerId) formData.append("providerId", providerId)

      const res = await fetch("http://localhost:8080/users/social-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!res.ok) throw new Error("소셜 로그인 실패")

      const data = await res.json()

      const userEmail = data.socialEmail || data.email
      if (!userEmail) {
        alert("이메일 정보를 가져오지 못했습니다.")
        return
      }

      sessionStorage.setItem("auth_token", data.access_token)
      sessionStorage.setItem(
        "user_data",
        JSON.stringify({
          email: userEmail,
          nickname: userEmail.split("@")[0],
          provider: data.provider || provider,
        })
      )

      setUser({
        email: userEmail,
        nickname: userEmail.split("@")[0],
        provider: data.provider || provider,
      })
    } catch (err) {
      console.error("소셜 로그인 오류:", err)
      alert("소셜 로그인 중 오류가 발생했습니다.")
    }
  }


  // OAuth 로그인 버튼 클릭 시
  const loginWithOAuth = async (provider) => {
    if (provider === "kakao") {
      if (!window.Kakao || !window.Kakao.Auth) {
        alert("카카오 SDK가 로드되지 않았습니다.")
        return
      }

      //API 호출
      window.Kakao.Auth.login({
        scope: "account_email",
        success: (authObj) => {
          window.Kakao.API.request({
            url: "/v2/user/me",
            success: async (res) => {
              const email = res.kakao_account.email
              const kakaoId = res.id
              await socialLogin("kakao", email, kakaoId)
            },
          })
        },
        fail: (err) => {
          console.error("카카오 로그인 실패", err)
          alert("카카오 로그인 실패")
        },
      })
      return
    }

    if (provider === "google") {
      const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
      console.log("🟢 [Google Login] CID from .env:", cid)

    if (!cid) {
      console.error("❌ Google Client ID가 비어있습니다. (.env 확인 필요)")
      return
    }

    if (!window.google?.accounts?.id) {
      console.error("❌ Google SDK가 로드되지 않았습니다.")
      return
    }

    if (!window.__gsiInitialized) {
      console.log("GSI init start!!!")
      window.google.accounts.id.initialize({
        client_id: cid,
        callback: async ({ credential }) => {
          console.log("📌 [Step 1] Credential 수신 여부:", credential)

          if (!credential) {
            console.warn("⚠️ credential이 비어있음. Google 로그인 실패")
            return
          }

          try {
            // JWT payload 디코딩
            const payload = parseJwt(credential)
            console.log("📌 [Step 2] Google Payload:", payload)

            if (!payload?.email) {
              console.error("❌ 이메일 정보 없음");
              return;
            }

            // 백엔드로 전송
            console.log("📌 [Step 3] 백엔드로 social-login 요청 시작")
            await socialLogin("google", payload.email, payload.sub)
            console.log("✅ [Step 4] 백엔드 요청 완료")
          } catch (e) {
            console.error("❌ Google callback error:", e)
          }
        },
      })
    }

  // 버튼 렌더링
  const btn = document.getElementById("googleLoginBtn")
  if (btn) {
    console.log("🟢 renderButton on #googleLoginBtn")
    window.google.accounts.id.renderButton(btn, { theme: "outline", size: "large" })

    window.google.accounts.id.prompt((notification) => {
    console.log("🟢 prompt notification:", notification)
    })
  } else {
    console.warn("⚠️ #googleLoginBtn 요소 없음. DOM에 div 추가 필요")
  }

  window.__gsiInitialized = true
  console.log("🟢 GSI init done")
}

  }
  // Context Provider 리턴
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginError,
        loginWithOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}