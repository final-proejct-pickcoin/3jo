package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.TradeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
public class Signal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer signal_id;
    private Integer coin_id;
    private Integer model_id;
    private String generated_by; // AI 모델 이름 (enum으로 변경 가능)
    private TradeType signal_type; // 예: "buy", "sell"    
    private String detail; // text
    private Double score; // 모델 정확도

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date createdAt;    

}
