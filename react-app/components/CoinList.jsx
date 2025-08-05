"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star,
  BarChart3,
  Volume2,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"

export const CoinList = () => {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMarket, setSelectedMarket] = useState("KRW")
  const [sortBy, setSortBy] = useState("volume")
  const [sortOrder, setSortOrder] = useState("desc")
  const [currentPage, setCurrentPage] = useState(0)
  const [favorites, setFavorites] = useState(new Set())

  // 샘플 데이터 (실제로는 API에서 가져옴)
  const mockCoins = [
    {
      coin_id: 1276,
      coin_name: "비트코인",
      symbol: "BTC",
      market: "KRW",
      currentPrice: 56000000,
      changePrice: 1250000,
      changeRate: 2.28,
      volume24h: 1234.56,
      value24h: 69120000000,
      changeDirection: "up",
      priceFormatted: "56,000,000",
      changeRateFormatted: "+2.28%",
      volumeFormatted: "691억"
    },
    {
      coin_id: 1277,
      coin_name: "이더리움",
      symbol: "ETH",
      market: "KRW",
      currentPrice: 3890000,
      changePrice: -45000,
      changeRate: -1.14,
      volume24h: 2345.67,
      value24h: 45320000000,
      changeDirection: "down",
      priceFormatted: "3,890,000",
      changeRateFormatted: "-1.14%",
      volumeFormatted: "453억"
    },
    {
      coin_id: 1278,
      coin_name: "이더리움 클래식",
      symbol: "ETC",
      market: "KRW",
      currentPrice: 32450,
      changePrice: 890,
      changeRate: 2.82,
      volume24h: 567.89,
      value24h: 18430000000,
      changeDirection: "up",
      priceFormatted: "32,450",
      changeRateFormatted: "+2.82%",
      volumeFormatted: "184억"
    },
    {
      coin_id: 1279,
      coin_name: "리플",
      symbol: "XRP",
      market: "KRW",
      currentPrice: 678,
      changePrice: -12,
      changeRate: -1.74,
      volume24h: 12345.67,
      value24h: 8370000000,
      changeDirection: "down",
      priceFormatted: "678",
      changeRateFormatted: "-1.74%",
      volumeFormatted: "83억"
    },
    {
      coin_id: 1280,
      coin_name: "비트코인 캐시",
      symbol: "BCH",
      market: "KRW",
      currentPrice: 445000,
      changePrice: 15000,
      changeRate: 3.49,
      volume24h: 890.12,
      value24h: 39600000000,
      changeDirection: "up",
      priceFormatted: "445,000",
      changeRateFormatted: "+3.49%",
      volumeFormatted: "396억"
    }
  ]

  useEffect(() => {
    // 실제로는 API 호출
    setTimeout(() => {
      setCoins(mockCoins)
      setLoading(false)
    }, 1000)
  }, [selectedMarket, sortBy])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const toggleFavorite = (coinId) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(coinId)) {
      newFavorites.delete(coinId)
      toast.success("관심 코인에서 제거되었습니다")
    } else {
      newFavorites.add(coinId)
      toast.success("관심 코인에 추가되었습니다")
    }
    setFavorites(newFavorites)
  }

  const filteredCoins = coins.filter(coin =>
    coin.coin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const SortButton = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === field && (
          sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </Button>
  )

  const CoinListItem = ({ coin }) => (
    <div className="grid grid-cols-12 gap-2 p-3 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-b-0">
      {/* 관심 등록 */}
      <div className="col-span-1 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleFavorite(coin.coin_id)}
          className="w-8 h-8 p-0 hover:bg-yellow-100"
        >
          <Star
            className={`h-4 w-4 ${
              favorites.has(coin.coin_id)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            }`}
          />
        </Button>
      </div>

      {/* 코인명 */}
      <div className="col-span-3 flex items-center">
        <div>
          <div className="font-medium text-sm">{coin.coin_name}</div>
          <div className="text-xs text-muted-foreground">{coin.symbol}</div>
        </div>
      </div>

      {/* 현재가 */}
      <div className="col-span-2 flex items-center justify-end">
        <div className="text-right">
          <div className="font-mono text-sm font-medium">{coin.priceFormatted}</div>
        </div>
      </div>

      {/* 전일대비 */}
      <div className="col-span-3 flex items-center justify-end">
        <div className="text-right">
          <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
            coin.changeDirection === "up" 
              ? "text-red-600" 
              : coin.changeDirection === "down" 
                ? "text-blue-600" 
                : "text-muted-foreground"
          }`}>
            {coin.changeDirection === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : coin.changeDirection === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            <span>{coin.changeRateFormatted}</span>
          </div>
          <div className={`text-xs ${
            coin.changeDirection === "up" 
              ? "text-red-500" 
              : coin.changeDirection === "down" 
                ? "text-blue-500" 
                : "text-muted-foreground"
          }`}>
            {coin.changeDirection === "up" ? "+" : ""}{coin.changePrice?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 거래대금 */}
      <div className="col-span-3 flex items-center justify-end">
        <div className="text-right">
          <div className="text-sm font-medium">{coin.volumeFormatted}</div>
          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
            <Volume2 className="h-3 w-3" />
            {coin.volume24h?.toFixed(2)} {coin.symbol}
          </div>
        </div>
      </div>
    </div>
  )

  const CoinListSkeleton = () => (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 p-3 animate-pulse">
          <div className="col-span-1">
            <div className="w-6 h-6 bg-muted rounded"></div>
          </div>
          <div className="col-span-3">
            <div className="h-4 bg-muted rounded w-20 mb-1"></div>
            <div className="h-3 bg-muted rounded w-12"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-muted rounded w-16 ml-auto"></div>
          </div>
          <div className="col-span-3">
            <div className="h-4 bg-muted rounded w-12 ml-auto mb-1"></div>
            <div className="h-3 bg-muted rounded w-16 ml-auto"></div>
          </div>
          <div className="col-span-3">
            <div className="h-4 bg-muted rounded w-12 ml-auto mb-1"></div>
            <div className="h-3 bg-muted rounded w-20 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">코인 목록</CardTitle>
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="코인명 또는 심볼 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* 마켓 탭 */}
        <Tabs value={selectedMarket} onValueChange={setSelectedMarket} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="KRW">원화</TabsTrigger>
            <TabsTrigger value="BTC">BTC</TabsTrigger>
            <TabsTrigger value="USDT">USDT</TabsTrigger>
            <TabsTrigger value="HOLDINGS">보유</TabsTrigger>
            <TabsTrigger value="FAVORITES">관심</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        {/* 컬럼 헤더 */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
          <div className="col-span-1"></div>
          <div className="col-span-3">
            <SortButton field="name">
              자산명
            </SortButton>
          </div>
          <div className="col-span-2 text-right">
            <SortButton field="price">
              현재가
            </SortButton>
          </div>
          <div className="col-span-3 text-right">
            <SortButton field="change_rate">
              전일대비
            </SortButton>
          </div>
          <div className="col-span-3 text-right">
            <SortButton field="volume">
              거래대금
            </SortButton>
          </div>
        </div>

        {/* 코인 목록 */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <CoinListSkeleton />
          ) : (
            <div>
              {filteredCoins.map((coin) => (
                <CoinListItem key={coin.coin_id} coin={coin} />
              ))}
              {filteredCoins.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>검색 결과가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 페이지네이션 (필요시) */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>총 {filteredCoins.length}개 코인</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                이전
              </Button>
              <span className="px-2">1 / 1</span>
              <Button variant="outline" size="sm" disabled>
                다음
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}