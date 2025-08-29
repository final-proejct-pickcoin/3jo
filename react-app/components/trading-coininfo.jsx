"use client"
import React, { useState, useEffect } from "react";
import { toast } from "sonner";


const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
const springUrl  = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
const clean = (u) => (u || "").replace(/\/$/, "");

// 전역 캐시 시스템
const coinDataCache = new Map();
const CACHE_DURATION_COIN = 30 * 60 * 1000; // 30분

const getCachedCoinData = (symbol) => {
  const cached = coinDataCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_COIN) {
    return cached.data;
  }
  return null;
};

const setCachedCoinData = (symbol, data) => {
  coinDataCache.set(symbol, {
    data,
    timestamp: Date.now()
  });
};

// CoinCap API 전용 데이터 fetcher
const fetchCoinCapData = async (symbol) => {
 try {
   // 캐시 확인
   const cached = getCachedCoinData(symbol);
   if (cached) {
     console.log(`✅ ${symbol} 캐시된 데이터 사용`);
     return cached;
   }

   console.log(`📊 ${symbol} CoinCap 상세 데이터 요청 중...`);

   const response = await fetch(`${clean(fastapiUrl)}/api/coincap/coin/${symbol}`);
   const result = await response.json();

   if (result.status === 'success') {
     console.log(`✅ ${symbol} CoinCap 데이터 로드 성공`);
     setCachedCoinData(symbol, result.data);
     return result.data;
   } else if (result.fallback_data) {
     console.log(`📦 ${symbol} 폴백 데이터 사용`);
     return result.fallback_data;
   } else {
     console.warn(`⚠️ ${symbol} CoinCap 데이터 없음, 로컬 폴백 사용`);
     return createLocalFallbackData(symbol);
   }

 } catch (error) {
   console.error(`❌ ${symbol} CoinCap 데이터 조회 실패:`, error);
   return createLocalFallbackData(symbol);
 }
};

//  로컬 폴백 데이터 생성
const createLocalFallbackData = (symbol) => {
 const koreanName = get_korean_name(symbol);
 const basePrice = getRealisticPrice(symbol);
 const rank = getEstimatedRank(symbol);
 
 return {
   id: symbol.toLowerCase(),
   name: koreanName,
   symbol: symbol.toUpperCase(),
   description: `${koreanName}은 블록체인 기술을 기반으로 하는 디지털 자산입니다. 글로벌 암호화폐 시장에서 혁신적인 기술과 강력한 커뮤니티를 바탕으로 성장하고 있습니다.`,
   
   market_cap_rank: rank,
   coingecko_score: Math.max(20, 100 - rank / 2),
   developer_score: Math.max(20, 80 - rank / 5),
   community_score: Math.max(20, 90 - rank / 3),
   
   current_price: basePrice,
   market_cap: basePrice * (Math.random() * 10000000 + 1000000),
   total_volume: basePrice * (Math.random() * 100000 + 10000),
   
   total_supply: Math.floor(Math.random() * 1000000000) + 1000000,
   circulating_supply: Math.floor(Math.random() * 800000000) + 800000,
   max_supply: Math.floor(Math.random() * 1000000000) + 1000000000,
   
   price_change_24h: (Math.random() - 0.5) * 20,
   price_change_7d: (Math.random() - 0.5) * 40,
   price_change_30d: (Math.random() - 0.5) * 100,
   price_change_1y: (Math.random() - 0.5) * 500,
   
   high_24h: basePrice * 1.1,
   low_24h: basePrice * 0.9,
   ath: basePrice * (2 + Math.random() * 3),
   ath_date: '2024-03-15T00:00:00.000Z',
   atl: basePrice * (0.1 + Math.random() * 0.4),
   atl_date: '2023-06-20T00:00:00.000Z',
   
   categories: ['cryptocurrency', 'blockchain'],
   hashing_algorithm: 'Advanced Consensus',
   consensus_mechanism: 'Modern Technology',
   
   investment_grade: rank <= 10 ? 'A급' : rank <= 50 ? 'B급' : 'C급',
   risk_level: rank <= 10 ? '낮음' : rank <= 100 ? '보통' : '높음',
   
   homepage: `https://${symbol.toLowerCase()}.org`,
   whitepaper: `https://${symbol.toLowerCase()}.org/whitepaper.pdf`,
   twitter_screen_name: symbol.toLowerCase(),
   repos_url: `https://github.com/${symbol.toLowerCase()}/${symbol.toLowerCase()}`,
   
   facebook_likes: Math.max(1000, 100000 - rank * 100),
   twitter_followers: Math.max(5000, 500000 - rank * 500),
   reddit_subscribers: Math.max(1000, 50000 - rank * 50),
   telegram_channel_user_count: Math.max(500, 25000 - rank * 25),
   
   forks: Math.max(10, 1000 - rank),
   stars: Math.max(50, 5000 - rank * 5),
   subscribers: Math.max(10, 500 - rank),
   total_issues: Math.max(5, 200 - rank / 2),
   closed_issues: Math.max(3, 180 - rank / 2),
   
   use_cases: ['디지털 자산', '블록체인 활용', '투자 수단'],
   volatility_analysis: { level: '보통', percentage: 15, description: '일반적인 변동성을 보입니다.' },
   liquidity_risk: { level: '보통', description: '적절한 유동성을 가지고 있습니다.' },
   market_position_risk: { level: '보통', description: '시장 지위가 안정적입니다.' }
 };
};

// 🎯 한국어 코인명 매핑 함수
const get_korean_name = (symbol) => {
 const korean_names = {
   // 메이저 코인
   "BTC": "비트코인", "ETH": "이더리움", "XRP": "리플", "ADA": "에이다",
   "SOL": "솔라나", "DOGE": "도지코인", "BNB": "바이낸스코인", "TRX": "트론",
   "DOT": "폴카닷", "MATIC": "폴리곤", "AVAX": "아발란체", "SHIB": "시바이누",
   "LTC": "라이트코인", "BCH": "비트코인캐시", "LINK": "체인링크", "UNI": "유니스왚",
   "ATOM": "코스모스", "NEAR": "니어프로토콜", "ALGO": "알고랜드", "VET": "비체인",
   
   // DeFi & 알트코인
   "AAVE": "에이브", "COMP": "컴파운드", "MKR": "메이커", "SNX": "신세틱스",
   "CRV": "커브", "YFI": "연파이낸스", "SUSHI": "스시스왚", "BAL": "밸런서",
   "1INCH": "원인치", "CAKE": "팬케이크스왚",
   
   // 게임 & NFT
   "SAND": "샌드박스", "MANA": "디센트럴랜드", "ENJ": "엔진코인", "CHZ": "칠리즈",
   "FLOW": "플로우", "GALA": "갈라", "AXS": "액시인피니티", "YGG": "일드길드게임즈",
   "IMX": "이뮤터블엑스", "LOOKS": "룩스레어",
   
   // 밈코인
   "PEPE": "페페", "BONK": "봉크", "FLOKI": "플로키이누", "BABY": "베이비도지",
   
   // 한국 코인
   "KLAY": "클레이튼", "WEMIX": "위믹스", "QTCON": "퀴즈톡", "CTC": "크레딧코인",
   "META": "메타디움", "MBL": "무비블록", "TEMCO": "템코", "BORA": "보라",
   
   // Layer 1 & 인프라
   "ICP": "인터넷컴퓨터", "FTM": "팬텀", "THETA": "쎄타토큰", "HBAR": "헤데라",
   "FIL": "파일코인", "EGLD": "멀티버스엑스", "MINA": "미나", "ROSE": "오아시스",

   // 기타 추가
   "WLD": "월드코인"
 };
 return korean_names[symbol] || symbol;
};

// 🎯 현실적인 가격 추정
const getRealisticPrice = (symbol) => {
 const priceMap = {
   'BTC': 160000000, 'ETH': 6000000, 'BNB': 1000000, 'XRP': 4000,
   'ADA': 2000, 'SOL': 400000, 'DOGE': 700, 'AVAX': 80000,
   'DOT': 15000, 'MATIC': 1500, 'LINK': 30000, 'UNI': 20000
 };
 return priceMap[symbol] || (Math.random() * 100000 + 1000);
};

// 🎯 순위 추정
const getEstimatedRank = (symbol) => {
 const rankMap = {
   'BTC': 1, 'ETH': 2, 'BNB': 3, 'XRP': 4, 'ADA': 5,
   'SOL': 6, 'DOGE': 7, 'TRX': 8, 'DOT': 9, 'MATIC': 10,
   'AVAX': 11, 'SHIB': 12, 'LTC': 13, 'BCH': 14, 'LINK': 15
 };
 return rankMap[symbol] || (Math.floor(Math.random() * 500) + 50);
};

// 코인 아이콘 색상
const getCoinIconColor = (symbol) => {
 const colors = {
  'BTC': 'bg-gray-400', 'ETH': 'bg-gray-400', 'XRP': 'bg-gray-400',
  'ADA': 'bg-gray-400', 'SOL': 'bg-gray-400', 'DOGE': 'bg-gray-400',
 };
 return colors[symbol] || 'bg-gray-500';
};

// 🎯 업비트 스타일 CoinInfoPanel 컴포넌트
const CoinInfoPanel = ({ coin, realTimeData, marketCap }) => {
  const [coinDetail, setCoinDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!coin || !coin.symbol) return;
    setLoading(true);
    setCoinDetail(null);

    fetchCoinCapData(coin.symbol)
      .then(setCoinDetail)
      .catch(err => {
        console.error('코인 데이터 로드 실패:', err);
        setCoinDetail(createLocalFallbackData(coin.symbol));
      })
      .finally(() => setLoading(false));
  }, [coin?.symbol]);

  // 한국어 이름 우선순위: 기본 매핑 > 영어명
  const getKoreanName = () => {
    if (coin.name && coin.name !== coin.symbol) return coin.name;
    if (coinDetail?.name) return coinDetail.name;
    return get_korean_name(coin.symbol);
  };

  const getCurrentPrice = () => {
    if (realTimeData && realTimeData.closePrice) {
      return parseInt(realTimeData.closePrice);
    }
    if (coinDetail && coinDetail.current_price) {
      return coinDetail.current_price;
    }
    return coin.price || 0;
  };

  const getCurrentChange = () => {
    if (realTimeData && realTimeData.chgRate) {
      return parseFloat(realTimeData.chgRate);
    }
    if (coinDetail && coinDetail.price_change_24h) {
      return coinDetail.price_change_24h;
    }
    return coin.change || 0;
  };

  // 🎯 업비트 스타일 분석 함수들
  const getInvestmentGrade = () => {
    if (!coinDetail) return { grade: '분석중', color: 'gray', description: '데이터 로딩 중' };
    
    const rank = coinDetail.market_cap_rank;
    const score = coinDetail.coingecko_score || 0;
    
    if (rank <= 5 && score > 80) return { 
      grade: 'S급', 
      color: 'purple', 
      description: '최상급 투자 안정성' 
    };
    if (rank <= 10 && score > 70) return { 
      grade: 'A급', 
      color: 'blue', 
      description: '우수한 투자 대상' 
    };
    if (rank <= 30 && score > 60) return { 
      grade: 'B급', 
      color: 'green', 
      description: '양호한 투자 가능성' 
    };
    if (rank <= 100) return { 
      grade: 'C급', 
      color: 'yellow', 
      description: '신중한 투자 필요' 
    };
    return { 
      grade: 'D급', 
      color: 'red', 
      description: '고위험 투자 대상' 
    };
  };

  const getActivityLevel = () => {
    if (!coinDetail) return '분석중';
    
    const volume24h = coinDetail.total_volume;
    // props로 받은 marketCap을 우선 사용, 없으면 coinDetail에서 가져오기
    const marketCapValue = marketCap && marketCap > 0 ? marketCap : coinDetail.market_cap;
    
    if (!volume24h || !marketCapValue) return '데이터 부족';
    
    const ratio = volume24h / marketCapValue;
    
    if (ratio > 0.1) return '매우 활발';
    if (ratio > 0.05) return '활발';
    if (ratio > 0.02) return '보통';
    if (ratio > 0.01) return '저조';
    return '매우 저조';
  };

  const getDeveloperActivity = () => {
    if (!coinDetail || !coinDetail.developer_score) return '분석중';
    
    const score = coinDetail.developer_score;
    if (score > 80) return '매우 활발';
    if (score > 60) return '활발';
    if (score > 40) return '보통';
    if (score > 20) return '저조';
    return '매우 저조';
  };

  const getCommunityStrength = () => {
    if (!coinDetail) return '분석중';
    
    const score = coinDetail.community_score || 0;
    const twitterFollowers = coinDetail.twitter_followers || 0;
    const redditSubscribers = coinDetail.reddit_subscribers || 0;
    
    const totalCommunity = twitterFollowers + redditSubscribers;
    
    if (score > 80 && totalCommunity > 100000) return '매우 강함';
    if (score > 60 && totalCommunity > 50000) return '강함';
    if (score > 40 && totalCommunity > 10000) return '보통';
    if (score > 20) return '약함';
    return '매우 약함';
  };

  const formatLargeNumber = (num) => {
    if (!num) return '미제공';
    if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(1)}조`;
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}억`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    return num.toLocaleString();
  };

  const formatSupply = (supply) => {
    if (!supply) return '미제공';
    if (supply >= 1000000000) return `${(supply / 1000000000).toFixed(1)}B`;
    if (supply >= 1000000) return `${(supply / 1000000).toFixed(1)}M`;
    if (supply >= 1000) return `${(supply / 1000).toFixed(1)}K`;
    return supply.toLocaleString();
  };

  if (!coin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-3 text-gray-800">코인을 선택해보세요</h2>
          <p className="text-gray-600 leading-relaxed">
            왼쪽에서 관심있는 코인을 클릭하면<br/>
            <span className="font-semibold text-blue-600">전문가급 분석</span>을 제공해드려요
          </p>
        </div>
      </div>
    );
  }

  const investmentGrade = getInvestmentGrade();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto" style={{ height: '1600px' }}>
      {/* 🎯 메인 헤더 - 업비트 스타일 */}
      <div className="bg-white dark:bg-gray-800 m-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-20 h-20 ${getCoinIconColor(coin.symbol)} rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
              {coin.symbol.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getKoreanName()}
              </h1>
                         <div className="flex items-center gap-3 flex-wrap">
             <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">{coin.symbol}/KRW</span>
             {realTimeData && (
               <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full font-medium">
                 ● 실시간 연동
               </span>
             )}
             <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full font-medium">
               글로벌 #{coinDetail?.market_cap_rank ? coinDetail.market_cap_rank : '미제공'}위
             </span>
           </div>
            </div>
          </div>

          {/* 현재 가격 & 투자 등급 */}
          <div className="grid grid-cols-2 gap-6">
                         <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl border border-gray-100 dark:border-gray-600">
               <div className="text-md text-emerald-700 dark:text-emerald-400 font-medium mb-2">현재 가격</div>
               <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                 {getCurrentPrice().toLocaleString()}원
               </div>
               <div className="flex items-center gap-2">
                 <span className={`text-lg font-bold ${getCurrentChange() > 0 ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'}`}>
                   {typeof getCurrentChange() === 'number'
                     ? getCurrentChange().toFixed(2) + '%'
                     : '미제공'}
                 </span>
                 {realTimeData?.chgAmt && (
                   <span className="text-sm text-gray-600 dark:text-gray-400">
                     ({realTimeData.chgAmt > 0 ? '+' : ''}{parseInt(realTimeData.chgAmt).toLocaleString()}원)
                   </span>
                 )}
               </div>
             </div>
            
                         <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl border border-gray-100 dark:border-gray-600">
               <div className={`text-md font-medium mb-2 ${
                 investmentGrade.color === 'purple' ? 'text-purple-700 dark:text-purple-400' :
                 investmentGrade.color === 'blue' ? 'text-blue-700 dark:text-blue-400' :
                 investmentGrade.color === 'green' ? 'text-green-700 dark:text-green-400' :
                 investmentGrade.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-400' :
                 'text-red-700 dark:text-red-400'
               }`}>
                 투자 등급
               </div>
               <div className={`text-3xl font-bold mb-1 ${
                 investmentGrade.color === 'purple' ? 'text-purple-900 dark:text-purple-100' :
                 investmentGrade.color === 'blue' ? 'text-blue-900 dark:text-blue-100' :
                 investmentGrade.color === 'green' ? 'text-green-900 dark:text-green-100' :
                 investmentGrade.color === 'yellow' ? 'text-yellow-900 dark:text-yellow-100' :
                 'text-red-900 dark:text-red-100'
               }`}>
                 {investmentGrade.grade}
               </div>
               <div className={`text-sm ${
                 investmentGrade.color === 'purple' ? 'text-purple-600 dark:text-purple-300' :
                 investmentGrade.color === 'blue' ? 'text-blue-600 dark:text-blue-300' :
                 investmentGrade.color === 'green' ? 'text-green-600 dark:text-green-300' :
                 investmentGrade.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-300' :
                 'text-red-600 dark:text-red-300'
               }`}>
                 {investmentGrade.description}
               </div>
             </div>
          </div>
        </div>
      </div>

             {/* 핵심 지표 대시보드 */}
       <div className="bg-white dark:bg-gray-800 m-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
         <div className="p-6">
           <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
             핵심 지표 대시보드
           </h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-600">
               <div className="text-md text-blue-700 dark:text-blue-400 mb-1">시가총액</div>
               <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                 {marketCap && marketCap > 0 ? formatLargeNumber(marketCap) + '원' : 
                   coinDetail?.market_cap ? formatLargeNumber(coinDetail.market_cap) + '원' : '미제공'}
               </span>
             </div>
             <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-600">
               <div className="text-md text-green-700 dark:text-green-400 mb-1">24시간 거래량</div>
               <div className="text-lg font-bold text-green-900 dark:text-green-100">
                 {coinDetail?.total_volume ? formatLargeNumber(coinDetail.total_volume) + '원' : '미제공'}
               </div>
             </div>
             <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-600">
               <div className="text-md text-purple-700 dark:text-purple-400 mb-1">개발 활동</div>
               <div className="text-lg font-bold text-purple-900 dark:text-purple-100">{getDeveloperActivity()}</div>
             </div>
             <div className="bg-white dark:bg-gray-700 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-600">
               <div className="text-md text-orange-700 dark:text-orange-400 mb-1">커뮤니티</div>
               <div className="text-lg font-bold text-orange-900 dark:text-orange-100">{getCommunityStrength()}</div>
             </div>
           </div>
         </div>
       </div>

             {/* 상세 분석 탭 */}
       <div className="bg-white dark:bg-gray-800 m-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
         <div className="flex border-b border-gray-200 dark:border-gray-600">
           {[
             { id: 'overview', label: '개요' },
             { id: 'investment', label: '투자 분석' },
             { id: 'technology', label: '기술 정보' },
             { id: 'risks', label: '위험 분석' }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 p-4 text-center font-medium transition-all duration-200 ${
                 activeTab === tab.id 
                   ? 'text-gray-700 dark:text-gray-100 border-b-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700' 
                   : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               <div className="text-xl mb-1">{tab.icon}</div>
               <div className="text-sm font-semibold">{tab.label}</div>
             </button>
           ))}
         </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 프로젝트 소개 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔍 {getKoreanName()} 프로젝트 소개
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {loading ? "불러오는 중..." : (coinDetail?.description || `${getKoreanName()}은 혁신적인 블록체인 기술을 활용한 디지털 자산 프로젝트입니다.`)}
                </p>
              </div>
           </div>
          )}

          {activeTab === 'investment' && (
            <div className="space-y-6">
              {/* 투자 요약 카드 */}
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 투자 요약 분석</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-900">{investmentGrade.grade}</div>
                    <div className="text-sm text-emerald-700">투자 등급</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-900">
                      #{coinDetail?.market_cap_rank || '?'}
                    </div>
                    <div className="text-sm text-emerald-700">시총 순위</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-900">{getActivityLevel()}</div>
                    <div className="text-sm text-emerald-700">거래 활성도</div>
                  </div>
                </div>
              </div>
        
              {/* 상세 가격 분석 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900">💰 가격 정보</h4>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">24시간 최고가</span>
                      <span className="text-lg font-bold text-red-900">
                        {coinDetail?.high_24h ? coinDetail.high_24h.toLocaleString() : getCurrentPrice().toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">24시간 최저가</span>
                      <span className="text-lg font-bold text-blue-900">
                        {coinDetail?.low_24h ? coinDetail.low_24h.toLocaleString() : getCurrentPrice().toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {coinDetail?.ath && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-700 font-medium">역대 최고가</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-900">
                            {coinDetail.ath.toLocaleString()}원
                          </div>
                          <div className="text-xs text-yellow-600">
                            {new Date(coinDetail.ath_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-gray-900">📊 시장 지표</h4>
                  
                    <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">시가총액</span>
                      <span className="text-lg font-bold text-purple-900">
                        {marketCap && marketCap > 0 ? formatLargeNumber(marketCap) + '원' : 
                         coinDetail?.market_cap ? formatLargeNumber(coinDetail.market_cap) + '원' : '미제공'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">24시간 거래량</span>
                      <span className="text-lg font-bold text-green-900">
                        {coinDetail?.total_volume ? formatLargeNumber(coinDetail.total_volume) + '원' : '미제공'}
                      </span>
                    </div>
                  </div>

                  {coinDetail && typeof coinDetail.price_change_24h === 'number' && (
                    <div className={`p-4 rounded-lg border ${
                      coinDetail.price_change_24h > 0 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${
                          coinDetail.price_change_24h > 0 ? 'text-red-700' : 'text-blue-700'
                        }`}>
                          24시간 변화율
                        </span>
                        <span className={`text-lg font-bold ${
                          coinDetail.price_change_24h > 0 ? 'text-red-900' : 'text-blue-900'
                        }`}>
                          {coinDetail.price_change_24h > 0 ? '+' : ''}{coinDetail.price_change_24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>                
            
              {/* 기간별 수익률 */}
              {(coinDetail?.price_change_7d || coinDetail?.price_change_30d || coinDetail?.price_change_1y) && (
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">📈 기간별 수익률</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getCurrentChange() > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {getCurrentChange() > 0 ? '+' : ''}{getCurrentChange().toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">24시간</div>
                    </div>
                    
                    {coinDetail?.price_change_7d && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${coinDetail.price_change_7d > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {coinDetail.price_change_7d > 0 ? '+' : ''}{coinDetail.price_change_7d.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">7일</div>
                      </div>
                    )}
                    
                    {coinDetail?.price_change_30d && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${coinDetail.price_change_30d > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {coinDetail.price_change_30d > 0 ? '+' : ''}{coinDetail.price_change_30d.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">30일</div>
                      </div>
                    )}
                    
                    {coinDetail?.price_change_1y && (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${coinDetail.price_change_1y > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {coinDetail.price_change_1y > 0 ? '+' : ''}{coinDetail.price_change_1y.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-600">1년</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        

         {activeTab === 'technology' && (
           <div className="space-y-6">
             {/* 기술적 특징 */}
             <div className="bg-white p-6 rounded-xl border border-gray-100">
               <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 핵심 기술</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {coinDetail?.hashing_algorithm && (
                   <div className="bg-white p-4 rounded-lg border border-gray-200">
                     <div className="flex items-center gap-3">
                       <span className="text-blue-600 text-2xl">⚙️</span>
                       <div>
                         <div className="font-bold text-gray-800">합의 알고리즘</div>
                         <div className="text-gray-600">{coinDetail.hashing_algorithm}</div>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                   <div className="flex items-center gap-3">
                     <span className="text-green-600 text-2xl">🔒</span>
                     <div>
                       <div className="font-bold text-gray-800">순환 공급량</div>
                       <div className="text-gray-600">
                         {formatSupply(coinDetail?.circulating_supply)} {coin.symbol}
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                   <div className="flex items-center gap-3">
                     <span className="text-purple-600 text-2xl">📦</span>
                     <div>
                       <div className="font-bold text-gray-800">최대 공급량</div>
                       <div className="text-gray-600">
                         {coinDetail?.max_supply ? formatSupply(coinDetail.max_supply) : '무제한'} {coin.symbol}
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                   <div className="flex items-center gap-3">
                     <span className="text-orange-600 text-2xl">⭐</span>
                     <div>
                       <div className="font-bold text-gray-800">개발자 활동</div>
                       <div className="text-gray-600">{getDeveloperActivity()}</div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* 개발자 통계 */}
             {(coinDetail?.stars || coinDetail?.forks) && (
               <div className="bg-white p-6 rounded-xl border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">👨‍💻 개발자 통계</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {coinDetail?.stars && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-yellow-600">⭐</div>
                       <div className="text-lg font-bold text-gray-900">{coinDetail.stars.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">GitHub Stars</div>
                     </div>
                   )}
                   
                   {coinDetail?.forks && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-blue-600">🔱</div>
                       <div className="text-lg font-bold text-gray-900">{coinDetail.forks.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Forks</div>
                     </div>
                   )}
                   
                   {coinDetail?.total_issues && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-red-600">🐛</div>
                       <div className="text-lg font-bold text-gray-900">{coinDetail.total_issues.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Total Issues</div>
                     </div>
                   )}
                   
                   {coinDetail?.closed_issues && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-green-600">✅</div>
                       <div className="text-lg font-bold text-gray-900">{coinDetail.closed_issues.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Closed Issues</div>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* 커뮤니티 통계 */}
             {(coinDetail?.twitter_followers || coinDetail?.reddit_subscribers) && (
               <div className="bg-white p-6 rounded-xl border border-gray-100">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">👥 커뮤니티 규모</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {coinDetail?.twitter_followers && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-blue-600">🐦</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(coinDetail.twitter_followers)}
                       </div>
                       <div className="text-sm text-gray-600">Twitter 팔로워</div>
                     </div>
                   )}
                   
                   {coinDetail?.reddit_subscribers && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-orange-600">📱</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(coinDetail.reddit_subscribers)}
                       </div>
                       <div className="text-sm text-gray-600">Reddit 구독자</div>
                     </div>
                   )}
                   
                   {coinDetail?.telegram_channel_user_count && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-blue-500">✈️</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(coinDetail.telegram_channel_user_count)}
                       </div>
                       <div className="text-sm text-gray-600">Telegram 멤버</div>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
         )}

         {activeTab === 'risks' && (
           <div className="space-y-6">
             {/* 리스크 요약 */}
             <div className="p-6 rounded-xl border bg-white border-gray-100">
               <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ 종합 리스크 평가</h3>
               <div className="grid grid-cols-3 gap-4 text-center">
                 <div>
                   <div className={`text-3xl font-bold ${
                     investmentGrade.color === 'purple' || investmentGrade.color === 'blue' ? 'text-green-600' :
                     investmentGrade.color === 'green' ? 'text-yellow-600' :
                     investmentGrade.color === 'yellow' ? 'text-orange-600' :
                     'text-red-600'
                   }`}>
                     {investmentGrade.grade}
                   </div>
                   <div className="text-sm text-gray-600">투자 등급</div>
                 </div>
                 <div>
                   <div className={`text-2xl font-bold ${
                     Math.abs(getCurrentChange()) < 5 ? 'text-green-600' :
                     Math.abs(getCurrentChange()) < 10 ? 'text-yellow-600' :
                     Math.abs(getCurrentChange()) < 20 ? 'text-orange-600' :
                     'text-red-600'
                   }`}>
                     {Math.abs(getCurrentChange()) < 5 ? '낮음' :
                      Math.abs(getCurrentChange()) < 10 ? '보통' :
                      Math.abs(getCurrentChange()) < 20 ? '높음' : '매우 높음'}
                   </div>
                   <div className="text-sm text-gray-600">변동성</div>
                 </div>
                 <div>
                   <div className={`text-2xl font-bold ${
                     coinDetail?.market_cap_rank <= 10 ? 'text-green-600' :
                     coinDetail?.market_cap_rank <= 50 ? 'text-yellow-600' :
                     coinDetail?.market_cap_rank <= 100 ? 'text-orange-600' :
                     'text-red-600'
                   }`}>
                     {coinDetail?.market_cap_rank <= 10 ? '낮음' :
                      coinDetail?.market_cap_rank <= 50 ? '보통' :
                      coinDetail?.market_cap_rank <= 100 ? '높음' : '매우 높음'}
                   </div>
                   <div className="text-sm text-gray-600">유동성 리스크</div>
                 </div>
               </div>
             </div>

             {/* 상세 리스크 분석 */}
             <div className="space-y-4">
               <div className="bg-white p-5 rounded-xl border border-gray-100">
                 <div className="flex items-start gap-3">
                   <span className="text-red-600 text-2xl">📊</span>
                   <div>
                     <div className="font-bold text-gray-800 mb-2">변동성 리스크</div>
                     <div className="text-gray-700 text-sm mb-2">
                       최근 24시간 가격 변동: <span className="font-bold">{Math.abs(getCurrentChange()).toFixed(2)}%</span>
                     </div>
                     <div className="text-gray-600 text-sm">
                       {Math.abs(getCurrentChange()) < 5 ? '안정적인 가격 움직임을 보이고 있습니다.' :
                        Math.abs(getCurrentChange()) < 10 ? '보통 수준의 변동성을 보이고 있습니다.' :
                        Math.abs(getCurrentChange()) < 20 ? '높은 변동성으로 주의가 필요합니다.' :
                        '매우 높은 변동성으로 고위험 투자입니다.'}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-100">
                 <div className="flex items-start gap-3">
                   <span className="text-yellow-600 text-2xl">🏪</span>
                   <div>
                     <div className="font-bold text-gray-800 mb-2">시장 지위 리스크</div>
                     <div className="text-gray-700 text-sm mb-2">
                       현재 시가총액 순위: <span className="font-bold">#{coinDetail?.market_cap_rank || '미제공'}위</span>
                     </div>
                     <div className="text-gray-600 text-sm">
                       {!coinDetail?.market_cap_rank ? '시장 데이터가 부족합니다.' :
                        coinDetail.market_cap_rank <= 10 ? '메이저 코인으로 상대적으로 안정적입니다.' :
                        coinDetail.market_cap_rank <= 50 ? '중형 코인으로 적절한 주의가 필요합니다.' :
                        coinDetail.market_cap_rank <= 100 ? '소형 코인으로 높은 리스크가 있습니다.' :
                        '신흥 코인으로 매우 높은 리스크가 있습니다.'}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-white p-5 rounded-xl border border-gray-100">
                 <div className="flex items-start gap-3">
                   <span className="text-orange-600 text-2xl">🔧</span>
                   <div>
                     <div className="font-bold text-gray-800 mb-2">기술적 리스크</div>
                     <div className="text-gray-700 text-sm mb-2">
                       개발 활동 수준: <span className="font-bold">{getDeveloperActivity()}</span>
                     </div>
                     <div className="text-gray-600 text-sm">
                       활발한 개발 활동은 프로젝트의 지속적인 발전을 의미하지만, 
                       기술적 변화로 인한 리스크도 함께 고려해야 합니다.
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* 투자 가이드라인 */}
             <div className="bg-white p-6 rounded-xl border border-gray-100">
               <h4 className="font-bold text-blue-800 mb-4">💡 {getKoreanName()} 투자 시 고려사항</h4>
               <div className="space-y-2 text-blue-700 text-sm">
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>현재 글로벌 순위 #{coinDetail?.market_cap_rank || '미제공'}위 (순위가 높을수록 안정적)</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>24시간 변동률 {getCurrentChange().toFixed(2)}% (변동성 {Math.abs(getCurrentChange()) < 5 ? '낮음' : Math.abs(getCurrentChange()) < 10 ? '보통' : '높음'})</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>투자 등급 {investmentGrade.grade} - {investmentGrade.description}</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>충분한 조사 후 본인의 위험 성향에 맞는 금액으로 투자하세요</span>
                 </div>
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>분산 투자를 통해 리스크를 관리하고 장기적 관점에서 접근하세요</span>
                 </div>
               </div>
             </div>
           </div>
          )}
        </div>
      </div>
   </div>
 );
};

export default CoinInfoPanel;