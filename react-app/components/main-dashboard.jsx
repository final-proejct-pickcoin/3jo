"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import  TradingInterface  from "@/components/trading-clean"
import { MarketAnalysis } from "@/components/market-analysis"
import { CommunityHub } from "@/components/community-hub"
import { AIAssistant } from "@/components/ai-assistant"
import { AdminPanel } from "@/components/admin-panel"
import { useAuth } from "@/components/auth-provider"
import { useOnboarding } from "@/components/onboarding-provider"

export const MainDashboard = () => {
  const { user } = useAuth()
  const { startOnboarding } = useOnboarding()
  const [activeTab, setActiveTab] = useState("trading")
  useEffect(() => {
    if (user && !user.isOnboardingCompleted) setTimeout(startOnboarding, 1000)
  }, [user, startOnboarding])
  const isAdmin = user?.email?.includes("admin") ?? false
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="container mx-auto px-0 pt-6 pb-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex justify-evenly w-full">
            <TabsTrigger value="trading" data-tour="trading-tab"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow rounded-md">
              거래소
            </TabsTrigger>
            <TabsTrigger value="market"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow rounded-md"
            >마켓</TabsTrigger>
            <TabsTrigger value="community"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow rounded-md"
            >커뮤니티</TabsTrigger>
            <TabsTrigger value="ai"
              className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow rounded-md"
            >고객센터</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">관리자</TabsTrigger>}
          </TabsList>

          <TabsContent value="trading">
            <TradingInterface />
          </TabsContent>

          <TabsContent value="market">
            <MarketAnalysis />
          </TabsContent>

          <TabsContent value="community">
            <CommunityHub />
          </TabsContent>

          <TabsContent value="ai">
            <AIAssistant />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
