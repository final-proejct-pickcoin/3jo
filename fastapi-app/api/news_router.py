from fastapi import APIRouter, BackgroundTasks
from typing import List
from models.news import NewsItem
from repository.news_repository import fetch_latest, save_news
from service.news_service import bloomingbit_news  # 기존 크롤링 함수 그대로 사용

router = APIRouter()

# ✅ 최신 뉴스 조회 (항상 DB에서 읽기)
@router.get("/news", response_model=List[NewsItem])
def get_latest_news():
    rows = fetch_latest(limit=20)
    out = []
    for r in rows:
        pa = r.get("published_at")
        out.append(NewsItem(
            title=r.get("title"),
            link=r.get("link"),
            published_at=pa.strftime("%Y-%m-%d %H:%M:%S") if pa else None,
            source=r.get("source")
        ))
    return out

# ✅ 뉴스 갱신 트리거 (백그라운드에서 크롤링 → DB 저장)
@router.post("/news/refresh")
def refresh_news(background_tasks: BackgroundTasks):
    def job():
        print("[/news/refresh] background job started")
        try:
            # ⬇️ 지연 임포트: 라우터 임포트 단계 블로킹 방지 + 예외 원인 로깅
            from service.news_service import bloomingbit_news
            from repository.news_repository import save_news

            crawled = bloomingbit_news(limit=20)   # list[dict] 여야 함
            print(f"[/news/refresh] crawled {len(crawled)} items")
            saved = save_news(crawled)             # 업서트
            print(f"[/news/refresh] saved {saved} rows")
        except Exception:
            import traceback
            print("[/news/refresh] ERROR while crawling/saving")
            traceback.print_exc()
        finally:
            print("[/news/refresh] background job finished")

    background_tasks.add_task(job)
    return {"status": "queued"}