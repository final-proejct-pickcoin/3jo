package com.finalproject.pickcoin.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.finalproject.pickcoin.domain.PlaceOrderRequest;

public interface TradeService {
    // 매수
    public Map<String,Object> market_buy(PlaceOrderRequest req);

    // 매도
    Map<String,Object> market_sell(PlaceOrderRequest req);
    
    // 보유자산
    List<Map<String,Object>> holdings(Long userId);
    // KRW 잔액
    BigDecimal krw_balance(Long userId);
    // 거래내역
    List<Map<String,Object>> trades(Long userId);
    // 심볼로 asset_id 조회
    //Long assetIdBySymbol(String symbol);
    
}
