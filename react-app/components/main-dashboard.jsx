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
import DepositManager from "@/components/deposit-manager"
import { PortfolioManager } from "@/components/portfolio-manager"
import { WatchlistManager } from "@/components/watchlist-manager"

export const MainDashboard = () => {
  const { user } = useAuth()
  const { startOnboarding } = useOnboarding()
  const [activeTab, setActiveTab] = useState("trading")
  useEffect(() => {
    if (user && !user.isOnboardingCompleted) setTimeout(startOnboarding, 1000)
  }, [user, startOnboarding])
  const isAdmin = user?.email?.includes("admin") ?? false
  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-gray-900 dark:text-gray-100">
      <Navigation />
      
      <div className="px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          {/* ── 배너 영역 ───────────────────────────────────── */}
          <div className="relative border-b border-gray-200 dark:border-gray-700">
            {/* 배경 (그라데이션). 배경이미지를 쓰려면 아래 주석 참고 */}
            <div className="h-36 relative overflow-hidden">
              <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ 
                  // backgroundImage: "url('/banner1.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div className="absolute inset-0 bg-orange/50 dark:bg-orange/30 backdrop-blur-[60px]" />
            </div>
            {/* 배너 내용 */}
            <div className="absolute inset-0">
              <div className="container mx-auto h-full px-0 flex items-end pb-4">
                <TabsList className="bg-transparent p-0 h-auto flex gap-12">
                  <TabsTrigger
                  value="trading"
                  className="text-3xl data-[state=active]:text-6xl bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black dark:data-[state=active]:text-white font-bold hover:text-black dark:hover:text-white mr-8"
                  >
                  거래소
                  </TabsTrigger>

                  <TabsTrigger
                    value="market"
                      className="text-3xl data-[state=active]:text-6xl bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black dark:data-[state=active]:text-white font-bold hover:text-black dark:hover:text-white"
                  >
                    시장 동향 & 이슈
                  </TabsTrigger>

                  <TabsTrigger
                    value="community"
                    className="text-3xl data-[state=active]:text-6xl bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black dark:data-[state=active]:text-white font-bold hover:text-black dark:hover:text-white"
                  >
                    커뮤니티
                  </TabsTrigger>

                  <TabsTrigger
                    value="ai"
                    className="text-3xl data-[state=active]:text-6xl bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black dark:data-[state=active]:text-white font-bold hover:text-black dark:hover:text-white"
                  >
                    고객지원
                  </TabsTrigger>
                
                  <TabsTrigger
                      value="mypage"
                    className="text-3xl data-[state=active]:text-6xl bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-black dark:data-[state=active]:text-white font-bold hover:text-black dark:hover:text-white"
                  >
                  마이페이지
                  </TabsTrigger>
                  </TabsList>  
              </div>
            </div>
          </div>

          {/* 접근성/키보드용 숨김 탭 목록(거래소 포함) */}
          <TabsList className="sr-only">
            <TabsTrigger value="trading">거래소</TabsTrigger>
            <TabsTrigger value="market">시장 동향 & 이슈</TabsTrigger>
            <TabsTrigger value="community">커뮤니티</TabsTrigger>
            <TabsTrigger value="ai">고객지원</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">관리자</TabsTrigger>}
          </TabsList>

          {/* ── 본문 컨텐츠 ────────────────────────────────── */}
          <div className="container mx-auto px-0 pt-6 pb-0 dark:bg-gray-900">
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

            <TabsContent value="mypage">
               <div className="container mx-auto px-4 py-6">
                 <Tabs defaultValue="portfolio" className="space-y-6">
                  <TabsContent value="portfolio" className="space-y-6">
                    <PortfolioManager />
                  </TabsContent>
                  <TabsContent value="watchlist" className="space-y-6">
                    <WatchlistManager />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminPanel />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
      
    </div>
  )
}
