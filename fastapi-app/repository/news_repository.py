from sqlalchemy import text
from typing import List, Dict, Optional
from datetime import datetime
from db.mysql import SessionLocal

# 블루밍비트에서 가져온 published_at 값이 문자열일 수도 있어서 파싱 시도
_FMT_LIST = ("%Y-%m-%d %H:%M", "%Y.%m.%d %H:%M", "%Y-%m-%d", "%Y.%m.%d")

def _parse_dt(s: Optional[str]):
    if not s:
        return None
    s = s.strip()
    for fmt in _FMT_LIST:
        try:
            return datetime.strptime(s, fmt)
        except:
            pass
    return None   # 어떤 포맷에도 안 맞으면 NULL로 저장

# ------------------------------
# 1) 뉴스 저장 (upsert)
# ------------------------------
def save_news(items: List[Dict]) -> int:
    """
    크롤링 결과를 news 테이블에 저장 (중복 link는 UPDATE)
    items = [{title, link, published_at(str|datetime|None), source}, ...]
    """
    if not items:
        return 0

    sql = text("""
        INSERT INTO news (title, link, published_at, source)
        VALUES (:title, :link, :published_at, :source)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          published_at = VALUES(published_at),
          source = VALUES(source)
    """)

    n = 0
    with SessionLocal() as db:
        with db.begin():
            for it in items:
                pub = it.get("published_at")
                if isinstance(pub, str):   # 문자열이면 datetime으로 변환 시도
                    pub = _parse_dt(pub)
                db.execute(sql, {
                    "title": it.get("title"),
                    "link": it.get("link"),
                    "published_at": pub,
                    "source": it.get("source", "Bloomingbit"),
                })
                n += 1
    return n

# ------------------------------
# 2) 최신 뉴스 조회
# ------------------------------
def fetch_latest(limit: int = 20) -> List[Dict]:
    """
    최신순(발행일 없으면 created_at 기준)으로 limit개 가져오기
    """
    sql = text("""
        SELECT id, title, link, published_at, source, created_at
        FROM news
        ORDER BY COALESCE(published_at, created_at) DESC
        LIMIT :limit
    """)
    with SessionLocal() as db:
        rows = db.execute(sql, {"limit": limit}).mappings().all()
        return [dict(r) for r in rows]
    

def delete_news_older_than(days: int) -> int:
    """
    보존기간 정책: N일보다 오래된 뉴스 삭제
    return: 삭제된 행 수
    """
    sql = text("""
        DELETE FROM news
        WHERE COALESCE(published_at, created_at) < (NOW() - INTERVAL :days DAY)
    """)
    with SessionLocal() as db:
        with db.begin():
            result = db.execute(sql, {"days": days})
            return result.rowcount or 0

def trim_news_by_count(max_rows: int) -> int:
    """
    개수 상한 정책: 최신 max_rows개만 남기고 나머지 삭제
    MySQL에서 같은 테이블을 조회/삭제할 때는 서브쿼리에 별칭을 한 번 더 싸는 패턴을 써야 안전하다.
    return: 삭제된 행 수
    """
    sql = text("""
        DELETE FROM news
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id
                FROM news
                ORDER BY COALESCE(published_at, created_at) DESC
                LIMIT :max_rows
            ) AS keep_rows
        )
    """)
    with SessionLocal() as db:
        with db.begin():
            result = db.execute(sql, {"max_rows": max_rows})
            return result.rowcount or 0