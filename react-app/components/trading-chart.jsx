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
  Target,
  Zap
} from "lucide-react"

export const TradingChart = ({ 
  symbol = "BTC/KRW", 
  height = 700,
  realTimeData = null,
  currentPrice = null,
  coinInfo = null  // 새로 추가: 코인 정보 통합
}) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const smaSeriesRef = useRef(null)
  const emaSeriesRef = useRef(null)
  
  const [timeframe, setTimeframe] = useState("1h")
  const [chartType, setChartType] = useState("candlestick")
  const [chartInitialized, setChartInitialized] = useState(false)
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    volume: true,
    bollinger: false,
    rsi: false
  })
  const [crosshairData, setCrosshairData] = useState(null)
  const [showCrosshair, setShowCrosshair] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // 실시간 가격 정보 계산
  const priceInfo = useMemo(() => {
    const displayPrice = currentPrice || (realTimeData?.closePrice ? parseInt(realTimeData.closePrice) : 163800000)
    const change = realTimeData?.chgAmt ? parseInt(realTimeData.chgAmt) : 600000
    const changePercent = realTimeData?.chgRate ? parseFloat(realTimeData.chgRate) : 0.37
    const high24h = realTimeData?.maxPrice ? parseInt(realTimeData.maxPrice) : 164200000
    const low24h = realTimeData?.minPrice ? parseInt(realTimeData.minPrice) : 162000000
    const volume24h = realTimeData?.unitsTraded ? parseFloat(realTimeData.unitsTraded) : 1231.795

    return {
      displayPrice,
      change,
      changePercent,
      high24h,
      low24h,
      volume24h,
      isRealTime: !!realTimeData
    }
  }, [currentPrice, realTimeData])

  // 더 풍부한 데이터 생성 (실시간 데이터 반영)
  const generateAdvancedData = useMemo(() => {
    const data = []
    let basePrice = priceInfo.displayPrice
    const now = Date.now()
    const timeInterval = timeframe === "1m" ? 60000 : timeframe === "5m" ? 300000 : timeframe === "15m" ? 900000 : timeframe === "1h" ? 3600000 : 86400000
    
    for (let i = 200; i >= 0; i--) {
      const time = Math.floor((now - i * timeInterval) / 1000)
      
      // 더 현실적인 가격 움직임
      const trend = Math.sin(i * 0.02) * 0.5 + (Math.random() - 0.5) * 0.6
      const momentum = Math.cos(i * 0.05) * 0.3
      basePrice = basePrice * (1 + (trend + momentum) * 0.008)
      
      const volatility = basePrice * (0.015 + Math.random() * 0.01)
      const open = basePrice + (Math.random() - 0.5) * volatility * 0.5
      const close = open + (Math.random() - 0.5) * volatility * 0.8
      const high = Math.max(open, close) + Math.random() * volatility * 0.4
      const low = Math.min(open, close) - Math.random() * volatility * 0.4
      const volume = 50 + Math.random() * 500 + Math.abs(Math.sin(i * 0.1)) * 300
      
      data.push({
        time,
        open: Math.max(low, open),
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close: Math.max(low, close),
        volume
      })
    }
    
    // 마지막 캔들을 실시간 데이터로 업데이트
    if (realTimeData && data.length > 0) {
      const lastCandle = data[data.length - 1]
      lastCandle.close = priceInfo.displayPrice
      lastCandle.high = Math.max(lastCandle.high, priceInfo.displayPrice)
      lastCandle.low = Math.min(lastCandle.low, priceInfo.displayPrice)
    }
    
    return data.sort((a, b) => a.time - b.time)
  }, [timeframe, priceInfo, realTimeData])

  // 이동평균 계산
  const calculateSMA = (data, period = 20) => {
    return data.map((item, index) => {
      if (index < period - 1) return null
      const sum = data.slice(index - period + 1, index + 1).reduce((acc, curr) => acc + curr.close, 0)
      return { time: item.time, value: sum / period }
    }).filter(Boolean)
  }

  const calculateEMA = (data, period = 12) => {
    const multiplier = 2 / (period + 1)
    const ema = []
    
    data.forEach((item, index) => {
      if (index === 0) {
        ema.push({ time: item.time, value: item.close })
      } else {
        const value = (item.close - ema[index - 1].value) * multiplier + ema[index - 1].value
        ema.push({ time: item.time, value })
      }
    })
    return ema
  }

  // 차트 초기화 (표준 레이아웃: 메인 차트 + 하단 볼륨)
  useEffect(() => {
    const initChart = async () => {
      if (!window.LightweightCharts || !chartContainerRef.current) {
        setTimeout(initChart, 100)
        return
      }

      try {
        // 기존 차트 제거
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          candleSeriesRef.current = null
          volumeSeriesRef.current = null
          smaSeriesRef.current = null
          emaSeriesRef.current = null
        }

        const chart = window.LightweightCharts.createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 900,
          height: height - 120,
          layout: {
            background: { 
              type: 'solid',
              color: '#ffffff' 
            },
            textColor: '#333333',
            fontSize: 12,
          },
          grid: {
            vertLines: { 
              color: 'rgba(42, 46, 57, 0.1)',
              style: 1,
              visible: true 
            },
            horzLines: { 
              color: 'rgba(42, 46, 57, 0.1)',
              style: 1,
              visible: true 
            },
          },
          crosshair: {
            mode: 1,
            vertLine: {
              color: '#758696',
              width: 1,
              style: 3,
              visible: true,
              labelVisible: true,
            },
            horzLine: {
              color: '#758696',
              width: 1,
              style: 3,
              visible: true,
              labelVisible: true,
            },
          },
          timeScale: {
            borderColor: '#D1D4DC',
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 12,
            barSpacing: 6,
            fixLeftEdge: false,
            lockVisibleTimeRangeOnResize: true,
            rightBarStaysOnScroll: true,
            borderVisible: true,
            visible: true,
          },
          rightPriceScale: {
            borderColor: '#D1D4DC',
            autoScale: true,
            scaleMargins: {
              top: 0.05,
              bottom: indicators.volume ? 0.35 : 0.05, // 볼륨을 위한 더 많은 공간
            },
            borderVisible: true,
            entireTextOnly: false,
          },
          leftPriceScale: {
            visible: false,
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        })

        chartRef.current = chart

        // 메인 캔들스틱 시리즈 (상단 70%)
        const candlestickSeries = chart.addSeries(window.LightweightCharts.CandlestickSeries, {
          upColor: '#00C896',
          downColor: '#FF4B7D',
          borderDownColor: '#FF4B7D',
          borderUpColor: '#00C896',
          wickDownColor: '#FF4B7D',
          wickUpColor: '#00C896',
          priceFormat: {
            type: 'price',
            precision: 0,
            minMove: 1000,
          },
        })
        candleSeriesRef.current = candlestickSeries

        // 볼륨 시리즈 (하단 30% - 표준 레이아웃)
        if (indicators.volume) {
          try {
            const volumeSeries = chart.addSeries(window.LightweightCharts.HistogramSeries, {
              color: 'rgba(76, 175, 80, 0.4)',
              priceFormat: {
                type: 'volume',
              },
              priceScaleId: 'volume',
              scaleMargins: {
                top: 0.7,  // 하단 30% 영역
                bottom: 0,
              },
            })
            
            // 볼륨 전용 스케일 설정
            chart.priceScale('volume').applyOptions({
              scaleMargins: {
                top: 0.7,
                bottom: 0,
              },
            })
            
            volumeSeriesRef.current = volumeSeries
          } catch (e) {
            console.log('볼륨 시리즈 추가 실패:', e)
          }
        }

        // 데이터 설정
        candlestickSeries.setData(generateAdvancedData)

        if (volumeSeriesRef.current) {
          const volumeData = generateAdvancedData.map(candle => ({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open ? 'rgba(0, 200, 150, 0.5)' : 'rgba(255, 75, 125, 0.5)',
          }))
          volumeSeriesRef.current.setData(volumeData)
        }

        // 이동평균선 추가 (조건부)
        if (indicators.sma) {
          const smaSeries = chart.addSeries(window.LightweightCharts.LineSeries, {
            color: '#FF6B35',
            lineWidth: 2,
            title: 'SMA(20)',
          })
          const smaData = calculateSMA(generateAdvancedData, 20)
          smaSeries.setData(smaData)
          smaSeriesRef.current = smaSeries
        }

        if (indicators.ema) {
          const emaSeries = chart.addSeries(window.LightweightCharts.LineSeries, {
            color: '#4ECDC4',
            lineWidth: 2,
            title: 'EMA(12)',
          })
          const emaData = calculateEMA(generateAdvancedData, 12)
          emaSeries.setData(emaData)
          emaSeriesRef.current = emaSeries
        }

        // 크로스헤어 이벤트 (개선된 정보 표시)
        chart.subscribeCrosshairMove((param) => {
          try {
            if (param.time && param.point && candlestickSeries) {
              const candleData = param.seriesData.get(candlestickSeries)
              const volumeData = volumeSeriesRef.current ? param.seriesData.get(volumeSeriesRef.current) : null
              
              if (candleData) {
                setCrosshairData({
                  time: param.time,
                  open: candleData.open,
                  high: candleData.high,
                  low: candleData.low,
                  close: candleData.close,
                  volume: volumeData?.value || 0,
                })
                // ✅ 마우스 위치 저장
                setMousePosition({ x: param.point.x, y: param.point.y })
                setShowCrosshair(true)
              }
            } else {
              setCrosshairData(null)
              setShowCrosshair(false)
            }
          } catch (e) {
            console.log('크로스헤어 이벤트 오류:', e)
          }
        })

        // 리사이즈 핸들러
        const handleResize = () => {
          if (chart && chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            })
          }
        }

        window.addEventListener('resize', handleResize)
        
        // 차트 스타일링
        chart.timeScale().fitContent()
        
        setChartInitialized(true)
        console.log('✅ 표준 레이아웃 트레이딩 차트 초기화 완료')

        return () => {
          window.removeEventListener('resize', handleResize)
        }

      } catch (error) {
        console.error('❌ 차트 초기화 오류:', error)
      }
    }

    initChart()
    
    return () => {
      // 모든 시리즈 참조 안전하게 초기화
      if (candleSeriesRef.current) candleSeriesRef.current = null;
      if (volumeSeriesRef.current) volumeSeriesRef.current = null;
      if (smaSeriesRef.current) smaSeriesRef.current = null;
      if (emaSeriesRef.current) emaSeriesRef.current = null;
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      }
    }
  }, [height, indicators, generateAdvancedData])

  // 실시간 업데이트
  useEffect(() => {
    if (realTimeData && chartInitialized && candleSeriesRef.current) {
      const now = Math.floor(Date.now() / 1000)
      const realTimeCandle = {
        time: now,
        open: parseFloat(realTimeData.openPrice || priceInfo.displayPrice),
        high: parseFloat(realTimeData.maxPrice || priceInfo.displayPrice),
        low: parseFloat(realTimeData.minPrice || priceInfo.displayPrice),
        close: priceInfo.displayPrice,
      }
      
      try {
        candleSeriesRef.current.update(realTimeCandle)
      } catch (error) {
        console.error('실시간 데이터 적용 오류:', error)
      }
    }
  }, [realTimeData, priceInfo, chartInitialized])

  // 지표 토글
  const toggleIndicator = (indicator) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }))
  }

  const timeframes = [
    { value: "1m", label: "1분", active: timeframe === "1m" },
    { value: "5m", label: "5분", active: timeframe === "5m" },
    { value: "15m", label: "15분", active: timeframe === "15m" },
    { value: "1h", label: "1시간", active: timeframe === "1h" },
    { value: "4h", label: "4시간", active: timeframe === "4h" },
    { value: "1d", label: "1일", active: timeframe === "1d" },
  ]

  const chartTypes = [
    { value: "candlestick", label: "캔들", icon: BarChart3 },
    { value: "line", label: "라인", icon: Activity },
    { value: "area", label: "면적", icon: Target },
  ]

  return (
    <Card className="w-full h-full shadow-lg border-0">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        {/* 통합된 가격 정보 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">₿</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  {coinInfo?.name || symbol.split('/')[0]} {symbol}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={chartInitialized ? "default" : "secondary"} className="text-xs">
                    {chartInitialized ? '활성' : '로딩'}
                  </Badge>
                  {priceInfo.isRealTime && (
                    <Badge variant="outline" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      실시간
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-sm flex items-center gap-1 font-semibold ${priceInfo.change >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                  {priceInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {priceInfo.change >= 0 ? '+' : ''}{priceInfo.change.toLocaleString()} ({priceInfo.change >= 0 ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%)
                </div>
              </div>

              <div className="text-2xl font-bold font-mono text-gray-800">
                원{priceInfo.displayPrice.toLocaleString()}
              </div>
              {/* 크로스헤어 데이터 표시 (개선) */}
              {/* {crosshairData && (
                <div className="bg-white rounded-lg border p-3 shadow-sm min-w-[200px]">
                  <div className="text-xs text-gray-500 mb-1">캔들 정보</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>시가: ₩{crosshairData.open?.toLocaleString()}</div>
                    <div>고가: ₩{crosshairData.high?.toLocaleString()}</div>
                    <div>저가: ₩{crosshairData.low?.toLocaleString()}</div>
                    <div>종가: ₩{crosshairData.close?.toLocaleString()}</div>
                  </div>
                  {crosshairData.volume > 0 && (
                    <div className="text-xs mt-1 pt-1 border-t">
                      거래량: {crosshairData.volume.toFixed(2)}
                    </div>
                  )}
                </div>
              )} */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="shadow-sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="shadow-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 시장 통계 */}
        <div className="flex flex-row flex-nowrap items-center gap-4 text-xs pt-3 border-t w-full overflow-x-auto">
          <span className="text-gray-500 mx-1">24h 거래량</span>
          <span className="font-bold text-gray-800 mx-2">{priceInfo.volume24h.toLocaleString()} {symbol.split('/')[0]}</span>
          <span className="text-gray-500 mx-1">24h 최고</span>
          <span className="font-bold text-green-600 mx-2">₩{priceInfo.high24h.toLocaleString()}</span>
          <span className="text-gray-500 mx-1">24h 최저</span>
          <span className="font-bold text-red-600 mx-2">₩{priceInfo.low24h.toLocaleString()}</span>
          <span className="text-gray-500 mx-1">변동성</span>
          <span className="font-bold text-blue-600 mx-2">{Math.abs(priceInfo.changePercent).toFixed(2)}%</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-b bg-gray-50">
          {/* 차트 컨트롤 */}
          <div className="flex items-center justify-between p-3">
            {/* 타임프레임 */}
            <div className="flex items-center gap-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={tf.active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf.value)}
                  className={`text-xs h-7 px-2 ${tf.active ? 'shadow-md' : ''}`}
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            {/* 차트 타입 */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border">
              {chartTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.value}
                    variant={chartType === type.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type.value)}
                    className="text-xs h-6 px-2"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {type.label}
                  </Button>
                )
              })}
            </div>

            {/* 지표 컨트롤 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">지표:</span>
              <Button
                variant={indicators.volume ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator('volume')}
                className="text-xs h-6 px-2"
              >
                <Volume2 className="w-3 h-3 mr-1" />
                거래량
              </Button>
              <Button
                variant={indicators.sma ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator('sma')}
                className="text-xs h-6 px-2"
              >
                SMA
              </Button>
              <Button
                variant={indicators.ema ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator('ema')}
                className="text-xs h-6 px-2"
              >
                EMA
              </Button>
            </div>
          </div>
        </div>

        {/* 메인 차트 (표준 레이아웃: 상단 가격 + 하단 볼륨) */}
        <div
          ref={chartContainerRef}
          className="relative w-full bg-white"
          style={{ 
            height: height - 120, 
            minHeight: 400,
          }}
        >

          {/* ✅ 차트 내부 호버 정보 추가 */}
          {crosshairData && showCrosshair && (
            <div
              className="absolute bg-white border rounded-lg shadow-lg p-3 pointer-events-none z-10"
              style={{
                left: 12,
                bottom: 40,
                minWidth: 200
              }}
            >
              <div className="text-xs text-gray-500 mb-1">캔들 정보</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>시가: ₩{crosshairData.open?.toLocaleString()}</div>
                <div>고가: ₩{crosshairData.high?.toLocaleString()}</div>
                <div>저가: ₩{crosshairData.low?.toLocaleString()}</div>
                <div>종가: ₩{crosshairData.close?.toLocaleString()}</div>
              </div>
              {crosshairData.volume > 0 && (
                <div className="text-xs mt-1 pt-1 border-t">
                  거래량: {crosshairData.volume.toFixed(2)}
                </div>
              )}
            </div>
          )}


          {!chartInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-gray-600 font-medium">표준 차트 로딩 중...</p>
                <p className="text-gray-400 text-sm mt-1">가격 차트 + 하단 볼륨</p>
              </div>
            </div>
          )}
        </div>

        {/* 차트 하단 정보 */}
        <div className="flex items-center justify-between p-3 border-t bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priceInfo.isRealTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span>연결: {priceInfo.isRealTime ? '실시간' : '정적'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              <span>데이터: {generateAdvancedData.length}개</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>지표: {Object.values(indicators).filter(Boolean).length}개</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              표준 레이아웃 • {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}