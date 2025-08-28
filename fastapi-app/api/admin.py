from fastapi import APIRouter, HTTPException, Query, Depends, status
import pymysql
from pymysql.cursors import DictCursor
from pydantic import BaseModel
from typing import List
from .elasticsearch import get_user_trend, get_trading_volume_trend, fetch_logs_from_es, fetch_buy_logs_aggregation, get_user_krw, get_withdraws
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
import logging



router = APIRouter()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class User(BaseModel):
    user_id: int
    name: str
    email: str
    create_at: str
    amount: float
    is_verified: bool
    trade_count: int

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
host = "34.47.81.41"

@router.get("/admin/getuser")
def getuser(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100)):
    offset = (page - 1) * limit
    try:
        conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
        with conn.cursor() as cursor:
            # 데이터 총 개수 조회
            count_sql = "SELECT COUNT(*) as total FROM inquiry"
            cursor.execute(count_sql)
            total = cursor.fetchone()['total']
            # 1. 유저정보 가져오기
            userSQL = """
                        SELECT
                            u.user_id,
                            u.name,
                            u.email,
                            u.created_at,
                            u.is_verified,
                            u.role,
                            IFNULL(w.amount, 0) AS balance,
                            IFNULL(r.reported_count, 0) AS reported_count
                        FROM users u
                        LEFT JOIN wallet w
                            ON u.user_id = w.user_id AND w.asset_id = 1
                        LEFT JOIN (
                            SELECT
                                reported_id,
                                COUNT(*) AS reported_count
                            FROM report                            
                            GROUP BY reported_id
                        ) r ON u.user_id = r.reported_id
                        LIMIT %s OFFSET %s;                    
                        """
            cursor.execute(userSQL, (limit, offset))
            users = cursor.fetchall()

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

    return {"total": total, "users": users}


@router.get("/admin/getinq")
def getinq(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100)):
    offset = (page - 1) * limit
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    try:
        with conn.cursor() as cursor:
            # 데이터 총 개수 조회
            count_sql = "SELECT COUNT(*) as total FROM inquiry"
            cursor.execute(count_sql)
            total = cursor.fetchone()['total']

            sql = """
                    SELECT i.inquiry_id, i.user_id, i.amount, i.category, i.closed_at, i.created_at, i.status, u.name, u.email
                    FROM inquiry i
                        LEFT JOIN users u
                        ON i.user_id = u.user_id
                    ORDER BY i.created_at DESC
                    LIMIT %s OFFSET %s;   
                  """

            cursor.execute(sql, (limit, offset))
            inquiries = cursor.fetchall()

            # print(inquiries)
    except Exception as err:
        print("Error in /admin/getinq:", err)  # 콘솔에 예외 출력
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        
        conn.close()

    return {"total": total, "inquiry": inquiries}

@router.get("/admin/user-status")
def userStatus(user_id: int, is_verified: bool):
    
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    try:
        with conn.cursor() as cursor:            
            new_verified = 0 if is_verified == 1 else 1
            data = (new_verified, user_id)
            # print("백에서 받은 유저데이터:", data)
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

@router.get("/admin/info")
def getAdminInfo(token: str = Depends(oauth2_scheme)):

    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    with conn.cursor() as cursor:
        sql = """
                WITH user_counts AS (
                    SELECT
                        COUNT(*) AS total_users,
                        SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS users_this_month,
                        SUM(CASE WHEN created_at <  DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS users_before_this_month
                    FROM users
                    WHERE role = 'user'
                ),
                tx_counts AS (
                    SELECT
                        SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN amount*price ELSE 0 END) AS total_tx,
                        SUM(CASE WHEN created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN amount*price ELSE 0 END) AS tx_this_month,
                        SUM(CASE WHEN created_at <  DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN amount*price ELSE 0 END) AS tx_before_this_month,
                        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount*price ELSE 0 END) AS today_tx,
                        SUM(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN amount*price ELSE 0 END) AS yesterday_tx
                    FROM transaction
                )
                SELECT
                    u.total_users,
                    (u.users_this_month / NULLIF(u.users_before_this_month, 0)) * 100 AS user_growth_rate,
                    t.total_tx,
                    (t.tx_this_month / NULLIF(t.tx_before_this_month, 0)) * 100 AS tx_growth_rate,
                    t.today_tx,
                    t.yesterday_tx
                FROM user_counts u, tx_counts t;
                """
        cursor.execute(sql)
        result = cursor.fetchone()
        conn.close()
        # print(result)
    
    return result

@router.get("/admin/gettradeamount")
def get_trade_amount():
    conn = pymysql.connect(host=host, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4", cursorclass=DictCursor)
    with conn.cursor() as cursor:
        query = """
        SELECT
        SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN price * amount ELSE 0 END) AS yesterday,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN price * amount ELSE 0 END) AS today,
        SUM(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN price * amount ELSE 0 END) AS this_week,
        SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN price * amount ELSE 0 END) AS this_month
        FROM transaction;
        """
        cursor.execute(query)
        result = cursor.fetchone()
        return result


# 엘라스틱서치에서 유저 추이 가져오기.
@router.get("/api/stats/users")
def stats_users(interval: str = Query("day", enum=["hour", "day", "week", "month"])):
    """
    총 사용자수 추이: 일별, 주간별, 월간별 (React에서 호출)
    """
    result = get_user_trend(interval)
    return result

# 엘라스틱 서치 거래대금 추이
@router.get("/api/stats/volume")
def stats_volume(interval: str = Query("day", enum=["hour", "day", "week", "month"])):
    try:
        result = get_trading_volume_trend(interval)
        return result
    except Exception as e:
        logger.error(f"Volume stats error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# 전체 로그 가져오기    
@router.get("/logs")
def get_logs():
    try:
        result = fetch_logs_from_es()
        return result
    except Exception as e:
        logger.error(f"logs error: {e}")
        raise HTTPException(status_code=500, detail="get logs error")
    
# 매수 로그 가져오기
@router.get("/buy-logs")
def get_buy_logs():
    try:
        result = fetch_buy_logs_aggregation()
        return result
    except Exception as e:
        logger.error(f"buy-logs error: {e}")
        raise HTTPException(status_code=500, detail="get buy-logs error")
    
# 입출금 로그 가져오기
@router.get("/users/{user_id}/transactions")
def get_deposit_logs(user_id: int):
    try:
        result = get_user_krw(user_id)
        return result
    except Exception as e:
        logger.error(f"krw-logs error: {e}")
        raise HTTPException(status_code=500, detail="get krw-logs error")
    
# 출금신청 로그
@router.get("/withdraws")
def get_withdraws_logs():
    try:
        result = get_withdraws()
        return result
    except Exception as e:
        logger.error(f"withdraw-logs error: {e}")
        raise HTTPException(status_code=500, detail="get withdraw-logs error")