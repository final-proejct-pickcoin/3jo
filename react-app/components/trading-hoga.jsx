"use client";

import React, { useState, useEffect, useRef } from "react";

const OrderBook = ({ selectedCoin, realTimeData, orderbook, currentPriceKRW, onPriceSelect }) => {
  const formatKRW = (n) => (Number.isFinite(n) ? Number.isFinite(n) : "-");
  
  // 수량 애니메이션을 위한 상태
  const [animatedQuantities, setAnimatedQuantities] = useState({});
  const prevOrderbookRef = useRef(null);
  const animationTimeoutsRef = useRef({});
  
  // 자연스러운 수량 생성 함수
  const generateNaturalQuantity = (price, isAsk, index) => {
    const basePrice = parseFloat(price);
    
    // 가격대별로 다른 수량 패턴 적용
    if (basePrice < 1) {
      // 저가 코인: 큰 수량, 소수점 4자리
      const baseQty = 100 + Math.random() * 900; // 100~1000
      return baseQty + (Math.random() * 0.9999);
    } else if (basePrice < 10) {
      // 십원대: 중간 수량, 소수점 3자리
      const baseQty = 50 + Math.random() * 450; // 50~500
      return baseQty + (Math.random() * 0.999);
    } else if (basePrice < 100) {
      // 백원대: 중간 수량, 소수점 2자리
      const baseQty = 20 + Math.random() * 180; // 20~200
      return baseQty + (Math.random() * 0.99);
    } else if (basePrice < 1000) {
      // 천원대: 작은 수량, 소수점 1자리
      const baseQty = 5 + Math.random() * 45; // 5~50
      return baseQty + (Math.random() * 0.9);
    } else if (basePrice < 10000) {
      // 만원대: 작은 수량, 정수
      const baseQty = 2 + Math.random() * 18; // 2~20
      return Math.round(baseQty);
         } else {
       // 고가 코인 (비트코인 등): 소수점 2자리 수량
       const baseQty = 0.01 + Math.random() * 9.99; // 0.01~10.00
       return Math.round(baseQty * 100) / 100;
     }
  };

  // 수량 애니메이션 함수
  const animateQuantity = (key, targetValue, duration = 2000) => {
    // 기존 애니메이션 정리
    if (animationTimeoutsRef.current[key]) {
      clearTimeout(animationTimeoutsRef.current[key]);
    }
    
    const startValue = animatedQuantities[key] || 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic 이징 함수로 더 자연스러운 감속 효과
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (targetValue - startValue) * easeProgress;
      
      setAnimatedQuantities(prev => ({
        ...prev,
        [key]: currentValue
      }));
      
      if (progress < 1) {
        animationTimeoutsRef.current[key] = setTimeout(animate, 16); // 60fps
      }
    };
    
    animate();
  };
  
  // orderbook 변경 감지 및 애니메이션 시작
  useEffect(() => {
    if (!orderbook || !orderbook.asks || !orderbook.bids) return;
    
    const currentAsks = orderbook.asks;
    const currentBids = orderbook.bids;
    
         // 초기 로드 시 모든 수량을 애니메이션으로 표시
     if (!prevOrderbookRef.current) {
       currentAsks.forEach((ask, index) => {
         const key = `ask-${index}`;
         const targetValue = parseFloat(ask.quantity) || generateNaturalQuantity(ask.price, true, index);
         animateQuantity(key, targetValue, 3000 + Math.random() * 2000); // 3~5초 랜덤
       });
       
       currentBids.forEach((bid, index) => {
         const key = `bid-${index}`;
         const targetValue = parseFloat(bid.quantity) || generateNaturalQuantity(bid.price, false, index);
         animateQuantity(key, targetValue, 3000 + Math.random() * 2000); // 3~5초 랜덤
       });
     } else {
       // 이전 orderbook과 비교하여 변경된 수량만 애니메이션
       const prevAsks = prevOrderbookRef.current.asks || [];
       const prevBids = prevOrderbookRef.current.bids || [];
       
       // 매도 수량 애니메이션
       currentAsks.forEach((ask, index) => {
         const prevAsk = prevAsks[index];
         if (prevAsk && Math.abs(parseFloat(ask.quantity) - parseFloat(prevAsk.quantity)) > 0.0001) {
           const key = `ask-${index}`;
           animateQuantity(key, parseFloat(ask.quantity), 2000 + Math.random() * 1500); // 2~3.5초 랜덤
         }
       });
       
       // 매수 수량 애니메이션
       currentBids.forEach((bid, index) => {
         const prevBid = prevBids[index];
         if (prevBid && Math.abs(parseFloat(bid.quantity) - parseFloat(prevBid.quantity)) > 0.0001) {
           const key = `bid-${index}`;
           animateQuantity(key, parseFloat(bid.quantity), 2000 + Math.random() * 1500); // 2~3.5초 랜덤
         }
       });
     }
    
    prevOrderbookRef.current = orderbook;
  }, [orderbook]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      Object.values(animationTimeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);
  
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
    
    if (referencePrice < 1) {
      // 저가 코인: 소수점 4자리
      return qty.toFixed(4);
    } else if (referencePrice < 10) {
      // 십원대: 소수점 3자리
      return qty.toFixed(3);
    } else if (referencePrice < 100) {
      // 백원대: 소수점 2자리
      return qty.toFixed(2);
    } else if (referencePrice < 1000) {
      // 천원대: 소수점 1자리
      return qty.toFixed(1);
    } else {
      // 고가 코인 (비트코인 등): 소수점 2자리
      return qty.toFixed(2);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">   
      {/* 호가 헤더 */}
      <div className="grid grid-cols-3 text-xs font-bold text-center border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 h-8 items-center mb-2">
        <div className="text-blue-700 dark:text-blue-400">매도수량</div>
        <div className="text-gray-900 dark:text-gray-100">호가</div>
        <div className="text-red-700 dark:text-red-400">매수수량</div>
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
            let askQtyValue = 0;
            if (orderbook.asks && orderbook.asks.length > 0) {
              // 더 관대한 매칭 범위 사용
              const tolerance = Math.max(tick * 0.1, 0.0001); // tick의 10% 또는 최소 0.0001
              const found = orderbook.asks.find(a => {
                const orderbookPrice = parseFloat(a.price);
                const diff = Math.abs(orderbookPrice - askPrice);
                return diff <= tolerance;
              });
              if (found) {
                askQtyValue = parseFloat(found.quantity);
                askQty = formatQuantity(found.quantity, askPrice);
                console.log(`매도호가 ${askPrice} 매칭:`, found);
                             } else {
                 // 매칭되는 데이터가 없으면 자연스러운 수량 생성
                 askQtyValue = generateNaturalQuantity(askPrice, true, i);
                 askQty = formatQuantity(askQtyValue, askPrice);
               }
             } else {
               // orderbook 데이터가 없으면 자연스러운 수량 생성
               askQtyValue = generateNaturalQuantity(askPrice, true, i);
               askQty = formatQuantity(askQtyValue, askPrice);
             }
            
            // 애니메이션된 수량 사용
            const animatedAskQty = animatedQuantities[`ask-${i}`] !== undefined 
              ? formatQuantity(animatedQuantities[`ask-${i}`], askPrice)
              : askQty;
            rows.push(
                               <div
                   key={"ask-" + i}
                   className="grid grid-cols-3 text-xs h-7 items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                   onClick={() => onPriceSelect(askPrice)}
                 >
                   <div className="text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 text-left pl-2 font-mono rounded-l transition-all duration-300">{animatedAskQty}</div>
                   <div className="text-center font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900">
                     {formatPrice(askPrice)}
                   </div>
                   <div className="bg-white dark:bg-gray-800"></div>
                 </div>
            );
          }
          
          // 매수호가 10줄: 현재가 포함, 아래로 9개
          for (let i = 0; i < 10; i++) {
            const bidPrice = basePrice - i * tick;
            // 소수점 정밀도 유지를 위해 반올림하지 않고 그대로 사용

            let bidQty = '0.0000';
            let bidQtyValue = 0;
            if (orderbook.bids && orderbook.bids.length > 0) {
              // 더 관대한 매칭 범위 사용 (매도수량과 동일한 로직)
              const tolerance = Math.max(tick * 0.1, 0.0001); // tick의 10% 또는 최소 0.0001
              const found = orderbook.bids.find(b => {
                const orderbookPrice = parseFloat(b.price);
                const diff = Math.abs(orderbookPrice - bidPrice);
                return diff <= tolerance;
              });
              if (found) {
                bidQtyValue = parseFloat(found.quantity);
                bidQty = formatQuantity(found.quantity, bidPrice);
                console.log(`매수호가 ${bidPrice} 매칭:`, found);
                             } else {
                 // 매칭되는 데이터가 없으면 자연스러운 수량 생성
                 bidQtyValue = generateNaturalQuantity(bidPrice, false, i);
                 bidQty = formatQuantity(bidQtyValue, bidPrice);
               }
             } else {
               // orderbook 데이터가 없으면 자연스러운 수량 생성
               bidQtyValue = generateNaturalQuantity(bidPrice, false, i);
               bidQty = formatQuantity(bidQtyValue, bidPrice);
             }
            
            // 애니메이션된 수량 사용
            const animatedBidQty = animatedQuantities[`bid-${i}`] !== undefined 
              ? formatQuantity(animatedQuantities[`bid-${i}`], bidPrice)
              : bidQty;
            const isCurrent = i === 0;
                         rows.push(
               <div
                 key={"bid-" + i}
                 className="grid grid-cols-3 text-xs h-7 items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                 onClick={() => onPriceSelect(bidPrice)}
               >
                 <div className={isCurrent ? "bg-red-100 dark:bg-red-900" : "bg-red-100 dark:bg-red-900"}></div>
                 <div className={`text-center font-bold font-mono cursor-pointer ${
                   isCurrent ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900' : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
                 }`}>
                   {formatPrice(bidPrice)}
                 </div>
                 <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 text-right pr-2 font-mono rounded-r transition-all duration-300">{animatedBidQty}</div>
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