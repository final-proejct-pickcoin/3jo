# api/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.redis import get_redis
import asyncio
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, room_id, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id, websocket: WebSocket):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def send_room(self, room_id, message: str):
        for ws in self.active_connections.get(room_id, []):
            await ws.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str):
    
    await manager.connect(room_id, websocket)
    # print("웹소켓으로 들어옴", room_id)
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(room_id)

    async def read_from_ws():
        try:
            while True:
                data = await websocket.receive_text()
                # print("[받은 메시지]", data)

                msg_obj = json.loads(data)
                msg_obj["timestamp"] = datetime.utcnow().isoformat() + "Z"
                save_redis = json.dumps(msg_obj, ensure_ascii=False)

                # Redis 리스트 저장
                await redis.rpush(f"chat:room:{room_id}", save_redis)
                # Redis pub/sub으로 브로드캐스트
                await redis.publish(room_id, save_redis)

        except WebSocketDisconnect:
            manager.disconnect(room_id, websocket)
            await pubsub.unsubscribe(room_id)
        except Exception as e:
            print("read_from_ws 오류:", e)

    async def read_from_redis():
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode()
                    # print("[브로드캐스트]", room_id, data)
                    await manager.send_room(room_id, data)
                await asyncio.sleep(0.01)  # CPU 과부하 방지
        except Exception as e:
            print("read_from_redis 오류:", e)

    # 둘 다 병렬 실행
    ws_task = asyncio.create_task(read_from_ws())
    redis_task = asyncio.create_task(read_from_redis())
    done, pending = await asyncio.wait(
        [ws_task, redis_task],
        return_when=asyncio.FIRST_COMPLETED
    )
    for task in pending:
        task.cancel()

# 전체 대화목록 가져오기
@router.get("/chat/history/{room_id}")
async def get_chat_history(room_id: str):
    redis = await get_redis()
    raw_message = await redis.lrange(f"chat:room:{room_id}", 0, -1)
    messages = [json.loads(m) for m in raw_message]
    return {"room_id": room_id, "messages": messages}
