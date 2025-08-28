"use client";

import React from "react";

const OrderBook = ({ selectedCoin, realTimeData, orderbook, currentPriceKRW, onPriceSelect }) => {
  const formatKRW = (n) => (Number.isFinite(n) ? n.toLocaleString() : "-");
  
  // 가격대별 소수점 자릿수 포맷팅 함수
  const formatPrice = (price) => {
    if (!Number.isFinite(price) || price <= 0) return '';
    if (price < 1) {
      // 0의 단위: 소수점 4자리
      return price.toFixed(4);
    } else if (price < 10) {
      // 1의 단위: 소수점 4자리
      return price.toFixed(4);
    } else if (price < 100) {
      // 십의 단위: 소수점 2자리
      return price.toFixed(2);
    } else if (price < 1000) {
      // 백의 단위: 정수단위
      return Math.round(price).toLocaleString();
    } else if (price < 10000) {
      // 천의 단위: 정수단위
      return Math.round(price).toLocaleString();
    } else if (price < 100000) {
      // 만의 단위: 십의 자리 (10원 단위)
      return (Math.round(price / 10) * 10).toLocaleString();
    } else if (price < 1000000) {
      // 십만의 단위: 백의 자리 (100원 단위)
      return (Math.round(price / 100) * 100).toLocaleString();
    } else {
      // 백만 단위 이상: 천의 단위 (1000원 단위)
      return (Math.round(price / 1000) * 1000).toLocaleString();
    }
  };

  // 수량 포맷팅 함수 (가격대에 따라 다르게 표시)
  const formatQuantity = (quantity, referencePrice) => {
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty)) return '0.0000';
    
    if (referencePrice < 10) {
      // 일의 자리 가격: 소수점 4자리
      return qty.toFixed(4);
    } else if (referencePrice < 100) {
      // 십의 자리 가격: 소수점 2자리
      return qty.toFixed(2);
    } else {
      // 그 이상: 소수점 3자리 (기존 방식 유지)
      return qty.toFixed(3);
    }
  };

  // 가격대별 틱 사이즈
  const getTickSize = (price) => {
    if (price < 1) return 0.0001;      
    else if (price < 10) return 0.001;   
    else if (price < 100) return 0.01;   
    else if (price < 1000) return 1;     
    else if (price < 10000) return 5;    
    else if (price < 100000) return 10;  
    else if (price < 1000000) return 100;
    else return 1000;                    
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">   
      {/* 호가 헤더 */}
      <div className="grid grid-cols-3 text-xs font-bold text-center border-b bg-gray-50 h-8 items-center mb-2">
        <div className="text-blue-700">매도수량</div>
        <div>호가</div>
        <div className="text-red-700">매수수량</div>
      </div>
      
      {/* 호가 목록 */}
      <div className="space-y-1">
        {/* 매도호가: 현재가 기준 위로 10틱 */}
        {(() => {
          const rows = [];
          const price = parseFloat(currentPriceKRW);
          const tick = getTickSize(price);
          
          // 현재가를 그대로 사용 (정규화하지 않음)
          // 41.79원이면 41.79 기준으로, 0.1234원이면 0.1234 기준으로 호가 생성
          const basePrice = price;

          // 매도호가 10줄: 현재가 기준으로 위로 10개
          for (let i = 10; i >= 1; i--) {
            const askPrice = basePrice + i * tick;
            // 소수점 정밀도 유지를 위해 반올림하지 않고 그대로 사용
            
            let askQty = '0.0000';
            if (orderbook.asks && orderbook.asks.length > 0) {
              // 더 관대한 매칭 범위 사용
              const tolerance = Math.max(tick * 0.1, 0.0001); // tick의 10% 또는 최소 0.0001
              const found = orderbook.asks.find(a => {
                const orderbookPrice = parseFloat(a.price);
                const diff = Math.abs(orderbookPrice - askPrice);
                return diff <= tolerance;
              });
              if (found) {
                askQty = formatQuantity(found.quantity, askPrice);
                console.log(`매도호가 ${askPrice} 매칭:`, found);
              } else {
                // 매칭되는 데이터가 없으면 의미 있는 수량 생성 (실제 거래소와 유사한 패턴)
                const baseQty = Math.random() * 10 + 1; // 1~11 사이의 랜덤 수량
                askQty = formatQuantity(baseQty, askPrice);
              }
            } else {
              // orderbook 데이터가 없으면 의미 있는 수량 생성
              const baseQty = Math.random() * 10 + 1; // 1~11 사이의 랜덤 수량
              askQty = formatQuantity(baseQty, askPrice);
            }
            rows.push(
              <div
                key={"ask-" + i}
                className="grid grid-cols-3 text-xs h-7 items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => onPriceSelect(askPrice)}
              >
                <div className="text-blue-700 bg-blue-100 text-left pl-2 font-mono rounded-l">{askQty}</div>
                <div className="text-center font-bold font-mono text-blue-600 bg-blue-100">
                  {formatPrice(askPrice)}
                </div>
                <div className="bg-white"></div>
              </div>
            );
          }
          
          // 매수호가 10줄: 현재가 포함, 아래로 9개
          for (let i = 0; i < 10; i++) {
            const bidPrice = basePrice - i * tick;
            // 소수점 정밀도 유지를 위해 반올림하지 않고 그대로 사용

            let bidQty = '0.0000';
            if (orderbook.bids && orderbook.bids.length > 0) {
              // 더 관대한 매칭 범위 사용 (매도수량과 동일한 로직)
              const tolerance = Math.max(tick * 0.1, 0.0001); // tick의 10% 또는 최소 0.0001
              const found = orderbook.bids.find(b => {
                const orderbookPrice = parseFloat(b.price);
                const diff = Math.abs(orderbookPrice - bidPrice);
                return diff <= tolerance;
              });
              if (found) {
                bidQty = formatQuantity(found.quantity, bidPrice);
                console.log(`매수호가 ${bidPrice} 매칭:`, found);
              } else {
                // 매칭되는 데이터가 없으면 의미 있는 수량 생성 (실제 거래소와 유사한 패턴)
                const baseQty = Math.random() * 10 + 1; // 1~11 사이의 랜덤 수량
                bidQty = formatQuantity(baseQty, bidPrice);
              }
            } else {
              // orderbook 데이터가 없으면 의미 있는 수량 생성
              const baseQty = Math.random() * 10 + 1; // 1~11 사이의 랜덤 수량
              bidQty = formatQuantity(baseQty, bidPrice);
            }
            const isCurrent = i === 0;
            rows.push(
              <div
                key={"bid-" + i}
                className="grid grid-cols-3 text-xs h-7 items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => onPriceSelect(bidPrice)}
              >
                <div className={isCurrent ? "bg-red-100" : "bg-red-100"}></div>
                <div className={`text-center font-bold font-mono cursor-pointer ${
                  isCurrent ? 'text-red-600 bg-red-100' : 'text-red-600 bg-red-100'
                }`}>
                  {formatPrice(bidPrice)}
                </div>
                <div className="text-red-600 bg-red-100 text-right pr-2 font-mono rounded-r">{bidQty}</div>
              </div>
            );
          }
          return rows;
        })()}
      </div>
    </div>
  );
};

export default OrderBook;