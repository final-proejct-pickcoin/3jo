"use client"

import { useState, useEffect } from "react"
import { getKrwRate } from "@/lib/get-krw-rate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Eye, EyeOff, RefreshCw } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"

const formatValue = (value, currency, krwRate, hide) => {
  if (hide) return "••••••"
  if (currency === "KRW") return `₩${(value * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export const PortfolioManager = () => {
const portfolioData = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    amount: 0.5,
    avgPrice: 42000,
    currentPrice: 43000,
    allocation: 45,
    pnl: 500,
    pnlPercent: 2.38,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    amount: 8.2,
    avgPrice: 1600,
    currentPrice: 1580,
    allocation: 28,
    pnl: -164,
    pnlPercent: -1.25,
  },
  {
    symbol: "ADA",
    name: "Cardano",
    amount: 5000,
    avgPrice: 0.45,
    currentPrice: 0.48,
    allocation: 12,
    pnl: 150,
    pnlPercent: 6.67,
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    amount: 200,
    avgPrice: 7.5,
    currentPrice: 7.2,
    allocation: 8,
    pnl: -60,
    pnlPercent: -4.0,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    amount: 100,
    avgPrice: 14.8,
    currentPrice: 15.2,
    allocation: 7,
    pnl: 40,
    pnlPercent: 2.7,
  },
]

const transactionHistory = [
  { type: "buy", symbol: "BTC", amount: 0.1, price: 43000, date: "2024-01-15", pnl: 100 },
  { type: "sell", symbol: "ETH", amount: 2.5, price: 1600, date: "2024-01-14", pnl: -50 },
  { type: "buy", symbol: "ADA", amount: 1000, price: 0.48, date: "2024-01-13", pnl: 25 },
  { type: "buy", symbol: "DOT", amount: 50, price: 7.2, date: "2024-01-12", pnl: -15 },
  { type: "sell", symbol: "LINK", amount: 25, price: 15.2, date: "2024-01-11", pnl: 75 },
]

  const { subscribe, marketData } = useWebSocket()
  const [hideBalances, setHideBalances] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h")
  const [krwRate, setKrwRate] = useState(0)
  const [currency, setCurrency] = useState("KRW") // "KRW" or "USD"

  useEffect(() => {
    const symbols = portfolioData.map((p) => p.symbol)
    subscribe(symbols)
    getKrwRate().then((rate) => setKrwRate(rate))
  }, [subscribe])

  const totalValue = portfolioData.reduce((sum, asset) => {
    const currentPrice = marketData[asset.symbol]?.price || asset.currentPrice
    return sum + asset.amount * currentPrice
  }, 0)
  const totalPnL = portfolioData.reduce((sum, asset) => sum + asset.pnl, 0)
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            포트폴리오 요약
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setHideBalances(!hideBalances)}>
                {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW") }>
                {currency === "KRW" ? "₩" : "$"}
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            총 평가금액: {formatValue(totalValue, currency, krwRate, hideBalances)}
              {/* (≈ ...) sublabel removed for KRW-only display */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatValue(totalValue, currency, krwRate, hideBalances)}</p>
              <p className="text-sm text-muted-foreground">총 평가금액</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}> 
                {hideBalances
                  ? "••••••"
                  : `${totalPnL >= 0 ? "+" : ""}${formatValue(Math.abs(totalPnL), currency, krwRate, false)}`}
              </p>
              <span className="text-xs text-muted-foreground">
                {hideBalances ? null : formatValue(Math.abs(totalPnL), currency, krwRate, false)}
              </span>
              <p className="text-sm text-muted-foreground">총 손익</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${totalPnLPercent >= 0 ? "text-green-500" : "text-red-500"}`}> 
                {hideBalances ? "••••••" : `${totalPnLPercent >= 0 ? "+" : ""}${totalPnLPercent.toFixed(2)}%`}
              </p>
              <p className="text-sm text-muted-foreground">총 수익률</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{portfolioData.length}</p>
              <p className="text-sm text-muted-foreground">보유 자산</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">보유내역</TabsTrigger>
          <TabsTrigger value="history">거래내역</TabsTrigger>
          <TabsTrigger value="analytics">분석</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>현재 보유자산</CardTitle>
              <CardDescription>보유 자산 상세 보기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioData.map((asset) => {
                  const livePrice = marketData[asset.symbol]?.price || asset.currentPrice
                  const currentValue = asset.amount * livePrice
                  const livePnL = (livePrice - asset.avgPrice) * asset.amount
                  const livePnLPercent = ((livePrice - asset.avgPrice) / asset.avgPrice) * 100
                  return (
                    <div key={asset.symbol} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold">{asset.symbol}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {hideBalances ? "••••••" : `${asset.amount} ${asset.symbol}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {hideBalances
                              ? "••••••"
                              : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {hideBalances ? null : formatValue(Math.abs(livePnL), currency, krwRate, false)}
                          </span>
                          <Badge variant={livePnL >= 0 ? "default" : "destructive"}>
                            {livePnL >= 0 ? "+" : ""}
                            {hideBalances ? "••••" : `${livePnLPercent.toFixed(2)}%`}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground">평균 매입가</p>
                          <p className="font-medium">{formatValue(asset.avgPrice, currency, krwRate, false)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">현재가</p>
                          <p className="font-medium">{formatValue(livePrice, currency, krwRate, false)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">손익</p>
                          <p className={`font-medium ${livePnL >= 0 ? "text-green-500" : "text-red-500"}`}> 
                            {hideBalances
                              ? "••••••"
                              : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">비중</p>
                          <p className="font-medium">{asset.allocation}%</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>포트폴리오 비중</span>
                          <span>{asset.allocation}%</span>
                        </div>
                        <Progress value={asset.allocation} className="h-2" />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3 mr-1" />
                          추가 매수
                        </Button>
                        <Button size="sm" variant="outline">
                          <Minus className="h-3 w-3 mr-1" />
                          매도
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>거래 내역</CardTitle>
              <CardDescription>나의 매매 활동 및 실적</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactionHistory.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {tx.type === "buy" ? "+" : "-"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === "buy" ? "매수" : "매도"} {tx.amount} {tx.symbol}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @ {currency === "KRW"
                            ? `₩${(tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : `$${tx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          • {tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{currency === "KRW"
                        ? `₩${(tx.amount * tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `$${(tx.amount * tx.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
                      <p className={`text-sm ${tx.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {tx.pnl >= 0 ? "+" : ""}
                        {currency === "KRW"
                          ? `₩${(tx.pnl * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : `$${tx.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>자산 비중</CardTitle>
                <CardDescription>포트폴리오 내 자산별 분포</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioData.map((asset) => (
                    <div key={asset.symbol} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          <span>{asset.symbol}</span>
                        </span>
                        <span>{asset.allocation}%</span>
                      </div>
                      <Progress value={asset.allocation} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>성과 지표</CardTitle>
                <CardDescription>주요 포트폴리오 통계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">최고 수익 자산</span>
                    <span className="font-medium text-green-500">ADA (+6.67%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">최저 수익 자산</span>
                    <span className="font-medium text-red-500">DOT (-4.0%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수익 거래 비율</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">평균 보유 기간</span>
                    <span className="font-medium">12일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">리스크 점수</span>
                    <span className="font-medium text-orange-500">중간</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
