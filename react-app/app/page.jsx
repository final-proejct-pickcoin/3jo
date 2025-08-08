"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { OnboardingProvider } from "@/components/onboarding-provider"
import { WebSocketProvider } from "@/components/websocket-provider"
import { LandingPage } from "@/components/landing-page"
import { MainDashboard } from "@/components/main-dashboard"
import { OnboardingTour } from "@/components/onboarding-tour"
import { VoiceAssistant } from "@/components/voice-assistant"
import { NotificationSystem } from "@/components/notification-system"
import dynamic from "next/dynamic";

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
      <VoiceAssistant />
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

// TradingChart 컴포넌트를 동적 임포트 (SSR 비활성화)
const TradingChart = dynamic(()=> import('@/components/trading-chart').then(
  mod => mod.TradingChart), {
  ssr: false, loading: () => 
  <div className="h-[670px] flex items-center justify-center">
    차트 로딩 중...
  </div>
});  

// TradingInterface도 동적 임포트
const TradingInterface = dynamic(() => import('@/components/trading-clean'), { 
  ssr: false,
  loading: () => <div>인터페이스 로딩 중...</div>
});