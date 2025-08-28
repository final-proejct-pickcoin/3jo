// components/trading-clean.jsx
"use client"

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useHighlightEffect } from "./trading-hooks";
import axios from "axios";
import CoinListPanel from "./trading-coinlist";
import TradingOrderPanel from "./trading-orderform";
import Tradingcoininfo from "./trading-coininfo";
import TradingChart from "./trading-chart.jsx";

// ✅ import 정리


const TRADE_API = "http://localhost:8080/api/trade";

// ✅ 컴포넌트 외부로 이동
const fetchAssetId = async (assetSymbol) => {
  try {
    const url = `http://localhost:8080/api/Market_assets/asset-id?asset_symbol=${encodeURIComponent(assetSymbol)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const arr = await res.json();
    return Array.isArray(arr) && arr.length ? Number(arr[0]) : null;
  } catch {
    return null;
  }
};

const normalizeOrders = (payload) => {
  const arr = Array.isArray(payload) ? payload : (payload?.data || []);
  return arr.map((row, i) => ({
    id: row.order_id || row.id || `order-${i}`,
    ts: new Date(row.order_date || Date.now()).toLocaleString(),
    side: row.order_type === 0 || row.order_type === "0" ? "매수" : "매도",
    qty: Number(row.amount || 0).toFixed(8).replace(/\.?0+$/, ""),
    price: Number(row.price || 0).toLocaleString(),
  }));
};

const formatKRW = (n) => (Number.isFinite(n) ? n.toLocaleString() : "-");

// ✅ 메인 컴포넌트
function TradingInterface() {
  // 모든 상태를 컴포넌트 최상단에 선언
  const [user_id, setUserId] = useState(null);
  const [asset_id, setAsset_id] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [coinDetail, setCoinDetail] = useState(null);
  const [coinList, setCoinList] = useState([]);
  const [coinListLoading, setCoinListLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("연결 중...");
  const [view, setView] = useState("chart");
  const [orderTab, setOrderTab] = useState("매수");
  const [historyTab, setHistoryTab] = useState("체결");
  const [orderPrice, setOrderPrice] = useState(0);
  const [orderQty, setOrderQty] = useState(0);
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [], timestamp: null });
  const [marketInfo, setMarketInfo] = useState({});
  const [unconcluded_orders, setUnconcluded_orders] = useState([]);
  const [concluded_orders, setConcluded_orders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  
  const highlighted = useHighlightEffect(coinList, realTimeData);
  const [combinedHeight] = useState(600);
  const mainPanelRef = useRef(null);

  // ✅ 모든 함수들을 useCallback으로 감싸거나 컴포넌트 외부로 이동
  const handleBuy = async () => {
    if (!selectedCoin || !user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    // asset_id 가져오기 전에 먼저 알림창 표시
    let id = asset_id;
    if (!id) {
      console.log(`🔍 ${selectedCoin}의 asset_id 조회 중...`);
      id = await fetchAssetId(`${selectedCoin}-KRW`);
      setAsset_id(id);
      console.log(`📋 조회된 asset_id: ${id}`);
    }

    // 매수 데이터 미리 알림 (조건 없이 무조건 표시)
    alert(`💰 매수 주문 데이터 확인:\n\n코인: ${selectedCoin}\nuser_id: ${user_id}\nasset_id: ${id || '조회중...'}\n수량: ${orderQty}\n가격: ${orderPrice?.toLocaleString()}원\n총 금액: ${(orderPrice * orderQty)?.toLocaleString()}원`);

    // asset_id가 없으면 에러 처리
    if (!id) {
      alert("❌ 에러: 코인 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/trade/market_buy", {
        user_id, asset_id: id, amount: orderQty, price: orderPrice
      });
      alert(`✅ ${selectedCoin} 매수 성공!`);
    } catch (err) {
      alert("❌ 매수 실패: " + err.message);
    }
  };

  const handleSell = async () => {
    if (!selectedCoin || !user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    // asset_id 가져오기 전에 먼저 알림창 표시
    let id = asset_id;
    if (!id) {
      console.log(`🔍 ${selectedCoin}의 asset_id 조회 중...`);
      id = await fetchAssetId(`${selectedCoin}-KRW`);
      setAsset_id(id);
      console.log(`📋 조회된 asset_id: ${id}`);
    }

    // 매도 데이터 미리 알림 (조건 없이 무조건 표시)
    alert(`💸 매도 주문 데이터 확인:\n\n코인: ${selectedCoin}\nuser_id: ${user_id}\nasset_id: ${id || '조회중...'}\n수량: ${orderQty}\n가격: ${orderPrice?.toLocaleString()}원\n총 금액: ${(orderPrice * orderQty)?.toLocaleString()}원`);

    // asset_id가 없으면 에러 처리
    if (!id) {
      alert("❌ 에러: 코인 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      await axios.post("http://localhost:8080/api/trade/market_sell", {
        user_id, asset_id: id, amount: orderQty, price: orderPrice
      });
      alert(`✅ ${selectedCoin} 매도 성공!`);
    } catch (err) {
      alert("❌ 매도 실패: " + err.message);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc');
    }
  };

  const getKoreanName = () => {
    const selectedCoinData = coinList.find(c => c.symbol === selectedCoin);
    if (selectedCoinData?.name && selectedCoinData.name !== selectedCoin) {
      return selectedCoinData.name;
    }
    return selectedCoin;
  };

  // ✅ useEffect들을 올바른 순서로 배치
  
  // 사용자 ID 가져오기
  useEffect(() => {
    const cached = sessionStorage.getItem("cached_user_id");
    if (cached) {
      setUserId(Number(cached));
    }

    const token = sessionStorage.getItem("auth_token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email || payload.sub;
      if (!email) return;

      fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(email)}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (data?.user_id) {
            setUserId(Number(data.user_id));
            sessionStorage.setItem("cached_user_id", String(data.user_id));
          }
        })
        .catch(() => console.log("유저 ID 조회 실패"));
    } catch (error) {
      console.error("토큰 파싱 실패:", error);
    }
  }, []);

  // 코인 목록 로딩
  useEffect(() => {
    setCoinListLoading(true);
    fetchCoinList()
      .then(coins => {
        setCoinList(coins);
        console.log(`🎯 코인 목록 로딩 완료: ${coins.length}개`);
      })
      .catch(error => {
        console.error('코인 목록 로딩 실패:', error);
      })
      .finally(() => setCoinListLoading(false));
  }, []);

  // 선택된 코인 상세 정보 로딩
  useEffect(() => {
    if (!selectedCoin) return;
    
    let isMounted = true;
    console.log(`🔍 ${selectedCoin} 상세 정보 로딩 시작`);
    
    setCoinDetail(null);
    
    fetchCoinFullDetail(selectedCoin)
      .then(detail => { 
        if (isMounted) {
          setCoinDetail(detail);
          console.log(`✅ ${selectedCoin} 상세 정보 로딩 완료`);
        }
      })
      .catch(error => { 
        if (isMounted) {
          console.error(`❌ ${selectedCoin} 상세 정보 로딩 실패:`, error);
          setCoinDetail(null);
        }
      });
    
    return () => { isMounted = false; };
  }, [selectedCoin]);

  // WebSocket 연결
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/realtime');
    
    ws.onopen = () => {
      setWsConnected(true);
      setConnectionStatus("실시간 연결됨");
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker' && data.content) {
          const { symbol, closePrice, chgRate, chgAmt } = data.content;
          if (symbol && closePrice) {
            setRealTimeData(prev => ({
              ...prev,
              [symbol]: {
                closePrice: parseFloat(closePrice),
                chgRate: parseFloat(chgRate),
                chgAmt: parseFloat(chgAmt),
                priceDirection: 'same'
              }
            }));
          }
        }
      } catch (e) {
        console.error('WebSocket 메시지 파싱 오류:', e);
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
      setConnectionStatus("연결 끊어짐");
    };

    return () => ws.close();
  }, []);

  // 거래내역 로딩
  useEffect(() => {
    if (orderTab !== "거래내역" || !user_id || !asset_id) return;

    if (historyTab === "체결") {
      axios.get(`${TRADE_API}/asset_concluded_orders`, {
        params: { user_id, asset_id }
      }).then(({ data }) => setConcluded_orders(normalizeOrders(data)))
      .catch(console.error);
    } else {
      axios.get(`${TRADE_API}/asset_unconcluded_orders`, {
        params: { user_id, asset_id }
      }).then(({ data }) => setUnconcluded_orders(normalizeOrders(data)))
      .catch(console.error);
    }
  }, [orderTab, historyTab, user_id, asset_id]);

  // ✅ useMemo들
  const filteredCoinList = useMemo(() => {
    if (!searchTerm) return coinList;
    const term = searchTerm.toLowerCase();
    return coinList.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.symbol.toLowerCase().includes(term)
    );
  }, [coinList, searchTerm]);

  const currentPriceKRW = useMemo(() => {
    const rt = realTimeData[selectedCoin + "_KRW"];
    return rt?.closePrice ? parseInt(rt.closePrice) : 0;
  }, [selectedCoin, realTimeData]);

  const totalAmountKRW = useMemo(() => 
    Math.floor((orderPrice || 0) * (orderQty || 0)), 
    [orderPrice, orderQty]
  );

  // 현재가 동기화
  useEffect(() => {
    if (currentPriceKRW > 0) {
      setOrderPrice(currentPriceKRW);
    }
  }, [currentPriceKRW, selectedCoin]);

  // ✅ 렌더링
  return (
    <div className="w-full p-0 space-y-4">
      {/* 연결 상태 */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4">
        <span className={`text-xs font-semibold ${wsConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {wsConnected ? '🟢 거래소 실시간 연결됨' : '🔴 연결 끊어짐'}
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          코인: {coinList.length}개 | {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="flex flex-row gap-4" style={{ height: 'calc(100vh - 100px)' }}>
                 {/* 탭 + 코인목록 */}
         <div className="flex flex-row">
           <div className="flex flex-col py-4 px-2 gap-2 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
             <button
               className={`w-16 py-2 rounded text-xs font-bold ${view === 'chart' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
               onClick={() => setView('chart')}
             >차트</button>
             <button
               className={`w-16 py-2 rounded text-xs font-bold ${view === 'info' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
               onClick={() => setView('info')}
             >정보</button>
           </div>

          <div className="w-[420px]">
            <CoinListPanel
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortKey={sortKey}
              sortOrder={sortOrder}
              handleSort={handleSort}
              coinListLoading={coinListLoading}
              filteredCoinList={filteredCoinList}
              selectedCoin={selectedCoin}
              setSelectedCoin={setSelectedCoin}
              realTimeData={realTimeData}
              highlighted={highlighted}
              fetchAssetId={fetchAssetId}
              setAsset_id={setAsset_id}
              activeTab="KRW"
              combinedHeight={combinedHeight}
            />
          </div>
        </div>

        {/* 메인 영역 */}
        <div className="flex flex-col gap-4 flex-1" ref={mainPanelRef}>
          <div className="w-full" style={{ height: combinedHeight }}>
            {view === "chart" ? (
              <TradingChart
                symbol={`${selectedCoin}/KRW`}
                height={combinedHeight}
                theme="light"
                currentPrice={currentPriceKRW}
              />
            ) : (
              <Tradingcoininfo 
                coin={coinList.find(c => c.symbol === selectedCoin) || {}}
                coinDetail={coinDetail}
                realTimeData={realTimeData[selectedCoin + '_KRW']}
                getKoreanName={getKoreanName}
                market='KRW'
              />
            )}
          </div>

          {view === "chart" && (
            <TradingOrderPanel
              orderTab={orderTab}
              setOrderTab={setOrderTab}
              orderPrice={orderPrice}
              setOrderPrice={setOrderPrice}
              orderQty={orderQty}
              setOrderQty={setOrderQty}
              currentPriceKRW={currentPriceKRW}
              formatKRW={formatKRW}
              totalAmountKRW={totalAmountKRW}
              handleBuy={handleBuy}
              handleSell={handleSell}
              historyTab={historyTab}
              setHistoryTab={setHistoryTab}
              unconcluded_orders={unconcluded_orders}
              concluded_orders={concluded_orders}
              orderbook={orderbook}
              marketInfo={marketInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// --- 실제 API 함수 예시 (임시 폴백)
export async function fetchCoinList() {
  try {
    const response = await fetch("http://localhost:8000/api/coins");
    const data = await response.json();
    if (data.status === 'success' && Array.isArray(data.data)) {
      return data.data.map(coin => ({
        symbol: coin.symbol,
        name: coin.korean_name || coin.english_name || coin.symbol,
        price: coin.current_price || 0,
        change: coin.change_rate || 0,
        changeAmount: coin.change_amount || 0,
        volume: coin.volume || 0,
        trend: (coin.change_rate || 0) > 0 ? 'up' : 'down',
        market_warning: coin.market_warning || 'NONE',
      }));
    }
    // API 실패 시 빈 배열 반환 (폴백 없음)
    return [];
  } catch (error) {
    console.error('❌ 코인 목록 조회 실패:', error);
    // API 실패 시 빈 배열 반환 (폴백 없음)
    return [];
  }
}

export async function fetchCoinFullDetail(symbol) {
  try {
    const response = await fetch(`http://localhost:8000/api/coin/${symbol}`);
    const data = await response.json();
    if (data.status === 'success' && data.data) {
      return data.data;
    }
    // API 실패 시 빈 객체 반환 (폴백 없음)
    return {};
  } catch (error) {
    console.error('❌ 코인 상세 조회 실패:', error);
    // API 실패 시 빈 객체 반환 (폴백 없음)
    return {};
  }
}

export default TradingInterface;