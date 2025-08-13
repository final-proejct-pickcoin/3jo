"use client"

import { useEffect, useRef } from "react"
import { useWebSocket } from "@/components/websocket-provider"
import { useToast } from "@/hooks/use-toast"

/**
 * Global toast-based notification system.
 * Extend this to listen for price alerts, order fills, etc.
 */
export const NotificationSystem = () => {
  const { toast } = useToast()
  const { isConnected } = useWebSocket()
  const welcomeShown = useRef(false)
  const connectionShown = useRef(false)

  useEffect(() => {
    if (!welcomeShown.current) {
      welcomeShown.current = true
      toast({
        title: "Welcome back 👋",
        description: "Happy trading on PickCoin!",
      })
    }
  }, [toast])

  useEffect(() => {
    if (!connectionShown.current && isConnected) {
      connectionShown.current = true
      toast({
        title: "Real-time data connected",
        description: "Market prices are updating live.",
      })
    }
  }, [isConnected, toast])

  return null
}
