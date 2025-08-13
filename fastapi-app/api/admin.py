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
    is_verified: bool
    trade_count: int

host = "34.47.81.41"

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
                        IFNULL(w.amount, 0) as balance
                        FROM users u
                        LEFT JOIN wallet w 
                            ON u.user_id = w.user_id AND w.asset_id = 1                       
                        """
            cursor.execute(userSQL)
            users = cursor.fetchall()

            reported_sql = """
                            SELECT
                            u.user_id,
                            IFNULL(r.reported_count, 0) AS reported_count
                            FROM users u
                            LEFT JOIN (
                                SELECT reported_id, COUNT(*) AS reported_count
                                FROM report
                                WHERE reported_type = 'user'
                                GROUP BY reported_id
                            ) r ON u.user_id = r.reported_id
                            """
            
            cursor.execute(reported_sql)
            report_counts = cursor.fetchall()

            report_counts_map = {x['user_id']: x['reported_count'] for x in report_counts}
            for user in users:
                user_id = user['user_id']
                user['reported_count'] = report_counts_map.get(user_id, 0)

            tx_sql = """
                        SELECT
                            u.user_id,
                            IFNULL(t.tx_count, 0) AS tx_count
                        FROM users u
                        LEFT JOIN (
                            SELECT
                                o.user_id,
                                COUNT(*) AS tx_count
                            FROM orders o
                            INNER JOIN transaction t
                                ON o.order_id = t.order_id
                            GROUP BY o.user_id
                        ) t ON u.user_id = t.user_id
                    """
            cursor.execute(tx_sql)
            tx_counts = cursor.fetchall()

            tx_counts_map = {t['user_id']: t['tx_count'] for t in tx_counts}
            for user in users:
                user_id = user['user_id']
                user['tx_count'] = tx_counts_map.get(user_id, 0)

            # print(">>>>>>>>>유저쿼리문 결과: ", users)
    except Exception as e:
        print("Error in /admin/getuser:", e)  # 콘솔에 예외 출력
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


    return users


@router.get("/admin/getinq")
def getinq():
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    try:
        with conn.cursor() as cursor:
            sql = """
                    SELECT i.inquiry_id, i.user_id, i.amount, i.category, i.closed_at, i.created_at, i.priority, i.status, u.name, u.email
                    FROM inquiry i
                        LEFT JOIN users u
                        ON i.user_id = u.user_id
                  """

            cursor.execute(sql)
            inquiries = cursor.fetchall()
    except Exception as err:
        print("Error in /admin/getinq:", err)  # 콘솔에 예외 출력
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        
        conn.close()

    return inquiries

@router.get("/admin/user-status")
def userStatus(user_id: int, is_verified: bool):
    
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    try:
        with conn.cursor() as cursor:            
            new_verified = 0 if is_verified == 1 else 1
            data = (new_verified, user_id)
            print("백에서 받은 유저데이터:", data)
            sql = """
                    UPDATE users
                    SET is_verified = %s
                    WHERE user_id = %s
                    """
            cursor.execute(sql, data)
            
            conn.commit()
    except Exception as err:
        print("Error in /admin/user-status:", err)  # 콘솔에 예외 출력
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        conn.close()
    pass