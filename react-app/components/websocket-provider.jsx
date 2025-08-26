// websocket-provider.jsx
"use client"

import { createContext, useContext, useRef, useCallback, useState, useEffect } from "react"

const WebSocketContext = createContext(undefined)

export const WebSocketProvider = ({ children }) => {
  const [marketData, setMarketData] = useState({})
  const subscribedSymbols = useRef(new Set())
  const updateTimeoutRef = useRef(null)

  const batchedUpdate = useCallback((updates) => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      setMarketData(prev => ({ ...prev, ...updates }))
    }, 100)
  }, [])

  const subscribe = useCallback((symbols) => {
    if (!Array.isArray(symbols)) return
    const newSymbols = symbols.filter(symbol => symbol && !subscribedSymbols.current.has(symbol))
    if (newSymbols.length === 0) return
    newSymbols.forEach(symbol => {
      subscribedSymbols.current.add(symbol)
      const interval = setInterval(() => {
        const price = 1000 + Math.random() * 50000
        const change24h = (Math.random() - 0.5) * 10
        batchedUpdate({ [symbol]: { price, change24h } })
      }, 5000)
      subscribedSymbols.current[`${symbol}_interval`] = interval
    })
  }, [batchedUpdate])

  useEffect(() => () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    Object.keys(subscribedSymbols.current).forEach((key) => {
      if (key.endsWith('_interval')) clearInterval(subscribedSymbols.current[key])
    })
  }, [])

  const unsubscribe = useCallback((symbols) => {
    if (!Array.isArray(symbols)) return
    symbols.forEach(symbol => {
      if (subscribedSymbols.current.has(symbol)) {
        subscribedSymbols.current.delete(symbol)
        const interval = subscribedSymbols.current[`${symbol}_interval`]
        if (interval) {
          clearInterval(interval)
          delete subscribedSymbols.current[`${symbol}_interval`]
        }
      }
    })
  }, [])

// 새로 추가 : 커뮤니티 통계 
const [stats, setStats] = useState({
    activeUsers: 0,
    postsToday: 0,
    onlineNow: 0,
    totalPosts: 0,
  })
  const wsStatsRef = useRef(null)

  useEffect(() => {
  // 📌 초기 로딩 시 REST API 호출
  fetch("http://localhost:8080/community/stats")
    .then(res => res.json())
    .then(data => {
      setStats({
        activeUsers: data.activeUsers ?? 0,
        postsToday: data.postsToday ?? 0,
        onlineNow: data.onlineNow ?? 0,
        totalPosts: data.totalPosts ?? 0,
      })
    })
    .catch(err => console.error("초기 통계 불러오기 실패:", err))

  // 📡 WebSocket 연결
  const ws = new WebSocket("ws://localhost:8080/ws/stats")
  wsStatsRef.current = ws

  ws.onopen = () => console.log("📡 Stats WebSocket 연결됨")
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      setStats({
        activeUsers: data.activeUsers ?? 0,
        postsToday: data.postsToday ?? 0,
        onlineNow: data.onlineNow ?? 0,
        totalPosts: data.totalPosts ?? 0,
      })
    } catch (e) {
      console.error("Stats WS parse error:", e)
    }
  }
  ws.onclose = () => console.log(" Stats WebSocket 끊김")

  return () => ws.close()
}, [])

  const value = {
    marketData,
    // 여기 추가
    liveData: marketData,
    isConnected: true,
    subscribe,
    unsubscribe,
    stats,
  }
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}