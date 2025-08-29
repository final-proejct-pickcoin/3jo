# === bithumb_api.py (optimized, drop-in replacement) ===

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
import redis
import requests
import threading
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime, timedelta
from collections import defaultdict
from functools import lru_cache

# 라우터 생성 (원형 유지)
router = APIRouter(prefix="/api", tags=["bithumb"])

# ===== 공용 세션 / 세마포어 / 캐시 =====
# 단일 aiohttp 세션 재사용 (세션 생성/소멸 오버헤드 제거)
class _Http:
    _session: aiohttp.ClientSession | None = None
    _lock = asyncio.Lock()

    @classmethod
    async def session(cls, timeout_sec: float = 8.0) -> aiohttp.ClientSession:
        if cls._session and not cls._session.closed:
            return cls._session
        async with cls._lock:
            if cls._session and not cls._session.closed:
                return cls._session
            cls._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=timeout_sec, connect=3)
            )
        return cls._session

    @classmethod
    async def close(cls):
        if cls._session and not cls._session.closed:
            await cls._session.close()

# 외부 API 동시성 보호 (과도한 동시 호출 급증 방지)
COINGECKO_SEM = asyncio.Semaphore(8)   # CoinGecko
GENERIC_SEM   = asyncio.Semaphore(16)  # 기타 공용

# Redis (꺼져 있어도 동작하도록 예외 안전)
try:
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
    _ = redis_client.ping()
except Exception:
    class _DummyRedis:
        def get(self, *a, **k): return None
        def setex(self, *a, **k): return None
    redis_client = _DummyRedis()

# ===== 환율 캐시 관리 =====
_exchange_rate_cache = {"rate": None, "timestamp": 0}
_EXCHANGE_RATE_TTL = 3600  # 1시간

def get_cached_exchange_rate():
    """1시간 캐시"""
    current_time = time.time()
    cache_age = current_time - _exchange_rate_cache["timestamp"]
    if cache_age < _EXCHANGE_RATE_TTL and _exchange_rate_cache["rate"]:
        return _exchange_rate_cache["rate"]
    return None

def cache_exchange_rate(rate):
    _exchange_rate_cache["rate"] = rate
    _exchange_rate_cache["timestamp"] = time.time()

# 네이버 환율 정규식 사전 컴파일
_NAVER_PATTERNS = [
    re.compile(r'class="no_today"[^>]*><em>([0-9,]+\.?[0-9]*)</em>', re.DOTALL),
    re.compile(r'<strong[^>]*class="[^"]*tah[^"]*"[^>]*>([0-9,]{4,}\.?[0-9]*)</strong>', re.DOTALL),
    re.compile(r'id="exchangeList"[^>]*>.*?<em[^>]*>([0-9,]{4,}\.?[0-9]*)</em>', re.DOTALL),
    re.compile(r'현재가[^>]*>.*?([0-9,]{4,}\.?[0-9]*)', re.DOTALL),
]

async def get_naver_exchange_rate_improved():
    """개선된 네이버 환율 크롤링"""
    try:
        url = "https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_USDKRW"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        session = await _Http.session(15)
        async with GENERIC_SEM:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    return None
                html = await response.text()
        for pat in _NAVER_PATTERNS:
            for match in pat.findall(html):
                try:
                    rate = float(match.replace(",", ""))
                    if 1350 <= rate <= 1450:
                        return rate
                except:
                    continue
    except Exception:
        pass
    return None

async def get_usd_to_krw_rate():
    """USD → KRW 실시간 환율 조회 (다중 API 백업)"""
    cached = get_cached_exchange_rate()
    if cached and cached > 1300:
        return cached

    api_sources = [
        {
            "name": "ExchangeRate-API",
            "url": "https://api.exchangerate-api.com/v4/latest/USD",
            "parser": lambda d: d.get("rates", {}).get("KRW", 0)
        },
        {
            "name": "ExchangeRate.host",
            "url": "https://api.exchangerate.host/latest?base=USD&symbols=KRW",
            "parser": lambda d: d.get("rates", {}).get("KRW", 0)
        },
        {
            "name": "Fawaz-API",
            "url": "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
            "parser": lambda d: d.get("usd", {}).get("krw", 0)
        }
    ]

    session = await _Http.session(8)
    for src in api_sources:
        try:
            async with GENERIC_SEM:
                async with session.get(src["url"]) as resp:
                    if resp.status != 200:
                        continue
                    data = await resp.json()
            rate = src["parser"](data)
            if rate and isinstance(rate, (int, float)):
                rate = float(rate)
                if 1350 <= rate <= 1450:
                    cache_exchange_rate(rate)
                    return rate
        except Exception:
            continue

    # 백업: 네이버
    naver_rate = await get_naver_exchange_rate_improved()
    if naver_rate:
        cache_exchange_rate(naver_rate)
        return naver_rate

    # 최후: 캐시 or 추정
    cached_fallback = get_cached_exchange_rate()
    if cached_fallback:
        return cached_fallback
    return 1387.0  # 추정

# ===== 유통량 추정 함수 =====
def estimate_realistic_supply(symbol: str, current_price: float) -> float:
    symbol_upper = symbol.upper()
    major_supplies = {
        "BTC": 19_500_000, "ETH": 120_000_000, "XRP": 100_000_000_000,
        "ADA": 35_000_000_000, "SOL": 400_000_000, "DOGE": 140_000_000_000,
        "MATIC": 9_000_000_000, "AVAX": 400_000_000, "DOT": 1_000_000_000,
        "LINK": 1_000_000_000, "LTC": 70_000_000, "BCH": 19_000_000,
        "XLM": 25_000_000_000, "EOS": 1_000_000_000, "ATOM": 300_000_000,
        "NEAR": 1_000_000_000, "ALGO": 7_000_000_000, "VET": 70_000_000_000,
        "ICP": 500_000_000, "FTM": 3_000_000_000, "THETA": 1_000_000_000,
        "HBAR": 50_000_000_000, "TRX": 100_000_000_000, "FIL": 2_000_000_000,
        "KLAY": 3_000_000_000, "WEMIX": 1_000_000_000, "QTUM": 100_000_000,
        "ICX": 800_000_000, "WAVES": 100_000_000, "ZIL": 13_000_000_000,
        "ONE": 12_000_000_000, "CELO": 1_000_000_000,
    }
    if symbol_upper in major_supplies:
        return major_supplies[symbol_upper]
    if current_price >= 10_000_000:
        return 10_000_000
    if current_price >= 1_000_000:
        return 100_000_000
    if current_price >= 100_000:
        return 1_000_000_000
    if current_price >= 10_000:
        return 10_000_000_000
    if current_price >= 1_000:
        return 100_000_000_000
    return 1_000_000_000_000

# ===== CoinGecko API 함수들 =====
# 코인 리스트/ID 캐시 (LRU + 프로세스 캐시)
@lru_cache(maxsize=1)
def _coingecko_all_coins_cache_key():
    # 캐시 키만 필요 (lru_cache 트릭)
    return "all_coins_cached"

_coingecko_list_cache: dict[str, str] = {}   # symbol_upper -> id
_coingecko_market_cache: dict[str, tuple[dict, float]] = {}  # id -> (data, expires_at_ts)

async def get_coingecko_coin_id(symbol: str):
    """CoinGecko에서 심볼로 코인 ID 자동 검색 (캐싱 강화)"""
    symbol_upper = symbol.upper()
    # 로컬 캐시 우선
    cid = _coingecko_list_cache.get(symbol_upper)
    if cid:
        return cid

    # 전체 리스트 (1회 로드 후 메모리 유지)
    try:
        session = await _Http.session(10)
        async with COINGECKO_SEM:
            async with session.get("https://api.coingecko.com/api/v3/coins/list") as resp:
                if resp.status != 200:
                    return symbol.lower()
                coins = await resp.json()
    except Exception:
        return symbol.lower()

    # 캐시 빌드
    for coin in coins:
        cs = coin.get("symbol", "")
        cid = coin.get("id", "")
        if not cs or not cid:
            continue
        _coingecko_list_cache[cs.upper()] = cid

    return _coingecko_list_cache.get(symbol_upper, symbol.lower())

async def _get_coingecko_detail_by_id(coin_id: str) -> dict | None:
    """단일 코인 상세 (로컬 TTL 캐시 5분)"""
    now = time.time()
    cached = _coingecko_market_cache.get(coin_id)
    if cached and cached[1] > now:
        return cached[0]
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
    try:
        session = await _Http.session(10)
        async with COINGECKO_SEM:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
        _coingecko_market_cache[coin_id] = (data, now + 300)  # 5분 TTL
        return data
    except Exception:
        return None

async def get_coingecko_market_cap(symbol: str):
    """CoinGecko API에서 정확한 시가총액 계산"""
    try:
        coingecko_id = await get_coingecko_coin_id(symbol)
        if not coingecko_id:
            return None
        data = await _get_coingecko_detail_by_id(coingecko_id)
        if not data:
            return None

        md = data.get("market_data", {}) or {}
        price_usd = md.get("current_price", {}).get("usd", 0) or 0
        volume_24h_usd = md.get("total_volume", {}).get("usd", 0) or 0
        price_change_24h = md.get("price_change_percentage_24h", 0) or 0
        circ = md.get("circulating_supply")
        total = md.get("total_supply")
        maxs = md.get("max_supply")
        supply_for_calc = circ or total or maxs or 0
        if price_usd > 0 and supply_for_calc > 0:
            mcap_usd = price_usd * supply_for_calc
            return {
                "price_usd": price_usd,
                "market_cap_usd": mcap_usd,
                "volume_24h_usd": volume_24h_usd,
                "price_change_24h": price_change_24h,
                "coingecko_id": coingecko_id,
                "supply_info": {
                    "circulating": circ,
                    "total": total,
                    "max": maxs,
                    "used_for_calculation": supply_for_calc
                }
            }
        # 폴백: API가 제공하는 mcap
        api_mcap = (md.get("market_cap") or {}).get("usd", 0) or 0
        if api_mcap > 0:
            return {
                "price_usd": price_usd,
                "market_cap_usd": api_mcap,
                "volume_24h_usd": volume_24h_usd,
                "price_change_24h": price_change_24h,
                "coingecko_id": coingecko_id
            }
    except Exception:
        pass
    return None

# 빠른 대량 호출용: 이미 구현되어 있던 이름 유지
async def get_coingecko_market_cap_fast(symbol: str, usd_krw_rate: float):
    # 내부적으로 get_coingecko_market_cap 사용 (캐시/세마포어의 이점 활용)
    return await get_coingecko_market_cap(symbol)

# ===== 빗썸 API =====
async def get_bithumb_coin_data(symbol: str):
    """빗썸에서 특정 코인 데이터 조회 (실패 시에도 fallback 보장)"""
    try:
        url = f"https://api.bithumb.com/public/ticker/{symbol}_KRW"
        session = await _Http.session(10)
        async with GENERIC_SEM:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "0000":
                        td = data.get("data", {}) or {}
                        current_price = float(td.get("closing_price", 0) or 0)
                        return {
                            "status": "success",
                            "data": {
                                "current_price": current_price,
                                "opening_price": float(td.get("opening_price", 0) or 0),
                                "max_price": float(td.get("max_price", 0) or 0),
                                "min_price": float(td.get("min_price", 0) or 0),
                                "change_rate": float(td.get("fluctate_rate_24H", 0) or 0),
                                "change_amount": float(td.get("fluctate_24H", 0) or 0),
                                "volume": float(td.get("acc_trade_value_24H", 0) or 0),
                                "units_traded": float(td.get("units_traded_24H", 0) or 0),
                                "prev_closing_price": float(td.get("prev_closing_price", 0) or 0),
                                "timestamp": td.get("date"),
                                "tick_size": get_bithumb_tick_size(symbol, current_price),
                                "market_warning": "NONE",
                            }
                        }
    except Exception:
        pass
    fb = generate_fallback_coin_data(symbol)
    return {"status": "success", "data": fb}

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
    try:
        url = "https://api.bithumb.com/v1/market/all"
        session = await _Http.session(8)
        async with GENERIC_SEM:
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
}

def get_bithumb_tick_size(symbol: str, price: float) -> float:
    table = BITHUMB_TICK_SIZE_TABLE.get(symbol.upper())
    if table:
        for min_p, max_p, tick in table:
            if min_p <= price < max_p:
                return tick
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
    """특정 코인의 오더북(호가) 데이터"""
    try:
        url = f"https://api.bithumb.com/public/orderbook/{symbol}_KRW?count=15"
        session = await _Http.session(8)
        async with GENERIC_SEM:
            async with session.get(url) as response:
                if response.status != 200:
                    return {"status": "error", "message": f"API 오류: {response.status}"}
                data = await response.json()
        orderbook = data.get("data", {}) or {}
        # 현재가 기준 tick size 계산
        price = 0.0
        try:
            bids0 = (orderbook.get("bids") or [{}])[0]
            asks0 = (orderbook.get("asks") or [{}])[0]
            price = float(bids0.get("price") or 0) or float(asks0.get("price") or 0) or 0.0
        except Exception:
            price = 0.0
        tick_size = get_bithumb_tick_size(symbol, price)
        return {
            "status": "success",
            "symbol": symbol,
            "data": orderbook,
            "tick_size": tick_size
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ===== 빗썸 REST API 테스트 =====
@router.get("/test-bithumb")
async def test_bithumb():
    '''빗썸 API 연결 테스트'''
    try:
        url = "https://api.bithumb.com/public/ticker/BTC_KRW"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "success",
                "message": "빗썸 API 연결 성공",
                "data": data
            }
        else:
            return {"status": "error", "message": f"API 오류: {response.status_code}"}
    except Exception as e:
        return {"status": "error", "message": f"연결 실패: {str(e)}"}

# ===== 특정 코인 차트 데이터 =====
@router.get("/chart/{symbol}")
async def get_chart_data(symbol: str, interval: str = "24h"):
    try:
        url = f"https://api.bithumb.com/public/candlestick/{symbol}_KRW/{interval}"
        response = requests.get(url, timeout=6)
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
        session = await _Http.session(5)
        async with GENERIC_SEM:
            async with session.get(url) as response:
                if response.status != 200:
                    return {}
                markets = await response.json()
        korean_map = {}
        for market in markets:
            mk = market.get("market", "")
            if mk.startswith("KRW-"):
                symbol = mk[4:]
                kn = (market.get("korean_name") or "").strip()
                if kn:
                    korean_map[symbol] = kn
        with upbit_korean_map_lock:
            upbit_korean_map = korean_map
            upbit_korean_map_loaded = True
        return korean_map
    except Exception:
        return {}

async def get_korean_names_from_upbit():
    global upbit_korean_map, upbit_korean_map_loaded
    if upbit_korean_map_loaded:
        return upbit_korean_map
    return await load_upbit_korean_map()

# ===== 코인 한글명 매핑 함수 =====
def get_korean_name(symbol: str) -> str:
    """코인 심볼을 한글명으로 변환 (확장 사전)"""
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

        # 최신 트렌드
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
    """모든 활성 거래 코인 목록 조회 (성능 최적화 버전)"""
    # 1. Redis 캐시
    try:
        cached = redis_client.get("coin_list_cache")
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    # 2. 외부 공용 데이터 1회 호출
    usd_krw_rate = await get_usd_to_krw_rate()
    upbit_korean_names = await get_korean_names_from_upbit()

    markets_url = "https://api.bithumb.com/v1/market/all"
    ticker_url  = "https://api.bithumb.com/public/ticker/ALL_KRW"

    try:
        session = await _Http.session(5)
        async with GENERIC_SEM:
            market_task = session.get(markets_url)
            ticker_task = session.get(ticker_url)
            market_response, ticker_response = await asyncio.gather(market_task, ticker_task)

        if ticker_response.status != 200:
            return {"status": "error", "message": f"시세 API 오류: {ticker_response.status}"}

        ticker_data = await ticker_response.json()
        if ticker_data.get("status") != "0000":
            return {"status": "error", "message": "빗썸 시세 API 오류"}

        # 마켓 데이터
        market_map = {}
        if market_response.status == 200:
            try:
                markets_data = await market_response.json()
                if isinstance(markets_data, list):
                    for market in markets_data:
                        market_code = market.get("market", "")
                        if market_code.endswith("_KRW"):
                            symbol = market_code[:-4]
                            market_map[symbol] = {
                                "korean_name": market.get("korean_name", ""),
                                "english_name": market.get("english_name", ""),
                                "market_warning": market.get("market_warning", "NONE")
                            }
            except Exception:
                pass

        # 기본 데이터
        coin_symbols = []
        coin_basic_data = []
        for symbol, info in (ticker_data.get("data") or {}).items():
            if symbol == "date":
                continue
            current_price = float(info.get("closing_price", 0) or 0)
            mi = market_map.get(symbol, {})
            bithumb_k = (mi.get("korean_name") or "").strip()
            upbit_k = upbit_korean_names.get(symbol, "")
            bithumb_e = (mi.get("english_name") or "").strip()
            basic_k = get_korean_name(symbol)
            display_name = bithumb_k or upbit_k or bithumb_e or (basic_k if basic_k != symbol else symbol)
            coin_basic_data.append({
                "symbol": symbol,
                "info": info,
                "market_info": mi,
                "display_name": display_name,
                "current_price": current_price
            })
            coin_symbols.append(symbol)

        # CoinGecko 대량 처리 (배치 + 캐시)
        coingecko_results: dict[str, dict] = {}
        batch_size = 50
        for i in range(0, len(coin_symbols), batch_size):
            batch_symbols = coin_symbols[i:i + batch_size]
            tasks = [asyncio.create_task(get_coingecko_market_cap_fast(sym, usd_krw_rate)) for sym in batch_symbols]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for sym, res in zip(batch_symbols, results):
                if isinstance(res, Exception) or not res:
                    continue
                coingecko_results[sym] = res

        # 최종 조합
        coins = []
        append = coins.append
        for cd in coin_basic_data:
            symbol = cd["symbol"]
            info = cd["info"]
            cp = cd["current_price"]
            try:
                trade_value = float(info.get("acc_trade_value_24H", 0) or 0)
                cg = coingecko_results.get(symbol)
                if cg and cg.get("market_cap_usd"):
                    accurate_market_cap = float(cg["market_cap_usd"]) * float(usd_krw_rate)
                    accurate_circulating_supply = (cg.get("supply_info") or {}).get("used_for_calculation", 0) or 0
                else:
                    estimated_supply = estimate_realistic_supply(symbol, cp)
                    accurate_market_cap = cp * estimated_supply
                    accurate_circulating_supply = estimated_supply

                change_rate = float(info.get("fluctate_rate_24H", 0) or 0)
                abs_cr = abs(change_rate) / 100.0
                estimated_high = cp * (1 + abs_cr)
                estimated_low  = cp * (1 - abs_cr)

                append({
                    "symbol": symbol,
                    "korean_name": cd["display_name"],
                    "english_name": cd["market_info"].get("english_name", "") or symbol,
                    "current_price": round(cp, 4),
                    "change_rate": change_rate,
                    "change_amount": round(float(info.get("fluctate_24H", 0) or 0), 4),
                    "volume": round(trade_value, 4),
                    "market_warning": cd["market_info"].get("market_warning", "NONE"),
                    "units_traded": float(info.get("units_traded_24H", 0) or 0),
                    "market_cap": round(accurate_market_cap, 2),
                    "circulating_supply": round(accurate_circulating_supply, 2),
                    "high_24h": round(estimated_high, 2),
                    "low_24h": round(estimated_low, 2)
                })
            except Exception:
                continue

        coins.sort(key=lambda x: x["volume"], reverse=True)

        result = {
            "status": "success",
            "data": coins,
            "total_count": len(coins),
            "upbit_korean_names": len(upbit_korean_names),
            "last_updated": datetime.now().isoformat()
        }
        try:
            redis_client.setex("coin_list_cache", 300, json.dumps(result))
        except Exception:
            pass
        return result

    except Exception as e:
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
    markets_url = "https://api.bithumb.com/v1/market/all"
    ticker_url  = "https://api.bithumb.com/public/ticker/ALL_BTC"
    try:
        session = await _Http.session(3)
        async with GENERIC_SEM:
            market_task = session.get(markets_url)
            ticker_task = session.get(ticker_url)
            market_response, ticker_response = await asyncio.gather(market_task, ticker_task)
        if ticker_response.status != 200:
            return {"status": "error", "message": f"BTC 시세 API 오류: {ticker_response.status}"}
        ticker_data = await ticker_response.json()
        if ticker_data.get("status") != "0000":
            return {"status": "error", "message": "빗썸 BTC 시세 API 오류"}

        market_map = {}
        if market_response.status == 200:
            try:
                markets_data = await market_response.json()
                if isinstance(markets_data, list):
                    for market in markets_data:
                        market_code = market.get("market", "")
                        if market_code.endswith("_BTC"):
                            symbol = market_code[:-4]
                            market_map[symbol] = {
                                "korean_name": market.get("korean_name", ""),
                                "english_name": market.get("english_name", ""),
                                "market_warning": market.get("market_warning", "NONE")
                            }
            except Exception:
                pass

        coins = []
        append = coins.append
        for symbol, info in (ticker_data.get("data") or {}).items():
            if symbol == "date":
                continue
            try:
                trade_value = float(info.get("acc_trade_value_24H", 0) or 0)
                if trade_value <= 0:
                    continue
                mi = market_map.get(symbol, {})
                bithumb_k = (mi.get("korean_name") or "").strip()
                bithumb_e = (mi.get("english_name") or "").strip()
                display_name = bithumb_k or bithumb_e or symbol
                append({
                    "symbol": symbol,
                    "korean_name": display_name,
                    "english_name": bithumb_e or symbol,
                    "current_price": round(float(info.get("closing_price", 0) or 0), 4),
                    "change_rate": float(info.get("fluctate_rate_24H", 0) or 0),
                    "change_amount": round(float(info.get("fluctate_24H", 0) or 0), 4),
                    "volume": round(trade_value, 4),
                    "market_warning": mi.get("market_warning", "NONE"),
                    "units_traded": round(float(info.get("units_traded_24H", 0) or 0), 4)
                })
            except Exception:
                continue
        coins.sort(key=lambda x: x["volume"], reverse=True)
        return {
            "status": "success",
            "data": coins,
            "total_count": len(coins),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
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
        self.connections: list[WebSocket] = []
        self.connection_stats = {}
        self.subscribed_symbols = []
        self.bithumb_ws = None

bithumb_manager = BithumbWebSocketManager()

# 실시간 WebSocket 브로드캐스트
async def broadcast_to_clients(message):
    dead = []
    for ws in bithumb_manager.connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    if dead:
        for ws in dead:
            try:
                bithumb_manager.connections.remove(ws)
            except Exception:
                pass

# ===== 실시간 WebSocket 엔드포인트 =====
@router.websocket("/realtime")
async def realtime_ws(websocket: WebSocket):
    await websocket.accept()
    bithumb_manager.connections.append(websocket)
    watcher_task = None
    try:
        # 초기 코인 목록 전송
        coins_resp = await get_coin_list()
        last_coin_list = coins_resp["data"][:] if coins_resp.get("status") == "success" else []
        if coins_resp.get("status") == "success":
            await websocket.send_text(json.dumps({"type": "initial_coins", "data": last_coin_list}))

        # 코인 목록 감시 (30초)
        async def coin_list_watcher():
            nonlocal last_coin_list
            while True:
                await asyncio.sleep(30)
                try:
                    new_resp = await get_coin_list()
                    if new_resp.get("status") != "success":
                        continue
                    new_list = new_resp["data"]
                    if {c['symbol'] for c in last_coin_list} != {c['symbol'] for c in new_list}:
                        await websocket.send_text(json.dumps({"type": "update_coins", "data": new_list}))
                        last_coin_list = new_list[:]
                except Exception:
                    continue

        watcher_task = asyncio.create_task(coin_list_watcher())

        # 실제 빗썸 WebSocket 연결
        await connect_to_bithumb_websocket(websocket, last_coin_list)

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        try:
            bithumb_manager.connections.remove(websocket)
        except Exception:
            pass
        if watcher_task:
            try:
                watcher_task.cancel()
            except Exception:
                pass

async def connect_to_bithumb_websocket(client_websocket, coins_data):
    """빗썸 WebSocket 연결 (KRW + BTC 마켓 지원)"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            bithumb_uri = "wss://pubwss.bithumb.com/pub/ws"
            async with websockets.connect(bithumb_uri, ping_interval=20, ping_timeout=20) as ws_bithumb:
                # 간단한 메시지 수신 시도 (타임아웃 짧게)
                try:
                    _ = await asyncio.wait_for(ws_bithumb.recv(), timeout=5.0)
                except asyncio.TimeoutError:
                    pass

                krw_symbols = [coin['symbol'] + '_KRW' for coin in coins_data]
                sub = {"type": "ticker", "symbols": krw_symbols, "tickTypes": ["24H"]}
                await ws_bithumb.send(json.dumps(sub))

                while True:
                    try:
                        raw = await asyncio.wait_for(ws_bithumb.recv(), timeout=30.0)
                        data = json.loads(raw)
                        if data.get("type") != "ticker":
                            continue
                        content = data.get("content", {}) or {}
                        symbol = content.get("symbol")
                        close_price = content.get("closePrice")
                        if not symbol or not close_price:
                            continue
                        formatted = {
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
                        dead = []
                        for ws in bithumb_manager.connections:
                            try:
                                await ws.send_text(json.dumps(formatted))
                            except Exception:
                                dead.append(ws)
                        if dead:
                            for ws in dead:
                                try:
                                    bithumb_manager.connections.remove(ws)
                                except Exception:
                                    pass
                    except asyncio.TimeoutError:
                        try:
                            await ws_bithumb.ping()
                        except Exception:
                            break
                        continue
                    except Exception:
                        continue
        except Exception:
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** (attempt + 1))
                continue
        break

# ===== 특정 코인 상세 정보 API =====
@router.get("/coin/{symbol}")
async def get_coin_detail(symbol: str):
    """특정 코인의 상세 정보 조회 (실시간 환율로 정확한 시가총액 계산)"""
    try:
        bithumb_data, coingecko_data, usd_krw_rate = await asyncio.gather(
            get_bithumb_coin_data(symbol),
            get_coingecko_market_cap(symbol),
            get_usd_to_krw_rate()
        )

        result_data = {}
        if isinstance(bithumb_data, dict) and bithumb_data.get("status") == "success":
            bd = bithumb_data.get("data") or {}
            result_data.update(bd)

        if coingecko_data:
            price_usd = coingecko_data["price_usd"]
            global_price_krw = price_usd * usd_krw_rate
            global_market_cap_krw = coingecko_data.get("market_cap_usd", 0) * usd_krw_rate
            result_data.update({
                "coingecko_id": coingecko_data.get("coingecko_id"),
                "price_usd": float(price_usd),
                "market_cap_usd": float(coingecko_data.get("market_cap_usd", 0) or 0),
                "volume_24h_usd": float(coingecko_data.get("volume_24h_usd", 0) or 0),
                "price_change_24h": float(coingecko_data.get("price_change_24h", 0) or 0),
                "global_price_krw": float(global_price_krw),
                "global_market_cap_krw": float(global_market_cap_krw),
                "supply_info": coingecko_data.get("supply_info") or {}
            })

        # 이름/표시명 보강
        symbol_up = symbol.upper()
        display_name = ""
        try:
            # 이미 로드되어 있으면 사용
            if upbit_korean_map_loaded:
                display_name = (upbit_korean_map.get(symbol_up) or "").strip()
            if not display_name:
                # 필요 시 한 번만 로드
                names = await get_korean_names_from_upbit()
                display_name = (names.get(symbol_up) or "").strip()
        except Exception:
            pass
        if not display_name:
            display_name = get_korean_name(symbol_up)

        # 현재가/틱사이즈/시총 계산 (정합성 보장)
        current_price = 0.0
        try:
            cp = result_data.get("current_price")
            current_price = float(cp) if cp is not None else 0.0
        except Exception:
            current_price = 0.0

        # 글로벌 KRW 가격이 있고 현지 가격이 없는 경우 보정
        if current_price <= 0 and result_data.get("global_price_krw"):
            try:
                current_price = float(result_data["global_price_krw"])
                result_data["current_price"] = current_price
            except Exception:
                pass

        # 틱사이즈
        try:
            result_data["tick_size"] = get_bithumb_tick_size(symbol_up, float(current_price or 0))
        except Exception:
            result_data["tick_size"] = get_bithumb_tick_size(symbol_up, 0.0)

        # 시가총액 (가능하면 CoinGecko 기반, 아니면 합리적 추정)
        try:
            if result_data.get("global_market_cap_krw"):
                result_data["market_cap"] = float(result_data["global_market_cap_krw"])
            else:
                est_supply = 0.0
                si = result_data.get("supply_info") or {}
                est_supply = float(
                    si.get("circulating")
                    or si.get("total")
                    or si.get("max")
                    or si.get("used_for_calculation")
                    or 0
                )
                if est_supply <= 0:
                    est_supply = float(estimate_realistic_supply(symbol_up, float(current_price or 0)))
                result_data["market_cap"] = float(current_price or 0) * est_supply
        except Exception:
            # 완전 폴백
            est_supply = float(estimate_realistic_supply(symbol_up, float(current_price or 0)))
            result_data["market_cap"] = float(current_price or 0) * est_supply

        # 부가 필드 정리
        result_data["symbol"] = symbol_up
        result_data["korean_name"] = display_name or symbol_up
        result_data["english_name"] = result_data.get("english_name", symbol_up)
        result_data["last_updated"] = datetime.now().isoformat()

        return {"status": "success", "data": result_data}

    except Exception as e:
        # 강건한 폴백
        fb = generate_fallback_coin_data(symbol.upper())
        fb["error"] = str(e)
        fb["last_updated"] = datetime.now().isoformat()
        return {"status": "success", "data": fb}
