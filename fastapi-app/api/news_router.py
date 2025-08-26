from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
from models.news import NewsItem
from repository.news_repository import fetch_latest  # ← fetch만 상단 임포트

from fastapi import Query
import service.news_service as ns
from service.news_service import fetch_article_content, crawl_and_save

router = APIRouter()

@router.post("/news/refresh-sync")
def refresh_news_sync(limit: int = 10):
    # 백그라운드 말고 즉시 실행 → 서버 터미널에 print 로그도 보임
    saved = crawl_and_save(limit=limit)
    return {"saved": saved}

# 1) 이 서버가 실제로 쓰는 news_service.py 파일 경로 확인
@router.get("/debug/whoami")
def debug_whoami():
    return {"news_service_file": ns.__file__}

# 2) 특정 기사 링크 한 개로 본문 길이 테스트
@router.get("/news/debug/fetch-one")
def debug_fetch_one(url: str = Query(..., description="기사 상세 페이지 URL")):
    content = fetch_article_content(url)
    return {
        "len": len(content),
        "sample": content[:200]
    }

# 최신 뉴스 조회 (항상 DB에서 읽기)
@router.get("/news", response_model=List[NewsItem])
def get_latest_news():
    try:
        rows = fetch_latest(limit=20)
        out = []
        for r in rows:
            pa = r.get("published_at")
            if hasattr(pa, "strftime"):
                pa = pa.strftime("%Y-%m-%d %H:%M:%S")
            elif isinstance(pa, str):
                # 문자열이면 그대로 사용
                pass
            else:
                pa = None

            out.append(NewsItem(
                title=(r.get("title") or "").strip(),
                link=(r.get("link") or "").strip(),
                published_at=pa,
                source=(r.get("source") or "").strip(),
                content=r.get("content")
            ))
        return out
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# 뉴스 갱신 트리거 (백그라운드에서 크롤링 → DB 저장)
@router.post("/news/refresh")
def refresh_news(background_tasks: BackgroundTasks):
    def job():
        print("[/news/refresh] background job started")
        try:
            saved = crawl_and_save(limit=20)  # ← 본문까지 채워 저장
            print(f"[/news/refresh] saved {saved} rows")
        except Exception:
            import traceback
            print("[/news/refresh] ERROR while crawling/saving")
            traceback.print_exc()
        finally:
            print("[/news/refresh] background job finished")

    background_tasks.add_task(job)
    return {"status": "queued"}

# 본문 없는 뉴스들에 대해 본문 채우기 (백그라운드)
@router.post("/news/backfill")
def backfill(limit: int = 50):
    from service.news_service import backfill_missing_content
    n = backfill_missing_content(limit=limit)
    return {"backfilled": n}