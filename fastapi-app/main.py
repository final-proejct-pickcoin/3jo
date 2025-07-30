from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect, status, Query, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
import jwt
from passlib.context import CryptContext
import pymysql
from jwt_helper import create_access_token, verify_token
from dotenv import load_dotenv
import os
import redis
from user_manager import ConnectionManager
from alert_manager import AlertManager
from typing import Dict
from json import dumps
from enums.Role import Role
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# docker-compose.yml의 서비스명이 redis이면
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
# host = '127.0.0.1'
host = 'mysql'

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 간단한 사용자 저장 (실제로는 DB 쿼리로!)
fake_users_db = {}

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# CORS 설정
origins = [
    "http://localhost:3000",
    "http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

# 회원가입
@app.post("/admin/register")
async def register(email: str = Form(...), password: str = Form(...), name: str = Form(...)):

    # db연결
    conn = pymysql.connect(host=host, user="pickcoin", password="final3", port=3306, database="coindb", charset="utf8mb4")

    cursor = conn.cursor()

    try:
        # 아이디 중복확인
        sql = 'SELECT * FROM users WHERE email = %s'
        cursor.execute(sql, (email,))
        existing = cursor.fetchone()
        if existing:
            return JSONResponse(status_code=400, content={"error": "이미 존재하는 사용자입니다."})
        
        # 비밀번호 해싱
        hashed_pw = pwd_context.hash(password)

        # 사용자 등록
        insert_sql = "INSERT INTO users(email, password, name, role, is_verified) VALUES(%s, %s, %s, %s, %s)"
        user_data = (email, hashed_pw, name, Role.ADMIN.value, True)
        cursor.execute(insert_sql, user_data)
        conn.commit()
    except Exception as e:
        print(f"회원가입 실패 {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        conn.close()

    return RedirectResponse(url="/login", status_code=302)

# 로그인 페이지
@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

logged_in_users: set[str] = set()  # 나중에 redis 사용해서 로그인회원 저장시켜야함.
# 로그인 기능
@app.post("/admin/login")
async def login(email: str = Form(...), password: str = Form(...)):

    conn = pymysql.connect(host=host, user="pickcoin", password="final3", port=3306, database="coindb", charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)

    cursor = conn.cursor()

    try:
        login_sql = 'SELECT * FROM users WHERE email = %s'

        cursor.execute(login_sql, (email,))
        user = cursor.fetchone()

        if not user:
            return {"error":"존재하지 않는 사용자입니다."}
        
        # 비밀번호 비교
        if pwd_context.verify(password, user["password"]):
            # ✅ JWT 토큰 생성
            token = create_access_token({"sub": email})
            conn.commit()

            logged_in_users.add(email)  # ✅ 로그인한 유저 저장
        
            # ✅ 토큰을 응답으로 전달 (방법 1: JSON)
            return JSONResponse(content={
                "access_token": token,
                "token_type": "bearer",
                "message": f"{email}님 로그인 성공!",
                "sub": email,
                "role": user["role"]
            })
        
        else:
            return {"error": "비밀번호가 일치하지 않습니다."}

    except Exception as e:
        print(f'로그인 실패이유 : {e}')
        return HTMLResponse("서버 오류가 발생했습니다.", status_code=500)
    finally:
        conn.close()

# 로그인된 유저들 가져오기
@app.get("/logged-in-users")
async def get_logged_in_users():
    return {"users": list(logged_in_users)}

@app.post("/admin/logout")
async def logout(email: str = Form(...)):
    logged_in_users.discard(email)
    return {"msg": "로그아웃됨"}
    

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

