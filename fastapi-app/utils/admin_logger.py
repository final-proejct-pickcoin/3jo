import logging
import logstash # python-logstash 설치 필요
import json

logger = logging.getLogger("admin-log")
logger.setLevel(logging.INFO)
# ELK로 TCP 전송 핸들러 설정(아래 host/port는 logstash 컨테이너 기준)
logger.addHandler(logstash.TCPLogstashHandler('logstash', 5044, version=1))

def log_admin_action(user, action, detail):
    log_data = {
        "user": user,
        "action": action,
        "detail": detail,
        "event_type": "admin"
    }
    logger.info(json.dumps(log_data, ensure_ascii=False))
