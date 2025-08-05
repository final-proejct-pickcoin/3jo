// watchlist-manager.jsx 
"use client"

import { useState, useEffect } from "react"
import { getKrwRate } from "@/lib/get-krw-rate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Plus, Trash2, TrendingUp, TrendingDown, Search, Bell, Mic, MicOff } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"
//import {toggle_Bookmark, useBookmark} from "@/components/bookmark-provider.jsx"
import { useBookmark } from "@/components/bookmark-provider.jsx"

const watchlistData = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 43000,
    change: 2.5,
    alerts: [{ type: "price", condition: "above", value: 45000 }],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 1600,
    change: -1.2,
    alerts: [{ type: "price", condition: "below", value: 1500 }],
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.48,
    change: 5.2,
    alerts: [],
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    price: 7.2,
    change: -3.1,
    alerts: [{ type: "volume", condition: "above", value: "10M" }],
  },
]

const availableCoins = [
  { symbol: "LINK", name: "Chainlink", price: 15.2 },
  { symbol: "UNI", name: "Uniswap", price: 6.8 },
  { symbol: "MATIC", name: "Polygon", price: 0.92 },
  { symbol: "AVAX", name: "Avalanche", price: 38.5 },
  { symbol: "SOL", name: "Solana", price: 98.5 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.08 },
  { symbol: "DOGEJA", name: "Dogejacoin", price: 14.3 },
  { symbol: "D1", name: "Done", price: 14.3 },
  { symbol: "D2", name: "Dtwo", price: 14.3 },
  { symbol: "D3", name: "Dtree", price: 14.3 },
  { symbol: "D4", name: "Dfour", price: 14.3 },
  { symbol: "D5", name: "Dfive", price: 14.3 },
  { symbol: "D6", name: "Dsix", price: 14.3 },
  { symbol: "D7", name: "Dseven", price: 14.3 },
  { symbol: "D8", name: "Deight", price: 14.3 },
  { symbol: "D9", name: "Dnine", price: 14.3 },
  { symbol: "D10", name: "Dten", price: 14.3 },

]


const formatPrice = (price, currency, krwRate) =>
  currency === "KRW"
    ? `₩${(price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export const WatchlistManager = () => {
  
  const { toast } = useToast()
  const { subscribe, unsubscribe, marketData } = useWebSocket()
  const [searchTerm, setSearchTerm] = useState("")

  const { bookmarked,toggle_Bookmark } = useBookmark()
  // const [watchlist, setWatchlist] = useState(watchlistData)
const watchlist = [...availableCoins, ...watchlistData].filter(coin => bookmarked[coin.symbol])

  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [voiceCommand, setVoiceCommand] = useState("")
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState({})
  const [currency, setCurrency] = useState("KRW")
  const [krwRate, setKrwRate] = useState(0)
  

  useEffect(() => { getKrwRate().then(setKrwRate) }, [])
  useEffect(() => {
    const symbols = watchlist.map((item) => item.symbol)
    subscribe(symbols)
    return () => unsubscribe(symbols)
  }, [watchlist, subscribe, unsubscribe])

  const addToWatchlist = (coin) =>
    setWatchlist((prev) => prev.concat({ ...coin, change: Math.random() * 10 - 5, alerts: [] }))
  const removeFromWatchlist = (symbol) =>
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol))
  const removeAlert = (symbol, alertIndex) =>
    setWatchlist((prev) => prev.map((item) =>
      item.symbol === symbol
        ? { ...item, alerts: item.alerts.filter((_, idx) => idx !== alertIndex) }
        : item))
  const addAlert = (symbol, alert) => {
    const coin = watchlist.find((item) => item.symbol === symbol)
    if (coin && coin.alerts.length >= 3) {
      toast({ title: "알림 제한", description: "알람은 최대 3개까지 설정할 수 있어요", status: "warning" });
      return
    }
    setWatchlist((prev) => prev.map((item) =>
      item.symbol === symbol
        ? { ...item, alerts: [...item.alerts, { ...alert, value: typeof alert.value === "number" ? alert.value.toFixed(1) : alert.value }] }
        : item))
  }
  const startVoiceCommand = () => {
    setIsVoiceActive(true)
    setTimeout(() => {
      const commands = [
        "Add Bitcoin to watchlist",
        "Remove Ethereum from watchlist",
        "Set price alert for Cardano above 0.50",
        "Show me Solana price",
      ]
      const randomCommand = commands[Math.floor(Math.random() * commands.length)]
      setVoiceCommand(randomCommand)
      processVoiceCommand(randomCommand)
      setIsVoiceActive(false)
    }, 2000)
  }
  const processVoiceCommand = (command) => {
    if (command.includes("Add") && command.includes("watchlist")) {
      const coin = availableCoins.find(
        (c) => command.toLowerCase().includes(c.name.toLowerCase()) || command.toLowerCase().includes(c.symbol.toLowerCase())
      )
      if (coin && !watchlist.find((w) => w.symbol === coin.symbol)) addToWatchlist(coin)
    }
    setTimeout(() => setVoiceCommand(""), 3000)
  }
  const filteredCoins = availableCoins.filter(
    (coin) =>
      (coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !watchlist.find((w) => w.symbol === coin.symbol),
  )
  

  const bookmarkedcoins=availableCoins.filter(
    (coin)=>bookmarked[coin.symbol]
  );


  return (
    <>
      {/* 상단 알림 버튼 */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrency(currency === "KRW" ? "USD" : "KRW")}
        >
          {currency === "KRW" ? "₩" : "$"}
        </Button>
        <Button
          data-tour="notifications"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowNotificationDialog(true);
          }}
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
      {/* 알림 다이얼로그 */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>알림 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>여기서 알림 관련 안내 또는 설정 UI를 추가할 수 있습니다.</p>
            <Button className="w-full" onClick={() => setShowNotificationDialog(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* 기존 UI */}
      <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            관심코인
            <Badge variant="secondary" className="ml-auto">
              {watchlist.length}개
            </Badge>
          </CardTitle>
          <CardDescription>실시간으로 관심 있는 암호화폐를 추적하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {watchlist.map((coin) => {
              const liveData = marketData[coin.symbol]
              const currentPrice = liveData?.price || coin.price
              const currentChange = liveData?.change24h || coin.change
              return (
                <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex flex-1 items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold">{coin.symbol}</span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h3 className="font-semibold">{coin.name}</h3>
                          <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                        </div>
                        <div className="flex items-center min-w-[80px] gap-2">
                          <div className="text-right">
                            <p className="font-semibold">
                              {currency === "KRW"
                                ? `₩${(currentPrice * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                : `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            </p>
                            <div className="flex items-center justify-end">
                              {currentChange > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                              )}
                              <span className={`text-xs ${currentChange > 0 ? "text-green-500" : "text-red-500"}`}> 
                              {Number.isFinite(currentChange)
                                ? `${currentChange > 0 ? "+" : ""}${currentChange.toFixed(1)}%`
                                : "-"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Dialog
                              open={!!alertDialogOpen[coin.symbol]}
                              onOpenChange={(open) => setAlertDialogOpen((prev) => ({ ...prev, [coin.symbol]: open }))}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setAlertDialogOpen((prev) => ({ ...prev, [coin.symbol]: true }))}>
                                  <Bell className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{coin.name} 알림 설정</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>알림 종류</Label>
                                    <Select defaultValue="price">
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="price">가격 알림</SelectItem>
                                        <SelectItem value="volume">거래량 알림</SelectItem>
                                        <SelectItem value="change">변동률 알림</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>조건</Label>
                                    <Select defaultValue="above">
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="above">이상</SelectItem>
                                        <SelectItem value="below">이하</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>값</Label>
                                    <Input placeholder="값을 입력하세요" />
                                  </div>
                                  <Button
                                    onClick={() => {
                                      if (coin.alerts.length >= 3) {
                                        toast({
                                          title: "알림 제한",
                                          description: "알람은 최대 3개까지 설정할 수 있어요",
                                          status: "warning",
                                        });
                                        return;
                                      }
                                      addAlert(coin.symbol, { type: "price", condition: "above", value: currentPrice * 1.1 });
                                      setAlertDialogOpen((prev) => ({ ...prev, [coin.symbol]: false }));
                                    }}
                                    className="w-full"
                                  >
                                    알림 추가
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button size="sm" variant="outline" onClick={() => removeFromWatchlist(coin.symbol)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {Array.isArray(coin.alerts) && coin.alerts.length >= 1 && (
                        <div className="flex gap-2 mt-1">
                          {coin.alerts.map((alert, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="flex items-center justify-center text-[11px] rounded-full px-3 w-32 h-9 min-w-[110px] max-w-[180px]"
                              style={{ borderRadius: '9999px' }}
                            >{`${alert.type}${alert.condition}${alert.value}`}
                              <button
                                type="button"
                                className="mr-2 text-muted-foreground hover:text-destructive flex-shrink-0"
                                style={{ width: 'auto', height: 'auto', borderRadius: '0.375rem', padding: 0 }}
                                onClick={() => removeAlert(coin.symbol, index)}
                                aria-label="Delete alert"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <span className="truncate text-center w-full block font-medium">
                                {(() => {
                                  const typeMap = { price: '가격', volume: '거래량', change: '변동률' };
                                  const condMap = { above: '이상', below: '이하' };
                                  const t = typeMap[alert.type] || alert.type;
                                  const c = condMap[alert.condition] || alert.condition;
                                  const v = typeof alert.value === "number" ? alert.value.toFixed(1) : (Number(alert.value) ? Number(alert.value).toFixed(1) : alert.value);
                                  return `${t} ${c} ${v}`;
                                })()}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

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
          <CardTitle>관심코인 담기</CardTitle>
          <CardDescription>검색하거나 음성 명령으로 코인을 추가하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="코인 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={startVoiceCommand}
                disabled={isVoiceActive}
                className={isVoiceActive ? "voice-recording" : ""}
              >
                {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            {voiceCommand && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">Voice Command:</p>
                <p className="text-sm text-muted-foreground">"{voiceCommand}"</p>
              </div>
            )}

            {isVoiceActive && (
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <Mic className="h-6 w-6 mx-auto mb-2 text-primary voice-recording" />
                <p className="text-sm">Listening for voice command...</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredCoins.slice(0,7).map((coin) => (
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
                    {/* <Button size="sm" variant="outline" onClick={() => addToWatchlist(coin)}>
                      <Plus className="h-3 w-3" />
                    </Button> */}
                    {filteredCoins.length === 1 ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {toggle_Bookmark(coin.symbol);setSearchTerm("");}}
                      >
                        <Star className="h-3 w-3" fill={bookmarked[coin.symbol] ? "yellow" : "none"} />
                      </Button>
                      ):
                      (
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggle_Bookmark(coin.symbol)}
                      >
                        <Star className="h-3 w-3" fill={bookmarked[coin.symbol] ? "yellow" : "none"} />
                      </Button>
                      )}
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
    </>
  )
}
