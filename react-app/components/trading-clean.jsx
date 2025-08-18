"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, Search, Star, Settings, AlignCenter } from "lucide-react"
import { toast } from "sonner"
import TradingChart from "@/components/trading-chart"
import { CurrencyToggle } from "@/components/currency-toggle"

// 임시 코인 정보 패널 컴포넌트
const CoinInfoPanel = ({ coin }) => {
  if (!coin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
        <h2 className="text-xl font-bold mb-2">코인을 선택해주세요</h2>
        <p>코인 목록에서 코인을 선택하면 상세 정보가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
      <h2 className="text-xl font-bold mb-2">{coin.name} ({coin.symbol}) 정보</h2>
      <p>여기에 코인 상세 정보, 백서, 시가총액, 유통량 등 표시</p>
      <p className="mt-4 text-xs text-gray-400">(실제 정보 패널로 교체 가능)</p>
    </div>
  );
};


export const TradingInterface = () => {
  // Responsive height: Coin list matches main chart+order book+order panel area (red box)
  const mainPanelRef = useRef(null);
  const [combinedHeight, setCombinedHeight] = useState(600);
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

  // State hooks for UI controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [activeTab, setActiveTab] = useState("원화");
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("연결 중...");
  // WebSocket 통계 상태
  const [wsStats, setWsStats] = useState({
    total_symbols: 0,
    active_subscriptions: 0,
    last_update: null
  });

  // Docker Compose 환경에서는 항상 host.docker.internal 사용
  const getBackendUrl = (path = '') => {
    return `http://host.docker.internal:8000${path}`;
  };

  // 빗썸 WebSocket 연결 (실시간 데이터 진단 로그 포함)
  useEffect(() => {
    console.log('🚀 빗썸 실시간 데이터 연결 시작...');
    let ws;
    let reconnectTimeout;
    let heartbeatInterval;

    const connectWebSocket = () => {
      // ✅ 올바른 경로로 수정
      const wsUrl = 'ws://localhost:8000/ws/realtime';  // main.py의 경로
      console.log(`🔌 연결 시도: ${wsUrl}`);

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setWsConnected(true);
          setConnectionStatus("빗썸 실시간 연결됨");
          console.log('✅ 빗썸 실시간 WebSocket 연결 성공');
          
          // 하트비트 시작 (30초마다)
          heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial_coins') {
              console.log('📋 초기 코인 목록 수신:', data.data?.length || 0);
              return;
            }

            if (data.type === 'ticker' && data.content) {
              const content = data.content;
              const symbol = content.symbol;
              
              if (!symbol) return;

              const closePrice = parseFloat(content.closePrice);
              const chgRate = parseFloat(content.chgRate);
              
              if (isNaN(closePrice)) return;

              // ✅ 실시간 데이터 업데이트
              setRealTimeData(prev => {
                const prevData = prev[symbol];
                const prevPrice = prevData ? parseFloat(prevData.closePrice) : closePrice;
                
                // 가격 변화 방향 계산
                const priceDirection = closePrice > prevPrice ? 'up' : 
                                     closePrice < prevPrice ? 'down' : 'same';

                const newData = {
                  ...prev,
                  [symbol]: {
                    symbol: symbol,
                    closePrice: closePrice,
                    openPrice: parseFloat(content.openPrice) || closePrice,
                    maxPrice: parseFloat(content.maxPrice) || closePrice,
                    minPrice: parseFloat(content.minPrice) || closePrice,
                    chgRate: chgRate,
                    chgAmt: parseFloat(content.chgAmt) || 0,
                    unitsTraded: parseFloat(content.unitsTraded) || 0,
                    value: parseFloat(content.value) || 0,
                    timestamp: content.timestamp || Date.now(),
                    priceDirection: priceDirection,
                    lastUpdate: Date.now()
                  }
                };

                // 로그 출력 (5번에 한 번만)
                if (Math.random() < 0.2) {
                  // console.log(`💰 ${symbol} 실시간:`, {
                  //   price: closePrice.toLocaleString(),
                  //   change: chgRate.toFixed(2) + '%',
                  //   direction: priceDirection
                  // });
                }

                return newData;
              });

                // 시각적 피드백 트리거 (함수 미정의로 인한 오류 방지)
                // triggerPriceFlash(symbol, chgRate > 0 ? 'up' : 'down');
            }
          } catch (e) {
            console.error('❌ 실시간 데이터 파싱 오류:', e);
          }
        };

        ws.onclose = (event) => {
          setWsConnected(false);
          setConnectionStatus("연결 끊어짐");
          console.log('❌ WebSocket 연결 종료:', event.code, event.reason);
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          
          // 3초 후 재연결 시도
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 WebSocket 재연결 시도...');
            setConnectionStatus("재연결 중...");
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket 오류:', error);
          setWsConnected(false);
          setConnectionStatus("연결 오류");
        };

      } catch (error) {
        console.error('❌ WebSocket 생성 오류:', error);
        setWsConnected(false);
        setConnectionStatus("연결 실패");
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
      // 오류 로그 제거 (선택사항)
    }
  };
    if (wsConnected) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // 30초마다 업데이트
      return () => clearInterval(interval);
    }
  }, [wsConnected]);
  
  

    // 실제 API에서 코인 목록 가져오기 (FastAPI)
    const [coinList, setCoinList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    // trading-clean.jsx의 fetchCoins 함수 개선
    useEffect(() => {
        const fetchCoins = async () => {
          try {
            setLoading(true);
            setFetchError("");
            console.log('🔄 빗썸 코인 목록 요청...');
            
            // ✅ 추가: 타임아웃과 재시도 로직
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
            
            // 환경에 따라 API 주소 자동 결정
            const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              ? 'http://localhost:8000/api/coins'
              : 'http://host.docker.internal:8000/api/coins';
              
            console.log(`🌐 API 요청 URL: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 API 응답 데이터:', {
              status: data.status,
              totalCount: data.total_count,
              firstCoin: data.data?.[0]
            });
            
            if (data.status === 'success' && data.data && Array.isArray(data.data)) {
              console.log(`✅ ${data.total_count}개 코인 로드 성공`);
              setCoinList(data.data.map(coin => ({
                symbol: coin.symbol,
                name: coin.korean_name || coin.symbol,
                englishName: coin.english_name || coin.symbol,
                price: coin.current_price || 0,
                change: coin.change_rate || 0,
                changeAmount: coin.change_amount || 0,
                volume: (coin.volume / 1000000).toFixed(0),
                trend: (coin.change_rate || 0) > 0 ? 'up' : 'down',
                marketWarning: coin.market_warning || 'NONE'
              })));
            } else {
              console.error('❌ 빗썸 데이터 형식 오류:', data);
              throw new Error('API 응답 데이터 형식 오류');
            }
          } catch (e) {
            console.error('❌ 빗썸 코인 목록 조회 실패:', e);
            setFetchError(e.message);
            
            // ✅ 폴백 데이터도 더 많이 제공
            setCoinList([
              { symbol: "BTC", name: "비트코인", price: 95000000, change: 0.37, changeAmount: 350000, volume: "200000", trend: "up" },
              { symbol: "ETH", name: "이더리움", price: 4200000, change: 0.59, changeAmount: 25000, volume: "150000", trend: "up" },
              { symbol: "XRP", name: "리플", price: 2800, change: 0.32, changeAmount: 9, volume: "100000", trend: "up" },
              { symbol: "ADA", name: "에이다", price: 1250, change: -1.2, changeAmount: -15, volume: "80000", trend: "down" },
              { symbol: "SOL", name: "솔라나", price: 245000, change: 2.1, changeAmount: 5000, volume: "70000", trend: "up" },
              { symbol: "DOT", name: "폴카닷", price: 8500, change: 1.5, changeAmount: 125, volume: "60000", trend: "up" },
              { symbol: "LINK", name: "체인링크", price: 34800, change: 3.42, changeAmount: 1150, volume: "75627", trend: "up" },
              { symbol: "LTC", name: "라이트코인", price: 160000, change: -0.8, changeAmount: -1300, volume: "45000", trend: "down" }
            ]);
          } finally {
            setLoading(false);
          }
        };
        fetchCoins();
      }, []);
  //   useEffect(() => {
  //   const fetchCoins = async () => {
  //     try {
  //       setLoading(true);
  //       setFetchError("");
  //       console.log('🔄 빗썸 코인 목록 요청...');
  //       // 환경에 따라 API 주소 자동 결정
  //       const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  //         ? 'http://localhost:8000/api/coins'
  //         : 'http://host.docker.internal:8000/api/coins';
  //       const response = await fetch(apiUrl);
  //       const data = await response.json();
  //       if (data.status === 'success' && data.data && Array.isArray(data.data)) {
  //         console.log(`✅ ${data.total_count}개 코인 로드 성공`);
  //         setCoinList(data.data.map(coin => ({
  //           symbol: coin.symbol,
  //           name: coin.korean_name || coin.symbol,
  //           englishName: coin.english_name || coin.symbol,
  //           price: coin.current_price || 0,
  //           change: coin.change_rate || 0,
  //           changeAmount: coin.change_amount || 0,
  //           volume: (coin.volume / 1000000).toFixed(0),
  //           trend: (coin.change_rate || 0) > 0 ? 'up' : 'down',
  //           marketWarning: coin.market_warning || 'NONE'
  //         })));
  //       } else {
  //         console.error('❌ 빗썸 데이터 형식 오류:', data);
  //         setFetchError('데이터 형식 오류');
  //         setCoinList([
  //           { symbol: "BTC", name: "비트코인", price: 95000000, change: 0.37, changeAmount: 350000, volume: "200000", trend: "up" },
  //           { symbol: "ETH", name: "이더리움", price: 4200000, change: 0.59, changeAmount: 25000, volume: "150000", trend: "up" },
  //           { symbol: "XRP", name: "리플", price: 2800, change: 0.32, changeAmount: 9, volume: "100000", trend: "up" },
  //           { symbol: "ADA", name: "에이다", price: 1250, change: -1.2, changeAmount: -15, volume: "80000", trend: "down" },
  //           { symbol: "SOL", name: "솔라나", price: 245000, change: 2.1, changeAmount: 5000, volume: "70000", trend: "up" }
  //         ]);
  //       }
  //     } catch (e) {
  //       console.error('❌ 빗썸 코인 목록 조회 실패:', e);
  //       setFetchError('네트워크 오류');
  //       setCoinList([
  //         { symbol: "BTC", name: "비트코인", price: 95000000, change: 0.37, changeAmount: 350000, volume: "200000", trend: "up" },
  //         { symbol: "ETH", name: "이더리움", price: 4200000, change: 0.59, changeAmount: 25000, volume: "150000", trend: "up" },
  //         { symbol: "XRP", name: "리플", price: 2800, change: 0.32, changeAmount: 9, volume: "100000", trend: "up" },
  //         { symbol: "ADA", name: "에이다", price: 1250, change: -1.2, changeAmount: -15, volume: "80000", trend: "down" },
  //         { symbol: "SOL", name: "솔라나", price: 245000, change: 2.1, changeAmount: 5000, volume: "70000", trend: "up" }
  //       ]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchCoins();
  // }, []);

  // 실시간 데이터 업데이트 부분 useMemo로 최적화
  const updatedCoinList = useMemo(() => {
    return coinList.map(coin => {
      const realtimeInfo = realTimeData[coin.symbol + '_KRW'];

      if (realtimeInfo) {
        return {
          ...coin,
          name: coin.name,
          price: parseInt(realtimeInfo.closePrice),
          change: parseFloat(realtimeInfo.chgRate),
          changeAmount: parseInt(realtimeInfo.chgAmt),
          trend: parseFloat(realtimeInfo.chgRate) > 0 ? 'up' : 'down',
          volume: Number((parseFloat(realtimeInfo.value) / 1000000).toFixed(0)).toLocaleString() + '백만'
        };
      }
      return {
        ...coin,
        name: coin.korean_name,
  volume: typeof coin.volume === 'string' ? coin.volume : Number((coin.volume / 1000000).toFixed(0)).toLocaleString() + '백만'
      };
    });
  }, [coinList, realTimeData]);
  // 시세/코인정보 탭 상태
  const [view, setView] = useState("chart");

  return (
    <div className="w-full p-0 space-y-4">
    {/* 🚨 연결 상태 표시 추가 */}
      {/* <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
            {wsConnected ? '🟢 거래소 실시간 연결됨' : '🔴 연결 끊어짐'}
          </span>
          <span className="text-xs text-gray-500">
            구독: {wsStats.active_subscriptions || 0}개 | 
            실시간: {Object.keys(realTimeData).length}개 | 
            총 코인: {coinList.length}개
          </span>
        </div>
        <div className="text-sm text-gray-500">
          마지막 업데이트: {new Date().toLocaleTimeString()}
        </div>
      </div> */}

      {/* <div className="flex flex-row gap-4 min-h-screen items-stretch" style={{ height: 'calc(100vh - 100px)' }}> */}
        {/* 좌측: 세로 인덱스 탭 + Coin List */}
        <div className="flex flex-row min-h-0" style={{ height: combinedHeight }}>
          {/* 세로 인덱스 탭 */}
          <div className="flex flex-col items-center py-4 px-2 gap-2 bg-gray-50 border-r border-gray-200" style={{ height: 100 }}>
            <button
              className={`w-16 py-2 rounded text-xs font-bold ${view === 'chart' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-500'}`}
              onClick={() => setView('chart')}
            >차트</button>
            <button
              className={`w-16 py-2 rounded text-xs font-bold ${view === 'info' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-500'}`}
              onClick={() => setView('info')}
            >코인정보</button>
          </div>
          {/* 코인목록 */}
          <div className="flex flex-col w-[420px] max-w-[90vw] min-h-0" style={{ height: 600 }}>
            <Card className="flex flex-col" style={{ height: 1000 }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="코인명/심볼검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 flex-1 border rounded px-2"
                  />
                  {/* 설정(톱니바퀴) 아이콘 및 드롭다운 */}
                  <div className="relative">
                    <button className="p-1" onClick={() => setShowSettings((v) => !v)}>
                      <Settings className="w-5 h-5" />
                    </button>
                    {showSettings && (
                      <div className="absolute right-0 z-50 mt-2 w-56 bg-white border rounded shadow-lg p-3">
                        <div className="flex items-center mb-2">
                          <input type="checkbox" id="showChangeRank" className="mr-2" defaultChecked />
                          <label htmlFor="showChangeRank" className="text-xs">전일 대비 등락 가격 표시<br/>(KRW 마켓만 적용)</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="showKRWVolume" className="mr-2" defaultChecked />
                          <label htmlFor="showKRWVolume" className="text-xs">거래대금 KRW 환산 가격 표시<br/>(BTC, USDT 마켓만 적용)</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" style={{ textAlign: 'center' }}>
                  <TabsList className="grid w-full grid-cols-5 h-8">
                    <TabsTrigger value="원화" className="text-xs">원화</TabsTrigger>
                    <TabsTrigger value="BTC" className="text-xs">BTC</TabsTrigger>
                    <TabsTrigger value="USDT" className="text-xs">USDT</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0" style={{ height: 600 }}>
              {/* 컬럼 헤더 */}
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-1 cursor-pointer">한글명 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">현재가 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">전일대비 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">거래대금 <span className="text-[10px]">▼</span></div>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0" style={{ height: combinedHeight  }}>
                {loading ? (
                  <div className="p-4 text-center text-gray-500">로딩 중...</div>
                ) : updatedCoinList.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">코인 목록이 없습니다.</div>
                ) : (
                  updatedCoinList.map((coin, index) => (
                    <div
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin.symbol)}
                      className={`grid grid-cols-4 gap-1 p-2 text-xs cursor-pointer border-b items-center
                        ${selectedCoin === coin.symbol ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      {/* 한글명/심볼/관심 */}
                      <div className="flex items-center gap-1">
                        {/* <Star className="h-3 w-3 text-muted-foreground mr-1" /> */}
                        <div>
                          <div
                            className={`font-semibold text-xs ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                          >
                            {coin.name}
                            {/* 🚨 실시간 표시 추가 */}
                            {realTimeData[coin.symbol + '_KRW'] && (
                              <span className="ml-1 text-green-500 text-[8px]">●</span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-[11px]">{coin.symbol}/KRW</div>
                        </div>
                      </div>
                      {/* 현재가 */}
                      <div
                        className={`text-right font-mono font-semibold text-base ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                      >
                        {coin.price.toLocaleString()}
                      </div>
                      {/* 전일대비 */}
                      <div className={`text-right font-semibold ${coin.trend === 'up' ? 'text-red-600' : 'text-blue-600'}`}>
                        <div>{coin.trend === 'up' ? '+' : ''}{coin.change.toFixed(2)}%</div>
                        <div className="text-xs">
                          {coin.changeAmount > 0 ? '+' : ''}
                          {coin.changeAmount.toLocaleString()}
                        </div>
                      </div>
                      {/* 거래대금 */}
                      <div
                        className={`text-right text-xs ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                      >
                        {coin.volume}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 우측: Chart + Order Book + Trading Form (New Layout) */}
          <div className="flex flex-col min-h-0 gap-4 h-full flex-1" ref={mainPanelRef}>
          {/* 차트 or 코인정보 */}
          <div className="w-full" style={{ height: combinedHeight }}>
            {view === "chart" ? (
              <TradingChart
                symbol={`${selectedCoin}/KRW`}
                koreanName={updatedCoinList.find(c => c.symbol === selectedCoin)?.name || selectedCoin} // ✅ 이거 추가
                height={combinedHeight}
                theme="light"
                realTimeData={realTimeData[selectedCoin + '_KRW']}
                currentPrice={realTimeData[selectedCoin + '_KRW']?.closePrice
                  ? parseInt(realTimeData[selectedCoin + '_KRW'].closePrice)
                  : updatedCoinList.find(c => c.symbol === selectedCoin)?.price || 163172000
                }
              />
            ) : (
              <CoinInfoPanel coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]} />
            )}
          </div>

          {/* 하단: 오더북/체결강도/정보패널/주문 (이미지와 동일하게 4단 배치) */}
          <div className="w-full flex flex-row" style={{ height: 600 }}>
            {/* 오더북 (매수/매도) */}
            <div className="flex flex-col w-[230px] border-r border-gray-200 bg-blue-50">
              {/* 상단 매도호가 */}
              <div className="flex-1 flex flex-col-reverse overflow-hidden">
                {[
                  { qty: '0.025', price: '163,209,000', change: '+0.06%' },
                  { qty: '0.045', price: '163,200,000', change: '+0.05%' },
                  { qty: '0.038', price: '163,175,000', change: '+0.03%' },
                  { qty: '0.025', price: '163,172,000', change: '+0.03%' },
                  { qty: '0.028', price: '163,171,000', change: '+0.03%' },
                  { qty: '0.723', price: '163,170,000', change: '+0.03%' },
                  { qty: '0.919', price: '163,169,000', change: '+0.03%' },
                  { qty: '0.018', price: '163,168,000', change: '+0.03%' },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-3 text-xs h-6 items-center hover:bg-blue-100">
                    <div className="text-blue-700 text-left pl-2 font-mono">{row.qty}</div>
                    <div className="text-center font-bold font-mono">{row.price}</div>
                    <div className="text-right pr-2 font-mono text-red-500">{row.change}</div>
                  </div>
                ))}
              </div>
              {/* 체결강도 */}
              <div className="bg-white border-y border-gray-200 py-1 px-2 text-xs text-center">
                {/* <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-semibold">체결강도</span>
                  <span className="text-red-600 font-bold">+169.59%</span>
                </div> */}
                <div className="flex justify-between items-center mt-1">
                  <span className="font-bold text-base text-red-600">163,166,000</span>
                  <span className="text-red-500 font-semibold">+0.03%</span>
                </div>
              </div>
              {/* 하단 매수호가 */}
              <div className="flex-1 overflow-hidden">
                {[
                  { qty: '0.019', price: '163,165,000', change: '+0.03%' },
                  { qty: '0.101', price: '163,149,000', change: '+0.02%' },
                  { qty: '0.000', price: '163,147,000', change: '+0.02%' },
                  { qty: '0.009', price: '163,140,000', change: '+0.01%' },
                  { qty: '0.001', price: '163,123,000', change: '+0.01%' },
                ].map((row, i) => (
                  <div key={i} className="flex flex-row text-xs h-6 items-center hover:bg-blue-100">
                    {/* <div className="flex-1 text-blue-700 text-right pr-2 font-mono">{row.qty}</div> */}
                    <div className="flex-1 text-center font-semibold font-mono">{row.price}</div>
                    <div className="flex-1 text-right pr-2 text-red-500">{row.change}</div>
                  </div>
                ))}
              </div>
              {/* 하단 수량 */}
              <div className="flex justify-between items-center bg-white border-t border-gray-200 px-2 py-1 text-xs">
                <span className="font-semibold">3.370</span>
                <span className="text-gray-500">수량(BTC)</span>
                <span className="font-semibold">2.049</span>
              </div>
            </div>
            {/* 정보 패널 */}
            <div className="flex flex-col w-[220px] bg-white border-r border-gray-200 px-3 py-2 text-xs justify-between">
              <div>
                <div className="mb-2">
                  <span className="font-semibold">거래량</span>
                  <span className="float-right">1,233 BTC</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">거래대금</span>
                  <span className="float-right">200,963 백만원</span>
                  <div className="text-[10px] text-gray-400">(최근24시간)</div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">52주 최고</span>
                  <span className="float-right">166,800,000</span>
                  <div className="text-[10px] text-gray-400">(2025.07.14)</div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">52주 최저</span>
                  <span className="float-right">72,100,000</span>
                  <div className="text-[10px] text-gray-400">(2024.08.05)</div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">전일종가</span>
                  <span className="float-right">163,118,000</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">당일고가</span>
                  <span className="float-right text-red-500">163,627,000</span>
                  <div className="text-[10px] text-red-400 float-right">+0.31%</div>
                </div>
                <div>
                  <span className="font-semibold">당일저가</span>
                  <span className="float-right text-blue-500">162,916,000</span>
                  <div className="text-[10px] text-blue-400 float-right">-0.12%</div>
                </div>
              </div>
            </div>
            {/* 주문 영역 */}
            <div className="flex-1 flex flex-col bg-white px-6 py-4">
              {/* 탭 */}
              <div className="flex border-b border-gray-200 mb-4">
                <button className="flex-1 py-2 text-sm text-gray-500">매수</button>
                <button className="flex-1 py-2 text-sm border-b-2 border-blue-500 text-blue-500 font-semibold">매도</button>
                <button className="flex-1 py-2 text-sm text-gray-500">간편주문</button>
                <button className="flex-1 py-2 text-sm text-gray-500">거래내역</button>
              </div>
              {/* 주문유형 라디오 */}
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs font-semibold">주문유형</span>
                <label className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <input type="radio" name="orderType" defaultChecked className="accent-blue-500" /> 지정가
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input type="radio" name="orderType" className="accent-blue-500" /> 시장가
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input type="radio" name="orderType" className="accent-blue-500" /> 예약지정가
                </label>
                <span className="ml-auto text-xs text-gray-400">0 BTC<br />~ 0 KRW</span>
              </div>
              {/* 주문가능 */}
              <div className="text-xs text-gray-400 mb-2">주문가능</div>
              {/* 입력폼 */}
              <div className="mb-2">
                <div className="text-xs font-semibold mb-1">매도가격 (KRW)</div>
                <div className="flex items-center border rounded h-10">
                  <input type="text" value="163,257,000" readOnly className="flex-1 px-2 border-0 bg-transparent text-right font-semibold" />
                  <button className="w-8 h-8 text-gray-400">-</button>
                  <button className="w-8 h-8 text-gray-400">+</button>
                </div>
              </div>
              <div className="mb-2">
                <div className="text-xs font-semibold mb-1">주문수량 (BTC)</div>
                <input type="text" placeholder="0" className="w-full border rounded h-10 px-2 mb-2" />
                <div className="flex gap-2">
                  <button className="flex-1 border rounded py-1 text-xs">10%</button>
                  <button className="flex-1 border rounded py-1 text-xs">25%</button>
                  <button className="flex-1 border rounded py-1 text-xs">50%</button>
                  <button className="flex-1 border rounded py-1 text-xs">100%</button>
                  <button className="flex-1 border rounded py-1 text-xs">직접입력</button>
                </div>
              </div>
              <div className="mb-2">
                <div className="text-xs font-semibold mb-1">주문총액 (KRW)</div>
                <input type="text" placeholder="0" className="w-full border rounded h-10 px-2" />
              </div>
              <div className="text-[11px] text-gray-400 mt-2">* 최소주문금액 : KRW · 수수료(부가세 포함) : -%</div>
            </div>
          </div>
        </div>
      </div>
  </div>
  );
}

export default TradingInterface;