import requests
from code import getCoinCode
import pymysql

codeList = getCoinCode()

def insertCoin(data):

<<<<<<< HEAD
    conn = pymysql.connect(host='34.64.105.135', port=3306, user='pickcoin', password='Admin1234!', database="coindb", charset="utf8mb4")
=======
    conn = pymysql.connect(host='localhost', port=3306, user='pickcoin', password='final3', database="coindb", charset="utf8mb4")
>>>>>>> feature_jh

    cursor = conn.cursor()

    sql = '''
<<<<<<< HEAD
        INSERT INTO asset(symbol, asset_name, market) VALUES(%s, %s, %s)
=======
        INSERT INTO coin(symbol, coin_name, market) VALUES(%s, %s, %s)
>>>>>>> feature_jh
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

