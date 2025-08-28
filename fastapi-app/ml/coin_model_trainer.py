import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import joblib
import os
from datetime import datetime, timedelta

from ml.data_collector import get_all_coins_historical_data, get_recent_news_data, get_historical_crypto_prices
from ml.text_processor import process_news_for_sentiment

# 하이퍼파라미터
SEQUENCE_LENGTH = 15
HIDDEN_SIZE = 128
NUM_LAYERS = 3
NUM_EPOCHS = 200
LEARNING_RATE = 0.001
BATCH_SIZE = 32
MIN_TRAINING_DAYS = 40  # 최소 학습 데이터 요구사항 (기술적 지표 계산 후)


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
        out = out[:, -1, :]  # 마지막 시점 출력만 사용

        out = self.fc1(out)
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)

        return out


def create_lstm_sequences(features, target, sequence_length):
    """LSTM 시퀀스 데이터 생성"""
    xs, ys = [], []
    for i in range(len(features) - sequence_length):
        x = features[i:(i + sequence_length)]
        y = target[i + sequence_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)


def prepare_single_coin_data(all_coins_df, sentiment_df, coin):
    """단일 코인 데이터 준비"""
    # 해당 코인 데이터만 추출
    coin_data = all_coins_df[all_coins_df['coin'] == coin].copy()

    print(f"    원본 데이터: {len(coin_data)}일")

    # 날짜별 감성 점수 집계
    sentiment_df = sentiment_df.copy()
    sentiment_df['date'] = sentiment_df['timestamp'].dt.date
    daily_sentiment_avg = sentiment_df.groupby('date')['sentiment_score'].mean().reset_index()
    daily_sentiment_avg.rename(columns={'sentiment_score': 'daily_sentiment_avg'}, inplace=True)

    # 감성 데이터 병합
    coin_merged = pd.merge(coin_data, daily_sentiment_avg, on='date', how='left')
    coin_merged['daily_sentiment_avg'] = coin_merged['daily_sentiment_avg'].fillna(0)

    # 기술적 지표 생성
    coin_merged['price_change_rate'] = coin_merged['close'].pct_change().fillna(0)
    coin_merged['log_volume'] = np.log1p(coin_merged['volume'])

    # 이동평균
    coin_merged['ma_5'] = coin_merged['close'].rolling(window=5).mean()
    coin_merged['ma_20'] = coin_merged['close'].rolling(window=20).mean()

    # 볼린저 밴드
    rolling_mean = coin_merged['close'].rolling(window=20).mean()
    rolling_std = coin_merged['close'].rolling(window=20).std()
    coin_merged['bb_upper'] = rolling_mean + (rolling_std * 2)
    coin_merged['bb_lower'] = rolling_mean - (rolling_std * 2)
    coin_merged['bb_position'] = (coin_merged['close'] - coin_merged['bb_lower']) / (
            coin_merged['bb_upper'] - coin_merged['bb_lower'])

    # RSI
    delta = coin_merged['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    coin_merged['rsi'] = 100 - (100 / (1 + rs))

    # 타겟 변수 (다음날 종가)
    coin_merged['target_close'] = coin_merged['close'].shift(-1)

    # 결측치 제거
    coin_merged.dropna(inplace=True)

    print(f"    처리 후 데이터: {len(coin_merged)}일 (기술적 지표 계산으로 {len(coin_data) - len(coin_merged)}일 손실)")

    if len(coin_merged) < MIN_TRAINING_DAYS:
        raise ValueError(f"{coin}: 처리 후 데이터 부족 ({len(coin_merged)}일 < {MIN_TRAINING_DAYS}일)")

    return coin_merged

def prepare_single_coin_data_direct(coin_df, sentiment_df, coin_name):
    """단일 코인 DataFrame을 직접 처리하는 함수"""
    
    # coin_df는 이미 해당 코인 데이터만 있으므로 필터링 불필요
    coin_data = coin_df.copy()
    
    print(f"    원본 데이터: {len(coin_data)}일")

    # 날짜별 감성 점수 집계
    sentiment_df = sentiment_df.copy()
    sentiment_df['date'] = sentiment_df['timestamp'].dt.date
    daily_sentiment_avg = sentiment_df.groupby('date')['sentiment_score'].mean().reset_index()
    daily_sentiment_avg.rename(columns={'sentiment_score': 'daily_sentiment_avg'}, inplace=True)

    # 감성 데이터 병합
    coin_merged = pd.merge(coin_data, daily_sentiment_avg, on='date', how='left')
    coin_merged['daily_sentiment_avg'] = coin_merged['daily_sentiment_avg'].fillna(0)

    # 나머지 기술적 지표 계산은 prepare_single_coin_data()와 동일
    coin_merged['price_change_rate'] = coin_merged['close'].pct_change().fillna(0)
    coin_merged['log_volume'] = np.log1p(coin_merged['volume'])
    
    # 이동평균
    coin_merged['ma_5'] = coin_merged['close'].rolling(window=5).mean()
    coin_merged['ma_20'] = coin_merged['close'].rolling(window=20).mean()
    
    # 볼린저 밴드
    rolling_mean = coin_merged['close'].rolling(window=20).mean()
    rolling_std = coin_merged['close'].rolling(window=20).std()
    coin_merged['bb_upper'] = rolling_mean + (rolling_std * 2)
    coin_merged['bb_lower'] = rolling_mean - (rolling_std * 2)
    coin_merged['bb_position'] = (coin_merged['close'] - coin_merged['bb_lower']) / (
            coin_merged['bb_upper'] - coin_merged['bb_lower'])

    # RSI
    delta = coin_merged['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    coin_merged['rsi'] = 100 - (100 / (1 + rs))

    # 타겟 변수 (다음날 종가)
    coin_merged['target_close'] = coin_merged['close'].shift(-1)

    # 결측치 제거
    coin_merged.dropna(inplace=True)

    print(f"    처리 후 데이터: {len(coin_merged)}일")

    if len(coin_merged) < MIN_TRAINING_DAYS:
        raise ValueError(f"{coin_name}: 처리 후 데이터 부족 ({len(coin_merged)}일 < {MIN_TRAINING_DAYS}일)")

    return coin_merged

def train_single_coin_model(coin_data, coin_name):
    """단일 코인 모델 학습"""
    feature_columns = [
        'close', 'daily_sentiment_avg', 'price_change_rate',
        'log_volume', 'ma_5', 'ma_20', 'bb_position', 'rsi'
    ]

    # 특성 및 타겟 데이터 준비
    features = coin_data[feature_columns].values
    target = coin_data['target_close'].values.reshape(-1, 1)

    # 시퀀스 데이터 생성
    X_seq, y_seq = create_lstm_sequences(features, target, SEQUENCE_LENGTH)

    if len(X_seq) < 30:  # 최소 시퀀스 개수 확인
        raise ValueError(f"{coin_name}: 시퀀스 데이터 부족 ({len(X_seq)}개)")

    # 데이터 스케일링
    X_reshaped = X_seq.reshape(-1, X_seq.shape[-1])
    scaler_features = MinMaxScaler(feature_range=(0, 1))
    X_scaled_reshaped = scaler_features.fit_transform(X_reshaped)
    X_scaled = X_scaled_reshaped.reshape(X_seq.shape)

    scaler_target = MinMaxScaler(feature_range=(0, 1))
    y_scaled = scaler_target.fit_transform(y_seq)

    # 훈련/검증/테스트 분할
    total_samples = len(X_scaled)
    train_size = int(total_samples * 0.7)
    val_size = int(total_samples * 0.15)

    X_train = torch.from_numpy(X_scaled[:train_size]).float()
    y_train = torch.from_numpy(y_scaled[:train_size]).float()
    X_val = torch.from_numpy(X_scaled[train_size:train_size + val_size]).float()
    y_val = torch.from_numpy(y_scaled[train_size:train_size + val_size]).float()
    X_test = torch.from_numpy(X_scaled[train_size + val_size:]).float()
    y_test = torch.from_numpy(y_scaled[train_size + val_size:]).float()

    # 모델 초기화
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = CoinPredictor(
        input_size=len(feature_columns),
        hidden_size=HIDDEN_SIZE,
        num_layers=NUM_LAYERS
    ).to(device)

    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=10, factor=0.5)

    # 데이터 로더 생성
    from torch.utils.data import DataLoader, TensorDataset

    train_dataset = TensorDataset(X_train, y_train)
    val_dataset = TensorDataset(X_val, y_val)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # 모델 학습
    best_val_loss = float('inf')
    patience_counter = 0

    print(f"  {coin_name} 모델 학습 시작 (시퀀스: {len(X_seq)}개)")

    for epoch in range(NUM_EPOCHS):
        # 훈련
        model.train()
        train_loss = 0.0

        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)

            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()

        # 검증
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X, batch_y = batch_X.to(device), batch_y.to(device)
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item()

        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)

        scheduler.step(avg_val_loss)

        # Early stopping
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
            best_model_state = model.state_dict().copy()
        else:
            patience_counter += 1

        if patience_counter >= 15:
            break

    # 최고 성능 모델 복원
    model.load_state_dict(best_model_state)

    # 최종 평가
    model.eval()
    with torch.no_grad():
        test_preds_scaled = model(X_test.to(device)).cpu().numpy()

    test_preds = scaler_target.inverse_transform(test_preds_scaled)
    y_test_orig = scaler_target.inverse_transform(y_test.numpy())

    # 성능 계산
    test_rmse = np.sqrt(mean_squared_error(y_test_orig, test_preds))
    test_mape = np.mean(np.abs((y_test_orig - test_preds) / y_test_orig)) * 100

    print(f"  {coin_name} 완료 - RMSE: {test_rmse:.2f}, MAPE: {test_mape:.2f}%")

    return model, scaler_features, scaler_target, test_rmse, test_mape


def save_coin_model(coin_name, model, scaler_features, scaler_target):
    """코인별 모델 저장"""
    model_dir = f"ml/models/{coin_name}"
    os.makedirs(model_dir, exist_ok=True)

    torch.save(model.state_dict(), f"{model_dir}/model.pt")
    joblib.dump(scaler_features, f"{model_dir}/scaler_features.joblib")
    joblib.dump(scaler_target, f"{model_dir}/scaler_target.joblib")


def load_coin_model(coin_name):
    """코인별 모델 로드"""
    model_dir = f"ml/models/{coin_name}"

    if not os.path.exists(model_dir):
        raise FileNotFoundError(f"{coin_name} 모델을 찾을 수 없습니다: {model_dir}")

    feature_columns = [
        'close', 'daily_sentiment_avg', 'price_change_rate',
        'log_volume', 'ma_5', 'ma_20', 'bb_position', 'rsi'
    ]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = CoinPredictor(input_size=len(feature_columns)).to(device)
    model.load_state_dict(torch.load(f"{model_dir}/model.pt", map_location=device))
    model.eval()

    scaler_features = joblib.load(f"{model_dir}/scaler_features.joblib")
    scaler_target = joblib.load(f"{model_dir}/scaler_target.joblib")

    return model, scaler_features, scaler_target


def predict_coin_price(coin_name, days_ahead=1):
    """특정 코인의 가격 예측"""
    try:
        # 모델 로드
        model, scaler_features, scaler_target = load_coin_model(coin_name)

        # 단일 코인 데이터 수집
        coin_df = get_historical_crypto_prices(coin=coin_name, days=70) # 50일치만 수집
        sentiment_df = process_news_for_sentiment(get_recent_news_data(days=100))  # 100일로 증가

        coin_data = prepare_single_coin_data_direct(coin_df, sentiment_df, coin_name)

        feature_columns = [
            'close', 'daily_sentiment_avg', 'price_change_rate',
            'log_volume', 'ma_5', 'ma_20', 'bb_position', 'rsi'
        ]

        # 최근 시퀀스 데이터 준비
        recent_features = coin_data[feature_columns].values[-SEQUENCE_LENGTH:]  # (15, 8)

        # 각 시점별로 개별적으로 스케일링
        recent_features_scaled = scaler_features.transform(recent_features)  # (15, 8)

        # LSTM 입력 형태로 reshape: (batch_size, sequence_length, features)
        recent_features_scaled = recent_features_scaled.reshape(1, SEQUENCE_LENGTH, len(feature_columns))  # (1, 15, 8)

        # 예측
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        with torch.no_grad():
            recent_tensor = torch.from_numpy(recent_features_scaled).float().to(device)
            prediction_scaled = model(recent_tensor).cpu().numpy()

        # 원본 스케일로 변환
        prediction = scaler_target.inverse_transform(prediction_scaled)

        return prediction[0][0]

    except Exception as e:
        print(f"예측 중 오류 발생: {e}")
        return None

'''
def predict_coin_price(coin_name):
    """학습된 모델로 즉시 예측"""
    try:
        model, scaler_features, scaler_target = load_coin_model(coin_name)
        
        # 현재가만 가져오기 (빠름)
        from api.voice_router import get_realtime_price
        current_data = get_realtime_price(coin_name)
        current_price = float(current_data["closing_price"])
        
        # 모델 입력 형태로 변환
        input_tensor = prepare_model_input(current_price, scaler_features)
        
        # 예측
        with torch.no_grad():
            prediction_scaled = model(input_tensor)
            prediction = scaler_target.inverse_transform(prediction_scaled)
        
        return prediction[0][0]
    except:
        return None
'''    

def train_all_individual_models():
    """모든 코인에 대해 개별 모델 학습"""
    print("=== 개별 코인별 모델 학습 시작 ===")

    # 데이터 수집
    print("1. 데이터 수집 중...")
    all_coins_df = get_all_coins_historical_data(days=200)
    all_news_df = get_recent_news_data(days=200)
    sentiment_df = process_news_for_sentiment(all_news_df)

    # 모델 디렉토리 생성
    os.makedirs("models", exist_ok=True)

    trained_coins = []
    failed_coins = []
    performance_summary = []

    print("2. 개별 코인 모델 학습 중...")

    for coin in all_coins_df['coin'].unique():
        try:
            print(f"\n[{len(trained_coins) + 1}] {coin} 학습 중...")

            # 단일 코인 데이터 준비
            coin_data = prepare_single_coin_data(all_coins_df, sentiment_df, coin)

            # 모델 학습
            model, scaler_features, scaler_target, rmse, mape = train_single_coin_model(coin_data, coin)

            # 모델 저장
            save_coin_model(coin, model, scaler_features, scaler_target)

            trained_coins.append(coin)
            performance_summary.append({
                'coin': coin,
                'rmse': rmse,
                'mape': mape,
                'data_points': len(coin_data)
            })

        except Exception as e:
            print(f"  {coin} 학습 실패: {e}")
            failed_coins.append(coin)
            continue

    print(f"\n=== 학습 완료 결과 ===")
    print(f"성공: {len(trained_coins)}개 코인")
    print(f"실패: {len(failed_coins)}개 코인")

    if performance_summary:
        perf_df = pd.DataFrame(performance_summary)
        print(f"\n상위 10개 코인 성능:")
        print(perf_df.nsmallest(10, 'rmse')[['coin', 'rmse', 'mape']].to_string(index=False))

    return trained_coins, failed_coins

# 사용 예시
if __name__ == "__main__":
    # 모든 개별 모델 학습
    trained_coins, failed_coins = train_all_individual_models()

    # 특정 코인 예측 테스트
    if trained_coins:
        test_coin = trained_coins[0]
        print(f"\n{test_coin} 예측 테스트:")
        prediction = predict_coin_price(test_coin)
        if prediction:
            print(f"다음날 예상 가격: {prediction:.2f}")
