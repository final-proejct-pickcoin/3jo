import pymysql
from enums.Role import Role
from fastapi import APIRouter, Form, HTTPException, status, Depends, Request
from passlib.context import CryptContext
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from dotenv import load_dotenv
from utils.jwt_helper import create_access_token
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import pytz
import os
import jwt

router = APIRouter()

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

host = "34.64.105.135"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 회원가입
@router.post("/admin/register")
async def register(request:Request, email: str = Form(...), password: str = Form(...), name: str = Form(...)):
    data = await request.form()
    print(f"Received form data: {data}")
    # db연결
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4")

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

        # 한국 시간으로 변환
        utc = pytz.timezone('UTC')
        kst = pytz.timezone('Asia/Seoul')
        created_at_uct = datetime.utcnow().replace(microsecond=0)
        created_at = utc.localize(created_at_uct).astimezone(kst)
        expires_at = (created_at + timedelta(minutes=5)).replace(microsecond=0)

        # 사용자 등록
        insert_sql = "INSERT INTO users(email, password, name, role, is_verified, created_at, expires_at) VALUES(%s, %s, %s, %s, %s, %s, %s)"
        user_data = (email, hashed_pw, name, Role.ADMIN.value, True, created_at, expires_at)
        cursor.execute(insert_sql, user_data)
        conn.commit()
    except Exception as e:
        print(f"회원가입 실패 {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        conn.close()

    return RedirectResponse(url="/login", status_code=302)

logged_in_users: set[str] = set()  # 나중에 redis 사용해서 로그인회원 저장시켜야함.
# 로그인 기능
@router.post("/admin/login")
async def login(email: str = Form(...), password: str = Form(...)):

    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)

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
            token = create_access_token({"sub": email, "role": user["role"]})
            conn.commit()

            logged_in_users.add(email)  # 로그인한 유저 저장

            response = JSONResponse(content={
                "message": f"{email}님 로그인 성공!",
                "sub": email,
                "role": user["role"],
                "name": user["name"],                
                "access_token": token,
                "token_type": "bearer"
                
            })
        
            # 토큰을 응답으로 전달 ( JSON)
            return response
        
        else:
            return {"error": "비밀번호가 일치하지 않습니다."}

    except Exception as e:
        print(f'로그인 실패이유 : {e}')
        return HTMLResponse("서버 오류가 발생했습니다.", status_code=500)
    finally:
        conn.close()

# 비밀번호 변경
@router.post("/admin/change-pwd")
async def change_password(email: str = Form(...), currentPassword: str = Form(...), newPassword: str = Form(...)):
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4")
    cursor = conn.cursor()

    try:
        # 현재 비밀번호 확인(해시된 패스워드 가져오기)
        cursor.execute("SELECT password FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        if not row:
            return JSONResponse(status_code=404, content={"error": "사용자를 찾을 수 없습니다."})
        hashed_pw = row[0]

        # 비밀번호 확인(입력된 비밀번호와 해시 비교)
        if not pwd_context.verify(currentPassword, hashed_pw):
            return JSONResponse(status_code=401, content={"error": "현재 비밀번호가 올바르지 않습니다."})

        # 비밀번호 해싱
        new_hashed_pw = pwd_context.hash(newPassword)

        # 비밀번호 업데이트
        update_sql = "UPDATE users SET password = %s WHERE email = %s"
        cursor.execute(update_sql, (new_hashed_pw, email))
        conn.commit()

        return JSONResponse(content={"msg": "비밀번호가 변경되었습니다."})
    
    except Exception as e:
        print(f"비밀번호 변경 실패 {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    
    finally:
        conn.close()


# 로그인된 유저들 가져오기
@router.get("/logged-in-users")
async def get_logged_in_users():
    return {"users": list(logged_in_users)}


# 로그아웃
@router.post("/admin/logout")
async def logout(email: str = Form(...)):
    
    response = JSONResponse(content={"msg": "로그아웃됨"})
    logged_in_users.discard(email)
    return response


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")
ADMIN_ROLE = Role.ADMIN.value

def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="토큰에 이메일/권한 정보 없음"
            )
        if role != ADMIN_ROLE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="관리자 권한 없음"
            )
        return email
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰"
        )
