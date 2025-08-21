package com.finalproject.pickcoin.domain;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class PlaceOrderRequest {
    public Long user_id;       // 사용자 ID
    public Long asset_id;      // 자산 ID
    public BigDecimal amount; // 매수 수량
    public BigDecimal price;  // 체결가(시장가 캡처)
    
}
