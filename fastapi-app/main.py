from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect, status, Query, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
import redis
from utils.user_manager import ConnectionManager
from service.alert_manager import AlertManager

from passlib.context import CryptContext
from utils.jwt_helper import create_access_token, verify_token
from dotenv import load_dotenv
from utils.user_manager import ConnectionManager
from typing import Dict
from json import dumps
from fastapi.middleware.cors import CORSMiddleware
from api.news_router import router as news_router
from api.auth import router as auth_router
from api.admin_user import router as admin_user_router
from api.admin import router as admin_router
from api.inquiry import router as inq_router
from api.chat import router as ws_router


import requests
import asyncio
import aiohttp
from datetime import datetime
import websockets
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
    allow_origins=["*"],
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

# 관리자 페이지에서 받아올 라우터
app.include_router(admin_router)

# 문의 라우터
app.include_router(inq_router)

# 채팅 웹소켓 라우터
app.include_router(ws_router)

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



# 빗썸 마켓 코드 조회 (신규 추가)
@app.get("/api/markets")
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



# 빗썸 REST API 테스트
@app.get("/api/test-bithumb")
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







# 개선된 코인 목록 API
@app.get("/api/coins")
async def get_coin_list():
    """모든 활성 거래 코인 목록 조회 (마켓 코드 API 활용)"""
    try:
        # 1. 먼저 마켓 코드 조회로 지원 코인 목록 확인        
        markets_url = "https://api.bithumb.com/v1/market/all"
        ticker_url = "https://api.bithumb.com/public/ticker/ALL_KRW"
        
        async with aiohttp.ClientSession() as session:
            # 마켓 정보와 시세 정보 동시 요청
            market_task = session.get(markets_url)
            ticker_task = session.get(ticker_url)
            
            market_response, ticker_response = await asyncio.gather(market_task, ticker_task)
            
            if market_response.status != 200 or ticker_response.status != 200:
                return {"status": "error", "message": "API 요청 실패"}
            
            markets_data = await market_response.json()
            ticker_data = await ticker_response.json()
        
        if ticker_data.get("status") != "0000":
            return {"status": "error", "message": "빗썸 시세 API 오류"}
        
        # 마켓 정보로 한글명 매핑 생성
        market_map = {}
        if isinstance(markets_data, list):
            for market in markets_data:
                if market.get("market", "").endswith("_KRW"):
                    symbol = market["market"].replace("_KRW", "")
                    market_map[symbol] = {
                        "korean_name": market.get("korean_name", symbol),
                        "english_name": market.get("english_name", symbol),
                        "market_warning": market.get("market_warning", "NONE")
                    }
        
        coins = []
        for symbol, info in ticker_data["data"].items():
            if symbol == "date":
                continue
                
            try:
                trade_value = float(info.get("acc_trade_value_24H", 0))
                if trade_value <= 1000000:  # 거래대금 100만원 이상만
                    continue
                
                market_info = market_map.get(symbol, {})
                
                coins.append({
                    "symbol": symbol,
                    "korean_name": market_info.get("korean_name", get_korean_name(symbol)),
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
        
        # 거래대금순 정렬
        coins.sort(key=lambda x: x["volume"], reverse=True)
        
        return {
            "status": "success",
            "data": coins,
            "total_count": len(coins),
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ 코인 목록 조회 오류: {e}")
        return {"status": "error", "message": str(e)}

# 특정 코인 차트 데이터
@app.get("/api/chart/{symbol}")
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

# 코인 한글명 매핑 함수
def get_korean_name(symbol: str) -> str:
    """코인 심볼을 한글명으로 변환"""
    korean_names = {
        "BTC": "비트코인",
        "ETH": "이더리움", 
        "XRP": "리플",
        "ADA": "에이다",
        "DOT": "폴카닷",
        "LINK": "체인링크",
        "LTC": "라이트코인",
        "BCH": "비트코인캐시",
        "XLM": "스텔라루멘",
        "EOS": "이오스",
        # 더 많은 매핑 추가 가능
    }
    return korean_names.get(symbol, symbol)            

# 빗썸 실시간 데이터 관리 클래스

# 개선된 BithumbWebSocketManager
import time
from collections import defaultdict

class BithumbWebSocketManager:
    def __init__(self):
        self.connections = []
        self.is_running = False
        self.subscribed_symbols = []
        self.connection_stats = {
            "total_symbols": 0,
            "active_subscriptions": 0,
            "last_update": None
        }
    async def connect_client(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)
        print(f"✅ 클라이언트 연결: {len(self.connections)}개 활성")
        if not self.is_running:
            asyncio.create_task(self.start_bithumb_connection())
    def disconnect_client(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)
            print(f"❌ 클라이언트 연결 해제: {len(self.connections)}개 남음")
    async def get_all_active_coins(self):
        """모든 활성 거래 코인 조회 (aiohttp 사용)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://api.bithumb.com/public/ticker/ALL_KRW") as response:
                    data = await response.json()
            if data.get("status") != "0000":
                return []
            active_coins = []
            for symbol, info in data["data"].items():
                if symbol == "date":
                    continue
                try:
                    closing_price = float(info.get("closing_price", 0))
                    volume_24h = float(info.get("units_traded_24H", 0))
                    trade_value_24h = float(info.get("acc_trade_value_24H", 0))
                    is_active = (
                        closing_price > 0 and
                        volume_24h > 0 and
                        trade_value_24h > 1000000
                    )
                    if is_active:
                        active_coins.append(f"{symbol}_KRW")
                except (ValueError, TypeError) as e:
                    print(f"⚠️ {symbol} 데이터 파싱 오류: {e}")
                    continue
            sorted_coins = sorted(
                [(symbol.replace('_KRW', ''), data["data"][symbol.replace('_KRW', '')]) 
                 for symbol in active_coins if symbol.replace('_KRW', '') in data["data"]],
                key=lambda x: float(x[1].get("acc_trade_value_24H", 0)),
                reverse=True
            )
            return [f"{coin[0]}_KRW" for coin in sorted_coins]
        except Exception as e:
            print(f"❌ 활성 코인 조회 오류: {e}")
            return []
    async def start_bithumb_connection(self):
        """빗썸 실시간 WebSocket 연결 - 모든 활성 코인 동적 구독"""
        self.is_running = True
        max_retries = 5
        retry_count = 0
        while retry_count < max_retries:
            try:
                print("🔄 활성 거래 코인 목록 조회 중...")
                active_symbols = await self.get_all_active_coins()
                if not active_symbols:
                    print("❌ 활성 코인을 찾을 수 없습니다. 30초 후 재시도...")
                    await asyncio.sleep(30)
                    retry_count += 1
                    continue
                self.subscribed_symbols = active_symbols
                self.connection_stats.update({
                    "total_symbols": len(active_symbols),
                    "last_update": datetime.now().isoformat()
                })
                print(f"🚀 총 {len(active_symbols)}개 활성 코인 발견!")
                print(f"📋 상위 10개: {[s.replace('_KRW', '') for s in active_symbols[:10]]}")
                uri = "wss://pubwss.bithumb.com/pub/ws"
                async with websockets.connect(uri) as websocket:
                    batch_size = 30
                    successful_subscriptions = 0
                    for i in range(0, len(active_symbols), batch_size):
                        batch = active_symbols[i:i+batch_size]
                        subscribe_msg = {
                            "type": "ticker",
                            "symbols": batch,
                            "tickTypes": ["24H"]
                        }
                        try:
                            await websocket.send(json.dumps(subscribe_msg))
                            successful_subscriptions += len(batch)
                            batch_num = i // batch_size + 1
                            total_batches = (len(active_symbols) + batch_size - 1) // batch_size
                            print(f"📡 배치 {batch_num}/{total_batches}: {len(batch)}개 구독 완료 (누적: {successful_subscriptions}개)")
                            await asyncio.sleep(2)
                        except Exception as e:
                            print(f"❌ 배치 {batch_num} 구독 실패: {e}")
                            continue
                    self.connection_stats["active_subscriptions"] = successful_subscriptions
                    print(f"✅ 총 {successful_subscriptions}/{len(active_symbols)}개 코인 구독 완료!")
                    message_count = 0
                    last_stats_time = time.time()
                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            message_count += 1
                            if data.get("type") == "ticker" and data.get("content"):
                                symbol = data["content"].get("symbol", "")
                                if symbol in self.subscribed_symbols:
                                    await self.broadcast_to_clients(data)
                                    try:
                                        redis_client.setex(
                                            f"ticker:{symbol}",
                                            300,
                                            json.dumps(data["content"])
                                        )
                                    except Exception as e:
                                        print(f"⚠️ Redis 캐싱 오류 ({symbol}): {e}")
                            current_time = time.time()
                            if current_time - last_stats_time > 300:
                                print(f"📊 실시간 데이터 통계: {message_count}개 메시지 수신, {len(self.connections)}개 클라이언트 연결")
                                last_stats_time = current_time
                                message_count = 0
                        except json.JSONDecodeError as e:
                            print(f"⚠️ JSON 파싱 오류: {e}")
                        except Exception as e:
                            print(f"❌ 메시지 처리 오류: {e}")
                print("🔄 WebSocket 연결 종료됨. 재연결 시도...")
                retry_count = 0
                await asyncio.sleep(5)
            except websockets.exceptions.ConnectionClosed as e:
                retry_count += 1
                print(f"❌ WebSocket 연결 끊어짐 (시도 {retry_count}/{max_retries}): {e}")
                await asyncio.sleep(min(retry_count * 10, 60))
            except Exception as e:
                retry_count += 1
                print(f"❌ 예상치 못한 오류 (시도 {retry_count}/{max_retries}): {e}")
                await asyncio.sleep(min(retry_count * 5, 30))
        print(f"❌ 최대 재시도 횟수 ({max_retries}) 초과. WebSocket 연결 중단.")
        self.is_running = False
    async def broadcast_to_clients(self, data):
        if not self.connections:
            return
        disconnected = []
        message = json.dumps(data)
        for websocket in self.connections:
            try:
                await websocket.send_text(message)
            except Exception as e:
                print(f"⚠️ 클라이언트 전송 실패: {e}")
                disconnected.append(websocket)
        for ws in disconnected:
            self.disconnect_client(ws)
# 추가: WebSocket 통계 엔드포인트
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

# 빗썸 WebSocket 매니저 인스턴스 생성
bithumb_manager = BithumbWebSocketManager()

# 실시간 데이터 WebSocket 엔드포인트
@app.websocket("/ws/realtime")
async def realtime_websocket(websocket: WebSocket):
    """실시간 빗썸 데이터 WebSocket"""
    await bithumb_manager.connect_client(websocket)
    
    try:
        while True:
            # 클라이언트로부터 메시지 대기 (연결 유지용)
            await websocket.receive_text()
    except WebSocketDisconnect:
        bithumb_manager.disconnect_client(websocket)

# Redis에서 최신 시세 조회
@app.get("/api/ticker/{symbol}")
async def get_cached_ticker(symbol: str):
    """Redis에 캐시된 최신 시세 조회"""
    try:
        cached_data = redis_client.get(f"ticker:{symbol}")
        if cached_data:
            return {
                "status": "success",
                "data": json.loads(cached_data),
                "source": "cache"
            }
        else:
            # 캐시에 없으면 직접 API 호출
            url = f"https://api.bithumb.com/public/ticker/{symbol}_KRW"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success", 
                    "data": data["data"],
                    "source": "api"
                }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 서버 상태 확인
@app.get("/api/status")
async def server_status():
    """서버 및 빗썸 연결 상태 확인"""
    return {
        "server": "running",
        "redis_connected": redis_client.ping(),
        "bithumb_websocket": bithumb_manager.is_running,
        "active_connections": len(bithumb_manager.connections),
        "timestamp": datetime.now().isoformat()
    }        
