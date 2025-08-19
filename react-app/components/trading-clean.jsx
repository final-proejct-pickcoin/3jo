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


// 자동 심볼-ID 매핑 캐시
let symbolToIdCache = {};
let cacheExpiry = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// CoinGecko에서 심볼-ID 매핑 자동 생성
const getSymbolToIdMapping = async () => {
  const now = Date.now();
  
  if (symbolToIdCache && Object.keys(symbolToIdCache).length > 0 && now < cacheExpiry) {
    return symbolToIdCache;
  }

  try {
    console.log('🔄 CoinGecko 코인 목록 자동 매핑 중...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list');
    
    if (!response.ok) {
      throw new Error(`CoinGecko API 오류: ${response.status}`);
    }
    
    const coinsList = await response.json();
    
    const mapping = {};
    coinsList.forEach(coin => {
      if (coin.symbol && coin.id) {
        const symbol = coin.symbol.toUpperCase();
        if (!mapping[symbol]) {
          mapping[symbol] = coin.id;
        }
      }
    });
    
    symbolToIdCache = mapping;
    cacheExpiry = now + CACHE_DURATION;
    
    console.log(`✅ ${Object.keys(mapping).length}개 코인 자동 매핑 완료`);
    
    return mapping;
    
  } catch (error) {
    console.error('❌ CoinGecko 매핑 생성 실패:', error);
    
    return {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'XRP': 'ripple',
      'ADA': 'cardano',
      'SOL': 'solana'
    };
  }
};

// CoinGecko API에서 코인 상세 정보 가져오기
const fetchCoinGeckoData = async (symbol) => {
  try {
    const symbolToId = await getSymbolToIdMapping();
    
    const coinId = symbolToId[symbol.toUpperCase()];
    if (!coinId) {
      console.warn(`⚠️ ${symbol}에 대한 CoinGecko ID를 찾을 수 없습니다`);
      return null;
    }

    console.log(`📊 ${symbol} -> ${coinId} 데이터 요청 중...`);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ ${symbol} 데이터 로드 완료`);
    
    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      description: data.description?.ko || data.description?.en || '설명이 없습니다.',
      genesis_date: data.genesis_date || '미제공',
      market_cap_rank: data.market_cap_rank || 0,
      current_price: data.market_data?.current_price?.krw || 0,
      market_cap: data.market_data?.market_cap?.krw || 0,
      total_supply: data.market_data?.total_supply || 0,
      circulating_supply: data.market_data?.circulating_supply || 0,
      max_supply: data.market_data?.max_supply,
      price_change_24h: data.market_data?.price_change_percentage_24h || 0,
      high_24h: data.market_data?.high_24h?.krw || 0,
      low_24h: data.market_data?.low_24h?.krw || 0,
      ath: data.market_data?.ath?.krw || 0,
      ath_date: data.market_data?.ath_date?.krw || '',
      atl: data.market_data?.atl?.krw || 0,
      atl_date: data.market_data?.atl_date?.krw || '',
      homepage: data.links?.homepage?.[0] || '',
      whitepaper: data.links?.whitepaper || '',
      blockchain_site: data.links?.blockchain_site?.[0] || '',
      hashing_algorithm: data.hashing_algorithm || '미제공',
      categories: data.categories || []
    };
  } catch (error) {
    console.error(`❌ ${symbol} CoinGecko 데이터 조회 실패:`, error);
    return null;
  }
};

// 코인 상세 정보를 가져오는 함수 (빗썸 API)
const fetchCoinDetail = async (symbol) => {
  try {
    const response = await fetch(`http://localhost:8000/api/coin/${symbol}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('코인 상세 정보 조회 실패:', error);
    return null;
  }
};

// 코인 아이콘 색상
const getCoinIconColor = (symbol) => {
  const colors = {
    'BTC': 'bg-orange-500',
    'ETH': 'bg-blue-500', 
    'XRP': 'bg-blue-400',
    'ADA': 'bg-blue-600',
    'SOL': 'bg-purple-500',
    'DOGE': 'bg-yellow-500'
  };
  return colors[symbol] || 'bg-gray-500';
};

// CoinInfoPanel 컴포넌트
// 🎯 다중 API 통합 함수들
const fetchUpbitKoreanData = async (symbol) => {
  try {
    const response = await fetch('https://api.upbit.com/v1/market/all');
    if (!response.ok) throw new Error('업비트 API 오류');
    
    const markets = await response.json();
    const koreanInfo = markets.find(market => 
      market.market === `KRW-${symbol}` && market.korean_name
    );
    
    return koreanInfo ? {
      korean_name: koreanInfo.korean_name,
      english_name: koreanInfo.english_name,
      market_warning: koreanInfo.market_warning || 'NONE'
    } : null;
  } catch (error) {
    console.error('업비트 한국어 데이터 조회 실패:', error);
    return null;
  }
};

const fetchCoinMarketCapData = async (symbol) => {
  try {
    // CoinMarketCap API 키 없이 사용할 수 있는 공개 데이터
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`, {
      headers: {
        'X-CMC_PRO_API_KEY': 'demo-key' // 실제 키가 있다면 교체
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data[symbol];
    }
    return null;
  } catch (error) {
    console.error('CoinMarketCap 데이터 조회 실패:', error);
    return null;
  }
};

// 향상된 CoinGecko 데이터 함수
const fetchEnhancedCoinData = async (symbol) => {
  try {
    const symbolToId = await getSymbolToIdMapping();
    const coinId = symbolToId[symbol.toUpperCase()];
    
    if (!coinId) {
      console.warn(`${symbol}에 대한 CoinGecko ID를 찾을 수 없습니다`);
      return null;
    }

    // 더 상세한 데이터를 위해 모든 옵션 활성화
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=true&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true`
    );
    
    if (!response.ok) throw new Error(`CoinGecko API 오류: ${response.status}`);
    
    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      
      // 다국어 설명 (한국어 우선)
      description: data.description?.ko || data.description?.en || '설명이 없습니다.',
      
      // 기본 정보
      genesis_date: data.genesis_date,
      market_cap_rank: data.market_cap_rank,
      coingecko_rank: data.coingecko_rank,
      coingecko_score: data.coingecko_score,
      developer_score: data.developer_score,
      community_score: data.community_score,
      liquidity_score: data.liquidity_score,
      public_interest_score: data.public_interest_score,
      
      // 상세 시장 데이터
      current_price: data.market_data?.current_price?.krw || 0,
      market_cap: data.market_data?.market_cap?.krw || 0,
      market_cap_change_24h: data.market_data?.market_cap_change_percentage_24h || 0,
      total_supply: data.market_data?.total_supply || 0,
      circulating_supply: data.market_data?.circulating_supply || 0,
      max_supply: data.market_data?.max_supply,
      
      // 가격 정보
      price_change_24h: data.market_data?.price_change_percentage_24h || 0,
      price_change_7d: data.market_data?.price_change_percentage_7d || 0,
      price_change_30d: data.market_data?.price_change_percentage_30d || 0,
      price_change_1y: data.market_data?.price_change_percentage_1y || 0,
      
      high_24h: data.market_data?.high_24h?.krw || 0,
      low_24h: data.market_data?.low_24h?.krw || 0,
      ath: data.market_data?.ath?.krw || 0,
      ath_date: data.market_data?.ath_date?.krw || '',
      atl: data.market_data?.atl?.krw || 0,
      atl_date: data.market_data?.atl_date?.krw || '',
      
      // 거래량 및 유동성
      total_volume: data.market_data?.total_volume?.krw || 0,
      market_cap_fdv_ratio: data.market_data?.market_cap_fdv_ratio || 0,
      
      // 기술 정보
      hashing_algorithm: data.hashing_algorithm,
      categories: data.categories || [],
      
      // 링크
      homepage: data.links?.homepage?.[0] || '',
      whitepaper: data.links?.whitepaper || '',
      blockchain_site: data.links?.blockchain_site?.[0] || '',
      official_forum_url: data.links?.official_forum_url?.[0] || '',
      chat_url: data.links?.chat_url?.[0] || '',
      announcement_url: data.links?.announcement_url?.[0] || '',
      twitter_screen_name: data.links?.twitter_screen_name || '',
      facebook_username: data.links?.facebook_username || '',
      telegram_channel_identifier: data.links?.telegram_channel_identifier || '',
      subreddit_url: data.links?.subreddit_url || '',
      repos_url: data.links?.repos_url?.github?.[0] || '',
      
      // 커뮤니티 데이터
      facebook_likes: data.community_data?.facebook_likes || 0,
      twitter_followers: data.community_data?.twitter_followers || 0,
      reddit_subscribers: data.community_data?.reddit_subscribers || 0,
      telegram_channel_user_count: data.community_data?.telegram_channel_user_count || 0,
      
      // 개발자 데이터
      forks: data.developer_data?.forks || 0,
      stars: data.developer_data?.stars || 0,
      subscribers: data.developer_data?.subscribers || 0,
      total_issues: data.developer_data?.total_issues || 0,
      closed_issues: data.developer_data?.closed_issues || 0,
      
      // 스파클라인 (차트 데이터)
      sparkline: data.market_data?.sparkline_7d?.price || []
    };
  } catch (error) {
    console.error(`${symbol} 향상된 데이터 조회 실패:`, error);
    return null;
  }
};

// 🎯 업비트 스타일 CoinInfoPanel 컴포넌트
const CoinInfoPanel = ({ coin, realTimeData }) => {
  const [coinDetail, setCoinDetail] = useState(null);
  const [geckoData, setGeckoData] = useState(null);
  const [upbitData, setUpbitData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (coin) {
      setLoading(true);
      setCoinDetail(null);
      setGeckoData(null);
      setUpbitData(null);

      // 3개 API 병렬 호출
      Promise.all([
        fetchCoinDetail(coin.symbol),
        fetchEnhancedCoinData(coin.symbol),
        fetchUpbitKoreanData(coin.symbol)
      ]).then(([bithumbData, geckoResult, upbitResult]) => {
        if (bithumbData && bithumbData.status === 'success') {
          setCoinDetail(bithumbData.data);
        }
        if (geckoResult) {
          setGeckoData(geckoResult);
        }
        if (upbitResult) {
          setUpbitData(upbitResult);
        }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [coin.symbol]);

  // 한국어 이름 우선순위: 업비트 > 기본 매핑 > 영어명
  const getKoreanName = () => {
    if (upbitData?.korean_name) return upbitData.korean_name;
    if (coin.name && coin.name !== coin.symbol) return coin.name;
    if (geckoData?.name) return geckoData.name;
    return coin.symbol;
  };

  const getCurrentPrice = () => {
    if (realTimeData && realTimeData.closePrice) {
      return parseInt(realTimeData.closePrice);
    }
    if (geckoData && geckoData.current_price) {
      return geckoData.current_price;
    }
    return coinDetail ? coinDetail.current_price : coin.price;
  };

  const getCurrentChange = () => {
    if (realTimeData && realTimeData.chgRate) {
      return parseFloat(realTimeData.chgRate);
    }
    if (geckoData && geckoData.price_change_24h) {
      return geckoData.price_change_24h;
    }
    return coin.change;
  };

  // 🎯 업비트 스타일 분석 함수들
  const getInvestmentGrade = () => {
    if (!geckoData) return { grade: '분석중', color: 'gray', description: '데이터 로딩 중' };
    
    const rank = geckoData.market_cap_rank;
    const score = geckoData.coingecko_score || 0;
    
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
    if (!geckoData) return '분석중';
    
    const volume24h = geckoData.total_volume;
    const marketCap = geckoData.market_cap;
    
    if (!volume24h || !marketCap) return '데이터 부족';
    
    const ratio = volume24h / marketCap;
    
    if (ratio > 0.1) return '🔥 매우 활발';
    if (ratio > 0.05) return '🚀 활발';
    if (ratio > 0.02) return '📈 보통';
    if (ratio > 0.01) return '📉 저조';
    return '😴 매우 저조';
  };

  const getDeveloperActivity = () => {
    if (!geckoData || !geckoData.developer_score) return '분석중';
    
    const score = geckoData.developer_score;
    if (score > 80) return '🏆 매우 활발';
    if (score > 60) return '💪 활발';
    if (score > 40) return '🔧 보통';
    if (score > 20) return '⏰ 저조';
    return '😴 매우 저조';
  };

  const getCommunityStrength = () => {
    if (!geckoData) return '분석중';
    
    const score = geckoData.community_score || 0;
    const twitterFollowers = geckoData.twitter_followers || 0;
    const redditSubscribers = geckoData.reddit_subscribers || 0;
    
    const totalCommunity = twitterFollowers + redditSubscribers;
    
    if (score > 80 && totalCommunity > 100000) return '🌟 매우 강함';
    if (score > 60 && totalCommunity > 50000) return '💎 강함';
    if (score > 40 && totalCommunity > 10000) return '👥 보통';
    if (score > 20) return '🤝 약함';
    return '😔 매우 약함';
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
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-gray-100">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800">코인을 선택해보세요</h2>
          <p className="text-gray-600 leading-relaxed">
            왼쪽에서 관심있는 코인을 클릭하면<br/>
            <span className="font-semibold text-blue-600">전문가급 분석</span>을 제공해드려요
          </p>
        <div
          className={`text-right font-mono font-semibold text-base ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
          style={{ transition: 'background 0.3s' }}
        >
          {/* 현재가 숫자만 하이라이트 */}
          {highlighted[coin.symbol]?.priceHL ? (
            <span className="bg-yellow-100 transition-all duration-300" style={{ transition: 'background 0.3s' }}>{coin.price.toLocaleString()}</span>
          ) : (
            <span>{coin.price.toLocaleString()}</span>
          )}
        </div>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
        <div className="relative">
          <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="text-xl font-bold text-gray-800 mb-2">{coin.name} 심층 분석 중</div>
          <div className="text-gray-600">
            3개 거래소 + 글로벌 데이터를<br/>
            실시간으로 통합 분석하고 있어요
          </div>
        </div>
      </div>
    );
  }

  const investmentGrade = getInvestmentGrade();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto" style={{ height: '1100px' }}>
      {/* 🎯 메인 헤더 - 업비트 스타일 */}
      <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100">
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
                <span className="text-lg text-gray-600 font-medium">{coin.symbol}/KRW</span>
                {realTimeData && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                    ● 실시간 연동
                  </span>
                )}
                {geckoData?.market_cap_rank && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                    글로벌 #{geckoData.market_cap_rank}위
                  </span>
                )}
                {upbitData?.market_warning !== 'NONE' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">
                    ⚠️ 투자유의
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 현재 가격 & 투자 등급 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
              <div className="text-sm text-emerald-700 font-medium mb-2">💰 현재 가격</div>
              <div className="text-3xl font-bold text-emerald-900 mb-2">
                {getCurrentPrice().toLocaleString()}원
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getCurrentChange() > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {getCurrentChange() > 0 ? '📈 +' : '📉 '}{getCurrentChange().toFixed(2)}%
                </span>
                {realTimeData?.chgAmt && (
                  <span className="text-sm text-gray-600">
                    ({realTimeData.chgAmt > 0 ? '+' : ''}{parseInt(realTimeData.chgAmt).toLocaleString()}원)
                  </span>
                )}
              </div>
            </div>
            
            <div className={`bg-gradient-to-r p-6 rounded-2xl border ${
              investmentGrade.color === 'purple' ? 'from-purple-50 to-purple-100 border-purple-200' :
              investmentGrade.color === 'blue' ? 'from-blue-50 to-blue-100 border-blue-200' :
              investmentGrade.color === 'green' ? 'from-green-50 to-green-100 border-green-200' :
              investmentGrade.color === 'yellow' ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
              'from-red-50 to-red-100 border-red-200'
            }`}>
              <div className={`text-sm font-medium mb-2 ${
                investmentGrade.color === 'purple' ? 'text-purple-700' :
                investmentGrade.color === 'blue' ? 'text-blue-700' :
                investmentGrade.color === 'green' ? 'text-green-700' :
                investmentGrade.color === 'yellow' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                🎯 투자 등급
              </div>
              <div className={`text-3xl font-bold mb-1 ${
                investmentGrade.color === 'purple' ? 'text-purple-900' :
                investmentGrade.color === 'blue' ? 'text-blue-900' :
                investmentGrade.color === 'green' ? 'text-green-900' :
                investmentGrade.color === 'yellow' ? 'text-yellow-900' :
                'text-red-900'
              }`}>
                {investmentGrade.grade}
              </div>
              <div className={`text-sm ${
                investmentGrade.color === 'purple' ? 'text-purple-600' :
                investmentGrade.color === 'blue' ? 'text-blue-600' :
                investmentGrade.color === 'green' ? 'text-green-600' :
                investmentGrade.color === 'yellow' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {investmentGrade.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 핵심 지표 대시보드 */}
      <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🔥 핵심 지표 대시보드
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-xs text-blue-700 mb-1">시가총액</div>
              <div className="text-lg font-bold text-blue-900">
                {geckoData?.market_cap ? formatLargeNumber(geckoData.market_cap) + '원' : '미제공'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-xs text-green-700 mb-1">거래 활성도</div>
              <div className="text-sm font-bold text-green-900">
                {getActivityLevel()}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-xs text-purple-700 mb-1">개발 활동</div>
              <div className="text-sm font-bold text-purple-900">
                {getDeveloperActivity()}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-xs text-orange-700 mb-1">커뮤니티</div>
              <div className="text-sm font-bold text-orange-900">
                {getCommunityStrength()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📚 상세 분석 탭 */}
      <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: '개요', icon: '📖' },
            { id: 'investment', label: '투자 분석', icon: '📊' },
            { id: 'technology', label: '기술 정보', icon: '⚙️' },
            { id: 'risks', label: '위험 분석', icon: '🚨' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-4 text-center font-medium transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🔍 {getKoreanName()} 프로젝트 소개
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {geckoData?.description ? 
                    geckoData.description.slice(0, 500) + (geckoData.description.length > 500 ? '...' : '') :
                    `${getKoreanName()}은 혁신적인 블록체인 기술을 활용한 디지털 자산 프로젝트입니다.`
                  }
                </p>
              </div>

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-2">🎂 출시일</div>
                    <div className="text-lg font-bold text-green-900">
                      {geckoData?.genesis_date || '미제공'}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-2">🏆 글로벌 순위</div>
                    <div className="text-lg font-bold text-blue-900">
                      #{geckoData?.market_cap_rank || '미제공'}위
                    </div>
                  </div>
                  
                  {geckoData?.coingecko_score && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-700 mb-2">⭐ CoinGecko 점수</div>
                      <div className="text-lg font-bold text-purple-900">
                        {geckoData.coingecko_score.toFixed(1)}/100
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-700 mb-2">💎 순환 공급량</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {formatSupply(geckoData?.circulating_supply)} {coin.symbol}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700 mb-2">📦 최대 공급량</div>
                    <div className="text-lg font-bold text-red-900">
                      {geckoData?.max_supply ? formatSupply(geckoData.max_supply) : '무제한'} {coin.symbol}
                    </div>
                  </div>
                  
                  {geckoData?.hashing_algorithm && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 mb-2">⚙️ 합의 알고리즘</div>
                      <div className="text-lg font-bold text-gray-900">
                        {geckoData.hashing_algorithm}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 주요 활용 분야 */}
              {geckoData?.categories && geckoData.categories.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 주요 활용 분야</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {geckoData.categories.slice(0, 6).map((category, index) => (
                     <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                       <span className="text-gray-800 font-medium text-sm">{category}</span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}

         {activeTab === 'investment' && (
           <div className="space-y-6">
             {/* 투자 요약 카드 */}
             <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
               <h3 className="text-xl font-bold text-gray-900 mb-4">📈 투자 요약 분석</h3>
               <div className="grid grid-cols-3 gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-emerald-900">{investmentGrade.grade}</div>
                   <div className="text-sm text-emerald-700">투자 등급</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-emerald-900">
                     #{geckoData?.market_cap_rank || '?'}
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
                 
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                   <div className="flex justify-between items-center">
                     <span className="text-red-700 font-medium">24시간 최고가</span>
                     <span className="text-lg font-bold text-red-900">
                       {geckoData?.high_24h ? geckoData.high_24h.toLocaleString() : getCurrentPrice().toLocaleString()}원
                     </span>
                   </div>
                 </div>
                 
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                   <div className="flex justify-between items-center">
                     <span className="text-blue-700 font-medium">24시간 최저가</span>
                     <span className="text-lg font-bold text-blue-900">
                       {geckoData?.low_24h ? geckoData.low_24h.toLocaleString() : getCurrentPrice().toLocaleString()}원
                     </span>
                   </div>
                 </div>

                 {geckoData?.ath && (
                   <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                     <div className="flex justify-between items-center">
                       <span className="text-yellow-700 font-medium">역대 최고가</span>
                       <div className="text-right">
                         <div className="text-lg font-bold text-yellow-900">
                           {geckoData.ath.toLocaleString()}원
                         </div>
                         <div className="text-xs text-yellow-600">
                           {new Date(geckoData.ath_date).toLocaleDateString()}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               <div className="space-y-4">
                 <h4 className="text-lg font-bold text-gray-900">📊 시장 지표</h4>
                 
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                   <div className="flex justify-between items-center">
                     <span className="text-purple-700 font-medium">시가총액</span>
                     <span className="text-lg font-bold text-purple-900">
                       {geckoData?.market_cap ? formatLargeNumber(geckoData.market_cap) + '원' : '미제공'}
                     </span>
                   </div>
                 </div>
                 
                 <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                   <div className="flex justify-between items-center">
                     <span className="text-green-700 font-medium">24시간 거래량</span>
                     <span className="text-lg font-bold text-green-900">
                       {geckoData?.total_volume ? formatLargeNumber(geckoData.total_volume) + '원' : '미제공'}
                     </span>
                   </div>
                 </div>

                 {geckoData?.market_cap_change_24h && (
                   <div className={`p-4 rounded-lg border ${
                     geckoData.market_cap_change_24h > 0 
                       ? 'bg-red-50 border-red-200' 
                       : 'bg-blue-50 border-blue-200'
                   }`}>
                     <div className="flex justify-between items-center">
                       <span className={`font-medium ${
                         geckoData.market_cap_change_24h > 0 ? 'text-red-700' : 'text-blue-700'
                       }`}>
                         시총 24시간 변화
                       </span>
                       <span className={`text-lg font-bold ${
                         geckoData.market_cap_change_24h > 0 ? 'text-red-900' : 'text-blue-900'
                       }`}>
                         {geckoData.market_cap_change_24h > 0 ? '+' : ''}{geckoData.market_cap_change_24h.toFixed(2)}%
                       </span>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             {/* 기간별 수익률 */}
             {(geckoData?.price_change_7d || geckoData?.price_change_30d || geckoData?.price_change_1y) && (
               <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                 <h4 className="text-lg font-bold text-gray-900 mb-4">📈 기간별 수익률</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="text-center">
                     <div className={`text-2xl font-bold ${getCurrentChange() > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                       {getCurrentChange() > 0 ? '+' : ''}{getCurrentChange().toFixed(2)}%
                     </div>
                     <div className="text-sm text-gray-600">24시간</div>
                   </div>
                   
                   {geckoData?.price_change_7d && (
                     <div className="text-center">
                       <div className={`text-2xl font-bold ${geckoData.price_change_7d > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                         {geckoData.price_change_7d > 0 ? '+' : ''}{geckoData.price_change_7d.toFixed(2)}%
                       </div>
                       <div className="text-sm text-gray-600">7일</div>
                     </div>
                   )}
                   
                   {geckoData?.price_change_30d && (
                     <div className="text-center">
                       <div className={`text-2xl font-bold ${geckoData.price_change_30d > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                         {geckoData.price_change_30d > 0 ? '+' : ''}{geckoData.price_change_30d.toFixed(2)}%
                       </div>
                       <div className="text-sm text-gray-600">30일</div>
                     </div>
                   )}
                   
                   {geckoData?.price_change_1y && (
                     <div className="text-center">
                       <div className={`text-2xl font-bold ${geckoData.price_change_1y > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                         {geckoData.price_change_1y > 0 ? '+' : ''}{geckoData.price_change_1y.toFixed(2)}%
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
             <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
               <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 핵심 기술</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {geckoData?.hashing_algorithm && (
                   <div className="bg-white p-4 rounded-lg border border-gray-200">
                     <div className="flex items-center gap-3">
                       <span className="text-blue-600 text-2xl">⚙️</span>
                       <div>
                         <div className="font-bold text-gray-800">합의 알고리즘</div>
                         <div className="text-gray-600">{geckoData.hashing_algorithm}</div>
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
                         {formatSupply(geckoData?.circulating_supply)} {coin.symbol}
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
                         {geckoData?.max_supply ? formatSupply(geckoData.max_supply) : '무제한'} {coin.symbol}
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
             {(geckoData?.stars || geckoData?.forks) && (
               <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">👨‍💻 개발자 통계</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {geckoData?.stars && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-yellow-600">⭐</div>
                       <div className="text-lg font-bold text-gray-900">{geckoData.stars.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">GitHub Stars</div>
                     </div>
                   )}
                   
                   {geckoData?.forks && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-blue-600">🔱</div>
                       <div className="text-lg font-bold text-gray-900">{geckoData.forks.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Forks</div>
                     </div>
                   )}
                   
                   {geckoData?.total_issues && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-red-600">🐛</div>
                       <div className="text-lg font-bold text-gray-900">{geckoData.total_issues.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Total Issues</div>
                     </div>
                   )}
                   
                   {geckoData?.closed_issues && (
                     <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                       <div className="text-xl font-bold text-green-600">✅</div>
                       <div className="text-lg font-bold text-gray-900">{geckoData.closed_issues.toLocaleString()}</div>
                       <div className="text-xs text-gray-600">Closed Issues</div>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* 커뮤니티 통계 */}
             {(geckoData?.twitter_followers || geckoData?.reddit_subscribers) && (
               <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">👥 커뮤니티 규모</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {geckoData?.twitter_followers && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-blue-600">🐦</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(geckoData.twitter_followers)}
                       </div>
                       <div className="text-sm text-gray-600">Twitter 팔로워</div>
                     </div>
                   )}
                   
                   {geckoData?.reddit_subscribers && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-orange-600">📱</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(geckoData.reddit_subscribers)}
                       </div>
                       <div className="text-sm text-gray-600">Reddit 구독자</div>
                     </div>
                   )}
                   
                   {geckoData?.telegram_channel_user_count && (
                     <div className="bg-white p-4 rounded-lg text-center border border-gray-200">
                       <div className="text-2xl font-bold text-blue-500">✈️</div>
                       <div className="text-lg font-bold text-gray-900">
                         {formatLargeNumber(geckoData.telegram_channel_user_count)}
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
             <div className={`p-6 rounded-xl border ${
               investmentGrade.color === 'purple' || investmentGrade.color === 'blue' ? 'bg-green-50 border-green-200' :
               investmentGrade.color === 'green' ? 'bg-yellow-50 border-yellow-200' :
               investmentGrade.color === 'yellow' ? 'bg-orange-50 border-orange-200' :
               'bg-red-50 border-red-200'
             }`}>
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
                     geckoData?.market_cap_rank <= 10 ? 'text-green-600' :
                     geckoData?.market_cap_rank <= 50 ? 'text-yellow-600' :
                     geckoData?.market_cap_rank <= 100 ? 'text-orange-600' :
                     'text-red-600'
                   }`}>
                     {geckoData?.market_cap_rank <= 10 ? '낮음' :
                      geckoData?.market_cap_rank <= 50 ? '보통' :
                      geckoData?.market_cap_rank <= 100 ? '높음' : '매우 높음'}
                   </div>
                   <div className="text-sm text-gray-600">유동성 리스크</div>
                 </div>
               </div>
             </div>

             {/* 상세 리스크 분석 */}
             <div className="space-y-4">
               <div className="bg-red-50 p-5 rounded-xl border border-red-200">
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

               <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200">
                 <div className="flex items-start gap-3">
                   <span className="text-yellow-600 text-2xl">🏪</span>
                   <div>
                     <div className="font-bold text-gray-800 mb-2">시장 지위 리스크</div>
                     <div className="text-gray-700 text-sm mb-2">
                       현재 시가총액 순위: <span className="font-bold">#{geckoData?.market_cap_rank || '미제공'}위</span>
                     </div>
                     <div className="text-gray-600 text-sm">
                       {!geckoData?.market_cap_rank ? '시장 데이터가 부족합니다.' :
                        geckoData.market_cap_rank <= 10 ? '메이저 코인으로 상대적으로 안정적입니다.' :
                        geckoData.market_cap_rank <= 50 ? '중형 코인으로 적절한 주의가 필요합니다.' :
                        geckoData.market_cap_rank <= 100 ? '소형 코인으로 높은 리스크가 있습니다.' :
                        '신흥 코인으로 매우 높은 리스크가 있습니다.'}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
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
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
               <h4 className="font-bold text-blue-800 mb-4">💡 {getKoreanName()} 투자 시 고려사항</h4>
               <div className="space-y-2 text-blue-700 text-sm">
                 <div className="flex items-start gap-2">
                   <span>•</span>
                   <span>현재 글로벌 순위 #{geckoData?.market_cap_rank || '미제공'}위 (순위가 높을수록 안정적)</span>
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

     {/* 🔗 공식 링크 */}
     {(geckoData?.homepage || geckoData?.whitepaper || geckoData?.twitter_screen_name) && (
       <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100">
         <div className="p-6">
           <h3 className="text-xl font-bold text-gray-900 mb-4">🔗 공식 정보 및 링크</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {geckoData.homepage && (
               <a href={geckoData.homepage} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
                 <span className="text-blue-600 text-2xl">🌐</span>
                 <div>
                   <div className="font-bold text-blue-800">공식 웹사이트</div>
                   <div className="text-blue-600 text-sm break-all">{geckoData.homepage}</div>
                 </div>
               </a>
             )}
             
             {geckoData.whitepaper && (
               <a href={geckoData.whitepaper} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors border border-yellow-200">
                 <span className="text-yellow-600 text-2xl">📄</span>
                 <div>
                   <div className="font-bold text-yellow-800">백서 (Whitepaper)</div>
                   <div className="text-yellow-600 text-sm">기술 문서 및 로드맵</div>
                 </div>
               </a>
             )}
             
             {geckoData.twitter_screen_name && (
               <a href={`https://twitter.com/${geckoData.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors border border-sky-200">
                 <span className="text-sky-600 text-2xl">🐦</span>
                 <div>
                   <div className="font-bold text-sky-800">공식 트위터</div>
                   <div className="text-sky-600 text-sm">@{geckoData.twitter_screen_name}</div>
                 </div>
               </a>
             )}
             
             {geckoData.repos_url && (
               <a href={geckoData.repos_url} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                 <span className="text-gray-600 text-2xl">💻</span>
                 <div>
                   <div className="font-bold text-gray-800">GitHub 저장소</div>
                   <div className="text-gray-600 text-sm">소스 코드 및 개발 현황</div>
                 </div>
               </a>
             )}
           </div>
         </div>
       </div>
     )}

     {/* 업데이트 정보 */}
     <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100 mb-6">
       <div className="p-4 text-center">
         <div className="text-sm text-gray-500 mb-1">
           📡 <span className="font-semibold">실시간</span>: 빗썸 + 업비트 • <span className="font-semibold">분석</span>: CoinGecko • <span className="font-semibold">한국어</span>: 다중 API 통합
         </div>
         <div className="text-xs text-gray-400">
           마지막 업데이트: {new Date().toLocaleString()} • 투자 등급: {investmentGrade.grade}
         </div>
       </div>
     </div>
   </div>
 );
};

export const TradingInterface = () => {
  // Responsive height: Coin list matches main chart+order book+order panel area (red box)
  const mainPanelRef = useRef(null);
  const [combinedHeight, setCombinedHeight] = useState(600);

  // TradingInterface 컴포넌트 내부에 추가
  useEffect(() => {
    // 앱 시작시 CoinGecko 매핑 미리 로드
    getSymbolToIdMapping().then(() => {
      console.log('✅ CoinGecko 매핑 데이터 준비 완료');
    });
  }, []);

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
  // (중복 제거) 검색어 상태는 한 번만 선언
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [activeTab, setActiveTab] = useState("원화"); // "원화" or "BTC"
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
      const wsUrl = 'ws://localhost:8000/api/realtime';  // main.py의 경로
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
            console.log('📨 WebSocket 메시지 수신:', data.type, data.content?.symbol);
            
            if (data.type === 'ticker' && data.content) {
              const content = data.content;
              console.log('💰 실시간 가격:', content.symbol, content.closePrice, content.chgRate);

              // 오직 빗썸 24H 틱 데이터만 반영 (중복/오류 방지)
              if (content.tickType && content.tickType !== '24H') return;
              const symbol = content.symbol;
              if (!symbol) return;

              const closePrice = parseFloat(content.closePrice);
              const chgRate = parseFloat(content.chgRate);
              const value = parseFloat(content.value || 0);

              // 데이터 유효성 검증
              if (isNaN(closePrice) || isNaN(value) || value <= 0) {
                // console.warn(`⚠️ ${symbol} 잘못된 데이터 무시:`, { closePrice, value });
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
  const [searchTerm, setSearchTerm] = useState("");

    // 라인 ~1150 부분 교체
    useEffect(() => {
      const fetchCoins = async () => {
        try {
          setLoading(true);
          setFetchError("");
          console.log(`🔄 ${activeTab} 마켓 코인 목록 요청...`);
          
          // BTC 마켓은 오직 빗썸 BTC 마켓 REST API만 사용
          const apiUrl = activeTab === "BTC"
            ? 'http://localhost:8000/api/coins/btc'
            : 'http://localhost:8000/api/coins'

          console.log(`📡 API URL: ${apiUrl}`);

          const response = await fetch(apiUrl);
          console.log(`📊 Response status: ${response.status}`);

          const data = await response.json();       
          console.log('📦 API Response data:', data);
          console.log('📦 First 3 coins:', data.data?.slice(0, 3));

          if (data.status === 'success' && data.data && Array.isArray(data.data)) {
            console.log(`✅ ${activeTab} 마켓 ${data.data.length}개 코인 로드 성공`);
            // BTC 마켓은 빗썸 BTC 마켓 데이터만 사용
            const mappedCoins = data.data.map(coin => ({
              symbol: coin.symbol,
              name: coin.korean_name || coin.symbol,
              englishName: coin.english_name || coin.symbol,
              price: coin.current_price || 0,
              change: coin.change_rate || 0,
              changeAmount: coin.change_amount || 0,
              // volume: 거래대금(백만 단위 변환은 표시할 때만)
              volume: coin.volume || 0,
              trend: (coin.change_rate || 0) > 0 ? 'up' : 'down',
              marketWarning: coin.market_warning || 'NONE'
            }));

            console.log('🎯 Mapped coins:', mappedCoins.slice(0, 3));

            // 모든 코인 다 보여주기 (slice 등 제한 없음)
            setCoinList(mappedCoins);
            setLoading(false); // 이미 있지만 확실히 하기 위해
            console.log('💪 coinList 업데이트 완료, 길이:', mappedCoins.length);
          } else {
            console.error('❌ API 응답 구조 오류:', data);
          }
        } catch (e) {
          console.error(`❌ ${activeTab} 마켓 조회 실패:`, e);
        } finally {
          setLoading(false);
        }
      };
      fetchCoins();
    }, [activeTab]);

  // 실시간 데이터 업데이트 부분 useMemo로 최적화
  // 오직 WebSocket 실시간 데이터만 사용 (초기값 무시)
  // 가격 하이라이트 상태 관리
  // 하이라이트 상태 관리 (현재가: 파랑, 전일대비: 베이지)
  const [highlighted, setHighlighted] = useState({});
  // useEffect(() => {
  //   coinList.forEach(coin => {
  //     // BTC 마켓은 실시간 키가 symbol+'_BTC'임에 주의
  //     const realtimeKey = activeTab === 'BTC'
  //       ? coin.symbol + '_BTC'
  //       : coin.symbol + '_KRW';

  //     const realtimeInfo = realTimeData[realtimeKey];

  //     if (realtimeInfo && !isNaN(realtimeInfo.closePrice)) {
  //       const price = parseInt(realtimeInfo.closePrice);
  //       const change = parseFloat(realtimeInfo.chgRate);
  //       const changeAmount = parseInt(realtimeInfo.chgAmt);
  //       const prevHighlight = highlighted[coin.symbol] || {};

  //       // 현재가 변경 체크 (이전 값과 다를 때만 업데이트)
  //       if (prevHighlight.price !== price) {
  //         setHighlighted(prev => ({
  //           ...prev,
  //           [coin.symbol]: {
  //             ...prev[coin.symbol],
  //             priceHL: true,
  //             price,
  //           }
  //         }));

  //         setTimeout(() => {
  //           setHighlighted(prev => ({
  //             ...prev,
  //             [coin.symbol]: {
  //               ...prev[coin.symbol],
  //               priceHL: false,
  //               price,
  //             }
  //           }));
  //         }, 350);
  //       }

  //       // 전일대비 변경 체크 (변동률 또는 변동금액 중 하나라도 변경)
  //       if (prevHighlight.change !== change || prevHighlight.changeAmount !== changeAmount) {
  //         setHighlighted(prev => ({
  //           ...prev,
  //           [coin.symbol]: {
  //             ...prev[coin.symbol],
  //             changeHL: true,
  //             change,
  //             changeAmount,
  //           }
  //         }));
  //         setTimeout(() => {
  //           setHighlighted(prev => ({
  //             ...prev,
  //             [coin.symbol]: {
  //               ...prev[coin.symbol],
  //               changeHL: false,
  //               change,
  //               changeAmount,
  //             }
  //           }));
  //         }, 350);
  //       }
  //     }
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [realTimeData, activeTab]);

  const updatedCoinList = useMemo(() => {
    console.log('🔄 updatedCoinList 계산 중, coinList 길이:', coinList.length); // ✅ 추가
    
    const result = coinList.map(coin => {
      const marketKey = activeTab === 'BTC' ? '_BTC' : '_KRW';
      const realtimeInfo = realTimeData[coin.symbol + marketKey];
      
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
  
    console.log('✅ updatedCoinList 결과 길이:', result.length); // ✅ 추가
    return result;
  }, [coinList, realTimeData, activeTab]);

  // filteredCoinList useMemo에 로그 추가
  const filteredCoinList = useMemo(() => {
    console.log('🔍 filteredCoinList 계산 중, updatedCoinList 길이:', updatedCoinList.length); // ✅ 추가
    console.log('🔍 검색어:', searchTerm); // ✅ 추가
    
    if (!searchTerm.trim()) {
      console.log('🔍 검색어 없음, 전체 반환:', updatedCoinList.length); // ✅ 추가
      return updatedCoinList;
    }
    
    const lower = searchTerm.trim().toLowerCase();
    const filtered = updatedCoinList.filter(coin =>
      (coin.name && coin.name.toLowerCase().includes(lower)) ||
      (coin.symbol && coin.symbol.toLowerCase().includes(lower))
    );
    
    console.log('🔍 필터링 후 길이:', filtered.length); // ✅ 추가
    return filtered;
  }, [searchTerm, updatedCoinList]);

  // 시세/코인정보 탭 상태
  const [view, setView] = useState("chart");
  // 주문 탭 상태
const [orderTab, setOrderTab] = useState("매도");

// 현재가(실시간 우선)
const currentPriceKRW = useMemo(() => {
  const rt = realTimeData[selectedCoin + "_KRW"];
  if (rt?.closePrice) return parseInt(rt.closePrice, 10);
  const fallback = updatedCoinList.find(c => c.symbol === selectedCoin)?.price;
  return typeof fallback === "number" ? fallback : 0;
}, [selectedCoin, realTimeData, updatedCoinList]);

const priceDir = realTimeData[selectedCoin + "_KRW"]?.priceDirection ?? "same";

// 주문 가격/수량/간편주문 금액
const [orderPrice, setOrderPrice] = useState(0);
const [orderQty, setOrderQty] = useState(0);        // 일반 탭에서 사용 (필수는 아님)
const [quickAmount, setQuickAmount] = useState(0);  // 간편주문 총액(KRW)

// 예시용 잔고 (나중에 API로 바꾸면 됨)
const [availableKrw, setAvailableKrw] = useState(1_000_000);

// 종목/현재가 변할 때 주문가격 동기화
useEffect(() => {
  setOrderPrice(currentPriceKRW);
}, [currentPriceKRW, selectedCoin]);

const formatKRW = (n) => (Number.isFinite(n) ? n.toLocaleString() : "-");


// 현재가로 orderPrice 자동 동기화 (실시간 우선)
useEffect(() => {
  const rt = realTimeData[selectedCoin + "_KRW"]?.closePrice;
  const latest = rt ? parseInt(rt, 10)
    : (updatedCoinList.find(c => c.symbol === selectedCoin)?.price || 0);
  setOrderPrice(latest);
}, [selectedCoin, realTimeData, updatedCoinList]);

// 총액 자동 계산
const totalAmountKRW = useMemo(
  () => Math.floor((orderPrice || 0) * (orderQty || 0)),
  [orderPrice, orderQty]
);

// 거래내역 서브탭 상태
const [historyTab, setHistoryTab] = useState("미체결");

// (데모) 미체결/체결 리스트 — 나중에 API 결과로 교체하면 됨
const openOrders = useMemo(() => ([
  { id: 1, t: "12:10:11", side: "매수", qty: "0.005", price: "163,210,000" },
  { id: 2, t: "12:03:22", side: "매도", qty: "0.002", price: "163,230,000" },
]), []);

const filledOrders = useMemo(() => ([
  { id: 11, t: "12:01:02", side: "매수", qty: "0.003", price: "163,200,000" },
  { id: 12, t: "11:58:45", side: "매도", qty: "0.001", price: "163,180,000" },
]), []);

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
          <div className="flex flex-col items-center py-4 px-2 gap-2 bg-gray-50 border-r" style={{ height: 100 }}>
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
            <Card className="flex flex-col" style={{ height: 1100 }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="코인명/심볼검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 flex-1 border rounded px-2"
                    autoComplete="off"
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
                          <label htmlFor="showKRWVolume" className="text-xs">거래대금 KRW 환산 가격 표시<br/>(BTC 마켓만 적용)</label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" style={{ textAlign: 'center' }}>
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="원화" className="text-xs">원화</TabsTrigger>
                    <TabsTrigger value="BTC" className="text-xs">BTC</TabsTrigger>
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
                ) : filteredCoinList.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">코인 목록이 없습니다.</div>
                ) : (
                  filteredCoinList.map((coin, index) => (
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
                            {/* 🚨 실시간 표시: BTC마켓은 _BTC, KRW마켓은 _KRW */}
                            {realTimeData[coin.symbol + (activeTab === 'BTC' ? '_BTC' : '_KRW')] && (
                              <span className="ml-1 text-green-500 text-[8px]">●</span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-[11px]">{coin.symbol}/{activeTab === 'BTC' ? 'BTC' : 'KRW'}</div>
                        </div>
                      </div>
                      {/* 현재가 */}
                      <div
                        className={`text-right font-mono font-semibold text-base ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''} ${highlighted[coin.symbol]?.priceHL ? 'bg-blue-100 transition-all duration-300' : ''}`}
                        style={{ transition: 'background 0.3s' }}
                      >
                        {coin.price !== 0 ? coin.price.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '-'}
                      </div>
                      {/* 전일대비 */}
                      <div className={`text-right font-semibold ${coin.trend === 'up' ? 'text-red-600' : 'text-blue-600'} ${highlighted[coin.symbol]?.changeHL ? 'bg-amber-50 transition-all duration-300' : ''}`}
                        style={{ transition: 'background 0.3s' }}
                      >
                        <div>{coin.trend === 'up' ? '+' : ''}{coin.change !== 0 ? coin.change.toFixed(2) : '0.00'}%</div>
                        <div className="text-xs">
                          {coin.changeAmount > 0 ? '+' : ''}
                          {coin.changeAmount !== 0 ? coin.changeAmount.toLocaleString() : '0'}
                        </div>
                      </div>
                      {/* 거래대금 */}
                      <div
                        className={`text-right text-xs ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''}`}
                      >
                        {coin.volume !== '' ? coin.volume : '-'}
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
                symbol={`${selectedCoin}/${activeTab === 'BTC' ? 'BTC' : 'KRW'}`}
                koreanName={updatedCoinList.find(c => c.symbol === selectedCoin)?.name || selectedCoin}
                height={combinedHeight}
                theme="light"
                realTimeData={realTimeData[selectedCoin + (activeTab === 'BTC' ? '_BTC' : '_KRW')]}
                currentPrice={realTimeData[selectedCoin + (activeTab === 'BTC' ? '_BTC' : '_KRW')]?.closePrice
                  ? parseInt(realTimeData[selectedCoin + (activeTab === 'BTC' ? '_BTC' : '_KRW')].closePrice)
                  : updatedCoinList.find(c => c.symbol === selectedCoin)?.price || 163172000
                }
                market={activeTab}
              />
            ) : (
              <CoinInfoPanel 
                coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]} 
                realTimeData={realTimeData[selectedCoin + (activeTab === 'BTC' ? '_BTC' : '_KRW')]}
                market={activeTab}
              />
            )}
          </div>
          {/* 하단: 오더북/체결강도/정보패널/주문 (이미지와 동일하게 4단 배치) */}
          <div className="w-full flex flex-row" style={{ height: 600, marginTop: '10px' }}>
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
            <div className="flex-1 flex flex-col bg-white px-6 py-4 overflow-auto">
              {/* 탭 헤더 */}
              <div className="flex border-b border-gray-200 mb-4">
                {["매수", "매도", "간편주문", "거래내역"].map((t) => (
                  <button
                    key={t}
                    className={`flex-1 py-2 text-sm ${
                      orderTab === t
                        ? "border-b-2 border-blue-500 text-blue-600 font-semibold"
                        : "text-gray-500"
                    }`}
                    onClick={() => setOrderTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* 매수/매도 탭 공통 */}
              {orderTab === "매수" || orderTab === "매도" ? (
                <>
                  {/* 주문유형 */}
                  <div className="flex items-center gap-4 mb-3">
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

                  
                  {/* 가격 */}
                  <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                    <span>{orderTab === "매도" ? "매도가격 (KRW)" : "매수가격 (KRW)"}</span>
                    <span
                      className={[
                        "ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] border",
                        priceDir === "up" ? "text-red-600 border-red-200 bg-red-50"
                        : priceDir === "down" ? "text-blue-600 border-blue-200 bg-blue-50"
                        : "text-gray-600 border-gray-200 bg-gray-50"
                      ].join(" ")}
                      title="실시간 현재가"
                    >
                      현재가 {formatKRW(currentPriceKRW)} KRW
                      {priceDir === "up" && <span className="ml-1">▲</span>}
                      {priceDir === "down" && <span className="ml-1">▼</span>}
                    </span>
                  </div>

                  <div className="flex items-center border rounded h-10">
                    <input
                      type="text"
                      value={formatKRW(orderPrice)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setOrderPrice(raw ? parseInt(raw, 10) : 0);
                      }}
                      className="flex-1 px-2 border-0 bg-transparent text-right font-semibold focus:outline-none"
                    />
                    <button className="w-8 h-8 text-gray-400" type="button"
                            onClick={() => setOrderPrice(p => Math.max(0, p - 100))}>-</button>
                    <button className="w-8 h-8 text-gray-400" type="button"
                            onClick={() => setOrderPrice(p => p + 100)}>+</button>
                  </div>

                  {/* 수량 */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold mb-1">주문수량 (BTC)</div>
                    <input
                      type="text"
                      value={orderQty ? orderQty : ""}               // 비어 있으면 빈칸
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, ""); // 숫자/소수점만 허용
                        setOrderQty(v === "" ? 0 : Number(v));
                      }}
                      placeholder="0"
                      className="w-full border rounded h-10 px-2 mb-2"
                    />
                    <div className="flex gap-2">
                      <button className="flex-1 border rounded py-1 text-xs" type="button" onClick={() => setOrderQty(q => Number(((q||0)+0.1).toFixed(6)))}>+0.1</button>
                      <button className="flex-1 border rounded py-1 text-xs" type="button" onClick={() => setOrderQty(q => Number(((q||0)+0.25).toFixed(6)))}>+0.25</button>
                      <button className="flex-1 border rounded py-1 text-xs" type="button" onClick={() => setOrderQty(q => Number(((q||0)+0.5).toFixed(6)))}>+0.5</button>
                      <button className="flex-1 border rounded py-1 text-xs" type="button" onClick={() => setOrderQty(0)}>초기화</button>
                    </div>
                  </div>

                  {/* 총액(표시용) */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold mb-1">주문총액 (KRW)</div>
                      <input
                        type="text"
                        readOnly
                        value={formatKRW(totalAmountKRW)}
                        className="w-full border rounded h-10 px-2 bg-gray-50"
                      />
                    </div>

                  {/* ✅ 매수/매도 탭별 버튼 */}
                  {orderTab === "매수" && (
                    <button
                      className="w-full h-11 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:opacity-90"
                      type="button"
                      onClick={() => console.log("매수 전송")}
                    >
                      매수
                    </button>
                  )}
                  {orderTab === "매도" && (
                    <button
                      className="w-full h-11 rounded-md bg-red-600 text-white text-sm font-semibold hover:opacity-90"
                      type="button"
                      onClick={() => console.log("매도 전송")}
                    >
                      매도
                    </button>
                  )}

                  <div className="text-[11px] text-gray-400 mt-3">
                    * 최소주문금액 : KRW · 수수료(부가세 포함) : -%
                  </div>
                </>
              ) : null}

              {/* 간편주문 */}
              {orderTab === "간편주문" && (
                <div className="flex flex-col gap-4">
                  <div className="text-xs text-gray-500">
                    원하는 비율을 선택하고 즉시 주문하세요.
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {["10%", "25%", "50%", "75%", "100%"].map(p => (
                      <button key={p} className="border rounded py-2 text-xs hover:bg-gray-50">
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 h-11 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:opacity-90">
                      매수
                    </button>
                    <button className="flex-1 h-11 rounded-md bg-red-600 text-white text-sm font-semibold hover:opacity-90">
                      매도
                    </button>
                  </div>
                </div>
              )}

              {/* 거래내역 */}
                {orderTab === "거래내역" && (
                  <div className="text-xs">
                    {/* 미체결 / 체결 토글 */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-md border text-xs ${
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
                        className={`px-3 py-1 rounded-md border text-xs ${
                          historyTab === "체결"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "text-gray-600 border-gray-200"
                        }`}
                        onClick={() => setHistoryTab("체결")}
                      >
                        체결
                      </button>
                    </div>

                    {/* 리스트 */}
                    <div className="border rounded">
                      <div className="grid grid-cols-4 p-2 font-semibold bg-gray-50 border-b">
                        <div>시간</div>
                        <div>구분</div>
                        <div>수량(BTC)</div>
                        <div className="text-right">가격(KRW)</div>
                      </div>

                      {(historyTab === "미체결" ? openOrders : filledOrders).map((r) => (
                        <div key={r.id} className="grid grid-cols-4 p-2 border-b last:border-b-0">
                          <div>{r.t}</div>
                          <div className={r.side === "매수" ? "text-emerald-600" : "text-red-600"}>{r.side}</div>
                          <div>{r.qty}</div>
                          <div className="text-right">{r.price}</div>
                        </div>
                      ))}

                      {(historyTab === "미체결" ? openOrders : filledOrders).length === 0 && (
                        <div className="p-4 text-center text-gray-400">내역이 없습니다.</div>
                      )}
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

export default TradingInterface;