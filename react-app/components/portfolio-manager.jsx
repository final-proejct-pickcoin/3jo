"use client"

import { useState, useEffect,useMemo,useRef } from "react"
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


const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
const springUrl  = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
const clean = (u) => (u || "").replace(/\/$/, "");

const formatValue = (value, currency, krwRate, hide) => {
  if (hide) return "••••••"
  if (currency === "KRW") return `₩${(value * krwRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

//기본 백단 주소들
const ACCOUNT_API   = `${clean(springUrl)}/api/account`;
const PORTFOLIO_API = `${clean(springUrl)}/api/portfolio`;


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
      const res = await axios.get(`${fastapiUrl}/users/${id}/transactions`)
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

  }, [user_id]);

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
      fetch(`${springUrl}/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`, {
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
  if (!user_id) return;
  const loadTrades = async () => {
    try {
      setLoadingTrades(true);
      const res = await axios.get(`${PORTFOLIO_API}/trades`, { params: { user_id } });
      const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      const trades = rows.map((r) => {
        // side: 0/1 또는 "BUY"/"SELL" 모두 허용
        const sideRaw = r.orderType ?? r.side;
        const isBuy =
          typeof sideRaw === "string"
            ? sideRaw.toUpperCase() === "BUY"
            : Number(sideRaw) === 0;

        const priceKRW =
          Number(r.price ?? r.priceKRW ?? 0);

        // qty/amount가 없으면 notional/price로 역산
        const qtyRaw = Number(r.amount ?? r.qty ?? 0);
        const notionalRaw = Number(
          r.notional ?? (qtyRaw && priceKRW ? qtyRaw * priceKRW : 0)
        );

        // 심볼 표시는 단순/안정적으로
        const sym = String(r.symbol || "").toUpperCase();

        return {
          isBuy,
          side: isBuy ? "buy" : "sell",
          symbol: sym,
          amount: qtyRaw || (priceKRW ? notionalRaw / priceKRW : 0),
          priceKRW,
          valueKRW: notionalRaw,
          pnlKRW: Number(r.pnl_krw ?? r.pnl ?? 0),
          date: r.createdAt ?? r.ts ?? r.filledAt ?? r.date ?? "",
        };
      });

      setTrades(trades);
    } finally {
      setLoadingTrades(false);
    }
  };
  loadTrades();
}, [user_id]);


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
  const list = [...trades];
  const acc = new Map(); // symbol -> { buy, sell }

  for (let i = list.length - 1; i >= 0; i--) {
    const t = list[i];
    const key = t.symbol;                // 단순 키
    if (!acc.has(key)) acc.set(key, { buy: 0, sell: 0 });
    const a = acc.get(key);

    const after = {
      buyKRW:  a.buy  + (t.isBuy ? Number(t.valueKRW || 0) : 0),
      sellKRW: a.sell + (!t.isBuy ? Number(t.valueKRW || 0) : 0),
    };
    after.netKRW = after.buyKRW - after.sellKRW;

    list[i] = {
      ...t,
      runningBefore: { ...a, netKRW: a.buy - a.sell },
      runningAfter: after,
    };

    if (t.isBuy) a.buy = after.buyKRW; else a.sell = after.sellKRW;
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
  ]





// ── 심볼/마켓 정규화 (있으면 기존 것 사용해도 OK)
const normalizePair = (symbol, market) => {
  const Q = ["KRW","BTC","USDT","USD"];
  const S = (v) => (v||"").toString().trim().toUpperCase();
  let s = S(symbol), m = S(market);
  if (s.includes("_")||s.includes("-")||s.includes("/")) {
    const d = s.includes("_") ? "_" : s.includes("-") ? "-" : "/";
    const [a,b] = s.split(d); if (Q.includes(b)) return { base:a, quote:b };
  }
  if (s && Q.includes(m)) return { base:s, quote:m };
  return { base:s||"UNKNOWN", quote:"KRW" };
};

// ── 보유자산 상태
const [holdings, setHoldings] = useState([]);

// ── 구독 토픽: pair + base (둘 다 구독해서 키 포맷 상관없이 잡기)
const topics = useMemo(() => {
  if (!holdings?.length) return [];
  const s = new Set();
  holdings
    .filter(h => h.symbol !== "KRW")
    .forEach(h => {
      const { base, quote } = normalizePair(h.symbol, h.market);
      s.add(`${base}_${quote}`); // e.g. ETH_KRW
      s.add(base);               // e.g. ETH
    });
  return [...s];
}, [holdings]);

// ── 페이지 전용 머지된 시세 저장
const [mergedMD, setMergedMD] = useState({});

// ── (중요) subscribe 호출 형식 단일화: 항상 "배열"로 호출
const safeSubscribe = (listish) => {
  const arr = Array.isArray(listish) ? listish : [listish];
  if (!arr.length) return;
  try {
    subscribe(arr);
  } catch (e) {
    console.warn("[SUB] subscribe 실패:", e);
  }
};

// ── 순환 단건 구독 (마지막 호출만 유지하는 구현 대비)
//    topics 변경 시 인덱스 초기화
const idxRef = useRef(0);
useEffect(() => { idxRef.current = 0; }, [topics.join("|")]);

useEffect(() => {
  if (!topics.length) return;

  const INTERVAL = 1500; // 너무 짧게 하지 말자
  let timer;

  const tick = () => {
    const sym = topics[idxRef.current];
    if (sym) {
      safeSubscribe([sym]); // ← 항상 배열
      // 디버그
      console.debug("[SUB] tick ->", sym, `(${idxRef.current + 1}/${topics.length})`);
    }
    idxRef.current = (idxRef.current + 1) % topics.length;
    timer = setTimeout(tick, INTERVAL);
  };

  tick(); // 즉시 1회
  return () => clearTimeout(timer);
}, [topics, subscribe]);

// ── 들어오는 marketData를 mergedMD에 누적 (보유 토픽만 유지)
//    topics가 비어있으면 '필터링하지 않고' 모두 받아서 키가 보이게 함
useEffect(() => {
  const raw = marketData || {};
  const rawKeys = Object.keys(raw);
  if (rawKeys.length) {
    console.debug("[WS] raw keys:", rawKeys.slice(0, 20));
  }

  setMergedMD(prev => {
    const next = { ...prev };

    // 새 틱 반영
    for (const k of rawKeys) next[k] = raw[k];

    // 보유 토픽이 있으면 그때만 정리(필터)
    if (topics.length) {
      const allow = new Set(topics);
      for (const k of Object.keys(next)) {
        if (!allow.has(k)) delete next[k];
      }
    }
    return next;
  });
}, [marketData, topics]);

// ===== 상단 유틸 & 상태 (import들 아래, 컴포넌트 내부) =====

// 터보 폴링 설정
const EXT_TTL_MS      = 500;  // 외부가격 캐시 TTL
const EXT_BASE_GAP    = 100;  // 기본 폴링 간격(≈1초)
const EXT_MIN_GAP     = 300;    // 최소 간격
const EXT_MAX_GAP     = 1500;  // 최대 간격(백오프 상한)
const EXT_JITTER_MS   = 0;    // 지터(±)
const EXT_CONCURRENCY = 3;      // 한 틱당 요청 개수 (레이트리밋 완화)

// 외부 KRW 가격 캐시/상태
const extKRWCacheRef = useRef({});          // { BASE: { price, ts } }
const [extKRWMap, setExtKRWMap] = useState({}); // UI용 미러

// 폴링 상태
const pollStateRef = useRef({ idx: 0, gap: EXT_BASE_GAP });

// 탭 가시성 감지(비가시성 시 폴링 완화/일시정지)
const visibleRef = useRef(true);
useEffect(() => {
  const onVis = () => { visibleRef.current = (document.visibilityState === "visible"); };
  document.addEventListener("visibilitychange", onVis);
  onVis();
  return () => document.removeEventListener("visibilitychange", onVis);
}, []);

// 브라우저 CORS 우회용 임시 프록시 (급한 불 끄기)
// 필요 없으면 빈 문자열 "" 로 두면 됨.
const PROXY = "https://cors.isomorphic-git.org/";
// 다른 대안: "https://thingproxy.freeboard.io/fetch/"
//            "https://api.allorigins.win/raw?url=" (이 경우 encodeURIComponent 필요)

// 0) 공통: 심볼 정규화 + 숫자 안전 변환
const normBase = (b) => {
  // 'BTC-KRW', 'btc_krw', 'BTC/KRW' 등 → 'BTC'
  let s = String(b || "").toUpperCase().trim();
  // KRW-접두/접미 제거 및 구분자 통일
  s = s.replace(/KRW[-_/]?/g, "").replace(/[-_/].*$/, "");
  // 알파넘만 남기기
  s = s.replace(/[^A-Z0-9]/g, "");
  return s;
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// 1) 이상치 필터 (직전값 대비 너무 튀면 직전값 유지)
const lastGood = new Map(); // symbol → price
const acceptPrice = (sym, p) => {
  if (p == null || !Number.isFinite(p) || p <= 0) return null;
  const prev = lastGood.get(sym);
  // 직전값 있으면 5배 이상 튀는 값은 버림
  if (prev && Math.abs(p - prev) / prev > 5) return prev;
  lastGood.set(sym, p);
  return p;
};


// 외부 API (업비트 → 빗썸 폴백)
const fetchUpbitKRW = async (base) => {
  const sym = normBase(base);
  try {
    const { data } = await axios.get(
      `https://api.upbit.com/v1/ticker?markets=KRW-${sym}`,
      { timeout: 4000 }
    );
    const p = toNum(data?.[0]?.trade_price);
    return acceptPrice(sym, p);
  } catch (err) {
    // 업비트 404(마켓 없음) 또는 브라우저 네트워크 에러면 빗썸 폴백
    if (err?.response?.status === 404 || err?.message === "Network Error") {
      return await fetchBithumbKRW(sym);
    }
    return acceptPrice(sym, null);
  }
};

const fetchBithumbKRW = async (base) => {
  const sym = normBase(base);
  try {
    const { data } = await axios.get(
      `https://api.bithumb.com/public/ticker/${sym}_KRW`,
      { timeout: 4000 }
    );
    const raw =
      data?.data?.closing_price ??
      data?.data?.trade_price ??
      data?.data?.close;
    const p = toNum(raw);
    return acceptPrice(sym, p);
  } catch {
    return acceptPrice(sym, null);
  }
};



// 캐시 고려 단일 심볼(베이스) 외부가격 조회
const getExternalKRWOnce = async (base) => {
  base = String(base).toUpperCase();
  const now = Date.now();
  const cached = extKRWCacheRef.current[base];
  if (cached && now - cached.ts < EXT_TTL_MS) return cached.price;

  let p = null, ok = false;
  try { p = await fetchUpbitKRW(base); ok = p != null; } catch {}
  if (!ok) { try { p = await fetchBithumbKRW(base); ok = p != null; } catch {} }

  if (ok && typeof p === "number" && isFinite(p) && p > 0) {
    extKRWCacheRef.current[base] = { price: p, ts: now };
    return p;
  }
  return null;
};

// ===== 1초대 터보 폴링 (보유 코인 기준 라운드로빈) =====
useEffect(() => {
  // 보유 코인에서 BASE 리스트 뽑기
  const bases = [...new Set(
    (holdings || [])
      .filter(h => h.symbol !== "KRW")
      .map(h => String(h.symbol).toUpperCase().split(/[-_/]/)[0])
  )];

  if (!bases.length) return;
  let stop = false;
  let timer = null;

  const scheduleNext = () => {
    const ps = pollStateRef.current;
    const jitter = (Math.random() * 2 - 1) * EXT_JITTER_MS; // -jitter ~ +jitter
    const gap = Math.max(EXT_MIN_GAP, Math.min(EXT_MAX_GAP, ps.gap + jitter));
    timer = setTimeout(tick, gap);
  };

  const tick = async () => {
    if (stop) return;

    // 비가시성 시 백오프
    if (!visibleRef.current) {
      pollStateRef.current.gap = Math.min(EXT_MAX_GAP, pollStateRef.current.gap * 1.5);
      return scheduleNext();
    }

    const ps = pollStateRef.current;
    const startIdx = ps.idx % bases.length;

    // 라운드로빈으로 EXT_CONCURRENCY개 호출
    const slice = [];
    for (let i = 0; i < Math.min(EXT_CONCURRENCY, bases.length); i++) {
      slice.push(bases[(startIdx + i) % bases.length]);
    }
    ps.idx = (startIdx + slice.length) % bases.length;

    try {
      const entries = await Promise.all(slice.map(async (b) => [b, await getExternalKRWOnce(b)]));
      const next = {};
      for (const [b, p] of entries) {
        if (toNum(p)) next[b] = p;
      }
      if (Object.keys(next).length) {
        // UI 미러
        setExtKRWMap(prev => ({ ...prev, ...next }));
        // 기존 로직과 자연스럽게 통합되도록 mergedMD에도 주입
        setMergedMD(prev => {
          const out = { ...prev };
          for (const [b, p] of Object.entries(next)) {
            const k = `${b}_KRW`;
            out[k] = { ...(out[k] || {}), price: p, source: "externalKRW" };
          }
          return out;
        });
      }
      // 성공 시 간격 유지/소폭 축소
      pollStateRef.current.gap = Math.max(EXT_MIN_GAP, pollStateRef.current.gap * 0.95);
    } catch (e) {
      // 실패 시 백오프
      pollStateRef.current.gap = Math.min(EXT_MAX_GAP, pollStateRef.current.gap * 1.3);
    } finally {
      scheduleNext();
    }
  };

  // 즉시 1회 시작
  pollStateRef.current.gap = EXT_BASE_GAP;
  tick();

  return () => { stop = true; if (timer) clearTimeout(timer); };
}, [holdings, setMergedMD]);

// ===== 최종: 외부값 우선 getLivePrice =====
const getLivePrice = (symbol, market) => {
  const { base, quote } = normalizePair(symbol, market);

  // 1) KRW면 외부 미러 최우선
  if (quote.toUpperCase() === "KRW") {
    const ext = extKRWMap[String(base).toUpperCase()];
    if (toNum(ext)) return ext;
  }

  // 2) 내부 피드 폴백 (네 피드는 { price, change24h } 형태)
  const keys = [
    `${base}_${quote}`,
    `${base}-${quote}`,
    `${base}/${quote}`
  ];
  for (const k of keys) {
    const md = mergedMD?.[k] ?? marketData?.[k];
    if (!md) continue;
    const v =
      toNum(md.price) ??
      toNum(md.trade_price) ??
      toNum(md.closePrice) ??
      toNum(md.last) ??
      toNum(md.c) ??
      toNum(md.p) ??
      toNum(md?.data?.closing_price) ??
      toNum(md?.data?.trade_price);
    if (v) return v;
  }

  return 0;
};



// 개발 편의: 콘솔에서 dumpMD('PENGU','KRW') 호출
useEffect(() => {
  window.dumpMD = (symbol, market = "KRW") => {
    const { base, quote } = normalizePair(symbol, market);
    const keys = [`${base}_${quote}`, `${base}-${quote}`, `${base}/${quote}`];
    console.group(`[dumpMD] ${base}-${quote}`);
    for (const k of keys) {
      console.log("marketData[", k, "] =", marketData?.[k]);
      console.log("mergedMD[  ", k, "] =", mergedMD?.[k]);
    }
    console.groupEnd();
  };
  return () => { delete window.dumpMD; };
}, [marketData, mergedMD]);

//== 역산용 코드
const refKRWMapRef = useRef({}); // { BASE: priceKRW }
const refLoadingRef = useRef(false);

// 외부 API

// 여러 코인 기준가 갱신 (최대 8개씩 배치)
const refreshRefKRW = async (bases) => {
  if (!bases?.length || refLoadingRef.current) return;
  refLoadingRef.current = true;

  const unique = [...new Set(bases.map(s => String(s).toUpperCase()))].slice(0, 50); // 과다호출 방지
  const out = { ...refKRWMapRef.current };

  for (const base of unique) {
    let ref = await fetchUpbitKRW(base);
    if (ref == null) ref = await fetchBithumbKRW(base);
    if (typeof ref === "number" && isFinite(ref) && ref > 0) {
      out[base] = ref;
      // console.log("[REF] KRW", base, "=", ref);
    }
  }

  refKRWMapRef.current = out;
  refLoadingRef.current = false;
};

// 보유 코인/구독 토픽 기준으로 주기적 갱신 (holdings / topics 이미 있음)
useEffect(() => {
  const bases = (holdings || [])
    .filter(h => h.symbol !== "KRW")
    .map(h => (String(h.symbol).toUpperCase().split(/[-_/]/)[0])); // "ETH-KRW" → "ETH"
  if (bases.length) refreshRefKRW(bases);

  // 60초마다 갱신
  const t = setInterval(() => refreshRefKRW(bases), 60_000);
  return () => clearInterval(t);
}, [holdings]);



const calculateAllocation = useMemo(() => {
  if (!holdings?.length) return {};
  
  // 투자원금 = 수량 × 평균매입가
  const investments = holdings
    .filter(h => h.symbol !== "KRW")
    .map(h => ({
      id: h.assetId,
      symbol: h.symbol,
      investment: Number(h.amount) * Number(h.avgPrice)
    }));
  
  const totalInvestment = investments.reduce((sum, item) => sum + item.investment, 0);
  
  const allocations = {};
  investments.forEach(item => {
    allocations[item.id] = totalInvestment > 0 ? 
      Math.round((item.investment / totalInvestment) * 100) : 0;
  });
  
  return allocations;
}, [holdings]); // holdings가 바뀔 때만 재계산

const money = (vKRW) =>
  currency === "KRW"
    ? `₩${Math.round(vKRW).toLocaleString()}`
    : `$${Math.round(vKRW / (krwRate || 1350)).toLocaleString()}`;



// 보유자산 로드
useEffect(() => {
  if (!user_id) return;
  (async () => {
    const { data } = await axios.get(`${PORTFOLIO_API}/holdings`, {
      params: { user_id },
      headers: { Accept: "application/json" },
    });
    setHoldings(Array.isArray(data) ? data : []);
  })();
}, [user_id]);

// 환율 1회 로드
useEffect(() => { getKrwRate().then(setKrwRate); }, []);


const uiHoldings = useMemo(() => {
  const rows = holdings.filter(h => h.symbol !== "KRW").map(h => {
    const { base, quote } = normalizePair(h.symbol, h.market)
    const amount = Number(h.amount) || 0
    const avg = Number(h.avgPrice) || 0
    
    // 실시간 가격 조회 (기존 로직)
    const live = getLivePrice(h.symbol, h.market);
    
    const mv = amount * live
    const pnl = amount * (live - avg)
    const pnlPct = avg > 0 && live > 0 ? ((live - avg) / avg) * 100 : 0
    
    // ✅ 고정된 비중 사용 (투자원금 기준)
    const allocation = calculateAllocation[h.assetId] || 0;
    
    return {
      assetId: h.assetId, 
      symbol: `${base}-${quote}`, 
      name: h.assetName,
      amount, 
      avgPrice: avg, 
      livePrice: live, 
      marketValueKRW: mv,
      pnlKRW: pnl, 
      pnlPct,
      allocation // ← 이제 고정값
    }
  })
  
  // 투자원금 기준으로 정렬 (비중이 높은 순)
  return rows.sort((a, b) => {
    const investmentA = a.amount * a.avgPrice;
    const investmentB = b.amount * b.avgPrice;
    return investmentB - investmentA;
  });
}, [holdings, mergedMD, calculateAllocation])




const costBasisKRW  = uiHoldings.reduce((s,a)=> s + a.amount * a.avgPrice, 0);
const totalValueKRW = uiHoldings.reduce((s,a)=> s + a.marketValueKRW, 0);
const totalPnLKRW   = uiHoldings.reduce((s,a)=> s + a.pnlKRW, 0);
const totalPnLPct   = costBasisKRW > 0 ? (totalPnLKRW / costBasisKRW) * 100 : 0;


useEffect(() => {
  console.log("[MD] keys:", Object.keys(mergedMD));
}, [mergedMD]);

// useEffect(() => {
//   if (Object.keys(mergedMD).length > 0) {
//     // console.log("[Debug] mergedMD keys:", Object.keys(mergedMD));
//     // console.log("[Debug] Sample mergedMD data:", Object.entries(mergedMD).slice(0, 3));
//   }
//   if (marketData && Object.keys(marketData).length > 0) {
//     // console.log("[Debug] marketData keys:", Object.keys(marketData));
//     // console.log("[Debug] Sample marketData:", Object.entries(marketData).slice(0, 3));
//   }
// }, [mergedMD, marketData]);

// useEffect(() => {
//   if (holdings?.length > 0) {
//     // console.log("[Debug] holdings data:", holdings);
//     // console.log("[Debug] allocation calculation:", calculateAllocation);
//   }
// }, [holdings, calculateAllocation]);

// 가격이 이상하게 나올 때를 위한 안전장치
// const safeFormatPrice = (price, fallback = 0) => {
//   if (typeof price !== 'number' || !isFinite(price) || price < 0) {
//     // console.warn('[Format] Invalid price:', price, 'using fallback:', fallback);
//     return fallback;
//   }
//   return price;
// };




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

                {/* 일일 한도 (샘플 표시) */}
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    ₩1,200,000 / ₩50,000,000
                  </div>
                  <div className="text-sm text-gray-600 mb-2">일일 한도</div>
                  <Progress value={24} className="h-2" />
                </div>

                {/* 월간 한도 (샘플 표시) */}
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
                          <Button size="sm" variant="outline" className="h-8 px-3">
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
                    <Button
                      className="w-full h-12 text-lg font-semibold"
                      disabled={isBusy || toNumber(depositAmount) <= 0}
                      onClick={handleDeposit}
                    >
                      입금 실행
                    </Button>
                  </div>

                  {/* 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ</div>
                      <div className="text-sm text-blue-800">
                        <h4 className="font-semibold mb-2">입금 안내사항</h4>
                        <ul className="space-y-1 text-xs">
                          <li>• 위 계좌로 입금하시면 실시간으로 반영됩니다.</li>
                          <li>• 입금자명은 반드시 본인 명의로 입금해주세요.</li>
                          <li>• 최소 입금액: ₩10,000</li>
                          <li>• 입금 수수료: 무료 (은행 이체 수수료는 고객 부담)</li>
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
                    <span className="text-sm font-medium">예상 보유 원화: </span>
                    <span className="text-sm font-bold">{formatKRW(afterWithdraw)}</span>
                  </div>

                  {/* 출금 버튼 */}
                  <div className="mt-4">
                    <Button
                      className="w-full h-12 text-lg font-semibold"
                      disabled={isBusy || toNumber(withdrawAmount) <= 0}
                      onClick={handleWithdraw}
                    >
                      원화 출금
                    </Button>
                  </div>

                  {/* 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">ℹ</div>
                      <div className="text-sm text-blue-800">
                        <h4 className="font-semibold mb-2">출금 안내사항</h4>
                        <ul className="space-y-1 text-xs">
                          <li>• 위 계좌로 출금하시면 실시간으로 반영됩니다.</li>
                          <li>• 출금자명은 반드시 본인 명의로 출금해주세요.</li>
                          <li>• 최소 출금액: ₩10,000</li>
                          <li>• 출금 수수료: 무료 (은행 이체 수수료는 고객 부담)</li>
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
                  const ts = new Date(log.timestamp);
                  const when = Number.isNaN(ts.getTime())
                    ? String(log.timestamp).replace("T", " ").slice(0, 19)
                    : ts.toLocaleString();

                    // ✅ 키 폴백
                  const logKey =
                    log.id ??
                    log._id ??
                    log.txId ??
                    `${log.action}-${log.timestamp}-${idx}`;
                    return (
                      <div
                        key={logKey}
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
                          <div className="text-sm text-gray-500">{when}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ₩{Number(log.amount).toLocaleString()}
                        </div>
                        {!isDeposit && log.fee && (
                          <div className="text-sm text-gray-500">
                            수수료: ₩{Number(log.fee).toLocaleString()}
                          </div>
                        )}
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
      );

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
                    {uiHoldings.length === 0 && (
                      <div className="text-sm text-muted-foreground">보유 자산이 없습니다.</div>
                    )}


                      {uiHoldings.map((asset, i) => {
                      const livePrice = asset.livePrice;
                      const livePnL = asset.pnlKRW;
                      const livePnLPercent = asset.pnlPct;

                      // ✅ 키 폴백
                      const assetKey =
                        asset.assetId ??
                        asset.id ??
                        `${asset.symbol}-${asset.name ?? ""}-${asset.avgPrice}-${i}`;

                      return (
                        <div key={assetKey} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="font-bold">{asset.symbol}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold">{asset.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {hideBalances ? "••••••" : `${asset.amount} ${asset.symbol.split("-")[0]}`}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold">
                                {hideBalances ? "••••••" : `${livePnL >= 0 ? "+" : ""}${money(Math.abs(livePnL))}`}
                              </p>
                              <Badge variant={livePnL >= 0 ? "default" : "destructive"}>
                                {livePnL >= 0 ? "+" : ""}
                                {hideBalances ? "••••" : `${livePnLPercent.toFixed(2)}%`}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">평균 매입가</p>
                              <p className="font-medium">{hideBalances ? "••••••" : money(asset.avgPrice)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">현재가</p>
                              <p className="font-medium">{hideBalances ? "••••••" : money(livePrice)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">손익</p>
                              <p className={`font-medium ${livePnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {hideBalances ? "••••••" : `${livePnL >= 0 ? "+" : ""}${money(Math.abs(livePnL))}`}
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
                            <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />추가 매수</Button>
                            <Button size="sm" variant="outline"><Minus className="h-3 w-3 mr-1" />매도</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      );

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
                          onClick={() => setVisibleTrades(v => Math.min(v + 10, tradesWithRun.length))}
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
      );

    case "crypto-analysis":
      return (
        <div className="space-y-6">
          {/* 포트폴리오 요약 (실데이터 반영) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>포트폴리오 요약</CardTitle>
              <CardDescription>전체 자산 현황 및 수익률</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {hideBalances ? "••••••" : (totalPnLKRW >= 0 ? "+" : "") + money(Math.abs(totalPnLKRW))}
                  </p>
                  <p className="text-sm text-muted-foreground">총 수익</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {hideBalances ? "••••••" : money(totalValueKRW)}
                  </p>
                  <p className="text-sm text-muted-foreground">총 자산</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {hideBalances ? "••••••" : `${totalPnLPct.toFixed(2)}%`}
                  </p>
                  <p className="text-sm text-muted-foreground">수익률</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {hideBalances ? "••••••" : String(uiHoldings.length)}
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
              {/* uiHoldings로 교체 */}
              <CardContent>
                <div className="space-y-4">
                  {uiHoldings.length === 0 && (
                    <div className="text-sm text-muted-foreground">표시할 자산이 없습니다.</div>
                  )}
                  {uiHoldings.map((asset) => (
                    <div key={`${asset.assetId}-${asset.symbol}`} className="space-y-2">
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
                    {/* 샘플: 실제로는 uiHoldings에서 max/min 찾아 표시 가능 */}
                    <span className="font-medium text-green-500">+ 23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">최저 수익 자산</span>
                    <span className="font-medium text-red-500">- 7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수익 거래 비율</span>
                    <span className="font-medium">56%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">평균 보유 기간</span>
                    <span className="font-medium">8일</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">리스크 점수</span>
                    <span className="font-medium text-orange-500">중간</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

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
                    <AvatarImage src={editAvatar} alt={editNickname} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-gray-400 border border-gray-300 text-white text-4xl flex items-center justify-center min-h-[144px] min-w-[144px]">
                    <span className="font-bold text-white text-5xl">
                      {editNickname?.charAt(0).toUpperCase() || "U"}
                    </span>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setEditAvatar(ev.target.result);
                          setAvatar(ev.target.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                  <input
                    className="border rounded px-3 py-2 text-sm w-full"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
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
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                  <input
                    className="border rounded px-3 py-2 text-sm w-full"
                    type="password"
                    placeholder="새 비밀번호 입력"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호 확인</label>
                  <input
                    className="border rounded px-3 py-2 text-sm w-full"
                    type="password"
                    placeholder="새 비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    variant="default"
                    type="button"
                    onClick={() => {
                      if (newPassword !== confirmPassword) {
                        alert("새 비밀번호가 일치하지 않습니다.");
                        return;
                      }
                      if (newPassword.length < 6) {
                        alert("새 비밀번호는 최소 6자 이상이어야 합니다.");
                        return;
                      }
                      alert("비밀번호가 성공적으로 변경되었습니다.");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setIsEditingProfile(false);
                      alert("프로필 정보가 성공적으로 저장되었습니다.");
                    }}
                  >
                    저장
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      );
  }
};


  return (
    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 좌측 사이드바 */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-8">
            <button 
              className={`block w-full text-left text-2xl font-bold mb-6 transition-colors ${
                activeSection.startsWith("krw") || activeSection.startsWith("crypto") ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
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
                      //const livePrice = marketData[asset.symbol]?.price || asset.currentPrice
                      const livePrice = getLivePrice(asset.symbol, asset.market);
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
                              {/* <Badge variant={livePnL >= 0 ? "default" : "destructive"}>
                                {livePnL >= 0 ? "+" : ""}
                                {hideBalances ? "••••" : `${livePnLPercent.toFixed(2)}%`}
                              </Badge> */}
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
                  activeSection.startsWith("krw") ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => setActiveSection("krw-account")}
              >
                원화
              </button>
              <div className="space-y-2 ml-4">
                <button 
                  className={`block w-full text-left text-md py-2 px-3 rounded-lg transition-colors ${
                    activeSubSection === "krw-account" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    activeSection === "krw-account" && activeTab === "deposit" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    activeSection === "krw-account" && activeTab === "history" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                   activeSection.startsWith("crypto") ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
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
                  activeSection === "crypto-holdings" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                     activeSection === "crypto-history" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                     activeSection === "crypto-analysis" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  activeSection === "profile" ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
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
        <div className="flex-1 p-8 bg-white dark:bg-gray-900">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
