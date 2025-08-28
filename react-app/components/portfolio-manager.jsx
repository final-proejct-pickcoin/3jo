"use client"

import { useState, useEffect,useMemo } from "react"
import axios from "axios";
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

//기본 백단 주소들
const ACCOUNT_API = "http://localhost:8080/api/account";
const PORTFOLIO_API = "http://localhost:8080/api/portfolio";

//====원화 입출금 기능===


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

export const PortfolioManager = () => {
  const [activeSection, setActiveSection] = useState("krw-account")
  const [activeTab, setActiveTab] = useState("")
  const [activeSubSection, setActiveSubSection] = useState("krw-account")
  const { subscribe, marketData } = useWebSocket()
  const [hideBalances, setHideBalances] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h")
  const [krwRate, setKrwRate] = useState(0)
  const [currency, setCurrency] = useState("KRW") // "KRW" or "USD"
  
     // 프로필 관리 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editNickname, setEditNickname] = useState("사용자")
  const [avatar, setAvatar] = useState("/placeholder-user.jpg")
  const [editAvatar, setEditAvatar] = useState(avatar)
  
   // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
   // 원래 값 저장용 상태
  const [originalNickname, setOriginalNickname] = useState("사용자")
  const [originalAvatar, setOriginalAvatar] = useState("/placeholder-user.jpg")

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

  // ===== 입출금 로그 =====
  const [logs, setLogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);


     // ===== 사용자 ID =====
  const [user_id, setUserId] = useState(null);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10); // 10개씩 더 보여줌
  };

  const visibleLogs = logs.slice(0, visibleCount); // 현재 보여줄 범위

  // 입출금  로그 가져오는 함수
  const deposit_logs = async (id) =>{
    try{
      // console.log("입출금 user_id:",user_id)
      const res = await axios.get(`http://localhost:8000/users/${id}/transactions`)
      setLogs(res.data)
    }catch(err){
      console.error(err)
    }
  }

  // 여기에 넣기
  useEffect(() => {
    if (!user_id) return;

    deposit_logs(user_id);
    // console.log("입출금 로그",logs)

  }, [user_id, logs]); //

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


  //======

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



  // ===== 입출금 기능 API =====
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

  useEffect(() => {
    if (user_id) fetchBalance(user_id);
  }, [user_id]);

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


//====여기까지 원화 입출금 관련 기능====

//==== 가상화폐 관련 기능 ====

//====거래내역====
const normalizeSymbol = (symLike) => {
  if (!symLike) return { base: "", market: "KRW", rtKey: "" }
  const s = String(symLike).toUpperCase().trim()
  if (s.includes("_")) {
    const [base, market] = s.split("_")
    return { base, market, rtKey: `${base}_${market}` }
  }
  const delim = s.includes("-") ? "-" : (s.includes("/") ? "/" : "")
  if (delim) {
    const [a, b] = s.split(delim)
    if (a === "KRW") return { base: b, market: "KRW", rtKey: `${b}_KRW` }
    if (b === "KRW") return { base: a, market: "KRW", rtKey: `${a}_KRW` }
    return { base: a, market: b, rtKey: `${a}_${b}` }
  }
  return { base: s, market: "KRW", rtKey: `${s}_KRW` }
}
const fmtKRW = (n) => `₩${Math.round(Number(n)||0).toLocaleString()}`
const fmtDate = (v) => {
  if (!v) return ""
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,"0")
  const day = String(d.getDate()).padStart(2,"0")
  return `${y}-${m}-${day}`
}

const fmt = (v) =>
  currency === "KRW"
    ? `₩${Math.round(v).toLocaleString()}`
    : `$${Math.round(v / (krwRate || 1350)).toLocaleString()}`;


// 화면 상단
const [trades, setTrades] = useState([])
const [loadingTrades, setLoadingTrades] = useState(false)

useEffect(() => {
  if (!user_id) return
  const loadTrades = async () => {
    try {
      setLoadingTrades(true)
      const res = await axios.get(`${PORTFOLIO_API}/trades`, { params: { user_id } })
      //console.log("TRADES raw response:", res.data);
      // 백엔드 응답 예: [{ symbol, orderType, notional, assetId, price, createdAt, ... }, ...]
      const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      const trades = rows.map((r) => {
        const isBuy = Number(r.orderType) === 0;
        const priceKRW = Number(r.price ?? 0);             // 단가(원)
        const valueKRW = Number(r.notional ?? 0);          // 체결금액(원) — 백엔드가 notional 제공
        const amount   = priceKRW ? valueKRW / priceKRW : 0; // 수량 = 금액/단가

        return {
          isBuy,                                   // true/false
          side: isBuy ? "buy" : "sell",            // "buy"/"sell"도 제공(원하면 사용)
          symbol: String(r.symbol || "").toUpperCase(),
          amount,
          priceKRW,
          valueKRW,
          pnlKRW: Number(r.pnl_krw ?? r.pnl ?? 0), // 있으면 표시, 없으면 0
          date: r.createdAt ?? r.ts ?? r.date ?? r.filledAt??"", // 백엔드 키 중 있는 걸 사용
        };
      });

      setTrades(trades);
    } finally {
      setLoadingTrades(false)
    }
  }
  loadTrades()
}, [user_id])


function withRunningTotals(trades) {
  // 오래된 순으로 정렬해서 누적합 계산
  const sorted = [...trades].sort((a, b) => {
    const ta = new Date(a.date).getTime() || 0;
    const tb = new Date(b.date).getTime() || 0;
    return ta - tb;
  });

  const acc = new Map();
  const decorated = sorted.map((t) => {
    const s = t.symbol;
    if (!acc.has(s)) acc.set(s, { buy: 0, sell: 0 });
    const a = acc.get(s);

    const before = {
      buyKRW: a.buy,
      sellKRW: a.sell,
      netKRW: a.buy - a.sell,
    };

    // 이번 체결 반영
    if (t.isBuy) a.buy += Number(t.valueKRW || 0);
    else a.sell += Number(t.valueKRW || 0);

    const after = {
      buyKRW: a.buy,
      sellKRW: a.sell,
      netKRW: a.buy - a.sell,
    };

    return { ...t, runningBefore: before, runningAfter: after };
  });

  // 내역 위에 최신이 뜨도록
  return decorated.reverse();
}

const tradesWithRun = useMemo(() => {
  if (!Array.isArray(trades) || trades.length === 0) return [];

  // 화면에 현재 쓰는 순서(최신→과거라고 가정)를 *그대로* 기준 삼음
  const list = [...trades];

  // 누적용 버퍼 (심볼별)
  const acc = new Map(); // symbol -> { buy: number, sell: number }

  // 리스트의 "아래줄"까지 합계를 보여주려면, 아래에서부터 위로 누적해서 위로 올림
  // (보이는 순서가 최신→과거라면, 뒤에서 앞으로 누적해야 "이 줄까지" after 가 맞음)
  for (let i = list.length - 1; i >= 0; i--) {
    const t = list[i];
    const s = t.symbol;
    if (!acc.has(s)) acc.set(s, { buy: 0, sell: 0 });
    const a = acc.get(s);

    // 이번 트랜잭션 반영 "후" 상태 저장
    const after = {
      buyKRW: a.buy + (t.isBuy ? Number(t.valueKRW || 0) : 0),
      sellKRW: a.sell + (!t.isBuy ? Number(t.valueKRW || 0) : 0),
    };
    after.netKRW = after.buyKRW - after.sellKRW;

    // 반영 전 상태도 원하면 이렇게
    const before = { ...a, netKRW: a.buy - a.sell };

    // 이 줄에 누적값 달아놓기
    list[i] = { ...t, runningBefore: before, runningAfter: after };

    // 누적 버퍼 갱신
    if (t.isBuy) a.buy = after.buyKRW;
    else a.sell = after.sellKRW;
  }

  return list;
}, [trades]);

// 화면에 보여줄 거래 행 개수 
const [visibleTrades, setVisibleTrades] = useState(10);

const pagedTrades = useMemo(() => {
  // 최신 순으로 정렬된 tradesWithRun에서 상위 N개만 보여줌
  return tradesWithRun.slice(0, visibleTrades);
}, [tradesWithRun, visibleTrades]);
//==여기까지 거래내역

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
                      {formatKRW(krw)}
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
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-lg">원</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        최소 입금액: ₩10,000 / 최대 입금액: ₩50,000,000
                      </p>
                        <p className="text-sm mt-2">
                          예상 보유 원화: <b>{formatKRW(krw + toNumber(depositAmount))}</b>
                        </p>
                    </div>

                    {/* 입금 버튼 */}
                    <div className="mt-4">
                      <Button className="w-full h-12 text-lg font-semibold"
                        disabled={isBusy || toNumber(depositAmount) <= 0}
                        onClick={handleDeposit}>
                        입금 실행
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
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500 text-lg">원</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        최소 출금액: ₩10,000 / 최대 출금액: ₩50,000,000
                      </p>
                      <span className="text-sm font-medium">예상 보유 원화:</span>
                      <span className="text-sm font-bold">{formatKRW(afterWithdraw)}</span>
                    </div>

                    {/* 출금 요청 버튼 */}
                    <div className="mt-4">
                      <Button className="w-full h-12 text-lg font-semibold"
                      //disabled={isBusy || !selectedBank || !accountNumber || !accountHolder || toNumber(withdrawAmount) <= 0}
                      disabled={isBusy || toNumber(withdrawAmount) <= 0}
                      onClick={handleWithdraw}>
                        원화 출금
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
                  원화 입출금 내역
                </CardTitle>
                <p className="text-gray-600">최근 원화 입금 및 출금 내역</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visibleLogs.map((log, idx) => {
                    const isDeposit = log.action === "deposit";

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          isDeposit ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDeposit ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            <span
                              className={`${isDeposit ? "text-green-600" : "text-red-600"} text-lg`}
                            >
                              {isDeposit ? "↑" : "↓"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {isDeposit ? "입금" : "출금"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.timestamp.toLocaleString().slice(0, 19).replace('T', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ₩{Number(log.amount).toLocaleString()}
                          </div>
                          { !isDeposit && log.fee && (
                            <div className="text-sm text-gray-500">수수료: ₩{Number(log.fee).toLocaleString()}</div>
                          )}
                          <div
                            className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${
                              log.status === "완료"
                                ? "bg-green-50 text-green-600"
                                : log.status === "처리중"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-gray-50 text-gray-600"
                            }`}
                          >
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleCount < logs.length && (
                  <div className="flex justify-center mt-4">
                    <Button onClick={handleLoadMore}>더보기</Button>
                  </div>
                )}
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
                      {trades.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          거래 내역이 없습니다.
                        </div>
                      )}
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
                  {loadingTrades ? (
                    <div className="text-sm text-muted-foreground">불러오는 중…</div>
                  ) : (
                    <div className="space-y-3">
                      {trades.length === 0 && (
                        <div className="text-sm text-muted-foreground">거래 내역이 없습니다.</div>
                      )}
                      {/* {tradesWithRun.map((tx, index) => ( */}
                      {pagedTrades.map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                tx.side === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                            >
                              {tx.side === "buy" ? "+" : "-"}
                            </div>
                            <div>
                              <p className="font-medium">
                                {tx.side === "buy" ? "매수" : "매도"} {tx.amount} {tx.symbol}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @ {currency === "KRW"
                                  ? `₩${Math.round(tx.priceKRW).toLocaleString()}`
                                  : `$${Math.round(tx.priceKRW / (krwRate || 1350)).toLocaleString()}`}
                                • {new Date(tx.date).toString() !== "Invalid Date"
                                    ? new Date(tx.date).toLocaleDateString()
                                    : (tx.date || "")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {/* 누적 보유고 */}
                            <p className="font-semibold">
                              {currency === "KRW"
                                ? `₩${Math.round(tx.runningAfter.netKRW).toLocaleString()}`
                                : `$${Math.round(tx.runningAfter.netKRW / (krwRate || 1350)).toLocaleString()}`}
                            </p>

                            {/* 이번 거래 금액 */}
                            <div className="text-xs">
                              {tx.isBuy ? (
                                <div className="text-green-500">
                                  +{currency === "KRW"
                                    ? `₩${Math.round(tx.valueKRW).toLocaleString()}`
                                    : `$${Math.round(tx.valueKRW / (krwRate || 1350)).toLocaleString()}`}
                                </div>
                              ) : (
                                <div className="text-red-500">
                                  -{currency === "KRW"
                                    ? `₩${Math.round(tx.valueKRW).toLocaleString()}`
                                    : `$${Math.round(tx.valueKRW / (krwRate || 1350)).toLocaleString()}`}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}

                      {/* 하단 – 더보기/접기 */}
                      {tradesWithRun.length > 10 && (
                        <div className="pt-2">
                          {visibleTrades < tradesWithRun.length ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                setVisibleTrades(v => Math.min(v + 10, tradesWithRun.length))
                              }
                            >
                              더보기 ( {visibleTrades} / {tradesWithRun.length} )
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              className="w-full"
                              onClick={() => setVisibleTrades(10)}
                            >
                              접기
                            </Button>
                          )}
                        </div>
                      )}

                    </div>
                  )}
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
                   <Avatar className="h-36 w-36">
                     {editAvatar ? (
                       <AvatarImage
                         src={editAvatar}
                         alt={editNickname}
                         className="object-cover"
                       />
                     ) : null}
                     <AvatarFallback className="bg-gray-400 border border-gray-300 text-white text-4xl flex items-center justify-center min-h-[144px] min-w-[144px]">
                       <span className="font-bold text-white text-5xl">{editNickname?.charAt(0).toUpperCase() || "U"}</span>
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
                             reader.onload = (ev) => {
                               setEditAvatar(ev.target.result)
                               // 파일 선택 즉시 프로필에 반영
                               setAvatar(ev.target.result)
                             }
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
                       <label className="block text-sm font-medium text-gray-700 mb-2">현재 비밀번호</label>
                       <input
                         className="border rounded px-3 py-2 text-sm w-full"
                         type="password"
                         placeholder="현재 비밀번호 입력"
                         value={currentPassword}
                         onChange={e => setCurrentPassword(e.target.value)}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                       <input
                         className="border rounded px-3 py-2 text-sm w-full"
                         type="password"
                         placeholder="새 비밀번호 입력"
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                       <input
                         className="border rounded px-3 py-2 text-sm w-full"
                         type="password"
                         placeholder="새 비밀번호 재입력"
                         value={confirmPassword}
                         onChange={e => setConfirmPassword(e.target.value)}
                       />
                     </div>
                    
                                         <div className="mt-4">
                                               <Button 
                          className="w-full" 
                          variant="default" 
                          type="button" 
                                                     onClick={() => {
                             // 비밀번호 변경 로직
                             if (newPassword !== confirmPassword) {
                               alert("새 비밀번호가 일치하지 않습니다.")
                               return
                             }
                             if (newPassword.length < 6) {
                               alert("새 비밀번호는 최소 6자 이상이어야 합니다.")
                               return
                             }
                             
                             // 여기에 실제 비밀번호 변경 API 호출 로직을 추가할 수 있습니다
                             alert("비밀번호가 성공적으로 변경되었습니다.")
                             
                             // 입력 필드 초기화
                             setCurrentPassword("")
                             setNewPassword("")
                             setConfirmPassword("")
                             
                             // 프로필 정보 저장 (이미 즉시 반영되어 있음)
                             setIsEditingProfile(false)
                             
                             alert("프로필 정보가 성공적으로 저장되었습니다.")
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
                    activeSection === "krw-account" && activeTab === "history" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setActiveSection("krw-account")
                    setActiveTab("history")
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
                  입출금 내역
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

