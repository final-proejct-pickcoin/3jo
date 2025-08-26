"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Brain, Mic, MicOff, Send } from "lucide-react"
import axios from "axios"

/* 공지 (읽기 전용) – 목록 기본 전개 + 항목별 토글 */
function NoticeBoard() {
  const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/$/, "")
  const ANN_API = `${BASE}/admin/announcements`

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 펼쳐진 항목 id 집합 (Set)
  const [openIds, setOpenIds] = useState(new Set())

  const getDate = (o) => o?.createdAt || o?.created_at || o?.date || null
  const isActive = (o) =>
    typeof o?.active === "boolean"
      ? o.active
      : o?.status === "active" || o?.is_active === 1 || o?.isActive === true

  // 공지 전부 가져오기
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(ANN_API, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const raw = await res.json()
        const arr = Array.isArray(raw) ? raw : []

        const normalized = arr
          .filter(isActive)
          .sort((a, b) => {
            const ai = (a?.important ?? a?.isImportant) ? 1 : 0
            const bi = (b?.important ?? b?.isImportant) ? 1 : 0
            if (ai !== bi) return bi - ai
            return String(getDate(b) || "").localeCompare(String(getDate(a) || ""))
          })

        if (!alive) return
        setList(normalized)
      } catch (e) {
        if (!alive) return
        setError(e?.message || "공지 불러오기 실패")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [ANN_API])

  const toggleOpen = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (loading) {
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
  if (!list.length) return null

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">공지사항</CardTitle>
        <CardDescription>읽기 전용 목록</CardDescription>
        {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      </CardHeader>

      <CardContent className="space-y-3">
        {list.slice(0, 50).map((n) => {
          const id = n.id ?? n.noticeId ?? n.notice_id
          const d = getDate(n) ? new Date(getDate(n)).toLocaleString() : ""
          const opened = openIds.has(id)
          return (
            <div key={id} className="border rounded-lg">
              {/* 제목 영역 (클릭 토글) */}
              <button
                type="button"
                onClick={() => toggleOpen(id)}
                className="w-full text-left p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{n.title}</p>
                  {!!d && <p className="text-[11px] text-muted-foreground mt-0.5">{d}</p>}
                </div>
                {(n.important ?? n.isImportant) && <Badge variant="destructive">중요</Badge>}
              </button>

              {/* 내용 – 열렸을 때만 표시 */}
              {opened && !!n.content && (
                <div className="px-3 pb-3 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {n.content}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      room_id: "ai",
      sender: "admin",
      message: "고객센터입니다. 원하시는 서비스가 있으신가요?",
      timestamp: new Date(),
    },
  ])
  const ws = useRef(null)
  const scrollRef = useRef(null)
  const [inputMessage, setInputMessage] = useState("")
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const userDataString = typeof window !== "undefined" ? sessionStorage.getItem("user_data") : null
  const userData = userDataString ? JSON.parse(userDataString) : {}
  const user_id = userData?.user_id

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      room_id: user_id,
      sender: userData.nickname,
      message: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setInputMessage("")
    setIsLoading(true)

    await axios.post("http://localhost:8080/chat/send", userMessage)
    ws.current?.send(JSON.stringify(userMessage))

    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const startVoiceCommand = () => {
    setIsVoiceActive(true)
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
    if (!user_id) return

    axios
      .get(`http://localhost:8080/chat/history/${user_id}`)
      .then((res) => {
        const messageObjects = res.data.map((msg) => {
          const parsed = JSON.parse(msg)
          parsed.timestamp = new Date(parsed.timestamp.replace(" ", "T") + "Z")
          return parsed
        })
        setMessages(messageObjects)
      })
      .catch((err) => {
        console.error(err)
      })

    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${user_id}`)

    ws.current.onopen = () => {
      console.log("웹소켓 연결됨")
    }

    ws.current.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      setMessages((prev) => {
        if (prev.some((m) => m.timestamp === msg.timestamp && m.message === msg.message)) {
          return prev
        }
        return [...prev, msg]
      })
    }

    ws.current.onclose = () => {
      console.log("웹소켓 종료")
    }

    return () => {
      ws.current?.close()
    }
  }, [user_id])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* 왼쪽: 공지사항 */}
      <div className="lg:col-span-2">
        <NoticeBoard />
      </div>

      {/* 오른쪽: 상담사 1:1 문의 */}
      <div>
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
                <div
                  key={index}
                  className={`flex w-full ${message.sender === "admin" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] min-w-0 p-3 rounded-lg break-words ${
                      message.sender !== "admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1 break-words">
                      {new Date(message.timestamp).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start w-full">
                  <div className="bg-muted p-3 rounded-lg min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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
    </div>
  )
}
