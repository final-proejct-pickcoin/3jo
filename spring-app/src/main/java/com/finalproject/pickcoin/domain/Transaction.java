package com.finalproject.pickcoin.domain;

import java.util.Date;

import lombok.Data;

@Data
public class Transaction {
    
    private Integer tx_id;
    private Integer user_id;
    private Integer coin_id;
    private Integer point_id;
    private String trade_type; // 거래 유형 (예: "buy", "sell") enum으로 바꿔야할수도.
    private Double price;
    private Double amount;
    private String status; // 거래 상태 (예: "pending", "completed", "cancelled") enum으로 바꿔야할수도.
    private Date created_at; // 거래 생성 시간
}
