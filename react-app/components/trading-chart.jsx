// trading-chart.jsx
"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Volume2, 
  BarChart3, 
  Activity,
  Maximize2,
  Settings,
  Plus
} from "lucide-react"


export const TradingChart = ({ symbol = "BTC/USDT", height = 500 }) => {
  const chartContainerRef = useRef(null)
  const [timeframe, setTimeframe] = useState("1h")
  const [indicators, setIndicators] = useState(["volume"])
  const [candleData, setCandleData] = useState([])
  const [chartType, setChartType] = useState("candlestick")
  const intervalRef = useRef(null)

  const generateInitialData = useMemo(() => {
    const data = []
    let basePrice = 43000
    const now = Math.floor(Date.now() / 1000)
    const timeInterval = timeframe === "1m" ? 60 : timeframe === "5m" ? 300 : timeframe === "15m" ? 900 : timeframe === "1h" ? 3600 : 86400
    for (let i = 100; i >= 0; i--) {
      const time = now - i * timeInterval
      const trend = Math.sin(i * 0.1) * 0.3 + (Math.random() - 0.5) * 0.4
      basePrice = basePrice * (1 + trend * 0.01)
      const volatility = 50 + Math.random() * 150
      const open = basePrice + (Math.random() - 0.5) * volatility
      const close = open + (Math.random() - 0.5) * volatility * 0.8
      const high = Math.max(open, close) + Math.random() * volatility * 0.3
      const low = Math.min(open, close) - Math.random() * volatility * 0.3
      const volume = 100 + Math.random() * 800 + Math.abs(close - open) * 5
      data.push({
        time,
        open: Math.max(low, open),
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close: Math.max(low, close),
        volume
      })
    }
    return data.sort((a, b) => a.time - b.time)
  }, [timeframe])

  useEffect(() => {
    setCandleData(generateInitialData)
  }, [generateInitialData])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCandleData(prev => {
        if (prev.length === 0) return prev
        const lastCandle = prev[prev.length - 1]
        const newClose = lastCandle.close * (1 + (Math.random() - 0.5) * 0.02)
        const newHigh = Math.max(lastCandle.high, newClose)
        const newLow = Math.min(lastCandle.low, newClose)
        const updatedCandle = { ...lastCandle, close: newClose, high: newHigh, low: newLow }
        return [...prev.slice(0, -1), updatedCandle]
      })
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // SVG 캔들스틱 차트 렌더링
  const renderCandlesticks = () => {
    if (!candleData.length) return null

    const maxPrice = Math.max(...candleData.map(d => d.high))
    const minPrice = Math.min(...candleData.map(d => d.low))
    const priceRange = maxPrice - minPrice
    const padding = 40
    const chartHeight = height - 200
    const candleWidth = Math.max(2, Math.min(12, (chartContainerRef.current?.clientWidth || 800) / candleData.length * 0.7))

    return (
      <div className="relative w-full h-full">
        <svg 
          width="100%" 
          height={chartHeight + 40} 
          className="overflow-visible"
          viewBox={`0 0 ${chartContainerRef.current?.clientWidth || 800} ${chartHeight + 40}`}
          preserveAspectRatio="none"
        >
          {/* 격자 배경 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(148, 163, 184, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 수평 가격선 */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => {
            const price = maxPrice - (priceRange * ratio)
            const y = padding + ratio * (chartHeight - padding * 2)
            return (
              <g key={index}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2="100%" 
                  y2={y} 
                  stroke="rgb(148, 163, 184, 0.3)" 
                  strokeWidth="1"
                  strokeDasharray="2,3"
                />
              </g>
            )
          })}

          {/* 캔들스틱 */}
          {candleData.map((candle, index) => {
            const containerWidth = chartContainerRef.current?.clientWidth || 800
            const x = padding + (index / (candleData.length - 1)) * (containerWidth - padding * 2)
            const openY = padding + ((maxPrice - candle.open) / priceRange) * (chartHeight - padding * 2)
            const closeY = padding + ((maxPrice - candle.close) / priceRange) * (chartHeight - padding * 2)
            const highY = padding + ((maxPrice - candle.high) / priceRange) * (chartHeight - padding * 2)
            const lowY = padding + ((maxPrice - candle.low) / priceRange) * (chartHeight - padding * 2)
            
            const isGreen = candle.close > candle.open
            const color = isGreen ? '#10b981' : '#ef4444'
            const bodyHeight = Math.abs(closeY - openY)

            return (
              <g key={index}>
                {/* 심지 */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.5"
                />
                {/* 캔들 몸체 */}
                <rect
                  x={x - candleWidth / 2}
                  y={Math.min(openY, closeY)}
                  width={candleWidth}
                  height={Math.max(bodyHeight, 1)}
                  fill={isGreen ? color : color}
                  stroke={color}
                  strokeWidth="1"
                  rx="1"
                />
              </g>
            )
          })}
        </svg>

        {/* 가격 라벨 (오른쪽) */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-10">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => {
            const price = maxPrice - (priceRange * ratio)
            return (
              <div 
                key={index} 
                className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 border rounded"
              >
                ${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const timeframes = [
    { value: "1m", label: "1분" },
    { value: "5m", label: "5분" },
    { value: "15m", label: "15분" },
    { value: "1h", label: "1시간" },
    { value: "4h", label: "4시간" },
    { value: "1d", label: "1일" },
  ]

  const marketStats = {
    price: 43156.78,
    change: 1247.32,
    changePercent: 2.98,
    volume: "28,450.67 BTC",
    high24h: 44200,
    low24h: 41800,
    marketCap: "847.2B"
  }

  const latestCandle = candleData[candleData.length - 1]
  const currentPrice = latestCandle?.close || marketStats.price
  const priceChange = latestCandle && candleData.length > 1 
    ? latestCandle.close - candleData[candleData.length - 2].close 
    : marketStats.change
  const priceChangePercent = latestCandle && candleData.length > 1
    ? ((priceChange / candleData[candleData.length - 2].close) * 100)
    : marketStats.changePercent

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">₿</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">Bitcoin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">
                  ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm flex items-center gap-1 ${priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : ''}`}> 
                  {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {`${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}`} ({`${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`})
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 시장 통계 */}
        <div className="flex items-center gap-6 text-sm border-t pt-3 mt-3">
          <div>
            <span className="text-muted-foreground">24h 거래량:</span>
            <span className="ml-1 font-semibold">{marketStats.volume}</span>
          </div>
          <div>
            <span className="text-muted-foreground">24h 최고:</span>
            <span className="ml-1 font-semibold text-green-600">${marketStats.high24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">24h 최저:</span>
            <span className="ml-1 font-semibold text-red-600">${marketStats.low24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">시가총액:</span>
            <span className="ml-1 font-semibold">${marketStats.marketCap}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t">
          {/* 차트 컨트롤 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={timeframe === tf.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf.value)}
                  className="text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2">
              <div className="flex items-center bg-muted rounded-lg p-1">
                {[
                  { value: "candlestick", label: "캔들스틱" },
                  { value: "line", label: "라인" },
                  { value: "area", label: "면적" },
                  { value: "bar", label: "막대" },
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={chartType === type.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type.value)}
                    className="text-xs h-7 px-2"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                지표 추가
              </Button>

            </div>
          </div>

          {/* 기술 지표 태그 */}
          <div className="flex items-center gap-2 p-2 px-4 bg-muted/20 border-b">
            <Badge variant="secondary" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              거래량
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              MA(20)
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              RSI
            </Badge>
          </div>

          {/* 메인 차트 */}
          <div 
            ref={chartContainerRef} 
            className="relative w-full bg-background overflow-hidden"
            style={{ height: `${height}px` }}
          >
            {renderCandlesticks()}
          </div>

          {/* 볼륨 차트 */}
          <div className="h-32 border-t bg-muted/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">거래량</span>
            </div>
            <div className="flex items-end gap-1 h-20 overflow-hidden">
              {candleData.slice(-60).map((candle, index) => {
                const isGreen = candle.close > candle.open
                const maxVolume = Math.max(...candleData.map(c => c.volume))
                const volumeHeight = Math.max(1, (candle.volume / maxVolume) * 100)
                return (
                  <div
                    key={index}
                    className={`flex-1 transition-all duration-200 ${
                      isGreen ? 'bg-green-500/70 hover:bg-green-500/90' : 'bg-red-500/70 hover:bg-red-500/90'
                    } rounded-t-sm min-w-[1px]`}
                    style={{ height: `${volumeHeight}%` }}
                    title={`거래량: ${candle.volume.toFixed(0)}`}
                  />
                )
              })}
            </div>
          </div>

          {/* 차트 하단 정보 */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>상승: 67%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span>하락: 33%</span>
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                <span>평균 거래량: 1,247 BTC</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              실시간 업데이트 • 마지막 업데이트: 방금 전
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
