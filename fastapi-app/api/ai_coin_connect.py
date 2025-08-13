
import redis
import os

# .env 파일은 main.py에서 이미 로드되므로 여기서는 바로 os.getenv를 사용합니다.
# Docker 환경에서는 'redis', 로컬 환경에서는 'localhost'를 사용하도록 할 수 있습니다.
REDIS_HOST = os.getenv("REDIS_HOST", "redis")

# Redis 클라이언트 인스턴스를 생성합니다.
redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)

print("✅ Redis client initialized.")