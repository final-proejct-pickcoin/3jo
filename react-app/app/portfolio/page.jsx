"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { PortfolioManager } from "@/components/portfolio-manager"
import { WatchlistManager } from "@/components/watchlist-manager"
import DepositManager from "@/components/deposit-manager"

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("portfolio")
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit" data-tour="deposit-tab">입출금</TabsTrigger>
            <TabsTrigger value="portfolio" data-tour="portfolio-tab">내 자산</TabsTrigger>
            <TabsTrigger value="watchlist" data-tour="watchlist-tab">관심코인</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="space-y-6">
            <DepositManager />
          </TabsContent>
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioManager />
          </TabsContent>
          <TabsContent value="watchlist" className="space-y-6">
            <h1 className="text-xl font-bold">마이페이지</h1>
            <WatchlistManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PortfolioPage