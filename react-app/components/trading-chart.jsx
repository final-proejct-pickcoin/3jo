"use client"

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
  koreanName = "", // ✅ 이거 추가  
  height = 680,
  theme = "light",
  currentPrice = null,
  initialTimeframe = '1h', // ✅ props 이름 변경
  realTimeData,
  initialPriceInfo = { displayPrice: 0 } // ✅ props 이름 변경
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const indicatorRefs = useRef({});
  const priceLineRef = useRef(null);

  // ✅ state 관리 (중복 제거)
  const [timeframe, setTimeframe] = useState(initialTimeframe); // ✅ 하나만 유지
  const [chartType, setChartType] = useState("candlestick");
  const [indicators, setIndicators] = useState({
    volume: true,
    sma: false,
    ema: false,
    bollinger: false,
    rsi: false,
    macd: false,
    stochastic: false,
    williams: false,
    atr: false,
    vwap: false,
  });

  const [crosshair, setCrosshair] = useState(null);
  const [ready, setReady] = useState(false);
  const [chartApi, setChartApi] = useState(null);
  const [showIndicators, setShowIndicators] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [volumeProfile, setVolumeProfile] = useState(false);

  // ✅ 팔레트 정의
  const palette = useMemo(() => {
    const light = {
      bg: "#ffffff",
      text: "#2D3748",
      grid: "rgba(0,0,0,0.05)",
      up: "#16C784",
      down: "#EA3943",
      volUp: "rgba(22,199,132,.3)",
      volDown: "rgba(234,57,67,.3)",
      axis: "#E2E8F0",
      accent: "#3182CE",
    };
    const dark = {
      bg: "#0D1421",
      text: "#E2E8F0",
      grid: "rgba(255,255,255,0.04)",
      up: "#00D4AA",
      down: "#FF6B6B",
      volUp: "rgba(0,212,170,.3)",
      volDown: "rgba(255,107,107,.3)",
      axis: "#2D3748",
      accent: "#63B3ED",
    };
    return theme === "dark" ? dark : light;
  }, [theme]);

  // ✅ 가격 정보 (하나만 유지)
  const priceInfo = useMemo(() => {
    const displayPrice = currentPrice ?? 
      (realTimeData?.closePrice ? Number(realTimeData.closePrice) : 163_800_000);
    const change = realTimeData?.chgAmt ? Number(realTimeData.chgAmt) : 600_000;
    const changePercent = realTimeData?.chgRate ? Number(realTimeData.chgRate) : 0.37;
    const high24h = realTimeData?.maxPrice ? Number(realTimeData.maxPrice) : 164_200_000;
    const low24h = realTimeData?.minPrice ? Number(realTimeData.minPrice) : 162_000_000;
    const volume24h = realTimeData?.unitsTraded ? Number(realTimeData.unitsTraded) : 1231.795;
    
    return { displayPrice, change, changePercent, high24h, low24h, volume24h, isRealTime: !!realTimeData };
  }, [currentPrice, realTimeData]);

  // ✅ 차트 데이터 생성
  const candles = useMemo(() => {
    const out = [];
    let base = priceInfo.displayPrice * 0.99;
    const now = Date.now();
    const ms = {
      "1m": 60_000, "5m": 300_000, "15m": 900_000,
      "1h": 3_600_000, "4h": 14_400_000, "1d": 86_400_000,
      "1w": 604_800_000, "1M": 2_592_000_000
    }[timeframe] || 3_600_000;

    const candleCount = timeframe === "1m" ? 200 : timeframe === "5m" ? 288 : 100;

    for (let i = candleCount; i >= 0; i--) {
      const candleTime = Math.floor((now - i * ms) / ms) * ms;
      const t = Math.floor(candleTime / 1000);
      
      const trend = Math.sin(i * 0.02) * 0.0008;
      const volatility = 0.001 + Math.random() * 0.002;
      const priceMove = (Math.random() - 0.5) * volatility;
      
      base = base * (1 + trend + priceMove);
      
      const spread = base * (0.002 + Math.random() * 0.003);
      const o = base + (Math.random() - 0.5) * spread * 0.3;
      const c = base + (Math.random() - 0.5) * spread * 0.8;
      const h = Math.max(o, c) + Math.random() * spread * 0.3;
      const l = Math.min(o, c) - Math.random() * spread * 0.3;
      const v = 100 + Math.random() * 500 + Math.abs(Math.sin(i * 0.1)) * 300;
      
      out.push({
        time: t,
        open: Math.round(Math.max(l, o)),
        high: Math.round(Math.max(h, o, c)),
        low: Math.round(Math.min(l, o, c)),
        close: Math.round(Math.max(l, c)),
        volume: Math.round(v),
      });
    }

    if (realTimeData && out.length) {
      const last = out[out.length - 1];
      last.close = priceInfo.displayPrice;
      last.high = Math.max(last.high, priceInfo.displayPrice);
      last.low = Math.min(last.low, priceInfo.displayPrice);
    }

    return out.sort((a, b) => a.time - b.time);
  }, [timeframe, priceInfo.displayPrice, realTimeData]);

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

  // 차트 생성 메인 useEffect
  useEffect(() => {
    let mounted = true;
    
    async function boot() {
      if (!containerRef.current) return;
      if (typeof window === 'undefined') return;
      
      // LightweightCharts 로드 대기
      let attempts = 0;
      while (!window.LightweightCharts && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      const LW = window.LightweightCharts;
      if (!LW || !mounted) return;

      // 기존 차트 정리
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
      }

      // 차트 생성
      const chart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth || 900,
        height: Math.max(500, height - 100),
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
          rightOffset: 50,
          barSpacing: 12,
          minBarSpacing: 8,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        crosshair: {
          mode: 1,
          vertLine: { color: palette.accent, style: 1, width: 1, labelVisible: true },
          horzLine: { color: palette.accent, style: 1, width: 1, labelVisible: true },
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { axisPressedMouseMove: true, pinch: true, mouseWheel: true },
      });

      chartRef.current = chart;
      setChartApi(LW);

      // 메인 시리즈 생성
      let seriesData = candles;
      if (chartType === "heikin-ashi") {
        seriesData = transformToHeikinAshi(candles);
      }

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

      chart.timeScale().fitContent();
      setReady(true);

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
    calcSMA, calcEMA, calcMACD, calcStochastic, calcWilliamsR, calcATR, calcVWAP, calcBollinger, calcRSI, transformToHeikinAshi
  ]);

  // 실시간 업데이트 - 기존 코드를 완전히 교체
  useEffect(() => {
    if (!ready || !priceSeriesRef.current || !realTimeData) return;

    // ✅ 타임프레임에 맞는 캔들 시간 계산
    const getTimeframeMs = (tf) => ({
      "1m": 60_000,
      "5m": 300_000, 
      "15m": 900_000,
      "1h": 3_600_000,
      "4h": 14_400_000,
      "1d": 86_400_000,
      "1w": 604_800_000
    }[tf] || 3_600_000);

    const timeframeMs = getTimeframeMs(timeframe);
    const now = Date.now();
    
    // ✅ 현재 타임프레임에 맞는 캔들 시간 계산
    const currentCandleTime = Math.floor(now / timeframeMs) * timeframeMs / 1000;
    
    const open = Number(realTimeData.openPrice || priceInfo.displayPrice);
    const high = Number(realTimeData.maxPrice || priceInfo.displayPrice);
    const low = Number(realTimeData.minPrice || priceInfo.displayPrice);
    const close = Number(realTimeData.closePrice || priceInfo.displayPrice);

    // console.log('🔄 실시간 업데이트:', { 
    //   timeframe,
    //   currentCandleTime: new Date(currentCandleTime * 1000).toLocaleString(),
    //   close 
    // });

    const updateObj = ["candlestick", "heikin-ashi"].includes(chartType)
      ? { time: currentCandleTime, open, high, low, close } // ✅ 타임프레임 기반 시간 사용
      : { time: currentCandleTime, value: close };

    try {
      // ✅ 기존 캔들 업데이트 (새로운 캔들 생성 X)
      priceSeriesRef.current.update(updateObj);
      
      // 현재가 라인 업데이트
      if (priceLineRef.current) {
        priceSeriesRef.current.removePriceLine(priceLineRef.current);
      }
      priceLineRef.current = priceSeriesRef.current.createPriceLine({
        price: close,
        color: palette.accent,
        lineWidth: 2,
        lineStyle: 2,
        title: `현재가: ${close.toLocaleString()}원`,
      });
      
    } catch (e) {
      console.warn('실시간 업데이트 오류:', e);
    }
  }, [ready, chartType, realTimeData, timeframe, palette.accent]); // ✅ timeframe 의존성 추가

  // UI 토글 함수
  const toggleIndicator = (key) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDrawingMode = (mode) => {
    setDrawingMode(prev => prev === mode ? null : mode);
  };

  const isUp = priceInfo.change >= 0;

 // 차트 타입 옵션들
  const chartTypes = [
    { key: "candlestick", label: "캔들", icon: "📊" },
    { key: "heikin-ashi", label: "하이킨", icon: "📈" },
    { key: "line", label: "라인", icon: "📉" },
    { key: "area", label: "에어리어", icon: "🌊" }
  ];

  // 타임프레임 옵션들
  const timeframes = [
    { key: "1m", label: "1분" },
    { key: "5m", label: "5분" },
    { key: "15m", label: "15분" },
    { key: "1h", label: "1시간" },
    { key: "4h", label: "4시간" },
    { key: "1d", label: "1일" },
    { key: "1w", label: "1주" }
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
         : "linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%)",
       borderBottom: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F7",
       backdropFilter: "blur(10px)"
     }}>
       {/* 좌측: 심볼 정보 */}
       <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
         <div style={{ 
           width: 40, 
           height: 40, 
           background: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)", 
           borderRadius: 12, 
           color: "#fff", 
           display: "grid", 
           placeItems: "center", 
           fontWeight: 700,
           fontSize: 18
         }}>
           ₿
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
         </div>
         
         {/* 가격 정보 */}
         <div style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
           <div style={{ 
             fontWeight: 700, 
             color: isUp ? "#10B981" : "#EF4444", 
             fontSize: 14,
             display: "flex",
             aflexDirection: "column",
             alignItems: "flex-end"
           }}>
             <span>
               {isUp ? "▲" : "▼"} {Math.abs(priceInfo.change).toLocaleString()}원
             </span>
             <span style={{ fontSize: 12, opacity: 0.8 }}>
               ({isUp ? "+" : ""}{priceInfo.changePercent.toFixed(2)}%)
             </span>
           </div>
           <div style={{ 
             fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", 
             fontWeight: 800, 
             fontSize: 24, 
             color: theme === "dark" ? "#F7FAFC" : "#1A202C",
             letterSpacing: "-0.5px"
           }}>
             {priceInfo.displayPrice.toLocaleString()}
             <span style={{ fontSize: 16, marginLeft: 6, opacity: 0.7 }}>KRW</span>
           </div>
         </div>
       </div>

       {/* 우측: 컨트롤 패널 */}
       <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
         {/* 타임프레임 선택 */}
         <div style={{ display: "flex", gap: 4, padding: "4px", borderRadius: 8, background: theme === "dark" ? "#2D3748" : "#F7FAFC" }}>
           {timeframes.map(tf => (
             <button
               key={tf.key}
               onClick={() => setTimeframe(tf.key)}
               style={{
                 fontSize: 11, 
                 padding: "6px 10px", 
                 borderRadius: 6, 
                 border: "none",
                 background: timeframe === tf.key ? palette.accent : "transparent", 
                 color: timeframe === tf.key ? "#fff" : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                 fontWeight: timeframe === tf.key ? 600 : 400,
                 cursor: "pointer",
                 transition: "all 0.2s ease"
               }}
             >
               {tf.label}
             </button>
           ))}
         </div>

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

         {/* 지표 버튼 */}
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
             📊 지표 ({Object.values(indicators).filter(Boolean).length})
           </button>
         </div>

         {/* 드로잉 도구 */}
         <div style={{ display: "flex", gap: 4 }}>
           {drawingTools.slice(0, 3).map(tool => (
             <button
               key={tool.key}
               onClick={() => toggleDrawingMode(tool.key)}
               style={{
                 padding: "6px 8px",
                 borderRadius: 6,
                 border: "none",
                 background: drawingMode === tool.key ? palette.accent : (theme === "dark" ? "#4A5568" : "#E2E8F0"),
                 color: drawingMode === tool.key ? "#fff" : (theme === "dark" ? "#E2E8F0" : "#4A5568"),
                 fontSize: 11,
                 cursor: "pointer",
                 title: tool.label
               }}
             >
               {tool.icon}
             </button>
           ))}
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
         {Object.entries(indicatorGroups).map(([groupName, groupIndicators]) => (
           <div key={groupName} style={{ marginBottom: 16 }}>
             <h4 style={{ 
               margin: "0 0 8px 0", 
               fontSize: 12, 
               fontWeight: 600, 
               color: theme === "dark" ? "#A0AEC0" : "#4A5568",
               textTransform: "uppercase",
               letterSpacing: "0.5px"
             }}>
               {groupName === 'trend' ? '추세' : groupName === 'momentum' ? '모멘텀' : '거래량'}
             </h4>
             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
               {groupIndicators.map(indicator => (
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
         ))}
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
       }}
     >
       {/* 로딩 오버레이 */}
       {!ready && (
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
               차트 로딩 중...
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

     {/* 하단 상태바 */}
     <div style={{
       padding: "8px 20px",
       display: "flex", 
       justifyContent: "space-between", 
       alignItems: "center",
       background: theme === "dark" ? "#1A202C" : "#F8FAFC",
       borderTop: theme === "dark" ? "1px solid #2D3748" : "1px solid #E2E8F0",
       fontSize: 11, 
       color: theme === "dark" ? "#A0AEC0" : "#4A5568"
     }}>
       <div style={{ display: "flex", gap: 20 }}>
         <span>
           🔗 연결: <strong>{priceInfo.isRealTime ? "실시간" : "정적"}</strong>
         </span>
         <span>
           📊 데이터: <strong>{candles.length}개 캔들</strong>
         </span>
         <span>
           📈 지표: <strong>{Object.values(indicators).filter(Boolean).length}개 활성</strong>
         </span>
         <span>
           ⏱️ 간격: <strong>{timeframes.find(tf => tf.key === timeframe)?.label}</strong>
         </span>
       </div>
       <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
         <span>TradingView Pro • {new Date().toLocaleTimeString('ko-KR')}</span>
         <div style={{
           width: 8,
           height: 8,
           borderRadius: "50%",
           background: ready ? "#10B981" : "#EF4444"
         }} />
       </div>
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
