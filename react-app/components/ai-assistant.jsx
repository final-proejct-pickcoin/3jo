"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Mic, MicOff, Send, TrendingUp, Lightbulb, BarChart3, MessageCircle } from "lucide-react"

const aiRecommendations = [
  {
    symbol: "SOL",
    name: "Solana",
    confidence: 85,
    reason: "생태계 성장세와 디파이 채택이 빠르게 늘고 있습니다.",
    action: "매수 관점",
    timeframe: "1~2주 이내",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    confidence: 78,
    reason: "이더리움 확장 솔루션으로 파트너십이 꾸준히 증가 중입니다.",
    action: "조정 시 분할매수",
    timeframe: "2~4주 이내",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    confidence: 72,
    reason: "오라클 네트워크 확장과 기관 채택이 활발합니다.",
    action: "장기 보유",
    timeframe: "1~3개월 이내",
  },
]

const marketInsights = [
  {
    title: "비트코인 횡보 패턴",
    insight:
      "비트코인은 대칭 삼각형 패턴을 그리고 있어 5~7일 내 방향성이 나올 가능성이 높습니다. 거래량이 점차 줄고 있는 것도 전형적인 신호입니다.",
    confidence: 82,
    timeframe: "단기 관점",
  },
  {
    title: "디파이 섹터 순환",
    insight:
      "밈코인에서 디파이로 자금이 이동 중입니다. TVL이 최근 일주일간 15% 증가하며 예치 상품에 대한 관심이 다시 높아졌습니다.",
    confidence: 76,
    timeframe: "중기 관점",
  },
  {
    title: "알트코인 시즌 신호",
    insight:
      "비트코인 도미넌스는 하락, 알트코인 시총은 상승세입니다. 과거 패턴상 알트코인 시즌 진입 가능성이 있습니다.",
    confidence: 69,
    timeframe: "중기 관점",
  },
]

export function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content:
        "안녕하세요! AI 트레이딩 어시스턴트입니다. 시장 분석, 매매 전략, 포트폴리오 최적화 등 궁금한 점을 물어보세요.",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage)
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: aiResponse,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }, 1500)
  }

  const generateAIResponse = (input) => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("bitcoin") || lowerInput.includes("btc")) {
      return "Based on current market analysis, Bitcoin is showing consolidation around $43,000. The RSI is neutral at 58, and we're seeing decreased volatility which often precedes significant moves. I recommend watching for a breakout above $45,000 or support test at $41,000."
    }

    if (lowerInput.includes("portfolio") || lowerInput.includes("diversification")) {
      return "For optimal portfolio diversification, I suggest maintaining 40-50% in major cryptocurrencies (BTC, ETH), 30-40% in promising altcoins, and 10-20% in experimental positions. Your current allocation shows good balance, but consider reducing exposure to highly correlated assets."
    }

    if (lowerInput.includes("market") || lowerInput.includes("trend")) {
      return "Current market sentiment is cautiously optimistic. We're seeing increased institutional interest and improving regulatory clarity. The Fear & Greed index is at 52 (neutral), suggesting balanced market conditions. Key levels to watch: BTC $45k resistance, ETH $1,700 support."
    }

    return "암호화폐 시장에 대해 궁금하신 점이 있으시군요. 최신 데이터를 바탕으로, 리스크 관리와 자산 분산에 집중하시는 것을 추천드립니다. 특정 코인이나 매매 전략에 대해 더 자세한 분석이 필요하신가요?"
  }

  const startVoiceCommand = () => {
    setIsVoiceActive(true)
    // Simulate voice recognition
    setTimeout(() => {
      const voiceCommands = [
        "What's the current Bitcoin price trend?",
        "Should I buy more Ethereum now?",
        "Give me a market summary for today",
        "What are your top 3 coin recommendations?",
      ]
      const randomCommand = voiceCommands[Math.floor(Math.random() * voiceCommands.length)]
      setInputMessage(randomCommand)
      setIsVoiceActive(false)
    }, 2000)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* AI Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI 트레이딩 도우미
            </CardTitle>
            <CardDescription>맞춤형 인사이트와 매매 추천을 받아보세요</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 overflow-x-hidden">
              {messages.map((message, index) => (
                <div key={index} className={`flex w-full ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] min-w-0 p-3 rounded-lg break-words overflow-wrap-anywhere ${
                    message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1 break-words">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="bg-muted p-3 rounded-lg min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="시장, 매매 전략, 포트폴리오 등 무엇이든 물어보세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={startVoiceCommand}
                disabled={isVoiceActive}
                className={isVoiceActive ? "voice-recording" : ""}
              >
                {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {isVoiceActive && (
              <div className="mt-2 p-2 bg-primary/10 rounded text-center">
                <p className="text-sm">🎤 Listening for voice command...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Sidebar */}
      <div className="space-y-6">
        <Tabs defaultValue="recommendations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendations">추천 종목</TabsTrigger>
            <TabsTrigger value="insights">시장 인사이트</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI 추천
                </CardTitle>
                <CardDescription>개인화된 매매 제안</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{rec.symbol}</span>
                          <Badge variant="secondary">신뢰도 {rec.confidence}%</Badge>
                        </div>
                        <Badge
                          className={
                            rec.action.includes("매수")
                              ? "bg-green-100 text-green-700"
                              : rec.action.includes("매도")
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }
                        >
                          {rec.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                      <p className="text-xs text-muted-foreground">예상 기간: {rec.timeframe}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  시장 인사이트
                </CardTitle>
                <CardDescription>AI 기반 시장 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge variant="outline">신뢰도 {insight.confidence}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.insight}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="text-xs">
                          {insight.timeframe}
                        </Badge>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 실행</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("오늘의 시장 요약 알려줘")}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                시장 요약
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("내 포트폴리오 분석해줘")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                포트폴리오 분석
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("오늘 매수 추천 종목 알려줘")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                매수 추천
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={() => setInputMessage("리스크 진단 해줘")}
              >
                <Brain className="h-4 w-4 mr-2" />
                리스크 진단
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
