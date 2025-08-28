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

# 라우터들
from api.news_router import router as news_router
from api.auth import router as auth_router
from api.admin_user import router as admin_user_router
from api.admin import router as admin_router
from api.inquiry import router as inq_router
from api.chat import router as ws_router
from api.bithumb_api import router as bithumb_router, realtime_ws
from api.elasticsearch import create_indices_if_not_exist, wait_for_es, create_kibana_index_pattern
from api.ml_router import router as ml_router

# 스케줄링 관련 [news schedule] 크롤링 주기 설정
from apscheduler.schedulers.background import BackgroundScheduler
from service.news_service import crawl_and_save
from datetime import datetime
from repository.news_repository import delete_news_older_than, trim_news_by_count

# 음성 AI 관련 모듈
import google.generativeai as genai
from api.voice_router import router as voice_ai_router
from google.cloud import speech

from db.mysql import ping
from fastapi import APIRouter

import threading
import time
import asyncio
from zoneinfo import ZoneInfo

# 환경변수 로드
load_dotenv()

# FastAPI 앱 초기화
app = FastAPI(
    title="통합 가상화폐 플랫폼 API",
    description="채팅, 뉴스, 음성 AI, 가상화폐 가격 예측이 통합된 플랫폼",
    version="1.0"
)

# --- 기본 설정들 ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
host = 'mysql'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
templates = Jinja2Templates(directory="templates")

# Gemini API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("경고: .env 파일에 GEMINI_API_KEY가 설정되지 않았습니다.")

#빗썸+제미나이 연동 // 전역 변수로 설정, 다른 모듈에서 임포트 가능 // __all__ = ["redis_client"]
from api.ai_coin_connect import redis_client
# Redis 설정 // docker-compose.yml의 서비스명 redis
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

# --- 헬스체크 라우터 ---
health = APIRouter()

# --- DB Healthcheck (임시) ---
@health.get("/health/db")
def health_db():
    """DB 연결 상태 확인용"""
    return {"db_ok": ping()}

@app.get("/api/ping")
def api_ping():
    return {"pong": True}

# --- CORS 설정 ---
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

# ===== 라우터 등록 =====
app.include_router(health) # DB Health 라우터
app.include_router(news_router) # 뉴스 크롤링 라우터
app.include_router(auth_router) # 로그인, 로그아웃, 회원가입 라우터
app.include_router(admin_user_router) # admin_user 로그 라우터
app.include_router(admin_router) # 관리자 페이지에서 받아올 라우터
app.include_router(inq_router) # 문의 라우터
app.include_router(ws_router) # 채팅 웹소켓 라우터
app.include_router(bithumb_router) # 빗썸 API 라우터
app.include_router(voice_ai_router, prefix="/api") # 음성 AI 라우터
app.include_router(ml_router) # ML 라우터 

# ===== 웹소켓 핸들러들 =====

manager = ConnectionManager()
alert_manager = AlertManager()

#websocket_realtime_endpoint()
@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """빗썸 실시간 데이터 웹소켓"""
    await realtime_ws(websocket)

#websocket_chat_endpoint()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), room: str = Query("default")):
    """채팅 웹소켓 핸들러"""
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

    # 4. 브로드캐스트 및 메세지 기록    
    await manager.broadcast(f"✅ {username}님이 [{room}] 채팅방에 입장했습니다.", room)

    try:
        while True:
            data = await websocket.receive_text()

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
    """알림 수신 웹소켓"""
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

# ===== 웹 페이지들 =====
#채팅
@app.get("/", response_class=HTMLResponse)
async def get_root(request: Request):
    """메인 채팅 페이지"""
    return templates.TemplateResponse("chat.html", {"request": request})
#로그인
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

# ===== Elasticsearch 초기화 =====
# 환경변수:
#   ES_ENABLED=0        → ES 초기화 스킵 (기본 1)
#   ES_MAX_WAIT=120     → 최대 대기 초(기본 120)
#   ES_WAIT_INTERVAL=3  → 재시도 간격 초(기본 3)
# ─────────────────────────────────────────────────────────────────────────────
def init_search_background():
    """백그라운드에서 Elasticsearch 초기화"""
    try:
        if os.getenv("ES_ENABLED", "1") != "1":
            print("[es] disabled by ES_ENABLED=0")
            return

        max_wait = int(os.getenv("ES_MAX_WAIT", "120"))
        interval = int(os.getenv("ES_WAIT_INTERVAL", "3"))

        # 1) ES가 응답할 때까지 wait_for_es를 짧게 여러 번 시도
        print(f"[es] waiting for ES (max_wait={max_wait}s, interval={interval}s)…")
        start = time.time()
        while time.time() - start < max_wait:
            try:
                asyncio.run(wait_for_es(timeout=interval, interval=1))
                print("[es] wait_for_es OK")
                break
            except Exception as e:
                print(f"[es] wait_for_es retry: {e}")
                time.sleep(interval)

        # 2) 인덱스 생성 (여러 번 재시도)
        deadline = time.time() + max_wait
        while time.time() < deadline:
            try:
                create_indices_if_not_exist()
                print("[es] indices ready")
                return
            except Exception as e:
                print(f"[es] create_indices retry in {interval}s: {type(e).__name__} - {e}")
                time.sleep(interval)

        print(f"[es] not ready within {max_wait}s; skip initializing indices (app continues)")
    except Exception as e:
        print(f"[es] init_search_background failed: {type(e).__name__} - {e}")

# ===== 스케줄러 설정 =====

# 1) 스케줄러 인스턴스 (서울 타임존)
scheduler = BackgroundScheduler(
    timezone="Asia/Seoul",
    job_defaults={
        "coalesce": True,           # 밀린 실행은 1회로 합치기
        "misfire_grace_time": 3600  # 1시간 이내 놓친 실행 허용
    }
)

def job_news_refresh():
    """
    8시간마다 실행될 실제 작업 함수.
    내부에서 크롤링하고 save_news()로 업서트까지 수행.
    """
    try:
        print(f"[scheduler] news refresh start {datetime.now()}")
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

# ===== 앱 시작/종료 이벤트 =====
# 2) 앱 시작 시 스케줄러 시작 + ES 초기화(비차단)
@app.on_event("startup")
async def startup_event():
    """앱 시작시 초기화 작업들"""
    try:
        print("🚀 통합 가상화폐 플랫폼 시작 중...")
        
        # ✅ ES 초기화는 앱을 막지 않도록 "백그라운드 스레드"에서 수행
        threading.Thread(target=init_search_background, daemon=True).start()

        # ✅ Kibana 데이터뷰 자동 생성 (비차단)
        def _init_kibana():
            try:
                asyncio.run(create_kibana_index_pattern())
            except Exception as e:
                print(f"[kibana] init failed: {e}")
        threading.Thread(target=_init_kibana, daemon=True).start()

        # ✅ 스케줄러 기동
        if not scheduler.running:
            scheduler.start()

        # 📝 주기 작업 등록 (8시간마다 뉴스 크롤링)
        if scheduler.get_job("news_refresh_hourly") is None:   # ← 중복등록 방지
            scheduler.add_job(
                job_news_refresh,
                trigger="interval",
                hours=8,                            # ← 8시간마다 실행
                id="news_refresh_hourly",
                replace_existing=True,
            )

        # 🚀 서버 기동 직후 1회 즉시 실행 — 초기 데이터 채우기 용
        if scheduler.get_job("news_refresh_boot") is None:  # ← 중복등록 방지
            scheduler.add_job(
                job_news_refresh,
                trigger="date",         # ← 단발성 실행을 위해 반드시 필요
                run_date=datetime.now(ZoneInfo("Asia/Seoul")),      # ← 타임존 포함
                id="news_refresh_boot",
                replace_existing=True
            )

        print("✅ 통합 플랫폼 시작 완료!")
        print("📊 제공 서비스:")
        print("  - 실시간 채팅 & 알림")
        print("  - 뉴스 크롤링 & 검색 (hourly news refresh)")  
        print("  - 음성 AI 챗봇")
        print("  - 🤖 ML 가격 예측 (새로 추가)")
        print("  - 실시간 거래소 데이터")
        
    except Exception:
        import traceback
        print("[startup] failed")
        traceback.print_exc()

# 3) 앱 종료 시 스케줄러 정리
@app.on_event("shutdown")
def shutdown_event():
    """앱 종료시 정리 작업"""
    try:
        scheduler.shutdown(wait=False)
        print("[scheduler] stopped")
        print("👋 통합 플랫폼 종료")
    except Exception:
        pass

# ===== 통합 헬스체크 =====

@app.get("/health", tags=["System"])
async def integrated_health_check():
    """통합 시스템 상태 확인"""
    # ML 모델 상태 확인
    ml_models_available = False
    ml_models_count = 0
    try:
        if os.path.exists("ml/models"):
            for item in os.listdir("ml/models"):
                model_dir = os.path.join("ml/models", item)
                if os.path.isdir(model_dir) and os.path.exists(os.path.join(model_dir, "model.pt")):
                    ml_models_count += 1
        ml_models_available = ml_models_count > 0
    except:
        pass
    
    # Redis 연결 상태 확인
    redis_status = False
    try:
        redis_client.ping()
        redis_status = True
    except:
        pass
    
    # DB 연결 상태 확인
    db_status = ping()
    
    return {
        "status": "healthy" if all([redis_status, db_status, ml_models_available]) else "degraded",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "database": db_status,
            "redis": redis_status,
            "ml_models": {
                "available": ml_models_available,
                "count": ml_models_count
            }
        },
        "services": {
            "chat": True,
            "news": True,
            "voice_ai": True,
            "ml_prediction": ml_models_available,
            "realtime_trading": True
        }
    }

# ===== 통합 API 정보 =====

@app.get("/api/info", tags=["System"])
async def get_api_info():
    """통합 API 서비스 정보"""
    # ML 모델 개수 확인
    ml_models_count = 0
    try:
        if os.path.exists("ml/models"):
            for item in os.listdir("ml/models"):
                model_dir = os.path.join("ml/models", item)
                if os.path.isdir(model_dir) and os.path.exists(os.path.join(model_dir, "model.pt")):
                    ml_models_count += 1
    except:
        pass
    
    return {
        "platform_name": "통합 가상화폐 플랫폼",
        "version": "3.0",
        "services": {
            "chat": {
                "description": "실시간 채팅 및 알림 시스템",
                "websocket": "/ws",
                "features": ["JWT 인증", "룸별 채팅", "실시간 알림"]
            },
            "news": {
                "description": "가상화폐 뉴스 크롤링 및 검색",
                "endpoints": ["/api/news/*"],
                "features": ["자동 크롤링", "Elasticsearch 검색", "감성분석"]
            },
            "voice_ai": {
                "description": "음성 인식 AI 챗봇",
                "websocket": "/api/voice-chat", 
                "features": ["Google Speech-to-Text", "Gemini AI", "실시간 코인 정보 연동"]
            },
            "ml_prediction": {
                "description": "개별 코인별 LSTM 가격 예측",
                "endpoints": ["/ml/*"],
                "trained_models": ml_models_count,
                "features": ["개별 코인 모델", "감성분석 통합", "기술적 지표 활용"]
            },
            "trading_data": {
                "description": "실시간 거래소 데이터",
                "endpoints": ["/api/*"],
                "websocket": "/ws/realtime",
                "features": ["빗썸 API 연동", "실시간 시세", "WebSocket 스트리밍"]
            }
        },
        "integrations": {
            "databases": ["MySQL", "Redis", "Elasticsearch"],
            "external_apis": ["빗썸", "CoinGecko", "Google Cloud", "Gemini AI"],
            "real_time": ["WebSocket", "실시간 알림", "라이브 채팅"]
        },
        "endpoints_summary": {
            "system": ["/health", "/api/ping", "/api/info"],
            "auth": ["/login", "/register", "/api/auth/*"],
            "chat": ["/ws", "/ws/alert", "/chat"],
            "news": ["/api/news/*", "/debug/crawl-now"],
            "ml": ["/ml/predict", "/ml/batch_predict", "/ml/available_coins"],
            "trading": ["/api/coins", "/api/ticker/*", "/ws/realtime"],
            "voice": ["/api/voice-chat", "/api/supported-coins"],
            "admin": ["/api/admin/*", "/api/admin-user/*"]
        }
    }

# ===== 디버깅 엔드포인트들 =====

# Redis 디버깅
@app.get("/api/debug/redis-keys", tags=["Debug"])
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

@app.get("/api/debug/test-voice-price/{symbol}", tags=["Debug"])  
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
@app.get("/api/debug/scheduler", tags=["Debug"])
def scheduler_status():
    """스케줄러 상태 확인"""
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

# 테스트용: 수동으로 한 번 크롤링해서 DB에 저장 _news_services
@app.post("/debug/crawl-now", tags=["Debug"])
def debug_crawl_now(limit: int = 20):
    saved = crawl_and_save(limit=limit)
    return {"saved": saved}


'''
if __name__ == "__main__":
    import uvicorn
    print("🚀 통합 가상화폐 플랫폼 서버 시작 중...")
    print("🔗 서비스 포트: 8000")
    print("📡 WebSocket 지원: 채팅, 실시간 데이터, 음성 AI")
    print("🤖 AI 기능: 가격 예측, 음성 챗봇, 뉴스 감성분석")
    print("🎯 ML API: /ml/* 경로에서 제공")
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''