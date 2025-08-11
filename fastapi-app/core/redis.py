import redis.asyncio as redis

async def get_redis():
    client = redis.Redis(host="redis", port=6379, decode_responses=True)
    return client
