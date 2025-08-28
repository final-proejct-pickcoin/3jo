"use client"

import { Navigation } from "@/components/navigation"
import { MarketAnalysis } from "@/components/market-analysis"

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="container mx-auto px-0 pt-6 pb-0">
        <MarketAnalysis />
      </div>
    </div>
  )
}


