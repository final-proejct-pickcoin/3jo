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
from json import dumps
from fastapi.middleware.cors import CORSMiddleware
from api.news_router import router as news_router
from api.auth import router as auth_router
from api.admin_user import router as admin_user_router


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

