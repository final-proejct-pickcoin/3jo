import pandas as pd
import numpy as np
import torch
import os
from sklearn.metrics import mean_squared_error

from ml.data_collector import get_all_coins_historical_data, get_recent_news_data
from ml.text_processor import process_news_for_sentiment

from ml.coin_model_trainer import CoinPredictor, prepare_single_coin_data, load_coin_model, SEQUENCE_LENGTH


def evaluate_single_model_with_data(coin_name, all_coins_df, sentiment_df, test_days=30):
    """데이터를 받아서 단일 모델 평가"""
    try:
        model, scaler_features, scaler_target = load_coin_model(coin_name)
        coin_data = prepare_single_coin_data(all_coins_df, sentiment_df, coin_name)

        if len(coin_data) < test_days + SEQUENCE_LENGTH:
            print(f"{coin_name}: 데이터 부족 ({len(coin_data)}일)")
            return None

        feature_columns = [
            'close', 'daily_sentiment_avg', 'price_change_rate',
            'log_volume', 'ma_5', 'ma_20', 'bb_position', 'rsi'
        ]

        test_data = coin_data.tail(test_days + SEQUENCE_LENGTH)
        predictions, actual_prices = [], []

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        for i in range(test_days):
            current_features = test_data.iloc[i:i + SEQUENCE_LENGTH][feature_columns].values
            actual_price = test_data.iloc[i + SEQUENCE_LENGTH]['close']

            features_scaled = scaler_features.transform(current_features)
            features_scaled = features_scaled.reshape(1, SEQUENCE_LENGTH, len(feature_columns))

            with torch.no_grad():
                input_tensor = torch.from_numpy(features_scaled).float().to(device)
                pred_scaled = model(input_tensor).cpu().numpy()

            prediction = scaler_target.inverse_transform(pred_scaled)[0][0]
            predictions.append(prediction)
            actual_prices.append(actual_price)

        predictions, actual_prices = np.array(predictions), np.array(actual_prices)

        rmse = np.sqrt(mean_squared_error(actual_prices, predictions))
        mae = np.mean(np.abs(actual_prices - predictions))
        mape = np.mean(np.abs((actual_prices - predictions) / actual_prices)) * 100

        actual_directions = np.sign(np.diff(actual_prices))
        pred_directions = np.sign(predictions[1:] - actual_prices[:-1])
        direction_accuracy = np.mean(actual_directions == pred_directions) * 100

        print(f"{coin_name}: RMSE {rmse:,.0f}, MAPE {mape:.1f}%, 방향성 {direction_accuracy:.1f}%")

        return {
            'rmse': rmse,
            'mae': mae,
            'mape': mape,
            'direction_accuracy': direction_accuracy,
            'avg_actual': np.mean(actual_prices),
            'avg_predicted': np.mean(predictions)
        }

    except Exception as e:
        print(f"{coin_name} 평가 실패: {e}")
        return None


def evaluate_trained_model(coin_name, test_days=30):
    """단일 코인 모델 평가 (데이터 새로 수집)"""
    try:
        if not os.path.exists(f'models/{coin_name}'):
            print(f"{coin_name} 모델이 존재하지 않습니다.")
            return None

        print(f"=== {coin_name} 데이터 수집 중... ===")
        all_coins_df = get_all_coins_historical_data(days=200)
        sentiment_df = process_news_for_sentiment(get_recent_news_data(days=200))

        result = evaluate_single_model_with_data(coin_name, all_coins_df, sentiment_df, test_days)

        if result:
            print(f"\n=== {coin_name} 모델 평가 ({test_days}일) ===")
            print(f"RMSE: {result['rmse']:,.2f}")
            print(f"MAE: {result['mae']:,.2f}")
            print(f"MAPE: {result['mape']:.2f}%")
            print(f"방향성 정확도: {result['direction_accuracy']:.1f}%")
            print(f"평균 실제가격: {result['avg_actual']:,.2f}")
            print(f"평균 예측가격: {result['avg_predicted']:,.2f}")

        return result

    except Exception as e:
        print(f"{coin_name} 평가 중 오류: {e}")
        return None


def evaluate_all_trained_models(max_models=10):
    """학습된 모든 모델 평가 (데이터 한 번만 수집)"""
    if not os.path.exists('models'):
        print("모델 폴더가 존재하지 않습니다.")
        return

    model_dirs = [d for d in os.listdir('models') if os.path.isdir(f'models/{d}')]

    if not model_dirs:
        print("학습된 모델이 없습니다.")
        return

    print(f"=== 데이터 수집 중 (한 번만) ===")
    all_coins_df = get_all_coins_historical_data(days=200)
    sentiment_df = process_news_for_sentiment(get_recent_news_data(days=200))

    eval_models = model_dirs[:max_models] if max_models else model_dirs
    print(f"=== {len(eval_models)}개 모델 평가 시작 ===")

    results = []
    for i, coin in enumerate(eval_models, 1):
        print(f"[{i}/{len(eval_models)}] {coin} 평가 중...")
        result = evaluate_single_model_with_data(coin, all_coins_df, sentiment_df)
        if result:
            results.append({'coin': coin, **result})

    if results:
        results_df = pd.DataFrame(results)

        print(f"\n=== 전체 성능 요약 ===")
        print(f"평가된 모델 수: {len(results)}")
        print(f"평균 MAPE: {results_df['mape'].mean():.2f}%")
        print(f"평균 방향성 정확도: {results_df['direction_accuracy'].mean():.1f}%")

        print(f"\n=== 상위 성능 모델 (MAPE 기준) ===")
        top_models = results_df.nsmallest(5, 'mape')[['coin', 'mape', 'direction_accuracy', 'rmse']]
        print(top_models.to_string(index=False))

        print(f"\n=== 방향성 예측 우수 모델 ===")
        top_direction = results_df.nlargest(5, 'direction_accuracy')[['coin', 'direction_accuracy', 'mape']]
        print(top_direction.to_string(index=False))

        return results_df

    return None


def get_available_models():
    """학습된 모델 목록 반환"""
    if not os.path.exists('models'):
        return []
    return [d for d in os.listdir('models') if os.path.isdir(f'models/{d}')]


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        # 특정 코인 평가
        coin_name = sys.argv[1].upper()
        evaluate_trained_model(coin_name)
    else:
        # 모든 모델 평가
        evaluate_all_trained_models()