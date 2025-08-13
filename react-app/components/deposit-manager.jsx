"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
// import Navigation from "@/components/dashboard/navigation"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Info,
  ExternalLink,
  Wallet,
  Building2,
  CreditCard,
  User,
  Phone,
} from "lucide-react"


// 아래 import들은 현재 프로젝트에 파일이 없으므로 주석 처리합니다.
// import { useTheme } from "@/hooks/use-theme"
// import { getThemeClasses } from "@/lib/theme-config"
// import Header from "@/components/dashboard/header"
// import Navigation from "@/components/dashboard/navigation"

// Navigation은 아래처럼 사용 가능합니다.
import { Navigation } from "@/components/navigation"

// Header가 필요하다면, 프로젝트 내 다른 Header 컴포넌트를 찾아 대체하거나 직접 구현하세요.

// 테마 관련 기능이 필요하다면, 직접 useTheme 훅을 구현하거나 기본 스타일만 사용하세요.
// 예시:
// const theme = "light"; // 또는 useState로 관리
// const themeClasses = theme === "dark" ? "bg-dark text-white" : "bg-light text-black";

// 사용자 계좌 정보
const userAccount = {
  balance: 5420000,
  dailyLimit: 50000000,
  monthlyLimit: 200000000,
  usedDaily: 1200000,
  usedMonthly: 8500000,
}

// 지원 은행 목록
const supportedBanks = [
  { code: "KB", name: "KB국민은행", fee: 1000 },
  { code: "SH", name: "신한은행", fee: 1000 },
  { code: "WR", name: "우리은행", fee: 1000 },
  { code: "HN", name: "하나은행", fee: 1000 },
  { code: "NH", name: "농협은행", fee: 1000 },
  { code: "IBK", name: "기업은행", fee: 1000 },
  { code: "KEB", name: "외환은행", fee: 1000 },
  { code: "SC", name: "SC제일은행", fee: 1000 },
  { code: "CT", name: "씨티은행", fee: 1000 },
  { code: "KK", name: "카카오뱅크", fee: 500 },
  { code: "TO", name: "토스뱅크", fee: 500 },
]

// 거래 내역
const recentTransactions = [
  {
    id: 1,
    type: "deposit",
    amount: 1000000,
    status: "completed",
    time: "2024-01-15 14:32:15",
    bank: "KB국민은행",
    reference: "DEP240115001",
    fee: 0,
  },
  {
    id: 2,
    type: "withdraw",
    amount: 500000,
    status: "pending",
    time: "2024-01-15 13:45:22",
    bank: "신한은행",
    reference: "WTH240115002",
    fee: 1000,
  },
  {
    id: 3,
    type: "deposit",
    amount: 2000000,
    status: "completed",
    time: "2024-01-15 12:18:45",
    bank: "우리은행",
    reference: "DEP240115003",
    fee: 0,
  },
  {
    id: 4,
    type: "withdraw",
    amount: 300000,
    status: "failed",
    time: "2024-01-15 11:30:12",
    bank: "하나은행",
    reference: "WTH240115004",
    fee: 1000,
  },
]

export default function DepositManager() {
  // 테마 관련 훅과 변수 제거 (프로젝트에 없음)


    // 사용자 계좌 정보 상태
    const [depositAmount, setDepositAmount] = useState("") // 입금 금액
    const [withdrawAmount, setWithdrawAmount] = useState("") // 출금 금액
    const [selectedBank, setSelectedBank] = useState("") // 선택된 은행
    const [accountNumber, setAccountNumber] = useState("") // 계좌번호
    const [accountHolder, setAccountHolder] = useState("") // 예금주

  const userAccount = {
    balance: 5420000,
    dailyLimit: 50000000,
    monthlyLimit: 200000000,
    usedDaily: 1200000,
    usedMonthly: 8500000,
  }

  const supportedBanks = [
    { code: "KB", name: "KB국민은행", fee: 1000 },
    { code: "SH", name: "신한은행", fee: 1000 },
    { code: "WR", name: "우리은행", fee: 1000 },
    { code: "HN", name: "하나은행", fee: 1000 },
    { code: "NH", name: "농협은행", fee: 1000 },
    { code: "IBK", name: "기업은행", fee: 1000 },
    { code: "KEB", name: "외환은행", fee: 1000 },
    { code: "SC", name: "SC제일은행", fee: 1000 },
    { code: "CT", name: "씨티은행", fee: 1000 },
    { code: "KK", name: "카카오뱅크", fee: 500 },
    { code: "TO", name: "토스뱅크", fee: 500 },
  ]

  const recentTransactions = [
    { id: 1, type: "deposit", amount: 1000000, status: "completed", time: "2024-01-15 14:32:15", bank: "KB국민은행", reference: "DEP240115001", fee: 0 },
    { id: 2, type: "withdraw", amount: 500000, status: "pending", time: "2024-01-15 13:45:22", bank: "신한은행", reference: "WTH240115002", fee: 1000 },
    { id: 3, type: "deposit", amount: 2000000, status: "completed", time: "2024-01-15 12:18:45", bank: "우리은행", reference: "DEP240115003", fee: 0 },
    { id: 4, type: "withdraw", amount: 300000, status: "failed", time: "2024-01-15 11:30:12", bank: "하나은행", reference: "WTH240115004", fee: 1000 },
  ]

  const formatKRW = (amount) => `₩${amount.toLocaleString()}`

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    }

    const labels = {
      completed: "완료",
      pending: "처리중",
      failed: "실패",
    }

    return <Badge className={`${variants[status]} border-0`}>{labels[status]}</Badge>
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const selectedBankData = supportedBanks.find((bank) => bank.code === selectedBank)

  return (
  <div className="min-h-screen bg-background">
    <Navigation />
        
        <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">원화 입출금</h1>
            <p className="text-muted-foreground mt-2">한국 원화(KRW) 입금 및 출금을 안전하게 관리하세요</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Panel - Account Info */}
          <div className="xl:col-span-1">
            <Card className="border mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />내 계좌 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">보유 원화</p>
                    <p className="text-2xl font-bold">{formatKRW(userAccount.balance)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">일일 한도</span>
                      <span className="text-sm">{formatKRW(userAccount.usedDaily)} / {formatKRW(userAccount.dailyLimit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(userAccount.usedDaily / userAccount.dailyLimit) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">월간 한도</span>
                      <span className="text-sm">{formatKRW(userAccount.usedMonthly)} / {formatKRW(userAccount.monthlyLimit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(userAccount.usedMonthly / userAccount.monthlyLimit) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">빠른 메뉴</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <User className="h-4 w-4 mr-2" />계좌 인증
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <Phone className="h-4 w-4 mr-2" />본인 인증
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                  <CreditCard className="h-4 w-4 mr-2" />한도 증액
                </Button>
              </CardContent>
            </Card>
          </div>
          {/* Right Panel - Deposit/Withdraw Forms */}
          <div className="xl:col-span-3">
            <Card className="border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">원화 입출금</CardTitle>
                    <CardDescription className="text-muted-foreground">한국 원화 입금 및 출금 서비스</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">실시간 계좌이체</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="deposit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="deposit" className="flex items-center gap-2">
                      <ArrowDownLeft className="h-4 w-4" />입금
                    </TabsTrigger>
                    <TabsTrigger value="withdraw" className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />출금
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="deposit" className="space-y-6">
                    {/* Deposit Account Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">입금 전용 계좌</label>
                        <div className="p-4 rounded-lg border bg-background">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">KB국민은행</p>
                                <p className="text-sm text-muted-foreground">PickCoin 입금 전용</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-lg">123-456-789012</p>
                                <p className="text-sm text-muted-foreground">예금주: (주)픽코인</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard("123456789012")} className="flex-1">
                                <Copy className="h-4 w-4 mr-2" />계좌번호 복사
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Expected Deposit Amount */}
                      <div>
                        <label className="block text-sm font-medium mb-2">입금 예정 금액</label>
                        <Input type="number" placeholder="입금할 금액을 입력하세요" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                        <p className="text-sm text-muted-foreground mt-1">최소 입금액: ₩10,000 / 최대 입금액: ₩50,000,000</p>
                      </div>
                    </div>
                    {/* Deposit Instructions */}
                    <div className="p-4 rounded-lg border bg-blue-50">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-900">입금 안내사항</h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• 위 계좌로 입금하시면 실시간으로 반영됩니다</li>
                            <li>• 입금자명은 반드시 본인 명의로 입금해주세요</li>
                            <li>• 최소 입금액: ₩10,000</li>
                            <li>• 입금 수수료: 무료 (단, 은행 이체 수수료는 고객 부담)</li>
                            <li>• 처리 시간: 실시간 (은행 영업시간 내)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    {/* Security Notice */}
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-900">보안 주의사항</h4>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• 타인 명의로 입금 시 출금이 제한될 수 있습니다</li>
                            <li>• 입금 전용 계좌는 입금만 가능하며, 다른 용도로 사용하지 마세요</li>
                            <li>• 의심스러운 거래 발견 시 즉시 고객센터로 연락해주세요</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="withdraw" className="space-y-6">
                    {/* Bank Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">출금 은행 선택</label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="은행을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedBanks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              <div className="flex items-center justify-between w-full">
                                <span>{bank.name}</span>
                                <span className="text-xs text-gray-500 ml-2">수수료: ₩{bank.fee.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Account Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">계좌번호</label>
                        <Input placeholder="계좌번호를 입력하세요" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">예금주명</label>
                        <Input placeholder="예금주명을 입력하세요" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                      </div>
                    </div>
                    {/* Withdrawal Amount */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">출금 금액</label>
                      <div className="space-y-3">
                        <Input type="number" placeholder="출금할 금액을 입력하세요" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount((userAccount.balance * 0.25).toString())}>25%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount((userAccount.balance * 0.5).toString())}>50%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount((userAccount.balance * 0.75).toString())}>75%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(userAccount.balance.toString())}>전체</Button>
                        </div>
                      </div>
                    </div>
                    {/* Withdrawal Summary */}
                    <div className="p-4 rounded-lg border bg-background">
                      <h4 className="font-medium mb-3">출금 요약</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">보유 원화:</span>
                          <span className="text-sm font-medium">{formatKRW(userAccount.balance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">출금 금액:</span>
                          <span className="text-sm font-medium">{formatKRW(Number.parseInt(withdrawAmount) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">출금 수수료:</span>
                          <span className="text-sm font-medium">{formatKRW(selectedBankData?.fee || 0)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">실제 출금액:</span>
                            <span className="text-sm font-bold">{formatKRW(Math.max(0, (Number.parseInt(withdrawAmount) || 0) - (selectedBankData?.fee || 0)))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Withdrawal Button */}
                    <Button className="w-full" size="lg" disabled={!selectedBank || !accountNumber || !accountHolder || !withdrawAmount}>원화 출금 신청</Button>
                    {/* Withdrawal Notice */}
                    <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-yellow-900">출금 주의사항</h4>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            <li>• 최소 출금액: ₩10,000</li>
                            <li>• 출금 계좌는 반드시 본인 명의 계좌여야 합니다</li>
                            <li>• 출금 처리 시간: 평일 09:00~15:30 (실시간), 그 외 시간대는 다음 영업일 처리</li>
                            <li>• 출금 신청 후 취소는 처리 전에만 가능합니다</li>
                            <li>• 일일 출금 한도: ₩50,000,000</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            {/* Transaction History */}
            <Card className="border mt-6">
              <CardHeader>
                <CardTitle>원화 거래 내역</CardTitle>
                <CardDescription className="text-muted-foreground">최근 원화 입금 및 출금 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === "deposit" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                          {tx.type === "deposit" ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold">{tx.type === "deposit" ? "원화 입금" : "원화 출금"}</p>
                            <Badge variant="outline" className="text-xs">{tx.bank}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tx.time}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono">{tx.reference}</code>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0"><ExternalLink className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatKRW(tx.amount)}</p>
                          {tx.fee > 0 && <p className="text-xs text-muted-foreground">수수료: {formatKRW(tx.fee)}</p>}
                        </div>
                        <div className="flex flex-col items-center space-y-1">{getStatusIcon(tx.status)}{getStatusBadge(tx.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
