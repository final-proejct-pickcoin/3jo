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