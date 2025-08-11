# api/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from core.redis import get_redis
import asyncio
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, room_id, websocket):
        await websocket.accept()
        self.active_connections.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id, websocket):
        self.active_connections[room_id].remove(websocket)
        if not self.active_connections[room_id]:
            del self.active_connections[room_id]

    async def send_room(self, room_id, message):
        for ws in self.active_connections.get(room_id, []):
            await ws.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str):
    
    await manager.connect(room_id, websocket)
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(room_id)

    async def read_from_ws():        
        try:
            while True:
                data = await websocket.receive_text()
                msg_obj = json.loads(data)
                msg_obj["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                # 문자열 변환
                save_redis = json.dumps(msg_obj)

                # Redis에 퍼블리시(지금은 필요 없는듯.)
                await redis.publish(room_id, data)
                # Redis 리스트에 메시지 저장 (예: chat:room:<room_id>)
                await redis.rpush(f"chat:room:{room_id}", save_redis)
        except WebSocketDisconnect:
            manager.disconnect(room_id, websocket)
            await pubsub.unsubscribe(room_id)

    async def read_from_redis():        
        try:
            async for msg in pubsub.listen():
                if msg["type"] == "message":
                    # Redis 메시지를 같은 room의 모든 클라이언트에게 전송
                    await manager.send_room(
                    room_id,
                    json.dumps({
                        "sender": "admin",
                        "message": msg["data"].decode() if isinstance(msg["data"], bytes) else msg["data"],
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
                )
        except Exception as e:
            print("Redis 수신 오류", e)

    # 둘 다 동시에 실행
    await asyncio.gather(read_from_ws(), read_from_redis())

# 전체 대화봉록 가져오기
@router.get("/chat/history/{room_id}")
async def get_chat_history(room_id: str):
    redis = await get_redis()

    # redis에서 대화내용(리스트) 전부 가져오기
    raw_message = await redis.lrange(f"chat:room:{room_id}", 0, -1)

    # json 문자열을 딕셔너리로 변환
    messages = [json.loads(m) for m in raw_message]

    return {"room_id": room_id, "messages": messages}