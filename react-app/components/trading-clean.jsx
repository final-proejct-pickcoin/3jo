'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";
import axios from "axios";
import TradingChart from "./trading-chart.jsx";
import OrderBook from "./trading-hoga.jsx";
import { CurrencyToggle } from "@/components/currency-toggle"
import CoinInfoPanel from "@/components/trading-coininfo"  // 이 줄 추가

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
  const [tickSize, setTickSize] = useState(1);

  // 주문 가격/수량
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderQty, setOrderQty] = useState(0);

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

    idle(() => {
      if (!mounted) return;
      
      // API 서버 연결 상태 확인
      const checkServerConnection = async () => {
        try {
          const res = await fetch(
            `http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`,
            { signal: controller.signal, headers: { Accept: "application/json" } }
          );
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.user_id != null) {
              const idNum = Number(data.user_id);
              setUserId(idNum);
              sessionStorage.setItem("cached_user_id", String(idNum));
            }
          }
        } catch (err) {
          if (err?.name !== "AbortError") {
            console.log("API 서버 연결 실패 - 오프라인 모드로 실행됩니다.");
            // 오프라인 모드: 캐시된 사용자 ID 사용
            const cached = sessionStorage.getItem("cached_user_id");
            if (cached) {
              setUserId(Number(cached));
            }
          }
        }
      };
      
      checkServerConnection();
    });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // 코인 id(asset_id) 가져오기
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




  
  // 매수/매도 핸들러
  const handleBuy = async () => {
    if (!selectedCoin) {
      return alert("코인을 먼저 선택하세요!");
    }

    let id = asset_id;
    if (id == null && selectedCoin) {
      const assetSymbol = `${selectedCoin}-KRW`;
      id = await fetchAssetId(assetSymbol);
      setAsset_id(id);
    }

    try {
      const body = {
        user_id: user_id,
        asset_id: id,
        amount: orderQty,
        price: orderPrice,
      };
      alert("handleBuy:매수 body: " + body.user_id + ", " + body.asset_id + ", " + body.amount + ", " + body.price);
      
      await axios.post("http://localhost:8080/api/trade/market_buy", body);
      alert(`${selectedCoin} 매수 성공!`);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('fetch')) {
        alert("API 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.");
      } else {
        alert("handleBuy:매수 실패: " + err.message);
      }
    }
  };



  const handleSell = async () => {
    if (!selectedCoin) {
      return alert("코인을 먼저 선택하세요!");
    }

    let id = asset_id;
    if (id == null && selectedCoin) {
      const assetSymbol = `${selectedCoin}-KRW`;
      id = await fetchAssetId(assetSymbol);
      setAsset_id(id);
    }

    try {
      const body = {
        user_id: user_id,
        asset_id: id,
        amount: orderQty,
        price: orderPrice,
      };
      alert("handleSell:매도 body: " + body.user_id + ", " + body.asset_id + ", " + body.amount + ", " + body.price);
      await axios.post("http://localhost:8080/api/trade/market_sell", body);
      alert(`${selectedCoin} 매도 성공!`);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('fetch')) {
        alert("API 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.");
      } else {
        alert("handleSell:매도 실패: " + err.message);
      }
    }
  };

  // 높이 계산
  useEffect(() => {
    function updateHeight() {
      if (mainPanelRef.current) {
        setCombinedHeight(mainPanelRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    const resizeObs = mainPanelRef.current ? new window.ResizeObserver(updateHeight) : null;
    if (resizeObs && mainPanelRef.current) resizeObs.observe(mainPanelRef.current);
    return () => {
      window.removeEventListener('resize', updateHeight);
      if (resizeObs && mainPanelRef.current) resizeObs.disconnect();
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
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ticker' && data.content) {
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
                const prevData = prev[symbol];
                const prevPrice = prevData ? parseFloat(prevData.closePrice) : closePrice;
                const priceDirection = closePrice > prevPrice ? 'up' : closePrice < prevPrice ? 'down' : 'same';
                return {
                  ...prev,
                  [symbol]: {
                    symbol: symbol,
                    closePrice: closePrice,
                    chgRate: chgRate,
                    chgAmt: parseFloat(content.chgAmt) || 0,
                    value: value,
                    timestamp: content.timestamp || Date.now(),
                    priceDirection: priceDirection,
                    lastUpdate: Date.now()
                  }
                };
              });
            } else if (data.type === 'orderbook' && data.content) {  // 이 부분 추가
              // 호가 데이터 처리
              const { symbol, bids, asks } = data.content;
              if (symbol === selectedCoin + '_KRW') {
                setOrderbook({ bids, asks, timestamp: Date.now() });
              }
            }
          } catch (e) {
            console.error('❌ 실시간 데이터 파싱 오류:', e);
          }
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

        ws.onerror = (error) => {
          console.error('❌ WebSocket 오류:', error);
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

      } catch (error) {
        console.error('❌ WebSocket 생성 오류:', error);
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

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
        
        if (data.status === 'success' && data.data && Array.isArray(data.data)) {
          console.log(`✅ 원화 마켓 ${data.data.length}개 코인 로드 성공`);
                     const mappedCoins = data.data.map(coin => ({
             symbol: coin.symbol,
             name: coin.korean_name || coin.symbol,
             englishName: coin.english_name || coin.symbol,
             price: coin.current_price || 0,
             change: coin.change_rate || 0,
             changeAmount: coin.change_amount || 0,
             volume: coin.volume || 0,
             trend: (coin.change_rate || 0) > 0 ? 'up' : 'down',
             marketWarning: coin.market_warning || 'NONE',
             marketCap: coin.market_cap || 0,
             marketCapRank: coin.market_cap_rank || 0,
             // 추가 정보들
             circulatingSupply: coin.circulating_supply || 0,
             high24h: coin.high_24h || 0,
             low24h: coin.low_24h || 0,
             unitsTraded: coin.units_traded || 0
           }));
          setCoinList(mappedCoins);
        }
      } catch (e) {
        console.error(`❌ 원화 마켓 조회 실패:`, e);
      } finally {
        setCoinListLoading(false);
      }
    };
    fetchCoins();
  }, []);

  // 실시간 데이터로 코인 목록 업데이트
  const updatedCoinList = useMemo(() => {
    return coinList.map(coin => {
      const realtimeInfo = realTimeData[coin.symbol + '_KRW'];
      if (realtimeInfo && !isNaN(realtimeInfo.closePrice)) {
        const millionValue = Math.round(parseFloat(realtimeInfo.value) / 1000000);
        const formattedVolume = millionValue.toLocaleString() + ' 백만';
        return {
          ...coin,
          price: parseInt(realtimeInfo.closePrice),
          change: parseFloat(realtimeInfo.chgRate),
          changeAmount: parseInt(realtimeInfo.chgAmt),
          trend: parseFloat(realtimeInfo.chgRate) > 0 ? 'up' : 'down',
          volume: formattedVolume
        };
      } else {
        return {
          ...coin,
          price: coin.price || 0,
          change: coin.change || 0,
          changeAmount: coin.changeAmount || 0,
          trend: coin.change > 0 ? 'up' : coin.change < 0 ? 'down' : 'same',
          volume: coin.volume ? `${Math.round(coin.volume / 1000000).toLocaleString()} 백만` : ''
        };
      }
    });
  }, [coinList, realTimeData]);

  // 정렬 상태
  const [sortKey, setSortKey] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc');

  // 정렬 핸들러
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // 필터링된 코인 목록
  const filteredCoinList = useMemo(() => {
    let filtered = updatedCoinList;
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filtered = updatedCoinList.filter(coin =>
        (coin.name && coin.name.toLowerCase().includes(lower)) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(lower))
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
    });
    return sorted;
  }, [searchTerm, updatedCoinList, sortKey, sortOrder]);

  // 현재가 계산
  const currentPriceKRW = useMemo(() => {
    const rt = realTimeData[selectedCoin + "_KRW"];
    if (rt?.closePrice) return parseInt(rt.closePrice, 10);
    const fallback = updatedCoinList.find(c => c.symbol === selectedCoin)?.price;
    return typeof fallback === "number" ? fallback : 0;
  }, [selectedCoin, realTimeData, updatedCoinList]);

  // 주문가격을 현재가로 동기화
  useEffect(() => {
    setOrderPrice(currentPriceKRW);
  }, [currentPriceKRW, selectedCoin]);


  // orderbook 데이터 가져오기
  useEffect(() => {
    if (!selectedCoin) return;
    
    const fetchOrderbook = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/orderbook/${selectedCoin}_KRW`);
        if (response.ok) {
          const data = await response.json();
          setOrderbook(data);
        }
      } catch (error) {
        console.error('호가 데이터 가져오기 실패:', error);
      }
    };

    // 초기 로드
    fetchOrderbook();
    
    // 실시간 업데이트 (3초마다)
    const interval = setInterval(fetchOrderbook, 3000);
    
    return () => clearInterval(interval);
  }, [selectedCoin]);

  // 코인 선택 시 상세 화면으로 전환
  const handleCoinSelect = async (coin) => {
    setSelectedCoin(coin.symbol);
    const market = "KRW";
    const assetSymbol = `${coin.symbol}-${market}`;
    const id = await fetchAssetId(assetSymbol);
    setAsset_id(id);
    setView("detail");
    setDetailView("chart");
  };

  return (
    <div className="w-full p-0 space-y-4">

        {/* 연결 상태 표시 */}
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
            {wsConnected ? '🟢 거래소 실시간 연결됨' : '🔴 연결 끊어짐'}
            </span>
            <span className="text-sm text-gray-500">
            실시간: {Object.keys(realTimeData).length}개 | 
            총 코인: {coinList.length}개
            </span>
        </div>
        <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date().toLocaleTimeString()}
        </div>
        </div>

      {/* 상세 거래 화면 */}
        <div className="w-full">       
          {/* 상단 헤더 - 뒤로가기 버튼 포함 */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-2/5 flex justify-center">
              <div className="text-4xl font-bold">
                <span>종목(상품)</span>
              </div>
            </div>
          </div>

          {/* 좌측: 코인 목록 (2/5) */}
          <div className="flex flex-row min-h-0" style={{ height: combinedHeight }}>
            
            {/* 코인목록 */}
            <div className="flex flex-col w-2/5 min-h-0" style={{ height: 600 }}>
              <Card className="flex flex-col border-0" style={{ height: 1200 }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="코인명/심볼검색"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 flex-1 border rounded px-2"
                      autoComplete="off"
                    />
                  </div>
                  
                  {/* 원화/보유/관심 탭 */}
                  <div className="flex bg-gray-100 rounded-lg p-1 w-full mb-4 shadow-sm">
                    {[
                      { key: "won", label: "원화" },
                      { key: "hold", label: "보유" },
                      { key: "star", label: "관심" },
                    ].map((t, i) => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-2 px-3 text-center text-sm font-medium transition-all duration-200 rounded-md flex flex-col justify-end
                          ${t.key === tab
                            ? "bg-white text-gray-800 shadow-sm font-semibold"
                            : "text-gray-500 hover:text-gray-700"}
                          ${i === 0 ? "rounded-l-md" : ""} ${i === 2 ? "rounded-r-md" : ""}`}
                        style={{ minWidth: 0 }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col min-h-0" style={{ height: 600 }}>
                  {/* 컬럼 헤더 */}
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-6 px-2 py-2 text-sm font-bold text-muted-foreground border-b bg-gray-50 sticky top-0 z-10" style={{ 
                    height: '40px', 
                    minHeight: '40px', 
                    maxHeight: '40px',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    <div className="text-center gap-3" style={{ lineHeight: '1', verticalAlign: 'baseline' }}>
                      {/* 관심 별 아이콘 */}
                    </div>
                    <div className="flex items-center cursor-pointer text-left" onClick={() => handleSort('name')} style={{ lineHeight: '1', verticalAlign: 'baseline' }}>
                      한글명
                      {sortKey === 'name' ? (
                        <span className="text-[10px] text-blue-600" style={{ lineHeight: '1', verticalAlign: 'baseline' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300" style={{ lineHeight: '1', verticalAlign: 'baseline' }}>△▽</span>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('price')}>
                      현재가
                      {sortKey === 'price' ? (
                        <span className="text-[10px] text-blue-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300">△▽</span>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('change')}>
                      전일대비
                      {sortKey === 'change' ? (
                        <span className="text-[10px] text-blue-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300">△▽</span>
                      )}
                    </div>
                    <div className="text-right flex items-center gap-1 cursor-pointer" onClick={() => handleSort('volume')}>
                      거래대금
                      {sortKey === 'volume' ? (
                        <span className="text-[10px] text-blue-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      ) : (
                        <span className="text-[10px] text-gray-300">△▽</span>
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0" style={{ 
                    height: combinedHeight,
                    flexShrink: 0
                  }}>
                    {coinListLoading ? (
                      <div className="p-4 text-center text-gray-500">로딩 중...</div>
                    ) : filteredCoinList.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">코인 목록이 없습니다.</div>
                    ) : (
                      filteredCoinList.map((coin, index) => (
                        <div
                          key={coin.symbol}
                          onClick={() => handleCoinSelect(coin)}
                          className={`grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-3 p-1 text-sm cursor-pointer border-b items-center
                            ${selectedCoin === coin.symbol ? 'bg-blue-50 border-blue-200' : ''}`}
                          style={{ 
                            height: '48px', 
                            minHeight: '48px', 
                            maxHeight: '48px',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}
                        >
                          {/* 관심 별 아이콘 */}
                          <div className="flex justify-center items-center" style={{ 
                            height: '100%',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            <button
                              onClick={(e) => toggleFavorite(coin.symbol, e)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <StarIcon 
                                filled={favoriteCoins.has(coin.symbol)} 
                                size={18}
                                className={favoriteCoins.has(coin.symbol) ? "text-yellow-500" : "text-gray-400"}
                              />
                            </button>
                          </div>
                          {/* 한글명/심볼 */}
                          <div className="flex items-center gap-1 text-left" style={{ 
                            height: '100%',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            <div className="flex flex-col justify-center" style={{ width: '100%' }}>
                              <div
                                className={`font-semibold text-sm ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                                style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}
                              >
                                {coin.name}
                                {realTimeData[coin.symbol + '_KRW'] && (
                                  <span className="ml-1 text-green-500 text-[8px]" style={{ lineHeight: '1', verticalAlign: 'baseline' }}>●</span>
                                )}
                              </div>
                              <div className="text-muted-foreground text-sm" style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>{coin.symbol}/KRW</div>
                            </div>
                          </div>
                          {/* 현재가 */}
                          <div
                            className={`text-right font-mono font-semibold text-lg flex items-center justify-end ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                            style={{ 
                              height: '100%',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}
                          >
                            <span style={{ lineHeight: '1', verticalAlign: 'baseline' }}>
                              {(() => {
                                const realtime = realTimeData[coin.symbol + '_KRW']?.closePrice;
                                let price = typeof realtime !== 'undefined' ? Number(realtime) : coin.price;
                                if (typeof price !== 'number' || isNaN(price)) price = 0;
                                if (price < 10) {
                                  return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                                } else if (price < 100) {
                                  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                } else {
                                  return Math.floor(price).toLocaleString();
                                }
                              })()}
                            </span>
                          </div>
                          {/* 전일대비 */}
                          <div className={`text-right font-semibold flex flex-col justify-center ${coin.trend === 'up' ? 'text-red-600' : 'text-blue-600'}`} style={{ 
                            height: '100%',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            <div style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>{coin.trend === 'up' ? '+' : ''}{coin.change !== 0 ? coin.change.toFixed(2) : '0.00'}%</div>
                            <div className="text-sm" style={{ lineHeight: '1.2', verticalAlign: 'baseline' }}>
                              {coin.changeAmount > 0 ? '+' : ''}
                              {coin.changeAmount !== 0 ? coin.changeAmount.toLocaleString() : '0'}
                            </div>
                          </div>
                          {/* 거래대금 */}
                          <div
                            className={`text-right text-sm flex items-center justify-end ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                            style={{ 
                              height: '100%',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}
                          >
                            <span style={{ lineHeight: '1', verticalAlign: 'baseline' }}>
                              {coin.volume !== '' ? coin.volume : '-'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 우측: 차트 및 거래 영역 (3/5) */}
            <div className="flex flex-col min-h-0 gap-4 h-full w-3/5" ref={mainPanelRef}>
              {/* 차트 or 코인정보 */}
              <div className="w-full" style={{ 
                height: chartPanelExpanded ? combinedHeight : '120px' 
              }}>
                {/* 차트/코인정보 탭팬 */}
                <div className={`flex justify-left border-b border-gray-200 ${
                  chartPanelExpanded ? 'mb-4' : 'mb-1'
                }`}>
                  <button
                    className={`w-32 px-6 py-3 text-xl font-semibold text-center border-2 border-gray-300 rounded-t-lg hover:bg-gray-50 transition-colors ${
                      chartPanelExpanded && chartTab === "차트" 
                        ? 'text-blue-600 border-blue-500 bg-blue-100' 
                        : 'text-gray-500 bg-white'
                    }`}
                    onClick={() => {
                      if (chartPanelExpanded && chartTab === "차트") {
                        setChartPanelExpanded(false);
                      } else {
                        setChartPanelExpanded(true);
                        setChartTab("차트");
                      }
                    }}
                  >
                    차트
                  </button>
                  <button
                    className={`w-30 px-6 py-3 text-xl font-semibold text-center border-2 border-gray-300 rounded-t-lg hover:bg-gray-50 transition-colors border-l-0 rounded-l-none ${
                      chartPanelExpanded && chartTab === "코인정보" 
                        ? 'text-blue-600 border-blue-500 bg-blue-100' 
                        : 'text-gray-500 bg-white'
                    }`}
                    onClick={() => {
                      if (chartPanelExpanded && chartTab === "코인정보") {
                        setChartPanelExpanded(false);
                      } else {
                        setChartPanelExpanded(true);
                        setChartTab("코인정보");
                      }
                    }}
                  >
                    코인정보
                  </button>
                </div>
                
                {/* 차트 내용 (아코디언) */}
                {chartPanelExpanded && chartTab === "차트" && (
                  <div className="p-2" style={{ height: '550px' }}>
                    {/* 차트 영역 */}
                    <div className="bg-white rounded h-full">
                      <TradingChart 
                        symbol={`${selectedCoin}/KRW`}
                        koreanName={selectedCoin === "BTC" ? "비트코인" : selectedCoin}
                        height={650}
                        theme="light"
                        currentPrice={realTimeData[selectedCoin]?.close_price || 0}
                        initialTimeframe="1h"
                        onPriceUpdate={(price) => {
                          // 실시간 가격 업데이트
                          if (price > 0) {
                            setRealTimeData(prev => ({
                              ...prev,
                              [selectedCoin]: {
                                ...prev[selectedCoin],
                                close_price: price
                              }
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* 코인정보 내용 (아코디언) */}
                {chartPanelExpanded && chartTab === "코인정보" && (
                  <div className="p-4 " style={{ height: '900px' }}>
                    {/* CoinInfoPanel 컴포넌트 사용 */}
                    <CoinInfoPanel 
                      coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]} 
                      realTimeData={realTimeData[selectedCoin + '_KRW']}
                      marketCap={coinList.find(c => c.symbol === selectedCoin)?.marketCap || 0}
                    />
                  </div>
                )}            
              
              {/* 하단: 오더북/정보패널/주문 */}
              {detailView === "chart" && (
                <div className="w-full flex flex-row" style={{ 
                  height: chartPanelExpanded ? 600 : 800, 
                  marginTop: chartPanelExpanded ? '170px' : '20px' 
                }}>
                  
                  {/* 주문 영역 (2/5) */}
                  <div className="flex-1 w-2/3 flex flex-col bg-white px-6 overflow-auto" 
                  style={{
                    minHeight: '800px',
                    paddingTop: chartPanelExpanded ? '16px' : '28px',
                    paddingBottom: '0'
                  }}>
                    {/* 메인 탭 헤더 */}
                    <div className="flex justify-center border-b border-gray-200 mb-4">
                        <button 
                          className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 rounded-t-lg transition-colors ${
                            orderPanelExpanded 
                              ? 'text-blue-600 border-blue-500 bg-blue-50' 
                              : 'text-gray-500 bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => setOrderPanelExpanded(!orderPanelExpanded)}
                        >
                            거래
                        </button>
                    </div>
                    
                    {/* 주문창 아코디언 */}
                    {orderPanelExpanded && (
                      <div className="w-4/5 mx-auto">

                    {/* 거래 탭일 때만 서브 탭 표시 */}
                    {orderTab === "거래" && (
                      <div className="flex border-b border-gray-200 mb-4">
                        {["매수", "매도", "거래내역"].map((t) => {
                          let activeClass = "";
                          if (tradeSubTab === t) {
                            if (t === "매수") activeClass = "border-b-2 border-red-500 text-red-600 font-semibold";
                            else if (t === "매도") activeClass = "border-b-2 border-blue-500 text-blue-600 font-semibold";
                            else if (t === "거래내역") activeClass = "border-b-2 border-black text-black font-semibold";
                          } else {
                            activeClass = "text-gray-500";
                          }
                          return (
                            <button
                              key={t}
                              className={`flex-1 py-2 text-lg ${activeClass}`}
                              onClick={() => setTradeSubTab(t)}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 매수/매도 탭 공통 */}
                    {orderTab === "거래" && (tradeSubTab === "매수" || tradeSubTab === "매도") ? (
                      <>
                        {/* 주문유형 */}
                        <div className="flex items-center gap-4 mb-6">
                          <span className="text-md font-semibold">주문유형</span>
                          <label className="flex items-center gap-1 text-md font-semibold text-blue-600">
                            <input type="radio" name="orderType" defaultChecked className="accent-blue-500" /> 지정가
                          </label>
                          <label className="flex items-center gap-1 text-md text-gray-400">
                            <input type="radio" name="orderType" className="accent-blue-500" /> 시장가
                          </label>
                        </div>

                        {/* 가격 */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-md font-semibold">
                            {tradeSubTab === "매수" ? "매수가격 (KRW)" : "매도가격 (KRW)"}
                          </span>
                          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            현재가 {(() => {
                              const realtime = realTimeData[selectedCoin + '_KRW']?.closePrice;
                              let price = typeof realtime !== 'undefined' ? Number(realtime) : currentPriceKRW;
                              if (typeof price !== 'number' || isNaN(price)) price = 0;
                              if (price < 10) {
                                return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                              } else if (price < 100) {
                                return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              } else {
                                return Math.floor(price).toLocaleString();
                              }
                            })()} KRW
                          </div>
                        </div>
                        <input
                          type="text"
                          value={(() => {
                            const realtime = realTimeData[selectedCoin + '_KRW']?.closePrice;
                            let price = typeof realtime !== 'undefined' ? Number(realtime) : orderPrice;
                            if (typeof price !== 'number' || isNaN(price)) price = 0;
                            if (price < 10) {
                              return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                            } else if (price < 100) {
                              return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            } else {
                              return Math.floor(price).toLocaleString();
                            }
                          })()}
                          onChange={(e) => setOrderPrice(Number(e.target.value) || 0)}
                          className="w-full border rounded h-16 px-2 mb-6 text-3xl font-semibold"
                          placeholder="0"
                        />

                        {/* 수량 */}
                        <div className="mb-6">
                          <div className="text-md font-semibold mb-1">주문수량</div>
                          <input
                            type="text"
                            value={orderQty}
                            onChange={(e) => setOrderQty(Number(e.target.value) || 0)}
                            className="w-full border rounded h-16 px-2 mb-2 text-3xl font-semibold"
                            placeholder="0"
                          />
                          <div className="flex gap-2">
                            <button className="flex-1 border rounded py-1 text-md" onClick={() => setOrderQty(prev => prev + 0.1)}>+0.1</button>
                            <button className="flex-1 border rounded py-1 text-md" onClick={() => setOrderQty(prev => prev + 0.25)}>+0.25</button>
                            <button className="flex-1 border rounded py-1 text-md" onClick={() => setOrderQty(prev => prev + 0.5)}>+0.5</button>
                            <button className="flex-1 border rounded py-1 text-md" onClick={() => setOrderQty(0)}>초기화</button>
                          </div>
                        </div>

                        {/* 총액 */}
                        <div className="mb-6">
                          <div className="text-md font-semibold mb-1">주문총액 (KRW)</div>
                          <input
                            type="text"
                            readOnly
                            value={(() => {
                              const realtime = realTimeData[selectedCoin + '_KRW']?.closePrice;
                              let price = typeof realtime !== 'undefined' ? Number(realtime) : orderPrice;
                              if (typeof price !== 'number' || isNaN(price)) price = 0;
                              const totalAmount = price * (orderQty || 0);
                              if (totalAmount < 10) {
                                return totalAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
                              } else if (totalAmount < 100) {
                                return totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              } else {
                                return totalAmount.toLocaleString();
                              }
                            })()}
                            className="w-full border rounded h-16 px-2 bg-gray-50 text-3xl font-semibold"
                            placeholder="0"
                          />
                        </div>

                        {/* 매수/매도 버튼 */}
                        {tradeSubTab === "매수" && (
                          <button
                            className="w-full h-20 rounded-md bg-red-600 text-white text-2xl font-semibold hover:opacity-90"
                            type="button"
                            onClick={handleBuy}
                          >
                            매수
                          </button>
                        )}
                        {tradeSubTab === "매도" && (
                          <button
                            className="w-full h-20 rounded-md bg-blue-600 text-white text-2xl font-semibold hover:opacity-90"
                            type="button"
                            onClick={handleSell}
                          >
                            매도
                          </button>
                        )}
                      </>
                    ) : null}

                    {/* 거래내역 */}
                    {orderTab === "거래" && tradeSubTab === "거래내역" && (
                      <div className="text-md">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className={`px-3 py-1 rounded-md border text-md ${
                                historyTab === "미체결"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "text-gray-600 border-gray-200"
                              }`}
                              onClick={() => setHistoryTab("미체결")}
                            >
                              미체결
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1 rounded-md border text-md ${
                                historyTab === "체결"
                                  ? "bg-blue-50 text-blue-600 border-blue-200"
                                  : "text-gray-600 border-gray-200"
                              }`}
                              onClick={() => setHistoryTab("체결")}
                            >
                              체결
                            </button>
                          </div>
                          {historyTab === "미체결" && (
                            <button
                              type="button"
                              className="px-3 py-1 rounded-md border text-md bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <div className="border rounded p-4 text-center text-gray-400">
                          거래내역이 없습니다.
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                  </div>
                  
                  {/* 호가창 & 거래정보 영역 (1/5) */}
                  <div className="w-1/3 flex flex-col bg-white pt-7">
                    {/* 호가창 아코디언 */}
                    <div className="border-b border-gray-200">
                      <button 
                        className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 rounded-t-lg bg-white hover:bg-gray-50 transition-colors ${
                          expandedSections.호가 ? 'text-blue-600 border-blue-500 bg-blue-50' : 'text-gray-500'
                        }`}
                        onClick={() => toggleSection("호가")}
                      >
                        호가
                      </button>
                      
                      {/* 호가창 내용 (아코디언) */}
                      {expandedSections.호가 && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <OrderBook 
                            selectedCoin={selectedCoin}
                            realTimeData={realTimeData[selectedCoin + '_KRW']}
                            orderbook={orderbook}
                            tickSize={tickSize}
                            currentPriceKRW={currentPriceKRW}
                            onPriceSelect={(price) => setOrderPrice(price)}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* 거래정보 아코디언 */}
                    <div className="border-b border-gray-200">
                      <button 
                        className={`w-full px-6 py-3 text-3xl font-semibold text-center border-2 border-gray-300 rounded-t-lg bg-white hover:bg-gray-50 transition-colors ${
                          expandedSections.거래정보 ? 'text-blue-600 border-blue-500 bg-blue-50' : 'text-gray-500'
                        }`}
                        onClick={() => toggleSection("거래정보")}
                      >
                        거래정보
                      </button>
                      
                      {/* 거래정보 내용 (아코디언) */}
                      {expandedSections.거래정보 && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <div className="space-y-3">
                            {/* 거래정보 내용 */}
                            <div className="text-sm">
                              {/* 거래량 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">거래량</span>
                                <span className="text-gray-600">
                                  {(() => {
                                    // coinList에서 unitsTraded (거래량) 가져오기
                                    const coin = coinList.find(c => c.symbol === selectedCoin);
                                    if (coin?.unitsTraded && coin.unitsTraded > 0) {
                                      const volume = coin.unitsTraded;
                                      // 적절한 단위로 변환
                                      if (volume >= 1000000) {
                                        return (volume / 1000000).toFixed(2) + ' M';
                                      } else if (volume >= 1000) {
                                        return (volume / 1000).toFixed(2) + ' K';
                                      } else {
                                        return volume.toLocaleString();
                                      }
                                    }
                                    // 백업: realTimeData에서 volume 확인
                                    const rt = realTimeData[selectedCoin + '_KRW'];
                                    if (rt?.volume) {
                                      const volume = rt.volume;
                                      if (volume >= 1000000) {
                                        return (volume / 1000000).toFixed(2) + ' M';
                                      } else if (volume >= 1000) {
                                        return (volume / 1000).toFixed(2) + ' K';
                                      } else {
                                        return volume.toLocaleString();
                                      }
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
                              
                              {/* 거래대금 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">거래대금</span>
                                <span className="text-gray-600">
                                  {(() => {
                                    const rt = realTimeData[selectedCoin + '_KRW'];
                                    if (rt?.value) {
                                      return parseInt(rt.value).toLocaleString();
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mb-3">(최근24시간)</div>
                              
                              {/* 24h 최고가 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">24h 최고</span>
                                <span className="text-red-500">
                                  {(() => {
                                    const coin = coinList.find(c => c.symbol === selectedCoin);
                                    if (coin?.high24h) {
                                      return coin.high24h.toLocaleString();
                                    }
                                    const rt = realTimeData[selectedCoin + '_KRW'];
                                    if (rt?.highPrice) {
                                      return rt.highPrice.toLocaleString();
                                    }
                                    // 현재가 기준으로 추정 (실제로는 API에서 받아와야 함)
                                    if (rt?.closePrice && rt?.chgRate) {
                                      const estimatedHigh = rt.closePrice * (1 + Math.abs(rt.chgRate) / 100);
                                      return Math.round(estimatedHigh).toLocaleString();
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
                              
                              {/* 24h 최저가 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">24h 최저</span>
                                <span className="text-blue-500">
                                  {(() => {
                                    const coin = coinList.find(c => c.symbol === selectedCoin);
                                    if (coin?.low24h) {
                                      return coin.low24h.toLocaleString();
                                    }
                                    const rt = realTimeData[selectedCoin + '_KRW'];
                                    if (rt?.lowPrice) {
                                      return rt.lowPrice.toLocaleString();
                                    }
                                    // 현재가 기준으로 추정 (실제로는 API에서 받아와야 함)
                                    if (rt?.closePrice && rt?.chgRate) {
                                      const estimatedLow = rt.closePrice * (1 - Math.abs(rt.chgRate) / 100);
                                      return Math.round(estimatedLow).toLocaleString();
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
                              
                              {/* 시가총액 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">시가총액</span>
                                <span className="text-gray-600">
                                  {(() => {
                                    const coin = coinList.find(c => c.symbol === selectedCoin);
                                    if (coin?.marketCap && coin.marketCap > 0) {
                                      if (coin.marketCap >= 1000000000) {
                                        return (coin.marketCap / 1000000000).toFixed(2) + ' B';
                                      } else if (coin.marketCap >= 1000000) {
                                        return (coin.marketCap / 1000000).toFixed(1) + ' M';
                                      } else if (coin.marketCap >= 1000) {
                                        return (coin.marketCap / 1000).toFixed(1) + ' K';
                                      } else {
                                        return coin.marketCap.toLocaleString();
                                      }
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
                              
                              {/* 유통량 */}
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700">유통량</span>
                                <span className="text-gray-600">
                                  {(() => {
                                    const coin = coinList.find(c => c.symbol === selectedCoin);
                                    if (coin?.circulatingSupply && coin.circulatingSupply > 0) {
                                      const supply = coin.circulatingSupply;
                                      // 정확한 단위 변환 및 표시
                                      if (supply >= 1000000000) {
                                        return (supply / 1000000000).toFixed(2) + ' B';
                                      } else if (supply >= 1000000) {
                                        return (supply / 1000000).toFixed(2) + ' M';
                                      } else if (supply >= 1000) {
                                        return (supply / 1000).toFixed(2) + ' K';
                                      } else {
                                        return supply.toLocaleString();
                                      }
                                    }
                                    return '-';
                                  })()}
                                </span>
                              </div>
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
