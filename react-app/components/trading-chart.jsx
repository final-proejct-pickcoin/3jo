"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/**
 * TradingView 수준의 전문 차트 컴포넌트
 * - 다양한 차트 타입 (Candlestick, Heikin Ashi, Renko 등)
 * - 고급 지표들 (MACD, Stochastic, Williams %R 등)
 * - 드로잉 도구 지원
 * - 볼륨 프로파일
 * - 멀티 타임프레임
 */
function TradingChart({
  symbol = "BTC/KRW",
  koreanName = "",
  height = 680,
  theme = "light",
  currentPrice = null,
  initialTimeframe = '1h',
  initialPriceInfo = { displayPrice: 0 },
  onPriceUpdate = null
}) {
  // State declarations
  // Timeframe options (must be declared at the top, before any JSX usage)
  const timeframes = [
    { value: '1m', label: '1분' },
    { value: '5m', label: '5분' },
    { value: '15m', label: '15분' },
    { value: '1h', label: '1시간' },
    { value: '4h', label: '4시간' },
    { value: '1d', label: '1일' },
    { value: '1w', label: '1주' }
  ];
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [chartType, setChartType] = useState("candlestick");
  const [crosshair, setCrosshair] = useState(null);
  const [ready, setReady] = useState(false);

  const [showIndicators, setShowIndicators] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [volumeProfile, setVolumeProfile] = useState(false);
  const [bithumbInfo, setBithumbInfo] = useState({ changeAmount: 0, changeRate: 0, isUp: true });
  const [indicators, setIndicators] = useState({
    volume: true, sma: false, ema: false, bollinger: false, rsi: false, macd: false, stochastic: false, williams: false, atr: false, vwap: false,
  });
  const [bithumbCandles, setBithumbCandles] = useState([]);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
//test
  // Ref declarations
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorRefs = useRef({});
  const priceLineRef = useRef(null);
  const didInitialScroll = useRef(false);
  const drawingPoints = useRef({ start: null }); // 드로잉 도구용 포인트 저장
  const drawingLines = useRef([]); // 그려진 선들 저장

  // Memoized palette
  const palette = useMemo(() => {
    // 한국식: 상승(빨강), 하락(파랑)
    const light = {
      bg: "#ffffff", text: "#2D3748", grid: "rgba(0,0,0,0.05)", up: "#FF6B8A", down: "#4F9CF9", volUp: "rgba(255, 0, 64, 0.22)", volDown: "rgba(0, 64, 255, 0.42)", axis: "#E2E8F0", accent: "#4F9CF9",
    };
    const dark = {
      bg: "#0D1421", text: "#E2E8F0", grid: "rgba(255,255,255,0.04)", up: "#FF8FA3", down: "#6BB6FF", volUp: "rgba(255, 0, 64, 0.28)", volDown: "rgba(0, 64, 255, 0.58)", axis: "#2D3748", accent: "#63B3ED",
    };
    return theme === "dark" ? dark : light;
  }, [theme]);

  // Memoized price info
  const priceInfo = useMemo(() => {
    // 빗썸 데이터에서 현재가 가져오기
    let displayPrice = currentPrice;
    
    // currentPrice가 없거나 0이면 빗썸 데이터에서 가져오기
    if (!displayPrice || displayPrice === 0) {
      // bithumbCandles에서 마지막 캔들의 종가 사용
      if (bithumbCandles.length > 0) {
        const lastCandle = bithumbCandles[bithumbCandles.length - 1];
        displayPrice = lastCandle.close;
      }
    }
    
    // 여전히 없으면 기본값 사용
    if (!displayPrice || displayPrice === 0) {
      displayPrice = 163_800_000;
    }
    
    const change = bithumbInfo.changeAmount || 600_000;
    const changePercent = bithumbInfo.changeRate || 0.37;
    const high24h = displayPrice * 1.02; // 2% 상승
    const low24h = displayPrice * 0.98;  // 2% 하락
    const volume24h = 1231.795;
    
    return { 
      displayPrice, 
      change, 
      changePercent, 
      high24h, 
      low24h, 
      volume24h, 
      isRealTime: bithumbCandles.length > 0 
    };
  }, [currentPrice, bithumbCandles, bithumbInfo, bithumbCandles.length > 0 ? bithumbCandles[bithumbCandles.length - 1]?.close : 0]);

  // Effects
  useEffect(() => {
    let ignore = false;
    async function fetchBithumb() {
      const market = symbol.replace("/", "_").toLowerCase();
      try {
        const res = await fetch(`https://api.bithumb.com/public/ticker/${market}`);
        const data = await res.json();
        if (data.status === "0000" && data.data) {
          const changeAmount = Number(data.data.fluctate_24H);
          const changeRate = Number(data.data.fluctate_rate_24H);
          const isUp = data.data.fluctate_24H[0] !== "-";
          const currentPrice = Number(data.data.closing_price);
          
          // Only update state if values actually changed to avoid infinite loop
          setBithumbInfo(prev => {
            if (
              prev.changeAmount === changeAmount &&
              prev.changeRate === changeRate &&
              prev.isUp === isUp
            ) {
              return prev;
            }
            return { changeAmount, changeRate, isUp };
          });
          
                     // 현재가가 있으면 props로 전달된 currentPrice 업데이트
           if (currentPrice > 0 && !ignore) {
             // 부모 컴포넌트에 현재가 업데이트 알림
             if (typeof onPriceUpdate === 'function') {
               onPriceUpdate(currentPrice);
             }
           }
           
           // 실시간 가격 정보 업데이트
           setBithumbInfo(prev => ({
             ...prev,
             currentPrice: currentPrice
           }));
        }
      } catch {}
    }
         fetchBithumb();
    const interval = setInterval(fetchBithumb, 2000); // 2초마다 업데이트 (성능 개선)
     return () => { ignore = true; clearInterval(interval); };
  }, [symbol, onPriceUpdate]);

  useEffect(() => {
    let ignore = false;
    async function fetchCandles() {
      setIsLoadingCandles(true);
      const market = symbol.replace("/", "_").toLowerCase();
      let chartInterval = timeframe;
      const intervalMap = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '24h', '1w': '1w' };
      chartInterval = intervalMap[timeframe] || '1h';
      try {
        const apiUrl = `https://api.bithumb.com/public/candlestick/${market}/${chartInterval}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (data.status === "0000" && Array.isArray(data.data)) {
          const candles = data.data.map(arr => ({
            time: Math.floor(Number(arr[0]) / 1000), open: Number(arr[1]), close: Number(arr[2]), high: Number(arr[3]), low: Number(arr[4]), volume: Number(arr[5])
          })).filter(candle => candle.time > 0 && candle.open > 0).sort((a, b) => a.time - b.time);
          if (!ignore && candles.length > 0) setBithumbCandles(candles);
        }
      } catch {}
      finally { if (!ignore) setIsLoadingCandles(false); }
    }
    fetchCandles();
    const interval = setInterval(fetchCandles, 30000);
    return () => { ignore = true; clearInterval(interval); };
  }, [symbol, timeframe]);

  // Memoized candles - 성능 최적화
  const candles = useMemo(() => {
    if (bithumbCandles.length > 0 && !isLoadingCandles) {
      // 오직 실제 bithumbCandles 데이터만 반환
      return bithumbCandles;
    }
    
    // 간단한 더미 데이터 (50개로 줄임, 복잡한 계산 제거)
    console.log('⚠️ 빗썸 데이터 없음, 간단한 더미 데이터 사용');
    const out = [];
    let base = (currentPrice || 163800000) * 0.99;
    const now = Date.now();
    const ms = 3600000; // 1시간 고정
    
    for (let i = 50; i >= 0; i--) { // 100개에서 50개로 줄임
      const t = Math.floor((now - i * ms) / 1000);
      const change = (Math.sin(i * 0.1) * 0.01); // 단순화된 변동
      const price = base * (1 + change);
      const spread = price * 0.002;
      
      out.push({ 
        time: t, 
        open: Math.round(price), 
        high: Math.round(price + spread), 
        low: Math.round(price - spread), 
        close: Math.round(price), 
        volume: 100 + (i % 10) * 50 // 단순한 거래량
      });
    }
    
    return out.sort((a, b) => a.time - b.time);
  }, [bithumbCandles, isLoadingCandles, currentPrice]);

  // ✅ 최초 스크롤 제어 useEffect들을 candles 선언 이후에 배치
  useEffect(() => {
    didInitialScroll.current = false;
  }, [symbol, timeframe]);

  // 고급 지표 계산 함수들
  const calcSMA = useCallback((data, period = 20) => {
    const res = [];
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i].close;
      if (i >= period) sum -= data[i - period].close;
      if (i >= period - 1) res.push({ time: data[i].time, value: sum / period });
    }
    return res;
  }, []);

  const calcEMA = useCallback((data, period = 12) => {
    if (!data.length) return [];
    const k = 2 / (period + 1);
    const out = [];
    let prev = data[0].close;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i].close - prev) * k + prev;
      out.push({ time: data[i].time, value: val });
      prev = val;
    }
    return out;
  }, []);

  const calcMACD = useCallback((data, fast = 12, slow = 26, signal = 9) => {
    const emaFast = calcEMA(data, fast);
    const emaSlow = calcEMA(data, slow);
    const macdLine = emaFast.map((fast, i) => ({
      time: fast.time,
      value: fast.value - (emaSlow[i]?.value || 0)
    }));
    const signalLine = calcEMA(macdLine, signal);
    
    return macdLine.map((macd, i) => ({
      time: macd.time,
      macd: macd.value,
      signal: signalLine[i]?.value || 0,
      histogram: macd.value - (signalLine[i]?.value || 0)
    }));
  }, [calcEMA]);

  const calcStochastic = useCallback((data, k = 14, d = 3) => {
    const result = [];
    for (let i = k - 1; i < data.length; i++) {
      const segment = data.slice(i - k + 1, i + 1);
      const highest = Math.max(...segment.map(c => c.high));
      const lowest = Math.min(...segment.map(c => c.low));
      const close = data[i].close;
      
      const kValue = ((close - lowest) / (highest - lowest)) * 100;
      const recent = result.slice(-d + 1);
      const dValue = recent.length ? 
        (recent.reduce((sum, item) => sum + item.k, 0) + kValue) / (recent.length + 1) : kValue;
      
      result.push({
        time: data[i].time,
        k: kValue,
        d: dValue
      });
    }
    return result;
  }, []);

  const calcWilliamsR = useCallback((data, period = 14) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const segment = data.slice(i - period + 1, i + 1);
      const highest = Math.max(...segment.map(c => c.high));
      const lowest = Math.min(...segment.map(c => c.low));
      const close = data[i].close;
      const williamsR = ((highest - close) / (highest - lowest)) * -100;
      result.push({
        time: data[i].time,
        value: williamsR
      });
    }
    return result;
  }, []);

  const calcATR = useCallback((data, period = 14) => {
    const trueRanges = [];
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push({ time: data[i].time, value: tr });
    }
    
    const result = [];
    let sum = 0;
    for (let i = 0; i < trueRanges.length; i++) {
      sum += trueRanges[i].value;
      if (i >= period) sum -= trueRanges[i - period].value;
      if (i >= period - 1) {
        result.push({
          time: trueRanges[i].time,
          value: sum / period
        });
      }
    }
    return result;
  }, []);

  const calcVWAP = useCallback((data) => {
    const result = [];
    let cumulativeVolPrice = 0;
    let cumulativeVolume = 0;
    
    for (let i = 0; i < data.length; i++) {
      const typical = (data[i].high + data[i].low + data[i].close) / 3;
      cumulativeVolPrice += typical * data[i].volume;
      cumulativeVolume += data[i].volume;
      
      result.push({
        time: data[i].time,
        value: cumulativeVolPrice / cumulativeVolume
      });
    }
    return result;
  }, []);

  const calcBollinger = useCallback((data, period = 20, mult = 2) => {
    if (!data.length) return { upper: [], lower: [], middle: [] };
    const sma = calcSMA(data, period);
    const upper = [];
    const lower = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const seg = data.slice(i - period + 1, i + 1).map(d => d.close);
      const mean = sma[i - (period - 1)].value;
      const variance = seg.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      upper.push({ time: data[i].time, value: mean + mult * std });
      lower.push({ time: data[i].time, value: mean - mult * std });
    }
    
    return { upper, lower, middle: sma };
  }, [calcSMA]);

  const calcRSI = useCallback((data, period = 14) => {
    const out = [];
    if (data.length < period + 1) return out;
    
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const ch = data[i].close - data[i - 1].close;
      if (ch >= 0) gains += ch; else losses -= ch;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const ch = data[i].close - data[i - 1].close;
      const gain = Math.max(0, ch);
      const loss = Math.max(0, -ch);
      
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      
      out.push({ time: data[i].time, value: rsi });
    }
    return out;
  }, []);

  // Heikin Ashi 변환
  const transformToHeikinAshi = useCallback((data) => {
    const result = [];
    let prevHA = { open: data[0].open, close: data[0].close };
    
    data.forEach((candle, i) => {
      const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
      const haOpen = i === 0 ? candle.open : (prevHA.open + prevHA.close) / 2;
      const haHigh = Math.max(candle.high, haOpen, haClose);
      const haLow = Math.min(candle.low, haOpen, haClose);
      
      result.push({
        time: candle.time,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
      });
      
      prevHA = { open: haOpen, close: haClose };
    });
    
    return result;
  }, []);

  // 차트 생성 메인 useEffect - 성능 최적화
  useEffect(() => {
    let mounted = true;
    
    async function boot() {
      if (!containerRef.current) return;
      if (typeof window === 'undefined') return;
      
      // LightweightCharts 로드 대기 및 동적 import
      let LW = window.LightweightCharts;
      if (!LW) {
        try {
          const module = await import('lightweight-charts');
          LW = module.createChart ? module : module.default;
          window.LightweightCharts = LW;
        } catch (error) {
          console.error('LightweightCharts 로드 실패:', error);
          return;
        }
      }
      
      if (!LW || !mounted) return;

      // 기존 차트 정리
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
      }

      // 차트 생성 - 성능 최적화 옵션
      const chart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth || 900,
        height: Math.max(500, height - (showIndicators ? 200 : 120)),
        layout: { 
          background: { type: "solid", color: palette.bg }, 
          textColor: palette.text, 
          fontSize: 13,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        },
        grid: { 
          vertLines: { color: palette.grid }, 
          horzLines: { color: palette.grid } 
        },
        rightPriceScale: {
          borderColor: palette.axis,
          scaleMargins: { 
            top: 0.05, 
            bottom: Object.values(indicators).some(Boolean) ? 0.3 : 0.05
          },
          autoScale: true,
          visible: true,
          entireTextOnly: false,
        },
        timeScale: { 
          borderColor: palette.axis, 
          timeVisible: true, 
          secondsVisible: ["1m", "5m"].includes(timeframe),
          rightOffset: 2,
          barSpacing: 7,
          minBarSpacing: 6,
          fixLeftEdge: false,
          fixRightEdge: false,
          autoScale: false,
        },
        crosshair: {
          mode: 1,
          vertLine: { color: palette.accent, style: 1, width: 1, labelVisible: true },
          horzLine: { color: palette.accent, style: 1, width: 1, labelVisible: true },
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, pinch: true, mouseWheel: true },
        // 성능 최적화 옵션 추가
        watermark: { visible: false },
        leftPriceScale: { visible: false },
      });

      chartRef.current = chart;


      // 메인 시리즈 생성
      let seriesData = candles;
      if (chartType === "heikin-ashi") {
        seriesData = transformToHeikinAshi(candles);
      }

      // 캔들 데이터가 없으면 차트 생성 중단
      if (!seriesData || seriesData.length === 0) {
        console.warn('캔들 데이터가 없습니다.');
        return;
      }

  // ✅ 틱 차트: 차트 타입에 따라 봉/라인/에어리어 모두 지원
  // 데이터 세팅 후 항상 오른쪽 끝에 고정
      if (timeframe === 'tick') {
        if (["candlestick", "heikin-ashi"].includes(chartType)) {
          priceSeriesRef.current = chart.addCandlestickSeries({
            upColor: palette.up,
            downColor: palette.down,
            borderUpColor: palette.up,
            borderDownColor: palette.down,
            wickUpColor: palette.up,
            wickDownColor: palette.down,
            priceFormat: { type: "price", precision: 0, minMove: 1000 },
          });
          priceSeriesRef.current.setData(
            candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
          );
        } else if (chartType === "line") {
          priceSeriesRef.current = chart.addLineSeries({ 
            color: palette.accent, 
            lineWidth: 2,
            priceFormat: { type: "price", precision: 0, minMove: 1000 }
          });
          priceSeriesRef.current.setData(
            candles.map(({ time, close }) => ({ time, value: close }))
          );
        } else if (chartType === "area") {
          priceSeriesRef.current = chart.addAreaSeries({
            topColor: `${palette.accent}40`,
            bottomColor: `${palette.accent}08`,
            lineColor: palette.accent,
            lineWidth: 2,
            priceFormat: { type: "price", precision: 0, minMove: 1000 }
          });
          priceSeriesRef.current.setData(
            candles.map(({ time, close }) => ({ time, value: close }))
          );
        }
      } else if (["candlestick", "heikin-ashi"].includes(chartType)) {
        priceSeriesRef.current = chart.addCandlestickSeries({
          upColor: palette.up,
          downColor: palette.down,
          borderUpColor: palette.up,
          borderDownColor: palette.down,
          wickUpColor: palette.up,
          wickDownColor: palette.down,
          priceFormat: { type: "price", precision: 0, minMove: 1000 },
        });
        priceSeriesRef.current.setData(
          seriesData.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }))
        );
      } else if (chartType === "line") {
        priceSeriesRef.current = chart.addLineSeries({ 
          color: palette.accent, 
          lineWidth: 2,
          priceFormat: { type: "price", precision: 0, minMove: 1000 }
        });
        priceSeriesRef.current.setData(
          candles.map(({ time, close }) => ({ time, value: close }))
        );
      } else if (chartType === "area") {
        priceSeriesRef.current = chart.addAreaSeries({
          topColor: `${palette.accent}40`,
          bottomColor: `${palette.accent}08`,
          lineColor: palette.accent,
          lineWidth: 2,
          priceFormat: { type: "price", precision: 0, minMove: 1000 }
        });
        priceSeriesRef.current.setData(
          candles.map(({ time, close }) => ({ time, value: close }))
        );
      }

      // 현재가 라인
      if (priceSeriesRef.current) {
        priceLineRef.current = priceSeriesRef.current.createPriceLine({
          price: priceInfo.displayPrice,
          color: palette.accent,
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "현재가",
        });
      }

      // 지표들 추가
      if (indicators.volume) {
        volumeSeriesRef.current = chart.addHistogramSeries({
          priceScaleId: "volume",
          priceFormat: { type: "volume" },
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        volumeSeriesRef.current.setData(
          candles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? palette.volUp : palette.volDown,
          }))
        );
      }

      if (indicators.sma) {
        indicatorRefs.current.sma = chart.addLineSeries({ 
          color: "#F59E0B", 
          lineWidth: 2,
          title: "SMA(20)"
        });
        indicatorRefs.current.sma.setData(calcSMA(candles, 20));
      }

      if (indicators.ema) {
        indicatorRefs.current.ema = chart.addLineSeries({ 
          color: "#10B981", 
          lineWidth: 2,
          title: "EMA(12)"
        });
        indicatorRefs.current.ema.setData(calcEMA(candles, 12));
      }

      if (indicators.bollinger) {
        const { upper, lower, middle } = calcBollinger(candles, 20, 2);
        indicatorRefs.current.bbUpper = chart.addLineSeries({ 
          color: "#8B5CF6", 
          lineWidth: 1,
          title: "BB Upper"
        });
        indicatorRefs.current.bbLower = chart.addLineSeries({ 
          color: "#8B5CF6", 
          lineWidth: 1,
          title: "BB Lower"
        });
        indicatorRefs.current.bbMiddle = chart.addLineSeries({ 
          color: "#8B5CF6", 
          lineWidth: 1,
          lineStyle: 2,
          title: "BB Middle"
        });
        indicatorRefs.current.bbUpper.setData(upper);
        indicatorRefs.current.bbLower.setData(lower);
        indicatorRefs.current.bbMiddle.setData(middle);
      }

      if (indicators.rsi) {
        indicatorRefs.current.rsi = chart.addLineSeries({ 
          priceScaleId: "rsi", 
          color: "#06B6D4", 
          lineWidth: 2,
          title: "RSI(14)"
        });
        chart.priceScale("rsi").applyOptions({ 
          scaleMargins: { top: 0.85, bottom: 0.05 },
          mode: 1,
          invertScale: false,
          alignLabels: true,
          borderVisible: false,
          ticksVisible: true,
          entireTextOnly: false,
        });
        const rsi = calcRSI(candles, 14);
        indicatorRefs.current.rsi.setData(rsi);
        
        // RSI 기준선들
        indicatorRefs.current.rsi70 = indicatorRefs.current.rsi.createPriceLine({ 
          price: 70, 
          color: "#EF4444", 
          lineStyle: 2, 
          lineWidth: 1, 
          title: "70" 
        });
        indicatorRefs.current.rsi30 = indicatorRefs.current.rsi.createPriceLine({ 
          price: 30, 
          color: "#10B981", 
          lineStyle: 2, 
          lineWidth: 1, 
          title: "30" 
        });
      }

      if (indicators.macd) {
        const macdData = calcMACD(candles);
        
        indicatorRefs.current.macdLine = chart.addLineSeries({
          priceScaleId: "macd",
          color: "#3B82F6",
          lineWidth: 2,
          title: "MACD"
        });
        indicatorRefs.current.macdSignal = chart.addLineSeries({
          priceScaleId: "macd",
          color: "#EF4444",
          lineWidth: 2,
          title: "Signal"
        });
        indicatorRefs.current.macdHistogram = chart.addHistogramSeries({
          priceScaleId: "macd",
          color: "#10B981",
          title: "Histogram"
        });
        
        chart.priceScale("macd").applyOptions({ 
          scaleMargins: { top: 0.85, bottom: 0.05 }
        });
        
        indicatorRefs.current.macdLine.setData(macdData.map(d => ({ time: d.time, value: d.macd })));
        indicatorRefs.current.macdSignal.setData(macdData.map(d => ({ time: d.time, value: d.signal })));
        indicatorRefs.current.macdHistogram.setData(macdData.map(d => ({ 
          time: d.time, 
          value: d.histogram,
          color: d.histogram >= 0 ? "#10B981" : "#EF4444"
        })));
      }

      if (indicators.stochastic) {
        const stochData = calcStochastic(candles);
        
        indicatorRefs.current.stochK = chart.addLineSeries({
          priceScaleId: "stoch",
          color: "#F59E0B",
          lineWidth: 2,
          title: "%K"
        });
        indicatorRefs.current.stochD = chart.addLineSeries({
          priceScaleId: "stoch",
          color: "#EF4444",
          lineWidth: 2,
          title: "%D"
        });
        
        chart.priceScale("stoch").applyOptions({ 
          scaleMargins: { top: 0.85, bottom: 0.05 }
        });
        
        indicatorRefs.current.stochK.setData(stochData.map(d => ({ time: d.time, value: d.k })));
        indicatorRefs.current.stochD.setData(stochData.map(d => ({ time: d.time, value: d.d })));
      }

      if (indicators.williams) {
        const williamsData = calcWilliamsR(candles);
        
        indicatorRefs.current.williams = chart.addLineSeries({
          priceScaleId: "williams",
          color: "#8B5CF6",
          lineWidth: 2,
          title: "Williams %R"
        });
        
        chart.priceScale("williams").applyOptions({ 
          scaleMargins: { top: 0.85, bottom: 0.05 }
        });
        
        indicatorRefs.current.williams.setData(williamsData);
      }

      if (indicators.atr) {
        const atrData = calcATR(candles);
        
        indicatorRefs.current.atr = chart.addLineSeries({
          priceScaleId: "atr",
          color: "#F97316",
          lineWidth: 2,
          title: "ATR(14)"
        });
        
        chart.priceScale("atr").applyOptions({ 
          scaleMargins: { top: 0.85, bottom: 0.05 }
        });
        
        indicatorRefs.current.atr.setData(atrData);
      }

      if (indicators.vwap) {
        const vwapData = calcVWAP(candles);
        
        indicatorRefs.current.vwap = chart.addLineSeries({
          color: "#DC2626",
          lineWidth: 2,
          lineStyle: 2,
          title: "VWAP"
        });
        
        indicatorRefs.current.vwap.setData(vwapData);
      }

      // 크로스헤어 이벤트
      chart.subscribeCrosshairMove((param) => {
        if (!param?.time || !priceSeriesRef.current) return setCrosshair(null);
        const d = param.seriesData.get(priceSeriesRef.current);
        if (!d) return setCrosshair(null);
        
        setCrosshair({
          time: param.time,
          open: d.open ?? d.value,
          high: d.high,
          low: d.low,
          close: d.close ?? d.value,
        });
      });


      // 차트가 완전히 준비되었는지 확인
      if (chart && chart.timeScale && chart.priceScale) {
      setReady(true);
        console.log('✅ 차트 초기화 완료 - 드로잉 도구 사용 가능');
      } else {
        console.warn('⚠️ 차트 초기화 실패 - 스케일이 준비되지 않음');
        setReady(false);
      }

      // 차트를 오른쪽 끝으로 스크롤
      if (chart && !didInitialScroll.current) {
        setTimeout(() => {
          try {
            chart.timeScale().scrollToPosition(0, false);
            didInitialScroll.current = true;
          } catch (error) {
            console.log('차트 스크롤 실패:', error);
          }
        }, 100);
      }

      // 반응형 처리
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current && chartRef.current) {
            const { width } = entry.contentRect;
            chartRef.current.applyOptions({ width });
          }
        }
      });
      ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
      };
    }
    
    boot();
    return () => { mounted = false; };
  }, [
    timeframe, chartType, height, theme, JSON.stringify(indicators),
    calcSMA, calcEMA, calcMACD, calcStochastic, calcWilliamsR, calcATR, calcVWAP, calcBollinger, calcRSI, transformToHeikinAshi,
    candles, palette
  ]);


  // 실시간 가격으로 마지막 캔들만 update (차트 전체 setData 금지)
  useEffect(() => {
    if (!ready || !priceSeriesRef.current || bithumbCandles.length === 0) return;
    // 1초마다 현재가로 마지막 캔들 update
    const interval = setInterval(() => {
      try {
      const lastCandle = bithumbCandles[bithumbCandles.length - 1];
        if (!lastCandle || !lastCandle.time || !lastCandle.open || !lastCandle.close) return;
      
      // 현재가 반영 (currentPrice가 있으면 사용)
      let price = currentPrice;
        if (!price || price === 0 || isNaN(price)) {
        price = lastCandle.close;
      }
        
        // 모든 값이 유효한지 확인
        if (isNaN(price) || isNaN(lastCandle.open) || isNaN(lastCandle.high) || isNaN(lastCandle.low)) {
          console.warn('유효하지 않은 캔들 데이터:', { lastCandle, price });
          return;
        }
      
      // 가격이 너무 극단적이지 않도록 조정
      const prevClose = lastCandle.close;
      const maxChange = prevClose * 0.05; // 최대 5% 변동
      if (Math.abs(price - prevClose) > maxChange) {
        price = prevClose + (price > prevClose ? maxChange : -maxChange);
      }
        
        // 최종 유효성 검사
        if (price <= 0 || isNaN(price)) {
          console.warn('유효하지 않은 업데이트 가격:', price);
          return;
        }
      
      // 캔들 타입별로 update
      if (["candlestick", "heikin-ashi"].includes(chartType)) {
          const updateData = {
          time: lastCandle.time,
            open: Math.max(0, lastCandle.open),
            high: Math.max(0, Math.max(lastCandle.high, price)),
            low: Math.max(0, Math.min(lastCandle.low, price)),
            close: Math.max(0, price)
          };
          
          // 모든 값이 유효한지 다시 한번 확인
          if (Object.values(updateData).every(val => val > 0 && !isNaN(val))) {
            priceSeriesRef.current.update(updateData);
          }
      } else {
          const updateData = {
          time: lastCandle.time,
            value: Math.max(0, price)
          };
          
          if (updateData.value > 0 && !isNaN(updateData.value)) {
            priceSeriesRef.current.update(updateData);
          }
        }
      } catch (error) {
        console.error('캔들 업데이트 실패:', error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [ready, bithumbCandles, chartType, currentPrice]);

  // 실시간 현재가 라인 업데이트
  useEffect(() => {
    if (!ready || !priceLineRef.current) return;
    
    const interval = setInterval(() => {
      try {
        // 현재가 라인을 실시간으로 업데이트
        if (priceLineRef.current && priceInfo.displayPrice && priceInfo.displayPrice > 0 && !isNaN(priceInfo.displayPrice)) {
          priceLineRef.current.applyOptions({
            price: priceInfo.displayPrice
          });
        }
      } catch (error) {
        console.log('현재가 라인 업데이트 실패:', error);
      }
    }, 500); // 0.5초마다 업데이트
    
    return () => clearInterval(interval);
  }, [ready, priceInfo.displayPrice]);

  // 드로잉 모드 토글 함수
  const toggleDrawingMode = (mode) => {
    setDrawingMode(prev => prev === mode ? null : mode);
    // 모드 변경 시 이전 포인트 초기화
    drawingPoints.current.start = null;
  };

  // 드로잉 도구 초기화 함수
  const clearAllDrawings = useCallback(() => {
    if (drawingLines.current.length > 0) {
      drawingLines.current.forEach(line => {
        try {
          if (line.line && typeof line.line.remove === 'function') {
            line.line.remove();
          } else if (line.line && typeof line.line.dispose === 'function') {
            line.line.dispose();
          }
        } catch (error) {
          console.log('선 제거 실패:', error);
        }
      });
      drawingLines.current = [];
      console.log('✅ 모든 드로잉 도구 제거 완료');
    }
  }, []);

  // 수평선 그리기 함수
  const drawHorizontalLine = useCallback((price) => {
    if (!chartRef.current || !priceSeriesRef.current) return;
    
    try {
      // 기존 수평선 제거
      const existingLine = drawingLines.current.find(line => line.type === 'horizontal');
      if (existingLine && existingLine.line && typeof existingLine.line.remove === 'function') {
        try {
          existingLine.line.remove();
        } catch (e) {
          console.log('기존 수평선 제거 실패:', e);
        }
        drawingLines.current = drawingLines.current.filter(line => line.type !== 'horizontal');
      }
      
      // 새로운 수평선 생성
      try {
        // 가격이 유효한지 확인
        if (price <= 0 || isNaN(price)) {
          console.warn('유효하지 않은 가격:', price);
          return;
        }
        
        const horizontalLine = priceSeriesRef.current.createPriceLine({
          price: price,
          color: '#FF6B35', // 진한 주황색
          lineWidth: 3, // 더 두껍게
          lineStyle: 1, // 실선
          axisLabelVisible: true,
          title: `수평선 ${price.toLocaleString()}`,
        });
        
        // 선 저장
        drawingLines.current.push({
          type: 'horizontal',
          line: horizontalLine,
          price: price
        });
        
        console.log('✅ 수평선 그리기 완료:', { price, formattedPrice: price.toLocaleString() });
      } catch (e) {
        console.error('수평선 생성 실패:', e);
      }
    } catch (error) {
      console.error('수평선 그리기 실패:', error);
    }
  }, []);

  // 수직선 그리기 함수
  const drawVerticalLine = useCallback((time) => {
    if (!chartRef.current || !priceSeriesRef.current) return;
    
    try {
      // 기존 수직선 제거
      const existingLine = drawingLines.current.find(line => line.type === 'vertical');
      if (existingLine && existingLine.line && typeof existingLine.line.remove === 'function') {
        try {
          existingLine.line.remove();
        } catch (e) {
          console.log('기존 수직선 제거 실패:', e);
        }
        drawingLines.current = drawingLines.current.filter(line => line.type !== 'vertical');
      }
      
      // 새로운 수직선 생성
      try {
        // 현재 차트의 가격 범위를 정확하게 가져오기
        let minPrice = 0, maxPrice = 0;
        
        if (candles && candles.length > 0) {
          // 캔들 데이터에서 실제 가격 범위 추출
          minPrice = Math.min(...candles.map(c => c.low));
          maxPrice = Math.max(...candles.map(c => c.high));
        } else {
          // 차트의 현재 가시 영역에서 가격 범위 가져오기
          try {
            const priceScale = chartRef.current.priceScale('right');
            const visibleRange = priceScale.getVisibleRange();
            if (visibleRange && visibleRange.from !== undefined && visibleRange.to !== undefined) {
              minPrice = visibleRange.from;
              maxPrice = visibleRange.to;
            } else {
              // 기본값 사용
              minPrice = 150000000;
              maxPrice = 160000000;
            }
          } catch (e) {
            minPrice = 150000000;
            maxPrice = 160000000;
          }
        }
        
        // 수직선을 위한 마커 시리즈 생성
        const markerSeries = chartRef.current.addLineSeries({
          color: '#8B5CF6', // 진한 보라색
          lineWidth: 3, // 더 두껍게
          lineStyle: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        
        // 수직선을 위한 데이터 포인트 (같은 시간에 여러 가격으로 수직선 효과)
        const lineData = [];
        const priceStep = (maxPrice - minPrice) / 50; // 더 조밀하게
        
        for (let i = 0; i <= 50; i++) {
          const price = minPrice + (priceStep * i);
          lineData.push({ time: time, value: price });
        }
        
        markerSeries.setData(lineData);
        
        // 선 저장
        drawingLines.current.push({
          type: 'vertical',
          line: markerSeries,
          time: time
        });
        
        console.log('✅ 수직선 그리기 완료:', { time, minPrice, maxPrice });
      } catch (e) {
        console.error('수직선 시리즈 생성 실패:', e);
      }
    } catch (error) {
      console.error('수직선 그리기 실패:', error);
    }
  }, [candles]);

  // 추세선 그리기 함수
  const drawTrendline = useCallback((startPoint, endPoint) => {
    if (!chartRef.current || !priceSeriesRef.current) return;
    
    try {
      // 기존 추세선 제거
      const existingLine = drawingLines.current.find(line => line.type === 'trendline');
      if (existingLine && existingLine.line && typeof existingLine.line.remove === 'function') {
        try {
          existingLine.line.remove();
        } catch (e) {
          console.log('기존 추세선 제거 실패:', e);
        }
        drawingLines.current = drawingLines.current.filter(line => line.type !== 'trendline');
      }
      
      // 새로운 추세선 생성
      try {
        // 포인트 데이터 유효성 검사
        if (!startPoint || !endPoint || 
            !startPoint.time || !endPoint.time || 
            !startPoint.price || !endPoint.price ||
            isNaN(startPoint.price) || isNaN(endPoint.price) ||
            startPoint.price <= 0 || endPoint.price <= 0) {
          console.warn('유효하지 않은 추세선 포인트:', { startPoint, endPoint });
          return;
        }
        
        const trendlineSeries = chartRef.current.addLineSeries({
          color: '#10B981', // 진한 초록색
          lineWidth: 3, // 더 두껍게
          lineStyle: 1,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        
        // 추세선 데이터 설정 (더 부드러운 선을 위해 중간점 추가)
        const timeDiff = endPoint.time - startPoint.time;
        const priceDiff = endPoint.price - startPoint.price;
        const steps = Math.max(2, Math.floor(Math.abs(timeDiff) / 60)); // 1분마다 점 추가
        
        const trendlineData = [];
        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const time = startPoint.time + (timeDiff * progress);
          const price = startPoint.price + (priceDiff * progress);
          trendlineData.push({ time: Math.floor(time), value: price });
        }
        
        trendlineSeries.setData(trendlineData);
        
        // 선 저장
        drawingLines.current.push({
          type: 'trendline',
          line: trendlineSeries,
          start: startPoint,
          end: endPoint
        });
        
        console.log('✅ 추세선 그리기 완료:', { 
          start: startPoint, 
          end: endPoint, 
          points: trendlineData.length,
          timeDiff: timeDiff,
          priceDiff: priceDiff
        });
      } catch (e) {
        console.error('추세선 생성 실패:', e);
      }
    } catch (error) {
      console.error('추세선 그리기 실패:', error);
    }
  }, []);

  // 드로잉 도구 사용을 위한 차트 클릭 핸들러
  const handleChartClick = useCallback((event) => {
    if (!drawingMode || !chartRef.current || !ready) {
      console.log('드로잉 도구 사용 불가:', { 
        drawingMode, 
        hasChart: !!chartRef.current, 
        ready 
      });
      return;
    }
    
    try {
      // 차트가 완전히 로드될 때까지 대기
      if (!chartRef.current.timeScale || !chartRef.current.priceScale) {
        console.log('차트 인스턴스가 아직 준비되지 않았습니다.');
        return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // 차트 좌표로 변환
      const timeScale = chartRef.current.timeScale();
      const priceScale = chartRef.current.priceScale('right');
      
      if (timeScale && priceScale && 
          typeof timeScale.coordinateToTime === 'function') {
        
        const time = timeScale.coordinateToTime(x);
        
        // 정확한 가격 좌표 변환
        let price = null;
        
        // 방법 1: coordinateToPrice 메서드 사용 (가장 정확함)
        if (typeof priceScale.coordinateToPrice === 'function') {
          price = priceScale.coordinateToPrice(y);
        }
        // 방법 2: getVisibleRange를 사용한 정확한 계산
        else {
          try {
            const visibleRange = priceScale.getVisibleRange();
            if (visibleRange && visibleRange.from !== undefined && visibleRange.to !== undefined) {
              const { from, to } = visibleRange;
              const containerHeight = containerRef.current.clientHeight;
              const priceRange = to - from;
              
              // Y 좌표를 가격으로 변환 (Y축은 위에서 아래로 증가)
              const normalizedY = y / containerHeight;
              price = to - (normalizedY * priceRange);
            }
          } catch (e) {
            console.log('getVisibleRange 실패, 대체 방법 사용');
          }
        }
        
        // 방법 3: 캔들 데이터 기반 추정 (fallback)
        if (price === null || isNaN(price)) {
          if (candles && candles.length > 0) {
            const lastCandle = candles[candles.length - 1];
            const containerHeight = containerRef.current.clientHeight;
            const priceRange = lastCandle.high - lastCandle.low;
            const pixelsPerPrice = containerHeight / priceRange;
            price = lastCandle.high - (y / pixelsPerPrice);
          }
        }
        
        if (time && price !== null && !isNaN(price) && price > 0) {
          console.log(`${drawingMode} 도구 사용:`, { time, price, x, y });
          
          // 실제 드로잉 로직 구현
          switch (drawingMode) {
            case 'trendline':
              // 추세선 그리기 - 두 점이 필요하므로 첫 번째 클릭 시점 저장
              if (!drawingPoints.current.start) {
                drawingPoints.current.start = { time, price };
                console.log('📏 추세선 시작점:', { time, price });
              } else {
                // 두 번째 클릭 시 추세선 그리기
                const endPoint = { time, price };
                drawTrendline(drawingPoints.current.start, endPoint);
                drawingPoints.current.start = null; // 리셋
                console.log('📏 추세선 완성:', { start: drawingPoints.current.start, end: endPoint });
              }
              break;
            case 'horizontal':
              // 수평선 그리기
              drawHorizontalLine(price);
              console.log('➖ 수평선 그리기:', { time, price });
              break;
            case 'vertical':
              // 수직선 그리기
              drawVerticalLine(time);
              console.log('📐 수직선 그리기:', { time, price });
              break;
            default:
              break;
          }
        } else {
          console.log('좌표 변환 실패:', { time, price, x, y });
        }
      } else {
        console.log('차트 스케일 상태:', { 
          hasTimeScale: !!timeScale, 
          hasPriceScale: !!priceScale,
          timeScaleType: typeof timeScale?.coordinateToTime,
          priceScaleType: typeof priceScale?.coordinateToPrice
        });
      }
    } catch (error) {
      console.error('드로잉 도구 사용 중 오류 발생:', error);
    }
  }, [drawingMode, ready, candles]);

  const toggleIndicator = (key) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };  
  
  const isUp = bithumbInfo.isUp;

 // 차트 타입 옵션들
  const chartTypes = [
    { key: "candlestick", label: "캔들", icon: "📊" },
    { key: "heikin-ashi", label: "하이킨", icon: "🕯️" },
    { key: "line", label: "라인", icon: "📈" },
    { key: "area", label: "에어리어", icon: "🔷" }
  ];

 // 지표 그룹들
const indicatorGroups = {
  trend: [
    { key: "sma", label: "SMA", desc: "단순이동평균" },
    { key: "ema", label: "EMA", desc: "지수이동평균" },
    { key: "bollinger", label: "볼린저밴드", desc: "변동성 지표" },
    { key: "vwap", label: "VWAP", desc: "거래량가중평균" }
  ],
  momentum: [{ key: "rsi", label: "RSI", desc: "상대강도지수" },
    { key: "macd", label: "MACD", desc: "이동평균수렴확산" },
    { key: "stochastic", label: "스토캐스틱", desc: "모멘텀 오실레이터" },
    { key: "williams", label: "Williams %R", desc: "윌리엄스 퍼센트R" }
  ],
  volume: [
    { key: "volume", label: "거래량", desc: "거래량 히스토그램" },
    { key: "atr", label: "ATR", desc: "평균진폭" }
  ]
};

 // 드로잉 도구들
 const drawingTools = [
  { key: "trendline", label: "추세선", icon: "📏" },
  { key: "horizontal", label: "수평선", icon: "➖" },
  { key: "vertical", label: "수직선", icon: "📐" },
  { key: "rectangle", label: "사각형", icon: "⬜" },
  { key: "fibonacci", label: "피보나치", icon: "🌀" }
];

 // 팔레트 정의


 return (
   <div className="trading-chart-container" style={{ 
     width: "100%", 
     border: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F0", 
     borderRadius: 16, 
     overflow: "hidden",
     backgroundColor: palette.bg,
     fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
   }}>
     {/* 프로페셔널 헤더 */}
     <div style={{
       padding: "12px 20px",
       display: "flex",
       justifyContent: "space-between",
       alignItems: "center",
       background: theme === "dark"
         ? "linear-gradient(135deg, #1A202C 0%, #2D3748 100%)"
         : "#f5fbff", // 더 연한 파란색 (even lighter blue)
       borderBottom: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F7",
       backdropFilter: "blur(10px)"
     }}>
       {/* 좌측: 심볼 정보 */}
       <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
         <div style={{ 
           width: 40, 
           height: 40, 
           background: "linear-gradient(135deg, #97cffc 0%, #f2f9ff 100%)", 
           borderRadius: 12, 
           color: "#fff", 
           display: "grid", 
           placeItems: "center", 
           fontWeight: 700,
           fontSize: 18
         }}>
           {symbol && symbol.length > 0 ? symbol.charAt(0) : "?"}
         </div>
         
         <div>
          {/* 헤더 영역 */}
          <div>
            <div style={{ 
              fontWeight: 700, 
              fontSize: 16,
              color: theme === "dark" ? "#F7FAFC" : "#1A202C",
              marginBottom: 2
            }}>
              {koreanName || symbol}
              {koreanName && (
                <span style={{ 
                  fontWeight: 400, 
                  fontSize: 14, 
                  opacity: 0.7,
                  marginLeft: 8 
                }}>
                  / {symbol.replace('/KRW', '')}
                </span>
              )}
            </div>
            <div style={{ 
              fontSize: 12, 
              opacity: 0.7,
              color: theme === "dark" ? "#A0AEC0" : "#4A5568"
            }}>
              {symbol}
            </div>
          </div>
         
        {/* 가격 정보 */}
        <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
          <div style={{ 
            fontWeight: 700, 
            color: isUp ? "#EF4444" : "#4F9CF9", // ▲: red, ▼: blue
            fontSize: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end"
          }}>
            <span>
              {isUp ? <span style={{color: '#EF4444'}}>▲</span> : <span style={{color: '#4F9CF9'}}>▼</span>} {bithumbInfo.changeAmount > 0 ? '+' : ''}{bithumbInfo.changeAmount.toLocaleString()}원
            </span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              ({isUp ? "+" : ""}{bithumbInfo.changeRate.toFixed(2)}%)
            </span>
          </div>
          <div style={{ 
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", 
            fontWeight: 800, 
            fontSize: 24, 
            color: theme === "dark" ? "#F7FAFC" : "#1A202C",
            letterSpacing: "-0.5px"
          }}>
            {priceInfo.displayPrice > 0 ? priceInfo.displayPrice.toLocaleString() : '로딩 중...'}
            <span style={{ fontSize: 16, marginLeft: 6, opacity: 0.7 }}>원</span>
          </div>
        </div>
      </div>
       </div>

       {/* 우측: 컨트롤 패널 */}
       <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
         {/* 첫 번째 행: 타임프레임 선택 */}
         <div style={{ display: "flex", gap: 4, padding: "4px", borderRadius: 4, background: theme === "dark" ? "#2D3748" : "#F7FAFC" }}>
           {timeframes.map(tf => (
             <button
               key={tf.value}
               onClick={() => setTimeframe(tf.value)}
               style={{
                 fontSize: 11, 
                 padding: "6px 10px", 
                 borderRadius: 6, 
                 border: "none",
                 background: timeframe === tf.value ? palette.accent : "transparent", 
                 color: timeframe === tf.value ? "#fff" : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                 fontWeight: timeframe === tf.value ? 600 : 400,
                 cursor: "pointer",
                 transition: "all 0.2s ease"
               }}
             >
               {tf.label}
             </button>
           ))}
         </div>

         {/* 두 번째 행 : 차트 타입 + 지표 + 드로잉 도구 */}
         <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* 차트 타입 선택 */}
          <div style={{ display: "flex", gap: 4, padding: "4px", borderRadius: 8, background: theme === "dark" ? "#2D3748" : "#F7FAFC" }}>
            {chartTypes.map(type => (
              <button
                key={type.key}
                onClick={() => setChartType(type.key)}
                style={{
                  fontSize: 11, 
                  padding: "6px 10px", 
                  borderRadius: 6, 
                  border: "none",
                  background: chartType === type.key ? palette.accent : "transparent", 
                  color: chartType === type.key ? "#fff" : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                  fontWeight: chartType === type.key ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>  

         {/* 지표 버튼 + 드로잉 도구를 같은 flex row로 묶음 */}
         <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
           <div style={{ position: "relative" }}>
             <button 
               style={{
                 padding: "8px 12px",
                 borderRadius: 8,
                 border: "none",
                 background: theme === "dark" ? "#4A5568" : "#E2E8F0",
                 color: theme === "dark" ? "#F7FAFC" : "#2D3748",
                 fontSize: 12,
                 fontWeight: 600,
                 cursor: "pointer"
               }}
               onClick={() => setShowIndicators(!showIndicators)}
             >
                지표 ({Object.values(indicators).filter(Boolean).length})
             </button>
           </div>
           {/* 드로잉 도구 */}
             {/* <div style={{ display: "flex", gap: 4 }}>
             {drawingTools.slice(0, 3).map(tool => (
               <button
                 key={tool.key}
                 onClick={() => toggleDrawingMode(tool.key)}
                   disabled={!ready}
                 style={{
                   padding: "6px 8px",
                   borderRadius: 6,
                   border: "none",
                   background: drawingMode === tool.key ? palette.accent : (theme === "dark" ? "#4A5568" : "#E2E8F0"),
                   color: drawingMode === tool.key ? "#fff" : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                   fontSize: 11,
                     cursor: ready ? "pointer" : "not-allowed",
                     opacity: ready ? 1 : 0.5,
                     title: ready ? tool.label : "차트 로딩 중..."
                 }}
               >
                 {tool.icon}
               </button>
               ))} */}
               {/* 드로잉 도구 초기화 버튼 */}
               {/* <button
                 onClick={clearAllDrawings}
                 disabled={!ready || drawingLines.current.length === 0}
                 style={{
                   padding: "6px 8px",
                   borderRadius: 6,
                   border: "none",
                   background: theme === "dark" ? "#EF4444" : "#FEE2E2",
                   color: theme === "dark" ? "#FEE2E2" : "#DC2626",
                   fontSize: 11,
                   cursor: (ready && drawingLines.current.length > 0) ? "pointer" : "not-allowed",
                   opacity: (ready && drawingLines.current.length > 0) ? 1 : 0.5,
                   title: "모든 드로잉 도구 제거"
                 }}
               >
                 🗑️
               </button> */}
             {/* </div> */}
         </div>
       </div>
     </div>

     {/* 지표 패널 (조건부 표시) */}
     {showIndicators && (
       <div style={{
         padding: "16px 20px",
         background: theme === "dark" ? "#1A202C" : "#F8FAFC",
         borderBottom: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F0"
       }}>
         <div style={{ display: "flex", gap: 24 }}>
           {/* 추세 그룹 */}
           <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
             <span style={{ fontWeight: 700, fontSize: 13, color: theme === "dark" ? "#A0AEC0" : "#4A5568", marginBottom: 4 }}>추세</span>
             <div style={{ display: "flex", gap: 8 }}>
               {indicatorGroups.trend.map(indicator => (
                 <button
                   key={indicator.key}
                   onClick={() => toggleIndicator(indicator.key)}
                   style={{
                     padding: "6px 12px",
                     borderRadius: 6,
                     border: `1px solid ${indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#4A5568" : "#CBD5E0")}`,
                     background: indicators[indicator.key] ? `${palette.accent}20` : "transparent",
                     color: indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                     fontSize: 11,
                     fontWeight: indicators[indicator.key] ? 600 : 400,
                     cursor: "pointer",
                     transition: "all 0.2s ease"
                   }}
                   title={indicator.desc}
                 >
                   {indicator.label}
                 </button>
               ))}
             </div>
           </div>
           {/* 모멘텀 그룹 */}
           <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
             <span style={{ fontWeight: 700, fontSize: 13, color: theme === "dark" ? "#A0AEC0" : "#4A5568", marginBottom: 4 }}>모멘텀</span>
             <div style={{ display: "flex", gap: 8 }}>
               {indicatorGroups.momentum.map(indicator => (
                 <button
                   key={indicator.key}
                   onClick={() => toggleIndicator(indicator.key)}
                   style={{
                     padding: "6px 12px",
                     borderRadius: 6,
                     border: `1px solid ${indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#4A5568" : "#CBD5E0")}`,
                     background: indicators[indicator.key] ? `${palette.accent}20` : "transparent",
                     color: indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                     fontSize: 11,
                     fontWeight: indicators[indicator.key] ? 600 : 400,
                     cursor: "pointer",
                     transition: "all 0.2s ease"
                   }}
                   title={indicator.desc}
                 >
                   {indicator.label}
                 </button>
               ))}
             </div>
           </div>
           {/* 거래량 그룹 */}
           <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
             <span style={{ fontWeight: 700, fontSize: 13, color: theme === "dark" ? "#A0AEC0" : "#4A5568", marginBottom: 4 }}>거래량</span>
             <div style={{ display: "flex", gap: 8 }}>
               {indicatorGroups.volume.map(indicator => (
                 <button
                   key={indicator.key}
                   onClick={() => toggleIndicator(indicator.key)}
                   style={{
                     padding: "6px 12px",
                     borderRadius: 6,
                     border: `1px solid ${indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#4A5568" : "#CBD5E0")}`,
                     background: indicators[indicator.key] ? `${palette.accent}20` : "transparent",
                     color: indicators[indicator.key] ? palette.accent : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                     fontSize: 11,
                     fontWeight: indicators[indicator.key] ? 600 : 400,
                     cursor: "pointer",
                     transition: "all 0.2s ease"
                   }}
                   title={indicator.desc}
                 >
                   {indicator.label}
                 </button>
               ))}
             </div>
           </div>
         </div>
       </div>
     )}

     {/* 메인 차트 영역 */}
     <div
       ref={containerRef}
       style={{
         height: Math.max(500, height - (showIndicators ? 200 : 120)),
         background: palette.bg,
         position: "relative",
         minHeight: 500, // ✅ 최소 높이 보장
         cursor: drawingMode ? 'crosshair' : 'default', // 드로잉 모드일 때 크로스헤어 커서
       }}
       onClick={handleChartClick} // 차트 클릭 이벤트 추가
     >
       {/* 로딩 오버레이 */}
       {(!ready || isLoadingCandles) && (
         <div style={{
           position: "absolute",
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           background: `${palette.bg}CC`,
           backdropFilter: "blur(4px)",
           zIndex: 10
         }}>
           <div style={{ textAlign: "center" }}>
             <div style={{
               width: 40,
               height: 40,
               border: `3px solid ${palette.accent}30`,
               borderTop: `3px solid ${palette.accent}`,
               borderRadius: "50%",
               animation: "spin 1s linear infinite",
               margin: "0 auto 12px"
             }} />
             <div style={{ color: palette.text, fontSize: 14, fontWeight: 500 }}>
               {isLoadingCandles ? '빗썸 데이터 로딩 중...' : '차트 로딩 중...'}
             </div>
           </div>
         </div>
       )}

       {/* 크로스헤어 정보 패널 */}
       {crosshair && ready && (
         <div style={{
           position: "absolute", 
           left: 16, 
           top: 16, 
           padding: 12, 
           minWidth: 280,
           background: theme === "dark" ? "#1A202CDD" : "#FFFFFFDD",
           color: theme === "dark" ? "#F7FAFC" : "#1A202C",
           border: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F0",
           borderRadius: 12, 
           boxShadow: "0 8px 32px rgba(0,0,0,0.12)", 
           fontSize: 12,
           pointerEvents: "none",
           backdropFilter: "blur(12px)"
         }}>
           <div style={{ 
             opacity: 0.7, 
             marginBottom: 8, 
             fontSize: 11, 
             fontWeight: 600,
             letterSpacing: "0.5px"
           }}>
             {new Date(crosshair.time * 1000).toLocaleString('ko-KR')}
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
             {crosshair.open !== undefined && (
               <div>
                 <span style={{ opacity: 0.7 }}>시가: </span>
                 <span style={{ fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
                   ₩{Math.round(crosshair.open).toLocaleString()}
                 </span>
               </div>
             )}
             {crosshair.high !== undefined && (
               <div>
                 <span style={{ opacity: 0.7 }}>고가: </span>
                 <span style={{ fontWeight: 600, fontFamily: "ui-monospace, monospace", color: palette.up }}>
                   ₩{Math.round(crosshair.high).toLocaleString()}
                 </span>
               </div>
             )}
             {crosshair.low !== undefined && (
               <div>
                 <span style={{ opacity: 0.7 }}>저가: </span>
                 <span style={{ fontWeight: 600, fontFamily: "ui-monospace, monospace", color: palette.down }}>
                   ₩{Math.round(crosshair.low).toLocaleString()}
                 </span>
               </div>
             )}
             <div>
               <span style={{ opacity: 0.7 }}>종가: </span>
               <span style={{ fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
                 ₩{Math.round(crosshair.close ?? crosshair.open ?? 0).toLocaleString()}
               </span>
             </div>
           </div>
         </div>
       )}

       {/* 드로잉 모드 표시 */}
       {drawingMode && (
         <div style={{
           position: "absolute",
           top: 16,
           right: 16,
           padding: "8px 12px",
           background: `${palette.accent}20`,
           color: palette.accent,
           borderRadius: 8,
           fontSize: 12,
           fontWeight: 600,
           border: `1px solid ${palette.accent}40`
         }}>
           {drawingTools.find(t => t.key === drawingMode)?.icon} {drawingTools.find(t => t.key === drawingMode)?.label} 모드
         </div>
       )}
     </div>

     

     {/* CSS 애니메이션 */}
     <style jsx>{`
     @keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.trading-chart-container button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.trading-chart-container button:active {
  transform: translateY(0);
}
`}</style>
   </div>
 );
}

export default TradingChart;