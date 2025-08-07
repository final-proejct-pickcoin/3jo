from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect, status, Query, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import redis
from utils.user_manager import ConnectionManager
from alert_manager import AlertManager
from json import dumps
from fastapi.middleware.cors import CORSMiddleware
from api.news_router import router as news_router
from api.auth import router as auth_router
from api.admin_user import router as admin_user_router
import asyncio
import websockets
import aiohttp
from datetime import datetime
import json

load_dotenv()

# docker-compose.yml의 서비스명이 redis이면
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
# host = '127.0.0.1'
host = 'mysql'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# CORS 설정
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# 뉴스 크롤링 라우터
app.include_router(news_router)

# 로그인, 로그아웃, 회원가입 라우터
app.include_router(auth_router)

# admin_user 로그 라우터
app.include_router(admin_user_router)

manager = ConnectionManager()
alert_manager = AlertManager()

# 웹 채팅 페이지
@app.get("/", response_class=HTMLResponse)
async def get(request: Request):
    
    return templates.TemplateResponse("chat.html", {"request": request})

# 웹소켓 핸들러 
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), room: str = Query("default")):
    # token = websocket.query_params.get("token")
    # 1. JWT 토큰 검증
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        print("🟢 JWT payload:", payload)
        if username is None:
            raise ValueError("No username in token")
    except Exception as e:
        print("❌ JWT 검증 실패:", e)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. 채팅방 key 설정
    chat_key = f"chatlog:{room}"

    # ✅ 먼저 websocket 연결 수락
    await manager.connect(websocket, room, username)
    

    # 3. 연결 즉시, 최큰 메세지 100개 보내기
    recent_msgs = redis_client.lrange(chat_key, -100, -1)
    for msg in recent_msgs:
        await websocket.send_text(msg)

    # 4. 브로드캐스트 및 케세지 기록    
    await manager.broadcast(f"✅ {username}님이 [{room}] 채팅방에 입장했습니다.", room)

    try:
        while True:
            data = await websocket.receive_text()

            # msg = f"{username}: {data}"
            # redis_client.rpush(chat_key, msg)

            msg_data = {
                "sender": username,
                "room": room,
                "message": data
            }
            redis_client.rpush(chat_key, dumps(msg_data))
            # 한 방에 500개만 유지
            redis_client.ltrim(chat_key, -500, -1)
            await manager.broadcast(dumps(msg_data), room)  # 방에 뿌림 

            # 예: dm between userA and userB
            members = room.split("-")
            for member in members:
                if member != username:  # 받은 사람 (나 제외)
                    await alert_manager.send_alert(to_user_id=member, from_user_id=username, message=data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room, username)
        await manager.broadcast(f"❌ {username}님이 퇴장했습니다.", room)

# 다른 곳에 있을 때 알람받기
@app.websocket("/ws/alert")
async def alert_listener(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except:
        await websocket.close()
        return

    await alert_manager.connect(websocket, user_id)

    try:
        while True:
            await websocket.receive_text()  # 어떤 입력도 안 받지만 끊기지 않게
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket, user_id)

# 로그인 페이지
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

# 빗썸 실시간 WebSocket 및 통계 매니저 클래스 예시
class BithumbWebSocketManager:
    def __init__(self):
        self.is_running = False
        self.connections = []
        self.connection_stats = {}
        self.subscribed_symbols = []
    # 실제 구현은 별도 파일 또는 아래에 추가

bithumb_manager = BithumbWebSocketManager()

# 실시간 WebSocket 엔드포인트 예시

# 실시간 WebSocket 브로드캐스트 함수
async def broadcast_to_clients(message):
    for ws in list(bithumb_manager.connections):
        try:
            await ws.send_text(message)
        except Exception:
            pass

@app.websocket("/ws/realtime")
async def realtime_ws(websocket: WebSocket):
    await websocket.accept()
    bithumb_manager.is_running = True
    bithumb_manager.connections.append(websocket)
    try:
        # 1. 활성 코인 목록 가져오기
        coins_resp = await get_coin_list()
        if coins_resp["status"] != "success":
            await websocket.send_text(json.dumps({"error": "코인 목록 불러오기 실패"}))
            return
        symbols = [c["symbol"] for c in coins_resp["data"]]
        # 2. 빗썸 WebSocket 연결
        async with websockets.connect("wss://pubwss.bithumb.com/pub/ws") as bithumb_ws:
            # 3. 모든 코인 구독 메시지 생성
            subscribe_msg = json.dumps({
                "type": "ticker",
                "symbols": [f"{s}_KRW" for s in symbols],
                "tickTypes": ["30M"]
            })
            await bithumb_ws.send(subscribe_msg)
            while True:
                data = await bithumb_ws.recv()
                await broadcast_to_clients(data)
    except WebSocketDisconnect:
        bithumb_manager.connections.remove(websocket)
        bithumb_manager.is_running = False
    except Exception as e:
        print("WebSocket 에러:", e)

# WebSocket 통계 엔드포인트 추가
@app.get("/api/websocket/stats")
async def get_websocket_stats():
    """WebSocket 연결 통계"""
    return {
        "is_running": bithumb_manager.is_running,
        "active_clients": len(bithumb_manager.connections),
        "subscription_stats": bithumb_manager.connection_stats,
        "subscribed_symbols_count": len(bithumb_manager.subscribed_symbols),
        "subscribed_symbols_preview": bithumb_manager.subscribed_symbols[:10] if bithumb_manager.subscribed_symbols else []
    }

# 코인 목록 API 엔드포인트 추가

# 코인 한글명 폴백 함수

def get_korean_name(symbol: str) -> str:
    korean_names = {
        "BTC": "비트코인", "ETH": "이더리움", "XRP": "리플", "ADA": "에이다",
        "DOT": "폴카닷", "LINK": "체인링크", "LTC": "라이트코인", "BCH": "비트코인캐시",
        "XLM": "스텔라루멘", "EOS": "이오스", "DOGE": "도지코인", "SOL": "솔라나",
        "MATIC": "폴리곤", "AVAX": "아발란체"
    }
    return korean_names.get(symbol, symbol)

@app.get("/api/coins")
async def get_coin_list():
    markets_url = "https://api.bithumb.com/v1/market/all"
    ticker_url = "https://api.bithumb.com/public/ticker/ALL_KRW"
    try:
        async with aiohttp.ClientSession() as session:
            # 마켓 정보와 시세 정보 동시 요청
            market_task = session.get(markets_url, timeout=10)
            ticker_task = session.get(ticker_url, timeout=10)
            market_response, ticker_response = await asyncio.gather(market_task, ticker_task)
            # 시세 데이터
            if ticker_response.status != 200:
                return {"status": "error", "message": f"시세 API 오류: {ticker_response.status}"}
            ticker_data = await ticker_response.json()
            if ticker_data.get("status") != "0000":
                return {"status": "error", "message": "빗썸 시세 API 오류"}
            # 마켓 데이터 처리 (실패해도 계속 진행)
            market_map = {}
            if market_response.status == 200:
                try:
                    markets_data = await market_response.json()
                    if isinstance(markets_data, list):
                        for market in markets_data:
                            market_code = market.get("market", "")
                            if market_code.endswith("_KRW"):
                                symbol = market_code.replace("_KRW", "")
                                market_map[symbol] = {
                                    "korean_name": market.get("korean_name", ""),
                                    "english_name": market.get("english_name", ""),
                                    "market_warning": market.get("market_warning", "NONE")
                                }
                except Exception as e:
                    print(f"⚠️ 마켓 정보 파싱 실패 (폴백 모드로 진행): {e}")
            else:
                print(f"⚠️ 마켓 API 실패 (폴백 모드로 진행): {market_response.status}")
        coins = []
        for symbol, info in ticker_data["data"].items():
            if symbol == "date":
                continue
            try:
                trade_value = float(info.get("acc_trade_value_24H", 0))
                if trade_value <= 1000000:
                    continue
                market_info = market_map.get(symbol, {})
                korean_name = market_info.get("korean_name", "").strip()
                if not korean_name:
                    korean_name = get_korean_name(symbol)
                coins.append({
                    "symbol": symbol,
                    "korean_name": korean_name,
                    "english_name": market_info.get("english_name", symbol),
                    "current_price": float(info.get("closing_price", 0)),
                    "change_rate": float(info.get("fluctate_rate_24H", 0)),
                    "change_amount": float(info.get("fluctate_24H", 0)),
                    "volume": trade_value,
                    "market_warning": market_info.get("market_warning", "NONE"),
                    "units_traded": float(info.get("units_traded_24H", 0))
                })
            except (ValueError, TypeError) as e:
                print(f"⚠️ {symbol} 데이터 처리 오류: {e}")
                continue
        coins.sort(key=lambda x: x["volume"], reverse=True)
        return {
            "status": "success",
            "data": coins,
            "total_count": len(coins),
            "korean_names_from_api": len([c for c in coins if c["korean_name"] != c["symbol"]]),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ 코인 목록 조회 오류: {e}")
        return {"status": "error", "message": str(e)}

