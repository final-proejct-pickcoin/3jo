"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft, ArrowUpRight, Copy, Clock, CheckCircle, AlertCircle,
  Shield, Info, ExternalLink, Wallet, Building2, CreditCard, User, Phone,
} from "lucide-react";

// 필요하면 켜기 (레이아웃에 이미 있으면 중복되므로 비활성 유지)
// import { Navigation } from "@/components/navigation";

// ===================== 모듈 상수/유틸 (훅 X) =====================
const ACCOUNT_API = "http://localhost:8080/api/account";

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
];

const formatKRW = (amount) => `₩${Number(amount ?? 0).toLocaleString()}`;
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const copyToClipboard = (text) => navigator.clipboard.writeText(text);

const dayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const monthKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// ===================== 컴포넌트 =====================
export default function DepositManager() {
  // ===== 사용자 ID =====
  const [user_id, setUserId] = useState(null);

  useEffect(() => {
    // 캐시 우선
    const cached = sessionStorage.getItem("cached_user_id");
    if (cached && user_id == null) setUserId(Number(cached));

    const tokenValue = sessionStorage.getItem("auth_token");
    if (!tokenValue) return;

    let payload = null;
    try {
      payload = JSON.parse(atob(tokenValue.split(".")[1]));
    } catch {
      return;
    }
    const user_mail = payload.email || payload.sub || null;
    if (!user_mail) return;

    let mounted = true;
    const controller = new AbortController();
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));

    idle(() => {
      if (!mounted) return;
      fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          if (!mounted) return;
          if (data && data.user_id != null) {
            const idNum = Number(data.user_id);
            setUserId(idNum);
            sessionStorage.setItem("cached_user_id", String(idNum));
          }
        })
        .catch((err) => {
          if (err?.name !== "AbortError") console.error(err);
        });
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // ===== 잔액/폼/상태 =====
  const [krw, setKrw] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // ===== 한도 (입금 시 누적) =====
  const DAILY_LIMIT = 50_000_000;
  const MONTHLY_LIMIT = 200_000_000;
  const [usedDaily, setUsedDaily] = useState(0);
  const [usedMonthly, setUsedMonthly] = useState(0);

  const limitsKey = (uid) => `krw_limits:${uid}`;
  const saveLimits = (uid, data) => {
    try {
      localStorage.setItem(limitsKey(uid), JSON.stringify(data));
    } catch {}
  };
  const loadLimits = (uid) => {
    try {
      const raw = localStorage.getItem(limitsKey(uid));
      const nowDay = dayKey();
      const nowMonth = monthKey();
      if (!raw) {
        const init = { usedDaily: 0, usedMonthly: 0, dayKey: nowDay, monthKey: nowMonth };
        saveLimits(uid, init);
        setUsedDaily(0);
        setUsedMonthly(0);
        return;
      }
      const parsed = JSON.parse(raw);
      let d = parsed.usedDaily ?? 0;
      let m = parsed.usedMonthly ?? 0;
      if (parsed.dayKey !== nowDay) d = 0;
      if (parsed.monthKey !== nowMonth) m = 0;
      setUsedDaily(d);
      setUsedMonthly(m);
      saveLimits(uid, { usedDaily: d, usedMonthly: m, dayKey: nowDay, monthKey: nowMonth });
    } catch {
      setUsedDaily(0);
      setUsedMonthly(0);
    }
  };
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (user_id) loadLimits(user_id);
  }, [user_id]);

  const bumpUsageOnDeposit = (uid, delta) => {
    if (!uid || delta <= 0) return;
    const nowDay = dayKey();
    const nowMonth = monthKey();
    const newDaily = Math.min(DAILY_LIMIT, usedDaily + delta);
    const newMonthly = Math.min(MONTHLY_LIMIT, usedMonthly + delta);
    setUsedDaily(newDaily);
    setUsedMonthly(newMonthly);
    saveLimits(uid, { usedDaily: newDaily, usedMonthly: newMonthly, dayKey: nowDay, monthKey: nowMonth });
  };

  // ===== API =====
  const fetchBalance = async (uid) => {
    if (!uid) return;
    try {
      const { data } = await axios.get(`${ACCOUNT_API}/balance`, {
        params: { user_id: uid },
        headers: { Accept: "application/json" },
      });
      setKrw(Number(data?.krw_balance ?? 0));
    } catch (e) {
      console.error(e);
      setErrMsg("잔액 조회 실패");
    }
  };

  const deposit_logs = async (id) =>{
    try{
      // console.log("입출금 user_id:",user_id)
      const res = await axios.get(`http://localhost:8000/users/${id}/transactions`)
      setLogs(res.data)
    }catch(err){
      console.error(err)
    }
  }

  useEffect(() => {
    if (user_id) fetchBalance(user_id);

    if (!user_id) return;

    deposit_logs(user_id);

  }, [user_id, logs]);

  const handleDeposit = async () => {
    if (!user_id) return alert("로그인이 필요합니다.");
    const amount = toNumber(depositAmount);
    if (amount <= 0) return alert("입금 금액을 올바르게 입력하세요.");

    try {
      setIsBusy(true);
      setErrMsg("");
      const { data } = await axios.post(`${ACCOUNT_API}/deposit`, null, {
        params: { user_id, amount },
      });
      
      setKrw(Number(data?.krw_balance ?? 0));
      setDepositAmount("");      
      // 한도 사용량 증가 (입금 시 집계)
      bumpUsageOnDeposit(user_id, amount);      
    } catch (e) {
      console.error(e);
      alert("입금 실패: " + (e.response?.data?.message ?? e.message));
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user_id) return alert("로그인이 필요합니다.");
    const amountRaw = toNumber(withdrawAmount);
    if (amountRaw <= 0) return alert("출금 금액을 올바르게 입력하세요.");
    if (krw < amountRaw) return alert("보유 KRW가 부족합니다.");

    try {
      setIsBusy(true);
      setErrMsg("");
      const { data } = await axios.post(`${ACCOUNT_API}/withdraw`, null, {
        params: { user_id, amount: amountRaw },
      });
      setKrw(Number(data?.krw_balance ?? 0));
      setWithdrawAmount("");      
      // *출금도 한도에 반영하려면 다음 줄 주석 해제*
      // bumpUsageOnDeposit(user_id, amountRaw);
    } catch (e) {
      console.error(e);
      alert("출금 실패: " + (e.response?.data?.message ?? e.message));
    } finally {
      setIsBusy(false);
    }
  };

  // ===== 파생값 =====
  const selectedBankData = supportedBanks.find((b) => b.code === selectedBank);
  const fee = Number(selectedBankData?.fee ?? 0);
  const withdrawRaw = toNumber(withdrawAmount);
  const withdrawNet = Math.max(0, withdrawRaw - fee);
  const afterWithdraw = Math.max(0, krw - withdrawNet);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":   return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":    return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:          return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // ===================== 렌더 =====================
  return (
    <div className="min-h-screen bg-background">
      {/* 필요 시 네비게이션 사용 */}
      {/* <Navigation /> */}

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
                    <p className="text-2xl font-bold">{formatKRW(krw)}</p>
                  </div>
                </div>

                {/* 일일 한도 */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">일일 한도</span>
                      <span className="text-sm">
                        {formatKRW(usedDaily)} / {formatKRW(DAILY_LIMIT)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(usedDaily) / Math.max(1, Number(DAILY_LIMIT))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 월간 한도 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">월간 한도</span>
                      <span className="text-sm">
                        {formatKRW(usedMonthly)} / {formatKRW(MONTHLY_LIMIT)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (Number(usedMonthly) / Math.max(1, Number(MONTHLY_LIMIT))) * 100)}%`,
                        }}
                      />
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

                  {/* 입금 */}
                  <TabsContent value="deposit" className="space-y-6">
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

                      <div>
                        <label className="block text-sm font-medium mb-2">입금 예정 금액</label>
                        <Input
                          type="number"
                          placeholder="입금할 금액을 입력하세요"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          최소 입금액: ₩10,000 / 최대 입금액: ₩50,000,000
                        </p>

                        <p className="text-sm mt-2">
                          예상 보유 원화: <b>{formatKRW(krw + toNumber(depositAmount))}</b>
                        </p>

                        <Button
                          className="w-full mt-2"
                          size="lg"
                          disabled={isBusy || toNumber(depositAmount) <= 0}
                          onClick={handleDeposit}
                        >
                          입금 실행
                        </Button>
                      </div>
                    </div>

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

                  {/* 출금 */}
                  <TabsContent value="withdraw" className="space-y-6">
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

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">출금 금액</label>
                      <div className="space-y-3">
                        <Input
                          type="number"
                          placeholder="출금할 금액을 입력하세요"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(String(Math.floor(krw * 0.25)))}>25%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(String(Math.floor(krw * 0.5)))}>50%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(String(Math.floor(krw * 0.75)))}>75%</Button>
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(String(krw))}>전체</Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-background">
                      <h4 className="font-medium mb-3">출금 요약</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">보유 원화:</span>
                          <span className="text-sm font-medium">{formatKRW(krw)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">출금 금액:</span>
                          <span className="text-sm font-medium">{formatKRW(withdrawRaw)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">출금 수수료:</span>
                          <span className="text-sm font-medium">{formatKRW(fee)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">실제 출금액(수수료 반영):</span>
                            <span className="text-sm font-bold">{formatKRW(Math.max(0, withdrawNet))}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm font-medium">예상 보유 원화:</span>
                            <span className="text-sm font-bold">{formatKRW(afterWithdraw)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={isBusy || !selectedBank || !accountNumber || !accountHolder || toNumber(withdrawAmount) <= 0}
                      onClick={handleWithdraw}
                    >
                      원화 출금
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 거래 내역: 추후 백엔드 붙이면 교체 */}
            <Card className="border mt-6">
              <CardHeader>
                <CardTitle>입출금 내역</CardTitle>
                <CardDescription className="text-muted-foreground">최근 원화 입금 및 출금 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 아직 API 없으니 비움 또는 더미 */}
                  {/* 더미가 필요하면 여기에 map으로 렌더 */}
                  {logs.map( (log, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{log.action === "deposit" ? "입금" : "출금"}</span>
                      <span>{Number(log.amount).toLocaleString()} 원</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!!errMsg && (
              <div className="text-sm text-red-600 mt-3">{errMsg}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
