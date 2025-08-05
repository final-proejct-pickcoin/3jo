"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star,
  Volume2,
  ChevronUp,
  ChevronDown,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { TradingChart } from "@/components/trading-chart"
import { CurrencyToggle } from "@/components/currency-toggle"

export const TradingInterface = () => {
  const [orderType, setOrderType] = useState("limit")
  const [orderSide, setOrderSide] = useState("buy")
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("KRW")
  const [selectedCoin, setSelectedCoin] = useState("BTC")
  
  // 코인 목록 관련 state
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMarket, setSelectedMarket] = useState("KRW")
  const [sortBy, setSortBy] = useState("volume")
  const [sortOrder, setSortOrder] = useState("desc")
  const [favorites, setFavorites] = useState(new Set())

  const krwRate = 1300

  // API 호출 함수
  const fetchCoins = async () => {
    try {
      setLoading(true)

      // 백엔드 API 호출
      const apiUrl = "http://localhost:8080";
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiUrl}/api/coins/list?sortBy=${sortBy}&page=0&size=50&market=${selectedMarket}&search=${searchTerm}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      // result가 배열이면 그대로, 객체면 .data 사용
      if (Array.isArray(result)) {
        setCoins(result)
        console.log('코인 목록 로드 성공:', result.length, '개')
      } else if (result.success) {
        setCoins(result.data || [])
        console.log('코인 목록 로드 성공:', result.data?.length, '개')
      } else {
        console.error('API 응답 에러:', result.error)
        toast.error(result.error || '코인 목록을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('코인 목록 조회 실패:', error)
      toast.error('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.')
      
      // 에러 시 빈 배열로 설정
      setCoins([])
    } finally {
      setLoading(false)
    }
  }

  // 검색어가 변경될 때만 0.5초 후 fetchCoins
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== ""){
        fetchCoins()
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // 컴포넌트 마운트 시(처음 렌더링 시)에도 fetchCoins 실행
  useEffect(() => {
    if (searchTerm === "") {
      fetchCoins()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 선택된 코인의 마켓 데이터 계산
  const getMarketDataFromCoin = (symbol) => {
    const coin = coins.find(c => c.symbol === symbol)
    if (coin) {
      return {
        symbol: `${coin.symbol}/${selectedMarket}`,
        price: coin.currentPrice || 0,
        changePercent: coin.changeRate || 0,
        high24h: coin.currentPrice * 1.05 || 0, // 임시 계산
        low24h: coin.currentPrice * 0.95 || 0,  // 임시 계산
        volume: coin.volume24h || 0
      }
    }

  // const toggleFavorite = (coinId) => {
  //   const newFavorites = new Set(favorites)
  //   if (newFavorites.has(coinId)) {
  //     newFavorites.delete(coinId)
  //     toast.success("관심 코인에서 제거되었습니다")
  //   } else {
  //     newFavorites.add(coinId)
  //     toast.success("관심 코인에 추가되었습니다")
  //   }
  //   setFavorites(newFavorites)
  // }

    // 기본값
    return {
      symbol: "BTC/KRW",
      price: 43100,
      changePercent: 2.98,
      high24h: 44200,
      low24h: 41800,
      volume: 28450.67
    }
  }

  const marketData = getMarketDataFromCoin(selectedCoin)

  const handlePlaceOrder = () => {
    if (!amount || (orderType !== "market" && !price)) {
      toast.error("필수 항목을 입력해주세요")
      return
    }
    toast.success(`${orderSide === 'buy' ? '매수' : '매도'} 주문이 완료되었습니다!`)
  }

  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin.symbol)
    toast.success(`${coin.coin_name} 선택됨`)
  }

  const toggleFavorite = async (coinId) => {
    try {
      // 실제 API 호출 (관심 코인 토글)
      const response = await fetch(`http://localhost:8080/api/coins/${coinId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      })

      if (response.ok) {
        const newFavorites = new Set(favorites)
        if (newFavorites.has(coinId)) {
          newFavorites.delete(coinId)
          toast.success("관심 코인에서 제거되었습니다")
        } else {
          newFavorites.add(coinId)
          toast.success("관심 코인에 추가되었습니다")
        }
        setFavorites(newFavorites)
      } else {
        toast.error("로그인이 필요합니다")
      }
    } catch (error) {
      console.error('관심 코인 토글 실패:', error)
      toast.error("관심 코인 설정에 실패했습니다")
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const filteredCoins = coins.filter(coin =>
    coin.coin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayPrice = (price) => {
    if (!price) return "0"
    
    if (currency === "KRW") {
      return `₩${Math.round(price).toLocaleString()}`
    } else {
      return `$${(price / krwRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    }
  }

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

  const CoinListItem = ({ coin, isSelected }) => (
    <div 
      className={`grid grid-cols-12 gap-2 p-2 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 cursor-pointer ${
        isSelected ? 'bg-primary/10 border-primary/20' : ''
      }`}
      onClick={() => handleCoinSelect(coin)}
    >
      {/* 관심 등록 */}
      {/* <div className="col-span-1 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(coin.coin_id)
          }}
          className="w-6 h-6 p-0 hover:bg-yellow-100"
        >
          <Star
            className={`h-3 w-3 ${
              coin.isFavorite || favorites.has(coin.coin_id)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            }`}
          />
        </Button>
      </div> */}

      {/* 코인명 */}
      <div className="col-span-4 flex items-center">
        <div>
          <div className="font-medium text-xs">{coin.coin_name || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">{coin.symbol || 'N/A'}</div>
        </div>
      </div>

      {/* 현재가 */}
      <div className="col-span-3 flex items-center justify-end">
        <div className="text-right">
          <div className="font-mono text-xs font-medium">
            {coin.priceFormatted || displayPrice(coin.currentPrice)}
          </div>
        </div>
      </div>

      {/* 전일대비 */}
      <div className="col-span-4 flex items-center justify-end">
        <div className="text-right">
          <div className={`flex items-center justify-end gap-1 text-xs font-medium ${
            (coin.changeRate || 0) > 0
              ? "text-red-600" 
              : (coin.changeRate || 0) < 0
                ? "text-blue-600" 
                : "text-muted-foreground"
          }`}>
            {(coin.changeRate || 0) > 0 ? (
              <TrendingUp className="h-2 w-2" />
            ) : (coin.changeRate || 0) < 0 ? (
              <TrendingDown className="h-2 w-2" />
            ) : null}
            <span>
              {coin.changeRateFormatted || 
               `${(coin.changeRate || 0) > 0 ? '+' : ''}${(coin.changeRate || 0).toFixed(2)}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

    const CoinListSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 p-2 animate-pulse">
          <div className="col-span-1">
            <div className="w-4 h-4 bg-muted rounded"></div>
          </div>
          <div className="col-span-4">
            <div className="h-3 bg-muted rounded w-16 mb-1"></div>
            <div className="h-2 bg-muted rounded w-8"></div>
          </div>
          <div className="col-span-3">
            <div className="h-3 bg-muted rounded w-12 ml-auto"></div>
          </div>
          <div className="col-span-4">
            <div className="h-3 bg-muted rounded w-10 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  )

  // --- orderBook 더미 데이터 추가 (실제 환경에서는 API에서 받아와야 함) ---
  const orderBook = {
    asks: [
      { price: marketData.price * 1.01, amount: 0.5, total: 0.5 },
      { price: marketData.price * 1.02, amount: 0.3, total: 0.8 },
      { price: marketData.price * 1.03, amount: 0.2, total: 1.0 },
    ],
    bids: [
      { price: marketData.price * 0.99, amount: 0.4, total: 0.4 },
      { price: marketData.price * 0.98, amount: 0.6, total: 1.0 },
      { price: marketData.price * 0.97, amount: 0.2, total: 1.2 },
    ]
  }

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
                <h3 className="font-semibold text-lg">{selectedCoin === 'BTC' ? '₿' : selectedCoin === 'ETH' ? 'Ξ' : ''} {marketData.symbol}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCoin === 'BTC' ? '비트코인' : selectedCoin === 'ETH' ? '이더리움' : selectedCoin === 'XRP' ? '리플' : '암호화폐'}
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold">{displayPrice(marketData.price)}</div>
                <div className={`text-sm flex items-center gap-1 ${marketData.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {marketData.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  전일 대비: {marketData.changePercent > 0 ? '▲' : '▼'}{displayPrice(marketData.price * Math.abs(marketData.changePercent) / 100)} ({marketData.changePercent > 0 ? '+' : ''}{marketData.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
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
                <p className="font-semibold">{marketData.volume.toLocaleString()} {selectedCoin}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
        {/* 코인 목록 */}
        <Card className="lg:row-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">코인 목록</CardTitle>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="코인 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            {/* 마켓 탭 */}
            <div className="flex gap-1">
              {['KRW', 'BTC', 'USDT'].map((market) => (
                <Button
                  key={market}
                  variant={selectedMarket === market ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMarket(market)}
                  className="flex-1 text-xs h-7"
                >
                  {market === 'KRW' ? '원화' : market}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
              <div className="col-span-1"></div>
              <div className="col-span-4">
                <SortButton field="name">자산명</SortButton>
              </div>
              <div className="col-span-3 text-right">
                <SortButton field="price">현재가</SortButton>
              </div>
              <div className="col-span-4 text-right">
                <SortButton field="change_rate">변동률</SortButton>
              </div>
            </div>

            {/* 코인 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <CoinListSkeleton />
              ) : filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => (
                  <CoinListItem 
                    key={coin.coin_id} 
                    coin={coin} 
                    isSelected={coin.symbol === selectedCoin}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">
                    {searchTerm ? '검색 결과가 없습니다.' : '코인 데이터를 불러오는 중입니다...'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Book */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">호가창 (Order Book)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 gap-2 p-4 text-xs font-medium text-muted-foreground border-b">
              <div>가격 ({currency})</div>
              <div className="text-right">수량 ({selectedCoin})</div>
              <div className="text-right">누적 수량 ({selectedCoin})</div>
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
              <Label>수량 ({selectedCoin})</Label>
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
              {orderSide === "buy" ? `${selectedCoin} 매수` : `${selectedCoin} 매도`}
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Trading Chart */}
        <div className="lg:col-span-2 lg:row-span-2">
          <TradingChart symbol={`${selectedCoin}/USDT`} height={600} />
        </div>
      </div>
    </div>
  )
}