"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginError, setLoginError] = useState(null)

  useEffect(() => {
  const token = sessionStorage.getItem("auth_token");
  const userData = sessionStorage.getItem("user_data");

  if (token && userData) {
    setUser(JSON.parse(userData)); // 로그인 상태 복원
  }
  
  setIsLoading(false);
}, []);

  // 로그인
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

      // 로그인 실패
      if (!res.ok) {
        const ErrorMsg = (await res.json())?.error || "로그인 실패"
        setLoginError(ErrorMsg)
        return
      }

      const data = await res.json()

      sessionStorage.setItem("auth_token", data.access_token)
      sessionStorage.setItem(
        "user_data",
        JSON.stringify({ email: data.sub, nickname: data.sub.split("@")[0] })
      )
      setUser({ email: data.sub, nickname: data.sub.split("@")[0] })
    } finally {
      setIsLoading(false)
    }
  }

  //로그아웃시 세션 종료
  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
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

      if (!res.ok) throw new Error("Registration failed")
      const data = await res.json()

      alert(data.success || data.error || "회원가입 완료! 이메일 인증 후 로그인하세요.")
      return data
    } finally {
      setIsLoading(false)
    }
  }

  // 카카오 구글 로그인 연동
  const socialLogin = async (provider, email, providerId) => {
  const formData = new URLSearchParams()
  formData.append("provider", provider)
  formData.append("email", email)
  if (providerId) formData.append("providerId", providerId)

  const res = await fetch("http://localhost:8080/users/social-login", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) throw new Error("소셜 로그인 실패")

  const data = await res.json()

  sessionStorage.setItem("auth_token", data.access_token)
  sessionStorage.setItem(
    "user_data",
    JSON.stringify({ email: data.sub, nickname: data.sub.split("@")[0] })
  )
  setUser({ email: data.sub, nickname: data.sub.split("@")[0] })
}

// 실제 버튼 클릭 시 호출될 함수
const loginWithOAuth = async (provider) => {
  if (provider === "kakao") {
    if (!window.Kakao || !window.Kakao.Auth) {
      alert("카카오 SDK가 로드되지 않았습니다.")
      return
    }

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
  } else if (provider === "google") {
    alert("구글 로그인은 아직 구현 전입니다.")
  }
}



  
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
        loginWithOAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}