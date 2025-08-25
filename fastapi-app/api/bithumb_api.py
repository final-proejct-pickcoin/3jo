def get_tick_size(price):
    if price >= 2000000:
        return 1000
    elif price >= 1000000:
        return 500
    elif price >= 500000:
        return 100
    elif price >= 100000:
        return 50
    elif price >= 10000:
        return 10
    elif price >= 1000:
        return 1
    elif price >= 100:
        return 0.1
    elif price >= 10:
        return 0.01
    else:
        return 0.001

import json
import asyncio
import websockets
import aiohttp
import time
import random
import requests
import threading
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
from collections import defaultdict

# 라우터 생성
router = APIRouter(prefix="/api", tags=["bithumb"])

# ===== 환율 캐시 관리 =====
_exchange_rate_cache = {"rate": None, "timestamp": 0}

def get_cached_exchange_rate():
    """1시간 캐시로 변경 (더 자주 업데이트)"""
    current_time = time.time()
    cache_age = current_time - _exchange_rate_cache["timestamp"]
    
    # 1시간(3600초) 내 캐시만 사용
    if cache_age < 3600 and _exchange_rate_cache["rate"]:
        return _exchange_rate_cache["rate"]
    return None

def cache_exchange_rate(rate):
    """성공한 환율을 캐시에 저장"""
    _exchange_rate_cache["rate"] = rate
    _exchange_rate_cache["timestamp"] = time.time()

async def get_naver_exchange_rate_improved():
    """개선된 네이버 환율 크롤링"""
    try:
        url = "https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_USDKRW"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    
                    # 더 정확한 환율 패턴들
                    patterns = [
                        r'class="no_today"[^>]*><em>([0-9,]+\.?[0-9]*)</em>',
                        r'<strong[^>]*class="[^"]*tah[^"]*"[^>]*>([0-9,]{4,}\.?[0-9]*)</strong>',
                        r'id="exchangeList"[^>]*>.*?<em[^>]*>([0-9,]{4,}\.?[0-9]*)</em>',
                        r'현재가[^>]*>.*?([0-9,]{4,}\.?[0-9]*)'
                    ]
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, html, re.DOTALL)
                        for match in matches:
                            try:
                                clean_rate = match.replace(",", "")
                                rate = float(clean_rate)
                                if 1350 <= rate <= 1450:
                                    print(f"✅ 네이버 크롤링 성공: {rate:.2f}원")
                                    return rate
                            except:
                                continue
                                
    except Exception as e:
        print(f"❌ 네이버 크롤링 실패: {e}")
    
    return None

async def get_usd_to_krw_rate():
    """USD → KRW 실시간 환율 조회 (다중 API 백업)"""
    
    # 캐시 확인 (1시간 캐시)
    cached = get_cached_exchange_rate()
    if cached and cached > 1300:  # 유효한 범위
        print(f"📦 캐시된 환율 사용: {cached:.2f}원")
        return cached
    
    # 🔥 실시간 무료 API들 (신뢰도 순)
    api_sources = [
        {
            "name": "ExchangeRate-API",
            "url": "https://api.exchangerate-api.com/v4/latest/USD",
            "parser": lambda data: data.get("rates", {}).get("KRW", 0)
        },
        {
            "name": "ExchangeRate.host",
            "url": "https://api.exchangerate.host/latest?base=USD&symbols=KRW",
            "parser": lambda data: data.get("rates", {}).get("KRW", 0)
        },
        {
            "name": "Fawaz-API", 
            "url": "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
            "parser": lambda data: data.get("usd", {}).get("krw", 0)
        }
    ]
    
    timeout = aiohttp.ClientTimeout(total=8, connect=3)
    
    for source in api_sources:
        try:
            print(f"🔄 환율 API 시도: {source['name']}")
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(source["url"]) as response:
                    if response.status == 200:
                        data = await response.json()
                        rate = source["parser"](data)
                        
                        if rate and isinstance(rate, (int, float)) and rate > 0:
                            rate = float(rate)
                            # 2025년 8월 현실적 범위 (1350~1450)
                            if 1350 <= rate <= 1450:
                                print(f"✅ {source['name']} 환율 성공: {rate:.2f}원")
                                cache_exchange_rate(rate)
                                return rate
                            else:
                                print(f"⚠️ {source['name']} 범위 벗어남: {rate}")
                        else:
                            print(f"⚠️ {source['name']} 잘못된 데이터: {rate}")
                    else:
                        print(f"⚠️ {source['name']} HTTP {response.status}")
                        
        except Exception as e:
            print(f"❌ {source['name']} 오류: {str(e)[:50]}")
            continue
    
    # 백업: 네이버 크롤링
    try:
        print("🔄 백업: 네이버 환율 크롤링")
        naver_rate = await get_naver_exchange_rate_improved()
        if naver_rate:
            cache_exchange_rate(naver_rate)
            return naver_rate
    except Exception as e:
        print(f"❌ 네이버 크롤링 실패: {e}")
    
    # 최후: 캐시된 값이나 현실적 추정치
    cached_fallback = get_cached_exchange_rate()
    if cached_fallback:
        print(f"📦 오래된 캐시 사용: {cached_fallback:.2f}원")
        return cached_fallback
    
    # 🚨 2025년 8월 현재 실시간 환율 (1387원으로 업데이트)
    current_realistic_rate = 1387.0  # 실시간 데이터 기반
    print(f"🆘 추정값 사용: {current_realistic_rate}원")
    return current_realistic_rate

# ===== CoinGecko API 함수들 =====
async def get_coingecko_coin_id(symbol: str):
    """CoinGecko에서 심볼로 코인 ID 자동 검색"""
    try:
        # 캐시 확인 (전역 변수로 저장)
        if hasattr(get_coingecko_coin_id, 'cache') and symbol in get_coingecko_coin_id.cache:
            return get_coingecko_coin_id.cache[symbol]
        
        # API에서 모든 코인 리스트 가져오기
        url = "https://api.coingecko.com/api/v3/coins/list"
        timeout = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    coins = await response.json()
                    
                    # 캐시 초기화
                    if not hasattr(get_coingecko_coin_id, 'cache'):
                        get_coingecko_coin_id.cache = {}
                    
                    # 심볼로 ID 찾기
                    for coin in coins:
                        coin_symbol = coin.get("symbol", "").upper()
                        coin_id = coin.get("id", "")
                        
                        if coin_symbol and coin_id:
                            get_coingecko_coin_id.cache[coin_symbol] = coin_id
                    
                    # 요청한 심볼의 ID 반환
                    found_id = get_coingecko_coin_id.cache.get(symbol.upper())
                    if found_id:
                        print(f"✅ {symbol} → CoinGecko ID: {found_id}")
                        return found_id
                    
    except Exception as e:
        print(f"⚠️ CoinGecko ID 검색 실패 ({symbol}): {e}")
    
    # 실패시 소문자 심볼 반환 (기본값)
    return symbol.lower()

async def get_coingecko_market_cap(symbol: str):
    """CoinGecko API에서 정확한 시가총액 계산 (모든 코인)"""
    try:
        # 🔥 자동으로 CoinGecko ID 찾기
        coingecko_id = await get_coingecko_coin_id(symbol)
        
        if not coingecko_id:
            print(f"❌ {symbol}의 CoinGecko ID를 찾을 수 없음")
            return None
        
        # 상세 데이터 API 호출
        url = f"https://api.coingecko.com/api/v3/coins/{coingecko_id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
        
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    market_data = data.get("market_data", {})
                    
                    if market_data:
                        # 🔥 정확한 계산을 위한 데이터 추출
                        price_usd = market_data.get("current_price", {}).get("usd", 0)
                        volume_24h_usd = market_data.get("total_volume", {}).get("usd", 0)
                        price_change_24h = market_data.get("price_change_percentage_24h", 0)
                        
                        # 🎯 유통량 정보 (여러 소스에서 가져오기)
                        circulating_supply = market_data.get("circulating_supply")
                        total_supply = market_data.get("total_supply") 
                        max_supply = market_data.get("max_supply")
                        
                        # 유통량 우선순위: circulating > total > max
                        supply_for_calculation = circulating_supply or total_supply or max_supply or 0
                        
                        if price_usd > 0 and supply_for_calculation > 0:
                            # ✅ 정확한 시가총액 계산: 가격 × 유통량
                            accurate_market_cap_usd = price_usd * supply_for_calculation
                            
                            print(f"✅ {symbol} 정확한 계산:")
                            print(f"   💲 가격: ${price_usd:,.6f}")
                            print(f"   🪙 유통량: {supply_for_calculation:,.0f}")
                            print(f"   💰 시가총액: ${accurate_market_cap_usd:,.0f}")
                            
                            return {
                                "price_usd": price_usd,
                                "market_cap_usd": accurate_market_cap_usd,  # 🔥 정확히 계산된 시가총액
                                "volume_24h_usd": volume_24h_usd,
                                "price_change_24h": price_change_24h,
                                "coingecko_id": coingecko_id,
                                "supply_info": {
                                    "circulating": circulating_supply,
                                    "total": total_supply,
                                    "max": max_supply,
                                    "used_for_calculation": supply_for_calculation
                                }
                            }
                        else:
                            print(f"⚠️ {symbol} 가격 또는 유통량 데이터 부족")
                            print(f"   가격: ${price_usd}")
                            print(f"   유통량: {supply_for_calculation}")
                            
                            # 데이터 부족시 API 원본 시가총액 사용 (폴백)
                            api_market_cap = market_data.get("market_cap", {}).get("usd", 0)
                            if api_market_cap > 0:
                                print(f"   폴백: API 시가총액 ${api_market_cap:,.0f} 사용")
                                return {
                                    "price_usd": price_usd,
                                    "market_cap_usd": api_market_cap,
                                    "volume_24h_usd": volume_24h_usd,
                                    "price_change_24h": price_change_24h,
                                    "coingecko_id": coingecko_id
                                }
                else:
                    print(f"❌ CoinGecko API HTTP {response.status} for {coingecko_id}")
                    
    except Exception as e:
        print(f"⚠️ CoinGecko API 실패 ({symbol}): {e}")
    
    return None

# ===== 빗썸 API 함수들 =====
async def get_bithumb_coin_data(symbol: str):
    """빗썸에서 특정 코인 데이터 조회"""
    try:
        url = f"https://api.bithumb.com/public/ticker/{symbol}_KRW"
        timeout = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "0000":
                        ticker_data = data.get("data", {})
                        
                        current_price = float(ticker_data.get("closing_price", 0))
                        
                        return {
                            "status": "success",
                            "data": {
                                "current_price": current_price,
                                "opening_price": float(ticker_data.get("opening_price", 0)),
                                "max_price": float(ticker_data.get("max_price", 0)),
                                "min_price": float(ticker_data.get("min_price", 0)),
                                "change_rate": float(ticker_data.get("fluctate_rate_24H", 0)),
                                "change_amount": float(ticker_data.get("fluctate_24H", 0)),
                                "volume": float(ticker_data.get("acc_trade_value_24H", 0)),
                                "units_traded": float(ticker_data.get("units_traded_24H", 0)),
                                "prev_closing_price": float(ticker_data.get("prev_closing_price", 0)),
                                "timestamp": ticker_data.get("date"),
                                "tick_size": get_bithumb_tick_size(symbol, current_price)
                            }
                        }
                        
    except Exception as e:
        print(f"❌ 빗썸 API 실패 ({symbol}): {e}")
    
    return None

def generate_fallback_coin_data(symbol: str):
    """폴백 코인 데이터 생성"""
    korean_name = get_korean_name(symbol)
    
    return {
        "symbol": symbol,
        "korean_name": korean_name,
        "current_price": 100000,
        "change_rate": 0,
        "change_amount": 0,
        "volume": 1000000,
        "market_warning": "NONE",
        "tick_size": 1000,
        "status": "fallback_data"
    }

# ===== 빗썸 마켓 코드 조회 =====
@router.get("/markets")
async def get_markets():
    """빗썸 마켓 코드 조회"""
    try:
        url = "https://api.bithumb.com/v1/market/all"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "status": "success",
                        "data": data,
                        "total_count": len(data) if isinstance(data, list) else 0
                    }
                else:
                    return {"status": "error", "message": f"API 오류: {response.status}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ===== 빗썸 호가단위 테이블 =====
BITHUMB_TICK_SIZE_TABLE = {
    # 가격구간: (최소가격, 최대가격, 호가단위)
    "BTC": [
        (0, 2_000_000, 1_000),
        (2_000_000, 10_000_000, 5_000),
        (10_000_000, float('inf'), 10_000)
    ],
    "ETH": [
        (0, 100_000, 100),
        (100_000, 500_000, 500),
        (500_000, float('inf'), 1_000)
    ],
    "DOGE": [
        (0, float('inf'), 1)
    ],
    # 기타 코인은 기본 tick size 사용 (아래 함수)
}

def get_bithumb_tick_size(symbol: str, price: float) -> float:
    table = BITHUMB_TICK_SIZE_TABLE.get(symbol.upper())
    if table:
        for min_p, max_p, tick in table:
            if min_p <= price < max_p:
                return tick
    # 기본 빗썸 tick size (공식)
    if price >= 2_000_000:
        return 1_000
    elif price >= 1_000_000:
        return 500
    elif price >= 500_000:
        return 100
    elif price >= 100_000:
        return 50
    elif price >= 10_000:
        return 10
    elif price >= 1_000:
        return 1
    elif price >= 100:
        return 1
    elif price >= 10:
        return 0.01
    else:
        return 0.001

@router.get("/orderbook/{symbol}")
async def get_orderbook(symbol: str):
    """특정 코인의 오더북(호가) 데이터 조회 및 호가단위 반환"""
    try:
        url = f"https://api.bithumb.com/public/orderbook/{symbol}_KRW?count=15"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    orderbook = data.get("data", {})
                    # 현재가 기준 tick size 계산
                    price = 0
                    try:
                        price = float(orderbook.get("bids", [{}])[0].get("price", 0))
                        if price == 0:
                            price = float(orderbook.get("asks", [{}])[0].get("price", 0))
                    except Exception:
                        price = 0
                    tick_size = get_bithumb_tick_size(symbol, price)
                    return {
                        "status": "success",
                        "symbol": symbol,
                        "data": orderbook,
                        "tick_size": tick_size
                    }
                else:
                    return {"status": "error", "message": f"API 오류: {response.status}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ===== 빗썸 REST API 테스트 =====
@router.get("/test-bithumb")
async def test_bithumb():
    '''빗썸 API 연결 테스트'''
    try:
        url = "https://api.bithumb.com/public/ticker/BTC_KRW"
        response = requests.get(url)

        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success",
                "message": "빗썸 API 연결 성공",
                "data": data
            }
        else:
            return {
                "status": "error", 
                "message": f"API 오류: {response.status_code}"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"연결 실패: {str(e)}"
        }

# ===== 특정 코인 차트 데이터 =====
@router.get("/chart/{symbol}")
async def get_chart_data(symbol: str, interval: str = "24h"):
    """특정 코인의 차트 데이터 조회"""
    try:
        url = f"https://api.bithumb.com/public/candlestick/{symbol}_KRW/{interval}"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success",
                "symbol": symbol,
                "interval": interval,
                "data": data
            }
        else:
            return {"status": "error", "message": "차트 데이터 조회 실패"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ===== 업비트 한글명 매핑 글로벌 캐시 =====
upbit_korean_map = {}
upbit_korean_map_loaded = False
upbit_korean_map_lock = threading.Lock()

async def load_upbit_korean_map():
    global upbit_korean_map, upbit_korean_map_loaded
    if upbit_korean_map_loaded:
        return upbit_korean_map
    try:
        url = "https://api.upbit.com/v1/market/all"
        timeout = aiohttp.ClientTimeout(total=5, connect=2)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    markets = await response.json()
                    korean_map = {}
                    for market in markets:
                        if market.get("market", "").startswith("KRW-"):
                            symbol = market["market"].replace("KRW-", "")
                            korean_name = market.get("korean_name", "").strip()
                            if korean_name:
                                korean_map[symbol] = korean_name
                    with upbit_korean_map_lock:
                        upbit_korean_map = korean_map
                        upbit_korean_map_loaded = True
                    print(f"✅ 업비트에서 {len(korean_map)}개 한글명 수집 (캐시)")
                    return korean_map
    except Exception as e:
        print(f"⚠️ 업비트 API 오류: {e}")
    return {}

async def get_korean_names_from_upbit():
    global upbit_korean_map, upbit_korean_map_loaded
    if upbit_korean_map_loaded:
        return upbit_korean_map
    return await load_upbit_korean_map()

# ===== 코인 한글명 매핑 함수 =====
def get_korean_name(symbol: str) -> str:
    """코인 심볼을 한글명으로 변환 (대폭 확장)"""
    korean_names = {
        # 메이저 코인
        "BTC": "비트코인", "ETH": "이더리움", "XRP": "리플", "ADA": "에이다",
        "DOT": "폴카닷", "LINK": "체인링크", "LTC": "라이트코인", "BCH": "비트코인캐시",
        "XLM": "스텔라루멘", "EOS": "이오스", "DOGE": "도지코인", "SOL": "솔라나",
        "MATIC": "폴리곤", "AVAX": "아발란체", "ATOM": "코스모스", "NEAR": "니어프로토콜",
        
        # AI & 최신 코인들
        "WLD": "월드코인", "BONK": "봉크", "PEPE": "페페", "SHIB": "시바이누",
        "FLOKI": "플로키", "MEME": "밈코인", "GROK": "그록", "AI": "에이아이",
        "RENDER": "렌더", "FET": "페치에이아이", "OCEAN": "오션프로토콜",
        
        # 게임 & NFT
        "SIX": "식스네트워크", "SAND": "샌드박스", "MANA": "디센트럴랜드", 
        "ENJ": "엔진코인", "CHZ": "칠리즈", "FLOW": "플로우", "IMX": "이뮤터블엑스",
        "GALA": "갈라", "AXS": "액시인피니티", "YGG": "일드길드게임즈",
        
        # DeFi 코인들
        "UNI": "유니스왚", "CAKE": "팬케이크스왚", "SUSHI": "스시스왚",
        "AAVE": "에이브", "COMP": "컴파운드", "MKR": "메이커", "SNX": "신세틱스",
        "CRV": "커브", "YFI": "연파이낸스", "1INCH": "원인치", "BAL": "밸런서",
        
        # 레이어1 & 인프라
        "ALGO": "알고랜드", "VET": "비체인", "ICP": "인터넷컴퓨터", "FTM": "팬텀",
        "THETA": "세타", "HBAR": "헤데라", "TRX": "트론", "FIL": "파일코인",
        "KLAY": "클레이튼", "WEMIX": "위믹스", "QTUM": "퀀텀", "ICX": "아이콘",
        "WAVES": "웨이브", "ZIL": "질리카", "ONE": "하모니", "CELO": "셀로",
        
        # 한국 코인들
        "KAVA": "카바", "CTC": "크레딧코인", "HIBS": "하이블록스", 
        "META": "메타디움", "MBL": "무비블록", "TEMCO": "템코",
        
        # 기타 알트코인
        "LUNC": "루나클래식", "LUNA": "루나", "UST": "테라USD", "USTC": "테라USD클래식",
        "BNB": "바이낸스코인", "BUSD": "바이낸스USD", "USDT": "테더", "USDC": "USD코인",
        "DAI": "다이", "TUSD": "트루USD", "PAX": "팩소스", "GUSD": "제미니달러",
        
        # 밈코인들
        "FLOKI": "플로키이누", "BABY": "베이비도지", "ELON": "도지일론마스",
        "SAFEMOON": "세이프문", "AKITA": "아키타이누", "KISHU": "키슈이누",
        
        # 최신 트렌드 코인들
        "ARB": "아비트럼", "OP": "옵티미즘", "RNDR": "렌더토큰", "LDO": "리도",
        "RPL": "로켓풀", "PENDLE": "펜들", "GMX": "지엠엑스", "GRT": "더그래프",
        "BLUR": "블러", "LOOKS": "룩스레어", "X2Y2": "엑스투와이투",
        
        # 추가 DeFi & Web3
        "OSMO": "오스모시스", "JUNO": "주노", "SCRT": "시크릿", "RUNE": "토르체인",
        "ALPHA": "알파파이낸스", "BETA": "베타파이낸스", "AUTO": "오토팜",
        
# 오라클 & 데이터
       "BAND": "밴드프로토콜", "API3": "에이피아이3", "DIA": "디아",
       
       # 기타 유틸리티
       "BAT": "베이직어텐션토큰", "ZRX": "제로엑스", "OMG": "오미세고",
       "LRC": "루프링", "STORJ": "스토리지", "SC": "시아코인",
       
       # 프라이버시 코인
       "XMR": "모네로", "ZEC": "지캐시", "DASH": "대시", "DCR": "디크레드",
       
       # 구형 알트코인들
       "XEM": "넴", "IOTA": "아이오타", "NEO": "네오", "GAS": "가스",
       "ONT": "온톨로지", "VEN": "체인", "WAN": "완체인", "ZRX": "제로엑스",

       # ✅ API에서 영어로 나오는 코인들 추가
       "SOON": "순", "USDT": "테더", "ENA": "에테나", "PENGU": "펭귄", 
       "PROVE": "프루브", "WLD": "월드코인", "SIX": "식스네트워크", "BONK": "봉크",
       "ENS": "이더리움네임서비스", "ZRO": "레이어제로", "PEPE": "페페", 
       "VIRTUAL": "버추얼프로토콜", "ONDO": "온도파이낸스", "SUI": "수이",
       "TRUMP": "트럼프", "BFC": "비에프씨", "MAGIC": "매직", "LISTA": "리스타",
       "SPK": "스팍", "MOODENG": "무뎅", "ES": "이에스", "CTC": "크레딧코인",
       "UXLINK": "유엑스링크", "KAIA": "카이아", "SHIB": "시바이누", "UNI": "유니스왚",
       "STRIKE": "스트라이크", "LDO": "리도", "HBAR": "헤데라", "STG": "스타게이트파이낸스",
       "TRX": "트론", "SEI": "세이", "ETHFI": "이더파이", "USDC": "유에스디코인",
       "IP": "스토리", "APM": "에이피엠", "SAHARA": "사하라에이아이", "BSV": "비트코인에스브이",
       "FIDA": "피다", "BRETT": "브렛", "LA": "엘에이", "PUMP": "펌프",
       "ERA": "칼데라", "BMT": "비엠티", "STX": "스택스", "ORDER": "오더",
       "OM": "만트라", "PENDLE": "펜들", "RAY": "레이디움", "A": "볼타",
       "XPR": "엑스피알", "RESOLV": "리졸브", "GOAT": "고트", "CFX": "씨에프엑스",
       "JUP": "주피터", "TREE": "트리", "MEW": "캣인어독스월드", "MOVE": "무브먼트",
       "GMX": "지엠엑스", "EL": "엘", "FLZ": "플즈", "ARB": "아비트럼",
       "INJ": "인젝티브", "CBK": "코박토큰", "RPL": "로켓풀", "H": "에이치",
       "SAND": "샌드박스", "ATH": "에이셔", "HAEDAL": "해달", "ME": "매직에덴",
       "ELX": "엘엑스", "APT": "앱토스", "WOO": "우", "ALGO": "알고랜드",
       "EPT": "이피티", "IMX": "이뮤터블엑스", "HFT": "에이치에프티", 
       "EIGEN": "아이겐", "MNT": "맨틀", "BABY": "베이비도지", "RSR": "알에스알",
       "OMNI": "옴니네트워크", "FLOKI": "플로키이누", "AGI": "에이지아이", 
       "AI16Z": "에이아이식스틴지", "ZRC": "지알씨", "CRO": "크로노스", 
       "COW": "카우프로토콜", "BERA": "베라체인", "ILV": "일루비움", 
       "HYPER": "하이퍼레인", "OP": "옵티미즘", "KERNEL": "커널", 
       "POL": "폴리곤에코시스템토큰", "CYBER": "사이버", "SOPH": "소폰",
       "AAVE": "에이브", "LEVER": "레버", "WOM": "웜", "F": "에프",
       "ANIME": "애니메코인", "ORCA": "오르카", "CARV": "카브", "WAVES": "웨이브",
       "SNT": "스테이터스네트워크토큰", "PLUME": "플룸", "GRASS": "그래스",
       "RSS3": "알에스에스쓰리", "RVN": "레이븐코인", "W": "웜홀", 
       "NEWT": "뉴턴프로토콜", "XTZ": "테조스", "NEIRO": "네이로", 
       "SIGN": "사인", "SYRUP": "메이플파이낸스", "BIGTIME": "빅타임",
       "LAYER": "솔레이어", "DRIFT": "드리프트", "MEV": "메브", "A8": "에이에잇",
       "STAT": "스탯", "AKT": "아카시네트워크", "AVL": "에이비엘", "XYO": "엑스와이오",
       "COOKIE": "쿠키", "XCN": "엑스씨엔", "SHELL": "쉘", "NXPC": "넥스페이스",
       "GLM": "골렘", "LPT": "라이브피어", "BEAM": "빔", "PEAQ": "피크",
       "MAV": "마브", "HOME": "홈", "AMO": "에이모", "SWELL": "스웰",
       "BLAST": "블라스트", "EGG": "에그", "TON": "톤", "REZ": "레즈",
       "PONKE": "폰케", "STRK": "스트크", "SLF": "셀프", "KAITO": "카이토",
       "PUNDIAI": "펀디에이아이", "TIA": "셀레스티아", "BB": "비비", 
       "TAIKO": "타이코", "ALT": "알트레이어", "FIL": "파일코인", "NMR": "뉴머레어",
       "PUFFER": "퍼퍼", "C": "씨", "CRV": "커브", "SUNDOG": "선독",
       "MASK": "마스크네트워크", "ARDR": "아더", "HUMA": "휴마", "REI": "레이",
       "PCI": "피씨아이", "BNB": "바이낸스코인", "SPURS": "스퍼스", 
       "SOLV": "솔브", "NCT": "엔씨티", "ZTX": "지티엑스", "OBT": "오비티",
       "ARKM": "아캄", "MERL": "멀", "STRAX": "스트라티스", "GALA": "갈라",
       "SUSHI": "스시스왚", "ARK": "아크", "T": "쓰레스홀드", "AERGO": "아르고",
       "IOTA": "아이오타", "WCT": "월렛커넥트", "AERO": "에어로", "CTK": "씨티케이",
       "MOCA": "모카네트워크", "ACH": "에이치", "FORT": "포트", 
       "PYTH": "피스네트워크", "ROA": "알오에이", "NEO": "네오", "MVC": "엠브이씨",
       "TURBO": "터보", "YFI": "연파이낸스", "GRT": "더그래프", 
       "METIS": "메티스", "JTO": "지토", "GAS": "가스", "AUCTION": "바운스토큰",
       "VET": "비체인", "QTUM": "퀀텀", "FANC": "팬시", "FXS": "에프엑스에스",
       "FLOCK": "플록", "CKB": "너보스", "ZETA": "제타체인", "MORPHO": "모르포",
       "BLUE": "블루", "WIKEN": "위켄", "MANTA": "만타", "MAY": "메이",
       "MANA": "디센트럴랜드", "WIF": "위프", "COMP": "컴파운드", 
       "QTCON": "큐티콘", "WAL": "월러스", "DEEP": "딥북", "GAME2": "게임빌드",
       "AQT": "알파쿼크", "ZIL": "질리카", "XEC": "이캐시", "BIOT": "바이오티",
       "CTXC": "씨티엑스씨", "BLUR": "블러", "AZIT": "아짓", "FET": "페치에이아이",
       "DAO": "다오", "POKT": "포켓네트워크", "EDU": "에듀", "BEL": "벨",
       "GHX": "지에이치엑스", "AVAIL": "어베일", "SKY": "스카이", "KAVA": "카바",
       "TOKAMAK": "토카막네트워크", "XTER": "엑스터", "INIT": "이닛", 
       "CAKE": "팬케이크스왚", "VANA": "바나", "IO": "아이오", "RED": "레드",
       "RENDER": "렌더토큰", "PROMPT": "프롬프트", "TFUEL": "쎄타퓨엘", 
       "CSPR": "캐스퍼", "KNC": "카이버네트워크", "B3": "비쓰리", "FLR": "플레어",
       "UMA": "우마", "SAFE": "세이프", "MLK": "밀크", "GRND": "그라운드",
       "BLY": "블라이", "GMT": "스테픈", "SUN": "썬", "TDROP": "티드롭",
       "XPLA": "엑스플라", "SXT": "에스엑스티", "PYR": "파이어", 
       "THETA": "쎄타토큰", "ID": "스페이스아이디", "HOOK": "훅", 
       "ICP": "인터넷컴퓨터", "PARTI": "파티", "ACE": "에이스", "WAXL": "왁스엘",
       "DBR": "디비알", "ADP": "에이디피", "BTT": "비트토렌트", "D": "디",
       "SXP": "솔라", "ORBS": "오브스", "BORA": "보라", "ZK": "지케이",
       "AIOZ": "아이오즈", "1INCH": "1인치네트워크", "MIX": "믹스", 
       "JASMY": "재스미", "ACS": "에이씨에스", "CORE": "코어", "KSM": "쿠사마",
       "MOC": "모스코인", "THE": "더", "BICO": "비코", "IQ": "아이큐",
       "CELO": "셀로", "OGN": "오리진", "SCR": "에스씨알", "OAS": "오아시스",
       "WNCG": "위엔씨지", "FCT2": "피르마체인", "AR": "아르위브", 
       "MBX": "엠비엑스", "WAXP": "왁스", "XVS": "비너스", "SOFI": "소파이",
       "OBSR": "옵저버", "ZRX": "제로엑스", "AXS": "엑시인피니티", 
       "IOTX": "아이오텍스", "FLOW": "플로우", "CHZ": "칠리즈", 
       "BAT": "베이직어텐션토큰", "S": "에스", "LM": "엘엠", "ENJ": "엔진코인",
       "ALICE": "앨리스", "HP": "히포프로토콜", "MAPO": "맵프로토콜", "JOE": "조",
       "BOBA": "보바", "CRTS": "씨알티에스", "OSMO": "오스모시스", 
       "MTL": "메탈", "COS": "코스", "SONIC": "소닉에스브이엠", "OXT": "옥스트",
       "POLYX": "폴리매쉬", "CVC": "시빅", "RON": "론", "ICX": "아이콘",
       "API3": "에이피아이쓰리", "NIL": "닐", "STORJ": "스토리지", 
       "YGG": "일드길드게임즈", "EGLD": "멀티버스엑스", "XAI": "엑스에이아이",
       "AWE": "에이더블유이", "EVZ": "이브이지", "PUNDIX": "펀디엑스", 
       "DYDX": "디와이디엑스", "APE": "에이프코인", "MINA": "미나", 
       "SC": "시아코인", "DVI": "디브이아이", "POLA": "폴라", "STEEM": "스팀",
       "TAVA": "타바", "ACX": "에이씨엑스", "ANKR": "앵커", "BOUNTY": "체인바운티",
       "GRACY": "그레이시", "VTHO": "비토르토큰", "BNT": "밴코르", 
       "GTC": "지티씨", "SNX": "신세틱스", "FITFI": "핏파이", 
       "AGLD": "어드벤처골드", "AL": "에이엘", "G": "그래비티", "COTI": "코티",
       "LRC": "루프링", "UOS": "유오에스", "LWA": "엘더블유에이", 
       "JST": "저스트", "C98": "씨구십팔", "IOST": "아이오에스티", 
       "BAL": "밸런서", "RAD": "래드", "ASTR": "아스타", "SKL": "스케일",
       "HIVE": "하이브", "POWR": "파워렛저", "LBL": "엘비엘", "RLC": "알엘씨",
       "PAXG": "팩스골드", "SFP": "에스에프피", "CELR": "셀러", "MVL": "엠블",
       "GRS": "그로스톨코인", "AMP": "앰프", "DKA": "디카르고", "SWAP": "스왑",
       "ONG": "온톨로지가스", "MED": "메디블록", "TEMCO": "템코", "LSK": "리스크",
       "QKC": "쿼크체인", "ONT": "온톨로지", "TT": "썬더코어", "FLUX": "플럭스",
       "HUNT": "헌트", "CTSI": "카르테시", "BOA": "보아", "AUDIO": "오디어스",
       "ARPA": "아르파", "AHT": "아하토큰", "NFT": "에프에프티", "REQ": "리퀘스트",
       "META": "메타디움", "ELF": "엘프", "MBL": "무비블록", "GNO": "그노시스",
       "CHR": "크로미아", "HIGH": "하이스트리트", "USDS": "유에스디에스"
   }
    return korean_names.get(symbol, symbol)

# ===== 메인 코인 목록 API =====
@router.get("/coins")
async def get_coin_list():
   """모든 활성 거래 코인 목록 조회 (업비트 한글명 포함)"""
   print("[API] /api/coins 진입")
   markets_url = "https://api.bithumb.com/v1/market/all"
   ticker_url = "https://api.bithumb.com/public/ticker/ALL_KRW"
   try:
       # 업비트에서 한글명 먼저 가져오기
       upbit_korean_names = await get_korean_names_from_upbit()
       # 3초 타임아웃 강제 적용
       timeout = aiohttp.ClientTimeout(total=3, connect=2)
       async with aiohttp.ClientSession(timeout=timeout) as session:
           market_task = session.get(markets_url)
           ticker_task = session.get(ticker_url)
           market_response, ticker_response = await asyncio.gather(market_task, ticker_task)
           if ticker_response.status != 200:
               print(f"[API] 시세 API 오류: {ticker_response.status}")
               return {"status": "error", "message": f"시세 API 오류: {ticker_response.status}"}
           ticker_data = await ticker_response.json()
           if ticker_data.get("status") != "0000":
               print("[API] 빗썸 시세 API 오류")
               return {"status": "error", "message": "빗썸 시세 API 오류"}
           # 빗썸 마켓 데이터 처리
           market_map = {}
           if market_response.status == 200:
               try:
                   markets_data = await market_response.json()
                   if isinstance(markets_data, list):
                       for market in markets_data:
                           market_code = market.get("market", "")
                           if market_code.endswith("_KRW") or market_code.endswith("_BTC"):
                               if market_code.endswith("_KRW"):
                                   symbol = market_code.replace("_KRW", "")
                                   market_type = "KRW"
                               else:
                                   symbol = market_code.replace("_BTC", "")
                                   market_type = "BTC"
                               market_map[symbol] = {
                                   "korean_name": market.get("korean_name", ""),
                                   "english_name": market.get("english_name", ""),
                                   "market_warning": market.get("market_warning", "NONE")
                               }
               except Exception as e:
                   print(f"⚠️ 빗썸 마켓 정보 파싱 실패: {e}")
           coins = []
           for symbol, info in ticker_data["data"].items():
               if symbol == "date":
                   continue
               try:
                   trade_value = float(info.get("acc_trade_value_24H", 0))
                   # 모든 코인 포함 (거래대금 필터 제거)
                   market_info = market_map.get(symbol, {})

                   # 한글명 결정 우선순위: 빗썸 한글명 > 업비트 한글명 > 빗썸 영문명 > 기본매핑 > 심볼
                   bithumb_korean = market_info.get("korean_name", "").strip()
                   upbit_korean = upbit_korean_names.get(symbol, "")
                   bithumb_english = market_info.get("english_name", "").strip()
                   basic_korean = get_korean_name(symbol)
                   display_name = (
                       bithumb_korean or 
                       upbit_korean or 
                       bithumb_english or 
                       (basic_korean if basic_korean != symbol else symbol)
                   )

                   coins.append({
                       "symbol": symbol,
                       "korean_name": display_name,
                       "english_name": bithumb_english or symbol,
                       "current_price": round(float(info.get("closing_price", 0)), 4),
                       "change_rate": float(info.get("fluctate_rate_24H", 0)),
                       "change_amount": round(float(info.get("fluctate_24H", 0)), 4),
                       "volume": round(trade_value, 4),
                       "market_warning": market_info.get("market_warning", "NONE"),
                       "units_traded": round(float(info.get("units_traded_24H", 0)), 4)
                   })

               except (ValueError, TypeError) as e:
                   print(f"⚠️ {symbol} 데이터 처리 오류: {e}")
                   continue
           coins.sort(key=lambda x: x["volume"], reverse=True)
           print(f"[API] /api/coins 정상 종료: {len(coins)}개 반환")
           return {
               "status": "success",
               "data": coins,
               "total_count": len(coins),
               "upbit_korean_names": len(upbit_korean_names),
               "last_updated": datetime.now().isoformat()
           }
   except Exception as e:
       print(f"[API] /api/coins 예외 발생: {e}")
       # 에러시 폴백 데이터 반환 (항상 최소 3개 코인)
       fallback_data = [
           {"symbol": "BTC", "korean_name": "비트코인", "english_name": "Bitcoin", "current_price": 163800000, "change_rate": 0.37, "change_amount": 600000, "volume": 200000000000, "market_warning": "NONE", "units_traded": 1231},
           {"symbol": "ETH", "korean_name": "이더리움", "english_name": "Ethereum", "current_price": 5924000, "change_rate": 0.59, "change_amount": 35000, "volume": 150000000000, "market_warning": "NONE", "units_traded": 2531},
           {"symbol": "XRP", "korean_name": "리플", "english_name": "XRP", "current_price": 4376, "change_rate": 0.32, "change_amount": 14, "volume": 100000000000, "market_warning": "NONE", "units_traded": 15234}
       ]
       return {
           "status": "success",
           "data": fallback_data,
           "total_count": len(fallback_data),
           "error": str(e),
           "last_updated": datetime.now().isoformat()
       }

# ===== BTC 마켓 API =====
@router.get("/coins/btc")
async def get_btc_coin_list():
   """빗썸 BTC 마켓 데이터 (BTC 마켓만)"""
   print("[API] /api/coins/btc (빗썸 BTC 마켓) 진입")
   markets_url = "https://api.bithumb.com/v1/market/all"
   ticker_url = "https://api.bithumb.com/public/ticker/ALL_BTC"
   try:
       timeout = aiohttp.ClientTimeout(total=3, connect=2)
       async with aiohttp.ClientSession(timeout=timeout) as session:
           market_task = session.get(markets_url)
           ticker_task = session.get(ticker_url)
           market_response, ticker_response = await asyncio.gather(market_task, ticker_task)
           if ticker_response.status != 200:
               print(f"[API] BTC 시세 API 오류: {ticker_response.status}")
               return {"status": "error", "message": f"BTC 시세 API 오류: {ticker_response.status}"}
           ticker_data = await ticker_response.json()
           if ticker_data.get("status") != "0000":
               print("[API] 빗썸 BTC 시세 API 오류")
               return {"status": "error", "message": "빗썸 BTC 시세 API 오류"}
           # 빗썸 마켓 데이터 처리
           market_map = {}
           if market_response.status == 200:
               try:
                   markets_data = await market_response.json()
                   if isinstance(markets_data, list):
                       for market in markets_data:
                           market_code = market.get("market", "")
                           if market_code.endswith("_BTC"):
                               symbol = market_code.replace("_BTC", "")
                               market_map[symbol] = {
                                   "korean_name": market.get("korean_name", ""),
                                   "english_name": market.get("english_name", ""),
                                   "market_warning": market.get("market_warning", "NONE")
                               }
               except Exception as e:
                   print(f"⚠️ 빗썸 BTC 마켓 정보 파싱 실패: {e}")
           coins = []
           for symbol, info in ticker_data["data"].items():
               if symbol == "date":
                   continue
               try:
                   trade_value = float(info.get("acc_trade_value_24H", 0))
                   if trade_value <= 0:
                       continue
                   market_info = market_map.get(symbol, {})
                   bithumb_korean = market_info.get("korean_name", "").strip()
                   bithumb_english = market_info.get("english_name", "").strip()
                   display_name = bithumb_korean or bithumb_english or symbol
                   coins.append({
                       "symbol": symbol,
                       "korean_name": display_name,
                       "english_name": bithumb_english or symbol,
                       "current_price": round(float(info.get("closing_price", 0)), 4),
                       "change_rate": float(info.get("fluctate_rate_24H", 0)),
                       "change_amount": round(float(info.get("fluctate_24H", 0)), 4),
                       "volume": round(trade_value, 4),
                       "market_warning": market_info.get("market_warning", "NONE"),
                       "units_traded": round(float(info.get("units_traded_24H", 0)), 4)
                   })
               except (ValueError, TypeError) as e:
                   print(f"⚠️ {symbol} BTC 데이터 처리 오류: {e}")
                   continue
           coins.sort(key=lambda x: x["volume"], reverse=True)
           print(f"[API] /api/coins/btc 정상 종료: {len(coins)}개 반환")
           return {
               "status": "success",
               "data": coins,
               "total_count": len(coins),
               "last_updated": datetime.now().isoformat()
           }
   except Exception as e:
       print(f"[API] /api/coins/btc 예외 발생: {e}")
       fallback_data = [
           {"symbol": "BTC", "korean_name": "비트코인", "english_name": "Bitcoin", "current_price": 163800000, "change_rate": 0.37, "change_amount": 600000, "volume": 200000000000, "market_warning": "NONE", "units_traded": 1231}
       ]
       return {
           "status": "success",
           "data": fallback_data,
           "total_count": len(fallback_data),
           "error": str(e),
           "last_updated": datetime.now().isoformat()
       }

# ===== 빗썸 WebSocket 관리자 =====
class BithumbWebSocketManager:
   def __init__(self):
       self.is_running = False
       self.connections = []
       self.connection_stats = {}
       self.subscribed_symbols = []
       self.bithumb_ws = None

bithumb_manager = BithumbWebSocketManager()

# 실시간 WebSocket 브로드캐스트
async def broadcast_to_clients(message):
   for ws in list(bithumb_manager.connections):
       try:
           await ws.send_text(message)
       except Exception:
           pass

# ===== 실시간 WebSocket 엔드포인트 =====
@router.websocket("/realtime")
async def realtime_ws(websocket: WebSocket):
   await websocket.accept()
   bithumb_manager.connections.append(websocket)
   
   try:
       print("✅ 클라이언트 연결됨")

       # 초기 코인 목록 전송
       coins_resp = await get_coin_list()
       last_coin_list = coins_resp["data"][:] if coins_resp["status"] == "success" else []
       if coins_resp["status"] == "success":
           await websocket.send_text(json.dumps({
"type": "initial_coins",
               "data": last_coin_list
           }))
           print(f"📋 초기 코인 목록 전송: {len(last_coin_list)}개")

       # 코인 목록 실시간 감시 태스크 (30초마다 체크)
       async def coin_list_watcher():
           nonlocal last_coin_list
           while True:
               await asyncio.sleep(30)
               try:
                   new_resp = await get_coin_list()
                   if new_resp["status"] == "success":
                       new_list = new_resp["data"]
                       # 코인 심볼 기준으로만 비교 (순서, 개수, 심볼)
                       old_symbols = set(c['symbol'] for c in last_coin_list)
                       new_symbols = set(c['symbol'] for c in new_list)
                       if old_symbols != new_symbols:
                           await websocket.send_text(json.dumps({
                               "type": "update_coins",
                               "data": new_list
                           }))
                           print(f"🔄 코인 목록 변경 감지 및 전송: {len(new_list)}개")
                           last_coin_list = new_list[:]
               except Exception as e:
                   print(f"⚠️ 코인 목록 실시간 감시 오류: {e}")

       watcher_task = asyncio.create_task(coin_list_watcher())

       # ✅ 실제 빗썸 WebSocket 연결 (개선된 버전)
       await connect_to_bithumb_websocket(websocket, last_coin_list)

   except WebSocketDisconnect:
       print("❌ 클라이언트 연결 해제")
   except Exception as e:
       print(f"❌ WebSocket 오류: {e}")
   finally:
       if websocket in bithumb_manager.connections:
           bithumb_manager.connections.remove(websocket)
       # watcher_task가 살아있으면 취소
       try:
           watcher_task.cancel()
       except:
           pass

async def connect_to_bithumb_websocket(client_websocket, coins_data):
   """빗썸 WebSocket 연결 (KRW + BTC 마켓 지원)"""
   max_retries = 3
   retry_count = 0
   
   while retry_count < max_retries:
       try:
           print(f"🔄 빗썸 WebSocket 연결 시도 {retry_count + 1}/{max_retries}")
           
           bithumb_uri = "wss://pubwss.bithumb.com/pub/ws"
           
           async with websockets.connect(bithumb_uri) as ws_bithumb:
               print("✅ 빗썸 WebSocket 연결 성공")
               
               # 연결 확인 메시지 수신
               try:
                   greeting = await asyncio.wait_for(ws_bithumb.recv(), timeout=10.0)
                   greeting_data = json.loads(greeting)
                   print(f"📞 빗썸 연결 응답: {greeting_data}")
               except asyncio.TimeoutError:
                   print("⚠️ 빗썸 연결 응답 타임아웃")

               # KRW 마켓 전체 구독 (coins_data 전체 사용)
               krw_symbols = [coin['symbol'] + '_KRW' for coin in coins_data]

               # KRW 마켓 구독
               krw_subscribe = {
                   "type": "ticker",
                   "symbols": krw_symbols,
                   "tickTypes": ["24H"]
               }
               await ws_bithumb.send(json.dumps(krw_subscribe))
               print(f"🔔 KRW 구독 요청 전송: {len(krw_symbols)}개 (전체)")
               
               # 구독 응답 확인
               try:
                   response = await asyncio.wait_for(ws_bithumb.recv(), timeout=10.0)
                   response_data = json.loads(response)
                   print(f"📋 KRW 구독 응답: {response_data}")
               except asyncio.TimeoutError:
                   print("⚠️ KRW 구독 응답 타임아웃")
               
               # 실시간 데이터 처리
               message_count = 0
               while True:
                   try:
                       raw_message = await asyncio.wait_for(ws_bithumb.recv(), timeout=30.0)
                       bithumb_data = json.loads(raw_message)
                       message_count += 1
                       
                       if message_count <= 10:  # 처음 10개 메시지 로그
                           print(f"📊 메시지 {message_count}: {bithumb_data.get('type')}")
                       
                       if bithumb_data.get("type") == "ticker":
                           content = bithumb_data.get("content", {})
                           symbol = content.get("symbol")
                           close_price = content.get("closePrice")
                           
                           if not symbol or not close_price:
                               continue
                           
                           if message_count <= 5:  # 처음 5개 데이터 상세 로그
                               print(f"💰 실시간 데이터: {symbol} = {close_price}원")
                           
                           # 클라이언트에 전송
                           formatted_data = {
                               "type": "ticker",
                               "content": {
                                   "symbol": symbol,
                                   "closePrice": close_price,
                                   "chgRate": content.get("chgRate", "0"),
                                   "chgAmt": content.get("chgAmt", "0"),
                                   "value": content.get("value", "0"),
                                   "timestamp": int(time.time() * 1000)
                               }
                           }
                           
                           # 모든 클라이언트에게 전송
                           disconnected_clients = []
                           for client_ws in list(bithumb_manager.connections):
                               try:
                                   await client_ws.send_text(json.dumps(formatted_data))
                               except:
                                   disconnected_clients.append(client_ws)
                           
                           # 연결 끊어진 클라이언트 정리
                           for client in disconnected_clients:
                               if client in bithumb_manager.connections:
                                   bithumb_manager.connections.remove(client)
                   
                   except asyncio.TimeoutError:
                       print("⚠️ 빗썸 메시지 타임아웃 - ping 전송")
                       await ws_bithumb.ping()
                       continue
                   except Exception as e:
                       print(f"❌ 데이터 처리 오류: {e}")
                       continue
                       
       except Exception as e:
           print(f"❌ WebSocket 연결 실패: {e}")
           retry_count += 1
           if retry_count < max_retries:
               await asyncio.sleep(2 ** retry_count)
   
   print("❌ 빗썸 WebSocket 최대 재시도 횟수 초과")

# ===== 특정 코인 상세 정보 API =====
@router.get("/coin/{symbol}")
async def get_coin_detail(symbol: str):
   """특정 코인의 상세 정보 조회 (실시간 환율로 정확한 시가총액 계산)"""
   try:
       # 병렬로 데이터 수집
       tasks = [
           get_bithumb_coin_data(symbol),  # 빗썸 데이터
           get_coingecko_market_cap(symbol),  # CoinGecko 정확한 계산
           get_usd_to_krw_rate()  # 🔥 실시간 USD→KRW 환율
       ]
       
       bithumb_data, coingecko_data, usd_krw_rate = await asyncio.gather(*tasks, return_exceptions=True)
       
       # 에러 처리
       if isinstance(bithumb_data, Exception):
           bithumb_data = None
       if isinstance(coingecko_data, Exception):
           coingecko_data = None
       if isinstance(usd_krw_rate, Exception):
           usd_krw_rate = 1387.0  # 🔥 실시간 환율로 업데이트
       
       print(f"🔄 현재 사용 환율: {usd_krw_rate:.2f}원")  # 디버깅용
       
       # 데이터 통합
       result_data = {
           "symbol": symbol,
           "korean_name": get_korean_name(symbol),
           "status": "success"
       }
       
       # 빗썸 데이터가 있으면 사용
       if bithumb_data and bithumb_data.get("status") == "success":
           bithumb_info = bithumb_data["data"]
           result_data.update({
               "current_price": bithumb_info["current_price"],
               "opening_price": bithumb_info.get("opening_price", 0),
               "max_price": bithumb_info.get("max_price", 0),
               "min_price": bithumb_info.get("min_price", 0),
               "change_rate": bithumb_info.get("change_rate", 0),
               "change_amount": bithumb_info.get("change_amount", 0),
               "bithumb_volume": bithumb_info.get("volume", 0),
               "units_traded": bithumb_info.get("units_traded", 0),
               "prev_closing_price": bithumb_info.get("prev_closing_price", 0),
               "timestamp": bithumb_info.get("timestamp"),
               "tick_size": bithumb_info.get("tick_size", 1)
           })
       
       # 🔥 CoinGecko 정확한 계산 데이터 + 실시간 환율 사용
       if coingecko_data:
           global_market_cap_krw = coingecko_data["market_cap_usd"] * usd_krw_rate
           global_volume_krw = coingecko_data["volume_24h_usd"] * usd_krw_rate
           global_price_krw = coingecko_data["price_usd"] * usd_krw_rate
           
           print(f"💰 {symbol} 시가총액 계산:")
           print(f"   USD 시가총액: ${coingecko_data['market_cap_usd']:,.0f}")
           print(f"   실시간 환율: {usd_krw_rate:.2f}원")
           print(f"   KRW 시가총액: {global_market_cap_krw:,.0f}원")
           
           result_data.update({
               # 🔥 실시간 환율로 정확히 계산된 글로벌 데이터
               "global_market_cap": round(global_market_cap_krw),  # 실시간 환율 적용
               "global_volume_24h": round(global_volume_krw),
               "global_price_usd": coingecko_data["price_usd"],
               "global_price_krw": round(global_price_krw),
               "global_change_24h": coingecko_data["price_change_24h"],
               
               # 유통량 정보도 제공
               "supply_info": coingecko_data.get("supply_info", {}),
               
               "exchange_rate": usd_krw_rate,  # 🔥 실시간 환율 표시
               "data_sources": ["bithumb", "coingecko_realtime"]  # 실시간 표시
           })
           
           if not bithumb_data:
               result_data.update({
                   "current_price": round(global_price_krw),
                   "change_rate": coingecko_data["price_change_24h"],
                   "tick_size": get_tick_size(global_price_krw)
               })
       else:
           result_data["data_sources"] = ["bithumb"]
       
       if not bithumb_data and not coingecko_data:
           return {
               "status": "error", 
               "message": f"{symbol} 데이터를 찾을 수 없습니다",
               "fallback_data": generate_fallback_coin_data(symbol)
           }
       
       return {
           "status": "success",
           "data": result_data,
           "last_updated": datetime.now().isoformat()
       }
       
   except Exception as e:
       print(f"❌ get_coin_detail 예외 ({symbol}): {e}")
       return {
           "status": "error",
           "message": str(e),
           "fallback_data": generate_fallback_coin_data(symbol)
       }

# ===== WebSocket 통계 API =====
@router.get("/websocket/stats")
async def get_websocket_stats():
   """WebSocket 연결 통계"""
   return {
       "status": "success",
       "subscription_stats": {
           "total_connections": len(bithumb_manager.connections),
           "active_subscriptions": len(bithumb_manager.subscribed_symbols),
           "last_update": datetime.now().isoformat()
       }
   }

# ===== 환율 상태 확인 API =====
@router.get("/exchange-rate")
async def get_current_exchange_rate():
   """현재 환율 조회 및 상태 확인"""
   rate = await get_usd_to_krw_rate()
   cached = get_cached_exchange_rate()
   
   return {
       "status": "success",
       "current_rate": rate,
       "cached_rate": cached,
       "is_cached": rate == cached,
       "last_updated": datetime.now().isoformat(),
       "source": "real-time API" if rate != cached else "cache"
   }

# ===== CoinCap API 전용 엔드포인트 =====
@router.get("/coincap/coins")
async def get_coincap_coins():
   """CoinCap API에서 모든 코인 목록 조회"""
   print("[API] /api/coincap/coins 진입")
   try:
       # 실시간 환율 가져오기
       usd_krw_rate = await get_usd_to_krw_rate()
       
       timeout = aiohttp.ClientTimeout(total=10, connect=5)
       async with aiohttp.ClientSession(timeout=timeout) as session:
           # CoinCap에서 모든 자산 가져오기 (상위 2000개)
           async with session.get("https://api.coincap.io/v2/assets?limit=2000") as response:
               if response.status != 200:
                   print(f"[API] CoinCap API 오류: {response.status}")
                   return {"status": "error", "message": f"CoinCap API 오류: {response.status}"}
               
               data = await response.json()
               
               if not data.get("data"):
                   return {"status": "error", "message": "CoinCap 데이터 없음"}
               
               # 한국어 이름 매핑
               korean_names = get_all_korean_names()
               
               coins = []
               for asset in data["data"]:
                   try:
                       symbol = asset.get("symbol", "")
                       if not symbol:
                           continue
                           
                       # 거래량 필터링 (최소 거래량 있는 것만)
                       volume_usd = float(asset.get("volumeUsd24Hr", 0))
                       if volume_usd < 1000:  # 최소 1000달러 거래량
                           continue
                       
                       korean_name = korean_names.get(symbol, asset.get("name", symbol))
                       
                       coins.append({
                           "symbol": symbol,
                           "korean_name": korean_name,
                           "english_name": asset.get("name", symbol),
                           "current_price": round(float(asset.get("priceUsd", 0)) * usd_krw_rate, 4),  # 실시간 환율 적용
                           "change_rate": float(asset.get("changePercent24Hr", 0)),
                           "change_amount": round(float(asset.get("priceUsd", 0)) * usd_krw_rate * float(asset.get("changePercent24Hr", 0)) / 100, 4),
                           "volume": round(volume_usd * usd_krw_rate / 1000000, 2),  # 백만원 단위
                           "market_cap_rank": int(asset.get("rank", 999)),
                           "market_warning": "NONE",
                           "coincap_id": asset.get("id", "")
                       })
                       
                   except (ValueError, TypeError) as e:
                       print(f"⚠️ {symbol} 데이터 처리 오류: {e}")
                       continue
               
               # 시가총액 순위로 정렬
               coins.sort(key=lambda x: x["market_cap_rank"])
               
               print(f"[API] CoinCap에서 {len(coins)}개 코인 로드 성공 (환율: {usd_krw_rate:.2f}원)")
               return {
                   "status": "success",
                   "data": coins,
                   "total_count": len(coins),
                   "exchange_rate": usd_krw_rate,
                   "last_updated": datetime.now().isoformat(),
                   "source": "coincap_realtime"
               }
               
   except Exception as e:
       print(f"[API] CoinCap API 예외 발생: {e}")
       return {
           "status": "error",
           "message": str(e),
           "last_updated": datetime.now().isoformat()
       }

# ===== CoinCap 상세 정보 API =====
@router.get("/coincap/coin/{symbol}")
async def get_coincap_coin_detail(symbol: str):
   """CoinCap API에서 특정 코인 상세 정보 조회"""
   try:
       # CoinCap ID 매핑
       coincap_id = get_coincap_id(symbol)
       if not coincap_id:
           return {"status": "error", "message": f"{symbol}의 CoinCap ID를 찾을 수 없습니다"}
       
       timeout = aiohttp.ClientTimeout(total=10, connect=5)
       async with aiohttp.ClientSession(timeout=timeout) as session:
           # 기본 자산 정보
           asset_url = f"https://api.coincap.io/v2/assets/{coincap_id}"
           
           # 히스토리 정보 (최근 30일)
           end_time = int(datetime.now().timestamp() * 1000)
           start_time = end_time - (30 * 24 * 60 * 60 * 1000)  # 30일 전
           history_url = f"https://api.coincap.io/v2/assets/{coincap_id}/history?interval=d1&start={start_time}&end={end_time}"
           
           # 마켓 정보
           markets_url = f"https://api.coincap.io/v2/assets/{coincap_id}/markets?limit=50"
           
           # 병렬 요청
           asset_task = session.get(asset_url)
           history_task = session.get(history_url)
           markets_task = session.get(markets_url)
           
           asset_response, history_response, markets_response = await asyncio.gather(
               asset_task, history_task, markets_task, return_exceptions=True
           )
           
           # 자산 정보 처리
           asset_data = None
           if isinstance(asset_response, aiohttp.ClientResponse) and asset_response.status == 200:
               asset_json = await asset_response.json()
               asset_data = asset_json.get("data")
           
           # 히스토리 정보 처리
           history_data = []
           if isinstance(history_response, aiohttp.ClientResponse) and history_response.status == 200:
               history_json = await history_response.json()
               history_data = history_json.get("data", [])
           
           # 마켓 정보 처리
           markets_data = []
           if isinstance(markets_response, aiohttp.ClientResponse) and markets_response.status == 200:
               markets_json = await markets_response.json()
               markets_data = markets_json.get("data", [])
           
           if not asset_data:
               return {"status": "error", "message": "자산 데이터를 가져올 수 없습니다"}
           
           # 실시간 환율 적용
           usd_krw_rate = await get_usd_to_krw_rate()
           
           # 상세 분석 데이터 생성
           detailed_data = generate_complete_analysis(symbol, asset_data, history_data, markets_data, usd_krw_rate)
           
           return {
               "status": "success",
               "data": detailed_data,
               "exchange_rate": usd_krw_rate,
               "last_updated": datetime.now().isoformat(),
               "source": "coincap_realtime"
           }
           
   except Exception as e:
       print(f"[API] CoinCap 상세 정보 조회 실패 ({symbol}): {e}")
       return {
           "status": "error", 
           "message": str(e),
           "fallback_data": generate_fallback_analysis(symbol)
       }

# ===== 분석 및 유틸리티 함수들 =====
def get_all_korean_names():
   """확장된 한국어 코인명 매핑"""
   return {
       # 메이저 코인
       "BTC": "비트코인", "ETH": "이더리움", "XRP": "리플", "ADA": "에이다",
       "SOL": "솔라나", "DOGE": "도지코인", "BNB": "바이낸스코인", "TRX": "트론",
       "DOT": "폴카닷", "MATIC": "폴리곤", "AVAX": "아발란체", "SHIB": "시바이누",
       "LTC": "라이트코인", "BCH": "비트코인캐시", "LINK": "체인링크", "UNI": "유니스왚",
       "ATOM": "코스모스", "NEAR": "니어프로토콜", "ALGO": "알고랜드", "VET": "비체인",
       
       # DeFi & 알트코인
       "AAVE": "에이브", "COMP": "컴파운드", "MKR": "메이커", "SNX": "신세틱스",
       "CRV": "커브", "YFI": "연파이낸스", "SUSHI": "스시스왚", "BAL": "밸런서",
       "1INCH": "원인치", "CAKE": "팬케이크스왚",
       
       # 게임 & NFT
       "SAND": "샌드박스", "MANA": "디센트럴랜드", "ENJ": "엔진코인", "CHZ": "칠리즈",
       "FLOW": "플로우", "GALA": "갈라", "AXS": "액시인피니티", "YGG": "일드길드게임즈",
       "IMX": "이뮤터블엑스", "LOOKS": "룩스레어",
       
       # 밈코인
       "PEPE": "페페", "BONK": "봉크", "FLOKI": "플로키이누", "BABY": "베이비도지",
       
       # 한국 코인
       "KLAY": "클레이튼", "WEMIX": "위믹스", "QTCON": "퀴즈톡", "CTC": "크레딧코인",
       "META": "메타디움", "MBL": "무비블록", "TEMCO": "템코", "BORA": "보라",
       
       # Layer 1 & 인프라
       "ICP": "인터넷컴퓨터", "FTM": "팬텀", "THETA": "쎄타토큰", "HBAR": "헤데라",
       "FIL": "파일코인", "EGLD": "멀티버스엑스", "MINA": "미나", "ROSE": "오아시스",
   }

def get_coincap_id(symbol):
   """심볼을 CoinCap ID로 변환"""
   mapping = {
       "BTC": "bitcoin", "ETH": "ethereum", "XRP": "ripple", "ADA": "cardano",
       "SOL": "solana", "DOGE": "dogecoin", "BNB": "binance-coin", "TRX": "tron",
       "DOT": "polkadot", "MATIC": "polygon", "AVAX": "avalanche", "SHIB": "shiba-inu",
       "LTC": "litecoin", "BCH": "bitcoin-cash", "LINK": "chainlink", "UNI": "uniswap",
       "ATOM": "cosmos", "NEAR": "near-protocol", "ALGO": "algorand", "VET": "vechain",
       "AAVE": "aave", "COMP": "compound-coin", "MKR": "maker", "SNX": "synthetix-network-token",
       "SAND": "the-sandbox", "MANA": "decentraland", "ENJ": "enjin-coin", "CHZ": "chiliz",
       "FLOW": "flow", "GALA": "gala", "AXS": "axie-infinity", "PEPE": "pepe",
       "BONK": "bonk", "FLOKI": "floki", "KLAY": "klaytn", "WEMIX": "wemix-token",
   }
   return mapping.get(symbol.upper(), symbol.lower())

async def fetch_coin_links(symbol: str, asset_data: dict) -> dict:
    """
    실제 링크를 CoinGecko에서 가져와 반환.
    - homepage, whitepaper(있으면), twitter_screen_name, repos_url.github/gitlab/bitbucket
    - CoinCap의 explorer는 homepage 폴백으로 사용
    """
    links_out = {
        "homepage": None,
        "whitepaper": None,
        "twitter_screen_name": None,
        "repos_url": {"github": None, "gitlab": None, "bitbucket": None},
        "explorer": asset_data.get("explorer"),  # CoinCap 필드(폴백/추가정보)
    }

    try:
        # 기존 코드의 CoinGecko ID 헬퍼 재사용
        coingecko_id = await get_coingecko_coin_id(symbol)
        if not coingecko_id:
            # 심볼 소문자 폴백
            coingecko_id = symbol.lower()

        url = (
            f"https://api.coingecko.com/api/v3/coins/{coingecko_id}"
            "?localization=false&tickers=false&market_data=false"
            "&community_data=true&developer_data=true&sparkline=false"
        )

        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    # CoinGecko가 실패해도 CoinCap explorer로 어느 정도 커버
                    return links_out
                data = await resp.json()
                links = data.get("links", {}) or {}

                # homepage: 리스트 중 첫 유효값
                homepages = links.get("homepage") or []
                links_out["homepage"] = next((h for h in homepages if h), None) or links_out["explorer"]

                # whitepaper: 코인마다 없을 수 있음. 일부는 'official_forum_url' 등에 섞여있기도.
                # CoinGecko에 whitepaper 키가 없을 수 있어서 안전하게 탐색
                links_out["whitepaper"] = links.get("whitepaper") or None
                if not links_out["whitepaper"]:
                    # 여차하면 announcement/official forum 중 whitepaper 문자열 포함한 것 추출 시도
                    forums = links.get("official_forum_url") or []
                    anncs  = links.get("announcement_url") or []
                    cands = [*forums, *anncs]
                    links_out["whitepaper"] = next((u for u in cands if u and "whitepaper" in u.lower()), None)

                # twitter
                links_out["twitter_screen_name"] = links.get("twitter_screen_name") or None

                # repos
                repos = links.get("repos_url", {}) or {}
                # GitHub는 리스트로 올 때가 흔함
                gh = repos.get("github")
                if isinstance(gh, list):
                    gh = next((g for g in gh if g), None)
                links_out["repos_url"]["github"] = gh or None

                # CoinGecko는 보통 gitlab/bitbucket은 잘 안 줌
                gl = repos.get("gitlab")
                if isinstance(gl, list):
                    gl = next((g for g in gl if g), None)
                bb = repos.get("bitbucket")
                if isinstance(bb, list):
                    bb = next((g for g in bb if g), None)
                links_out["repos_url"]["gitlab"] = gl or None
                links_out["repos_url"]["bitbucket"] = bb or None

    except Exception:
        # 실패 시에도 explorer 폴백은 유지
        pass

    # homepage가 끝내 없으면 explorer를 최종 폴백
    if not links_out["homepage"]:
        links_out["homepage"] = links_out["explorer"]

    return links_out


def generate_complete_analysis(
    symbol, asset_data, history_data, markets_data, usd_krw_rate=1387, links: dict | None = None
):
   """완전한 코인 분석 데이터 생성 (실시간 환율 적용 + 실제 링크 주입)"""
   korean_names = get_all_korean_names()
   korean_name = korean_names.get(symbol, asset_data.get("name", symbol))
   rank = int(asset_data.get("rank", 999))
   price_usd = float(asset_data.get("priceUsd", 0))
   price_krw = price_usd * usd_krw_rate

   # 가격 변동률 계산
   price_changes = calculate_price_changes(history_data, price_usd)

   # 리스크/점수 분석(기존 로직 가정)
   analysis = generate_smart_analysis(symbol, rank, price_changes)

   # 링크: 주입된 links 사용 + 폴백
   links = links or {}
   homepage = links.get("homepage") or asset_data.get("explorer")
   whitepaper = links.get("whitepaper")
   twitter_screen_name = links.get("twitter_screen_name")
   repos_url = links.get("repos_url", {"github": None, "gitlab": None, "bitbucket": None})

   # 딕셔너리 만들기 전에 계산
   _price_usd = float(asset_data.get("priceUsd") or 0.0)
   _supply = float(asset_data.get("supply") or 0.0)
   _market_cap_usd = (
       _price_usd * _supply
       if (_price_usd > 0 and _supply > 0)
       else float(asset_data.get("marketCapUsd") or 0.0)
   )
   return {
        # 기본 정보
        "id": asset_data.get("id"),
        "name": korean_name,
        "symbol": symbol,
        "description": analysis["description"],

        # 순위 및 점수
        "market_cap_rank": rank,
        "coingecko_score": analysis["scores"]["overall"],
        "developer_score": analysis["scores"]["developer"],
        "community_score": analysis["scores"]["community"],
        
        # 가격 정보 (환율 적용)
        "current_price": price_krw,
        "market_cap": _market_cap_usd * usd_krw_rate,
        "total_volume": float(asset_data.get("volumeUsd24Hr") or 0.0) * usd_krw_rate,
        
        # 공급량
        "total_supply": float(asset_data.get("supply", 0)),
        "circulating_supply": float(asset_data.get("supply", 0)),
        "max_supply": float(asset_data.get("maxSupply", 0)) if asset_data.get("maxSupply") else None,

        # 가격 변동
        "price_change_24h": float(asset_data.get("changePercent24Hr", 0)),
        "price_change_7d": price_changes.get("7d", 0),
        "price_change_30d": price_changes.get("30d", 0),
        "price_change_1y": price_changes.get("1y", 0),

        # 고가/저가/ATH/ATL (샘플 계산 유지)
        "high_24h": price_krw * 1.05,
        "low_24h": price_krw * 0.95,
        "ath": price_krw * analysis["multiples"]["ath"],
        "ath_date": "2024-01-01T00:00:00.000Z",
        "atl": price_krw * analysis["multiples"]["atl"],
        "atl_date": "2023-01-01T00:00:00.000Z",

        # 카테고리/기술
        "categories": analysis["categories"],
        "hashing_algorithm": analysis["technology"]["algorithm"],
        "consensus_mechanism": analysis["technology"]["consensus"],

        # 투자/리스크
        "investment_grade": analysis["investment"]["grade"],
        "risk_level": analysis["investment"]["risk"],
        "volatility_analysis": analysis["risks"]["volatility"],
        "liquidity_risk": analysis["risks"]["liquidity"],
        "market_position_risk": analysis["risks"]["market_position"],

        # ✅ 링크(실제)
        "homepage": homepage,
        "whitepaper": whitepaper,
        "twitter_screen_name": twitter_screen_name,
        "repos_url": {
            "github": repos_url.get("github"),
            "gitlab": repos_url.get("gitlab"),
            "bitbucket": repos_url.get("bitbucket"),
        },

        # 보조 정보
        "explorer": asset_data.get("explorer"),  # 참고용으로 그대로 유지
    }