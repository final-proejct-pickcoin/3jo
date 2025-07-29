"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { TradingChart } from "@/components/trading-chart"
import { CurrencyToggle } from "@/components/currency-toggle"

export const TradingInterface = () => {
  const [orderType, setOrderType] = useState("limit")
  const [orderSide, setOrderSide] = useState("buy")
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("KRW")
  const krwRate = 1300
  const marketData = {
    symbol: "BTC/USDT",
    price: 43100,
    changePercent: 2.98,
    high24h: 44200,
    low24h: 41800,
    volume: 28450.67
  }
  const orderBook = {
    asks: [
      { price: 43150, amount: 0.5, total: 0.5 },
      { price: 43140, amount: 1.2, total: 1.7 },
      { price: 43130, amount: 0.8, total: 2.5 }
    ],
    bids: [
      { price: 43100, amount: 0.9, total: 0.9 },
      { price: 43090, amount: 1.8, total: 2.7 },
      { price: 43080, amount: 0.6, total: 3.3 }
    ]
  }
  const handlePlaceOrder = () => {
    if (!amount || (orderType !== "market" && !price)) {
      toast.error("Please fill in required fields")
      return
    }
    toast.success(`${orderSide.toUpperCase()} order placed successfully!`)
  }
  const displayPrice = (usd) => currency === "KRW"
    ? `₩${Math.round(usd * krwRate).toLocaleString()}`
    : `$${usd.toLocaleString()}`
  return (
    <div className="h-full max-h-screen overflow-hidden p-4 space-y-4">
      {/* Price Ticker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">₿ BTC/USDT</h3>
                <p className="text-sm text-muted-foreground">비트코인</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{displayPrice(marketData.price)}</div>
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  전일 대비: ▲{displayPrice(1961.87)} (+{marketData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
            {/* 빨간 박스 위치에 토글 버튼 */}
            <div className="flex items-center gap-2">
              <CurrencyToggle currency={currency} setCurrency={setCurrency} />
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">24시간 최고가</p>
                <p className="font-semibold text-green-600">{displayPrice(marketData.high24h)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">24시간 최저가</p>
                <p className="font-semibold text-red-600">{displayPrice(marketData.low24h)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">24시간 거래량</p>
                <p className="font-semibold">{marketData.volume.toLocaleString()} BTC</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {/* Order Book */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">호가창 (Order Book)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 gap-2 p-4 text-xs font-medium text-muted-foreground border-b">
              <div>가격 ({currency})</div>
              <div className="text-right">수량 (BTC)</div>
              <div className="text-right">누적 수량 (BTC)</div>
            </div>
            {/* Asks */}
            <div className="p-2 space-y-1">
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 py-1 text-xs">
                  <div className="text-red-600 font-mono">{displayPrice(ask.price)}</div>
                  <div className="text-right font-mono">{ask.amount.toFixed(4)}</div>
                  <div className="text-right font-mono text-muted-foreground">{ask.total.toFixed(4)}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-muted/20 border-y">
              <div className="text-center text-lg font-bold">현재가: {displayPrice(marketData.price)}</div>
            </div>
            {/* Bids */}
            <div className="p-2 space-y-1">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 py-1 text-xs">
                  <div className="text-green-600 font-mono">{displayPrice(bid.price)}</div>
                  <div className="text-right font-mono">{bid.amount.toFixed(4)}</div>
                  <div className="text-right font-mono text-muted-foreground">{bid.total.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Form */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-lg">주문하기</CardTitle>
            <div className="flex space-x-1 mt-2">
              <Button
                variant={orderSide === "buy" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderSide("buy")}
                className="flex-1"
              >
                매수
              </Button>
              <Button
                variant={orderSide === "sell" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderSide("sell")}
                className="flex-1"
              >
                매도
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>주문 유형</Label>
              <Select value={orderType} onValueChange={(value) => setOrderType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">시장가 주문</SelectItem>
                  <SelectItem value="limit">지정가 주문</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === "limit" && (
              <div>
                <Label>매수가격 ({currency})</Label>
                <Input
                  type="number"
                  placeholder={currency === "KRW" ? "0 (₩)" : "0 ($)"}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>수량 (BTC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={!amount || (orderType === "limit" && !price)}
            >
              {orderSide === "buy" ? `BTC 매수` : `BTC 매도`}
            </Button>
          </CardContent>
        </Card>
        {/* Advanced Trading Chart */}
        <div className="lg:col-span-2 lg:row-span-2">
          <TradingChart symbol="BTC/USDT" height={600} />
        </div>
      </div>
    </div>
  )
}
