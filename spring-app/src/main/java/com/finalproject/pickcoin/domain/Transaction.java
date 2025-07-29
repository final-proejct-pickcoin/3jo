package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.DefaultStatus;
import com.finalproject.pickcoin.enums.TradeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer tx_id;
    private Integer user_id;
    private Integer wallert_id;
    private Integer point_id;
    @Enumerated(EnumType.STRING)
    private TradeType trade_type; // 거래 유형 (예: "buy", "sell") enum으로 바꿔야할수도.
    private Double price;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private DefaultStatus status; // 거래 상태 (예: "pending", "completed", "cancelled") enum으로 바꿔야할수도.
    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date createdAt; // 거래 생성 시간
}
