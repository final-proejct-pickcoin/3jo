package com.finalproject.pickcoin.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.PlaceOrderRequest;
import com.finalproject.pickcoin.service.TradeService;

@RestController
@RequestMapping("/api/trade")
@CrossOrigin(origins = "*")
public class TradeController {

    @Autowired
    private TradeService tradeService;

    /** 시장가 매수 */
    @PostMapping("/market_buy")
    public Map<String, Object> marketBuy(@RequestBody PlaceOrderRequest req) {
        return tradeService.market_buy(req);
    }

    // 시장가 매도
    @PostMapping("/market_sell")
    public Map<String, Object> marketSell(@RequestBody PlaceOrderRequest req) {
        return tradeService.market_sell(req);
    }

    // 보유자산
    @GetMapping("/holdings")
    public java.util.List<Map<String,Object>> getHoldings(@RequestParam("user_id") Long userId) {
        return tradeService.holdings(userId);
    }

    // KRW 잔액
    @GetMapping("/krw_balance")
    public Map<String,Object> getKrw(@RequestParam("user_id") Long userId) {
        return Map.of("krw", tradeService.krw_balance(userId));
    }

    //거래내역
    @GetMapping("/trades")
    public java.util.List<Map<String,Object>> getTrades(@RequestParam("user_id") Long userId) {
        return tradeService.trades(userId);
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