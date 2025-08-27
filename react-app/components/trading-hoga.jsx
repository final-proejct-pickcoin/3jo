"use client";

import React from "react";

const OrderBook = ({ selectedCoin, realTimeData, orderbook, tickSize, currentPriceKRW, onPriceSelect }) => {
  const formatKRW = (n) => (Number.isFinite(n) ? n.toLocaleString() : "-");
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">호가창</h3>
        <p className="text-sm text-gray-500">{selectedCoin}/KRW 실시간 호가</p>
      </div>
      
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
          const tick = tickSize || 1;
          const price = parseFloat(currentPriceKRW);
          
          // 매도호가 10줄: 현재가보다 높은 가격부터 위로 10개
          for (let i = 10; i >= 1; i--) {
            const askPrice = price + i * tick;
            let askQty = '0.000';
            if (orderbook.asks && orderbook.asks.length > 0) {
              const found = orderbook.asks.find(a => Math.abs(parseFloat(a.price) - askPrice) < tick/2);
              if (found) askQty = parseFloat(found.quantity).toFixed(3);
            }
            rows.push(
              <div
                key={"ask-" + i}
                className="grid grid-cols-3 text-xs h-7 items-center hover:bg-gray-50 cursor-pointer"
                onClick={() => onPriceSelect(askPrice)}
              >
                <div className="text-blue-700 bg-blue-100 text-left pl-2 font-mono rounded-l">{askQty}</div>
                <div className="text-center font-bold font-mono text-blue-600 bg-blue-100">
                  {askPrice > 0 ? askPrice.toLocaleString() : ''}
                </div>
                <div className="bg-white"></div>
              </div>
            );
          }
          
          // 매수호가 10줄: 현재가 포함, 아래로 9개
          for (let i = 0; i < 10; i++) {
            const bidPrice = price - i * tick;
            let bidQty = '0.000';
            if (orderbook.bids && orderbook.bids.length > 0) {
              const found = orderbook.bids.find(b => Math.abs(parseFloat(b.price) - bidPrice) < tick/2);
              if (found) bidQty = parseFloat(found.quantity).toFixed(3);
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
                  {bidPrice > 0 ? bidPrice.toLocaleString() : ''}
                </div>
                <div className="text-red-600 bg-red-100 text-right pr-2 font-mono rounded-r">{bidQty}</div>
              </div>
            );
          }
          return rows;
        })()}
      </div>
      
      {/* 현재가 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">현재가</div>
          <div className="text-xl font-bold text-gray-900">
            {formatKRW(currentPriceKRW)} KRW
          </div>
          {realTimeData && (
            <div className={`text-sm mt-1 ${
              realTimeData.chgRate > 0 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {realTimeData.chgRate > 0 ? '+' : ''}{realTimeData.chgRate?.toFixed(2) || '0.00'}%
              {realTimeData.chgAmt && (
                <span className="ml-2">
                  ({realTimeData.chgAmt > 0 ? '+' : ''}{parseInt(realTimeData.chgAmt).toLocaleString()}원)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;