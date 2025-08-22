from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# ──[환경변수에서 먼저 읽고, 없으면 기본값 사용]────────────────────────
DB_USER = os.getenv("MYSQL_USER", "root")
DB_PASS = os.getenv("MYSQL_PASSWORD", "Admin1234!")   
DB_NAME = os.getenv("MYSQL_DB", "coindb")                
DB_HOST = os.getenv("MYSQL_HOST", "34.47.81.41")
DB_PORT = int(os.getenv("MYSQL_PORT", "3306"))

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASS}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    "?charset=utf8mb4"
    "&connect_timeout=5"
    "&read_timeout=5"
    "&write_timeout=5"
)

# 엔진/세션팩토리 설정
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # 연결 살아있는지 체크
    pool_recycle=3600,    # 1시간마다 재활용(잠수연결 방지)
    pool_size=5,
    max_overflow=10,
    pool_timeout=5,      # 5초 동안 연결 없으면 예외 발생
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# FastAPI 의존성에서 쓰기 좋은 DB 세션 제공자
def get_db():
    """
    사용 예:
        from fastapi import Depends
        from db.mysql import get_db
        def endpoint(db = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ping() -> bool:
    """DB 연결 확인용"""
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return True
    except Exception as e:
        print("DB ping failed:", e)
        return False