from fastapi import APIRouter, HTTPException
import pymysql
from pymysql.cursors import DictCursor
from pydantic import BaseModel
from typing import List



router = APIRouter()

class User(BaseModel):
    user_id: int
    name: str
    email: str
    create_at: str
    amount: float
    trade_count: int

host = "34.64.105.135"

@router.get("/admin/getuser")
def getuser():

    try:
        conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
        with conn.cursor() as cursor:
            # 1. 유저정보 가져오기
            userSQL = """SELECT
                        u.user_id,
                        u.name,
                        u.email,
                        u.created_at,
                        u.is_verified,
                        u.role,
                        w.amount
                        FROM users u
                        LEFT JOIN wallet w 
                            ON u.user_id = w.user_id
                        LEFT JOIN asset a
                            ON w.asset_id = a.asset_id                           
                        """
            cursor.execute(userSQL)
            users = cursor.fetchall()

            print(users)
    except Exception as e:
        print("Error in /admin/getuser:", e)  # 콘솔에 예외 출력
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


    return users
