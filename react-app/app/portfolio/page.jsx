"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { PortfolioManager } from "@/components/portfolio-manager"
import { WatchlistManager } from "@/components/watchlist-manager"

const PortfolioPage = () => {
  const [activeTab, setActiveTab] = useState("portfolio")
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portfolio" data-tour="portfolio-tab">내 자산</TabsTrigger>
            <TabsTrigger value="watchlist" data-tour="watchlist-tab">관심코인</TabsTrigger>
          </TabsList>
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioManager />
          </TabsContent>
          <TabsContent value="watchlist" className="space-y-6">
            <WatchlistManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PortfolioPage