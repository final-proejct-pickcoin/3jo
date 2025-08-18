# voice_router.py - 동적 코인 매핑 개선 버전

import asyncio
import json
import os
import requests
import aiohttp
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.oauth2 import service_account
from google.cloud.speech_v1.services import speech
from google.cloud.speech_v1.types import RecognitionConfig, StreamingRecognitionConfig, StreamingRecognizeRequest
import google.generativeai as genai
from datetime import datetime, timedelta

from .ai_coin_connect import redis_client

router = APIRouter()

# 기존 Google Cloud 및 Gemini 설정은 그대로 유지
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

### [개선] 동적 코인 매핑 시스템 ###

class DynamicCoinMapper:
    def __init__(self):
        self.coin_map = {}  # 한글명 -> 심볼 매핑
        self.symbol_map = {}  # 심볼 -> 정보 매핑
        self.last_update = None
        self.cache_duration = timedelta(hours=1)  # 1시간마다 업데이트
    
    async def update_coin_mapping(self) -> bool:
        """빗썸 API에서 모든 코인 정보를 가져와서 매핑 테이블 업데이트"""
        try:
            print("🔄 코인 매핑 정보 업데이트 중...")
            
            # 1. 마켓 코드 API로 한글명 정보 가져오기
            async with aiohttp.ClientSession() as session:
                # 마켓 정보와 시세 정보 동시 요청
                market_task = session.get("https://api.bithumb.com/v1/market/all")
                ticker_task = session.get("https://api.bithumb.com/public/ticker/ALL_KRW")
                
                market_response, ticker_response = await asyncio.gather(
                    market_task, ticker_task, return_exceptions=True
                )
                
                # 마켓 정보 처리
                market_data = []
                if not isinstance(market_response, Exception) and market_response.status == 200:
                    market_data = await market_response.json()
                
                # 시세 정보 처리  
                ticker_data = {}
                if not isinstance(ticker_response, Exception) and ticker_response.status == 200:
                    ticker_response_data = await ticker_response.json()
                    if ticker_response_data.get("status") == "0000":
                        ticker_data = ticker_response_data.get("data", {})
            
            # 2. 마켓 정보로 한글명 매핑 생성
            market_info_map = {}
            if isinstance(market_data, list):
                for market in market_data:
                    if market.get("market", "").endswith("_KRW"):
                        symbol = market["market"].replace("_KRW", "")
                        korean_name = market.get("korean_name", "")
                        english_name = market.get("english_name", symbol)
                        
                        market_info_map[symbol] = {
                            "korean_name": korean_name,
                            "english_name": english_name,
                            "market_warning": market.get("market_warning", "NONE")
                        }
            
            # 3. 활성 거래 코인만 필터링하고 매핑 테이블 구성
            new_coin_map = {}
            new_symbol_map = {}
            
            for symbol, ticker_info in ticker_data.items():
                if symbol == "date":
                    continue
                    
                try:
                    # 거래량이 있는 활성 코인만 포함
                    trade_value = float(ticker_info.get("acc_trade_value_24H", 0))
                    if trade_value <= 100000:  # 최소 거래대금 10만원 이상
                        continue
                    
                    market_info = market_info_map.get(symbol, {})
                    korean_name = market_info.get("korean_name", "")
                    english_name = market_info.get("english_name", symbol)
                    
                    # 심볼 정보 저장
                    new_symbol_map[symbol] = {
                        "korean_name": korean_name,
                        "english_name": english_name,
                        "symbol": symbol,
                        "market_warning": market_info.get("market_warning", "NONE")
                    }
                    
                    # 한글명이 있으면 한글명 매핑 추가
                    if korean_name and korean_name.strip():
                        new_coin_map[korean_name.lower()] = symbol
                        
                        # 추가 매핑: 일반적인 별명들
                        korean_variants = self._generate_korean_variants(korean_name)
                        for variant in korean_variants:
                            new_coin_map[variant.lower()] = symbol
                    
                    # 영문명 매핑
                    if english_name and english_name != symbol:
                        new_coin_map[english_name.lower()] = symbol
                    
                    # 심볼 자체도 매핑 (대소문자 무관)
                    new_coin_map[symbol.lower()] = symbol
                    
                except (ValueError, TypeError) as e:
                    print(f"⚠️ {symbol} 데이터 처리 오류: {e}")
                    continue
            
            # 4. 매핑 테이블 업데이트
            self.coin_map = new_coin_map
            self.symbol_map = new_symbol_map
            self.last_update = datetime.now()
            
            print(f"✅ 코인 매핑 업데이트 완료: {len(new_symbol_map)}개 코인, {len(new_coin_map)}개 매핑")
            print(f"📋 상위 10개 코인: {list(new_symbol_map.keys())[:10]}")
            
            return True
            
        except Exception as e:
            print(f"❌ 코인 매핑 업데이트 실패: {e}")
            return False
    
    def _generate_korean_variants(self, korean_name: str) -> list:
        """한글 코인명의 일반적인 변형들을 생성"""
        variants = []
        
        # 일반적인 별명 매핑
        nickname_map = {
            "비트코인": ["비트", "BTC"],
            "이더리움": ["이더", "ETH"], 
            "리플": ["XRP"],
            "도지코인": ["도지", "DOGE"],
            "라이트코인": ["라이트", "LTC"],
            "비트코인캐시": ["비캐", "BCH"],
            "체인링크": ["링크", "LINK"],
            "스텔라루멘": ["스텔라", "XLM"],
            "에이다": ["카르다노", "ADA"],
            "폴카닷": ["닷", "DOT"],
            "솔라나": ["솔", "SOL"]
        }
        
        if korean_name in nickname_map:
            variants.extend(nickname_map[korean_name])
        
        return variants
    
    async def get_symbol_from_text(self, text: str) -> tuple:
        """텍스트에서 코인 심볼과 한글명을 찾아서 반환"""
        # 매핑이 비어있거나 오래됐으면 업데이트
        if (not self.coin_map or 
            not self.last_update or 
            datetime.now() - self.last_update > self.cache_duration):
            await self.update_coin_mapping()
        
        text_lower = text.lower()
        
        # 가장 긴 매치를 우선으로 찾기 (예: "비트코인캐시" vs "비트")
        matched_names = []
        for name, symbol in self.coin_map.items():
            if name in text_lower:
                matched_names.append((name, symbol, len(name)))
        
        if matched_names:
            # 가장 긴 매치를 선택
            best_match = max(matched_names, key=lambda x: x[2])
            symbol = best_match[1]
            korean_name = self.symbol_map.get(symbol, {}).get("korean_name", symbol)
            return symbol, korean_name
        
        return None, None
    
    def get_all_supported_coins(self) -> dict:
        """지원하는 모든 코인 목록 반환"""
        return self.symbol_map.copy()

# 전역 매퍼 인스턴스 생성
coin_mapper = DynamicCoinMapper()

# 기존 get_realtime_price 함수는 그대로 유지
def get_realtime_price(symbol: str) -> dict | None:
    """Redis 캐시에서 코인 시세 정보를 가져오고, 실패 시 직접 API 호출"""
    try:
        # 1. Redis 캐시에서 먼저 조회
        cached_data = redis_client.get(f"ticker:{symbol}_KRW")
        if cached_data:
            data = json.loads(cached_data)
            
            # 가격 필드 확인
            current_price = None
            websocket_price_fields = ['closePrice', 'openPrice', 'highPrice', 'lowPrice']
            rest_api_price_fields = ['closing_price', 'opening_price', 'high_price', 'low_price']
            other_price_fields = ['close', 'price', 'current_price', 'last_price']
            
            all_price_fields = websocket_price_fields + rest_api_price_fields + other_price_fields
            
            for field in all_price_fields:
                if field in data and data[field] not in [None, 'N/A', '', 0]:
                    current_price = data[field]
                    break
            
            if current_price and current_price != "N/A":
                return data
        
        # 2. Redis에 없으면 빗썸 REST API 직접 호출
        url = f"https://api.bithumb.com/public/ticker/{symbol}_KRW"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            api_data = response.json()
            if api_data.get("status") == "0000" and api_data.get("data"):
                ticker_data = api_data["data"]
                
                # Redis에 캐시 저장
                try:
                    redis_client.setex(f"ticker:{symbol}_KRW", 300, json.dumps(ticker_data))
                except Exception as cache_error:
                    print(f"⚠️ Redis 캐시 저장 실패: {cache_error}")
                
                return ticker_data
        
    except Exception as e:
        print(f"❌ 가격 조회 오류: {e}")
    
    return None

# [수정] Gemini 응답 생성 함수 - 동적 매핑 적용
async def generate_and_send_gemini_response(ws: WebSocket, user_text: str):
    if not gemini_model:
        await send_error_message(ws, "Gemini API가 설정되지 않았습니다.")
        return

    final_prompt = user_text
    
    # 1. 사용자의 질문에 가격 관련 키워드가 있는지 확인
    price_keywords = ["가격", "얼마", "시세", "현재가", "값", "가치", "코인"]
    has_price_query = any(keyword in user_text for keyword in price_keywords)
    
    if has_price_query:
        # 2. 동적 매핑으로 코인 찾기
        found_coin_symbol, found_coin_name = await coin_mapper.get_symbol_from_text(user_text)
        
        print(f"🔍 동적 매핑 결과: {found_coin_name} ({found_coin_symbol})")
        
        # 3. 코인을 찾았다면 실시간 가격 조회
        if found_coin_symbol:
            ticker_data = get_realtime_price(found_coin_symbol)
            if ticker_data:
                # 가격 정보 추출
                current_price = (
                    ticker_data.get("closing_price") or 
                    ticker_data.get("closePrice") or 
                    ticker_data.get("close") or
                    ticker_data.get("price") or
                    "N/A"
                )
                
                change_rate = (
                    ticker_data.get("fluctate_rate_24H") or 
                    ticker_data.get("chgRate") or 
                    "0"
                )
                
                change_amount = (
                    ticker_data.get("fluctate_24H") or 
                    ticker_data.get("chgAmt") or 
                    "0"
                )
                
                # 숫자 형식 정리
                try:
                    price_formatted = f"{float(current_price):,.0f}" if current_price != "N/A" else "N/A"
                    change_formatted = f"{float(change_rate):+.2f}%" if change_rate else "0%"
                except (ValueError, TypeError):
                    price_formatted = current_price
                    change_formatted = "0%"
                
                # 4. 실시간 정보와 함께 프롬프트 재구성
                final_prompt = f"""
                [실시간 정보 - 빗썸 거래소]
                - 코인: {found_coin_name} ({found_coin_symbol})
                - 현재 가격: {price_formatted} 원 (KRW)
                - 24시간 변동률: {change_formatted}
                - 24시간 변동액: {change_amount} 원
                
                위 최신 실시간 정보를 바탕으로 다음 사용자 질문에 대해 친절하고 정확하게 답변해주세요: "{user_text}"
                
                답변할 때는 구체적인 가격과 변동률을 포함해서 설명해주세요.
                """
                print(f"📊 정보 보강 완료: {found_coin_symbol} 가격은 {price_formatted} 원")
                
            else:
                final_prompt = f"""
                죄송합니다. {found_coin_name if found_coin_name else found_coin_symbol} 코인의 실시간 가격 정보를 현재 조회할 수 없습니다.
                
                다음과 같은 방법으로 가격을 확인해보세요:
                1. 빗썸(bithumb.com) 사이트 직접 방문
                2. 다른 거래소 앱 또는 웹사이트 이용
                3. 잠시 후 다시 질문해보기
                
                현재 서버 상태나 네트워크 문제로 일시적으로 가격 정보를 가져올 수 없는 상태입니다.
                
                사용자 질문: "{user_text}"
                """
        else:
            # 코인을 찾지 못한 경우
            supported_coins = coin_mapper.get_all_supported_coins()
            sample_coins = list(supported_coins.keys())[:20]  # 상위 20개만 표시
            
            final_prompt = f"""
            질문에서 구체적인 코인 이름을 찾을 수 없습니다.
            
            현재 지원하는 주요 코인들 (총 {len(supported_coins)}개):
            {', '.join([f"{info.get('korean_name', symbol)} ({symbol})" 
                       for symbol, info in list(supported_coins.items())[:10]])}
            
            예시: "비트코인 가격 알려줘", "이더리움 얼마야?", "솔라나 시세" 등으로 질문해주세요.
            
            사용자 질문: "{user_text}"
            """

    try:
        print(f"🚀 Gemini API 호출 중...")
        response = await asyncio.to_thread(gemini_model.generate_content, final_prompt)
        bot_response_text = response.text.strip()
        print(f"🤖 Gemini 응답: {bot_response_text[:100]}...")
        
        response_message = {
            "type": "botResponse", 
            "userText": user_text, 
            "botResponseText": bot_response_text
        }
        await ws.send_text(json.dumps(response_message))
        
    except Exception as e:
        print(f"❌ Gemini 처리 중 오류: {e}")
        await send_error_message(ws, "챗봇 응답 생성 중 오류가 발생했습니다.")

async def send_error_message(ws: WebSocket, text: str):
    try: 
        await ws.send_text(json.dumps({"type": "error", "text": text}))
    except Exception: 
        pass

# 기존 transcribe_audio_stream과 websocket_endpoint 함수들은 그대로 유지
async def transcribe_audio_stream(websocket: WebSocket, audio_queue: asyncio.Queue, stop_event: asyncio.Event):
    if not google_credentials:
        await send_error_message(websocket, "서버에 Google Cloud 인증이 설정되지 않았습니다.")
        return

    speech_client = speech.SpeechAsyncClient(credentials=google_credentials)

    async def audio_generator():
        streaming_config = StreamingRecognitionConfig(
            config=RecognitionConfig(
                encoding=RecognitionConfig.AudioEncoding.WEBM_OPUS,
                sample_rate_hertz=48000,
                language_code="ko-KR"
            ),
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
            if not response.results or not response.results[0].alternatives: 
                continue
            transcript = response.results[0].alternatives[0].transcript
            if not response.results[0].is_final:
                await websocket.send_text(json.dumps({"type": "transcript", "text": transcript}))
            else:
                await generate_and_send_gemini_response(websocket, transcript)
    except Exception as e:
        print(f"❌ 음성 인식 오류: {e}")
    finally:
        print("✅ 음성 인식 스트림 종료")

@router.websocket("/voice-chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Voice chat client connected and ready.")

    try:
        while True:
            message = await websocket.receive()
            data = json.loads(message.get("text", "{}"))

            if data.get("type") == "text_input":
                await generate_and_send_gemini_response(websocket, data.get("text"))

            elif data.get("type") == "start_speech":
                print("🎤... Starting new utterance ...🎤")
                audio_queue = asyncio.Queue()
                stop_event = asyncio.Event()
                
                transcribe_task = asyncio.create_task(
                    transcribe_audio_stream(websocket, audio_queue, stop_event)
                )

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

# 추가 API 엔드포인트들
@router.get("/supported-coins")
async def get_supported_coins():
    """현재 지원하는 모든 코인 목록 반환"""
    supported_coins = coin_mapper.get_all_supported_coins()
    return {
        "total_count": len(supported_coins),
        "coins": supported_coins,
        "last_updated": coin_mapper.last_update.isoformat() if coin_mapper.last_update else None
    }

@router.post("/update-coin-mapping")  
async def manual_update_mapping():
    """수동으로 코인 매핑 업데이트"""
    success = await coin_mapper.update_coin_mapping()
    return {
        "success": success,
        "total_coins": len(coin_mapper.symbol_map),
        "total_mappings": len(coin_mapper.coin_map),
        "last_updated": coin_mapper.last_update.isoformat() if coin_mapper.last_update else None
    }