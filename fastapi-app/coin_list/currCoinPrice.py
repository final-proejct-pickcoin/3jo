from pybithumb import WebSocketManager
import pymysql
import os
from dotenv import load_dotenv

def selectCoin():
    conn = pymysql.connect(host='34.64.60.13', port=3306, user='pickcoin', password='final3', database="coindb", charset="utf8mb4")

    cursor = conn.cursor()

    sql = "SELECT coin_name, market FROM coin"

    cursor.execute(sql)

    result = cursor.fetchall()

    # coin_market_list = [ (result[0], result[1]) for result in result ]

    print(result)
    cursor.close()

    conn.close()

    return result


if __name__ == "__main__":
    c_list = selectCoin()

    market_list = [ c[1] for c in c_list ]

    print(market_list)

    wm = WebSocketManager("ticker", market_list)  # 원하는 코인 심볼 지정 (여러개도 가능)
    while(True):  # 20개 메시지를 받아서 출력, 나중에 while(True)
        data = wm.get()
        print(data)  # 실시간 체결 데이터 딕셔너리로 수신됨
        print(f"심볼 : {data['content']['symbol']}")
        print(f"현재가 : {data['content']['closePrice']}")
        print(f"거래량 : {data['content']['volume']}")
    # wm.terminate()