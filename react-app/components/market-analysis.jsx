"use client"

import { useState, useEffect, useMemo, useRef } from "react" // 🔁 추가: useRef
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Star, Activity, Globe, BarChart3 } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"
// import TradingChart from "@/components/trading-chart" // 🔧 차트 제거 유지
import axios from "axios"
import { useBookmark } from "@/components/bookmark-provider.jsx"

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────
const formatNumber = (n) =>
  typeof n === "number" && isFinite(n) ? n.toLocaleString() : "-"
const formatPercent = (n, d = 2) =>
  typeof n === "number" && isFinite(n) ? `${n.toFixed(d)}%` : "-"

// 🔢 시총 계산용 BTC 유통량(단순 상수, 필요하면 API로 교체)
const BTC_CIRCULATING_SUPPLY = 19_700_000 // ≈ 19.7M

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export const MarketAnalysis = () => {
  // 웹소켓(실시간 시세)
  const { subscribe, liveData = {} } = useWebSocket()

  // 상단 통화 토글
  const [currency, setCurrency] = useState("KRW")

  // 뉴스
  const [marketNews, setMarketNews] = useState([])

  // 유저/자산 리스트
  const [user_id, setUserId] = useState(null)
  const [items, setItems] = useState([])

  // 북마크 훅
  const { toggle_Bookmark } = useBookmark()

  // ✅ 직전 Top5 집중도 저장용(30초 전 값)  // 🔁 추가
  const top5PrevRef = useRef(null)

  // JWT에서 사용자 email 꺼내서 user_id 조회
  useEffect(() => {
    const tokenValue = sessionStorage.getItem("auth_token")
    if (!tokenValue) return
    try {
      const payload = JSON.parse(atob(tokenValue.split(".")[1]))
      const user_mail = payload.email || payload.sub || null
      if (user_mail) {
        fetch(
          `http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(
            user_mail
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.user_id != null) setUserId(Number(data.user_id))
          })
          .catch(console.error)
      }
    } catch (e) {
      console.error("JWT 파싱 오류:", e)
    }
  }, [])

  // 뉴스(FastAPI)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/news")
      .then((res) => res.json())
      .then((data) => setMarketNews(data))
      .catch((err) => console.error(err))
  }, [])

  // 자산 + 북마크 가져오기(백엔드)
  useEffect(() => {
    if (!user_id) return
    axios
      .get(`http://localhost:8080/api/Market_assets/assets_and_bookmarks`, {
        params: { user_id },
      })
      .then((res) => setItems(res.data))
      .catch(console.error)
  }, [user_id])

  // 실시간 구독
  useEffect(() => {
    if (items.length) subscribe(items.map((c) => c.symbol))
  }, [subscribe, items])

  // ✅ symbol → 한국어명 매핑 (상승률 1위 한국어 표기용)
  const nameMap = useMemo(() => {
    const map = {}
    items.forEach((it) => {
      if (it?.symbol) map[it.symbol] = it.asset_name || it.symbol
    })
    return map
  }, [items])

  // ───────────────────────────────────────────────────────────────────────────
  // 상단 4개 카드용 빗썸 실시간 지표
  //   1) 시장 모멘텀(AD 스프레드) = (상승비중 − 하락비중) × 100
  //   2) BTC 점유율(거래대금 기준)
  //   3) BTC 현재가(KRW)
  //   4) 상승률 1위(24h) — 한국어명 표기
  // ───────────────────────────────────────────────────────────────────────────
  const [bhStats, setBhStats] = useState({
    totalVolumeKRW: null,
    btcDominance: null,
    btcPriceKRW: null,
    sentiment: null, // 주문서 매수 비중(%)로 재활용
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 중앙 4개 카드(시장 구조/흐름)
  //   A) BTC 24h 변동성(%)
  //   B) 상승 종목 비율(%)
  //   C) 상위 5종목 거래대금 집중도(%)
  //   D) (교체) BTC 자금 유입 지수(%)
  // +  (추가) 시장 모멘텀(%)
  // ───────────────────────────────────────────────────────────────────────────
  const [extra, setExtra] = useState({
    btcVolatilityPct: null,
    advancersRatioPct: null,
    top5ConcentrationPct: null,
    top5ConcentrationDelta: null, // 🔁 추가: 30초 대비 변화(퍼센트포인트)
    // btcTopOfBookSpreadPct: null, // ⛔ 제거: 스프레드 카드 삭제
    orderImbalancePct: null, // (매수−매도)/(합)
    momentumPct: null,
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 리더보드(상승률 1위만 유지)
  // ───────────────────────────────────────────────────────────────────────────
  const [leaders, setLeaders] = useState({
    topGainer: null, // { symbol, rate }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // 하단 4개 카드
  //   5) 시가총액 추정치(KRW)
  //   6) (교체) 주문서 매수 비중(%)
  //   7) (교체) 공포·탐욕 지수(Fear & Greed)  // 🔁 교체
  //   8) (표기 변경) 시장 유동성 → “약 N배”
  // ───────────────────────────────────────────────────────────────────────────
  const [more, setMore] = useState({
    marketCapKRW: null,
    volatility24hPct: null,
    liquidityIndex: null, // 24h 거래량(수량) ÷ 주문서 총잔량
    fearGreedIndex: null, // 🔁 추가
    fearGreedLabel: null, // 🔁 추가
  })

  // 빗썸 API에서 모든 지표 계산
  useEffect(() => {
    const fetchBithumb = async () => {
      try {
        // 1) 전체 KRW 마켓 티커
        const { data: allRes } = await axios.get(
          "https://api.bithumb.com/public/ticker/ALL_KRW"
        )
        const all = allRes?.data || {}

        let totalVolume = 0
        let btcVolume = 0
        let advancers = 0
        let decliners = 0
        const volList = []
        const symbols = []

        // 상승률 1위 추적용
        let bestGainer = { symbol: null, rate: null }

        Object.entries(all).forEach(([symbol, v]) => {
          if (symbol === "date") return
          const accVal = Number(v?.acc_trade_value_24H || 0) // 24h 거래대금(KRW)
          totalVolume += accVal
          volList.push(accVal)
          symbols.push(symbol)

          if (symbol === "BTC") btcVolume = accVal

          // 24h 변동률
          const r = parseFloat(
            v?.fluctate_rate_24H ??
              ((Number(v?.closing_price || 0) -
                Number(v?.prev_closing_price || 0)) /
                Number(v?.prev_closing_price || 1)) *
                100
          )

          if (isFinite(r)) {
            if (r > 0) advancers += 1
            else if (r < 0) decliners += 1

            if (bestGainer.rate == null || r > bestGainer.rate) {
              bestGainer = { symbol, rate: r }
            }
          }
        })

        const btc = all?.BTC || {}
        const btcPriceKRW = Number(btc?.closing_price || 0)

        // 2) 주문서 기반 지표 (BTC)
        const { data: obRes } = await axios.get(
          "https://api.bithumb.com/public/orderbook/BTC_KRW?count=50"
        )
        const bids = obRes?.data?.bids || []
        const asks = obRes?.data?.asks || []
        const bidQty = bids.reduce((s, b) => s + Number(b.quantity || 0), 0)
        const askQty = asks.reduce((s, a) => s + Number(a.quantity || 0), 0)

        // 투자 심리(주문서 매수 비중 %)
        const sentiment =
          bidQty + askQty > 0
            ? Math.round((bidQty / (bidQty + askQty)) * 100)
            : null

        // (교체) 자금 유입 지수(%) = (매수−매도)/(합)×100
        const orderImbalancePct =
          bidQty + askQty > 0 ? ((bidQty - askQty) / (bidQty + askQty)) * 100 : null

        // 3) BTC 24h 변동성(%): (고가-저가)/중간값
        const hi = Number(btc?.max_price || 0)
        const lo = Number(btc?.min_price || 0)
        const volPct =
          hi > 0 && lo > 0 ? ((hi - lo) / ((hi + lo) / 2)) * 100 : null

        // 4) 상승 종목 비율(%)
        const advRatio = symbols.length ? (advancers / symbols.length) * 100 : null

        // 5) 상위 5종목 거래대금 집중도(%) + Δ 계산  // 🔁 추가
        volList.sort((a, b) => b - a)
        const top5 = volList.slice(0, 5).reduce((s, v) => s + v, 0)
        const top5Pct = totalVolume > 0 ? (top5 / totalVolume) * 100 : null

        let top5Delta = null // 30초 전 대비 변화(퍼센트포인트)
        if (top5PrevRef.current != null && top5Pct != null) {
          top5Delta = top5Pct - top5PrevRef.current
        }

        // 6) 시가총액 추정치 (KRW)
        const mcap =
          btcPriceKRW > 0 ? btcPriceKRW * BTC_CIRCULATING_SUPPLY : null

        // 7) 유동성 지표 (24h 거래량 ÷ 호가잔량) — 표기만 ‘배’로 바꿈
        const unitsTraded24h = Number(btc?.units_traded_24H || 0) // BTC 수량
        const liquidityIdx =
          bidQty + askQty > 0 ? unitsTraded24h / (bidQty + askQty) : null

        // 8) 시장 모멘텀(AD 스프레드)
        const totalCount = advancers + decliners
        const momentumPct =
          totalCount > 0
            ? ((advancers / totalCount) - (decliners / totalCount)) * 100
            : null

        // 🔁 추가: 공포·탐욕 지수(Fear & Greed) 외부 API
        let fearGreedIndex = null
        let fearGreedLabel = null
        try {
          const { data: fgiRes } = await axios.get("https://api.alternative.me/fng/?limit=1")
          const fgiItem = fgiRes?.data?.[0]
          fearGreedIndex = fgiItem ? Number(fgiItem.value) : null
          fearGreedLabel = fgiItem?.value_classification || null // e.g., "Extreme Fear", "Greed"
        } catch (_) {
          // 실패 시 카드에 '-' 표기
        }

        // 상태 반영
        setBhStats({
          totalVolumeKRW: totalVolume,
          btcDominance: totalVolume > 0 ? (btcVolume / totalVolume) * 100 : null,
          btcPriceKRW,
          sentiment,
        })

        setExtra({
          btcVolatilityPct: volPct,
          advancersRatioPct: advRatio,
          top5ConcentrationPct: top5Pct,
          top5ConcentrationDelta: top5Delta, // 🔁 추가
          orderImbalancePct, // (매수−매도)/(합)
          momentumPct,
        })

        setLeaders({
          topGainer:
            bestGainer.symbol && isFinite(bestGainer.rate)
              ? bestGainer
              : null,
        })

        setMore({
          marketCapKRW: mcap,
          volatility24hPct: volPct,
          liquidityIndex: liquidityIdx,
          fearGreedIndex, // 🔁 추가
          fearGreedLabel, // 🔁 추가
        })

        // 다음 주기 비교 위해 현재값 저장  // 🔁 추가
        top5PrevRef.current = top5Pct
      } catch (e) {
        console.error("[Bithumb fetch error]", e)
      }
    }

    fetchBithumb()
    const id = setInterval(fetchBithumb, 30000) // 30초마다 갱신
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      {/* 통화 선택 토글 */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex items-center gap-2 bg-muted/50 rounded px-3 py-1">
          <span className="text-xs font-medium">통화:</span>
          <button
            className={`px-2 py-1 rounded text-xs font-semibold ${
              currency === "KRW" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setCurrency("KRW")}
          >
            KRW
          </button>
          <button
            className={`px-2 py-1 rounded text-xs font-semibold ${
              currency === "USD" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setCurrency("USD")}
          >
            USD
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          상단 네모칸 4개 카드 (빗썸 API 기반)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* 1) 시장 모멘텀(AD 스프레드) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시장 모멘텀</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(extra.momentumPct, 1)}
            </div>
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

        {/* 4) 상승률 1위 — 한국어명 표기 */}
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

      {/* ───────────────────────────────────────────────────────────────────────
          중앙 4개 카드 (실시간 계산값)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* A) BTC 24h 변동성 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">BTC 24h 변동성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.btcVolatilityPct)}</div>
            <p className="text-xs text-muted-foreground">(고가−저가)/중간값 × 100</p>
          </CardContent>
        </Card>

        {/* B) 상승 종목 비율 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">상승 종목 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.advancersRatioPct, 1)}</div>
            <p className="text-xs text-muted-foreground">ALL_KRW 중 24h 상승 코인 비중</p>
          </CardContent>
        </Card>

        {/* C) 상위 5종목 집중도 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">상위 5종목 집중도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.top5ConcentrationPct, 1)}</div>
            <p className="text-xs text-muted-foreground">Top5 24h 거래대금 / 전체</p>

            {/* 🔁 추가: 30초 대비 변화(퍼센트포인트) */}
            {typeof extra.top5ConcentrationDelta === "number" && (
              <p className={`text-xs ${extra.top5ConcentrationDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {extra.top5ConcentrationDelta >= 0 ? "▲" : "▼"} {Math.abs(extra.top5ConcentrationDelta).toFixed(1)}p
              </p>
            )}
          </CardContent>
        </Card>

        {/* D) (교체) BTC 자금 유입 지수(%) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">BTC 자금 유입 지수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(extra.orderImbalancePct, 1)}</div>
            <p className="text-xs text-muted-foreground">
              (매수잔량 − 매도잔량) / (합계) × 100 &nbsp;• &nbsp;+ 매수 우위 / − 매도 우위
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          하단 4개 카드 (시총/주문서 매수비중/공포·탐욕/유동성)
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* 5) 시가총액 추정치 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">시가총액 추정치</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {more.marketCapKRW != null ? `${Math.round(more.marketCapKRW / 1e12)}조 원` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              BTC가격 × 유통량(≈ {formatNumber(BTC_CIRCULATING_SUPPLY)}개)
            </p>
          </CardContent>
        </Card>

        {/* 6) (교체) 주문서 매수 비중(%) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">주문서 매수 비중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof bhStats.sentiment === "number" ? `${bhStats.sentiment}%` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              매수호가 잔량 / (매수+매도 잔량) × 100
            </p>
          </CardContent>
        </Card>

        {/* 7) 공포·탐욕 지수(Fear & Greed)  // 🔁 교체 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">공포·탐욕 지수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof more.fearGreedIndex === "number" ? `${more.fearGreedIndex}` : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {more.fearGreedLabel ? more.fearGreedLabel : "외부 지수(API) • 0(극공포) ~ 100(극탐욕)"}
            </p>
          </CardContent>
        </Card>

        {/* 8) (표기 변경) 시장 유동성 → 약 N배 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">시장 유동성(커버리지)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof more.liquidityIndex === "number"
                ? `약 ${Math.round(more.liquidityIndex)}배`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              24h 거래량(수량) ÷ 현재 주문서 총잔량 &nbsp;• &nbsp;숫자가 클수록 유동성 풍부
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          탭(마켓/트렌드/뉴스/분석) — 기존 유지
      ─────────────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">마켓</TabsTrigger>
          <TabsTrigger value="trending">트렌드</TabsTrigger>
          <TabsTrigger value="news">뉴스</TabsTrigger>
          <TabsTrigger value="analysis">분석</TabsTrigger>
        </TabsList>

        {/* 마켓 */}
        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <CardTitle>주요 암호화폐</CardTitle>
              <CardDescription>시가총액 기준 상위 코인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.slice(0, 10).map((coin, idx) => {
                  const livePrice = liveData[coin.symbol]?.price ?? coin.price
                  const liveChange =
                    liveData[coin.symbol]?.change24h ?? coin.change_rate ?? 0
                  const rank = idx + 1

                  return (
                    <div
                      key={coin.asset_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground w-6">#{rank}</span>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{coin.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{`${coin.asset_name} (${coin.symbol})`}</h3>
                          <p className="text-sm text-muted-foreground">{coin.market}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-semibold">
                            {typeof livePrice === "number" ? livePrice.toLocaleString() : "-"}
                          </p>
                          <Badge variant={liveChange > 0 ? "default" : "destructive"}>
                            {liveChange > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {liveChange > 0 ? "+" : ""}
                            {Number(liveChange).toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          {/* ✅ 북마크 토글: asset_id 기준 */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggle_Bookmark(coin.asset_id, coin.is_bookmarked)}
                          >
                            <Star
                              className="h-3 w-3"
                              fill={Number(coin.is_bookmarked) ? "yellow" : "none"}
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 트렌드 */}
        <TabsContent value="trending">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📈 급상승 코인</CardTitle>
                <CardDescription>최근 24시간 기준 상승률 상위 코인</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { symbol: "PEPE", change: 25.8, reason: "밈코인 강세" },
                    { symbol: "SHIB", change: 18.4, reason: "커뮤니티 성장" },
                    { symbol: "FLOKI", change: 12.3, reason: "파트너십 발표" },
                  ].map((coin, i) => (
                    <div key={coin.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">#{i + 1}</span>
                        <div>
                          <p className="font-semibold">{coin.symbol}</p>
                          <p className="text-sm text-muted-foreground">{coin.reason}</p>
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
                      <span className={`font-semibold ${sector.color}`}>{sector.change}%</span>
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

        {/* 분석(더미 UI 유지) */}
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
                    <span className="font-semibold">
                      58.2 <span className="text-xs text-muted-foreground">(중립)</span>
                    </span>
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