"use client"
import React from "react";

import { useState, useEffect, useMemo, useRef } from "react"
import { fetchUpbitAssetInfo } from "../utils/upbit-asset-info"
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
import axios from "axios"

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

//거래 관련
const TRADE_API = "http://localhost:8080/api/trade";

// 🎯 CoinCap API 전용 데이터 fetcher
const fetchCoinCapData = async (symbol) => {
 try {
   // 캐시 확인
   const cached = getCachedCoinData(symbol);
   if (cached) {
     console.log(`✅ ${symbol} 캐시된 데이터 사용`);
     return cached;
   }

   console.log(`📊 ${symbol} CoinCap 상세 데이터 요청 중...`);

   const response = await fetch(`http://localhost:8000/api/coincap/coin/${symbol}`);
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


// 🎯 로컬 폴백 데이터 생성
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

const UpbitProjectIntro = ({ coin, coinDetail, getKoreanName }) => {
  const [upbitDesc, setUpbitDesc] = useState(""); // ✅ let 제거
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setUpbitDesc("");
    
    fetchUpbitAssetInfo(coin.symbol)
      .then((desc) => {
        if (!ignore) {
          setUpbitDesc(desc);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    
    return () => { ignore = true; };
  }, [coin.symbol]);

  const rawDesc = upbitDesc && upbitDesc.trim()
    ? upbitDesc.trim()
    : (coinDetail?.description || `${getKoreanName()}은 혁신적인 블록체인 기술을 활용한 디지털 자산 프로젝트입니다.`);
  
  const desc = rawDesc.length > 500 ? rawDesc.slice(0, 500) + "..." : rawDesc;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        🔍 {getKoreanName()} 프로젝트 소개
      </h3>
      <p className="text-gray-700 leading-relaxed text-lg">
        {loading ? "불러오는 중..." : desc}
      </p>
    </div>
  );
};

/*
// 자동 심볼-ID 매핑 캐시
let symbolToIdCache = {};
let cacheExpiry = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간


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
  'BTC': 'bg-gray-400',
  'ETH': 'bg-gray-400',
  'XRP': 'bg-gray-400',
  'ADA': 'bg-gray-400',
  'SOL': 'bg-gray-400',
  'DOGE': 'bg-gray-400'
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

// CoinCap API로 시가총액 순위와 변동률 보강
const fetchCoinCapData = async (symbol) => {
  const id = symbolToCoinCapId[symbol.toUpperCase()];
  if (!id) return {};
  try {
    const response = await fetch(`https://api.coincap.io/v2/assets/${id}`);
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.data.name,
        symbol: data.data.symbol,
        market_cap_rank: parseInt(data.data.rank) || 100,
        price_change_24h: parseFloat(data.data.changePercent24Hr) || 0,
        market_cap: parseFloat(data.data.marketCapUsd) * 1300 || 0, // USD to KRW 환산
        volume_24h: parseFloat(data.data.volumeUsd24Hr) * 1300 || 0,
        current_price: parseFloat(data.data.priceUsd) * 1300 || 0,
        circulating_supply: parseFloat(data.data.supply) || 0,
        max_supply: parseFloat(data.data.maxSupply) || 0
      };
    }
  } catch (error) {
    console.warn('CoinCap API 오류:', error);
  }
  return {};
};

// ✅ CryptoCompare API 사용 (무료 제한 없음)
const fetchSingleCoinData = async (symbol) => {
  try {
    // 캐시 확인
    const cached = getCachedCoinData(symbol);
    if (cached) {
      console.log(`✅ ${symbol} 캐시된 데이터 사용`);
      return cached;
    }

    console.log(`📊 ${symbol} CryptoCompare 데이터 요청 중...`);

    // CryptoCompare API 호출 (무료, 제한 없음)
    const [priceResponse, detailResponse] = await Promise.all([
      fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=KRW,USD`),
      fetch(`https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${symbol}&tsym=KRW`)
    ]);

    if (!priceResponse.ok || !detailResponse.ok) {
      console.warn(`⚠️ CryptoCompare API 오류, 폴백 데이터 사용`);
      return createFallbackData(symbol);
    }

    const priceData = await priceResponse.json();
    const detailData = await detailResponse.json();

    console.log(`✅ ${symbol} CryptoCompare 데이터 로드 완료`);

    const coinInfo = detailData.Data?.[0]?.CoinInfo || {};
    const result = {
      id: symbol.toLowerCase(),
      name: coinInfo.FullName || get_korean_name(symbol),
      symbol: symbol.toUpperCase(),
      description: coinInfo.Description || `${get_korean_name(symbol)}은 혁신적인 블록체인 기술을 활용한 디지털 자산입니다.`,
      
      // 가격 정보 (CryptoCompare)
      current_price: priceData.KRW || 0,
      market_cap: coinInfo.TotalCoinSupply ? (priceData.KRW * coinInfo.TotalCoinSupply) : 0,
      market_cap_rank: coinInfo.SortOrder || 100,
      
      // 공급량 정보
      total_supply: coinInfo.TotalCoinSupply || 0,
      circulating_supply: coinInfo.TotalCoinSupply || 0,
      max_supply: coinInfo.MaxSupply || coinInfo.TotalCoinSupply || 0,
      
      // 점수 (기본값)
      coingecko_score: 60,
      developer_score: 60,
      community_score: 60,
      
      // 가격 변동 (CryptoCompare 별도 API 필요하므로 기본값)
      price_change_24h: 0,
      price_change_7d: 0,
      price_change_30d: 0,
      price_change_1y: 0,
      
      // 24시간 고가/저가 (기본값)
      high_24h: priceData.KRW ? priceData.KRW * 1.05 : 0,
      low_24h: priceData.KRW ? priceData.KRW * 0.95 : 0,
      
      // ATH/ATL (기본값)
      ath: priceData.KRW ? priceData.KRW * 2 : 0,
      ath_date: '2024-01-01T00:00:00.000Z',
      atl: priceData.KRW ? priceData.KRW * 0.5 : 0,
      atl_date: '2023-01-01T00:00:00.000Z',
      
      // 거래량 (기본값)
      total_volume: priceData.KRW ? priceData.KRW * 1000000 : 0,
      market_cap_change_24h: 0,
      
      // 카테고리
      categories: coinInfo.Technology ? [coinInfo.Technology] : ['blockchain'],
      
      // 링크
      homepage: coinInfo.WebsiteUrl || '',
      whitepaper: '',
      twitter_screen_name: '',
      repos_url: '',
      
      // 커뮤니티 (기본값)
      facebook_likes: 10000,
      twitter_followers: 50000,
      reddit_subscribers: 25000,
      telegram_channel_user_count: 15000,
      
      // 개발자 (기본값)
      forks: 100,
      stars: 500,
      subscribers: 200,
      total_issues: 50,
      closed_issues: 45,
      
      sparkline: []
    };

    // 캐시에 저장
    setCachedCoinData(symbol, result);
    return result;
    
  } catch (error) {
    console.error(`❌ ${symbol} CryptoCompare 데이터 조회 실패:`, error);
    return createFallbackData(symbol);
  }
};
*/

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
const CoinInfoPanel = ({ coin, realTimeData }) => {
  const [coinDetail, setCoinDetail] = useState(null);
  const [upbitData, setUpbitData] = useState(null);
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

  // 한국어 이름 우선순위: 업비트 > 기본 매핑 > 영어명
  const getKoreanName = () => {
    if (upbitData?.korean_name) return upbitData.korean_name;
    if (coin.name && coin.name !== coin.symbol) return coin.name;
    if (coinDetail?.name) return coinDetail.name;
    return coin.symbol;
  };

  const getCurrentPrice = () => {
    if (realTimeData && realTimeData.closePrice) {
      return parseInt(realTimeData.closePrice);
    }
    if (coinDetail && coinDetail.current_price) {
      return coinDetail.current_price;
    }
    return coinDetail ? coinDetail.current_price : coin.price;
  };

  const getCurrentChange = () => {
    if (realTimeData && realTimeData.chgRate) {
      return parseFloat(realTimeData.chgRate);
    }
    if (coinDetail && coinDetail.price_change_24h) {
      return coinDetail.price_change_24h;
    }
    return coin.change;
  };

// ✅ 데이터 처리 함수 분리
const processcoinDetail = (data) => {
  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol.toUpperCase(),
    description: data.description?.ko || data.description?.en || '설명이 없습니다.',
    genesis_date: data.genesis_date,
    market_cap_rank: data.market_cap_rank,
    coingecko_score: data.coingecko_score,
    developer_score: data.developer_score,
    community_score: data.community_score,
    current_price: data.market_data?.current_price?.krw || 0,
    market_cap: data.market_data?.market_cap?.krw || 0,
    market_cap_change_24h: data.market_data?.market_cap_change_percentage_24h || 0,
    total_supply: data.market_data?.total_supply || 0,
    circulating_supply: data.market_data?.circulating_supply || 0,
    max_supply: data.market_data?.max_supply,
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
    total_volume: data.market_data?.total_volume?.krw || 0,
    categories: data.categories || [],
    homepage: data.links?.homepage?.[0] || '',
    whitepaper: data.links?.whitepaper || '',
    twitter_screen_name: data.links?.twitter_screen_name || '',
    repos_url: data.links?.repos_url?.github?.[0] || '',
    facebook_likes: data.community_data?.facebook_likes || 0,
    twitter_followers: data.community_data?.twitter_followers || 0,
    reddit_subscribers: data.community_data?.reddit_subscribers || 0,
    telegram_channel_user_count: data.community_data?.telegram_channel_user_count || 0,
    forks: data.developer_data?.forks || 0,
    stars: data.developer_data?.stars || 0,
    subscribers: data.developer_data?.subscribers || 0,
    total_issues: data.developer_data?.total_issues || 0,
    closed_issues: data.developer_data?.closed_issues || 0,
    sparkline: data.market_data?.sparkline_7d?.price || []
  };
};

// ✅ 한국어 코인명 매핑 함수 추가

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
    const marketCap = coinDetail.market_cap;
    
    if (!volume24h || !marketCap) return '데이터 부족';
    
    const ratio = volume24h / marketCap;
    
    if (ratio > 0.1) return '🔥 매우 활발';
    if (ratio > 0.05) return '🚀 활발';
    if (ratio > 0.02) return '📈 보통';
    if (ratio > 0.01) return '📉 저조';
    return '😴 매우 저조';
  };

  const getDeveloperActivity = () => {
    if (!coinDetail || !coinDetail.developer_score) return '분석중';
    
    const score = coinDetail.developer_score;
    if (score > 80) return '🏆 매우 활발';
    if (score > 60) return '💪 활발';
    if (score > 40) return '🔧 보통';
    if (score > 20) return '⏰ 저조';
    return '😴 매우 저조';
  };

  const getCommunityStrength = () => {
    if (!coinDetail) return '분석중';
    
    const score = coinDetail.community_score || 0;
    const twitterFollowers = coinDetail.twitter_followers || 0;
    const redditSubscribers = coinDetail.reddit_subscribers || 0;
    
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
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                    ● 실시간 연동
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                  글로벌 #{coinDetail?.market_cap_rank ? coinDetail.market_cap_rank : '미제공'}위
                </span>
                {upbitData?.market_warning !== 'NONE' && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                    ⚠️ 투자유의
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 현재 가격 & 투자 등급 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="text-sm text-emerald-700 font-medium mb-2">💰 현재 가격</div>
              <div className="text-3xl font-bold text-emerald-900 mb-2">
                {getCurrentPrice().toLocaleString()}원
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getCurrentChange() > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {typeof getCurrentChange() === 'number'
                    ? (getCurrentChange() > 0 ? '📈 +' : '📉 ') + getCurrentChange().toFixed(2) + '%'
                    : '미제공'}
                </span>
                {realTimeData?.chgAmt && (
                  <span className="text-sm text-gray-600">
                    ({realTimeData.chgAmt > 0 ? '+' : ''}{parseInt(realTimeData.chgAmt).toLocaleString()}원)
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
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
            <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-xs text-blue-700 mb-1">시가총액</div>
              <div className="text-lg font-bold text-blue-900">
                {coinDetail?.market_cap ? formatLargeNumber(coinDetail.market_cap) + '원' : '미제공'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
              <div className="text-2xl mb-2">💸</div>
              <div className="text-xs text-green-700 mb-1">24시간 거래량</div>
              <div className="text-sm font-bold text-green-900">
                {coinDetail?.total_volume ? formatLargeNumber(coinDetail.total_volume) + '원' : '미제공'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-xs text-purple-700 mb-1">개발 활동</div>
              <div className="text-sm font-bold text-purple-900">{getDeveloperActivity()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-xs text-orange-700 mb-1">커뮤니티</div>
              <div className="text-sm font-bold text-orange-900">{getCommunityStrength()}</div>
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
                  ? 'text-gray-700 border-b-2 border-gray-400 bg-gray-50' 
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
              {/* 프로젝트 소개 (Upbit API 우선) */}
              <UpbitProjectIntro 
                coin={coin} coinDetail={coinDetail} getKoreanName={getKoreanName} 
              />

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-green-700 mb-2">🎂 출시일</div>
                    <div className="text-lg font-bold text-green-900">
                      {coinDetail?.genesis_date ? new Date(coinDetail.genesis_date).toLocaleDateString() : '미제공'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-blue-700 mb-2">🏆 글로벌 순위</div>
                    <div className="text-lg font-bold text-blue-900">
                      #{coinDetail?.market_cap_rank || '미제공'}위
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-yellow-700 mb-2">💎 순환 공급량</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {coinDetail?.circulating_supply && coinDetail.circulating_supply > 0 
                        ? formatSupply(coinDetail.circulating_supply) + ' ' + coin.symbol 
                        : '미제공'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <div className="text-sm text-red-700 mb-2">📦 최대 공급량</div>
                    <div className="text-lg font-bold text-red-900">
                      {coinDetail?.max_supply && coinDetail.max_supply > 0 
                        ? formatSupply(coinDetail.max_supply) + ' ' + coin.symbol 
                        : '무제한'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 주요 활용 분야 */}
              {coinDetail?.categories && coinDetail.categories.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 주요 활용 분야</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {coinDetail.categories.slice(0, 6).map((category, index) => (
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
                      {coinDetail?.market_cap ? formatLargeNumber(coinDetail.market_cap) + '원' : '미제공'}
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

     {/* 🔗 공식 링크 */}
     {(coinDetail?.homepage || coinDetail?.whitepaper || coinDetail?.twitter_screen_name) && (
  <div className="bg-white m-4 rounded-2xl shadow-xl border border-gray-100">
         <div className="p-6">
           <h3 className="text-xl font-bold text-gray-900 mb-4">🔗 공식 정보 및 링크</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {coinDetail.homepage && (
               <a href={coinDetail.homepage} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                 <span className="text-sky-600 text-2xl">🌐</span>
                 <div>
                   <div className="font-bold text-gray-800">공식 웹사이트</div>
                   <div className="text-sky-600 text-sm break-all">{coinDetail.homepage}</div>
                 </div>
               </a>
             )}
             
             {coinDetail.whitepaper && (
               <a href={coinDetail.whitepaper} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                 <span className="text-gray-400 text-2xl">📄</span>
                 <div>
                   <div className="font-bold text-gray-800">백서 (Whitepaper)</div>
                   <div className="text-gray-500 text-sm">기술 문서 및 로드맵</div>
                 </div>
               </a>
             )}
             
             {coinDetail.twitter_screen_name && (
               <a href={`https://twitter.com/${coinDetail.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                 <span className="text-sky-600 text-2xl">🐦</span>
                 <div>
                   <div className="font-bold text-gray-800">공식 트위터</div>
                   <div className="text-sky-600 text-sm">@{coinDetail.twitter_screen_name}</div>
                 </div>
               </a>
             )}
             
             {coinDetail.repos_url && (
               <a href={coinDetail.repos_url} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                 <span className="text-gray-400 text-2xl">💻</span>
                 <div>
                   <div className="font-bold text-gray-800">GitHub 저장소</div>
                   <div className="text-gray-500 text-sm">소스 코드 및 개발 현황</div>
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
           📡 <span className="font-semibold">실시간</span>: 빗썸 + 업비트 • <span className="font-semibold">분석</span>: CryptoCompare • <span className="font-semibold">한국어</span>: 다중 API 통합
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
  //사용자 id 추출
  //const [user_id, setUserId] = useState(null);
  const [user_id, setUserId] = useState(null);

//======== 사용자 ID 가져오기========
// useEffect(() => {
// //토큰값을 빼 user_mail변수에 저장
// const tokenValue = sessionStorage.getItem("auth_token");
// if (tokenValue) {
//   const payload = JSON.parse(atob(tokenValue.split('.')[1]));
//   const user_mail = payload.email || payload.sub || null;
// //이메일 값 확인
//   console.log("이메일:", user_mail);
// //이메일값 정상적으로 들어왔을때 id값 반환 응답 백엔드 url 호출()
//     if (user_mail) {
//     fetch(`http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`)
//       .then(res => res.json())
//       .then(data => {
//       if(data && data.user_id != null) {
//       setUserId(Number(data.user_id));//user_id의 값을 data.user_id로 업데이트
//       }
//       })
//       .catch(err => console.error(err));
//   }
// }
// }, []);

// ======== 사용자 ID 가져오기 (가볍게) ========
useEffect(() => {
  // 0) 캐시가 있으면 바로 반영 → 초기 렌더 가벼움
  const cached = sessionStorage.getItem("cached_user_id");
  if (cached && user_id == null) setUserId(Number(cached));

  // 1) 토큰 파싱(기존 그대로)
  const tokenValue = sessionStorage.getItem("auth_token");
  if (!tokenValue) return;

  let payload = null;
  try {
    payload = JSON.parse(atob(tokenValue.split(".")[1]));
  } catch (_) {
    return; // 잘못된 토큰이면 종료
  }

  const user_mail = payload.email || payload.sub || null;
  if (!user_mail) return;

  // 2) 언마운트/중복 방지
  let mounted = true;
  const controller = new AbortController();
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));

  // 3) 유휴 시간에 네트워크 요청 실행
  idle(() => {
    if (!mounted) return;
    fetch(
      `http://localhost:8080/api/mypage/user-id?email=${encodeURIComponent(user_mail)}`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!mounted) return;
        if (data && data.user_id != null) {
          const idNum = Number(data.user_id);
          setUserId(idNum);
          sessionStorage.setItem("cached_user_id", String(idNum)); // 다음 진입 가속화
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      });
  });

  // 4) 정리
  return () => {
    mounted = false;
    controller.abort();
  };
}, []);

//=======매도 매수 관련
  const [assetId, setAssetId] = useState("");  // 숫자 ID (예: BTC의 asset_id)
  const [price, setPrice]   = useState("");    // 현재가 (시장가를 서버결정으로 바꾸면 안보내도 됨)
  const [qty, setQty]       = useState("");    // 수량
  const [tradingLoading, setTradingLoading] = useState(false); // 이 줄 추가
  const USER_ID = user_id; // 이 줄 추가

  const total = useMemo(() => {
    const q = parseFloat(qty || "0");
    const p = parseFloat(price || "0");
    if (!isFinite(q * p)) return 0;
    return q * p;
  }, [qty, price]);

  // 주문 성공 후 마이페이지가 즉시 갱신되도록 브로드캐스트
  const refreshPortfolio = async () => {
    try {
      const [h, k, t] = await Promise.all([
        axios.get(`${TRADE_API}/holdings`,    { params: { user_id: USER_ID } }),
        axios.get(`${TRADE_API}/krw_balance`, { params: { user_id: USER_ID } }),
        axios.get(`${TRADE_API}/trades`,      { params: { user_id: USER_ID } }),
      ]);
      window.dispatchEvent(
        new CustomEvent("portfolio:updated", {
          detail: { holdings: h.data, krw: k.data?.krw, trades: t.data },
        })
      );
    } catch (e) {
      console.error("포트폴리오 리프레시 실패", e);
    }
  };

  const guard = () => {
    if (!assetId) return "assetId(자산 ID)를 입력하세요.";
    if (!qty) return "수량(qty)을 입력하세요.";
    if (!price) return "가격(price)을 입력하세요.";
    return null;
  };

  // ✅ await 붙는 자리: 버튼 핸들러 내부
  const handleBuy = async () => {
    const msg = guard();
    if (msg) return alert(msg);
    try {
      setTradingLoading(true);
      const body = {
        // PlaceOrderRequest 그대로 사용
        user_id: USER_ID,
        asset_id: Number(assetId),
        amount: qty,   // 문자열 OK (서버 BigDecimal)
        price: price,  // 서버가 가격결정이면 이 필드 제거 가능
      };
      const { data } = await axios.post(`${TRADE_API}/market_buy`, body);
      alert(`매수 체결! 주문번호 ${data.order_id}`);
      await refreshPortfolio();
      setQty("");
    } catch (e) {
      alert(e.response?.data?.error ?? "매수 실패");
    } finally {
      setTradingLoading(false);
    }
  };

  const handleSell = async () => {
    const msg = guard();
    if (msg) return alert(msg);
    try {
      setTradingLoading(true);
      const body = {
        user_id: USER_ID,
        asset_id: Number(assetId),
        amount: qty,
        price: price,
      };
      const { data } = await axios.post(`${TRADE_API}/market_sell`, body);
      alert(`매도 체결! 주문번호 ${data.order_id}`);
      await refreshPortfolio();
      setQty("");
    } catch (e) {
      alert(e.response?.data?.error ?? "매도 실패");
    } finally {
      setTradingLoading(false);
    }
  };

  //=======


  // Responsive height: Coin list matches main chart+order book+order panel area (red box)
  const mainPanelRef = useRef(null);
  const [combinedHeight, setCombinedHeight] = useState(600);

  // TradingInterface 컴포넌트 내부에 추가


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
  const [selectedCoin, setSelectedCoin] = useState("BTC"); // 기본값을 비트코인으로
  // activeTab 상태 제거: 오직 원화 마켓만 사용
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

  // WebSocket 통계 가져오기 404 에러 이거 필요한 건지 확인해야함.
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
  const [coinListLoading, setCoinListLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

    // 라인 ~1150 부분 교체
    useEffect(() => {
      const fetchCoins = async () => {
        try {
          setCoinListLoading(true);
          setFetchError("");
          console.log(`🔄 원화 마켓 코인 목록 요청...`);
          const apiUrl = 'http://localhost:8000/api/coins';
          console.log(`📡 API URL: ${apiUrl}`);
          const response = await fetch(apiUrl);
          console.log(`📊 Response status: ${response.status}`);
          const data = await response.json();       
          console.log('📦 API Response data:', data);
          console.log('📦 First 3 coins:', data.data?.slice(0, 3));
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
              marketWarning: coin.market_warning || 'NONE'
            }));
            setCoinList(mappedCoins);
            console.log('💪 coinList 업데이트 완료, 길이:', mappedCoins.length);
          } else {
            console.error('❌ API 응답 구조 오류:', data);
          }
        } catch (e) {
          console.error(`❌ 원화 마켓 조회 실패:`, e);
        } finally {
          setCoinListLoading(false);
        }
      };
      fetchCoins();
    }, []);

  // 실시간 데이터 업데이트 부분 useMemo로 최적화
  // 오직 WebSocket 실시간 데이터만 사용 (초기값 무시)
  // 가격 하이라이트 상태 관리
  // 하이라이트 상태 관리 (현재가: 파랑, 전일대비: 베이지)
  const [highlighted, setHighlighted] = useState({});
  const highlightedRef = React.useRef(highlighted);
  React.useEffect(() => { highlightedRef.current = highlighted; }, [highlighted]);
  // 코인별 하이라이트 타이머 관리
  const highlightTimeouts = React.useRef({});

  useEffect(() => {
    coinList.forEach(coin => {
      const realtimeKey = coin.symbol + '_KRW';
      const realtimeInfo = realTimeData[realtimeKey];
      if (realtimeInfo && !isNaN(realtimeInfo.closePrice)) {
        const price = parseInt(realtimeInfo.closePrice);
        const change = parseFloat(realtimeInfo.chgRate);
        const changeAmount = parseInt(realtimeInfo.chgAmt);
        // priceHL: 값이 바뀌면 무조건 true로 만들고, 타이머도 무조건 새로 건다
        if (highlightedRef.current[coin.symbol]?.price !== price) {
          setHighlighted(prev => ({
            ...prev,
            [coin.symbol]: {
              ...prev[coin.symbol],
              priceHL: true,
              price,
            }
          }));
          if (highlightTimeouts.current[coin.symbol]?.price) {
            clearTimeout(highlightTimeouts.current[coin.symbol].price);
          }
          highlightTimeouts.current[coin.symbol] = highlightTimeouts.current[coin.symbol] || {};
          highlightTimeouts.current[coin.symbol].price = setTimeout(() => {
            setHighlighted(prev2 => ({
              ...prev2,
              [coin.symbol]: {
                ...prev2[coin.symbol],
                priceHL: false,
                price,
              }
            }));
            highlightTimeouts.current[coin.symbol].price = null;
          }, 1000);
        }
        // changeHL: 값이 바뀌면 무조건 true로 만들고, 타이머도 무조건 새로 건다
        if (highlightedRef.current[coin.symbol]?.change !== change || highlightedRef.current[coin.symbol]?.changeAmount !== changeAmount) {
          setHighlighted(prev => ({
            ...prev,
            [coin.symbol]: {
              ...prev[coin.symbol],
              changeHL: true,
              change,
              changeAmount,
            }
          }));
          if (highlightTimeouts.current[coin.symbol]?.change) {
            clearTimeout(highlightTimeouts.current[coin.symbol].change);
          }
          highlightTimeouts.current[coin.symbol] = highlightTimeouts.current[coin.symbol] || {};
          highlightTimeouts.current[coin.symbol].change = setTimeout(() => {
            setHighlighted(prev2 => ({
              ...prev2,
              [coin.symbol]: {
                ...prev2[coin.symbol],
                changeHL: false,
                change,
                changeAmount,
              }
            }));
            highlightTimeouts.current[coin.symbol].change = null;
          }, 1000);
        }
      }
    });
    // 언마운트 시 모든 타이머 클리어
    return () => {
      Object.values(highlightTimeouts.current).forEach(obj => {
        if (obj.price) clearTimeout(obj.price);
        if (obj.change) clearTimeout(obj.change);
      });
    };
  }, [coinList, realTimeData]);

  const updatedCoinList = useMemo(() => {
    console.log('🔄 updatedCoinList 계산 중, coinList 길이:', coinList.length);
    const result = coinList.map(coin => {
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
    console.log('✅ updatedCoinList 결과 길이:', result.length);
    return result;
  }, [coinList, realTimeData]);

  // 정렬 상태 추가
  const [sortKey, setSortKey] = useState('volume');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // 정렬 핸들러
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // filteredCoinList: 검색 + 정렬
  const filteredCoinList = useMemo(() => {
    let filtered = updatedCoinList;
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filtered = updatedCoinList.filter(coin =>
        (coin.name && coin.name.toLowerCase().includes(lower)) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(lower))
      );
    }
    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      // volume은 문자열(1,234 백만)일 수 있으니 숫자만 추출
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


  // 시세/코인정보 탭 상태
  const [view, setView] = useState("chart");
  // 주문 탭 상태
  const [orderTab, setOrderTab] = useState("매수");

  // 오더북 상태 및 호가단위
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [], timestamp: null });
  const [tickSize, setTickSize] = useState(1);
  // 종목정보 상태 (24h 고가/저가/거래량 등)
  const [marketInfo, setMarketInfo] = useState({});

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

  // 종목/현재가 변할 때만 주문가격을 현재가로 동기화
  useEffect(() => {
    setOrderPrice(currentPriceKRW);
  }, [currentPriceKRW, selectedCoin]);

  const formatKRW = (n) => (Number.isFinite(n) ? n.toLocaleString() : "-");

  // 실시간 데이터/updatedCoinList가 바뀔 때마다 orderPrice를 강제로 덮어쓰지 않음

  // 총액 자동 계산
  const totalAmountKRW = useMemo(
    () => Math.floor((orderPrice || 0) * (orderQty || 0)),
    [orderPrice, orderQty]
  );

  // 거래내역 서브탭 상태
  const [historyTab, setHistoryTab] = useState("미체결");

  // 오더북/마켓정보 fetch (selectedCoin 변경 시)
  useEffect(() => {
    if (!selectedCoin) return;
    // 오더북 fetch
    fetch(`http://localhost:8000/api/orderbook/${selectedCoin}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setOrderbook({
            bids: data.data.bids || [],
            asks: data.data.asks || [],
            timestamp: data.data.timestamp || null
          });
          if (typeof data.tick_size !== 'undefined') {
            setTickSize(data.tick_size);
          } else {
            setTickSize(1);
          }
        }
      });
    // 마켓정보 fetch (24h 고가/저가/거래량 등)
    fetch(`http://localhost:8000/api/coin/${selectedCoin}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setMarketInfo(data.data);
        }
      });
  }, [selectedCoin]);

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
      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-4">
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
      </div>

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
            <Card className="flex flex-col" style={{ height: 1200 }}>
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
                </div>
              </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0" style={{ height: 600 }}>
              {/* 컬럼 헤더 (정렬 기능 + UX 개선) */}
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs font-bold text-muted-foreground border-b bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('name')}>
                  한글명
                  {sortKey === 'name' ? (
                    <span className="text-[10px] text-blue-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  ) : (
                    <span className="text-[10px] text-gray-300">△▽</span>
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
              <div className="overflow-y-auto flex-1 min-h-0" style={{ height: combinedHeight  }}>
                {coinListLoading ? (
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
                            {realTimeData[coin.symbol + '_KRW'] && (
                              <span className="ml-1 text-green-500 text-[8px]">●</span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-[11px]">{coin.symbol}/KRW</div>
                        </div>
                      </div>
                      {/* 현재가 */}
                      <div
                        className={`text-right font-mono font-semibold text-base ${selectedCoin === coin.symbol ? 'text-black dark:text-black' : ''} ${highlighted[coin.symbol]?.priceHL ? 'bg-blue-100 transition-all duration-300' : ''}`}
                        style={{ transition: 'background 0.3s' }}
                      >
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
                symbol={`${selectedCoin}/KRW`}
                koreanName={updatedCoinList.find(c => c.symbol === selectedCoin)?.name || selectedCoin}
                height={combinedHeight}
                theme="light"
                realTimeData={realTimeData[selectedCoin + '_KRW']}
                currentPrice={realTimeData[selectedCoin + '_KRW']?.closePrice
                  ? parseInt(realTimeData[selectedCoin + '_KRW'].closePrice)
                  : updatedCoinList.find(c => c.symbol === selectedCoin)?.price || 163172000
                }
                market={'KRW'}
              />
            ) : (
              <CoinInfoPanel 
                coin={coinList.find(c => c.symbol === selectedCoin) || coinList[0]} 
                realTimeData={realTimeData[selectedCoin + '_KRW']}
                market={'KRW'}
              />
            )}
          </div>
          {/* 하단: 오더북/체결강도/정보패널/주문 (이미지와 동일하게 4단 배치) */}
          {view === "chart" && (
            <div className="w-full flex flex-row" style={{ height: 600, marginTop: '70px' }}>
              {/* 오더북 (매수/매도) - 실시간 연동, 3열: [매도수량] [호가] [매수수량] */}
              <div className="flex flex-col w-[350px] border-r border-gray-200 bg-white">
                {/* 오더북 헤더 */}
                <div className="grid grid-cols-3 text-xs font-bold text-center border-b bg-gray-50 h-8 items-center">
                  <div className="text-blue-700">매도수량</div>
                  <div>호가</div>
                  <div className="text-red-700">매수수량</div>
                </div>
                {/* 매도호가: 현재가 기준 위로 9틱 */}
                {(() => {
                  const rows = [];
                  const tick = tickSize || 1;
                  const price = parseFloat(currentPriceKRW);
                  // 매도호가 10줄: 현재가보다 높은 가격부터 위로 10개
                  for (let i = 10; i >= 1; i--) {
                    const askPrice = price + i * tick;
                    let askQty = '0.000';
                    if (orderbook.asks && orderbook.asks.length > 0) {
                      const found = orderbook.asks.find(a => Math.abs(parseFloat(a.price) - askPrice) < tick/2);
                      if (found) askQty = parseFloat(found.quantity).toFixed(3);
                    }
                    const isSelected = orderPrice === askPrice && parseFloat(askQty) > 0 && askPrice > 0;
                    const isCurrentPrice = askPrice === currentPriceKRW;
                    rows.push(
                      <div
                        key={"ask-" + i}
                        className={
                          `grid grid-cols-3 text-xs h-7 items-center`
                        }
                      >
                        <div className="text-blue-700 bg-blue-100 text-left pl-2 font-mono rounded-l">{askQty}</div>
                        <div
                          className="text-center font-bold font-mono text-blue-600 bg-blue-100 cursor-pointer transition-all duration-200 hover:bg-blue-200 hover:scale-105 hover:shadow-md"
                          style={
                            isCurrentPrice
                              ? { border: 'none', outline: '3px solid gold', outlineOffset: '2px', zIndex: 3 }
                              : isSelected
                                ? { border: '2px solid #2563eb', zIndex: 2 }
                                : { border: '2px solid transparent' }
                          }
                          onClick={() => setOrderPrice(askPrice)}
                        >
                          {askPrice > 0 ? askPrice.toLocaleString() : ''}
                        </div>
                        <div className="bg-white"></div>
                      </div>
                    );
                  }
                  // 매수호가 10줄: 현재가 포함, 아래로 9개
                  for (let i = 0; i < 10; i++) {
                    const bidPrice = price - i * tick;
                    let bidQty = '0.000';
                    if (orderbook.bids && orderbook.bids.length > 0) {
                      const found = orderbook.bids.find(b => Math.abs(parseFloat(b.price) - bidPrice) < tick/2);
                      if (found) bidQty = parseFloat(found.quantity).toFixed(3);
                    }
                    // 현재가 row 강조(매수 첫줄)
                    const isCurrent = i === 0;
                    const isSelected = orderPrice === bidPrice && parseFloat(bidQty) > 0 && bidPrice > 0;
                    const isCurrentPrice = bidPrice === currentPriceKRW;
                    rows.push(
                      <div
                        key={"bid-" + i}
                        className={
                          `grid grid-cols-3 text-xs h-7 items-center`
                        }
                        // style removed: no black border for current price row
                      >
                        <div className={isCurrent ? "bg-red-100" : "bg-red-100"}></div>
                        <div
                          className={
                            `text-center font-bold font-mono cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:scale-105 hover:shadow-md` +
                            (isCurrent ? ' text-red-600 bg-red-100' : ' text-red-600 bg-red-100')
                          }
                          style={
                            isCurrentPrice
                              ? { border: 'none', outline: '3px solid gold', outlineOffset: '2px', zIndex: 3 }
                              : isSelected
                                ? { border: '2px solid #ec4899', zIndex: 2 }
                                : { border: '2px solid transparent' }
                          }
                          onClick={() => setOrderPrice(bidPrice)}
                        >
                          {bidPrice > 0 ? bidPrice.toLocaleString() : ''}
                        </div>
                        <div className={isCurrent ? "text-red-600 bg-red-100 text-right pr-2 font-mono rounded-r" : "text-red-600 bg-red-100 text-right pr-2 font-mono rounded-r"}>{bidQty}</div>
                      </div>
                    );
                  }
                  return rows;
                })()}
              </div>
              {/* 정보 패널 - 실시간 마켓정보 연동 */}
              <div className="flex flex-col w-[200px] bg-white border-r border-gray-200 px-3 py-2 text-xs justify-between">
                <div>
                  <div className="mb-2">
                    <span className="font-semibold">거래량</span>
                    <span className="float-right">{marketInfo?.units_traded ? marketInfo.units_traded.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">거래대금</span>
                    <span className="float-right">{marketInfo?.volume ? Number(marketInfo.volume).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '-'}</span>
                    <div className="text-[10px] text-gray-400">(최근24시간)</div>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">24h 최고</span>
                    <span className="float-right text-red-500">{marketInfo?.max_price ? formatKRW(marketInfo.max_price) : '-'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">24h 최저</span>
                    <span className="float-right text-blue-500">{marketInfo?.min_price ? formatKRW(marketInfo.min_price) : '-'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">전일종가</span>
                    <span className="float-right">{marketInfo?.prev_closing_price ? formatKRW(marketInfo.prev_closing_price) : '-'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">당일고가</span>
                    <span className="float-right text-red-500">{marketInfo?.max_price ? formatKRW(marketInfo.max_price) : '-'}</span>
                  </div>
                  <div>
                    <span className="font-semibold">당일저가</span>
                    <span className="float-right text-blue-500">{marketInfo?.min_price ? formatKRW(marketInfo.min_price) : '-'}</span>
                  </div>
                </div>
              </div>
              {/* 주문 영역 */}
              <div className="flex-1 flex flex-col bg-white px-6 py-4 overflow-auto">
                {/* 탭 헤더 */}
                <div className="flex border-b border-gray-200 mb-4">
                  {["매수", "매도", "거래내역"].map((t) => {
                    let activeClass = "";
                    if (orderTab === t) {
                      if (t === "매수") activeClass = "border-b-2 border-red-500 text-red-600 font-semibold";
                      else if (t === "매도") activeClass = "border-b-2 border-blue-500 text-blue-600 font-semibold";
                      else if (t === "거래내역") activeClass = "border-b-2 border-black text-black font-semibold";
                    } else {
                      activeClass = "text-gray-500";
                    }
                    return (
                      <button
                        key={t}
                        className={`flex-1 py-2 text-sm ${activeClass}`}
                        onClick={() => setOrderTab(t)}
                      >
                        {t}
                      </button>
                    );
                  })}
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
                        onClick={() => setOrderPrice(p => {
                          const n = Number(p) || 0;
                          return Math.max(0, n - (tickSize || 1));
                        })}>-</button>
                      <button className="w-8 h-8 text-gray-400" type="button"
                        onClick={() => setOrderPrice(p => {
                          const n = Number(p) || 0;
                          return n + (tickSize || 1);
                        })}>+</button>
                    </div>

                    {/* 수량 */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold mb-1">주문수량</div>
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
                        className="w-full h-11 rounded-md bg-red-600 text-white text-sm font-semibold hover:opacity-90"
                        type="button"
                        onClick={() => console.log("매수 전송")}
                      >
                        매수
                      </button>
                    )}
                    {orderTab === "매도" && (
                      <button
                        className="w-full h-11 rounded-md bg-blue-600 text-white text-sm font-semibold hover:opacity-90"
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
                          <div>수량</div>
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
          )}  
        </div>
      </div>
  </div>
  );
}

export default TradingInterface;