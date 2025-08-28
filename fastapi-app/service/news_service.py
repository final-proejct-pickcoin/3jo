
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from time import sleep
import time
import requests
import json, re
from html import unescape

from repository.news_repository import save_news

from repository.news_repository import (
    select_links_missing_content,   # DB에서 content 비거나 짧은 링크 뽑기
    update_content_by_link,         # 링크별 content 업데이트
)

BASE_URL = "https://bloomingbit.io"


# =========================
# 공용 텍스트 정리 & 노이즈 필터
# =========================
def _clean_text(txt: str) -> str:
    if not txt:
        return ""
    txt = unescape(txt)
    # 다중 공백/개행 정리
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt

# 긴 base64/데이터URL/반복문자 등 본문이 아닌 문자열을 거르기 위한 정규식
_BASE64_RE = re.compile(r'^[A-Za-z0-9+/]{80,}={0,2}$')
_DATA_URL_RE = re.compile(r'^data:[a-z]+/[a-z0-9.+-]+;base64,', re.I)

def _is_noise_text(s: str) -> bool:
    """본문이 아닌 노이즈 텍스트(이미지 dataURL, 길다란 base64, 동일문자 반복 등)를 필터링"""
    if not s:
        return True
    s = s.strip()

    # data:image/png;base64,AAAA... 같은 문자열
    if _DATA_URL_RE.match(s) or _BASE64_RE.match(s):
        return True

    # 같은 문자 반복 (예: 'AAAAA...' 혹은 문자종류가 2~3개뿐)
    if len(s) >= 50 and len(set(s)) <= 3:
        return True

    # 거의 영숫자만 잔뜩(토큰/키값으로 보이는) 긴 문자열
    letters = sum(ch.isalnum() for ch in s)
    if len(s) >= 120 and (letters / max(len(s), 1)) >= 0.95:
        return True

    return False


def _strings_from_json(obj):
    """
    __NEXT_DATA__ 같은 JSON에서 본문 후보 텍스트를 재귀적으로 모은다.
    + 노이즈 필터 적용
    """
    stack = [obj]
    results = []

    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            for k, v in cur.items():
                # 본문 가능성이 높은 key들만 우선 수집
                if isinstance(v, str) and k.lower() in (
                    "content", "html", "markdown", "body", "text", "description"
                ):
                    results.append(v)
                else:
                    stack.append(v)
        elif isinstance(cur, list):
            stack.extend(cur)
        elif isinstance(cur, str) and len(cur) > 80:
            # 길이가 좀 있는 문자열은 후보에 추가
            results.append(cur)

    clean = []
    for s in results:
        # HTML 태그 제거 + 공백 정리
        s = _clean_text(BeautifulSoup(s, "html.parser").get_text(" ", strip=True))
        if not s or _is_noise_text(s):
            continue
        # 한국어 기사로서 문장스러움 간단 체크(한글/문장부호가 거의 없으면 스킵)
        if (sum('\uac00' <= ch <= '\ud7a3' for ch in s) + s.count('.') + s.count(',')) < 5:
            continue
        if s not in clean:
            clean.append(s)
    return clean


# ==============================================
# 상세 본문 수집: Selenium 우선 + JSON/메타 보강
# ==============================================
def fetch_article_content(url: str, driver: webdriver.Chrome = None) -> str:
    """
    Bloomingbit 상세 페이지 본문 수집:
    1) (우선) Selenium 렌더링된 DOM에서 feedMainContent_* 컨테이너의 <p> 텍스트 모두 수집
    2) (보강) __NEXT_DATA__ JSON 파싱 (노이즈 필터 적용)
    3) (최후) 메타 태그(og:description 등) 요약
    """
    # 1) Selenium으로 실제 렌더링된 본문 <p> 수집 시도
    try:
        close_after = False
        if driver is None:
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            close_after = True

        driver.get(url)
        try:
            WebDriverWait(driver, 7).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, 'div[class*="feedMainContent_"], section[class*="feedMainContent_"]')
                )
            )
        except Exception:
            # 케이스에 따라 살짝 더 대기
            time.sleep(1.2)

        html = driver.page_source
        sp = BeautifulSoup(html, "html.parser")
        container = (
            sp.select_one('div[class*="feedMainContent_feedDetailArticle"]')
            or sp.select_one('div[class*="feedMainContent_markdown"]')
            or sp.select_one('div[class*="feedMainContent"]')
            or sp.select_one('section[class*="feedMainContent"]')
        )

        if close_after:
            try:
                driver.quit()
            except Exception:
                pass

        if container:
            ps = []
            for p in container.select("p"):
                t = _clean_text(p.get_text(" ", strip=True))
                if t:
                    ps.append(t)
            if ps:
                txt = " ".join(ps)
                # 최소 길이 보장(요약만 잡히는 케이스 방지)
                if len(txt) >= 300:
                    return txt
                # 짧아도 일단 반환(보강 로직에서 더 긴 텍스트가 나오면 그걸로 대체)
                short_txt = txt
            else:
                short_txt = ""
        else:
            short_txt = ""
    except Exception:
        short_txt = ""

    # 2) __NEXT_DATA__ JSON 보강 (requests)
    soup = None
    try:
        resp = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.8"},
            allow_redirects=True,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        if script and script.string:
            data = json.loads(script.string)
            cand = _strings_from_json(data)        # ← 노이즈 필터 적용됨
            long = [s for s in cand if len(s) > 120]
            if long:
                txt = " ".join(long)
                if len(txt) >= 300:
                    return txt
                # 그래도 짧으면 Selenium에서 얻은 short_txt와 합쳐서 반환
                merged = (short_txt + " " + txt).strip()
                if merged:
                    return merged
    except Exception:
        pass

    # 3) 메타 태그(og:description 등) 요약 (최후의 보루)
    try:
        for name, attr in [
            ("meta", {"property": "og:description"}),
            ("meta", {"name": "twitter:description"}),
            ("meta", {"name": "description"}),
        ]:
            m = soup.find(name, attr) if soup else None
            if m and (m.get("content") or m.get("value")):
                meta_txt = _clean_text(m.get("content") or m.get("value"))
                if meta_txt:
                    # short_txt가 있으면 합쳐서 조금이라도 본문 길이 늘리기
                    return (short_txt + " " + meta_txt).strip() if short_txt else meta_txt
    except Exception:
        pass

    return short_txt  # 아무것도 못 얻었으면 Selenium에서 얻은 짧은 본문이라도 반환



# 목록(랭킹 뉴스) 크롤링: Selenium 1회
def bloomingbit_news(limit=20):
    options = Options()
    options.add_argument("--headless")  # 서버 배포 headless
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(BASE_URL)
    sleep(3)  # 메인 페이지 로딩 대기

    # HTML 파싱
    html = driver.page_source
    driver.quit()
    soup = BeautifulSoup(html, "lxml")  # html dom 구조 변환

    # 랭킹 뉴스 div
    ranking_container = soup.select("div.rankingNewsList")
    print("크롤링된 div 개수", len(ranking_container))
    items = []

    for div in ranking_container[:limit]:
        title_tag = div.select_one("h3.title")
        time_tag = div.select_one("span.createEpoch")

        if not title_tag:
            continue

        title = title_tag.get_text(strip=True) if title_tag else "제목 없음"

        # epoch 속성 우선 사용 → 없으면 텍스트 → 그래도 없으면 현재시각(epoch, ms)
        published_at = None
        if time_tag:
            epoch_attr = time_tag.get("data-epoch") or time_tag.get("data-timestamp")
            if epoch_attr and str(epoch_attr).strip().isdigit():
                published_at = str(epoch_attr).strip()  # "1724220000000"(ms) or "1724220000"(s)
            else:
                text_val = time_tag.get_text(strip=True)  # ex) "10시간 전"
                published_at = text_val if text_val else None

        # 아무 정보도 없으면 현재시각(ms)로 채워 NULL 방지
        if published_at is None:
            published_at = str(int(time.time() * 1000))

        # a 태그 href 결합
        parent = div.find_parent("a")
        link = BASE_URL + parent["href"] if parent and parent.get("href") else BASE_URL

        items.append({
            "title": title,
            "link": link,
            "published_at": published_at,
            "source": "Bloomingbit"
        })

    return items


# =================================
# 전체 파이프라인: 크롤 →
# 상세 본문 수집 → DB 저장
# =================================
def crawl_and_save(limit: int = 20) -> int:
    # 1) 목록 크롤링 (제목/링크/시간/출처)
    items = bloomingbit_news(limit=limit)

    # 2) 상세 본문 수집용 Chrome 드라이버 1회만 띄우고 재사용(성능↑)
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    detail_driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # 각 기사 상세로 들어가서 본문 <p>들을 긁어 content 채우기
    enriched = []
    for it in items:
        try:
            content = fetch_article_content(it["link"], driver=detail_driver)
            # ✅ 본문을 못 가져온 경우 '' 대신 None으로 통일 (업서트 보호막과 맞물림)
            if not content:  # '' 또는 None
                content = None
            print(f"[content] len={len(content or '')} link={it['link']}")
        except Exception as e:
            print(f"[content error] {it.get('link')} - {e}")
            content = None  # 예외 시에도 None

        enriched.append({
            "title": it["title"],
            "link": it["link"],
            "published_at": it.get("published_at"),
            "source": it.get("source"),
            "content": content,
        })

    # 드라이버 정리
    try:
        detail_driver.quit()
    except Exception:
        pass

    # 3) DB 저장(업서트)
    n = save_news(enriched)
    print(f"[crawl_and_save] 저장 시도 건수: {n}")
    return n

# DB에 content 없는 content 보정
def backfill_missing_content(limit: int = 50) -> int:
    """
    DB에 content가 NULL/짧은 기사들을 상세 페이지로 들어가 다시 채운다.
    메인 20개 목록(랭킹)에 없어도 DB에 link만 있으면 채워진다.
    """
    links = select_links_missing_content(limit=limit)
    if not links:
        print("[backfill_missing_content] 보정 대상 없음")
        return 0

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    saved = 0
    for link in links:
        try:
            body = fetch_article_content(link, driver=driver)
            if body and body.strip():
                update_content_by_link(link, body.strip())
                saved += 1
        except Exception as e:
            print(f"[backfill error] {link} - {e}")

    try:
        driver.quit()
    except Exception:
        pass

    print(f"[backfill_missing_content] 채운 건수: {saved}")
    return saved