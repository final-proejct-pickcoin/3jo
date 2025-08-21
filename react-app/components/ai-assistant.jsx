"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Mic, MicOff, Send, TrendingUp, Lightbulb, BarChart3, MessageCircle } from "lucide-react"
import axios from "axios"

const MOCK_NOTICES = [
  { id: 3, title: "시스템 점검 안내 ", content: "안정적인 서비스 제공을 위해 새벽 2시~3시 점검이 진행됩니다. 점검 중에는 로그인/거래가 일시 중단될 수 있습니다." },
  { id: 2, title: "신규 코인 상장: ABC", content: "거래소에 ABC 코인이 상장되었습니다. 원화/USDT 마켓 모두 지원합니다." },
  { id: 1, title: "고객센터 운영시간 변경", content: "평일 09:00~18:00, 주말/공휴일 휴무로 변경되었습니다." },
];

/* 공지 (읽기 전용) */
function NoticeBoard() {
  const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE || ""
  const API_BASE = RAW_BASE.replace(/\/$/, "")
  const USE_MOCK = !API_BASE

  const [expanded, setExpanded] = useState(false)
  const [latest, setLatest] = useState(null)
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [listLoadedOnce, setListLoadedOnce] = useState(false)

   const getDate = (obj) => obj?.createdAt || obj?.created_at || obj?.created || null

  // 최신 1건
  useEffect(() => {
    if (USE_MOCK) {
      setLatest(MOCK_NOTICES[0] || null)
      setLoading(false)
      return
    }
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/notices/latest`, { signal: ctrl.signal })
        if (res.ok) {
          const data = await res.json()
          setLatest(data)
        } else {
          setLatest(MOCK_NOTICES[0] || null)
        }
      } catch {
        setLatest(MOCK_NOTICES[0] || null)
        setError("공지 불러오기 실패")
      } finally {
        setLoading(false)
      }

    })()
    return () => ctrl.abort()
  }, [API_BASE, USE_MOCK])

  // 목록(펼쳤을 때 한 번만)
  const loadList = async () => {
    if (listLoadedOnce) return
    setListLoadedOnce(true);

    //백엔드 미연결 목목록 세팅
    if (USE_MOCK) {
      setList(MOCK_NOTICES);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notices?limit=20`)
      if (res.ok) {
        const data = await res.json()
        // 백엔드가 {content:[], items:[]} 같은 포맷일 수도 있으니 보강
        const items = Array.isArray(data) ? data : (data?.items ?? data?.content ?? [])
        setList(items)
      } else {
        setList(MOCK_NOTICES)
      }
    } catch {
      setList(MOCK_NOTICES)
    }
  }

  // 스켈레톤
  if (loading && !latest) {
    return (
      <Card className="mb-4 border bg-white">
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!latest) return null

 // ★ 최신 공지 날짜(getDate 사용)
  const latestDate = (() => {
    const d = getDate(latest)
    return d ? new Date(d).toLocaleString() : ""
  })()

  return (
    <>
      {/* 최신 공지 배너 (흰색 배경) */}
      <Card className="mb-4 border bg-white">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">공지사항</p>
              <p className="text-sm break-words">{latest.title}</p>
              {latest.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">{latest.content}</p>}
              {latestDate && <p className="text-[11px] text-muted-foreground mt-1">{latestDate}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setExpanded((v) => !v)
                if (!expanded) await loadList()
              }}
            >
              {expanded ? "접기" : "전체 보기"}
            </Button>
          </div>
          {error && <p className="text-[11px] text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* 전체 공지 목록 */}
      {expanded && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">공지사항 전체</CardTitle>
            <CardDescription>읽기 전용 목록</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(list ?? MOCK_NOTICES).map((n) => {
              const raw = getDate(n)                                      // ★ getDate로 날짜 읽기
              const d = raw ? new Date(raw).toLocaleString() : ""
              return (
                <div key={n.id ?? n.noticeId ?? n.notice_id ?? Math.random()} className="p-3 rounded-lg border">
                  <p className="font-medium break-words">{n.title}</p>
                  {!!n.content && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{n.content}</p>
                  )}
                  {!!d && <p className="text-[11px] text-muted-foreground mt-1">{d}</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}


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
      room_id: "ai",
      sender:
        "admin",
      message:"고객센터입니다. 원하시는 서비스가 있으신가요?",
      timestamp: new Date(),
    },
  ])
  const ws = useRef(null);
  const scrollRef = useRef(null);
  const [inputMessage, setInputMessage] = useState("")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const userDataString = sessionStorage.getItem("user_data");
  const userData = JSON.parse(userDataString)
  const user_id = userData.user_id

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    // console.log(userData)
    const userMessage = {      
      room_id: user_id,
      sender: userData.nickname,
      message: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setInputMessage("")
    setIsLoading(true)

    await axios.post("http://localhost:8080/chat/send", userMessage)
    ws.current.send(JSON.stringify(userMessage))
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage)
      // setMessages((prev) => [
      //   ...prev,
      //   {
      //     type: "ai",
      //     content: aiResponse,
      //     timestamp: new Date(),
      //   },
      // ])
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  useEffect(() => {
    // console.log("유저 아이디", user_id)
    axios.get(`http://localhost:8080/chat/history/${user_id}`)
      .then(res => {
        // console.log(res.data)
        const messageObjects = res.data.map(msg => {
          const parsed = JSON.parse(msg);
          // timestamp 문자열을 Date 객체로 변환
          parsed.timestamp = new Date(parsed.timestamp.replace(' ', 'T') + 'Z');
          return parsed;
        });
        setMessages(messageObjects)
      }).catch(err=>{
        console.error(err)
      })
    
    if (!user_id) return;

    // WebSocket 연결
    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${user_id}`);

    ws.current.onopen = () => {
      console.log("웹소켓 연결됨");
    };

    ws.current.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      // console.log("[받은 메시지]", msg);

      // 메시지 상태 업데이트
      setMessages((prev) => {
      if (prev.some(m => m.timestamp === msg.timestamp && m.message === msg.message)) {
        return prev; // 중복 메시지면 무시
      }
      return [...prev, msg];
  });
    };

    ws.current.onclose = () => {
      console.log("웹소켓 종료");
    };

    return () => {
      if (ws.current) ws.current.close();
    };

  }, [user_id])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* AI Chat Interface */}
      <div className="lg:col-span-2">
         <NoticeBoard />
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              상담사 1:1 문의
            </CardTitle>
            <CardDescription>욕설과 비방은 삼가해주세요.</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 overflow-x-hidden">
              {messages.map((message, index) => (
                <div key={index} className={`flex w-full ${message.sender === "admin" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] min-w-0 p-3 rounded-lg break-words overflow-wrap-anywhere ${
                    message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1 break-words">{new Date(message.timestamp).toLocaleString("ko-KR")}</p>
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
                placeholder="문의 사항을 말씀해주세요."
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
