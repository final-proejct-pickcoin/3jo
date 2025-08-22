from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
from models.news import NewsItem
from repository.news_repository import fetch_latest  # ← fetch만 상단 임포트

router = APIRouter()

# ✅ 최신 뉴스 조회 (항상 DB에서 읽기)
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
            # 지연 임포트: 라우터 임포트 단계 블로킹/사이드이펙트 방지
            from service.news_service import bloomingbit_news
            from repository.news_repository import save_news

            crawled = bloomingbit_news(limit=20) or []
            print(f"[/news/refresh] crawled {len(crawled)} items")

            if crawled:
                saved = save_news(crawled)   # 업서트
                print(f"[/news/refresh] saved {saved} rows")
            else:
                print("[/news/refresh] no items; skip save")

        except Exception:
            import traceback
            print("[/news/refresh] ERROR while crawling/saving")
            traceback.print_exc()
        finally:
            print("[/news/refresh] background job finished")

    background_tasks.add_task(job)
    return {"status": "queued"}