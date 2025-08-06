import requests
from code import getCoinCode
import pymysql

codeList = getCoinCode()

def insertCoin(data):

    conn = pymysql.connect(host='34.64.105.135', port=3306, user='pickcoin', password='Admin1234!', database="coindb", charset="utf8mb4")

    cursor = conn.cursor()

    sql = '''
        INSERT INTO asset(symbol, asset_name, market) VALUES(%s, %s, %s)
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
    print(((coin['market'].replace("KRW-", '')+'-KRW').strip(), coin['korean_name'].strip(),  (coin['market'].replace("KRW-", '')+'_KRW').strip()))


    insertCoin(((coin['market'].replace("KRW-", '')+'-KRW').strip(), coin['korean_name'].strip(),  (coin['market'].replace("KRW-", '')+'_KRW').strip()))

    if coin['korean_name'] == '리졸브':
        break


# url = "https://api.bithumb.com/v1/ticker?markets=KRW-BTC"

