import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
import json

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
DB_URL = os.getenv("NEWS_DB_URL")
engine = create_engine(DB_URL)

# 빗썸에서 지원하는 주요 코인 리스트
SUPPORTED_COINS = [
    "BTC", "ETH", "XRP", "ADA", "LTC", "BCH", "DOT", "LINK", 
    "ETC", "XLM", "TRX", "EOS", "BSV", "THETA", "VET", "DOGE",
    "ATOM", "NEO", "IOTA", "DASH", "ZEC", "XTZ", "ONT", "QTUM",
    "ICX", "OMG", "ZIL", "KNC", "BAT", "WTC", "POWR", "LRC",
    "STEEM", "STRAX", "ARDR", "STORJ", "GRS", "DENT", "SBD",
    "TFUEL", "ORBS", "VIB", "IQ", "AERGO", "ANKR", "CTC", "META"
]

def get_available_coins():
    """
    빗썸 API에서 현재 거래 가능한 코인 목록을 가져옵니다.
    """
    try:
        url = "https://api.bithumb.com/public/ticker/ALL_KRW"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data['status'] != '0000':
            print(f"빗썸 API 오류: {data.get('message', '알 수 없는 오류')}")
            return SUPPORTED_COINS  # 기본 리스트 반환
        
        # 'date' 키를 제외한 모든 코인 심볼 추출
        available_coins = [coin for coin in data['data'].keys() if coin != 'date']
        print(f"빗썸에서 지원하는 코인 수: {len(available_coins)}개")
        
        return available_coins
    
    except Exception as e:
        print(f"코인 목록 조회 실패: {e}")
        print("기본 코인 리스트를 사용합니다.")
        return SUPPORTED_COINS

def get_historical_crypto_prices(coin: str = "BTC", days: int = 200):
    """
    빗썸 Candlestick API를 사용하여 주어진 코인의 과거 일별 종가 데이터를 가져옵니다.
    
    Args:
        coin (str): 조회할 코인 심볼 (예: "BTC", "ETH", "XRP")
        days (int): 조회할 일수 (빗썸 API 제한으로 최대 200일까지만 가능)
    
    Returns:
        pd.DataFrame: 날짜별 종가 데이터가 포함된 데이터프레임 (coin 컬럼 추가)
    
    Raises:
        Exception: API 호출 실패 또는 데이터 수집 오류 시 예외 발생
    """
    # 빗썸에서 사용하는 코인 심볼 형식으로 변환 (예: BTC -> BTC_KRW)
    symbol = coin.upper() + "_KRW"
    
    # 빗썸 API는 최대 200일의 일별 캔들스틱 데이터만 제공
    if days > 200:
        raise ValueError(f"빗썸 API는 최대 200일까지만 조회 가능합니다. 요청된 일수: {days}")
    
    try:
        # 빗썸 캔들스틱 API 엔드포인트
        url = f"https://api.bithumb.com/public/candlestick/{symbol}/24h"
        
        print(f"빗썸 API에서 {coin} 코인의 최근 {days}일 데이터를 가져오는 중...")
        
        # API 호출 (빗썸은 기본적으로 최근 200개의 캔들 데이터를 제공)
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # HTTP 에러 발생 시 예외 발생
        
        data = response.json()
        
        # API 응답 상태 확인
        if data['status'] != '0000':
            raise Exception(f"빗썸 API 오류 (상태코드: {data['status']}): {data.get('message', '알 수 없는 오류')}")
        
        # 캔들스틱 데이터 파싱
        candlestick_data = data['data']
        
        if not candlestick_data:
            raise Exception("빗썸 API에서 반환된 캔들스틱 데이터가 비어있습니다.")
        
        # 데이터 구조: [timestamp, open, close, high, low, volume]
        # timestamp는 밀리초 단위이므로 초 단위로 변환 후 datetime 객체로 변환
        dates = []
        closes = []
        volumes = []
        
        for candle in candlestick_data:
            # timestamp를 밀리초에서 초로 변환하여 datetime 객체 생성
            timestamp = int(candle[0]) / 1000
            date_obj = datetime.fromtimestamp(timestamp)
            
            # 종가 및 거래량 데이터
            close_price = float(candle[2])
            volume = float(candle[5])
            
            dates.append(date_obj.date())
            closes.append(close_price)
            volumes.append(volume)
        
        # 데이터프레임 생성 (coin 컬럼 추가)
        df = pd.DataFrame({
            'coin': coin.upper(),  # 코인 심볼 추가
            'date': dates,
            'close': closes,
            'volume': volumes
        })
        
        # 날짜 순으로 정렬 (오래된 날짜가 위로 오도록)
        df = df.sort_values('date').reset_index(drop=True)
        
        # 요청된 일수만큼 데이터 제한 (최신 데이터부터 days 개수만큼)
        if len(df) > days:
            df = df.tail(days).reset_index(drop=True)
        
        print(f"✅ 성공적으로 {len(df)}일의 {coin} 가격 데이터를 수집했습니다.")
        
        return df
        
    except requests.exceptions.Timeout as e:
        print(f"❌ {coin} 네트워크 타임아웃 오류: 빗썸 API 응답이 지연되고 있습니다 (10초 초과)")
        raise
    
    except requests.exceptions.ConnectionError as e:
        print(f"❌ {coin} 네트워크 연결 오류: 빗썸 API 서버에 연결할 수 없습니다")
        raise
    
    except requests.exceptions.HTTPError as e:
        print(f"❌ {coin} HTTP 오류: HTTP 상태 코드: {e.response.status_code}")
        raise
    
    except Exception as e:
        print(f"❌ {coin} 데이터 수집 중 오류 발생: {e}")
        raise

def get_all_coins_historical_data(days: int = 200, max_coins: int = None):
    """
    지원되는 모든 코인의 과거 가격 데이터를 수집합니다.
    
    Args:
        days (int): 조회할 일수 (최대 200일)
        max_coins (int): 수집할 최대 코인 개수 (None이면 모든 코인)
    
    Returns:
        pd.DataFrame: 모든 코인의 통합 데이터프레임
    """
    print("=== 모든 코인 데이터 수집 시작 ===")
    
    # 사용 가능한 코인 목록 가져오기
    available_coins = get_available_coins()
    
    if max_coins:
        available_coins = available_coins[:max_coins]
        print(f"최대 {max_coins}개 코인으로 제한하여 수집합니다.")
    
    all_data = []
    successful_coins = []
    failed_coins = []
    
    for i, coin in enumerate(available_coins, 1):
        try:
            print(f"\n[{i}/{len(available_coins)}] {coin} 데이터 수집 중...")
            
            coin_data = get_historical_crypto_prices(coin=coin, days=days)
            all_data.append(coin_data)
            successful_coins.append(coin)
            
            # API 제한을 피하기 위한 지연
            time.sleep(0.5)  # 0.5초 대기
            
        except Exception as e:
            print(f"❌ {coin} 데이터 수집 실패: {e}")
            failed_coins.append(coin)
            continue
    
    if not all_data:
        raise Exception("모든 코인 데이터 수집에 실패했습니다.")
    
    # 모든 데이터 통합
    combined_df = pd.concat(all_data, ignore_index=True)
    
    print(f"\n=== 데이터 수집 완료 ===")
    print(f"✅ 성공: {len(successful_coins)}개 코인")
    print(f"❌ 실패: {len(failed_coins)}개 코인")
    print(f"📊 총 데이터 행 수: {len(combined_df)}")
    print(f"📈 수집된 코인: {', '.join(successful_coins[:10])}{'...' if len(successful_coins) > 10 else ''}")
    
    if failed_coins:
        print(f"🚫 실패한 코인: {', '.join(failed_coins[:5])}{'...' if len(failed_coins) > 5 else ''}")
    
    return combined_df

def get_coin_specific_data(coin: str, days: int = 200):
    """
    특정 코인의 데이터만 가져오는 기존 함수 (호환성 유지)
    """
    return get_historical_crypto_prices(coin=coin, days=days)

def get_recent_news_data(days: int = 1):
    """
    VS Code 크롤러가 저장한 DB(news)에서 최근 N일 뉴스 읽기.
    반환 컬럼: ['timestamp', 'title', 'content']
    content 컬럼이 DB에 없으므로 빈 문자열로 대체.
    """
    if not DB_URL:
        raise RuntimeError("환경변수 NEWS_DB_URL이 없습니다. .env를 확인하세요.")


    # db 값 읽기
    query = text("""
        SELECT
          COALESCE(published_at, created_at) AS timestamp,
          title,
          COALESCE(content, '') AS content
        FROM news
        WHERE COALESCE(published_at, created_at) >= (NOW() - INTERVAL :days DAY)
          -- 옵션: 본문 없는 뉴스는 아예 빼고 싶다면 주석 해제
          -- AND content IS NOT NULL
          -- AND CHAR_LENGTH(content) > 0
        ORDER BY COALESCE(published_at, created_at) DESC
        LIMIT 1000
    """)

    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"days": days})

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    # 시간순으로 정렬 (최신순)
    # df.sort(key=lambda x: x['timestamp'], reverse=True)
    df = df.sort_values('timestamp', ascending=False).reset_index(drop=True)
    print(f"{days}일간 {len(df)}개의 뉴스 데이터를 생성했습니다.")

    # return pd.DataFrame(mock_news)
    return df[["timestamp", "title", "content"]]

def test_all_coins_collection():
    """
    모든 코인 데이터 수집 테스트
    """
    print("=== 모든 코인 데이터 수집 테스트 ===")
    
    try:
        # 테스트용으로 처음 5개 코인만 수집
        all_coins_data = get_all_coins_historical_data(days=30, max_coins=5)
        
        print(f"\n📊 통합 데이터 미리보기:")
        print(all_coins_data.head(10).to_string(index=False))
        
        print(f"\n📈 코인별 데이터 개수:")
        coin_counts = all_coins_data['coin'].value_counts()
        print(coin_counts.to_string())
        
        return all_coins_data
        
    except Exception as e:
        print(f"❌ 모든 코인 데이터 수집 테스트 실패: {e}")
        return None

def debug_db_info():
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT
              COUNT(*)                               AS total_rows,
              MAX(CHAR_LENGTH(content))              AS max_len,
              MAX(created_at)                        AS last_created
            FROM news
        """)).mappings().one()
    print("engine =", str(engine.url))
    print("rows=", row["total_rows"], "max_len=", row["max_len"], "last_created=", row["last_created"])

if __name__ == "__main__":
    # 모든 코인 데이터 수집 테스트
    test_all_coins_collection()
