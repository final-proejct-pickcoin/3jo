from fastapi import APIRouter, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import List
from models.news import NewsItem
from repository.news_repository import fetch_latest  # ← fetch만 상단 임포트

import service.news_service as ns
from service.news_service import fetch_article_content, crawl_and_save

# ─────────────────────────────────────────────────────────────────────────────
# LLM 관련
# ─────────────────────────────────────────────────────────────────────────────
import os, json, re
from datetime import datetime, timezone, timedelta
try:
    import google.generativeai as genai
except Exception:
    genai = None

KST = timezone(timedelta(hours=9))  # 한국 시간대 고정

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# 디버그 / 유틸
# ─────────────────────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────────────────────
# 최신 뉴스 조회 (항상 DB에서 읽기)
# ─────────────────────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────────────────────
# 뉴스 갱신 트리거 (백그라운드에서 크롤링 → DB 저장)
# ─────────────────────────────────────────────────────────────────────────────
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

# ─────────────────────────────────────────────────────────────────────────────
# 본문 없는 뉴스들에 대해 본문 채우기 (백그라운드)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/news/backfill")
def backfill(limit: int = 50):
    from service.news_service import backfill_missing_content
    n = backfill_missing_content(limit=limit)
    return {"backfilled": n}

# ─────────────────────────────────────────────────────────────────────────────
# 헬퍼: LLM이 코드블록/설명 섞어서 줄 때 JSON만 뽑아내기
# ─────────────────────────────────────────────────────────────────────────────
def _extract_json(text: str):
    if not text:
        return None
    # ```json ... ``` 블록 우선 추출
    m = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", text, re.IGNORECASE)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # 첫 { ~ 마지막 } 범위 재시도
    start = text.find("{"); end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except Exception:
            pass
    return None

# ─────────────────────────────────────────────────────────────────────────────
# 헬퍼: 본문 기반 간이요약/감성/키워드(LLM 실패·미사용 시 폴백)
# ─────────────────────────────────────────────────────────────────────────────
POS = ["상승", "강세", "호재", "상향", "돌파", "급등", "유입", "개선", "증가"]
NEG = ["하락", "약세", "악재", "급락", "감소", "해킹", "소송", "규제", "유출"]

COIN_MAP = {
    "BTC":"비트코인","ETH":"이더리움","SOL":"솔라나","XRP":"리플","DOGE":"도지",
    "BNB":"BNB","ADA":"카르다노","DOT":"폴카닷","AVAX":"아발란체","TRX":"트론"
}
COIN_REGEX = re.compile(
    r"\b(BTC|ETH|SOL|XRP|DOGE|BNB|ADA|DOT|AVAX|TRX)\b|비트코인|이더리움|솔라나|리플|도지|카르다노|폴카닷|아발란체|트론",
    re.IGNORECASE
)

def _first_sentence(text: str, limit=140):
    if not text:
        return ""
    # 한/영 마침표 기준으로 1문장, 너무 길면 자름
    s = re.split(r"(?<=[.!?]|다\.)\s+", text.strip())
    cand = s[0] if s else text
    return (cand[:limit] + "…") if len(cand) > limit else cand

def _heuristic_summary(rows, max_bullets=5, max_sources=5):
    # bullets: 본문(content) 있으면 1문장 요약, 없으면 title
    bullets = []
    for r in rows[:max_bullets]:
        title = (r.get("title") or "").strip()
        body  = (r.get("content") or "").strip()
        base  = body if body else title
        bullet = _first_sentence(base, 140)
        if body and title and title not in bullet:
            bullet = f"{title} — {bullet}"  # 제목+본문 첫문장
        bullets.append(bullet)

    # 간이 감성: 긍/부정 키워드 카운트
    joined = " ".join([(r.get("title") or "") + " " + (r.get("content") or "") for r in rows])
    pos_score = sum(joined.count(w) for w in POS)
    neg_score = sum(joined.count(w) for w in NEG)
    sentiment = "중립"
    if pos_score - neg_score >= 2:
        sentiment = "상승세"
    elif neg_score - pos_score >= 2:
        sentiment = "하락세"

    # 간이 엔티티: 코인명/심볼 추출 Top-4
    ent_counter = {}
    for m in COIN_REGEX.finditer(joined):
        token = m.group(0).upper()
        token = COIN_MAP.get(token, token)
        ent_counter[token] = ent_counter.get(token, 0) + 1
    top_entities = [k for k, _ in sorted(ent_counter.items(), key=lambda x: -x[1])[:4]]

    # 출처: 상위 5개까지만
    sources = [{"title": r.get("title"), "link": r.get("link")} for r in rows[:max_sources]]

    return {
        "date": datetime.now(KST).date().isoformat(),
        "bullets": bullets,
        "sentiment": sentiment,
        "top_entities": top_entities,
        "sources": sources,
        "note": "fallback (no/invalid LLM)"
    }

# ─────────────────────────────────────────────────────────────────────────────
# 뉴스 요약 (LLM 사용, 없으면 간이 요약)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/news/summary")
def news_summary(limit: int = 20):
    # 1) 최신 뉴스 DB에서 가져오기 (LLM 토큰 고려해 상한 50)
    limit = max(1, min(limit, 50))
    rows = fetch_latest(limit=limit)

    # 2) 프롬프트용 텍스트 구성 (제목 + 본문 앞부분)
    docs = []
    for r in rows:
        title = (r.get("title") or "").strip()
        body  = (r.get("content") or "")[:1200]  # 너무 길면 잘라서 안정화
        if title:
            docs.append(f"- {title}\n{body}")

    # 3) LLM 준비 여부
    api_key = os.getenv("GEMINI_API_KEY")
    llm_ready = bool(api_key and genai is not None)

    # 4) LLM 시도 (JSON만 반환하도록 지시 + 파서 보강)
    if llm_ready and docs:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
너는 암호화폐 시장 뉴스 요약가다.
아래 기사 묶음을 오늘자 핵심 3~5개 불릿으로 한국어 요약해라.
각 불릿은 1줄로 간결하게.
마지막에 전체 시장 심리를 '상승세/중립/하락세' 중 하나로 판단하고,
관련 자산/키워드 2~4개를 뽑아라.
반드시 JSON만 반환해라.

기사들:
{chr(10).join(docs)}

JSON 스키마:
{{"bullets":[], "sentiment":"", "top_entities":[], "sources":[]}}
"""
            resp = model.generate_content(prompt)
            raw = getattr(resp, "text", None)
            # candidates 경로 보조 파서
            if not raw and getattr(resp, "candidates", None):
                parts = resp.candidates[0].content.parts
                raw = "".join([getattr(p, "text", "") for p in parts])

            data = _extract_json(raw) if raw else None
            if data:
                if "sources" not in data or not data["sources"]:
                    data["sources"] = [{"title": r.get("title"), "link": r.get("link")} for r in rows[:5]]
                data["date"] = datetime.now(KST).date().isoformat()
                return data
        except Exception:
            # LLM 실패 시 폴백으로 진행
            pass

    # 5) 폴백: 본문 기반 간이 요약/감성/키워드 추출
    return _heuristic_summary(rows, max_bullets=min(5, len(rows)), max_sources=5)