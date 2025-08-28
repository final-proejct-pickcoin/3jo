'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";
import axios from "axios";
import TradingChart from "./trading-chart.jsx";
import OrderBook from "./trading-hoga.jsx";
import CoinInfoPanel from "@/components/trading-coininfo";
import { toast } from "sonner";

// ======================= 상수 =======================
const TRADE_API = "http://localhost:8080/api/trade";

// ======================= 유틸/아이콘 =======================
function StarIcon({ filled = false, size = 18, className = "" }) {
  const d = "M12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.62 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27Z";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {filled ? (
        <path d={d} fill="currentColor" />
      ) : (
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}

/* ---------------------- 메인 단일 파일 앱 ---------------------- */
export default function TradingInterface() {
  // 사용자 id 추출
  const [user_id, setUserId] = useState(null);

  // 화면 전환 상태 (목록/상세) - 바로 상세 화면으로 시작
  const [view, setView] = useState("detail");
  
  // 시세/코인정보 탭 상태
  const [detailView, setDetailView] = useState("chart");

  // 코인 목록 관련 상태
  const [coinList, setCoinList] = useState([]);
  const [coinListLoading, setCoinListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("BTC");

  // 실시간 데이터 관련 상태
  const [realTimeData, setRealTimeData] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStats, setWsStats] = useState({
    total_symbols: 0,
    active_subscriptions: 0,
    last_update: null
  });

  // 호가창 상태
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [], timestamp: null });

  // 주문 가격/수량
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderQty, setOrderQty] = useState(0);
  const [orderType, setOrderType] = useState("시장가"); // "시장가" | "지정가"
  const [orderPriceInput, setOrderPriceInput] = useState(""); // 문자열(지정가 입력창 표시용)

  // 주문 탭 상태
  const [orderTab, setOrderTab] = useState("거래");
  
  // 거래 서브탭 상태
  const [tradeSubTab, setTradeSubTab] = useState("매수");
  
  // 거래내역 서브탭 상태
  const [historyTab, setHistoryTab] = useState("체결");

  // 호가창 & 거래정보 아코디언 상태
  const [expandedSections, setExpandedSections] = useState({
    호가: false,
    거래정보: false
  });

  // 주문창 아코디언 상태
  const [orderPanelExpanded, setOrderPanelExpanded] = useState(false);

  // 차트 탭팬 아코디언 상태
  const [chartPanelExpanded, setChartPanelExpanded] = useState(false);

  // 차트 & 코인정보 탭팬 상태
  const [chartTab, setChartTab] = useState("차트");

  // 원화/보유/관심 탭 상태
  const [tab, setTab] = useState("won");

  // 관심 코인 상태
  const [favoriteCoins, setFavoriteCoins] = useState(new Set(["BTC", "ETH"]));

  // 코인 id(asset_id) 가져오기
  const [asset_id, setAsset_id] = useState(null);

  // Responsive height
  const mainPanelRef = useRef(null);
  const [combinedHeight, setCombinedHeight] = useState(600);
    // 체결/미체결 리스트 “더보기”용 개수
const [historyShowCount, setHistoryShowCount] = useState(10);

  // 관심 코인 토글 함수
  const toggleFavorite = (symbol, e) => {
    e.stopPropagation(); // 코인 선택 이벤트 방지
    setFavoriteCoins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  // 호가창 & 거래정보 아코디언 토글 함수
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  // ======== 사용자 ID 가져오기 ========
  useEffect(() => {
    const cached = sessionStorage.getItem("cached_user_id");
    if (cached && user_id == null) setUserId(Number(cached));

    const tokenValue = sessionStorage.getItem("auth_token");
    if (!tokenValue) return;

    let payload = null;
    try {
      payload = JSON.parse(atob(tokenValue.split(".")[1]));
    } catch (_) {
      return;
    }
    const user_mail = payload.email || payload.sub || null;
    if (!user_mail) return;

    let mounted = true;
    const controller = new AbortController();
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));

    idle(async () => {
      if (!mounted) return;
      try {
        const res = await fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`, {
          signal: controller.signal, headers: { Accept: "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user_id != null) {
            const idNum = Number(data.user_id);
            setUserId(idNum);
            sessionStorage.setItem("cached_user_id", String(idNum));
          }
        }
      } catch {
        const cached = sessionStorage.getItem("cached_user_id");
        if (cached) setUserId(Number(cached));
      }
    });

    return () => { mounted = false; controller.abort(); };
  }, []);

  // ======================= asset_id 가져오기 =======================
  async function fetchAssetId(assetSymbol) {
    try {
      const url = `http://localhost:8080/api/Market_assets/asset-id?asset_symbol=${encodeURIComponent(assetSymbol)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return null;
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length) {
        const n = Number(arr[0]);
        return Number.isFinite(n) ? n : null;
      }
    } catch (err) {
      console.log("API 서버 연결 실패 - asset_id 가져오기 실패");
      return null;
    }
    return null;
  }

  // 선택 코인 바뀔 때 asset_id 자동 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedCoin) return;
      const assetSymbol = `${selectedCoin}-KRW`;
      const id = await fetchAssetId(assetSymbol);
      if (mounted) setAsset_id(id);
    })();
    return () => { mounted = false; };
  }, [selectedCoin]);

  // ======================= 높이 계산 =======================
  useEffect(() => {
    function updateHeight() {
      if (mainPanelRef.current) setCombinedHeight(mainPanelRef.current.offsetHeight);
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    const ro = mainPanelRef.current ? new window.ResizeObserver(updateHeight) : null;
    if (ro && mainPanelRef.current) ro.observe(mainPanelRef.current);
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (ro && mainPanelRef.current) ro.disconnect();
    };
  }, []);

  // 빗썸 WebSocket 연결
  useEffect(() => {
    console.log('🚀 빗썸 실시간 데이터 연결 시작...');
    let ws;
    let reconnectTimeout;
    let heartbeatInterval;

    const connectWebSocket = () => {
      const wsUrl = 'ws://localhost:8000/api/realtime';
      console.log(`🔌 연결 시도: ${wsUrl}`);

      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          setWsConnected(true);
          console.log('✅ 빗썸 실시간 WebSocket 연결 성공');
          
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
          }, 30000);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ticker' && data.content) {
              const c = data.content;
              const content = data.content;
              
              if (content.tickType && content.tickType !== '24H') return;
              const symbol = content.symbol;
              if (!symbol) return;
        
              const closePrice = parseFloat(content.closePrice);
              const chgRate = parseFloat(content.chgRate);
              const value = parseFloat(content.value || 0);
        
              if (isNaN(closePrice) || isNaN(value) || value <= 0) {
                return;
              }
        
              setRealTimeData(prev => {
                const prevPrice = prev[symbol]?.closePrice ?? closePrice;
                return {
                  ...prev,
                  [symbol]: {
                    symbol,
                    closePrice,
                    chgRate,
                    chgAmt: parseFloat(c.chgAmt) || 0,
                    value,
                    // 추가 데이터들
                    volume: parseFloat(c.volume) || parseFloat(c.unitsTraded) || 0,
                    highPrice: parseFloat(c.highPrice) || parseFloat(c.high24h) || 0,
                    lowPrice: parseFloat(c.lowPrice) || parseFloat(c.low24h) || 0,
                    timestamp: c.timestamp || Date.now(),
                    priceDirection: closePrice > prevPrice ? 'up' : closePrice < prevPrice ? 'down' : 'same',
                    lastUpdate: Date.now()
                  }
                };
              });
            } else if (data.type === 'orderbook' && data.content) {  // 이 부분 추가
              // 호가 데이터 처리
              const { symbol, bids, asks } = data.content;
              if (symbol === selectedCoin + '_KRW') {
                console.log('Orderbook 데이터 수신:', { symbol, bids, asks });
                setOrderbook({ bids, asks, timestamp: Date.now() });
              }
            }
          } catch {}
        };
        ws.onclose = (event) => {
          setWsConnected(false);
          console.log('❌ WebSocket 연결 종료:', event.code, event.reason);
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 WebSocket 재연결 시도...');
            connectWebSocket();
          }, 3000);
        };
        ws.onerror = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };
      } catch {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };
    connectWebSocket();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [selectedCoin]);

  // WebSocket 통계 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/websocket/stats');
        if (response.ok) {
          const data = await response.json();
          setWsStats(data.subscription_stats || data || {});
        }
      } catch (error) {
        // 오류 로그 제거
      }
    };
    if (wsConnected) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [wsConnected]);

  // 코인 목록 가져오기
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setCoinListLoading(true);
        console.log(`🔄 원화 마켓 코인 목록 요청...`);
        const apiUrl = 'http://localhost:8000/api/coins';
        const response = await fetch(apiUrl);
        const data = await response.json();
        
      if (data?.status === 'success' && Array.isArray(data?.data)) {
          console.log(`✅ 원화 마켓 ${data.data.length}개 코인 로드 성공`);
                     const mappedCoins = data.data.map(coin => ({
             symbol: coin.symbol,
             name: coin.korean_name || coin.symbol,
             englishName: coin.english_name || coin.symbol,
          price: Number(coin.current_price) || 0,
          change: Number(coin.change_rate) || 0,
          changeAmount: Number(coin.change_amount) || 0,
          volume: Number(coin.volume) || 0,
          trend: (Number(coin.change_rate) || 0) > 0 ? 'up' : 'down',
             marketWarning: coin.market_warning || 'NONE',
          marketCap: Number(coin.market_cap) || 0,
          marketCapRank: Number(coin.market_cap_rank) || 0,
             // 추가 정보들
          circulatingSupply: Number(coin.circulating_supply) || 0,
          high24h: Number(coin.high_24h) || 0,
          low24h: Number(coin.low_24h) || 0,
          unitsTraded: Number(coin.units_traded) || 0
           }));
          setCoinList(mappedCoins);
      } else {
        // ✅ 실패/빈 배열도 명확히 처리
        setCoinList([]);
        }
      } catch (e) {
      console.error('❌ 원화 마켓 조회 실패:', e);
      setCoinList([]); // 네트워크 에러도 비우기
      } finally {
      setCoinListLoading(false); // 무조건 로딩 종료
      }
    };

    fetchCoins();
  }, []);

  // 실시간 데이터로 코인 목록 업데이트
  const updatedCoinList = useMemo(() => {
    return coinList.map(coin => {
      const rt = realTimeData[coin.symbol + '_KRW'];
      // 등락률/등락금액은 REST(빗썸) 값만 사용
      let change = coin.change || 0;
      let changeAmount = coin.changeAmount || 0;
      let trend = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
      let price = coin.price || 0;
      if (rt && !Number.isNaN(Number(rt.closePrice))) {
        price = Math.floor(Number(rt.closePrice)) || 0;
      }
      // 거래량 등은 실시간 반영
      const millionValue = rt && Number(rt.value) > 0 ? Math.round(Number(rt.value) / 1_000_000) : 0;
      const formattedVolume = millionValue ? `${millionValue.toLocaleString()} 백만` : '';
      return {
        ...coin,
        price,
        change,
        changeAmount,
        trend,
        volume: formattedVolume || (Number(coin.volume) ? `${Math.round(Number(coin.volume)/1_000_000).toLocaleString()} 백만` : '')
      };
    });
  }, [coinList, realTimeData]);

  // 정렬 상태
  const [sortKey, setSortKey] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');

  // 정렬 핸들러
  const handleSort = (key) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('desc'); }
  };

  // 필터링된 코인 목록
  const filteredCoinList = useMemo(() => {
    let filtered = updatedCoinList;
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filtered = updatedCoinList.filter(c =>
        (c.name && c.name.toLowerCase().includes(lower)) ||
        (c.symbol && c.symbol.toLowerCase().includes(lower))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      
      if (sortKey === 'volume') {
        aValue = typeof aValue === 'string' ? parseFloat(aValue.replace(/[^\d.]/g, '')) : aValue;
        bValue = typeof bValue === 'string' ? parseFloat(bValue.replace(/[^\d.]/g, '')) : bValue;
      }
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (sortOrder === 'asc') {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
      } else {
        if (aValue > bValue) return -1;
        if (aValue < bValue) return 1;
        return 0;
      }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (sortOrder === 'asc') return av < bv ? -1 : av > bv ? 1 : 0;
      return av > bv ? -1 : av < bv ? 1 : 0;
    });
    return sorted;
  }, [searchTerm, updatedCoinList, sortKey, sortOrder]);

  // 현재가 계산
  const currentPriceKRW = useMemo(() => {
    const rt = realTimeData[selectedCoin + "_KRW"];
    if (rt?.closePrice) return parseFloat(rt.closePrice); // parseInt → parseFloat로 변경하여 소수점 유지
    const fallback = updatedCoinList.find(c => c.symbol === selectedCoin)?.price;
    return typeof fallback === "number" ? fallback : 0;
  }, [selectedCoin, realTimeData, updatedCoinList]);

  // ✅ 시장가일 때만 현재가로 orderPrice 자동 동기화
  // useEffect(() => {
  //   if (orderType !== "시장가") return; // 지정가면 건드리지 않음
  //   setOrderPrice(currentPriceKRW);
  // }, [orderType, currentPriceKRW, selectedCoin]);


  // 시장가일 때만 현재가로 세팅
useEffect(() => {
  if (orderType !== "시장가") return;
  setOrderPrice(currentPriceKRW);
  setOrderPriceInput(String(currentPriceKRW ?? "")); // 시장가 화면엔 쓰이진 않지만 동기화만
}, [orderType, currentPriceKRW, selectedCoin]);

// 지정가로 전환될 때 초기값(한 번) 세팅: 비어있으면 현재가를 복사
useEffect(() => {
  if (orderType === "지정가") {
    // 이미 입력한 값이 없을 때만 기본값 채움
    if (!orderPrice && !orderPriceInput) {
      const seed = Number.isFinite(currentPriceKRW) ? currentPriceKRW : 0;
      setOrderPrice(seed);
      setOrderPriceInput(seed ? String(seed) : "");
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orderType]);

// 선택 코인 바뀔 때: 시장가면 따라가고, 지정가면 건드리지 않음
useEffect(() => {
  if (orderType !== "시장가") return;
  setOrderPrice(currentPriceKRW);
  setOrderPriceInput(String(currentPriceKRW ?? ""));
}, [selectedCoin, currentPriceKRW, orderType]);


  // 초기/주기적 호가 조회 (WS 외 보조)
  useEffect(() => {
    if (!selectedCoin) return;
    const fetchOrderbook = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/orderbook/${selectedCoin}_KRW`);
        if (res.ok) setOrderbook(await res.json());
      } catch (e) {}
    };
    fetchOrderbook();
    const i = setInterval(fetchOrderbook, 3000);
    return () => clearInterval(i);
  }, [selectedCoin]);

  // 코인 선택 시
  const handleCoinSelect = async (coin) => {
    setSelectedCoin(coin.symbol);
    setView("detail");
    setDetailView("chart");
  };

  // ======================= 거래내역 =======================
  const [unconcluded_orders, setUnconcluded_orders] = useState([]);
  const [concluded_orders, setConcluded_orders] = useState([]);
  const ORDER_TYPE_TEXT = { 0: "매수", "0": "매수", 1: "매도", "1": "매도" };
  const pad2 = (n) => String(n).padStart(2, "0");
  const formatTS = (v) => {
    if (!v) return "-";
    let s = typeof v === "string" ? v.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1") : v;
    if (typeof s !== "string") {
      const n = Number(s); if (Number.isFinite(n)) s = new Date(n).toISOString();
    }
    const d = new Date(s); if (Number.isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  };
  const formatQty = (n) => {
    const num = Number(n); if (!Number.isFinite(num)) return String(n ?? "-");
    if (num === 0) return "0";
    if (Math.abs(num) < 1e-8) return num.toExponential(2);
    return num.toFixed(8).replace(/\.?0+$/, "");
  };
  const safePrice = (v) => {
    const n = Number(v); return Number.isFinite(n) ? n.toLocaleString() : String(v ?? "-");
  };
  const normalizeOrder = (row, i) => {
    const tsRaw = row.order_date ?? row.created_at ?? row.timestamp ?? row.ts;
    const typeRaw = row.order_type ?? row.type ?? row.side;
    const amtRaw  = row.amount ?? row.qty ?? row.quantity;
    const priceRaw = row.price;
    return {
      id: row.order_id ?? row.id ?? `${typeRaw ?? "x"}-${i}`,
      ts: formatTS(tsRaw),
      side: ORDER_TYPE_TEXT[typeRaw] ?? (typeof typeRaw === "string" ? typeRaw : "-"),
      qty: formatQty(amtRaw),
      price: safePrice(priceRaw),
    };
  };
  const normalizeOrders = (payload) => {
    const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    return arr.map(normalizeOrder);
  };
  const Concluded_orders = async () => {
    if (!user_id || !asset_id) return;
    const { data } = await axios.get(`${TRADE_API}/asset_concluded_orders`, {
      params: { user_id, asset_id }, headers: { Accept: "application/json" },
    });
    setConcluded_orders(normalizeOrders(data));
  };
  const Unconcluded_orders = async () => {
    if (!user_id || !asset_id) return;
    const { data } = await axios.get(`${TRADE_API}/asset_unconcluded_orders`, {
      params: { user_id, asset_id }, headers: { Accept: "application/json" },
    });
    setUnconcluded_orders(normalizeOrders(data));
  };
  useEffect(() => {
    if (orderTab !== "거래내역") return;
    if (!user_id || !asset_id) return;
    Concluded_orders();
    Unconcluded_orders();
  }, [orderTab, user_id, asset_id]);
  useEffect(() => {
    if (orderTab !== "거래내역") return;
    if (!user_id || !asset_id) return;
    if (historyTab === "체결") Concluded_orders();
    else Unconcluded_orders();
  }, [historyTab]);

  // 체결/미체결 토글할 때 “더보기” 카운트 리셋
  useEffect(() => {
    setHistoryShowCount(10);
  }, [historyTab]);


  // ======================= 주문 API 래퍼 & 핸들러 =======================
  const api = {
    marketBuy: (body) => axios.post(`${TRADE_API}/market_buy`, body),
    marketSell: (body) => axios.post(`${TRADE_API}/market_sell`, body),
    limitBuy:  (body) => axios.post(`${TRADE_API}/limit_buys`,  body),
    limitSell: (body) => axios.post(`${TRADE_API}/limit_sells`, body),
  };

  const buildOrderBody = async () => {
    if (!user_id) { toast.error("로그인이 필요합니다."); return null; }
    let id = asset_id;
    if (!id && selectedCoin) {
      const assetSymbol = `${selectedCoin}-KRW`;
      id = await fetchAssetId(assetSymbol);
      if (id) setAsset_id(id);
    }
    if (!id) { toast.error("코인을 먼저 선택하세요."); return null; }
    if (!orderQty || orderQty <= 0) { toast.error("수량을 입력하세요."); return null; }
    if (orderType === "지정가" && (!orderPrice || orderPrice <= 0)) {
      toast.error("지정가 주문은 가격을 입력하세요."); return null;
    }
    const priceToSend = orderType === "시장가" ? currentPriceKRW : orderPrice;
    return { user_id, asset_id: id, amount: orderQty, price: priceToSend };
  };

  const handleBuy = async () => {
    const body = await buildOrderBody(); if (!body) return;
    try {
      if (orderType === "시장가") await api.marketBuy(body);
      else await api.limitBuy(body);
      toast.success(`${selectedCoin} ${orderType} 매수 주문 완료`);
      setOrderQty(0);
    } catch (err) {
      console.error("매수 실패:", err);
      const msg = err.response?.data?.message || err.message || "요청 실패";
      toast.error(`매수 주문 실패: ${msg}`);
    }
  };

  const handleSell = async () => {
    const body = await buildOrderBody(); if (!body) return;
    try {
      if (orderType === "시장가") await api.marketSell(body);
      else await api.limitSell(body);
      toast.success(`${selectedCoin} ${orderType} 매도 주문 완료`);
      setOrderQty(0);
    } catch (err) {
      console.error("매도 실패:", err);
      const msg = err.response?.data?.message || err.message || "요청 실패";
      toast.error(`매도 주문 실패: ${msg}`);
    }
  };

  // ======================= 렌더 =======================
  return (
    <div className="w-full p-0 space-y-4">
      {/* 연결 상태 */}
       <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2">
           <span className={`text-sm font-semibold ${wsConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {wsConnected ? '🟢 거래소 실시간 연결됨' : '🔴 연결 끊어짐'}
          </span>
           <span className="text-sm text-gray-500 dark:text-gray-400">
             실시간: {Object.keys(realTimeData).length}개 | 총 코인: {coinList.length}개
          </span>
        </div>
         <div className="text-sm text-gray-500 dark:text-gray-400">마지막 업데이트: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* 상세 화면 */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="w-2/5 flex justify-center">
            <div className="text-4xl font-bold"><span>종목(상품)</span></div>
          </div>
        </div>

        <div className="flex flex-row min-h-0" style={{ height: combinedHeight }}>
          {/* 좌: 코인목록 */}
          <div className="flex flex-col w-2/5 min-h-0" style={{ height: 600 }}>
            <Card className="flex flex-col border-0" style={{ height: 1200 }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5 mb-2">
                   <Search className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <input
                    placeholder="코인명/심볼검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                     className="h-10 flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    autoComplete="off"
                  />
                </div>
{/* 잠깐 주석 */}
                {/* <div className="flex bg-gray-100 rounded-lg p-1 w-full mb-4 shadow-sm">
                  {[
                    { key: "won", label: "원화" },
                    { key: "hold", label: "보유" },
                    { key: "star", label: "관심" },
                  ].map((t, i) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 py-2 px-3 text-center text-sm font-medium transition-all duration-200 rounded-md flex flex-col justify-end
                        ${t.key === tab ? "bg-white text-gray-800 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700"}
                        ${i === 0 ? "rounded-l-md" : ""} ${i === 2 ? "rounded-r-md" : ""}`}
                      style={{ minWidth: 0 }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div> */}
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col min-h-0" style={{ height: 600 }}>
                                 <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-6 px-2 py-2 text-sm font-bold text-muted-foreground dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 sticky top-0 z-10"
                  style={{ height: '40px', minHeight: '40px', maxHeight: '40px', flexShrink: 0, overflow: 'hidden' }}>
                  <div className="text-center gap-3" />
                   <div className="flex items-center cursor-pointer text-left" onClick={() => handleSort('name')}>한글명{sortKey === 'name' ? (<span className="text-[10px] text-blue-600 dark:text-blue-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>) : (<span className="text-[10px] text-gray-300 dark:text-gray-500">△▽</span>)}</div>
                   <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('price')}>현재가{sortKey === 'price' ? (<span className="text-[10px] text-blue-600 dark:text-blue-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>) : (<span className="text-[10px] text-gray-300 dark:text-gray-500">△▽</span>)}</div>
                   <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('change')}>전일대비{sortKey === 'change' ? (<span className="text-[10px] text-blue-600 dark:text-blue-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>) : (<span className="text-[10px] text-gray-300 dark:text-gray-500">△▽</span>)}</div>
                   <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('volume')}>거래대금{sortKey === 'volume' ? (<span className="text-[10px] text-blue-600 dark:text-blue-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>) : (<span className="text-[10px] text-gray-300 dark:text-gray-500">△▽</span>)}</div>
                </div>

                <div className="overflow-y-auto flex-1 min-h-0" style={{ height: combinedHeight, flexShrink: 0 }}>
                  {coinListLoading ? (
                    <div className="p-4 text-center text-gray-500">로딩 중...</div>
                  ) : filteredCoinList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">코인 목록이 없습니다.</div>
                  ) : (
                    filteredCoinList.map((coin) => (
                      <div
                        key={coin.symbol}
                        onClick={() => handleCoinSelect(coin)}
                        className={`grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-3 p-1 text-sm cursor-pointer border-b items-center
                          ${selectedCoin === coin.symbol ? 'bg-blue-50 border-blue-200' : ''}`}
                        style={{ height: '48px', minHeight: '48px', maxHeight: '48px', flexShrink: 0, overflow: 'hidden' }}
                      >
                        <div className="flex justify-center items-center" style={{ height: '100%', flexShrink: 0, overflow: 'hidden' }}>
                          <button onClick={(e) => toggleFavorite(coin.symbol, e)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <StarIcon filled={favoriteCoins.has(coin.symbol)} size={18} className={favoriteCoins.has(coin.symbol) ? "text-yellow-500" : "text-gray-400"} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 text-left" style={{ height: '100%', flexShrink: 0, overflow: 'hidden' }}>
                          <div className="flex flex-col justify-center" style={{ width: '100%' }}>
                            <div className={`font-semibold text-sm ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`} style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>
                              {coin.name}
                              {realTimeData[coin.symbol + '_KRW'] && (<span className="ml-1 text-green-500 text-[8px]" style={{ lineHeight: '1', verticalAlign: 'baseline' }}>●</span>)}
                            </div>
                            <div className="text-muted-foreground text-sm" style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>{coin.symbol}/KRW</div>
                          </div>
                        </div>

                        <div className={`text-right font-mono font-semibold text-lg flex items-center justify-end ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                          style={{ height: '100%', flexShrink: 0, overflow: 'hidden' }}>
                          <span style={{ lineHeight: '1', verticalAlign: 'baseline' }}>
                            {(() => {
                              const r = realTimeData[coin.symbol + '_KRW']?.closePrice;
                              let price = typeof r !== 'undefined' ? Number(r) : coin.price;
                              if (!Number.isFinite(price)) price = 0;
                              if (price < 10) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                              if (price < 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              return Math.floor(price).toLocaleString();
                            })()}
                          </span>
                        </div>

                        <div className={`text-right font-semibold flex flex-col justify-center ${coin.trend === 'up' ? 'text-red-600' : 'text-blue-600'}`}
                          style={{ height: '100%', flexShrink: 0, overflow: 'hidden' }}>
                          {/* 전일대비(%) */}
                          <div style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>
                            {coin.change > 0 ? '+' : coin.change < 0 ? '' : ''}
                            {typeof coin.change === 'number' ? coin.change.toFixed(2) : '0.00'}%
                          </div>
                          {/* 전일대비(금액) */}
                          <div className="text-sm" style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>
                            {coin.changeAmount > 0 ? '+' : coin.changeAmount < 0 ? '' : ''}
                            {typeof coin.changeAmount === 'number' ? Math.abs(coin.changeAmount).toLocaleString() : '0'}
                          </div>
                        </div>

                        <div className={`text-right text-sm flex items-center justify-end ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                          style={{ height: '100%', flexShrink: 0, overflow: 'hidden' }}>
                          <span style={{ lineHeight: '1', verticalAlign: 'baseline' }}>{coin.volume !== '' ? coin.volume : '-'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 우: 차트/주문 */}
          <div className="flex flex-col min-h-0 gap-4 h-full w-3/5" ref={mainPanelRef}>
            {/* 차트/코인정보 탭 */}
            <div className="w-full" style={{ height: chartPanelExpanded ? combinedHeight : '120px' }}>
               <div className={`flex justify-left border-b border-gray-200 dark:border-gray-700 ${chartPanelExpanded ? 'mb-4' : 'mb-1'}`}>
                <button
                   className={`w-32 px-6 py-3 text-xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                     chartPanelExpanded && chartTab === "차트" ? 'text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => {
                    if (chartPanelExpanded && chartTab === "차트") setChartPanelExpanded(false);
                    else { setChartPanelExpanded(true); setChartTab("차트"); }
                  }}
                >차트</button>

                <button
                   className={`w-30 px-6 py-3 text-xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-0 rounded-l-none ${
                     chartPanelExpanded && chartTab === "코인정보" ? 'text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => {
                    if (chartPanelExpanded && chartTab === "코인정보") setChartPanelExpanded(false);
                    else { setChartPanelExpanded(true); setChartTab("코인정보"); }
                  }}
                >코인정보</button>
              </div>

              {chartPanelExpanded && chartTab === "차트" && (
                 <div className="p-2" style={{ height: '700px' }}>
                   <div className="bg-white dark:bg-gray-800 rounded h-full">
                    <TradingChart
                      symbol={`${selectedCoin}/KRW`}
                      koreanName={selectedCoin === "BTC" ? "비트코인" : selectedCoin}
                      height={650}
                      theme="light"
                       currentPrice={realTimeData[selectedCoin + '_KRW']?.closePrice || 0}
                      initialTimeframe="1h"
                      onPriceUpdate={(price) => {
                        if (price > 0) {
                          setRealTimeData(prev => ({
                            ...prev,
                            [selectedCoin]: { ...prev[selectedCoin], close_price: price }
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {chartPanelExpanded && chartTab === "코인정보" && (
                 <div className="p-4 bg-white dark:bg-gray-800 rounded" style={{ height: '800px', overflowY: 'auto' }}>
                  <CoinInfoPanel
                    coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]}
                    realTimeData={realTimeData[selectedCoin + '_KRW']}
                    marketCap={coinList.find(c => c.symbol === selectedCoin)?.marketCap || 0}
                  />
                </div>
              )}

              {/* 하단: 주문/호가/정보 */}
              {detailView === "chart" && (
                <div className="w-full flex flex-row" style={{ 
                  height: chartPanelExpanded ? 'auto' : '800px', 
                  minHeight: chartPanelExpanded ? '600px' : '800px',
                  marginTop: chartPanelExpanded ? '20px' : '20px' 
                }}>
                  {/* 주문 영역 */}
                  <div className="flex-1 w-2/3 flex flex-col bg-white dark:bg-gray-800 px-6 overflow-auto"
                    style={{ 
                      minHeight: '600px', 
                      paddingTop: '20px', 
                      paddingBottom: '20px' 
                    }}>
                    {/* 메인 탭 */}
                    <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-4">
                      <button
                        className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 rounded-t-lg transition-colors ${
                          orderPanelExpanded ? 'text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setOrderPanelExpanded(!orderPanelExpanded)}
                      >거래</button>
                    </div>

                    {orderPanelExpanded && (
                      <div className="w-4/5 mx-auto">
                        {/* 거래 서브탭 */}
                        {orderTab === "거래" && (
                          <div className="flex border-b border-gray-200 mb-4">
                            {["매수", "매도", "거래내역"].map((t) => {
                              let activeClass = "";
                              if (tradeSubTab === t) {
                                if (t === "매수") activeClass = "border-b-2 border-red-500 text-red-600 font-semibold";
                                else if (t === "매도") activeClass = "border-b-2 border-blue-500 text-blue-600 font-semibold";
                                else if (t === "거래내역") activeClass = "border-b-2 border-black text-black font-semibold";
                              } else activeClass = "text-gray-500";
                              return (
                                // <button key={t} className={`flex-1 py-2 text-lg ${activeClass}`} onClick={() => setTradeSubTab(t)}>
                                //   {t}
                                // </button>
                                <button
                                  key={t}
                                  className={`flex-1 py-2 text-lg ${activeClass}`}
                                  onClick={() => {
                                    setTradeSubTab(t);
                                    if (t === "거래내역" && user_id && asset_id) {
                                      if (historyTab === "체결") Concluded_orders();
                                      else Unconcluded_orders();
                                    }
                                  }}
                                >
                                  {t}
                                </button>

                              );
                            })}
                          </div>
                        )}

                        {/* 매수/매도 */}
                        {orderTab === "거래" && (tradeSubTab === "매수" || tradeSubTab === "매도") ? (
                          <>
                            {/* 주문유형 */}
                            <div className="flex items-center gap-4 mb-6">
                              <span className="text-md font-semibold text-gray-900 dark:text-gray-100">주문유형</span>

                              <label className="flex items-center gap-1 text-md font-semibold text-blue-600 dark:text-blue-400">
                                <input
                                  type="radio"
                                  name="orderType"
                                  value="지정가"
                                  checked={orderType === "지정가"}
                                  onChange={() => setOrderType("지정가")}
                                  className="accent-blue-500"
                                /> 지정가
                              </label>

                              <label className="flex items-center gap-1 text-md text-gray-600 dark:text-gray-400">
                                <input
                                  type="radio"
                                  name="orderType"
                                  value="시장가"
                                  checked={orderType === "시장가"}
                                  onChange={() => setOrderType("시장가")}
                                  className="accent-blue-500"
                                /> 시장가
                              </label>
                            </div>

                            {/* 가격 */}
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-md font-semibold text-gray-900 dark:text-gray-100">
                                {tradeSubTab === "매수" ? "매수가격 (KRW)" : "매도가격 (KRW)"}
                              </span>
                              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                현재가 {(() => {
                                  const r = realTimeData[selectedCoin + '_KRW']?.closePrice;
                                  let price = typeof r !== 'undefined' ? Number(r) : currentPriceKRW;
                                  if (!Number.isFinite(price)) price = 0;
                                  if (price < 10) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                                  if (price < 100) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  return Math.floor(price).toLocaleString();
                                })()} KRW
                              </div>
                            </div>
                            <input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*[.]?[0-9]*"
  value={
    orderType === "시장가"
      // 시장가: 화면에 보기 좋게만 표시(입력 불가)
      ? (() => {
          const n = Number(orderPrice);
          if (!Number.isFinite(n)) return "0";
          if (n < 10) return n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
          if (n < 100) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return Math.floor(n).toLocaleString();
        })()
      // 지정가: 사용자가 타이핑한 원문 그대로(포맷 금지!)
      : orderPriceInput
  }
  onChange={(e) => {
    if (orderType !== "지정가") return; // 시장가는 입력 막음
    const raw = e.target.value;
    // 숫자/점만 허용
    if (!/^[0-9]*\.?[0-9]*$/.test(raw)) return;

    setOrderPriceInput(raw);

    // 공백 또는 점만 있는 경우는 숫자 세팅 보류
    if (raw === "" || raw === ".") {
      setOrderPrice(0);
      return;
    }
    const n = Number(raw);
    setOrderPrice(Number.isFinite(n) ? n : 0);
  }}
  disabled={orderType === "시장가"}
  className="w-full border border-gray-300 dark:border-gray-600 rounded h-16 px-2 mb-6 text-3xl font-semibold disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  placeholder={orderType === "지정가" ? "지정가를 입력하세요" : "시장가(자동)"}
/>


                            {/* 수량 */}
                            <div className="mb-6">
                              <div className="text-md font-semibold mb-1 text-gray-900 dark:text-gray-100">주문수량</div>
                              <input
                                type="text"
                                value={orderQty}
                                onChange={(e) => setOrderQty(Number(e.target.value) || 0)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded h-16 px-2 mb-2 text-3xl font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                placeholder="0"
                              />
                              <div className="flex gap-2">
                                <button className="flex-1 border border-gray-300 dark:border-gray-600 rounded py-1 text-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={() => setOrderQty(prev => Number((prev + 0.1).toFixed(8)))}>+0.1</button>
                                <button className="flex-1 border border-gray-300 dark:border-gray-600 rounded py-1 text-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={() => setOrderQty(prev => Number((prev + 0.25).toFixed(8)))}>+0.25</button>
                                <button className="flex-1 border border-gray-300 dark:border-gray-600 rounded py-1 text-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={() => setOrderQty(prev => Number((prev + 0.5).toFixed(8)))}>+0.5</button>
                                <button className="flex-1 border border-gray-300 dark:border-gray-600 rounded py-1 text-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" onClick={() => setOrderQty(0)}>초기화</button>
                              </div>
                            </div>

                            {/* 총액 */}
                            <div className="mb-6">
                              <div className="text-md font-semibold mb-1 text-gray-900 dark:text-gray-100">주문총액 (KRW)</div>
                              <input
                                type="text"
                                readOnly
                                value={(() => {
                                  const priceForTotal = (orderType === "시장가" ? currentPriceKRW : orderPrice) || 0;
                                  const totalAmount = priceForTotal * (orderQty || 0);
                                  if (!Number.isFinite(totalAmount)) return "0";
                                  if (totalAmount < 10) return totalAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                                  if (totalAmount < 100) return totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  return totalAmount.toLocaleString();
                                })()}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded h-16 px-2 bg-gray-50 dark:bg-gray-700 text-3xl font-semibold text-gray-900 dark:text-gray-100"
                                placeholder="0"
                              />
                            </div>

                            {/* 주문 버튼 */}
                            {tradeSubTab === "매수" && (
                              <button
                                className="w-full h-20 rounded-md bg-red-600 text-white text-2xl font-semibold hover:opacity-90"
                                type="button"
                                onClick={handleBuy}
                              >매수</button>
                            )}
                            {tradeSubTab === "매도" && (
                              <button
                                className="w-full h-20 rounded-md bg-blue-600 text-white text-2xl font-semibold hover:opacity-90"
                                type="button"
                                onClick={handleSell}
                              >매도</button>
                            )}
                          </>
                        ) : null}

                        {/* 거래내역 탭 */}
                        {orderTab === "거래" && tradeSubTab === "거래내역" && (
  <div className="text-md">
    {/* 상단 토글 + 새로고침 */}
    <div className="flex justify-between items-center mb-3">
      <div className="flex gap-2">
        <button
          type="button"
          className={`px-3 py-1 rounded-md border text-md ${
            historyTab === "미체결"
              ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
              : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
          }`}
          onClick={() => setHistoryTab("미체결")}
        >
          미체결
        </button>
        <button
          type="button"
          className={`px-3 py-1 rounded-md border text-md ${
            historyTab === "체결"
              ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
              : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
          }`}
          onClick={() => setHistoryTab("체결")}
        >
          체결
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-1 rounded-md border text-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
          onClick={() => {
            if (historyTab === "체결") Concluded_orders();
            else Unconcluded_orders();
          }}
        >
          새로고침
        </button>

      </div>
    </div>

    {/* 리스트 본문 */}
    {(() => {
      // 백에서 받은 원본 배열 선택
      const src = historyTab === "체결" ? concluded_orders : unconcluded_orders;
      const items = Array.isArray(src) ? src : [];

      if (items.length === 0) {
        return (
          <div className="border border-gray-200 dark:border-gray-600 rounded p-4 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
            {historyTab} 내역이 없습니다.
          </div>
        );
      }

      // 화면에 보일 개수
      const visible = items.slice(0, historyShowCount);

      return (
        <div className="border border-gray-200 dark:border-gray-600 rounded overflow-hidden bg-white dark:bg-gray-800">
          {/* 헤더 */}
          <div className="grid grid-cols-[1.1fr_0.6fr_0.6fr_0.8fr] px-3 py-2 text-sm font-semibold bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            <div className="text-left">체결시간</div>
            <div className="text-center">구분</div>
            <div className="text-right">수량</div>
            <div className="text-right">가격(KRW)</div>
          </div>

          {/* 로우 */}
          <div className="max-h-[420px] overflow-y-auto">
            {visible.map((r, idx) => (
              <div
                key={r.id ?? idx}
                className="grid grid-cols-[1.1fr_0.6fr_0.6fr_0.8fr] px-3 py-2 text-sm border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <div className="text-left">{r.ts ?? "-"}</div>
                <div
                  className={`text-center font-semibold ${
                    (r.side === "매수" || r.side === 0 || r.side === "0")
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {r.side ?? "-"}
                </div>
                <div className="text-right">{r.qty ?? "-"}</div>
                <div className="text-right">{r.price ?? "-"}</div>
              </div>
            ))}
          </div>

          {/* 더보기 */}
          {items.length > historyShowCount && (
            <div className="p-2 bg-white dark:bg-gray-800 flex justify-center">
              <button
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
                onClick={() => setHistoryShowCount((n) => n + 10)}
              >
                더보기 (+10)
              </button>
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}

                      </div>
                    )}
                  </div>

                  {/* 호가/정보 */}
                  <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 pt-7">
                    {/* 호가 */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 rounded-t-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          expandedSections.호가 ? 'text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : 'text-gray-500 dark:text-gray-400'
                        }`}
                        onClick={() => toggleSection("호가")}
                      >호가</button>

                      {expandedSections.호가 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                          <OrderBook
                            selectedCoin={selectedCoin}
                            realTimeData={realTimeData[selectedCoin + '_KRW']}
                            orderbook={orderbook}
                            currentPriceKRW={currentPriceKRW}
                            onPriceSelect={(price) => {
                              // 호가 클릭 시: 지정가면 입력값으로 세팅, 시장가면 무시
                              if (orderType === "지정가") {
                                setOrderPrice(price);
                                setOrderPriceInput(String(price));
                              }
                              if (orderType === "지정가") {
                                // JavaScript 부동소수점 오류 방지: 정확한 소수점 자릿수 유지
                                const exactPrice = parseFloat(price);
                                setOrderPrice(exactPrice);
                                
                                // 가격대별 정확한 소수점 자릿수로 표시
                                let formattedPrice;
                                if (exactPrice < 1) {
                                  formattedPrice = exactPrice.toFixed(4); // 0.1234
                                } else if (exactPrice < 10) {
                                  formattedPrice = exactPrice.toFixed(4); // 1.5678
                                } else if (exactPrice < 100) {
                                  formattedPrice = exactPrice.toFixed(2); // 41.79
                                } else if (exactPrice < 1000) {
                                  formattedPrice = exactPrice.toFixed(2); // 123.45
                                } else if (exactPrice < 10000) {
                                  formattedPrice = exactPrice.toFixed(2); // 1234.56
                                } else {
                                  formattedPrice = exactPrice.toFixed(2); // 12345.67
                                }
                                
                                setOrderPriceInput(formattedPrice);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 거래정보 */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 dark:border-gray-600 rounded-t-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          expandedSections.거래정보 ? 'text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900' : 'text-gray-500 dark:text-gray-400'
                        }`}
                        onClick={() => toggleSection("거래정보")}
                      >거래정보</button>

                      {expandedSections.거래정보 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                            {/* 거래량 */}
                            <div className="flex justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">거래량</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">(최근24시간)</span>
                              </div>
                              <span className="font-mono text-gray-900 dark:text-gray-100">
                                {(() => {
                                  // realTimeData에서 먼저 확인, 없으면 coinList에서
                                  const rt = realTimeData[selectedCoin + '_KRW'];
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  
                                  if (rt?.volume && rt.volume > 0) {
                                    const vol = parseFloat(rt.volume);
                                    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
                                    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
                                    return vol.toFixed(2);
                                  } else if (coin?.unitsTraded) {
                                    const vol = parseFloat(coin.unitsTraded);
                                    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
                                    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
                                    return vol.toFixed(2);
                                  }
                                  return '-';
                                })()} {selectedCoin}
                              </span>
                            </div>
                            
                            {/* 거래대금 */}
                            <div className="flex justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-gray-100">거래대금</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">(최근24시간)</span>
                              </div>
                              <span className="font-mono text-gray-900 dark:text-gray-100">
                                {(() => {
                                  const rt = realTimeData[selectedCoin + '_KRW'];
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  
                                  let vol = 0;
                                  let price = 0;
                                  
                                  if (rt?.volume && rt.volume > 0) {
                                    vol = parseFloat(rt.volume);
                                    price = parseFloat(rt.closePrice);
                                  } else if (coin?.unitsTraded && coin?.price) {
                                    vol = parseFloat(coin.unitsTraded);
                                    price = parseFloat(coin.price);
                                  }
                                  
                                  if (vol > 0 && price > 0) {
                                    const total = vol * price;
                                    if (total >= 1000000000000) return (total / 1000000000000).toFixed(2) + 'T';
                                    if (total >= 1000000000) return (total / 1000000000).toFixed(2) + 'B';
                                    if (total >= 1000000) return (total / 1000000).toFixed(2) + 'M';
                                    if (total >= 1000) return (total / 1000).toFixed(2) + 'K';
                                    return total.toFixed(0);
                                  }
                                  return '-';
                                })()} KRW
                              </span>
                            </div>
                                                        
                            {/* 24h 최고 */}
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">24h 최고</span>
                              <span className="font-mono text-red-500 dark:text-red-400">
                                {(() => {
                                  const rt = realTimeData[selectedCoin + '_KRW'];
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  
                                  let price = 0;
                                  if (rt?.highPrice && rt.highPrice > 0) {
                                    price = parseFloat(rt.highPrice);
                                  } else if (coin?.high24h) {
                                    price = parseFloat(coin.high24h);
                                  }
                                  
                                  if (price > 0) {
                                    if (price < 1) return price.toFixed(4);
                                    if (price < 10) return price.toFixed(4);
                                    if (price < 100) return price.toFixed(2);
                                    if (price < 1000) return Math.round(price).toLocaleString();
                                    if (price < 10000) return Math.round(price).toLocaleString();
                                    if (price < 100000) return (Math.round(price / 10) * 10).toLocaleString();
                                    if (price < 1000000) return (Math.round(price / 100) * 100).toLocaleString();
                                    return (Math.round(price / 1000) * 1000).toLocaleString();
                                  }
                                  return '-';
                                })()}
                              </span>
                            </div>
                            
                            {/* 24h 최저 */}
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">24h 최저</span>
                              <span className="font-mono text-blue-500 dark:text-blue-400">
                                {(() => {
                                  const rt = realTimeData[selectedCoin + '_KRW'];
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  
                                  let price = 0;
                                  if (rt?.lowPrice && rt.lowPrice > 0) {
                                    price = parseFloat(rt.lowPrice);
                                  } else if (coin?.low24h) {
                                    price = parseFloat(coin.low24h);
                                  }
                                  
                                  if (price > 0) {
                                    if (price < 1) return price.toFixed(4);
                                    if (price < 10) return price.toFixed(4);
                                    if (price < 100) return price.toFixed(2);
                                    if (price < 1000) return Math.round(price).toLocaleString();
                                    if (price < 10000) return Math.round(price).toLocaleString();
                                    if (price < 100000) return (Math.round(price / 10) * 10).toLocaleString();
                                    if (price < 1000000) return (Math.round(price / 100) * 100).toLocaleString();
                                    return (Math.round(price / 1000) * 1000).toLocaleString();
                                  }
                                  return '-';
                                })()}
                              </span>
                            </div>
                            
                            {/* 시가총액 */}
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">시가총액</span>
                              <span className="font-mono text-gray-900 dark:text-gray-100">
                                {(() => {
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  if (coin?.marketCap) {
                                    const cap = parseFloat(coin.marketCap);
                                    if (cap >= 1000000000000) return (cap / 1000000000000).toFixed(1) + 'T';
                                    if (cap >= 1000000000) return (cap / 1000000000).toFixed(1) + 'B';
                                    if (cap >= 1000000) return (cap / 1000000).toFixed(1) + 'M';
                                    if (cap >= 1000) return (cap / 1000).toFixed(1) + 'K';
                                    return cap.toFixed(0);
                                  }
                                  return '-';
                                })()} KRW
                              </span>
                            </div>
                            
                            {/* 유통량 */}
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">유통량</span>
                              <span className="font-mono text-gray-900 dark:text-gray-100">
                                {(() => {
                                  const coin = coinList.find(c => c.symbol === selectedCoin);
                                  if (coin?.circulatingSupply) {
                                    const supply = parseFloat(coin.circulatingSupply);
                                    if (supply >= 1000000000) return (supply / 1000000000).toFixed(2) + 'B';
                                    if (supply >= 1000000) return (supply / 1000000).toFixed(2) + 'M';
                                    if (supply >= 1000) return (supply / 1000).toFixed(2) + 'K';
                                    return supply.toFixed(2);
                                  }
                                  return '-';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
