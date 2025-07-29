"use client"

import { useState, useEffect } from "react"
import { getKrwRate } from "@/lib/get-krw-rate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search } from "lucide-react"

const watchlistData = [
  { symbol: "BTC", name: "Bitcoin", price: 43000, change: 2.5, alert: { type: "price", value: 45000 } },
  { symbol: "ETH", name: "Ethereum", price: 1600, change: -1.2, alert: { type: "price", value: 1700 } },
  { symbol: "ADA", name: "Cardano", price: 0.48, change: 5.2, alert: null },
  { symbol: "DOT", name: "Polkadot", price: 7.2, change: -3.1, alert: { type: "volume", value: "10M" } },
]
const availableCoins = [
  { symbol: "LINK", name: "Chainlink", price: 15.2 },
  { symbol: "UNI", name: "Uniswap", price: 6.8 },
  { symbol: "MATIC", name: "Polygon", price: 0.92 },
  { symbol: "AVAX", name: "Avalanche", price: 38.5 },
]

const formatPrice = (price, currency, krwRate) =>
  currency === "KRW"
    ? `₩${(price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export const Watchlist = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [watchlist, setWatchlist] = useState(watchlistData)
  const [currency, setCurrency] = useState("KRW")
  const [krwRate, setKrwRate] = useState(0)
  useEffect(() => { getKrwRate().then(setKrwRate) }, [])
  const addToWatchlist = (coin) =>
    setWatchlist((prev) => prev.concat({ ...coin, change: Math.random() * 10 - 5, alert: null }))
  const removeFromWatchlist = (symbol) =>
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol))
  const filteredCoins = availableCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              나의 관심코인
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}>
              {currency === "KRW" ? "₩" : "$"}
            </Button>
          </CardTitle>
          <CardDescription>실시간으로 관심 있는 암호화폐를 추적하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {watchlist.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg overflow-hidden">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-xs">{coin.symbol}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{coin.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{coin.symbol}</p>
                    {coin.alert && (
                      <Badge variant="outline" className="text-xs mt-1 truncate max-w-full">
                        알림: {coin.alert.type === "price"
                          ? (currency === "KRW"
                              ? `₩${(coin.alert.value * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                              : `$${coin.alert.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)
                          : `거래량: ${coin.alert.value}`}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="text-right min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {currency === "KRW"
                        ? `₩${(coin.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `$${coin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </p>
                    <div className="flex items-center justify-end">
                      {coin.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1 flex-shrink-0" />
                      )}
                      <span className={`text-xs whitespace-nowrap ${coin.change > 0 ? "text-green-500" : "text-red-500"}`}>
                        {coin.change > 0 ? "+" : ""}
                        {coin.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => removeFromWatchlist(coin.symbol)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {watchlist.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>관심코인이 없습니다</p>
                <p className="text-sm">추적할 코인을 추가해보세요</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>관심코인 추가</CardTitle>
          <CardDescription>검색하거나 음성 명령으로 코인을 추가하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="코인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredCoins.map((coin) => (
                <div key={coin.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">{coin.symbol}</span>
                    </div>
                    <div>
                      <p className="font-medium">{coin.name}</p>
                      <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-medium">
                      {currency === "KRW"
                        ? `₩${(coin.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `$${coin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToWatchlist(coin)}
                      disabled={watchlist.some((item) => item.symbol === coin.symbol)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCoins.length === 0 && searchTerm && (
              <div className="text-center py-4 text-muted-foreground">
                <p>검색 결과가 없습니다</p>
                <p className="text-sm">다른 검색어를 입력해보세요</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
