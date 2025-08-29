import pymysql
from enums.Role import Role
from fastapi import APIRouter, Form, HTTPException, status, Depends, Request
import os
from dotenv import load_dotenv

router = APIRouter(prefix="/admin")

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

mysql_url = os.getenv("MYSQL_HOST")

@router.post("/inq-status")
def inq_status(inquiry_id: int, status: str):

    conn = pymysql.connect(host=mysql_url, user="pickcoin", password="Admin1234!", port=3306, database="coindb", charset="utf8mb4")
    try:
        with conn.cursor() as cursor:
            data = (status, inquiry_id)
            sql = """
                    UPDATE inquiry
                    SET status = %s
                    WHERE inquiry_id = %s
                    """
            cursor.execute(sql, data)

            conn.commit()
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        conn.close()