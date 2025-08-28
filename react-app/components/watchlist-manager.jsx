"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  Star,
  StarOff
} from "lucide-react"

export const WatchlistManager = () => {
  const [watchlist, setWatchlist] = useState([
    { symbol: "BTC", name: "Bitcoin", isWatched: true },
    { symbol: "ETH", name: "Ethereum", isWatched: true },
    { symbol: "ADA", name: "Cardano", isWatched: true },
    { symbol: "DOT", name: "Polkadot", isWatched: true },
    { symbol: "LINK", name: "Chainlink", isWatched: true }
  ])

  // 거래 내역 데이터
  const transactions = [
    {
      type: "buy",
      symbol: "BTC",
      quantity: 0.1,
      price: 58050000,
      date: "2024-01-15",
      totalValue: 5805000,
      change: 135000
    },
    {
      type: "sell",
      symbol: "ETH",
      quantity: 2.5,
      price: 2160000,
      date: "2024-01-14",
      totalValue: 5400000,
      change: -67500
    },
    {
      type: "buy",
      symbol: "ADA",
      quantity: 1000,
      price: 648,
      date: "2024-01-13",
      totalValue: 648000,
      change: 33750
    },
    {
      type: "buy",
      symbol: "DOT",
      quantity: 50,
      price: 9720,
      date: "2024-01-12",
      totalValue: 486000,
      change: -20250
    },
    {
      type: "sell",
      symbol: "LINK",
      quantity: 25,
      price: 20520,
      date: "2024-01-11",
      totalValue: 513000,
      change: 101250
    }
  ]

  const formatKRW = (num) => {
    return `₩${num.toLocaleString()}`
  }

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.map(item => 
        item.symbol === symbol 
          ? { ...item, isWatched: !item.isWatched }
          : item
      )
    )
  }

  const getTransactionIcon = (type) => {
    if (type === "buy") {
      return (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Plus className="w-5 h-5 text-green-600" />
        </div>
      )
    } else {
      return (
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <Minus className="w-5 h-5 text-red-600" />
        </div>
      )
    }
  }

  return (
    <div className="space-y-8">
      {/* 관심코인 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">관심코인 관리</CardTitle>
          <p className="text-gray-600">자주 모니터링하는 코인들을 관리하세요</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{coin.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{coin.symbol}</div>
                    <div className="text-sm text-gray-600">{coin.name}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWatchlist(coin.symbol)}
                  className={coin.isWatched ? "text-yellow-500" : "text-gray-400"}
                >
                  {coin.isWatched ? (
                    <Star className="w-5 h-5" />
                  ) : (
                    <StarOff className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">거래 내역</CardTitle>
          <p className="text-gray-600">나의 매매 활동 및 실적</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {tx.type === "buy" ? "매수" : "매도"} {tx.quantity} {tx.symbol}
                    </div>
                    <div className="text-sm text-gray-500">
                      @ {formatKRW(tx.price)} • {tx.date}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatKRW(tx.totalValue)}
                  </div>
                  <div className={`text-sm font-medium ${
                    tx.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.change >= 0 ? '+' : ''}{formatKRW(tx.change)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 거래 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">거래 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
              <div className="text-sm text-gray-600">총 거래 횟수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">3</div>
              <div className="text-sm text-gray-600">수익 거래</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">2</div>
              <div className="text-sm text-gray-600">손실 거래</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">60%</div>
              <div className="text-sm text-gray-600">수익률</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}