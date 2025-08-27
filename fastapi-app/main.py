from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect, status, Query, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

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
import json
from fastapi.middleware.cors import CORSMiddleware
from api.news_router import router as news_router
from api.auth import router as auth_router
from api.admin_user import router as admin_user_router
from api.admin import router as admin_router
from api.inquiry import router as inq_router
from api.chat import router as ws_router

from api.bithumb_api import router as bithumb_router, realtime_ws

# // [news schedule] 크롤링 주기 설정
from apscheduler.schedulers.background import BackgroundScheduler
from service.news_service import crawl_and_save
from datetime import datetime
from repository.news_repository import delete_news_older_than, trim_news_by_count
from fastapi.responses import JSONResponse

# --- 음성 AI 관련 모듈 추가  Google Cloud 관련 모듈 추가 ---
import google.generativeai as genai
from api.voice_router import router as voice_ai_router
from google.cloud import speech # 인증 확인을 위해 speech 클라이언트 임포트
# ---------------------------------

from db.mysql import ping
from fastapi import APIRouter


load_dotenv()

app = FastAPI()

@app.get("/api/ping")
def ping():
    return {"pong": True}



# 테스트용: 수동으로 한 번 크롤링해서 DB에 저장
@app.post("/debug/crawl-now")
def debug_crawl_now(limit: int = 20):
    saved = crawl_and_save(limit=limit)
    return {"saved": saved}


# --- Gemini API 설정 추가 ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("경고: .env 파일에 GEMINI_API_KEY가 설정되지 않았습니다.")
# -----------------------------

# docker-compose.yml의 서비스명 redis를 
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

#____________빗썸+제미나이 연동____________
# 전역 변수로 설정하여 다른 모듈에서 임포트 가능하게 함
# __all__ = ["redis_client"]
from api.ai_coin_connect import redis_client
#______________________________________________

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
# host = '127.0.0.1'
host = 'mysql'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


templates = Jinja2Templates(directory="templates")

@app.post("/debug/crawl-now")
def debug_crawl_now(limit: int = 20):
    saved = crawl_and_save(limit=limit)
    return {"saved": saved}


# --- DB Healthcheck (임시) ---
health = APIRouter()

@health.get("/health/db")
def health_db():
    """DB 연결 상태 확인용"""
    return {"db_ok": ping()}

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

# DB Health 라우터 등록
app.include_router(health)

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


# 빗썸 API 라우터
app.include_router(bithumb_router)


# 1) 스케줄러 인스턴스 (서울 타임존)
scheduler = BackgroundScheduler(timezone="Asia/Seoul")

def job_news_refresh():
    """
    1시간마다 실행될 실제 작업 함수.
    내부에서 크롤링하고 save_news()로 업서트까지 수행.
    """
    try:
        print(f"[scheduler] news refresh start {datetime.now()}")
        from service.news_service import crawl_and_save
        from repository.news_repository import delete_news_older_than, trim_news_by_count

        saved = crawl_and_save(limit=20) or 0
        print(f"[scheduler] news refresh saved {saved} rows")

        # ✅ 저장이 1건 이상일 때만 정리 수행 (테이블이 잠깐 비는 현상 방지)
        if saved > 0:
            deleted_by_days = delete_news_older_than(days=2)
            print(f"[scheduler] cleanup(days) deleted {deleted_by_days} rows")

            deleted_by_cap = trim_news_by_count(max_rows=300)
            print(f"[scheduler] cleanup(cap) deleted {deleted_by_cap} rows")
        else:
            print("[scheduler] skip cleanup (no new rows)")

    except Exception:
        import traceback
        print("[scheduler] ERROR in job_news_refresh")
        traceback.print_exc()

# 2) 앱 시작 시 스케줄러 시작 + 잡 등록
@app.on_event("startup")
def start_scheduler():
    try:
        if not scheduler.running:
            scheduler.start()
        # 매 3시간 주기 실행
        scheduler.add_job(
            job_news_refresh,
            trigger="interval",
            hours = 3, 
            id="news_refresh_hourly",
            replace_existing=True,
        )
        # (옵션) 서버 기동 직후 1회 즉시 실행 — 초기 데이터 채우기 용
        scheduler.add_job(job_news_refresh, run_date=datetime.now(), id="news_refresh_boot", replace_existing=True)
        print("[scheduler] started (hourly news refresh)")
    except Exception:
        import traceback
        print("[scheduler] failed to start")
        traceback.print_exc()

# 3) 앱 종료 시 스케줄러 정리
@app.on_event("shutdown")
def stop_scheduler():
    try:
        scheduler.shutdown(wait=False)
        print("[scheduler] stopped")
    except Exception:
        pass


@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await realtime_ws(websocket)

manager = ConnectionManager()
alert_manager = AlertManager()

# --- 음성 AI 라우터 추가 ---
app.include_router(voice_ai_router, prefix="/api")
# -----------------------------

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
    

    # 3. 연결 즉시, 최근 메세지 100개 보내기
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


# [추가 3] Redis 디버깅을 위한 새로운 엔드포인트 추가
@app.get("/api/debug/redis-keys")
async def debug_redis_keys():
    """Redis에 저장된 ticker 키들 확인 (디버깅용)"""
    try:
        keys = redis_client.keys("ticker:*")
        result = {}
        for key in keys:
            data = redis_client.get(key)
            if data:
                parsed = json.loads(data)
                result[key] = {
                    "closing_price": parsed.get("closing_price", "N/A"),
                    "symbol": parsed.get("symbol", "N/A"),
                    "timestamp": parsed.get("date", "N/A")
                }
        return {
            "total_keys": len(keys),
            "keys": result
        }
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/debug/test-voice-price/{symbol}")  
async def test_voice_price(symbol: str):
    """음성 AI에서 사용하는 가격 조회 함수 테스트"""
    from api.voice_router import get_realtime_price
    
    result = get_realtime_price(symbol.upper())
    
    return {
        "symbol": symbol,
        "result": result,
        "has_data": result is not None,
        "closing_price": result.get('closing_price') if result else None
    }



# --- 스케줄러 헬스체크 (무한 로딩 방지 버전) ---
@app.get("/api/debug/scheduler")
def scheduler_status():
    try:
        # 안전하게 상태 읽기
        state = getattr(scheduler, "state", None)
        running = bool(getattr(scheduler, "running", False))

        jobs_info = []
        for j in scheduler.get_jobs():
            nrt = None
            try:
                nrt = j.next_run_time.isoformat() if j.next_run_time else None
            except Exception:
                nrt = str(j.next_run_time)
            jobs_info.append({"id": j.id, "next_run_time": nrt})

        return {
            "running": running,
            "state": state,
            "jobs": jobs_info
        }
    except Exception as e:
        # 어떤 에러여도 즉시 JSON 500 반환 -> 무한로딩 방지
        return JSONResponse({"error": str(e)}, status_code=500)