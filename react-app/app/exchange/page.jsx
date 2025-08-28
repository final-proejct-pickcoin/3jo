"use client"

import { Navigation } from "@/components/navigation"
import TradingInterface from "@/components/trading-clean"

export default function ExchangePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="container mx-auto px-0 pt-6 pb-0">
        <TradingInterface />
      </div>
    </div>
  )
}


