"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

export const Toaster = props => {
  const { theme = "system" } = useTheme()
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "",
          description: "",
          actionButton: "",
          cancelButton: "",
        },
      }}
      {...props}
    />
  )
}
