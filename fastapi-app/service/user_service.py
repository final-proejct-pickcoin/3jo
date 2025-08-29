from utils.admin_logger import log_admin_action
import pymysql
from dotenv import load_dotenv
import os

load_dotenv() 
mysql_url = os.getenv("MYSQL_HOST")

async def delete_user(email: str, admin_user: str):

    # 디비에서 삭제 로직 수행
    try:
        conn = pymysql.connect(host=mysql_url, port=3306, database='coindb', user='pickcoin', password='final3', charset="utf8mb4")
        with conn.cursor() as cursor:
        
            sql = 'DELETE FROM users WHERE email=%s'
            cursor.execute(sql, (email,))

        conn.commit()
    except Exception as e:
        raise e
    finally:
        cursor.close()
        conn.close()

    # 로그 기록
    log_admin_action(admin_user, "delete_user", f"email={email} 삭제")