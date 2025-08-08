# /api/voice_router.py

import asyncio
import json
import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.cloud.speech_v1.services import speech
from google.cloud.speech_v1.types import RecognitionConfig, StreamingRecognitionConfig, StreamingRecognizeRequest
import google.generativeai as genai

# APIRouter 인스턴스를 생성합니다.
router = APIRouter()

# --- 설정 및 유틸리티 함수 ---

# Gemini API 모델 인스턴스 (main.py에서 configure됨)
# main.py에서 이미 API 키를 설정했으므로, 여기서는 모델만 가져옵니다.
try:
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"경고: Gemini 모델을 초기화할 수 없습니다. main.py에서 API 키 설정이 올바른지 확인하세요. 오류: {e}")
    gemini_model = None


async def send_error_message(ws: WebSocket, text: str):
    """클라이언트에게 에러 메시지를 전송하는 헬퍼 함수"""
    try:
        await ws.send_text(json.dumps({"type": "error", "text": text}))
    except Exception:
        pass

async def generate_and_send_gemini_response(ws: WebSocket, user_text: str):
    """Gemini API를 호출하고 클라이언트에게 응답을 전송하는 함수"""
    if not gemini_model:
        await send_error_message(ws, "Gemini API가 설정되지 않았습니다.")
        return

    try:
        print(f"Calling Gemini API with text: {user_text}")
        response = await asyncio.to_thread(
            gemini_model.generate_content, user_text
        )
        bot_response_text = response.text.strip()
        print(f"Gemini API Response: {bot_response_text}")

        response_message = {
            "type": "botResponse",
            "userText": user_text,
            "botResponseText": bot_response_text
        }
        await ws.send_text(json.dumps(response_message))

    except Exception as e:
        print(f"Error during Gemini processing: {e}")
        await send_error_message(ws, "챗봇 응답 생성 중 오류가 발생했습니다.")


async def transcribe_audio_stream(ws: WebSocket, audio_queue: asyncio.Queue):
    """STT 결과를 처리하고 Gemini 응답을 생성하는 코루틴"""
    async def audio_generator():
        while True:
            try:
                data = await audio_queue.get()
                if data is None: break
                yield StreamingRecognizeRequest(audio_content=data)
            except asyncio.CancelledError:
                break

    try:
        speech_client = speech.SpeechAsyncClient()
        streaming_config = StreamingRecognitionConfig(
            config=RecognitionConfig(
                encoding=RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code="ko-KR",
            ),
            interim_results=True,
        )

        requests = audio_generator()
        stream = speech_client.streaming_recognize(config=streaming_config, requests=requests)

        async for response in stream:
            if not response.results or not response.results[0].alternatives:
                continue

            transcript = response.results[0].alternatives[0].transcript

            if response.results[0].is_final:
                await generate_and_send_gemini_response(ws, transcript)
            else:
                await ws.send_text(json.dumps({"type": "transcript", "text": transcript}))

    except Exception as e:
        print(f"Error in transcriber: {e}")
        await send_error_message(ws, "음성 처리 중 오류가 발생했습니다.")
    finally:
        print("Transcription task finished.")


@router.websocket("/voice-chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Voice chat client connected")

    audio_queue = asyncio.Queue()
    transcribe_task = None

    try:
        while True:
            message = await websocket.receive()
            if "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "text_input":
                    await generate_and_send_gemini_response(websocket, data.get("text"))
            elif "bytes" in message:
                if transcribe_task is None or transcribe_task.done():
                    transcribe_task = asyncio.create_task(
                        transcribe_audio_stream(websocket, audio_queue)
                    )
                await audio_queue.put(message["bytes"])

    except WebSocketDisconnect:
        print("Voice chat client disconnected.")
        if transcribe_task and not transcribe_task.done():
            await audio_queue.put(None)
            transcribe_task.cancel()
    except Exception as e:
        print(f"An unexpected error occurred in voice chat: {e}")
        await send_error_message(websocket, "서버에 예기치 않은 오류가 발생했습니다.")
    finally:
        if transcribe_task and not transcribe_task.done():
            transcribe_task.cancel()
