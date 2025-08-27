"use client"

import { Navigation } from "@/components/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioManager } from "@/components/portfolio-manager"
import { WatchlistManager } from "@/components/watchlist-manager"

export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="portfolio" className="space-y-6">
          {/* <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portfolio">내 자산</TabsTrigger>
            <TabsTrigger value="watchlist">관심코인</TabsTrigger>
          </TabsList> */}
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


