"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, TrendingDown, Search, Star, Settings } from "lucide-react"
import { toast } from "sonner"
import { TradingChart } from "@/components/trading-chart"
import { CurrencyToggle } from "@/components/currency-toggle"

// 임시 코인 정보 패널 컴포넌트
const CoinInfoPanel = ({ coin }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
    <h2 className="text-xl font-bold mb-2">{coin.name} ({coin.symbol}) 정보</h2>
    <p>여기에 코인 상세 정보, 백서, 시가총액, 유통량 등 표시</p>
    <p className="mt-4 text-xs text-gray-400">(실제 정보 패널로 교체 가능)</p>
  </div>
);


export const TradingInterface = () => {
  // State hooks for UI controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [activeTab, setActiveTab] = useState("원화");
  const [showSettings, setShowSettings] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  // WebSocket 통계 상태
  const [wsStats, setWsStats] = useState({
    total_symbols: 0,
    active_subscriptions: 0,
    last_update: null
  });

  // 빗썸 WebSocket 연결
  useEffect(() => {
    console.log('WebSocket 연결 시도...');
    const ws = new WebSocket('ws://localhost:8000/ws/realtime');
    ws.onopen = () => {
      setWsConnected(true);
      console.log('✅ 빗썸 실시간 연결 성공!');
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 실시간 데이터 수신:', data);
        if (data.type === 'ticker' && data.content && data.content.symbol) {
          setRealTimeData(prev => ({
            ...prev,
            [data.content.symbol + '_KRW']: data.content
          }));
        }
      } catch (e) {
        console.error('데이터 파싱 오류:', e);
      }
    };
    ws.onclose = () => {
      setWsConnected(false);
      console.log('❌ WebSocket 연결 종료');
    };
    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };
    return () => {
      console.log('WebSocket 정리 중...');
      ws.close();
    };
  }, []);

  // WebSocket 통계 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/websocket/stats');
        const data = await response.json();
        setWsStats(data.subscription_stats || {});
      } catch (error) {
        console.error('통계 조회 오류:', error);
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

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/coins');
        const data = await response.json();
        if (data.status === 'success') {
          // API 구조에 맞게 변환
          setCoinList(data.data.map(coin => ({
            symbol: coin.symbol,
            name: coin.korean_name,
            price: coin.current_price,
            change: coin.change_rate,
            changeAmount: coin.change_amount,
            volume: coin.volume,
            trend: coin.change_rate > 0 ? 'up' : 'down'
          })));
        } else {
          setCoinList([]);
        }
      } catch (e) {
        setCoinList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoins();
  }, []);

  // 실시간 데이터로 코인 목록 업데이트
  const getUpdatedCoinList = () => {
    return coinList.map(coin => {
      const realtimeInfo = realTimeData[coin.symbol + '_KRW'];
      if (realtimeInfo) {
        console.log(`${coin.symbol} 실시간 업데이트:`, realtimeInfo);
        return {
          ...coin,
          price: parseInt(realtimeInfo.closePrice),
          change: parseFloat(realtimeInfo.chgRate),
          changeAmount: parseInt(realtimeInfo.chgAmt),
          trend: parseFloat(realtimeInfo.chgRate) > 0 ? 'up' : 'down',
          volume: parseFloat(realtimeInfo.value).toFixed(3) // 실시간 거래량
        };
      }
      return coin;
    });
  };

  const updatedCoinList = getUpdatedCoinList();

  // 시세/코인정보 탭 상태
  const [view, setView] = useState("chart");

  return (
    <div className="w-full p-4 space-y-4">
    {/* 🚨 연결 상태 표시 추가 */}
      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className={`font-semibold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
            {wsConnected ? '🟢 빗썸 실시간 연결됨' : '🔴 연결 끊어짐'}
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
      </div>

      <div className="flex flex-row gap-4 min-h-0 items-stretch max-h-100vh">
        {/* 좌측: Coin List */}
        <div className="flex flex-col min-h-0 h-full w-[368px] max-w-[90vw] self-stretch">
          <Card className="flex-1 flex flex-col min-h-0 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-2">
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-8">
                  <TabsTrigger value="원화" className="text-xs">원화</TabsTrigger>
                  <TabsTrigger value="BTC" className="text-xs">BTC</TabsTrigger>
                  <TabsTrigger value="USDT" className="text-xs">USDT</TabsTrigger>
                  <TabsTrigger value="보유" className="text-xs">보유</TabsTrigger>
                  <TabsTrigger value="관심" className="text-xs">관심</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {/* 컬럼 헤더 */}
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-1 cursor-pointer">한글명 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">현재가 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">전일대비 <span className="text-[10px]">▼</span></div>
                <div className="text-right flex items-center gap-1 cursor-pointer">거래대금 <span className="text-[10px]">▼</span></div>
              </div>
              <div className="max-h-[500px] overflow-y-auto flex-1 min-h-0">
                {updatedCoinList.map((coin, index) => (
                  <div
                    key={coin.symbol}
                    onClick={() => setSelectedCoin(coin.symbol)}
                    className={`grid grid-cols-4 gap-1 p-2 text-xs cursor-pointer border-b items-center
                      ${selectedCoin === coin.symbol ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    {/* 한글명/심볼/관심 */}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-muted-foreground mr-1" />
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
                      <div className="text-xs">{coin.changeAmount > 0 ? '+' : ''}{coin.changeAmount}</div>
                    </div>
                    {/* 거래대금 */}
                    <div
                      className={`text-right text-xs ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                    >
                      {coin.volume}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 우측: Chart + Order Book + Trading Form (New Layout) */}
        <div className="flex flex-col min-h-0 gap-4 h-full flex-1">
          {/* 상단: 시세/코인정보 탭 */}
          <div className="flex gap-2 mb-2 mt-2">
            <button
              className={`px-4 py-1 text-xs font-semibold ${view === "chart" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-400"}`}
              onClick={() => setView("chart")}
            >시세</button>
            <button
              className={`px-4 py-1 text-xs font-semibold ${view === "info" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-400"}`}
              onClick={() => setView("info")}
            >코인정보</button>
          </div>
          {/* 차트 or 코인정보 */}
          <div className="min-h-0 w-full">
            <Card className="h-[800px]">
              <CardContent className="p-4 h-full">
                {view === "chart" ? (
                  <>
                    {/* 상단 가격 정보 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">₿</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {updatedCoinList.find(c => c.symbol === selectedCoin)?.name || "비트코인"} {selectedCoin || "BTC"}/KRW
                          </h3>
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-2xl font-bold text-red-600">
                                {/* 🚨 실시간 가격 표시 */}
                                {realTimeData[selectedCoin + '_KRW'] ? 
                                  parseInt(realTimeData[selectedCoin + '_KRW'].closePrice).toLocaleString() : 
                                  '163,172,000'
                                } 
                                <span className="text-sm">KRW</span>
                                {/* 실시간 표시 */}
                                {realTimeData[selectedCoin + '_KRW'] && (
                                  <span className="ml-2 text-xs text-green-500">● LIVE</span>
                                )}                                  
                              </div>
                              <div className="text-sm text-red-600">
                                {/* 🚨 실시간 변동률 표시 */}
                                {realTimeData[selectedCoin + '_KRW'] ? 
                                  `${parseFloat(realTimeData[selectedCoin + '_KRW'].chgRate) > 0 ? '+' : ''}${parseFloat(realTimeData[selectedCoin + '_KRW'].chgRate).toFixed(2)}% ${parseFloat(realTimeData[selectedCoin + '_KRW'].chgAmt) > 0 ? '▲' : '▼'}${Math.abs(parseInt(realTimeData[selectedCoin + '_KRW'].chgAmt)).toLocaleString()}` :
                                  '+0.03% ▲54,000'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">고가</p>
                          <p className="font-semibold text-red-600">
                            {realTimeData[selectedCoin + '_KRW']?.maxPrice
                              ? parseInt(realTimeData[selectedCoin + '_KRW'].maxPrice).toLocaleString()
                              : '163,627,000'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">저가</p>
                          <p className="font-semibold text-blue-600">
                            {realTimeData[selectedCoin + '_KRW']?.minPrice
                              ? parseInt(realTimeData[selectedCoin + '_KRW'].minPrice).toLocaleString()
                              : '162,916,000'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">거래량(24H)</p>
                          <p className="font-semibold">
                            {realTimeData[selectedCoin + '_KRW']?.unitsTraded
                              ? `${parseFloat(realTimeData[selectedCoin + '_KRW'].unitsTraded).toLocaleString()} ${selectedCoin}`
                              : '1,231.795 BTC'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* 차트 영역 */}
                    <div className="h-[670px] w-full">
                      <TradingChart symbol="BTC/KRW" height={400} />
                    </div>
                  </>
                ) : (
                  <CoinInfoPanel coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 하단: 오더북/체결강도/정보패널/주문 (이미지와 동일하게 4단 배치) */}
          <div className="flex flex-row min-h-0 h-[600px] gap-0">
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
  )  
}

export default TradingInterface;
