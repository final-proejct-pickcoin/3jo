# voice_router.py - bithumb_api.py 활용하여 중복 제거 및 연동

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
# ✅ bithumb_api.py에서 필요한 함수들 import
from .bithumb_api import get_coin_list as bithumb_get_coin_list, get_korean_name

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

### [개선] 동적 코인 매핑 시스템 - bithumb_api.py 활용 ###

class DynamicCoinMapper:
    def __init__(self):
        self.coin_map = {}  # 한글명 -> 심볼 매핑
        self.symbol_map = {}  # 심볼 -> 정보 매핑
        self.last_update = None
        
        # 📄 업데이트 주기 최적화
        self.cache_duration = timedelta(minutes=30)  # 30분마다 업데이트
        self.price_cache_duration = timedelta(minutes=5)  # 가격 정보는 5분마다
        self.realtime_threshold = timedelta(seconds=30)  # 30초 이내는 실시간으로 간주
        
        # 📊 캐시 계층화
        self.quick_price_cache = {}  # 빠른 가격 캐시 (30초)
        self.last_price_update = {}  # 심볼별 마지막 업데이트 시간
    
    def get_all_supported_coins(self) -> dict:
        """지원하는 모든 코인 목록 반환"""
        return self.symbol_map.copy()
    
    async def update_coin_mapping(self) -> bool:
        """빗썸 API에서 모든 코인 정보를 가져와서 매핑 테이블 업데이트 - bithumb_api 활용"""
        try:
            print("🔄 코인 매핑 정보 업데이트 중... (bithumb_api 활용)")
            
            # ✅ bithumb_api.py 활용
            coin_data = await bithumb_get_coin_list()
            
            if coin_data.get("status") == "success" and coin_data.get("data"):
                coins = coin_data["data"]
                
                new_coin_map = {}
                new_symbol_map = {}
                
                for coin in coins:
                    symbol = coin.get("symbol", "")
                    korean_name = coin.get("korean_name", "")
                    english_name = coin.get("english_name", symbol)
                    
                    if not symbol:
                        continue
                    
                    # 심볼 정보 저장
                    new_symbol_map[symbol] = {
                        "korean_name": korean_name,
                        "english_name": english_name,
                        "symbol": symbol,
                        "market_warning": coin.get("market_warning", "NONE")
                    }
                    
                    # 한글명이 있으면 한글명 매핑 추가
                    if korean_name and korean_name.strip() and korean_name != symbol:
                        new_coin_map[korean_name.lower()] = symbol
                        
                        # 추가 매핑: 일반적인 별명들
                        korean_variants = self._generate_korean_variants(korean_name)
                        for variant in korean_variants:
                            new_coin_map[variant.lower()] = symbol
                    
                    # 영문명 매핑
                    if english_name and english_name != symbol:
                        new_coin_map[english_name.lower()] = symbol
                    
                    # 심볼 자체도 매핑
                    new_coin_map[symbol.lower()] = symbol
                
                # 매핑 테이블 업데이트
                self.coin_map = new_coin_map
                self.symbol_map = new_symbol_map
                self.last_update = datetime.now()
                
                print(f"✅ 코인 매핑 업데이트 완료: {len(new_symbol_map)}개 코인, {len(new_coin_map)}개 매핑")
                return True
            else:
                print("⚠️ bithumb_api에서 유효한 데이터를 받지 못함")
                return False
                
        except Exception as e:
            print(f"⚠️ 코인 매핑 업데이트 실패: {e}")
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
    
    async def update_coin_mapping_smart(self) -> bool:
        """스마트 업데이트 - 필요할 때만 업데이트"""
        now = datetime.now()
        
        # 기본 매핑 정보는 30분마다만 업데이트 (자주 바뀌지 않음)
        if (self.last_update and 
            (now - self.last_update) < self.cache_duration and 
            self.coin_map):
            return True  # 업데이트 불필요
        
        # 기존 업데이트 로직 실행
        return await self.update_coin_mapping()
    
    async def get_symbol_from_text_fast(self, text: str) -> tuple:
        """빠른 심볼 검색 - 캐시 우선 사용"""
        # 스마트 업데이트 (필요할 때만)
        await self.update_coin_mapping_smart()
        
        text_lower = text.lower()
        
        # 기존 검색 로직
        matched_names = []
        for name, symbol in self.coin_map.items():
            if name in text_lower:
                matched_names.append((name, symbol, len(name)))
        
        if matched_names:
            best_match = max(matched_names, key=lambda x: x[2])
            symbol = best_match[1]
            korean_name = self.symbol_map.get(symbol, {}).get("korean_name", symbol)
            return symbol, korean_name
        
        return None, None
    
    async def get_symbol_from_text(self, text: str) -> tuple:
        """텍스트에서 코인 심볼과 한글명을 찾아서 반환"""
        # 매핑이 비어있거나 오래되면 업데이트
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

    def cleanup_cache(self):
        """오래된 캐시 정리"""
        now = datetime.now()
        expired_symbols = []
        
        for symbol, update_time in self.last_price_update.items():
            if (now - update_time) > timedelta(minutes=10):  # 10분 지난 캐시 삭제
                expired_symbols.append(symbol)
        
        for symbol in expired_symbols:
            self.quick_price_cache.pop(symbol, None)
            self.last_price_update.pop(symbol, None)

# 📄 백그라운드 업데이트 태스크
class CoinDataManager:
    def __init__(self, coin_mapper: DynamicCoinMapper):
        self.coin_mapper = coin_mapper
        self.is_running = False
        
    async def start_background_updates(self):
        """백그라운드에서 주기적 업데이트"""
        if self.is_running:
            return
            
        self.is_running = True
        print("📄 백그라운드 코인 데이터 업데이트 시작")
        
        while self.is_running:
            try:
                # 30분마다 코인 목록 업데이트
                await self.coin_mapper.update_coin_mapping_smart()
                
                # 5분마다 캐시 정리
                self.coin_mapper.cleanup_cache()
                
                # 30분 대기
                await asyncio.sleep(1800)  # 30분
                
            except Exception as e:
                print(f"⚠️ 백그라운드 업데이트 오류: {e}")
                await asyncio.sleep(300)  # 5분 후 재시도
    
    def stop_background_updates(self):
        """백그라운드 업데이트 중지"""
        self.is_running = False
        print("⏹️ 백그라운드 업데이트 중지")

    def get_all_supported_coins(self) -> dict:
        """지원하는 모든 코인 목록 반환"""
        return self.coin_mapper.get_all_supported_coins()

# 전역 매니저 인스턴스
coin_mapper = DynamicCoinMapper()
data_manager = CoinDataManager(coin_mapper)

# ✅ /api/coins 엔드포인트 제거 - bithumb_api.py에서 처리하도록 함
# 중복된 @router.get("/coins") 제거

# [신규] 빗썸 API 직접 연동 함수들 - bithumb_api.py 활용
async def get_bithumb_coin_list():
    """빗썸에서 활성 코인 목록 조회 - bithumb_api.py 활용"""
    try:
        result = await bithumb_get_coin_list()
        if result.get("status") == "success":
            return result.get("data", [])
        return []
    except Exception as e:
        print(f"⚠️ bithumb_api 호출 실패: {e}")
        return []

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
                
                # Redis에 캐시 저장 (5분)
                try:
                    redis_client.setex(f"ticker:{symbol}_KRW", 300, json.dumps(ticker_data))
                except Exception as cache_error:
                    print(f"⚠️ Redis 캐시 저장 실패: {cache_error}")
                
                return ticker_data
        
    except Exception as e:
        print(f"⚠️ 가격 조회 오류: {e}")
    
    return None

async def get_coin_market_analysis(symbol: str) -> dict:
    """코인 시장 분석 정보 조회"""
    try:
        # 기본 시세 정보
        ticker_data = get_realtime_price(symbol)
        if not ticker_data:
            return None
        
        # 분석 정보 구성
        current_price = float(ticker_data.get("closing_price", 0))
        change_rate = float(ticker_data.get("fluctate_rate_24H", 0))
        change_amount = float(ticker_data.get("fluctate_24H", 0))
        volume = float(ticker_data.get("acc_trade_value_24H", 0))
        
        # 가격 변동 분석
        if change_rate > 10:
            trend = "급등"
        elif change_rate > 5:
            trend = "상승"
        elif change_rate > 0:
            trend = "소폭상승"
        elif change_rate > -5:
            trend = "소폭하락"
        elif change_rate > -10:
            trend = "하락"
        else:
            trend = "급락"
        
        # 거래량 분석
        if volume > 1000000000000:  # 1조원 이상
            volume_status = "매우높음"
        elif volume > 100000000000:  # 1000억원 이상
            volume_status = "높음"
        elif volume > 10000000000:  # 100억원 이상
            volume_status = "보통"
        else:
            volume_status = "낮음"
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "change_rate": change_rate,
            "change_amount": change_amount,
            "volume": volume,
            "trend": trend,
            "volume_status": volume_status
        }
        
    except Exception as e:
        print(f"⚠️ 시장 분석 오류: {e}")
        return None

# [수정] Gemini 응답 생성 함수 - bithumb_api.py 완전 연동
async def generate_and_send_gemini_response(ws: WebSocket, user_text: str):
    if not gemini_model:
        await send_error_message(ws, "Gemini API가 설정되지 않았습니다.")
        return

    final_prompt = user_text
    
    # 1. 사용자의 질문에 가격 관련 키워드가 있는지 확인
    price_keywords = ["가격", "얼마", "시세", "현재가", "값", "가치", "코인", "암호화폐", "가상화폐"]
    has_price_query = any(keyword in user_text for keyword in price_keywords)
    
    # 2. 코인 목록 요청인지 확인
    list_keywords = ["코인", "목록", "리스트", "종류", "뭐있어", "어떤", "추천"]
    has_list_query = any(keyword in user_text for keyword in list_keywords) and any(word in user_text for word in ["뭐", "어떤", "목록", "리스트", "종류"])
    
    if has_list_query and not has_price_query:
        # ✅ 코인 목록 요청 처리 - bithumb_api.py 활용
        try:
            coin_data = await bithumb_get_coin_list()
            if coin_data.get("status") == "success" and coin_data.get("data"):
                top_coins = coin_data["data"][:10]  # 상위 10개
                
                coin_info_text = "현재 거래량이 많은 상위 10개 코인입니다:\n\n"
                for i, coin in enumerate(top_coins, 1):
                    # bithumb_api.py에서 이미 처리된 korean_name 활용
                    korean_name = coin.get("korean_name", coin.get("symbol", ""))
                    price_formatted = f"{coin.get('current_price', 0):,.0f}원"
                    change_formatted = f"{coin.get('change_rate', 0):+.2f}%"
                    
                    display_name = f"{korean_name}({coin['symbol']})" if korean_name != coin['symbol'] else coin['symbol']
                    coin_info_text += f"{i}. {display_name}: {price_formatted} ({change_formatted})\n"
                
                final_prompt = f"""
                다음은 현재 거래소의 실시간 코인 정보입니다:
                
                {coin_info_text}
                
                사용자 질문: "{user_text}"
                
                위 정보를 바탕으로 친절하고 도움이 되는 답변을 해주세요. 
                구체적인 코인에 대해 더 자세히 알고 싶다면 "비트코인 가격 알려줘" 같은 방식으로 질문해달라고 안내해주세요.
                """
            else:
                final_prompt = f"죄송합니다. 현재 코인 목록 정보를 가져올 수 없습니다. 사용자 질문: '{user_text}'"
        except Exception as e:
            print(f"⚠️ 코인 목록 조회 중 오류: {e}")
            final_prompt = f"죄송합니다. 코인 정보를 조회하는 중 오류가 발생했습니다. 사용자 질문: '{user_text}'"
    
    elif has_price_query:
        # ✅ 개별 코인 가격 조회 - DynamicCoinMapper + bithumb_api.py 조합
        found_coin_symbol, found_coin_name = await coin_mapper.get_symbol_from_text_fast(user_text)

        print(f"🔍 동적 매핑 결과: {found_coin_name} ({found_coin_symbol})")
        
        if found_coin_symbol:
            # ✅ bithumb_api.py의 get_korean_name 활용
            korean_name = get_korean_name(found_coin_symbol)
            if not korean_name or korean_name == found_coin_symbol:
                korean_name = found_coin_name or found_coin_symbol
            
            # 상세 시장 분석 정보 조회
            market_analysis = await get_coin_market_analysis(found_coin_symbol)
            
            if market_analysis:
                # 숫자 포맷팅
                price_formatted = f"{market_analysis['current_price']:,.0f}"
                change_formatted = f"{market_analysis['change_rate']:+.2f}%"
                change_amount_formatted = f"{market_analysis['change_amount']:+,.0f}"
                volume_formatted = f"{market_analysis['volume']/100000000:.1f}억원"
                
                final_prompt = f"""
                [실시간 정보]
                - 코인: {korean_name} ({found_coin_symbol})
                - 현재 가격: {price_formatted} 원 (KRW)
                - 24시간 변동률: {change_formatted}
                - 24시간 변동액: {change_amount_formatted} 원
                - 24시간 거래대금: {volume_formatted}
                - 현재 추세: {market_analysis['trend']}
                - 거래량 상태: {market_analysis['volume_status']}
                
                위 최신 실시간 정보를 바탕으로 다음 사용자 질문에 대해 친절하고 정확하게 답변해주세요: "{user_text}"
                
                답변할 때는 구체적인 가격과 변동률을 포함해서 설명해주세요.
                별도의 요구가 없을 시 투자 조언은 하지 말고, 객관적인 시장 정보만 제공해주세요.
                """
                print(f"📊 정보 보강 완료: {found_coin_symbol} 가격은 {price_formatted} 원, 추세: {market_analysis['trend']}")
                
            else:
                final_prompt = f"""
                죄송합니다. {korean_name if korean_name else found_coin_symbol} 코인의 실시간 가격 정보를 현재 조회할 수 없습니다.
                
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
            if supported_coins:
                sample_coins = list(supported_coins.keys())[:20]  # 상위 20개만 표시
                
                final_prompt = f"""
                질문에서 구체적인 코인 이름을 찾을 수 없습니다.
                
                현재 지원하는 주요 코인들 (총 {len(supported_coins)}개):
                {', '.join([f"{info.get('korean_name', symbol)} ({symbol})" 
                           for symbol, info in list(supported_coins.items())[:10]])}
                
                예시: "비트코인 가격 알려줘", "이더리움 얼마야?", "솔라나 시세" 등으로 질문해주세요.
                
                사용자 질문: "{user_text}"
                """
            else:
                final_prompt = f"""
                죄송합니다. 현재 코인 정보를 불러올 수 없습니다.
                
                "비트코인 가격", "이더리움 시세" 등으로 구체적인 코인명을 포함해서 질문해주세요.
                
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
        print(f"⚠️ Gemini 처리 중 오류: {e}")
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
        print(f"⚠️ 음성 인식 오류: {e}")
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

@router.get("/coin-price/{symbol}")
async def get_coin_price_api(symbol: str):
    """특정 코인의 실시간 가격 조회 API"""
    try:
        symbol = symbol.upper()
        market_analysis = await get_coin_market_analysis(symbol)
        
        if market_analysis:
            return {
                "status": "success",
                "data": market_analysis,
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "error",
                "message": f"{symbol} 코인의 정보를 찾을 수 없습니다.",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"가격 조회 중 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@router.get("/top-coins")
async def get_top_coins_api(limit: int = 20):
    """거래량 상위 코인 목록 조회 - bithumb_api.py 활용"""
    try:
        coin_data = await bithumb_get_coin_list()
        
        if coin_data.get("status") == "success" and coin_data.get("data"):
            limited_list = coin_data["data"][:limit]
            
            # 한글명 추가 (get_korean_name 활용)
            enhanced_list = []
            for coin in limited_list:
                korean_name = get_korean_name(coin.get("symbol", ""))
                if not korean_name or korean_name == coin.get("symbol", ""):
                    korean_name = coin.get("korean_name", coin.get("symbol", ""))
                
                enhanced_coin = {
                    **coin,
                    "korean_name": korean_name,
                    "display_name": f"{korean_name}({coin['symbol']})" if korean_name != coin['symbol'] else coin['symbol']
                }
                enhanced_list.append(enhanced_coin)
            
            return {
                "status": "success",
                "data": enhanced_list,
                "total_count": len(enhanced_list),
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "error",
                "message": "빗썸 API에서 데이터를 가져올 수 없습니다.",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"코인 목록 조회 중 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# ✅ 디버깅용 엔드포인트 추가
@router.get("/debug/mapper-status")
async def debug_mapper_status():
    """코인 매퍼 상태 확인용 디버깅 엔드포인트"""
    return {
        "coin_map_size": len(coin_mapper.coin_map),
        "symbol_map_size": len(coin_mapper.symbol_map),
        "last_update": coin_mapper.last_update.isoformat() if coin_mapper.last_update else None,
        "sample_symbols": list(coin_mapper.symbol_map.keys())[:10] if coin_mapper.symbol_map else [],
        "sample_mappings": dict(list(coin_mapper.coin_map.items())[:5]) if coin_mapper.coin_map else {},
        "initialization_needed": len(coin_mapper.symbol_map) == 0
    }

@router.get("/debug/bithumb-test")
async def debug_bithumb_test():
    """bithumb_api.py 연동 테스트"""
    try:
        print("🔬 bithumb_api.py 연동 테스트 시작")
        
        # bithumb_api.py 함수 테스트
        coin_data = await bithumb_get_coin_list()
        
        result = {
            "bithumb_api_status": coin_data.get("status", "unknown"),
            "data_count": len(coin_data.get("data", [])),
            "first_coin": coin_data.get("data", [{}])[0] if coin_data.get("data") else None,
            "korean_name_test": {
                "BTC": get_korean_name("BTC"),
                "ETH": get_korean_name("ETH"), 
                "XRP": get_korean_name("XRP")
            }
        }
        
        print(f"🔬 테스트 결과: {result}")
        return result
        
    except Exception as e:
        print(f"🔬 테스트 실패: {e}")
        return {
            "error": str(e),
            "status": "failed"
        }