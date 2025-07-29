"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Removed all TypeScript type aliases and annotations
const initialState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export const ThemeProvider = ({
  children,
  defaultTheme = "light",
  storageKey = "crypto-platform-theme",
  ...props
}) => {
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage?.getItem(storageKey) || defaultTheme : defaultTheme
  )
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark", "lavender")
    let appliedTheme = theme
    if (theme === "system") {
      appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    root.classList.add(appliedTheme)
    root.style.transition = "background-color 0.3s, color 0.3s"
    const timer = setTimeout(() => { root.style.transition = "" }, 300)
    return () => clearTimeout(timer)
  }, [theme])
  const value = {
    theme,
    setTheme: (theme) => {
      localStorage?.setItem(storageKey, theme)
      setTheme(theme)
    },
  }
  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
