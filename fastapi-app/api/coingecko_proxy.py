# from fastapi import APIRouter, HTTPException, Query
# import os, asyncio, httpx
# import time
# from httpx import Timeout

# CACHE_TTL = int(os.getenv("TOPCAP_CACHE_SEC", "60"))  # 60초 캐시
# _cache = {}

# router = APIRouter(prefix="/proxy", tags=["proxy"])

# CG_URL = "https://api.coingecko.com/api/v3/coins/markets"
# CP_URL = "https://api.coinpaprika.com/v1/tickers"  # 대체 소스
# API_KEY = os.getenv("COINGECKO_API_KEY")

# HEADERS = {"Accept": "application/json", "User-Agent": "pickcoin-fastapi/1.0"}
# if API_KEY:
#     HEADERS["x-cg-demo-api-key"] = API_KEY

# async def get_json(url: str, params: dict = None, headers: dict = None):
#     for i in range(2):
#         try:
#             async with httpx.AsyncClient(timeout=10) as client:
#                 r = await client.get(url, params=params, headers=headers)
#             if r.status_code == 429 and i < 1:
#                 await asyncio.sleep(int(r.headers.get("Retry-After", "5")))
#                 continue
#             r.raise_for_status()
#             return r.json()
#         except Exception as e:
#             if i == 1:
#                 raise

# @router.get("/topcap")
# async def topcap(vs: str = Query("krw")):
#     vs = vs.lower()
#     key = ("topcap", vs)
#     now = time.time()

#     # 1) 캐시가 있으면 즉시 반환 (아래 2단계와 연결)
#     cached = _cache.get(key)
#     if cached and now - cached[0] < CACHE_TTL:
#         return cached[1]

#     # 2) CoinGecko: 아주 짧은 타임아웃 + 1회만 시도
#     params = {
#         "vs_currency": vs,
#         "order": "market_cap_desc",
#         "per_page": 10, "page": 1,
#         "sparkline": "false",
#         "price_change_percentage": "24h",
#     }
#     try:
#         # 연결 1.5s, 전체 4s 안에 끝나지 않으면 포기
#         async with httpx.AsyncClient(timeout=Timeout(4.0, connect=1.5)) as client:
#             r = await client.get(CG_URL, params=params, headers=HEADERS)
#         if r.status_code == 200:
#             data = r.json()
#             _cache[key] = (now, data)     # 캐시 저장
#             return data
#         # 429나 기타 비정상 → 바로 폴백
#     except Exception:
#         pass

#     # 3) CoinPaprika 폴백 (동일 스키마로 변환)
#     async with httpx.AsyncClient(timeout=Timeout(4.0, connect=1.5)) as client:
#         r = await client.get(CP_URL, params={"quotes": vs.upper()})
#     r.raise_for_status()
#     cp = r.json()

#     cp_sorted = sorted(
#         (x for x in cp if x.get("quotes", {}).get(vs.upper())),
#         key=lambda x: x["quotes"][vs.upper()].get("market_cap", 0),
#         reverse=True,
#     )[:10]

#     out = []
#     for i, x in enumerate(cp_sorted, 1):
#         q = x["quotes"][vs.upper()]
#         out.append({
#             "id": x["id"],
#             "symbol": (x.get("symbol") or "").upper(),
#             "name": x.get("name"),
#             "current_price": q.get("price"),
#             "market_cap": q.get("market_cap"),
#             "market_cap_rank": i,
#             "price_change_percentage_24h_in_currency": q.get("percent_change_24h"),
#             "image": f"https://static.coinpaprika.com/coin/{x['id']}/logo.png",
#         })

#     _cache[key] = (now, out)  # 캐시 저장
#     return out
