"use client"

import { useState, useEffect } from "react"
import { getKrwRate } from "@/lib/get-krw-rate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Minus, Eye, EyeOff, RefreshCw } from "lucide-react"
import { useWebSocket } from "@/components/websocket-provider"

const formatValue = (value, currency, krwRate, hide) => {
  if (hide) return "••••••"
  if (currency === "KRW") return `₩${(value * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export const PortfolioManager = () => {
  const [activeSection, setActiveSection] = useState("profile")
  const [activeTab, setActiveTab] = useState("deposit")
  const [activeSubSection, setActiveSubSection] = useState("")
  const { subscribe, marketData } = useWebSocket()
  const [hideBalances, setHideBalances] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h")
  const [krwRate, setKrwRate] = useState(0)
  const [currency, setCurrency] = useState("KRW") // "KRW" or "USD"
  
  // 프로필 관리 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editNickname, setEditNickname] = useState("사용자")
  const [editEmail, setEditEmail] = useState("user@example.com")
  const [avatar, setAvatar] = useState("/placeholder-user.jpg")
  const [editAvatar, setEditAvatar] = useState(avatar)
  
  // 원래 값 저장용 상태
  const [originalNickname, setOriginalNickname] = useState("사용자")
  const [originalEmail, setOriginalEmail] = useState("user@example.com")
  const [originalAvatar, setOriginalAvatar] = useState("/placeholder-user.jpg")

  const portfolioData = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      amount: 0.5,
      avgPrice: 42000,
      currentPrice: 43000,
      allocation: 45,
      pnl: 500,
      pnlPercent: 2.38,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      amount: 8.2,
      avgPrice: 1600,
      currentPrice: 1580,
      allocation: 28,
      pnl: -164,
      pnlPercent: -1.25,
    },
    {
      symbol: "ADA",
      name: "Cardano",
      amount: 5000,
      avgPrice: 0.45,
      currentPrice: 0.48,
      allocation: 12,
      pnl: 150,
      pnlPercent: 6.67,
    },
    {
      symbol: "DOT",
      name: "Polkadot",
      amount: 200,
      avgPrice: 7.5,
      currentPrice: 7.2,
      allocation: 8,
      pnl: -60,
      pnlPercent: -4.0,
    },
    {
      symbol: "LINK",
      name: "Chainlink",
      amount: 100,
      avgPrice: 14.8,
      currentPrice: 15.2,
      allocation: 7,
      pnl: 40,
      pnlPercent: 2.7,
    },
  ]

  const transactionHistory = [
    { type: "buy", symbol: "BTC", amount: 0.1, price: 43000, date: "2024-01-15", pnl: 100 },
    { type: "sell", symbol: "ETH", amount: 2.5, price: 1600, date: "2024-01-14", pnl: -50 },
    { type: "buy", symbol: "ADA", amount: 1000, price: 0.48, date: "2024-01-13", pnl: 25 },
    { type: "buy", symbol: "DOT", amount: 50, price: 7.2, date: "2024-01-12", pnl: -15 },
    { type: "sell", symbol: "LINK", amount: 25, price: 15.2, date: "2024-01-11", pnl: 75 },
  ]

  useEffect(() => {
    const symbols = portfolioData.map((p) => p.symbol)
    subscribe(symbols)
    getKrwRate().then((rate) => setKrwRate(rate))
  }, [subscribe])

  const totalValue = portfolioData.reduce((sum, asset) => {
    const currentPrice = marketData[asset.symbol]?.price || asset.currentPrice
    return sum + asset.amount * currentPrice
  }, 0)
  const totalPnL = portfolioData.reduce((sum, asset) => sum + asset.pnl, 0)
  const totalPnLPercent = (totalPnL / (totalValue - totalPnL)) * 100

  const renderContent = () => {
    switch (activeSection) {
      case "krw-account":
        return (
          <div className="space-y-6">
            {/* 내 계좌 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">내 계좌 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 보유 원화 */}
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ₩5,420,000
                    </div>
                    <div className="text-sm text-gray-600">보유 원화</div>
                  </div>

                  {/* 일일 한도 */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      ₩1,200,000 / ₩50,000,000
                    </div>
                    <div className="text-sm text-gray-600 mb-2">일일 한도</div>
                    <Progress value={24} className="h-2" />
                  </div>

                  {/* 월간 한도 */}
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      ₩8,500,000 / ₩200,000,000
                    </div>
                    <div className="text-sm text-gray-600 mb-2">월간 한도</div>
                    <Progress value={4.25} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 원화 입출금 */}
            <Card id="krw-deposit-section">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">원화 입출금</CardTitle>
                <p className="text-gray-600">한국 원화 입금 및 출금 서비스</p>
              </CardHeader>
              <CardContent>
                {/* 입출금 탭 */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    className={`px-6 py-3 text-lg font-medium transition-colors ${
                      activeTab === "deposit" 
                        ? "border-b-2 border-blue-500 text-blue-600" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("deposit")}
                  >
                    입금
                  </button>
                  <button
                    className={`px-6 py-3 text-lg font-medium transition-colors ${
                      activeTab === "withdrawal" 
                        ? "border-b-2 border-blue-500 text-blue-600" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("withdrawal")}
                  >
                    출금
                  </button>
                </div>

                {activeTab === "deposit" && (
                  <div className="space-y-6">
                    {/* 입금 전용 계좌 */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">입금 전용 계좌</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">은행:</span>
                          <span className="font-medium">KB국민은행</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">계좌번호:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">123-456-789012</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-3"
                            >
                              복사
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">예금주:</span>
                          <span className="font-medium">예금주: (주)픽코인</span>
                        </div>
                      </div>
                    </div>

                    {/* 입금 예정 금액 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        입금 예정 금액
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="입금할 금액을 입력하세요"
                          className="h-12 text-lg pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-lg">원</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        최소 입금액: ₩10,000 / 최대 입금액: ₩50,000,000
                      </p>
                    </div>

                    {/* 입금 버튼 */}
                    <div className="mt-4">
                      <Button className="w-full h-12 text-lg font-semibold">
                        입금 요청
                      </Button>
                    </div>

                    {/* 입금 안내사항 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ</div>
                        <div className="text-sm text-blue-800">
                          <h4 className="font-semibold mb-2">입금 안내사항</h4>
                          <ul className="space-y-1 text-xs">
                            <li>• 위 계좌로 입금하시면 실시간으로 반영됩니다.</li>
                            <li>• 입금자명은 반드시 본인 명의로 입금해주세요.</li>
                            <li>• 최소 입금액: ₩10,000</li>
                            <li>• 입금 수수료: 무료 (단, 은행 이체 수수료는 고객 부담)</li>
                            <li>• 처리 시간: 실시간 (은행 영업시간 내)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "withdrawal" && (
                  <div className="space-y-6">
                    {/* 출금 계좌 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        출금 계좌 선택
                      </label>
                      <select className="w-full h-12 text-lg border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">계좌를 선택해주세요</option>
                        <option value="account1">KB국민은행 - 123-456-789012 (픽코인 출금 전용)</option>
                        <option value="account2">신한은행 - 987-654-321098 (픽코인 출금 전용)</option>
                        <option value="account3">우리은행 - 112-233-445566 (픽코인 출금 전용)</option>
                      </select>
                    </div>

                    {/* 출금 금액 입력 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        출금 금액
                      </label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="출금할 금액을 입력하세요"
                          className="h-12 text-lg pr-12"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-lg">원</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        최소 출금액: ₩10,000 / 최대 출금액: ₩50,000,000
                      </p>
                    </div>

                    {/* 출금 요청 버튼 */}
                    <div className="mt-4">
                      <Button className="w-full h-12 text-lg font-semibold">
                        출금 요청
                      </Button>
                    </div>

                    {/* 출금 안내사항 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ</div>
                        <div className="text-sm text-blue-800">
                          <h4 className="font-semibold mb-2">출금 안내사항</h4>
                          <ul className="space-y-1 text-xs">
                            <li>• 위 계좌로 출금하시면 실시간으로 반영됩니다.</li>
                            <li>• 출금자명은 반드시 본인 명의로 출금해주세요.</li>
                            <li>• 최소 출금액: ₩10,000</li>
                            <li>• 출금 수수료: 무료 (단, 은행 이체 수수료는 고객 부담)</li>
                            <li>• 처리 시간: 실시간 (은행 영업시간 내)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 원화 거래 내역 */}
            <Card id="krw-history-section">
              <CardHeader>
                <CardTitle 
                  className="text-xl font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setActiveTab("")}
                >
                  원화 거래 내역
                </CardTitle>
                <p className="text-gray-600">최근 원화 입금 및 출금 내역</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                        <span className="text-green-600 text-lg">↑</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">입금 - KB국민은행</div>
                        <div className="text-sm text-gray-500">2024-01-15 14:32:15 • DEP240115001</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₩1,000,000</div>
                      <div className="text-sm font-medium px-2 py-1 rounded-full inline-block bg-green-50 text-green-600">완료</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100">
                        <span className="text-red-600 text-lg">↓</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">출금 - 신한은행</div>
                        <div className="text-sm text-gray-500">2024-01-15 13:45:22 • WTH240115002</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₩500,000</div>
                      <div className="text-sm text-gray-500">수수료: ₩1,000</div>
                      <div className="text-sm font-medium px-2 py-1 rounded-full inline-block bg-blue-50 text-blue-600">처리중</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                        <span className="text-green-600 text-lg">↑</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">입금 - 우리은행</div>
                        <div className="text-sm text-gray-500">2024-01-15 12:18:45 • DEP240115003</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₩2,000,000</div>
                      <div className="text-sm font-medium px-2 py-1 rounded-full inline-block bg-green-50 text-green-600">완료</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

             case "crypto-holdings":
         return (
           <div className="space-y-6">
             <Tabs defaultValue="holdings" className="space-y-4">
               <TabsContent value="holdings" className="space-y-4">
                 <Card>
                   <CardHeader>
                     <CardTitle>현재 보유자산</CardTitle>
                     <CardDescription>보유 자산 상세 보기</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       {portfolioData.map((asset) => {
                         const livePrice = marketData[asset.symbol]?.price || asset.currentPrice
                         const currentValue = asset.amount * livePrice
                         const livePnL = (livePrice - asset.avgPrice) * asset.amount
                         const livePnLPercent = ((livePrice - asset.avgPrice) / asset.avgPrice) * 100
                         return (
                           <div key={asset.symbol} className="border rounded-lg p-4">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center space-x-3">
                                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                   <span className="font-bold">{asset.symbol}</span>
                                 </div>
                                 <div>
                                   <h3 className="font-semibold">{asset.name}</h3>
                                   <p className="text-sm text-muted-foreground">
                                     {hideBalances ? "••••••" : `${asset.amount} ${asset.symbol}`}
                                   </p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="font-semibold">
                                   {hideBalances
                                     ? "••••••"
                                     : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                                 </p>
                                 <span className="text-xs text-muted-foreground">
                                   {hideBalances ? null : formatValue(Math.abs(livePnL), currency, krwRate, false)}
                                 </span>
                                 <Badge variant={livePnL >= 0 ? "default" : "destructive"}>
                                   {livePnL >= 0 ? "+" : ""}
                                   {hideBalances ? "••••" : `${livePnLPercent.toFixed(2)}%`}
                                 </Badge>
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                               <div>
                                 <p className="text-muted-foreground">평균 매입가</p>
                                 <p className="font-medium">{formatValue(asset.avgPrice, currency, krwRate, false)}</p>
                               </div>
                               <div>
                                 <p className="text-muted-foreground">현재가</p>
                                 <p className="font-medium">{formatValue(livePrice, currency, krwRate, false)}</p>
                               </div>
                               <div>
                                 <p className="text-muted-foreground">손익</p>
                                 <p className={`font-medium ${livePnL >= 0 ? "text-green-500" : "text-red-500"}`}> 
                                   {hideBalances
                                     ? "••••••"
                                     : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                                 </p>
                               </div>
                               <div>
                                 <p className="text-muted-foreground">비중</p>
                                 <p className="font-medium">{asset.allocation}%</p>
                               </div>
                             </div>
                             <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span>포트폴리오 비중</span>
                                 <span>{asset.allocation}%</span>
                               </div>
                               <Progress value={asset.allocation} className="h-2" />
                             </div>
                             <div className="flex gap-2 mt-4">
                               <Button size="sm" variant="outline">
                                 <Plus className="h-3 w-3 mr-1" />
                                 추가 매수
                               </Button>
                               <Button size="sm" variant="outline">
                                 <Minus className="h-3 w-3 mr-1" />
                                 매도
                               </Button>
                             </div>
                           </div>
                         )
                       })}
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>

               <TabsContent value="history" className="space-y-4">
                 <Card>
                   <CardHeader>
                     <CardTitle>거래 내역</CardTitle>
                     <CardDescription>나의 매매 활동 및 실적</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-3">
                       {transactionHistory.map((tx, index) => (
                         <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex items-center space-x-3">
                             <div
                               className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                 tx.type === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                               }`}
                             >
                               {tx.type === "buy" ? "+" : "-"}
                             </div>
                             <div>
                               <p className="font-medium">
                                 {tx.type === "buy" ? "매수" : "매도"} {tx.amount} {tx.symbol}
                               </p>
                               <p className="text-sm text-muted-foreground">
                                 @ {currency === "KRW"
                                   ? `₩${(tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                   : `$${tx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                 • {tx.date}
                               </p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="font-medium">{currency === "KRW"
                               ? `₩${(tx.amount * tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                               : `$${(tx.amount * tx.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
                             <p className={`text-sm ${tx.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                               {tx.pnl >= 0 ? "+" : ""}
                               {currency === "KRW"
                                 ? `₩${(tx.pnl * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                 : `$${tx.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                             </p>
                           </div>
                         </div>
                       ))}
                     </div>
                   </CardContent>
                 </Card>
               </TabsContent>

               <TabsContent value="analytics">
                 {/* 포트폴리오 요약 */}
                 <Card className="mb-6">
                   <CardHeader>
                     <CardTitle>포트폴리오 요약</CardTitle>
                     <CardDescription>전체 자산 현황 및 수익률</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="text-center">
                         <p className="text-2xl font-bold text-green-600">
                           {hideBalances ? "••••••" : "+₩2,450,000"}
                         </p>
                         <p className="text-sm text-muted-foreground">총 수익</p>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-bold">
                           {hideBalances ? "••••••" : "₩52,450,000"}
                         </p>
                         <p className="text-sm text-muted-foreground">총 자산</p>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-bold text-green-600">
                           {hideBalances ? "••••••" : "+4.9%"}
                         </p>
                         <p className="text-sm text-muted-foreground">수익률</p>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-bold">
                           {hideBalances ? "••••••" : "5"}
                         </p>
                         <p className="text-sm text-muted-foreground">보유 코인</p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 {/* 자산 비중 및 성과 지표 */}
                 <div className="grid md:grid-cols-2 gap-6">
                   <Card>
                     <CardHeader>
                       <CardTitle>자산 비중</CardTitle>
                       <CardDescription>포트폴리오 내 자산별 분포</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         {portfolioData.map((asset) => (
                           <div key={asset.symbol} className="space-y-2">
                             <div className="flex justify-between text-sm">
                               <span className="flex items-center space-x-2">
                                 <div className="w-3 h-3 bg-primary rounded-full" />
                                 <span>{asset.symbol}</span>
                               </span>
                               <span>{asset.allocation}%</span>
                             </div>
                             <Progress value={asset.allocation} className="h-2" />
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>

                   <Card>
                     <CardHeader>
                       <CardTitle>성과 지표</CardTitle>
                       <CardDescription>주요 포트폴리오 통계</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">최고 수익 자산</span>
                           <span className="font-medium text-green-500">ADA (+6.67%)</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">최저 수익 자산</span>
                           <span className="text-muted-foreground">최저 수익 자산</span>
                           <span className="font-medium text-red-500">DOT (-4.0%)</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">수익 거래 비율</span>
                           <span className="font-medium">60%</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">평균 보유 기간</span>
                           <span className="font-medium">12일</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">리스크 점수</span>
                           <span className="font-medium text-orange-500">80</span>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </TabsContent>
             </Tabs>
           </div>
         )

             case "crypto-history":
         return (
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle>거래 내역</CardTitle>
                 <CardDescription>나의 매매 활동 및 실적</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {transactionHistory.map((tx, index) => (
                     <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                       <div className="flex items-center space-x-3">
                         <div
                           className={`w-8 h-8 rounded-full flex items-center justify-center ${
                             tx.type === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                           }`}
                         >
                           {tx.type === "buy" ? "+" : "-"}
                         </div>
                         <div>
                           <p className="font-medium">
                             {tx.type === "buy" ? "매수" : "매도"} {tx.amount} {tx.symbol}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             @ {currency === "KRW"
                               ? `₩${(tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                               : `$${tx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                             • {tx.date}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-medium">{currency === "KRW"
                           ? `₩${(tx.amount * tx.price * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                           : `$${(tx.amount * tx.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</p>
                         <p className={`text-sm ${tx.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                           {tx.pnl >= 0 ? "+" : ""}
                           {currency === "KRW"
                             ? `₩${(tx.pnl * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                             : `$${tx.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </div>
         )

       case "crypto-analysis":
         return (
           <div className="space-y-6">
             {/* 포트폴리오 요약 */}
             <Card className="mb-6">
               <CardHeader>
                 <CardTitle>포트폴리오 요약</CardTitle>
                 <CardDescription>전체 자산 현황 및 수익률</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="text-center">
                     <p className="text-2xl font-bold text-green-600">
                       {hideBalances ? "••••••" : "+₩2,450,000"}
                     </p>
                     <p className="text-sm text-muted-foreground">총 수익</p>
                   </div>
                   <div className="text-center">
                     <p className="text-2xl font-bold">
                       {hideBalances ? "••••••" : "₩52,450,000"}
                     </p>
                     <p className="text-sm text-muted-foreground">총 자산</p>
                   </div>
                   <div className="text-center">
                     <p className="text-2xl font-bold text-green-600">
                       {hideBalances ? "••••••" : "+4.9%"}
                     </p>
                     <p className="text-sm text-muted-foreground">수익률</p>
                   </div>
                   <div className="text-center">
                     <p className="text-2xl font-bold">
                       {hideBalances ? "••••••" : "5"}
                     </p>
                     <p className="text-sm text-muted-foreground">보유 코인</p>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* 자산 비중 및 성과 지표 */}
             <div className="grid md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader>
                   <CardTitle>자산 비중</CardTitle>
                   <CardDescription>포트폴리오 내 자산별 분포</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {portfolioData.map((asset) => (
                       <div key={asset.symbol} className="space-y-2">
                         <div className="flex justify-between text-sm">
                           <span className="flex items-center space-x-2">
                             <div className="w-3 h-3 bg-primary rounded-full" />
                             <span>{asset.symbol}</span>
                           </span>
                           <span>{asset.allocation}%</span>
                         </div>
                         <Progress value={asset.allocation} className="h-2" />
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader>
                   <CardTitle>성과 지표</CardTitle>
                   <CardDescription>주요 포트폴리오 통계</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">최고 수익 자산</span>
                       <span className="font-medium text-green-500">ADA (+6.67%)</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">최저 수익 자산</span>
                       <span className="font-medium text-red-500">DOT (-4.0%)</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">수익 거래 비율</span>
                       <span className="font-medium">60%</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">평균 보유 기간</span>
                       <span className="font-medium">12일</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">리스크 점수</span>
                       <span className="font-medium text-orange-500">80</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
         )

 

      case "profile":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">회원정보</CardTitle>
              <p className="text-gray-600">개인정보 및 계정 설정</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-6">
                  <Avatar className="h-28 w-28">
                    {isEditingProfile || avatar ? (
                      <AvatarImage
                        src={isEditingProfile ? editAvatar : avatar}
                        alt={editNickname}
                        className="object-cover border border-gray-300"
                      />
                    ) : null}
                    <AvatarFallback className="bg-gray-400 border border-gray-300 text-white text-3xl flex items-center justify-center min-h-[112px] min-w-[112px]">
                      <span className="font-bold text-white text-4xl">{editNickname?.charAt(0).toUpperCase() || "U"}</span>
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                  <form className="w-full max-w-md flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">프로필 사진</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="border rounded px-3 py-2 text-sm w-full"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => setEditAvatar(ev.target.result)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                      <input
                        className="border rounded px-3 py-2 text-sm w-full"
                        value={editNickname}
                        onChange={e => setEditNickname(e.target.value)}
                        placeholder="닉네임 입력"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                      <input
                        className="border rounded px-3 py-2 text-sm w-full"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="이메일 입력"
                        type="email"
                      />
                    </div>
                    
                                         <div className="mt-4">
                       <Button 
                         className="w-full" 
                         variant="default" 
                         type="button" 
                         onClick={() => {
                           setAvatar(editAvatar)
                           setIsEditingProfile(false)
                         }}
                       >
                         저장
                       </Button>
                     </div>
                  </form>
                
              </div>
            </CardContent>
          </Card>
        )


    }
  }

  return (
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
      <div className="flex min-h-screen bg-gray-50">
        {/* 좌측 사이드바 */}
        <div className="w-64 bg-white border-r border-gray-200 p-6">
          <div className="mb-8">
            <button 
              className={`block w-full text-left text-2xl font-bold mb-6 transition-colors ${
                activeSection.startsWith("krw") || activeSection.startsWith("crypto") ? "text-blue-600" : "text-gray-900"
              }`}
              onClick={() => setActiveSection("krw-account")}
            >
              자산<TabsContent value="holdings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>현재 보유자산</CardTitle>
                  <CardDescription>보유 자산 상세 보기</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioData.map((asset) => {
                      const livePrice = marketData[asset.symbol]?.price || asset.currentPrice
                      const currentValue = asset.amount * livePrice
                      const livePnL = (livePrice - asset.avgPrice) * asset.amount
                      const livePnLPercent = ((livePrice - asset.avgPrice) / asset.avgPrice) * 100
                      return (
                        <div key={asset.symbol} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="font-bold">{asset.symbol}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold">{asset.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {hideBalances ? "••••••" : `${asset.amount} ${asset.symbol}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {hideBalances
                                  ? "••••••"
                                  : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {hideBalances ? null : formatValue(Math.abs(livePnL), currency, krwRate, false)}
                              </span>
                              <Badge variant={livePnL >= 0 ? "default" : "destructive"}>
                                {livePnL >= 0 ? "+" : ""}
                                {hideBalances ? "••••" : `${livePnLPercent.toFixed(2)}%`}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">평균 매입가</p>
                              <p className="font-medium">{formatValue(asset.avgPrice, currency, krwRate, false)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">현재가</p>
                              <p className="font-medium">{formatValue(livePrice, currency, krwRate, false)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">손익</p>
                              <p className={`font-medium ${livePnL >= 0 ? "text-green-500" : "text-red-500"}`}> 
                                {hideBalances
                                  ? "••••••"
                                  : `${livePnL >= 0 ? "+" : ""}${formatValue(Math.abs(livePnL), currency, krwRate, false)}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">비중</p>
                              <p className="font-medium">{asset.allocation}%</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>포트폴리오 비중</span>
                              <span>{asset.allocation}%</span>
                            </div>
                            <Progress value={asset.allocation} className="h-2" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" />
                              추가 매수
                            </Button>
                            <Button size="sm" variant="outline">
                              <Minus className="h-3 w-3 mr-1" />
                              매도
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </button>
            
            {/* 원화 섹션 */}
            <div className="mb-6">
              <button 
                className={`block w-full text-left text-lg font-semibold mb-3 transition-colors ${
                  activeSection.startsWith("krw") ? "text-blue-600" : "text-gray-700"
                }`}
                onClick={() => setActiveSection("krw-account")}
              >
                원화
              </button>
              <div className="space-y-2 ml-4">
                <button 
                  className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                    activeSubSection === "krw-account" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveSection("krw-account")
                    setActiveSubSection("krw-account")
                    setActiveTab("")
                  }}
                >
                  내 계좌
                </button>
                <button 
                  className={`block w-full text-left text-md text-bold py-2 px-3 rounded-lg transition-colors ${
                    activeSection === "krw-account" && activeTab === "deposit" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveSection("krw-account")
                    setActiveTab("deposit")
                    setActiveSubSection("")
                    // 원화 입출금 섹션으로 스크롤
                    setTimeout(() => {
                      const element = document.getElementById("krw-deposit-section")
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }, 100)
                  }}
                >
                  원화 입출금
                </button>
                <button 
                  className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                    activeSection === "krw-account" && activeTab === "withdrawal" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveSection("krw-account")
                    setActiveTab("withdrawal")
                    setActiveSubSection("")
                    // 원화 거래 내역 섹션으로 스크롤
                    setTimeout(() => {
                      const element = document.getElementById("krw-history-section")
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }, 100)
                  }}
                >
                  원화 거래 내역
                </button>
              </div>
            </div>

            {/* 가상화폐 섹션 */}
            <div className="mb-6">
                             <button 
                 className={`block w-full text-left text-lg font-semibold mb-3 transition-colors ${
                   activeSection.startsWith("crypto") ? "text-blue-600" : "text-gray-700"
                 }`}
                 onClick={() => {
                   setActiveSection("crypto-holdings")
                   setActiveSubSection("")
                   setActiveTab("")
                 }}
               >
                 가상화폐
               </button>
              <div className="space-y-2 ml-4">
                <button 
                  className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                  activeSection === "crypto-holdings" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveSection("crypto-holdings")
                    setActiveSubSection("")
                    setActiveTab("")
                  }}
                >
                   보유 내역
                 </button>
                                 <button 
                   className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                     activeSection === "crypto-history" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                   }`}
                   onClick={() => {
                     setActiveSection("crypto-history")
                     setActiveSubSection("")
                     setActiveTab("")
                   }}
                 >
                   거래 내역
                 </button>
                                 <button 
                   className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                     activeSection === "crypto-analysis" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                   }`}
                   onClick={() => {
                     setActiveSection("crypto-analysis")
                     setActiveSubSection("")
                     setActiveTab("")
                   }}
                 >
                   분석
                 </button>
              </div>
            </div>

            {/* 회원정보 섹션 */}
            <div>
              <button 
                className={`block w-full text-left text-2xl font-bold mb-6 transition-colors ${
                  activeSection === "profile" ? "text-blue-600" : "text-gray-700"
                }`}
                onClick={() => {
                  setActiveSection("profile")
                  setActiveSubSection("")
                  setActiveTab("")
                }}
              >
                회원정보
              </button>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

