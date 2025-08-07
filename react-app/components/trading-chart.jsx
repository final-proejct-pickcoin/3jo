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


export const TradingChart = ({ 
  symbol = "BTC/KRW", 
  height = 500, 
  realTimeData = null, 
  currentPrice = null 
}) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  
  const [timeframe, setTimeframe] = useState("1h")
  const [candleData, setCandleData] = useState([])
  const [chartType, setChartType] = useState("candlestick")
  const intervalRef = useRef(null)
  const [chartInitialized, setChartInitialized] = useState(false)

  // 초기 데이터 생성 (실제 가격 범위로 수정)
  const generateInitialData = useMemo(() => {
    const data = []
    let basePrice = currentPrice || 163000000 // 비트코인 실제 가격대
    const now = Math.floor(Date.now() / 1000)
    const timeInterval = timeframe === "1m" ? 60 : timeframe === "5m" ? 300 : timeframe === "15m" ? 900 : timeframe === "1h" ? 3600 : 86400

    for (let i = 100; i >= 0; i--) {
      const time = now - i * timeInterval
      const trend = Math.sin(i * 0.1) * 0.3 + (Math.random() - 0.5) * 0.4
      basePrice = basePrice * (1 + trend * 0.01)
      const volatility = basePrice * 0.02 // 2% 변동성
      const open = basePrice + (Math.random() - 0.5) * volatility
      const close = open + (Math.random() - 0.5) * volatility * 0.8
      const high = Math.max(open, close) + Math.random() * volatility * 0.3
      const low = Math.min(open, close) - Math.random() * volatility * 0.3
      const volume = 100 + Math.random() * 800
      
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
  }, [timeframe, currentPrice])

  // 차트 초기화
  useEffect(() => {
    const initChart = async () => {
      if (!chartContainerRef.current) return

      try {
        // 기존 차트 제거
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          candleSeriesRef.current = null
          volumeSeriesRef.current = null
        }

        const { createChart } = await import('lightweight-charts')
        
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 800,
          height: height - 200,
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333333',
          },
          grid: {
            vertLines: { color: '#f0f0f0' },
            horzLines: { color: '#f0f0f0' },
          },
          crosshair: {
            mode: 0,
          },
          timeScale: {
            borderColor: '#cccccc',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#cccccc',
            scaleMargins: {
              top: 0.1,
              bottom: 0.2,
            },
          },
        })

        chartRef.current = chart

        // 캔들스틱 시리즈
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#10b981',
          wickDownColor: '#ef4444',
          wickUpColor: '#10b981',
        })
        candleSeriesRef.current = candlestickSeries

        // 볼륨 시리즈
        const volumeSeries = chart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        })
        volumeSeriesRef.current = volumeSeries

        // 리사이즈 핸들러
        const handleResize = () => {
          if (chart && chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)
        
        setChartInitialized(true)
        console.log('✅ 차트 초기화 완료')

        return () => {
          window.removeEventListener('resize', handleResize)
        }

      } catch (error) {
        console.error('❌ 차트 초기화 오류:', error)
      }
    }

    // 약간의 지연 후 초기화 (DOM이 완전히 렌더링된 후)
    const timer = setTimeout(initChart, 100)
    
    return () => {
      clearTimeout(timer)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height])

  // 초기 데이터 설정
  useEffect(() => {
    setCandleData(generateInitialData)
  }, [generateInitialData])

  // 차트에 데이터 적용
  useEffect(() => {
    if (chartInitialized && candleSeriesRef.current && volumeSeriesRef.current && candleData.length > 0) {
      console.log('📊 차트 데이터 적용 중...', candleData.length, '개 캔들')

      const chartData = candleData.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }))

      const volumeData = candleData.map(candle => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close > candle.open ? '#10b981' : '#ef4444',
      }))

      try {
        candleSeriesRef.current.setData(chartData)
        volumeSeriesRef.current.setData(volumeData)
        console.log('✅ 차트 데이터 적용 완료')
      } catch (error) {
        console.error('❌ 차트 데이터 적용 오류:', error)
      }
    }
  }, [chartInitialized, candleData])

  // 실시간 업데이트
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    intervalRef.current = setInterval(() => {
      setCandleData(prev => {
        if (prev.length === 0) return prev
        
        const lastCandle = prev[prev.length - 1]
        const newClose = lastCandle.close * (1 + (Math.random() - 0.5) * 0.01) // 1% 변동
        const newHigh = Math.max(lastCandle.high, newClose)
        const newLow = Math.min(lastCandle.low, newClose)
        
        const updatedCandle = { 
          ...lastCandle, 
          close: newClose, 
          high: newHigh, 
          low: newLow 
        }
        
        // 실시간 업데이트
        if (candleSeriesRef.current) {
          try {
            candleSeriesRef.current.update({
              time: updatedCandle.time,
              open: updatedCandle.open,
              high: updatedCandle.high,
              low: updatedCandle.low,
              close: updatedCandle.close,
            })
          } catch (error) {
            console.error('실시간 업데이트 오류:', error)
          }
        }
        
        return [...prev.slice(0, -1), updatedCandle]
      })
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [chartInitialized])

  // 실시간 데이터 적용
  useEffect(() => {
    if (realTimeData && currentPrice && chartInitialized && candleSeriesRef.current) {
      console.log('🔄 실시간 데이터 업데이트:', realTimeData)
      
      const now = Math.floor(Date.now() / 1000)
      const realTimeCandle = {
        time: now,
        open: parseFloat(realTimeData.openPrice || currentPrice),
        high: parseFloat(realTimeData.maxPrice || currentPrice),
        low: parseFloat(realTimeData.minPrice || currentPrice),
        close: currentPrice,
      }
      
      try {
        candleSeriesRef.current.update(realTimeCandle)
      } catch (error) {
        console.error('실시간 데이터 적용 오류:', error)
      }
    }
  }, [realTimeData, currentPrice, chartInitialized])

  const timeframes = [
    { value: "1m", label: "1분" },
    { value: "5m", label: "5분" },
    { value: "15m", label: "15분" },
    { value: "1h", label: "1시간" },
    { value: "4h", label: "4시간" },
    { value: "1d", label: "1일" },
  ]

  const marketStats = useMemo(() => {
    if (realTimeData && currentPrice) {
      return {
        price: currentPrice,
        change: parseFloat(realTimeData.chgAmt || 0),
        changePercent: parseFloat(realTimeData.chgRate || 0),
        volume: `${parseFloat(realTimeData.unitsTraded || 0).toLocaleString()} ${symbol.split('/')[0]}`,
        high24h: parseInt(realTimeData.maxPrice || 44200),
        low24h: parseInt(realTimeData.minPrice || 41800),
        marketCap: "847.2B"
      }
    }
    return {
      price: currentPrice || 163172000,
      change: 1247.32,
      changePercent: 2.98,
      volume: "28,450.67 BTC",
      high24h: 163627000,
      low24h: 162916000,
      marketCap: "847.2B"
    }
  }, [realTimeData, currentPrice, symbol])

  const latestCandle = candleData[candleData.length - 1]
  const displayPrice = currentPrice || latestCandle?.close || marketStats.price
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
                <p className="text-sm text-muted-foreground">
                  {chartInitialized ? '차트 로드됨' : '차트 로딩 중...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">
                  ₩{displayPrice.toLocaleString()}
                </div>
                <div className={`text-sm flex items-center gap-1 ${priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : ''}`}> 
                  {priceChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {`${priceChange > 0 ? '+' : ''}${priceChange.toFixed(0)}`} ({`${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`})
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
            <span className="ml-1 font-semibold text-green-600">₩{marketStats.high24h.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">24h 최저:</span>
            <span className="ml-1 font-semibold text-red-600">₩{marketStats.low24h.toLocaleString()}</span>
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
            </div>
          </div>

          {/* 메인 차트 */}
          <div
            ref={chartContainerRef}
            className="relative w-full bg-background"
            style={{ 
              height: height - 200, 
              minHeight: 400,
              border: chartInitialized ? '1px solid #e5e7eb' : '1px dashed #d1d5db'
            }}
          >
            {!chartInitialized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                  <p>차트 로딩 중...</p>
                </div>
              </div>
            )}
          </div>

          {/* 차트 하단 정보 */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>실시간 연결: {chartInitialized ? '활성' : '대기'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                <span>데이터: {candleData.length}개 캔들</span>
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