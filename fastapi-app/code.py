import requests

def getCoinCode():
    url = "https://api.bithumb.com/v1/market/all?isDetails=false"

    headers = {"accept": "application/json"}

    response = requests.get(url, headers=headers)

    res = response.json()

    return res

if __name__ == "__main__":
    print(getCoinCode())