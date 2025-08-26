package com.finalproject.pickcoin.controller;

import java.math.BigDecimal;
import java.util.Map;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.finalproject.pickcoin.domain.PlaceOrderRequest;
import com.finalproject.pickcoin.service.TradeService;

@RestController
@RequestMapping("/api/trade")
@CrossOrigin(origins = "*")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    /* ===== 시장가 ===== */
    @PostMapping("/market_buy")
    public Map<String, Object> marketBuy(@RequestBody PlaceOrderRequest req) {
        return tradeService.market_buy(req);
    }

    @PostMapping("/market_sell")
    public Map<String, Object> marketSell(@RequestBody PlaceOrderRequest req) {
        return tradeService.market_sell(req);
    }

    /* ===== 지정가: 미체결 등록 ===== */
    @PostMapping("/limit_buys")
    public Map<String, Object> limitBuys(@RequestBody PlaceOrderRequest req) {
        return tradeService.limit_buys(req);   // BUY 지정가 등록
    }

    @PostMapping("/limit_sells")
    public Map<String, Object> limitSells(@RequestBody PlaceOrderRequest req) {
        return tradeService.limit_sells(req);  // SELL 지정가 등록
    }

    /* ===== 지정가: 현재가로 매칭/체결 (전량 체결 MVP) =====
        프론트 실시간 가격 업데이트마다 호출:
        POST /api/trade/match_limits?asset_id=123&current_price=163172000
    */
    @PostMapping("/match_limits")
    public Map<String, Object> matchLimits(@RequestParam("asset_id") Long assetId,
                                            @RequestParam("current_price") BigDecimal currentPrice) {
        return tradeService.match_limits(assetId, currentPrice);
    }

    /* ===== 조회 ===== */
    @GetMapping("/holdings")
    public List<Map<String,Object>> getHoldings(@RequestParam("user_id") Long userId) {
        return tradeService.holdings(userId);
    }

    @GetMapping("/krw_balance")
    public Map<String,Object> getKrw(@RequestParam("user_id") Long userId) {
        return Map.of("krw", tradeService.krw_balance(userId));
    }

    @GetMapping("/trades")
    public List<Map<String,Object>> getTrades(@RequestParam("user_id") Long userId) {
        return tradeService.trades(userId);
    }

    @GetMapping("/asset_unconcluded_orders")
    public List<Map<String,Object>> getAssetUnconcludedOrders(@RequestParam("user_id") Long userId,
                                                                @RequestParam("asset_id") Long assetId) {
        return tradeService.asset_unconcluded_orders(userId, assetId);
    }

    @GetMapping("/asset_concluded_orders")
    public List<Map<String,Object>> getAssetConcludedOrders(@RequestParam("user_id") Long userId,
                                                            @RequestParam("asset_id") Long assetId) {
        return tradeService.asset_concluded_orders(userId, assetId);
    }

    /* ===== 에러 핸들링 (간단 JSON) ===== */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    public Map<String, Object> handleBadRequest(Exception e) {
        return Map.of("ok", false, "error", e.getMessage());
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleServerError(Exception e) {
        return Map.of("ok", false, "error", "server_error", "message", e.getMessage());
    }
}
