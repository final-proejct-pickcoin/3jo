import asyncio
import base64
import json
import os

from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech

import uvicorn
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
### 모듈화 ###
from google.cloud.speech_v1.services import speech
from google.cloud.speech_v1.types import RecognitionConfig, StreamingRecognitionConfig, StreamingRecognizeRequest
import google.generativeai as genai

# .env 파일에서 환경 변수 로드
load_dotenv()

app = FastAPI()

# CORS 설정 (React 클라이언트 주소 허용)
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')


def generate_gemini_response(text: str):
    """Gemini API를 호출하여 응답을 생성하는 동기 함수"""
    try:
        print(f"Calling Gemini API with text: {text}")
        response = gemini_model.generate_content(text)
        print(f"Gemini API Response: {response.text}")
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "죄송합니다, 답변을 생성하는 동안 오류가 발생했습니다."


@router.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")

    # STT 스트리밍 설정을 위한 config
    streaming_config = speech.StreamingRecognitionConfig(
        # type: ignore
        config=speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="ko-KR",
        ),
        interim_results=True,
    )

    # 클라이언트로부터 오디오를 받아 Google STT로 보내는 비동기 제너레이터
    async def audio_generator(ws: WebSocket, audio_queue: asyncio.Queue):
        while True:
            try:
                # 큐에서 오디오 데이터 가져오기
                data = await audio_queue.get()
                if data is None:
                    break
                yield speech.StreamingRecognizeRequest(audio_content=data)
            except asyncio.CancelledError:
                break

    async def listen_for_audio(ws: WebSocket, audio_queue: asyncio.Queue):
        """클라이언트로부터 오디오를 받아 큐에 넣는 코루틴"""
        try:
            while True:
                # 클라이언트로부터 바이너리 오디오 데이터 수신
                audio_data = await ws.receive_bytes()
                await audio_queue.put(audio_data)
        except WebSocketDisconnect:
            print("Client disconnected (listener)")
            await audio_queue.put(None)  # 스트림 종료 신호
        except Exception as e:
            print(f"Error in listener: {e}")
            await audio_queue.put(None)

    async def transcribe_and_respond(ws: WebSocket, audio_queue: asyncio.Queue):
        """STT 결과를 처리하고 Gemini 응답을 생성하는 코루틴"""
        try:
            # 동기 클라이언트 대신 비동기 클라이언트를 생성합니다.
            speech_client = speech.SpeechAsyncClient() # SpeechClient -> SpeechAsyncClient

            requests = audio_generator(ws, audio_queue)

            # STT 스트리밍 시작
            # 비동기 클라이언트의 streaming_recognize는 async for와 완벽하게 호환됩니다.
            stream = speech_client.streaming_recognize(
                config=streaming_config,
                requests=requests
            )

            async for response in stream:
                if not response.results:
                    continue

                result = response.results[0]
                if not result.alternatives:
                    continue

                transcript = result.alternatives[0].transcript

                if result.is_final:
                    print(f"STT Final Transcript: {transcript}")

                    # Gemini API 호출 (동기 함수이므로 스레드에서 실행)
                    bot_response_text = await asyncio.to_thread(generate_gemini_response, transcript)

                    # 최종 응답 클라이언트로 전송
                    response_message = {
                        "type": "botResponse",
                        "userText": transcript,
                        "botResponseText": bot_response_text
                    }
                    await ws.send_text(json.dumps(response_message))
                else:
                    # 중간 결과 클라이언트로 전송
                    response_message = {
                        "type": "transcript",
                        "text": transcript
                    }
                    await ws.send_text(json.dumps(response_message))

        except Exception as e:
            print(f"Error in transcriber: {e}")
            error_message = {
                "type": "error",
                "text": "음성 처리 중 오류가 발생했습니다."
            }
            try:
                await ws.send_text(json.dumps(error_message))
            except Exception:
                pass   # 클라이언트 연결이 이미 끊겼을 수 있음
        finally:
            print("Transcription task finished.")

    # 각 클라이언트 연결마다 독립적인 큐를 생성
    audio_queue = asyncio.Queue()

    # 두 개의 비동기 작업을 동시에 실행
    # listen_task: 클라이언트 오디오 수신 -> 큐에 저장
    # transcribe_task: 큐에서 오디오 읽기 -> STT -> Gemini -> 클라이언트로 응답
    listen_task = asyncio.create_task(listen_for_audio(websocket, audio_queue))
    transcribe_task = asyncio.create_task(transcribe_and_respond(websocket, audio_queue))

    await asyncio.gather(listen_task, transcribe_task)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)