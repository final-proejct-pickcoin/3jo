import requests
from code import getCoinCode
import pymysql

codeList = getCoinCode()

def insertCoin(data):

    conn = pymysql.connect(host='localhost', port=3306, user='pickcoin', password='final3', database="coindb", charset="utf8mb4")

    cursor = conn.cursor()

    sql = '''
        INSERT INTO coin(symbol, coin_name, market) VALUES(%s, %s, %s)
    '''

    cursor.execute(sql, data)

    conn.commit()

    cursor.close()
    conn.close()

# print(type(codeList))
print(codeList)
coinList = []
for coin in codeList:
    url = f"https://api.bithumb.com/v1/ticker?markets={coin['market']}"
    headers = {"accept": "application/json"}
    response = requests.get(url, headers=headers)
    responseJson = response.json()
    # print(coin['korean_name'], coin['market'], coin['market'].replace("KRW-", '')+'-USD' ,responseJson[0]['trade_price'])
    print((coin['korean_name'], coin['market'].replace("KRW-", '')+'-KRW'))
    coinList.append((coin['korean_name'], coin['market'].replace("KRW-", '')+'-KRW'))

    insertCoin(((coin['market'].replace("KRW-", '')+'-KRW').strip(), coin['korean_name'].strip(),  coin['market'].strip()))

    if coin['korean_name'] == '리졸브':
        break


# url = "https://api.bithumb.com/v1/ticker?markets=KRW-BTC"

