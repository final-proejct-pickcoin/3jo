from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from datetime import datetime, date, timedelta
import os

# ML 내부 모듈들
from ml.data_collector import get_recent_news_data, get_available_coins, get_historical_crypto_prices
from ml.text_processor import process_news_for_sentiment
from ml.coin_model_trainer import load_coin_model, predict_coin_price

# 라우터 생성
router = APIRouter(prefix="/ml", tags=["Machine Learning"])

# --- ML 모델 정의 ---
class CoinPredictor(nn.Module):
    """개별 코인 예측 모델"""
    def __init__(self, input_size, hidden_size=128, num_layers=3, dropout=0.2):
        super(CoinPredictor, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(input_size, hidden_size, num_layers,
                           batch_first=True, dropout=dropout if num_layers > 1 else 0)

        self.fc1 = nn.Linear(hidden_size, hidden_size // 2)
        self.fc2 = nn.Linear(hidden_size // 2, 1)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        batch_size = x.size(0)
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)

        out, (hn, cn) = self.lstm(x, (h0, c0))
        out = out[:, -1, :]

        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)

        return out

# --- Pydantic 모델 정의 ---
class PriceRequest(BaseModel):
    coin_symbol: str
    current_coin_price: Optional[float] = None

class BatchPredictRequest(BaseModel):
    predictions: list[PriceRequest]

# --- 전역 변수들 ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
trained_coins_cache = None

# --- 헬퍼 함수들 ---
def get_trained_coins():
    """학습된 코인 목록을 캐시에서 가져오거나 파일 시스템에서 확인"""
    global trained_coins_cache
    
    if trained_coins_cache is None:
        trained_coins_cache = []
        
        if os.path.exists("ml/models"):
            for item in os.listdir("ml/models"):
                model_dir = os.path.join("ml/models", item)
                if os.path.isdir(model_dir) and os.path.exists(os.path.join(model_dir, "model.pt")):
                    trained_coins_cache.append(item)
        
        print(f"학습된 코인 {len(trained_coins_cache)}개를 찾았습니다.")
    
    return trained_coins_cache

def get_current_price_from_api(coin_symbol: str):
    """빗썸 API에서 현재 가격을 가져옵니다."""
    try:
        import requests
        
        symbol = coin_symbol.upper() + "_KRW"
        url = f"https://api.bithumb.com/public/ticker/{symbol}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] != '0000':
            raise Exception(f"빗썸 API 오류: {data.get('message')}")
        
        return float(data['data']['closing_price'])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"현재 가격 조회 실패: {str(e)}")

# --- 외부에서 사용할 수 있는 ML 함수들 (챗봇 연동용) ---
async def predict_single_coin(coin_symbol: str, current_price: Optional[float] = None):
    """단일 코인 예측 (챗봇이나 다른 서비스에서 호출용)"""
    try:
        coin_symbol = coin_symbol.upper()
        trained_coins = get_trained_coins()
        
        if coin_symbol not in trained_coins:
            return None, f"'{coin_symbol}' 코인은 학습되지 않았습니다."
        
        prediction = predict_coin_price(coin_symbol)
        if prediction is None:
            return None, "예측 실패"
        
        # 현재가 조회 (제공되지 않은 경우)
        if current_price is None:
            try:
                current_price = get_current_price_from_api(coin_symbol)
            except:
                current_price = None
        
        result = {
            "coin_symbol": coin_symbol,
            "current_price": round(current_price, 2) if current_price else None,
            "predicted_next_day_price": round(prediction, 2),
            "price_change_amount": round(prediction - current_price, 2) if current_price else None,
            "price_change_percentage": round((prediction - current_price) / current_price * 100, 2) if current_price else None
        }
        
        return result, None
        
    except Exception as e:
        return None, f"예측 중 오류: {str(e)}"

# 사용처 : get_available_coins_endpoint()
async def get_available_trained_coins():
    """학습된 코인 목록 반환 (다른 서비스에서 사용용)"""
    try:
        all_available_coins = get_available_coins() # 모든 사용 가능한 코인 (API에서 조회 가능한)
        trained_coins = get_trained_coins() # 학습된 코인들
        # 학습된 코인 중에서 현재도 거래 가능한 코인들
        active_trained_coins = [coin for coin in trained_coins if coin in all_available_coins]
        
        return {
            "total_trained": len(trained_coins),
            "active_trained": len(active_trained_coins),
            "trained_coins": sorted(trained_coins),
            "active_coins": sorted(active_trained_coins)
        }
    except Exception as e:
        print(f"코인 목록 조회 오류: {e}")
        return None

# ===== API 엔드포인트들 =====

@router.get("/")
async def ml_root():
    """ML 서비스 소개"""
    trained_coins = get_trained_coins()
    
    return {
        "message": "가상화폐 가격 예측 ML 서비스입니다!",
        "trained_models_count": len(trained_coins),
        "description": "개별 코인별로 학습된 LSTM 모델을 사용한 가격 예측",
        "endpoints": {
            "/ml/predict": "단일 코인 가격 예측 (현재가 자동 조회)",
            "/ml/predict_with_price": "단일 코인 가격 예측 (현재가 직접 입력)",
            "/ml/batch_predict": "여러 코인 일괄 예측",
            "/ml/available_coins": "학습된 코인 목록 조회",
            "/ml/model_info": "모델 정보",
            "/ml/test/{coin_symbol}": "테스트용 예측"
        }
    }

@router.get("/available_coins")
async def get_available_coins_endpoint():
    """학습된 코인 목록을 반환합니다."""
    try:
        result = await get_available_trained_coins()
        if result is None:
            raise HTTPException(status_code=500, detail="코인 목록 조회 실패")
        
        return {
            "status": "success",
            **result,
            "note": "active_coins는 학습된 코인 중 현재 거래 가능한 코인들입니다."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"코인 목록 조회 오류: {str(e)}")

@router.post("/predict")
async def predict_coin_price_auto(request: PriceRequest):
    """단일 코인의 다음날 종가를 예측합니다. (현재가 자동 조회)"""
    coin_symbol = request.coin_symbol.upper()
    
    # 학습된 모델이 있는지 확인
    trained_coins = get_trained_coins()
    if coin_symbol not in trained_coins:
        raise HTTPException(
            status_code=400, 
            detail=f"'{coin_symbol}' 코인은 학습되지 않았습니다. 사용 가능한 코인: {trained_coins[:20]}..."
        )
    
    try:
        print(f"\n[ML Predict Auto] {coin_symbol} 예측 시작")
        
        # ML 함수 호출
        prediction = predict_coin_price(coin_symbol)
        
        if prediction is None:
            raise HTTPException(status_code=500, detail="예측 실패")
        
        # 현재가 조회 (참고용)
        try:
            current_price = get_current_price_from_api(coin_symbol)
            price_change_amount = prediction - current_price
            price_change_percentage = (price_change_amount / current_price) * 100
        except:
            current_price = None
            price_change_amount = None
            price_change_percentage = None
        
        return {
            "status": "success",
            "coin_symbol": coin_symbol,
            "current_price": round(current_price, 2) if current_price else None,
            "predicted_next_day_price": round(prediction, 2),
            "price_change_amount": round(price_change_amount, 2) if price_change_amount else None,
            "price_change_percentage": round(price_change_percentage, 2) if price_change_percentage else None,
            "model_info": {
                "type": "individual_coin_model",
                "model_path": f"ml/models/{coin_symbol}"
            }
        }
        
    except Exception as e:
        print(f"❌ {coin_symbol} 예측 오류: {e}")
        raise HTTPException(status_code=500, detail=f"예측 중 오류가 발생했습니다: {str(e)}")

@router.post("/predict_with_price")
async def predict_coin_price_manual(request: PriceRequest):
    """단일 코인의 다음날 종가를 예측합니다. (현재가 직접 입력)"""
    coin_symbol = request.coin_symbol.upper()
    
    if request.current_coin_price is None:
        raise HTTPException(status_code=400, detail="current_coin_price가 필요합니다.")
    
    current_price = request.current_coin_price
    
    # 학습된 모델이 있는지 확인
    trained_coins = get_trained_coins()
    if coin_symbol not in trained_coins:
        raise HTTPException(
            status_code=400, 
            detail=f"'{coin_symbol}' 코인은 학습되지 않았습니다. 사용 가능한 코인: {trained_coins[:20]}..."
        )
    
    try:
        print(f"\n[ML Predict Manual] {coin_symbol}: {current_price:,.2f}")
        
        prediction = predict_coin_price(coin_symbol) # coin_model_trainer의 predict_coin_price 함수 사용
        
        if prediction is None:
            raise HTTPException(status_code=500, detail="예측 실패")
        
        price_change_amount = prediction - current_price
        price_change_percentage = (price_change_amount / current_price) * 100
        
        return {
            "status": "success",
            "coin_symbol": coin_symbol,
            "current_price": round(current_price, 2),
            "predicted_next_day_price": round(prediction, 2),
            "price_change_amount": round(price_change_amount, 2),
            "price_change_percentage": round(price_change_percentage, 2),
            "model_info": {
                "type": "individual_coin_model",
                "model_path": f"ml/models/{coin_symbol}"
            }
        }
        
    except Exception as e:
        print(f"❌ {coin_symbol} 예측 오류: {e}")
        raise HTTPException(status_code=500, detail=f"예측 중 오류가 발생했습니다: {str(e)}")

@router.post("/batch_predict")
async def batch_predict_coins(request: BatchPredictRequest):
    """여러 코인에 대한 일괄 예측을 수행합니다."""
    
    if len(request.predictions) > 20:
        raise HTTPException(status_code=400, detail="한 번에 최대 20개 코인까지만 예측 가능합니다.")
    
    results = []
    errors = []
    
    for coin_request in request.predictions:
        try:
            # 현재가가 제공되었는지 확인하고 적절한 함수 호출
            if coin_request.current_coin_price is not None:
                prediction = await predict_coin_price_manual(coin_request)
            else:
                prediction = await predict_coin_price_auto(coin_request)
            results.append(prediction)
            
        except HTTPException as e:
            errors.append({
                "coin_symbol": coin_request.coin_symbol,
                "error": e.detail
            })
        except Exception as e:
            errors.append({
                "coin_symbol": coin_request.coin_symbol,
                "error": str(e)
            })
    
    return {
        "status": "completed",
        "total_requested": len(request.predictions),
        "successful_predictions": len(results),
        "failed_predictions": len(errors),
        "results": results,
        "errors": errors
    }

@router.get("/model_info")
async def get_model_info():
    """모델 정보를 반환합니다."""
    trained_coins = get_trained_coins()
    
    return {
        "model_type": "Individual Coin Models",
        "architecture": "LSTM-based CoinPredictor for each coin",
        "trained_coins_count": len(trained_coins),
        "trained_coins": trained_coins,
        "device": str(device),
        "model_storage": "ml/models/{coin_symbol}/ 폴더 구조",
        "features_used": [
            "close", "daily_sentiment_avg", "price_change_rate",
            "log_volume", "ma_5", "ma_20", "bb_position", "rsi"
        ],
        "sequence_length": 15
    }

@router.get("/test/{coin_symbol}")
async def test_prediction(coin_symbol: str):
    """개발/테스트용: 특정 코인의 현재 시세를 가져와서 예측을 수행합니다."""
    try:
        coin_symbol = coin_symbol.upper()
        
        # 현재 가격 조회
        current_price = get_current_price_from_api(coin_symbol)
        
        # 예측 수행 (자동 예측 사용)
        request_data = PriceRequest(coin_symbol=coin_symbol)
        prediction = await predict_coin_price_auto(request_data)
        
        return {
            "test_mode": True,
            "real_time_data": {
                "source": "Bithumb API",
                "current_price": current_price,
                "timestamp": datetime.now().isoformat()
            },
            "prediction": prediction
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테스트 예측 오류: {str(e)}")

@router.get("/test_news")
async def test_news_data():
    """뉴스 데이터 연결 테스트"""
    try:
        news_df = get_recent_news_data(days=1)
        sentiment_df = process_news_for_sentiment(news_df)
        
        return {
            "status": "success",
            "news_count": len(news_df),
            "sentiment_avg": sentiment_df['sentiment_score'].mean() if len(sentiment_df) > 0 else 0,
            "sample_news": news_df.head(3).to_dict('records') if len(news_df) > 0 else [],
            "note": "DB에서 실제 뉴스 데이터를 가져왔습니다."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "note": "뉴스 DB 연결 또는 처리 중 오류 발생"
        }

# --- 고급 ML 기능들 ---
@router.get("/models/status")
async def get_models_status():
    """모든 학습된 모델의 상태 확인"""
    try:
        trained_coins = get_trained_coins()
        models_status = []
        
        for coin in trained_coins:
            model_dir = f"ml/models/{coin}"
            try:
                # 모델 파일들 존재 확인
                model_exists = os.path.exists(f"{model_dir}/model.pt")
                scaler_features_exists = os.path.exists(f"{model_dir}/scaler_features.joblib")
                scaler_target_exists = os.path.exists(f"{model_dir}/scaler_target.joblib")
                
                # 모델 파일 크기
                model_size = os.path.getsize(f"{model_dir}/model.pt") if model_exists else 0
                
                models_status.append({
                    "coin": coin,
                    "model_exists": model_exists,
                    "scalers_exist": scaler_features_exists and scaler_target_exists,
                    "model_size_kb": round(model_size / 1024, 2),
                    "status": "ready" if all([model_exists, scaler_features_exists, scaler_target_exists]) else "incomplete"
                })
                
            except Exception as e:
                models_status.append({
                    "coin": coin,
                    "status": "error",
                    "error": str(e)
                })
        
        ready_models = [m for m in models_status if m.get("status") == "ready"]
        
        return {
            "total_models": len(models_status),
            "ready_models": len(ready_models),
            "models_detail": models_status,
            "summary": {
                "ready": len(ready_models),
                "incomplete": len([m for m in models_status if m.get("status") == "incomplete"]),
                "error": len([m for m in models_status if m.get("status") == "error"])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 상태 확인 오류: {str(e)}")

@router.post("/predictions/bulk")
async def bulk_predictions_for_all_coins():
    """학습된 모든 코인에 대해 일괄 예측 수행"""
    try:
        trained_coins = get_trained_coins()
        
        if not trained_coins:
            raise HTTPException(status_code=404, detail="학습된 모델이 없습니다.")
        
        # 최대 10개로 제한 (서버 부하 방지)
        coins_to_predict = trained_coins[:10]
        
        predictions = []
        errors = []
        
        for coin in coins_to_predict:
            try:
                result, error = await predict_single_coin(coin)
                if result:
                    predictions.append(result)
                else:
                    errors.append({"coin": coin, "error": error})
                    
            except Exception as e:
                errors.append({"coin": coin, "error": str(e)})
        
        return {
            "status": "completed",
            "total_attempted": len(coins_to_predict),
            "successful_predictions": len(predictions),
            "failed_predictions": len(errors),
            "predictions": predictions,
            "errors": errors,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일괄 예측 오류: {str(e)}")

@router.get("/sentiment/analysis")
async def get_market_sentiment(days: int = 3):
    """시장 전반 감성분석 (뉴스 기반)"""
    try:
        if days > 7:
            raise HTTPException(status_code=400, detail="최대 7일까지만 조회 가능합니다.")
        
        news_df = get_recent_news_data(days=days)
        if len(news_df) == 0:
            return {
                "status": "no_data",
                "message": f"최근 {days}일간 뉴스 데이터가 없습니다."
            }
        
        sentiment_df = process_news_for_sentiment(news_df)
        
        # 감성 통계 계산
        avg_sentiment = sentiment_df['sentiment_score'].mean()
        sentiment_std = sentiment_df['sentiment_score'].std()
        positive_ratio = (sentiment_df['sentiment_score'] > 0.1).mean() * 100
        negative_ratio = (sentiment_df['sentiment_score'] < -0.1).mean() * 100
        neutral_ratio = 100 - positive_ratio - negative_ratio
        
        # 시장 감성 평가
        if avg_sentiment > 0.3:
            market_mood = "매우 긍정적"
        elif avg_sentiment > 0.1:
            market_mood = "긍정적"
        elif avg_sentiment > -0.1:
            market_mood = "중립"
        elif avg_sentiment > -0.3:
            market_mood = "부정적"
        else:
            market_mood = "매우 부정적"
        
        return {
            "status": "success",
            "period_days": days,
            "total_news": len(news_df),
            "analysis": {
                "average_sentiment": round(avg_sentiment, 3),
                "sentiment_volatility": round(sentiment_std, 3),
                "market_mood": market_mood,
                "sentiment_distribution": {
                    "positive_ratio": round(positive_ratio, 1),
                    "neutral_ratio": round(neutral_ratio, 1),
                    "negative_ratio": round(negative_ratio, 1)
                }
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"감성분석 오류: {str(e)}")

# --- 디버깅 엔드포인트 ---
@router.get("/debug/device_info")
async def get_device_info():
    """ML 연산 장치 정보"""
    return {
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "pytorch_version": torch.__version__
    }