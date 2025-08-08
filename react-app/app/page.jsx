"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { OnboardingProvider } from "@/components/onboarding-provider"
import { WebSocketProvider } from "@/components/websocket-provider"
import { LandingPage } from "@/components/landing-page"
import { MainDashboard } from "@/components/main-dashboard"
import { OnboardingTour } from "@/components/onboarding-tour"
import { VoiceAssistant2 } from "@/components/voice-assistant2"
import { NotificationSystem } from "@/components/notification-system"


const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || isLoading) return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading Virtual Crypto Platform...</p>
      </div>
    </div>
  )
  if (!isAuthenticated) return <LandingPage />
  return (
    <WebSocketProvider>
      <MainDashboard />
      <OnboardingTour />
      <VoiceAssistant2 />
      <NotificationSystem />
    </WebSocketProvider>
  )
}


const VirtualCryptoPlatform = () => (
  <ThemeProvider>
    <AuthProvider>
      <OnboardingProvider>
        <AppContent />
      </OnboardingProvider>
    </AuthProvider>
  </ThemeProvider>
)

export default VirtualCryptoPlatform