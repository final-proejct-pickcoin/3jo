"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user_data")
      if (token && userData) setUser(JSON.parse(userData))
    } catch (e) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
    } finally {
      setIsLoading(false)
    }
  }, [])
  const login = async (email, password) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const mockUser = { id: "user_" + Date.now(), email, nickname: email.split("@")[0], isOnboardingCompleted: false, createdAt: new Date().toISOString() }
    localStorage.setItem("auth_token", "jwt_" + Date.now())
    localStorage.setItem("user_data", JSON.stringify(mockUser))
    setUser(mockUser)
    setIsLoading(false)
  }
  const register = async (email, password, nickname) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const mockUser = { id: "user_" + Date.now(), email, nickname, isOnboardingCompleted: false, createdAt: new Date().toISOString() }
    localStorage.setItem("auth_token", "jwt_" + Date.now())
    localStorage.setItem("user_data", JSON.stringify(mockUser))
    setUser(mockUser)
    setIsLoading(false)
  }
  const loginWithOAuth = async (provider) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    const mockUser = { id: "oauth_" + Date.now(), email: `user@${provider}.com`, nickname: `${provider}_user`, avatar: `/placeholder.svg?height=40&width=40&text=${provider.toUpperCase()}`, isOnboardingCompleted: false, createdAt: new Date().toISOString() }
    localStorage.setItem("auth_token", "oauth_jwt_" + Date.now())
    localStorage.setItem("user_data", JSON.stringify(mockUser))
    setUser(mockUser)
    setIsLoading(false)
  }
  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    setUser(null)
  }
  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem("user_data", JSON.stringify(updatedUser))
    }
  }
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, loginWithOAuth, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
