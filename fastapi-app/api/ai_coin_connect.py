import redis
import os
import time

# .env 파일은 main.py에서 이미 로드되므로 여기서는 바로 os.getenv를 사용합니다.
# Docker 환경에서는 'redis', 로컬 환경에서는 'localhost'를 사용하도록 할 수 있습니다.
REDIS_HOST = os.getenv("REDIS_HOST", "redis")

# Redis 클라이언트 인스턴스를 생성합니다.
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=6379, db=0, decode_responses=True)
    
    # Redis 연결 테스트
    redis_client.ping()
    print(f"✅ Redis client initialized and connected to {REDIS_HOST}:6379")
    
    # 연결 상태 확인을 위한 추가 정보
    info = redis_client.info()
    print(f"📊 Redis info: version={info.get('redis_version', 'unknown')}, "
          f"memory={info.get('used_memory_human', 'unknown')}")
    
except redis.ConnectionError as e:
    print(f"❌ Redis 연결 실패: {e}")
    print(f"🔧 시도한 호스트: {REDIS_HOST}:6379")
    
    # 연결 실패 시 더미 클라이언트 생성 (앱이 크래시되지 않도록)
    class DummyRedisClient:
        def get(self, key):
            return None
        def set(self, key, value):
            return True
        def setex(self, key, time, value):
            return True
        def ping(self):
            return False
        def keys(self, pattern):
            return []
    
    redis_client = DummyRedisClient()
    print("⚠️ 더미 Redis 클라이언트를 사용합니다. 실제 캐싱은 작동하지 않습니다.")
    
except Exception as e:
    print(f"❌ Redis 초기화 중 예상치 못한 오류: {e}")
    
    # 더미 클라이언트 생성
    class DummyRedisClient:
        def get(self, key):
            return None
        def set(self, key, value):
            return True
        def setex(self, key, time, value):
            return True
        def ping(self):
            return False
        def keys(self, pattern):
            return []
    
    redis_client = DummyRedisClient()
    print("⚠️ 더미 Redis 클라이언트를 사용합니다.")

# 연결 상태 확인 함수
def check_redis_connection():
    """Redis 연결 상태를 확인하는 함수"""
    try:
        redis_client.ping()
        return True
    except:
        return False

# 주기적으로 연결 상태 확인 (선택사항)
def periodic_health_check():
    """주기적으로 Redis 상태를 확인"""
    try:
        if check_redis_connection():
            print("💚 Redis 연결 상태 양호")
        else:
            print("💔 Redis 연결 끊어짐")
    except Exception as e:
        print(f"🔧 Redis 상태 확인 중 오류: {e}")

# 초기 상태 체크
if check_redis_connection():
    print("🎯 Redis 초기 연결 확인 완료")
else:
    print("⚠️ Redis 초기 연결 실패 - 더미 모드로 동작")