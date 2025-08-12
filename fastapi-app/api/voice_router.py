# /api/voice_router.py

import asyncio
import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.oauth2 import service_account
from google.cloud.speech_v1.services import speech
from google.cloud.speech_v1.types import RecognitionConfig, StreamingRecognitionConfig, StreamingRecognizeRequest
import google.generativeai as genai

# from main import redis_client

router = APIRouter()

CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
google_credentials = None
if CREDENTIALS_PATH:
    try:
        google_credentials = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
        print("✅ Speech-to-Text 인증 성공!")
    except Exception as e:
        print(f"🚨 인증 파일 오류: {e}")
else:
    print("🚨 GOOGLE_APPLICATION_CREDENTIALS 변수 설정 없음.")

try:
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"🚨 Gemini 모델 초기화 실패: {e}")
    gemini_model = None

# ------------------------------------


# ### ------------------------------------------------------####
# # [추가] 코인 이름과 심볼을 매핑하는 간단한 딕셔너리
# COIN_MAP = {
#     "비트코인": "BTC_KRW",
#     "이더리움": "ETH_KRW",
#     "리플": "XRP_KRW",
#     "도지": "DOGE_KRW",
#     "도지코인": "DOGE_KRW",
#     "솔라나": "SOL_KRW",
# }

# # [추가] Redis에서 실시간 가격을 가져오는 헬퍼 함수
# def get_realtime_price(symbol: str) -> dict | None:
#     """Redis 캐시에서 코인 시세 정보를 가져옵니다."""
#     try:
#         cached_data = redis_client.get(f"ticker:{symbol}")
#         if cached_data:
#             return json.loads(cached_data)
#     except Exception as e:
#         print(f"Redis 조회 오류: {e}")
#     return None

# async def send_error_message(ws: WebSocket, text: str):
#     try: await ws.send_text(json.dumps({"type": "error", "text": text}))
#     except Exception: pass

# # [수정] Gemini 응답 생성 함수에 실시간 데이터 조회 로직 추가
# async def generate_and_send_gemini_response(ws: WebSocket, user_text: str):
#     if not gemini_model:
#         await send_error_message(ws, "Gemini API가 설정되지 않았습니다.")
#         return

#     final_prompt = user_text
    
#     # 1. 사용자의 질문에 가격 관련 키워드가 있는지 확인
#     price_keywords = ["가격", "얼마", "시세", "현재가"]
#     if any(keyword in user_text for keyword in price_keywords):
        
#         # 2. 질문에서 코인 이름 찾기
#         found_coin_symbol = None
#         for kor_name, symbol in COIN_MAP.items():
#             if kor_name in user_text:
#                 found_coin_symbol = symbol
#                 break
        
#         # 3. 코인 이름을 찾았다면, Redis에서 실시간 가격 조회
#         if found_coin_symbol:
#             ticker_data = get_realtime_price(found_coin_symbol)
#             if ticker_data:
#                 current_price = ticker_data.get("closing_price", "N/A")
                
#                 # 4. Gemini에게 전달할 프롬프트를 실시간 정보와 함께 재구성
#                 final_prompt = f"""
#                 [실시간 정보]
#                 - 코인: {found_coin_symbol.replace('_KRW', '')}
#                 - 현재 가격: {current_price} KRW

#                 위 실시간 정보를 바탕으로 다음 사용자 질문에 대해 친절하게 답변해줘: "{user_text}"
#                 """
#                 print(f"정보 보강 완료: {found_coin_symbol} 가격은 {current_price} KRW")

#     try:
#         print(f"🚀 Calling Gemini API with prompt: {final_prompt}")
#         response = await asyncio.to_thread(gemini_model.generate_content, final_prompt)
#         bot_response_text = response.text.strip()
#         print(f"🤖 Gemini API Response: {bot_response_text}")
#         response_message = {"type": "botResponse", "userText": user_text, "botResponseText": bot_response_text}
#         await ws.send_text(json.dumps(response_message))
#     except Exception as e:
#         print(f"Error during Gemini processing: {e}")
#         await send_error_message(ws, "챗봇 응답 생성 중 오류가 발생했습니다.")


# # --- (이하 transcribe_audio_stream, websocket_endpoint 함수는 이전과 동일) ---




async def send_error_message(ws: WebSocket, text: str):
    try: await ws.send_text(json.dumps({"type": "error", "text": text}))
    except Exception: pass

async def generate_and_send_gemini_response(ws: WebSocket, user_text: str):
    if not gemini_model:
        await send_error_message(ws, "Gemini API가 설정되지 않았습니다.")
        return
    try:
        print(f"🚀 Calling Gemini API with text: {user_text}")
        response = await asyncio.to_thread(gemini_model.generate_content, user_text)
        bot_response_text = response.text.strip()
        print(f"🤖 Gemini API Response: {bot_response_text}")
        response_message = {"type": "botResponse", "userText": user_text, "botResponseText": bot_response_text}
        await ws.send_text(json.dumps(response_message))
    except Exception as e:
        print(f"Error during Gemini processing: {e}")
        await send_error_message(ws, "챗봇 응답 생성 중 오류가 발생했습니다.")

# [구조 변경] 이제 이 함수는 'while True' 없이 한 번의 대화만 처리하고 종료됩니다.
async def transcribe_audio_stream(websocket: WebSocket, audio_queue: asyncio.Queue, stop_event: asyncio.Event):
    if not google_credentials:
        await send_error_message(websocket, "서버에 Google Cloud 인증이 설정되지 않았습니다.")
        return

    speech_client = speech.SpeechAsyncClient(credentials=google_credentials)

    async def audio_generator():
        streaming_config = StreamingRecognitionConfig(
            config=RecognitionConfig(encoding=RecognitionConfig.AudioEncoding.WEBM_OPUS, sample_rate_hertz=48000, language_code="ko-KR"),
            interim_results=True
        )
        yield StreamingRecognizeRequest(streaming_config=streaming_config)
        
        while not stop_event.is_set():
            try:
                data = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                yield StreamingRecognizeRequest(audio_content=data)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

    try:
        requests = audio_generator()
        stream = await speech_client.streaming_recognize(requests=requests)
        async for response in stream:
            if not response.results or not response.results[0].alternatives: continue
            transcript = response.results[0].alternatives[0].transcript
            if not response.results[0].is_final:
                await websocket.send_text(json.dumps({"type": "transcript", "text": transcript}))
            else:
                await generate_and_send_gemini_response(websocket, transcript)
    except Exception as e:
        print(f"Error in transcriber: {e}")
    finally:
        print("✅ Transcription stream finished for one utterance.")

# [구조 변경] 이 함수가 전체 흐름을 제어합니다.
@router.websocket("/voice-chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Voice chat client connected and ready.")

    try:
        # 클라이언트로부터 메시지가 올 때까지 계속 대기
        while True:
            message = await websocket.receive()
            data = json.loads(message.get("text", "{}"))

            if data.get("type") == "text_input":
                await generate_and_send_gemini_response(websocket, data.get("text"))

            # "음성 시작" 신호를 받으면, 새로운 대화 한 턴을 시작
            elif data.get("type") == "start_speech":
                print("🎤... Starting new utterance ...🎤")
                audio_queue = asyncio.Queue()
                stop_event = asyncio.Event()
                
                transcribe_task = asyncio.create_task(
                    transcribe_audio_stream(websocket, audio_queue, stop_event)
                )

                # 음성 데이터 및 종료 신호 수신 루프
                while not stop_event.is_set():
                    message = await websocket.receive()
                    if "bytes" in message:
                        await audio_queue.put(message["bytes"])
                    elif "text" in message:
                        data = json.loads(message["text"])
                        if data.get("type") == "end_of_speech":
                            stop_event.set()
                
                await transcribe_task
                print("--- Conversation turn finished, waiting for next start signal. ---")

    except WebSocketDisconnect:
        print("🔌 Voice chat client disconnected.")
    except Exception as e:
        print(f"An unexpected error occurred in main loop: {e}")