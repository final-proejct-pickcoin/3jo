"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Star, Plus } from "lucide-react"



const marketData = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 43000,
    change: 2.5,
    volume: "28.5B",
    marketCap: "840B",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 1600,
    change: -1.2,
    volume: "12.3B",
    marketCap: "192B",
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: 310,
    change: 3.8,
    volume: "2.1B",
    marketCap: "47B",
  },
  {
    symbol: "XRP",
    name: "XRP",
    price: 0.52,
    change: -0.8,
    volume: "1.8B",
    marketCap: "28B",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.48,
    change: 5.2,
    volume: "890M",
    marketCap: "17B",
  },
]

const trendingCoins = [
  { symbol: "DOGE", change: 15.2 },
  { symbol: "SHIB", change: 12.8 },
  { symbol: "PEPE", change: 8.9 },
]

const coinNameMap = { BTC: "비트코인", ETH: "이더리움", BNB: "비엔비", XRP: "리플", ADA: "에이다" }
const getKoreanCoinName = (symbol, name) => coinNameMap[symbol] ? `${coinNameMap[symbol]} (${symbol})` : name ? `${name} (${symbol})` : symbol

export const MarketOverview = ({ detailed = false }) => {

  if (!detailed) return (
    <Card>
      <CardHeader>
        <CardTitle>전체 시장 정보</CardTitle>
        <CardDescription>주요 암호화폐</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.slice(0, 5).map((coin) => (
            <div key={coin.symbol} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">{coin.symbol}</span>
                </div>
                <div>
                  <p className="font-medium">{coin.name}</p>
                  <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${coin.price.toLocaleString()}</p>
                <div className="flex items-center">
                  {coin.change > 0 ? <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                  <span className={`text-xs ${coin.change > 0 ? "text-green-500" : "text-red-500"}`}>{coin.change > 0 ? "+" : ""}{coin.change}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h4 className="font-medium mb-3">인기 급상승</h4>
          <div className="flex gap-2">
            {trendingCoins.map((coin) => (
              <Badge key={coin.symbol} variant="secondary">
                {coin.symbol} +{coin.change}%
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>전체 시장 정보</CardTitle>
          <CardDescription>전 세계 암호화폐 시장 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">1조 6,800억 달러</p>
              <p className="text-sm text-muted-foreground">전체 시가총액</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">892억 달러</p>
              <p className="text-sm text-muted-foreground">24시간 거래량</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">51.2%</p>
              <p className="text-sm text-muted-foreground">비트코인 점유율</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>주요 암호화폐 시세</CardTitle>
          <CardDescription>시가총액 상위 암호화폐</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketData.map((coin, index) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground w-6">{`#${index + 1}`}</span>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-bold">{coin.symbol}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{getKoreanCoinName(coin.symbol, coin.name)}</h3>
                    <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold">{coin.price.toLocaleString()} 달러</p>
                    <Badge variant={coin.change > 0 ? "default" : "destructive"}>
                      {coin.change > 0 ? "+" : ""}
                      {coin.change}%
                    </Badge>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p>거래량: {coin.volume} 달러</p>
                    <p>시가총액: {coin.marketCap} 달러</p>
                    <p>변경 테스트용</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" >
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
