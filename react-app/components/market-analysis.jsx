"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Star, Plus, Activity, Globe, BarChart3 } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"
import TradingChart from '@/components/trading-chart';
import {bookmarked,toggle_Bookmark, useBookmark} from "@/components/bookmark-provider.jsx"

const marketData = [
  { symbol: "BTC", name: "Bitcoin", price: 43000, change: 2.5, volume: "28.5B", marketCap: "840B", rank: 1 },
  { symbol: "ETH", name: "Ethereum", price: 1600, change: -1.2, volume: "12.3B", marketCap: "192B", rank: 2 },
  { symbol: "BNB", name: "BNB", price: 310, change: 3.8, volume: "2.1B", marketCap: "47B", rank: 3 },
  { symbol: "XRP", name: "XRP", price: 0.52, change: -0.8, volume: "1.8B", marketCap: "28B", rank: 4 },
  { symbol: "ADA", name: "Cardano", price: 0.48, change: 5.2, volume: "890M", marketCap: "17B", rank: 5 },
  { symbol: "SOL", name: "Solana", price: 98, change: 8.9, volume: "1.2B", marketCap: "42B", rank: 6 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.08, change: 15.2, volume: "2.5B", marketCap: "11B", rank: 7 },
  { symbol: "MATIC", name: "Polygon", price: 0.92, change: -2.1, volume: "450M", marketCap: "8.5B", rank: 8 },
  { symbol: "DOT", name: "Polkadot", price: 7.2, change: -3.1, volume: "320M", marketCap: "9.2B", rank: 9 },
  { symbol: "LINK", name: "Chainlink", price: 15.2, change: 1.8, volume: "680M", marketCap: "8.8B", rank: 10 },
  { symbol: "LINK", name: "Chainlink", price: 15.2, change: 1.8, volume: "680M", marketCap: "8.8B", rank: 11 },
  { symbol: "LINK", name: "Chainlink", price: 15.2, change: 1.8, volume: "680M", marketCap: "8.8B", rank: 12 },
  { symbol: "LINK", name: "Chainlink", price: 15.2, change: 1.8, volume: "680M", marketCap: "8.8B", rank: 13 },
  { symbol: "LINK", name: "Chainlink", price: 15.2, change: 1.8, volume: "680M", marketCap: "8.8B", rank: 14 },
]

const trendingCoins = [
  { symbol: "PEPE", change: 25.8, reason: "Meme coin rally" },
  { symbol: "SHIB", change: 18.4, reason: "Community growth" },
  { symbol: "FLOKI", change: 12.3, reason: "Partnership news" },
]

const marketNews = [
  {
    title: "Bitcoin ETF Approval Drives Market Rally",
    summary: "Major institutional adoption continues as Bitcoin reaches new monthly highs",
    time: "2 hours ago",
    impact: "bullish",
  },
  {
    title: "Ethereum Network Upgrade Scheduled",
    summary: "Latest upgrade promises improved scalability and reduced gas fees",
    time: "4 hours ago",
    impact: "bullish",
  },
  {
    title: "Regulatory Clarity in Europe",
    summary: "New crypto regulations provide clearer framework for institutional investors",
    time: "6 hours ago",
    impact: "neutral",
  },
]

const coinNameMap = { BTC: "비트코인", ETH: "이더리움", BNB: "비엔비", XRP: "리플", ADA: "에이다", SOL: "솔라나", DOGE: "도지코인", MATIC: "폴리곤", DOT: "폴카닷", LINK: "체인링크" }
const getKoreanCoinLabel = (symbol, name) => coinNameMap[symbol] ? `${coinNameMap[symbol]} (${symbol})` : name ? `${name} (${symbol})` : symbol
const getTrendingReason = (symbol, reason) => {
  if (symbol === "PEPE") return "밈코인 강세"
  if (symbol === "SHIB") return "커뮤니티 성장"
  if (symbol === "FLOKI") return "파트너십 발표"
  return reason
}
const formatNumber = n => typeof n === "number" ? n.toLocaleString() : n
const getBadgeVariant = v => v === "bullish" ? "default" : v === "bearish" ? "destructive" : "secondary"

export const MarketAnalysis = () => {
  const { subscribe, marketData: liveData } = useWebSocket()
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h")
  const [currency, setCurrency] = useState("KRW")

  const [marketNews, setMarketNews] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/news") // FastAPI 서버 주소
      .then(res => res.json())
      .then(data => setMarketNews(data))
      .catch(err => console.error(err))
  }, [])

  const exchangeRate = 1391
  const totalMarketCapUSD = 16800
  const totalMarketCapKRW = totalMarketCapUSD * 1e8 * exchangeRate
  const totalMarketCapKRWDisplay = `${Math.round(totalMarketCapKRW / 1e12)}조 원`
  const volumeUSD = 892
  const volumeKRW = volumeUSD * 1e8 * exchangeRate
  const volumeKRWDisplay = `${Math.round(volumeKRW / 1e12)}조 원`
  useEffect(() => { subscribe(marketData.map(coin => coin.symbol)) }, [subscribe])

  const {bookmarked,toggle_Bookmark}=useBookmark();

  return (
    <div className="space-y-6">
      {/* 통화 선택 토글 */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex items-center gap-2 bg-muted/50 rounded px-3 py-1">
          <span className="text-xs font-medium">통화:</span>
          <button
            className={`px-2 py-1 rounded text-xs font-semibold ${currency === "KRW" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            onClick={() => setCurrency("KRW")}
          >KRW</button>
          <button
            className={`px-2 py-1 rounded text-xs font-semibold ${currency === "USD" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            onClick={() => setCurrency("USD")}
          >USD</button>
        </div>
      </div>
      {/* Market Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 시가총액 ({currency})</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency === "KRW" ? totalMarketCapKRWDisplay : "1조 6,800억 달러"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+2.4%</span> (전일 대비)<br />
              {currency === "KRW" ? (
                <span className="text-muted-foreground">(1조 6,800억 달러 × 1,391원/USD 기준)</span>
              ) : null}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24시간 거래량 ({currency})</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency === "KRW" ? volumeKRWDisplay : "892억 달러"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">-5.1%</span> (전일 대비)<br />
              {currency === "KRW" ? (
                <span className="text-muted-foreground">(892억 달러 × 1,391원/USD 기준)</span>
              ) : null}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">비트코인 점유율</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">51.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+0.3%</span> (전일 대비)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">투자 심리 지수</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">52</div>
            <p className="text-xs text-muted-foreground">심리: 중립</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Chart Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <TradingChart symbol="BTC/USDT" height={600} />
        </div>
        
        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              시장 인사이트
              <Badge variant="secondary">
                <Activity className="h-3 w-3 mr-1" />
                실시간
              </Badge>
            </CardTitle>
            <CardDescription>주요 시장 지표</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">가격 목표</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">저항선</span>
                  <span className="font-semibold text-red-600">$45,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지지선</span>
                  <span className="font-semibold text-green-600">$41,800</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">기술 지표</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSI (14)</span>
                  <span className="font-semibold">58.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MACD</span>
                  <span className="font-semibold text-green-600">상승세</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이동평균선 (50)</span>
                  <span className="font-semibold">$42,150</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">거래량 분석</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">24시간 거래량</span>
                  <span className="font-semibold">28.5B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">평균 거래량</span>
                  <span className="font-semibold">24.2B</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">거래량 추이</span>
                  <span className="font-semibold text-green-600">↗ 활발</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">시장 심리</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <span className="text-xs font-semibold text-green-600">68% 매수 우위</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">마켓</TabsTrigger>
          <TabsTrigger value="trending">트렌드</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="analysis">분석</TabsTrigger>
        </TabsList>

        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <CardTitle>주요 암호화폐</CardTitle>
              <CardDescription>시가총액 기준 상위 코인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.slice(0,10).map((coin) => {
                  const livePrice = liveData[coin.symbol]?.price || coin.price
                  const liveChange = liveData[coin.symbol]?.change24h || coin.change
                  return (
                    <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground w-6">#{coin.rank}</span>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{coin.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{getKoreanCoinLabel(coin.symbol, coin.name)}</h3>
                          <p className="text-sm text-muted-foreground">{coin.symbol}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-semibold">${formatNumber(livePrice)}</p>
                          <Badge variant={liveChange > 0 ? "default" : "destructive"}>
                            {liveChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {liveChange > 0 ? "+" : ""}{liveChange.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground min-w-[80px]">
                          <p>거래량: {formatNumber(coin.volume)}</p>
                          <p>시가총액: {formatNumber(coin.marketCap)}</p>
                        </div>
                        <div className="flex gap-2">
                       
                          <Button size="sm" variant="outline" onClick={()=> toggle_Bookmark(coin.symbol)}>
                             {/* 클릭 통해 관심코인 추가시 노란별 변경/클릭시 해제와 빈 별  */}
                            <Star className="h-3 w-3" fill={bookmarked[coin.symbol]? "yellow":"none"} />
                            </Button>
                          {/* <Button size="sm" variant="outline"><Plus className="h-3 w-3" /></Button> */}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 급상승 코인</CardTitle>
                <CardDescription>최근 24시간 기준 상승률 상위 코인</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingCoins.map((coin, idx) => (
                    <div key={coin.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold">{coin.symbol}</p>
                          <p className="text-sm text-muted-foreground">{getTrendingReason(coin.symbol, coin.reason)}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">
                        <TrendingUp className="h-3 w-3 mr-1" />+{coin.change}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 시장 섹터별 성과</CardTitle>
                <CardDescription>카테고리별 수익률</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "디파이 (DeFi)", change: 8.2, color: "text-green-500" },
                    { name: "기반 블록체인 (Layer 1)", change: 3.4, color: "text-green-500" },
                    { name: "밈코인 (Meme Coins)", change: 15.7, color: "text-green-500" },
                    { name: "NFT (NFT)", change: -2.1, color: "text-red-500" },
                    { name: "게임 분야 (Gaming)", change: -0.8, color: "text-red-500" },
                  ].map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between">
                      <span className="font-medium">{sector.name}</span>
                      <span className={`font-semibold ${sector.color}`}>
                        {/* {sector.change > 0 ? "+" : ""} */}
                        {sector.change}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* 뉴스 */}
        <TabsContent value="news">
         <Card>
          <CardHeader>
      <CardTitle>📰 시장 뉴스</CardTitle>
      <CardDescription>가장 주목받는 암호화폐 이슈와 동향</CardDescription>
    </CardHeader>

    <CardContent>
      <div className="space-y-4">
        {marketNews.map((item, idx) => (
          <div key={idx} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold">{item.title}</h3>
              <Badge variant="secondary">{item.source}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{item.published_at}</p>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline">
              자세히 보기
            </a>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</TabsContent>


        <TabsContent value="analysis">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 기술적 분석</CardTitle>
                <CardDescription>주요 지표 한눈에 보기</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span>RSI (14일)</span>
                    <span className="font-semibold">58.2 <span className="text-xs text-muted-foreground">(중립)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>MACD</span>
                    <span className="font-semibold text-green-600">상승 신호(Bullish)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>이동평균선 (50일)</span>
                    <span className="font-semibold">현재 가격이 50일선 위에 위치</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>지지선</span>
                    <span className="font-medium">$41,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>저항선</span>
                    <span className="font-medium">$45,200</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎯 가격 전망</CardTitle>
                <CardDescription>AI 기반 암호화폐 시장 인사이트</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">비트코인(BTC) 7일 전망</span>
                      <Badge className="bg-green-100 text-green-700">상승세</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">예상 목표가: $46,500 ~ $48,200</p>
                    <p className="text-xs text-muted-foreground">신뢰도: 72%</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">이더리움(ETH) 7일 전망</span>
                      <Badge variant="secondary">중립</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">예상 가격 범위: $1,550 ~ $1,680</p>
                    <p className="text-xs text-muted-foreground">신뢰도: 65%</p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">📊 시장 심리</span>
                      <Badge variant="secondary">신중한 낙관론</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">소셜 미디어와 온체인 데이터 분석 결과</p>
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
