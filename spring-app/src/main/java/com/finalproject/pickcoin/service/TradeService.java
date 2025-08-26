package com.finalproject.pickcoin.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.finalproject.pickcoin.domain.PlaceOrderRequest;

public interface TradeService {
    // 시장가
    Map<String,Object> market_buy(PlaceOrderRequest req);
    Map<String,Object> market_sell(PlaceOrderRequest req);

    // 지정가 (미체결 등록)
    Map<String,Object> limit_buys(PlaceOrderRequest req);   // BUY 지정가 등록
    Map<String,Object> limit_sells(PlaceOrderRequest req);  // SELL 지정가 등록

    // 현재가로 지정가 매칭/체결
    Map<String,Object> match_limits(Long assetId, BigDecimal currentPrice);

    // 조회
    List<Map<String,Object>> holdings(Long userId);
    BigDecimal krw_balance(Long userId);
    List<Map<String,Object>> trades(Long userId);
    List<Map<String,Object>> asset_unconcluded_orders(Long user_id, Long asset_id);
    List<Map<String,Object>> asset_concluded_orders(Long user_id, Long asset_id);
}
