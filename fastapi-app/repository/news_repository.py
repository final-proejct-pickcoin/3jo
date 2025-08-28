from sqlalchemy import text
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta  # 🔁 변경: timedelta 추가
from db.mysql import SessionLocal

# 🔽 추가: 한국시간(KST) 강제 적용을 위한 타임존
import pytz
KST = pytz.timezone("Asia/Seoul")

# 블루밍비트에서 가져온 published_at 값이 문자열일 수도 있어서 파싱 시도
# 다양한 포맷/epoch/상대시간까지 지원
_FMT_LIST = ("%Y-%m-%d %H:%M", "%Y.%m.%d %H:%M", "%Y-%m-%d", "%Y.%m.%d")

def _parse_dt(s: Optional[str]):
    """
    문자열로 들어온 published_at을 datetime으로 변환한다. (✅ 한국시간 KST로 고정)
    - 지원: 정형 날짜 포맷(_FMT_LIST), epoch 초/밀리초, 'n분 전', 'n시간 전', '어제', 'n일 전', '방금전'
    - 인식 실패 시 None 반환(= DB에 NULL 저장)
    """
    if not s:
        return None
    s = str(s).strip()

    # 1) epoch 초/밀리초 (숫자만으로 구성된 경우) → KST
    if s.isdigit():
        try:
            v = int(s)
            # 10자리 초단위 vs 13자리 밀리초단위 추정
            if v > 10_000_000_000:  # 13자리(밀리초)로 판단
                return datetime.fromtimestamp(v / 1000, tz=KST)  # ✅
            return datetime.fromtimestamp(v, tz=KST)             # ✅
        except Exception:
            pass

    # 2) 한국어 상대 시간 표현 → 기준시각을 KST로
    try:
        now_kst = datetime.now(KST)  # ✅
        if s in ("방금전", "방금 전"):
            return now_kst
        if s.endswith("초 전"):
            sec = int(s.replace("초 전", "").strip())
            return now_kst - timedelta(seconds=sec)
        if s.endswith("분 전"):
            m = int(s.replace("분 전", "").strip())
            return now_kst - timedelta(minutes=m)
        if s.endswith("시간 전"):
            h = int(s.replace("시간 전", "").strip())
            return now_kst - timedelta(hours=h)
        if s in ("어제", "어제 전", "하루 전"):
            return now_kst - timedelta(days=1)
        if s.endswith("일 전"):
            d = int(s.replace("일 전", "").strip())
            return now_kst - timedelta(days=d)
    except Exception:
        pass

    # 3) 정형 날짜 포맷들 순차 시도 → naive 로 파싱되면 KST로 간주해 로컬라이즈
    for fmt in _FMT_LIST:
        try:
            dt = datetime.strptime(s, fmt)
            return KST.localize(dt)  # ✅
        except Exception:
            pass

    # 모두 실패하면 None
    return None   # 어떤 포맷에도 안 맞으면 NULL로 저장


# 1) 뉴스 저장 (upsert)
def save_news(items: List[Dict]) -> int:
    """
    크롤링 결과를 news 테이블에 저장 (중복 link는 UPDATE)
    items = [{title, link, published_at(str|datetime|None), source, content}, ...]
    """
    if not items:
        return 0

    sql = text("""
        INSERT INTO news (title, link, published_at, source, content, created_at)
        VALUES (:title, :link, :published_at, :source, :content, NOW())
        ON DUPLICATE KEY UPDATE
          title        = VALUES(title),
          published_at = VALUES(published_at),
          source       = VALUES(source),
          -- ✅ 새 content가 NULL/''이면 기존 DB 값을 보존(빈값 덮어쓰기 방지)
          content      = COALESCE(NULLIF(VALUES(content), ''), content);
    """)

    n = 0
    with SessionLocal() as db:
        with db.begin():
            for it in items:
                pub = it.get("published_at")
                # 기존 파일 구조 유지: 문자열/epoch/상대시간 모두 _parse_dt로 처리
                if isinstance(pub, str):
                    pub = _parse_dt(pub)

                db.execute(sql, {
                    "title": it.get("title"),
                    "link": it.get("link"),
                    "published_at": pub,
                    "source": it.get("source", "Bloomingbit"),
                    "content": it.get("content", None),  # 본문: None이면 보존 규칙과 맞물림
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
        SELECT id, title, link, published_at, source, content, created_at
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


# 3) 본문(content) 없는 뉴스 링크 조회
def select_links_missing_content(limit: int = 50) -> List[Tuple[str]]:
    sql = text("""
        SELECT link
        FROM news
        WHERE content IS NULL OR LENGTH(content) < 100
        ORDER BY COALESCE(published_at, created_at) DESC
        LIMIT :limit
    """)
    with SessionLocal() as db:
        rows = db.execute(sql, {"limit": limit}).fetchall()
        return [r[0] for r in rows]


# 4) 뉴스 본문(content) 업데이트
def update_content_by_link(link: str, content: str) -> int:
    sql = text("""
        UPDATE news
        SET content = :content
        WHERE link = :link
    """)
    with SessionLocal() as db:
        with db.begin():
            res = db.execute(sql, {"content": content, "link": link})
            return res.rowcount or 0