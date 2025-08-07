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

  const value = {
    marketData,
    isConnected: true,
    subscribe,
    unsubscribe
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