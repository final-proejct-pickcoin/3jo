from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from time import sleep

BASE_URL = "https://bloomingbit.io"

def bloomingbit_news(limit=5):
    options = Options()
    options.add_argument("--headless")  # 서버 배포 headless
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(BASE_URL)
    sleep(5)  # 메인 페이지 로딩 대기

    # HTML 파싱
    html = driver.page_source
    driver.quit()
    soup = BeautifulSoup(html, "lxml") # html dom 구조 변환

    # 랭킹 뉴스 div
    ranking_container = soup.select("div.rankingNewsList")
    print("크롤링된 div 개수", len(ranking_container))
    items = []

    for div in ranking_container[:limit]:
        title_tag = div.select_one("h3.title")
        time_tag = div.select_one("span.createEpoch")

        #print("title_tag:", title_tag)
        #print("time_tag:", time_tag)

        if not title_tag or not time_tag:
            continue

        title = title_tag.get_text(strip=True) if title_tag else "제목 없음"
        published_at = time_tag.get_text(strip=True)

        parent = div.find_parent("a")
        link = BASE_URL + parent["href"]

        items.append({
            "title": title,
            "link": link,
            "published_at": published_at,
            "source": "Bloomingbit"
        })

    return items