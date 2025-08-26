"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Copy, 
  Info, 
  AlertTriangle,
  Bank,
  User,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

export const DepositManager = () => {
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [activeTab, setActiveTab] = useState("deposit")
  const [amountError, setAmountError] = useState("")
  const [withdrawalAmountError, setWithdrawalAmountError] = useState("")
  const [selectedWithdrawalAccount, setSelectedWithdrawalAccount] = useState("")

  // 계좌 정보
  const accountInfo = {
    balance: 5420000,
    dailyLimit: 1200000,
    dailyLimitMax: 50000000,
    monthlyLimit: 8500000,
    monthlyLimitMax: 200000000
  }

  // 입금 전용 계좌 정보
  const depositAccount = {
    bank: "KB국민은행",
    accountHolder: "PickCoin 입금 전용",
    accountNumber: "123-456-789012",
    companyName: "예금주: (주)픽코인"
  }

  // 출금 전용 계좌 정보
  const withdrawalAccounts = [
    {
      id: "account1",
      bank: "KB국민은행",
      accountHolder: "픽코인 출금 전용",
      accountNumber: "123-456-789012",
      companyName: "예금주: (주)픽코인"
    },
    {
      id: "account2",
      bank: "신한은행",
      accountHolder: "픽코인 출금 전용",
      accountNumber: "987-654-321098",
      companyName: "예금주: (주)픽코인"
    },
    {
      id: "account3",
      bank: "우리은행",
      accountHolder: "픽코인 출금 전용",
      accountNumber: "112-233-445566",
      companyName: "예금주: (주)픽코인"
    }
  ]

  // 거래 내역
  const transactions = [
    {
      type: "deposit",
      bank: "KB국민은행",
      date: "2024-01-15 14:32:15",
      reference: "DEP240115001",
      amount: 1000000,
      fee: 0,
      status: "완료"
    },
    {
      type: "withdrawal",
      bank: "신한은행",
      date: "2024-01-15 13:45:22",
      reference: "WTH240115002",
      amount: 500000,
      fee: 1000,
      status: "완료"
    },
    {
      type: "deposit",
      bank: "우리은행",
      date: "2024-01-15 12:18:45",
      reference: "DEP240115003",
      amount: 2000000,
      fee: 0,
      status: "완료"
    },
    {
      type: "withdrawal",
      bank: "하나은행",
      date: "2024-01-15 11:30:12",
      reference: "WTH240115004",
      amount: 300000,
      fee: 1000,
      status: "실패"
    }
  ]

  const formatKRW = (num) => {
    return `₩${num.toLocaleString()}`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "완료":
        return "text-green-600"
      case "처리중":
        return "text-blue-600"
      case "실패":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case "완료":
        return "bg-green-50"
      case "처리중":
        return "bg-blue-50"
      case "실패":
        return "bg-red-50"
      default:
        return "bg-gray-50"
    }
  }

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(depositAccount.accountNumber)
    // 여기에 복사 완료 알림을 추가할 수 있습니다
  }

  const formatInputNumber = (value) => {
    // 숫자가 아닌 문자 제거
    const numericValue = value.replace(/[^\d]/g, '')
    // 천 단위로 쉼표 추가
    if (numericValue) {
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return ''
  }

  const handleDepositAmountChange = (e) => {
    const formattedValue = formatInputNumber(e.target.value)
    setDepositAmount(formattedValue)
    
    // 유효성 검사
    validateDepositAmount(formattedValue)
  }

  const validateDepositAmount = (amount) => {
    // 쉼표 제거하여 숫자만 추출
    const numericAmount = amount.replace(/,/g, '')
    
    if (!numericAmount) {
      setAmountError("")
      return
    }
    
    const amountNumber = parseInt(numericAmount)
    
    if (amountNumber < 10000) {
      setAmountError("최소 입금액은 ₩10,000입니다.")
    } else if (amountNumber > 50000000) {
      setAmountError("최대 입금액은 ₩50,000,000입니다.")
    } else {
      setAmountError("")
    }
  }

  const validateWithdrawalAmount = (amount) => {
    // 쉼표 제거하여 숫자만 추출
    const numericAmount = amount.replace(/,/g, '')
    
    if (!numericAmount) {
      setWithdrawalAmountError("")
      return
    }
    
    const amountNumber = parseInt(numericAmount)
    
    if (amountNumber < 10000) {
      setWithdrawalAmountError("최소 출금액은 ₩10,000입니다.")
    } else if (amountNumber > 50000000) {
      setWithdrawalAmountError("최대 출금액은 ₩50,000,000입니다.")
    } else if (amountNumber > accountInfo.balance) {
      setWithdrawalAmountError("보유 원화보다 많은 금액을 출금할 수 없습니다.")
    } else {
      setWithdrawalAmountError("")
    }
  }

  return (
    <div className="space-y-8">
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
                {formatKRW(accountInfo.balance)}
              </div>
              <div className="text-sm text-gray-600">보유 원화</div>
            </div>

            {/* 일일 한도 */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {formatKRW(accountInfo.dailyLimit)} / {formatKRW(accountInfo.dailyLimitMax)}
              </div>
              <div className="text-sm text-gray-600 mb-2">일일 한도</div>
              <Progress 
                value={(accountInfo.dailyLimit / accountInfo.dailyLimitMax) * 100} 
                className="h-2"
              />
            </div>

            {/* 월간 한도 */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {formatKRW(accountInfo.monthlyLimit)} / {formatKRW(accountInfo.monthlyLimitMax)}
              </div>
              <div className="text-sm text-gray-600 mb-2">월간 한도</div>
              <Progress 
                value={(accountInfo.monthlyLimit / accountInfo.monthlyLimitMax) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 원화 입출금 */}
      <Card>
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
                    <span className="font-medium">{depositAccount.bank}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">계좌번호:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{depositAccount.accountNumber}</span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={copyAccountNumber}
                        className="h-8 px-3"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        계좌번호 복사
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">예금주:</span>
                    <span className="font-medium">{depositAccount.companyName}</span>
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
                    value={depositAmount}
                    onChange={handleDepositAmountChange}
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
                {amountError && (
                  <p className="text-sm text-red-600 mt-2">{amountError}</p>
                )}
                
                {/* 입금 버튼 */}
                <div className="mt-4">
                  <Button 
                    className="w-full h-12 text-lg font-semibold"
                    disabled={!depositAmount || amountError}
                    onClick={() => {
                      // 입금 처리 로직
                      alert(`₩${depositAmount} 입금이 요청되었습니다.`)
                    }}
                  >
                    입금 요청
                  </Button>
                </div>
              </div>

              {/* 입금 안내사항 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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

              {/* 보안 주의사항 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <h4 className="font-semibold mb-2">보안 주의사항</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• 타인 명의로 입금 시 출금이 제한될 수 있습니다.</li>
                      <li>• 입금 전용 계좌는 입금만 가능하며, 다른 용도로 사용하지 마세요.</li>
                      <li>• 의심스러운 거래 발견 시 즉시 고객센터로 연락해주세요.</li>
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
                <select
                  className="w-full h-12 text-lg border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedWithdrawalAccount}
                  onChange={(e) => setSelectedWithdrawalAccount(e.target.value)}
                >
                  <option value="">계좌를 선택해주세요</option>
                  {withdrawalAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank} - {account.accountNumber} ({account.accountHolder})
                    </option>
                  ))}
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
                    value={withdrawalAmount}
                    onChange={(e) => {
                      const formattedValue = formatInputNumber(e.target.value);
                      setWithdrawalAmount(formattedValue);
                      validateWithdrawalAmount(formattedValue);
                    }}
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
                {withdrawalAmountError && (
                  <p className="text-sm text-red-600 mt-2">{withdrawalAmountError}</p>
                )}
              </div>

              {/* 출금 요청 버튼 */}
              <div className="mt-4">
                <Button 
                  className="w-full h-12 text-lg font-semibold"
                  disabled={!selectedWithdrawalAccount || !withdrawalAmount || withdrawalAmountError}
                  onClick={() => {
                    // 출금 처리 로직
                    alert(`₩${withdrawalAmount} 출금이 요청되었습니다.`)
                  }}
                >
                  출금 요청
                </Button>
              </div>

              {/* 출금 안내사항 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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

              {/* 보안 주의사항 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <h4 className="font-semibold mb-2">보안 주의사항</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• 타인 명의로 출금 시 출금이 제한될 수 있습니다.</li>
                      <li>• 출금 전용 계좌는 출금만 가능하며, 다른 용도로 사용하지 마세요.</li>
                      <li>• 의심스러운 거래 발견 시 즉시 고객센터로 연락해주세요.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 원화 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">원화 거래 내역</CardTitle>
          <p className="text-gray-600">최근 원화 입금 및 출금 내역</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "deposit" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {tx.type === "deposit" ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {tx.type === "deposit" ? "입금" : "출금"} - {tx.bank}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tx.date} • {tx.reference}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatKRW(tx.amount)}
                  </div>
                  {tx.fee > 0 && (
                    <div className="text-sm text-gray-500">
                      수수료: {formatKRW(tx.fee)}
                    </div>
                  )}
                  <div className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${
                    getStatusBg(tx.status)
                  } ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
