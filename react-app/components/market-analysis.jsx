"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Star, Activity, Globe, BarChart3 } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"
// import TradingChart from "@/components/trading-chart"
import axios from "axios"
import { useBookmark } from "@/components/bookmark-provider.jsx" // (유지)

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────
const formatNumber = (n) =>
  typeof n === "number" && isFinite(n) ? n.toLocaleString() : "-"
const formatPercent = (n, d = 2) =>
  typeof n === "number" && isFinite(n) ? `${n.toFixed(d)}%` : "-"
const formatFiat = (n, cur = "KRW") =>
  typeof n === "number" && isFinite(n)
    ? new Intl.NumberFormat("ko-KR", { style: "currency", currency: cur }).format(n)
    : "-"

// 🔢 시총 계산용 BTC 유통량(단순 상수)
const BTC_CIRCULATING_SUPPLY = 19_700_000 // ≈ 19.7M

// ✅ 상승/하락 배지 색상(상승=초록, 하락=빨강)
const badgeClass = (change) =>
  Number(change) >= 0 ? "bg-green-100 text-green-700" : "bg-red-500 text-white"

// ─────────────────────────────────────────────────────────────────────────────
// 오늘의 뉴스 요약 카드 (/news/summary 사용)
// ─────────────────────────────────────────────────────────────────────────────
function NewsSummaryCard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const sentimentClass = (s) => {
    if (s === "상승세") return "text-green-600"
    if (s === "하락세") return "text-red-600"
    return "text-black"
  }

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://127.0.0.1:8000/news/summary?limit=20")
      const data = await res.json()
      setSummary(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchSummary()
    const id = setInterval(fetchSummary, 10 * 60 * 1000) // 10분 갱신
    return () => clearInterval(id)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>📰 오늘의 뉴스 요약</CardTitle>
        <CardDescription>AI가 뽑은 핵심 포인트</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && <div>요약 불러오는 중...</div>}
        {error && <div className="text-red-500">불러오기 실패: {error}</div>}
        {!loading && !error && (
          <>
            <ul className="list-disc pl-5">
              {summary?.bullets?.map((b, i) => <li key={i}>{b}</li>)}
            </ul>

            {/* 시장 심리 / 키워드 */}
            <div className="text-xs space-y-1">
              <div className={`font-medium ${sentimentClass(summary?.sentiment)}`}>
                시장 심리: {summary?.sentiment || "-"}
              </div>
              <div className="text-muted-foreground">
                키워드: {Array.isArray(summary?.top_entities) && summary.top_entities.length
                  ? summary.top_entities.join(", ")
                  : "-"}
              </div>
            </div>

            {Array.isArray(summary?.sources) && summary.sources.length > 0 && (
              <div className="text-xs text-muted-foreground">
                출처 : {summary.sources.slice(0, 3).map((s) => s.title).join(" / ")}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export const MarketAnalysis = () => {
  const { subscribe, liveData = {} } = useWebSocket()

  // 상단 통화 토글
  const [currency, setCurrency] = useState("KRW")

  // 뉴스 목록
  const [marketNews, setMarketNews] = useState([])

  // 유저/자산 리스트(즐겨찾기 연동)
  const [user_id, setUserId] = useState(null)
  const [items, setItems] = useState([])

  // JWT → user_id 조회
  useEffect(() => {
    const tokenValue = sessionStorage.getItem("auth_token")
    if (!tokenValue) return
    try {
      const payload = JSON.parse(atob(tokenValue.split(".")[1]))
      const user_mail = payload.email || payload.sub || null
      if (user_mail) {
        fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`)
          .then((res) => res.json())
          .then((data) => { if (data && data.user_id != null) setUserId(Number(data.user_id)) })
          .catch(console.error)
      }
    } catch (e) { console.error("JWT 파싱 오류:", e) }
  }, [])

  // 뉴스(FastAPI)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/news")
      .then((res) => res.json())
      .then(setMarketNews)
      .catch(console.error)
  }, [])

  // 자산 + 북마크(마이페이지 즐겨찾기용)
  useEffect(() => {
    if (!user_id) return
    axios
      .get(`http://localhost:8080/api/Market_assets/assets_and_bookmarks`, { params: { user_id } })
      .then((res) => setItems(res.data))
      .catch(console.error)
  }, [user_id])

  // 내부 자산 심볼 → 한국어명 매핑 (상승률 1위 표기용)
  const nameMap = useMemo(() => {
    const map = {}
    items.forEach((it) => { if (it?.symbol) map[it.symbol.toUpperCase()] = it.asset_name || it.symbol })
    return map
  }, [items])

  // ───────────────────────────────────────────────────────────────────────────
  // 빗썸에서 지표 계산 (상단/중앙/하단 카드들)
  // ───────────────────────────────────────────────────────────────────────────
  const [bhStats, setBhStats] = useState({ totalVolumeKRW: null, btcDominance: null, btcPriceKRW: null, sentiment: null })
  const [extra, setExtra] = useState({ btcVolatilityPct: null, advancersRatioPct: null, top5ConcentrationPct: null, orderImbalancePct: null, momentumPct: null })
  const [leaders, setLeaders] = useState({ topGainer: null })
  const [more, setMore] = useState({ marketCapKRW: null, volatility24hPct: null, liquidityIndex: null })

  useEffect(() => {
    const fetchBithumb = async () => {
      try {
        const { data: allRes } = await axios.get("https://api.bithumb.com/public/ticker/ALL_KRW")
        const all = allRes?.data || {}
        let totalVolume = 0, btcVolume = 0, advancers = 0, decliners = 0
        const volList = [], symbols = []
        let bestGainer = { symbol: null, rate: null }

        Object.entries(all).forEach(([symbol, v]) => {
          if (symbol === "date") return
          const accVal = Number(v?.acc_trade_value_24H || 0)
          totalVolume += accVal
          volList.push(accVal)
          symbols.push(symbol)
          if (symbol === "BTC") btcVolume = accVal

          const r = parseFloat(
            v?.fluctate_rate_24H ??
            ((Number(v?.closing_price || 0) - Number(v?.prev_closing_price || 0)) / Number(v?.prev_closing_price || 1)) * 100
          )
          if (isFinite(r)) {
            if (r > 0) advancers += 1
            else if (r < 0) decliners += 1
            if (bestGainer.rate == null || r > bestGainer.rate) bestGainer = { symbol, rate: r }
          }
        })

        const btc = all?.BTC || {}
        const btcPriceKRW = Number(btc?.closing_price || 0)

        const { data: obRes } = await axios.get("https://api.bithumb.com/public/orderbook/BTC_KRW?count=50")
        const bids = obRes?.data?.bids || []
        const asks = obRes?.data?.asks || []
        const bidQty = bids.reduce((s, b) => s + Number(b.quantity || 0), 0)
        const askQty = asks.reduce((s, a) => s + Number(a.quantity || 0), 0)

        const sentiment = bidQty + askQty > 0 ? Math.round((bidQty / (bidQty + askQty)) * 100) : null
        const orderImbalancePct = bidQty + askQty > 0 ? ((bidQty - askQty) / (bidQty + askQty)) * 100 : null

        const hi = Number(btc?.max_price || 0), lo = Number(btc?.min_price || 0)
        const volPct = hi > 0 && lo > 0 ? ((hi - lo) / ((hi + lo) / 2)) * 100 : null

        const advRatio = symbols.length ? (advancers / symbols.length) * 100 : null
        volList.sort((a, b) => b - a)
        const top5 = volList.slice(0, 5).reduce((s, v) => s + v, 0)
        const top5Pct = totalVolume > 0 ? (top5 / totalVolume) * 100 : null

        const mcap = btcPriceKRW > 0 ? btcPriceKRW * BTC_CIRCULATING_SUPPLY : null
        const unitsTraded24h = Number(btc?.units_traded_24H || 0)
        const liquidityIdx = bidQty + askQty > 0 ? unitsTraded24h / (bidQty + askQty) : null
        const totalCount = advancers + decliners
        const momentumPct = totalCount > 0 ? ((advancers / totalCount) - (decliners / totalCount)) * 100 : null

        setBhStats({ totalVolumeKRW: totalVolume, btcDominance: totalVolume > 0 ? (btcVolume / totalVolume) * 100 : null, btcPriceKRW, sentiment })
        setExtra({ btcVolatilityPct: volPct, advancersRatioPct: advRatio, top5ConcentrationPct: top5Pct, orderImbalancePct, momentumPct })
        setLeaders({ topGainer: bestGainer.symbol && isFinite(bestGainer.rate) ? bestGainer : null })
        setMore({ marketCapKRW: mcap, volatility24hPct: volPct, liquidityIndex: liquidityIdx })
      } catch (e) { console.error("[Bithumb fetch error]", e) }
    }

    fetchBithumb()
    const id = setInterval(fetchBithumb, 30000)
    return () => clearInterval(id)
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // 시가총액 상위 10 (CoinGecko 직접 호출: 백엔드 수정 불필요)
  //  - StrictMode에서 초기 fetch abort가 발생할 수 있어 AbortError는 무시
  // ───────────────────────────────────────────────────────────────────────────
  const [topCap, setTopCap] = useState([])
  const [topCapError, setTopCapError] = useState(null)

  useEffect(() => {
    let unmounted = false
    const v = (currency || "KRW").toLowerCase()

    const fetchTopCap = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
        const res = await fetch(`${base}/proxy/topcap?vs=${v}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const arr = await res.json()

        if (unmounted) return
        setTopCap(arr.map(c => ({
          id: c.id,
          symbol: (c.symbol || "").toUpperCase(),
          name: c.name,
          price: c.current_price,
          market_cap: c.market_cap,
          rank: c.market_cap_rank,
          change24h: c.price_change_percentage_24h_in_currency,
          image: c.image
        })))
        setTopCapError(null)
      } catch (e) {
        if (e && (e.name === "AbortError" || String(e).includes("AbortError"))) return
        if (!unmounted) setTopCapError(e?.message || String(e))
      }
    }

    fetchTopCap()
    const id = setInterval(fetchTopCap, 60_000) // 1분 갱신
    return () => { unmounted = true; clearInterval(id) }
  }, [currency])

  // ───────────────────────────────────────────────────────────────────────────
  // ⭐ 즐겨찾기 토글 (별표 → 노란색 on/off, 마이페이지 즐겨찾기와 연동)
  // ───────────────────────────────────────────────────────────────────────────
  const BOOKMARK_API = "http://localhost:8080/api/Market_assets/bookmarks"

  const toggleBookmark = async (asset_id, is_bookmarkedRaw) => {
    const is_bookmarked = Number(is_bookmarkedRaw) === 1 // 0/1 정규화
    try {
      if (is_bookmarked) {
        // 해제
        await axios.delete(BOOKMARK_API, { params: { user_id, asset_id } })
        setItems(prev => prev.map(i =>
          i.asset_id === asset_id ? { ...i, is_bookmarked: 0 } : i
        ))
      } else {
        // 추가
        await axios.post(BOOKMARK_API, null, { params: { user_id, asset_id } })
        setItems(prev => prev.map(i =>
          i.asset_id === asset_id ? { ...i, is_bookmarked: 1 } : i
        ))
      }
    } catch (e) {
      console.error("[bookmark err]", e?.response?.status, e?.response?.data || e)
    }
  }

  // 내부 자산에서 코인 심볼 매칭해 asset_id 얻기(북마크용)
  const findAssetBySymbol = (sym) =>
    items.find(i => (i.symbol || "").toUpperCase() === (sym || "").toUpperCase())

  return (
    <div className="space-y-6">
      {/* 통화 선택 토글 */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex items-center gap-2 bg-muted/50 rounded px-3 py-1">
          <span className="text-xs font-medium">통화:</span>
          <button
            className={`px-2 py-1 bg-white rounded text-xs font-semibold ${currency === "KRW" ? "bg-primary text-black" : "bg-muted text-muted-foreground"}`}
            onClick={() => setCurrency("KRW")}
          >
            KRW
          </button>
          {/* <button
            className={`px-2 py-1 rounded text-xs font-semibold ${currency === "USD" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            onClick={() => setCurrency("USD")}
          >
            USD
          </button> */}
        </div>
      </div>

      {/* 상단 4개 카드 (빗썸 지표) */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* 1) 시장 모멘텀 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시장 모멘텀</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.momentumPct, 1)}</div>
            <p className="text-xs text-muted-foreground">상승비중 − 하락비중 (24h)</p>
          </CardContent>
        </Card>

        {/* 2) BTC 점유율 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC 점유율</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bhStats.btcDominance != null ? `${bhStats.btcDominance.toFixed(1)}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">24h 거래대금 대비 비중</p>
          </CardContent>
        </Card>

        {/* 3) BTC 현재가 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTC 현재가</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bhStats.btcPriceKRW != null ? bhStats.btcPriceKRW.toLocaleString() + " 원" : "-"}
            </div>
            <p className="text-xs text-muted-foreground">빗썸 KRW 마켓</p>
          </CardContent>
        </Card>

        {/* 4) 상승률 1위 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">상승률 1위</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaders.topGainer
                ? `${nameMap[leaders.topGainer.symbol] ?? leaders.topGainer.symbol} · ${leaders.topGainer.rate.toFixed(1)}%`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">24h 변동률 기준(ALL_KRW)</p>
          </CardContent>
        </Card>
      </div>

      {/* 중앙 4개 카드 */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* A) BTC 24h 변동성 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">BTC 24h 변동성</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.btcVolatilityPct)}</div>
            <p className="text-xs text-muted-foreground">(고가−저가)/중간값 × 100</p>
          </CardContent>
        </Card>

        {/* B) 상승 종목 비율 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">상승 종목 비율</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.advancersRatioPct, 1)}</div>
            <p className="text-xs text-muted-foreground">ALL_KRW 중 24h 상승 코인 비중</p>
          </CardContent>
        </Card>

        {/* C) 상위 5종목 집중도 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">상위 5종목 집중도</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.top5ConcentrationPct, 1)}</div>
            <p className="text-xs text-muted-foreground">Top5 24h 거래대금 / 전체</p>
          </CardContent>
        </Card>

        {/* D) BTC 자금 유입 지수 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">BTC 자금 유입 지수</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.orderImbalancePct, 1)}</div>
            <p className="text-xs text-muted-foreground">(매수잔량 − 매도잔량) / (합계) × 100 • + 매수 우위 / − 매도 우위</p>
          </CardContent>
        </Card>
      </div>

      {/* 하단 4개 카드 */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* 5) 시가총액 추정치 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">시가총액 추정치</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {more.marketCapKRW != null ? `${Math.round(more.marketCapKRW / 1e12)}조 원` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">BTC가격 × 유통량(≈ {formatNumber(BTC_CIRCULATING_SUPPLY)}개)</p>
          </CardContent>
        </Card>

        {/* 6) 주문서 매수 비중 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">주문서 매수 비중</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof bhStats.sentiment === "number" ? `${bhStats.sentiment}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">매수호가 잔량 / (매수+매도 잔량) × 100</p>
          </CardContent>
        </Card>

        {/* 7) 변동성 지표(재표시) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">변동성 지표</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(more.volatility24hPct)}</div>
            <p className="text-xs text-muted-foreground">BTC 24h 변동성 재표시</p>
          </CardContent>
        </Card>

        {/* 8) 시장 유동성(커버리지) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">시장 유동성(커버리지)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof more.liquidityIndex === "number" ? `약 ${Math.round(more.liquidityIndex)}배` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">24h 거래량(수량) ÷ 현재 주문서 총잔량 • 숫자가 클수록 유동성 풍부</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭(마켓/뉴스/분석) */}
      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">마켓</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="analysis">분석</TabsTrigger>
        </TabsList>

        {/* 마켓 */}
        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <CardTitle>시가총액 상위 10</CardTitle>
              {/* 설명 줄 제거 */}
            </CardHeader>
            <CardContent>
              {topCapError && (
                <div className="text-sm text-red-500 mb-2">
                  시가총액 랭킹 불러오기 실패: {topCapError}
                </div>
              )}

              <div className="space-y-4">
                {topCap.map((coin, idx) => {
                  const rank = coin.rank ?? (idx + 1)
                  const change = Number(coin.change24h || 0)

                  // 내부 자산과 심볼 매칭 → asset_id/즐겨찾기 상태 취득
                  const matched = findAssetBySymbol(coin.symbol)

                  return (
                    <div
                      key={coin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground w-6">#{rank}</span>
                        <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full" />
                        <div>
                          <h3 className="font-semibold">{`${coin.name} (${coin.symbol})`}</h3>
                          <p className="text-xs text-muted-foreground">
                            시가총액: {formatNumber(coin.market_cap)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-semibold">{formatFiat(coin.price, currency)}</p>
                          {/* ✅ 상승=초록, 하락=빨강 */}
                          <Badge className={badgeClass(change)}>
                            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                          </Badge>
                        </div>

                        {/* ✅ 별표: 즐겨찾기 토글 (노란색 on/off) */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!matched || !user_id}
                          title={matched ? "즐겨찾기 토글" : "내 자산 목록에 심볼 매칭 없음"}
                          onClick={() => matched && toggleBookmark(matched.asset_id, matched.is_bookmarked)}
                        >
                          <Star
                            className="h-3 w-3"
                            fill={matched && Number(matched.is_bookmarked) ? "yellow" : "none"}
                          />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
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
                      className="text-sm text-blue-500 hover:underline"
                    >
                      자세히 보기
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 분석 — 뉴스 요약 + 가격 전망(유지) */}
        <TabsContent value="analysis">
          <div className="grid md:grid-cols-2 gap-6">
            <NewsSummaryCard />
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