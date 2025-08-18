package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.TradeType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
@Table(name = "signals")
public class Signal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer signal_id;
    private Integer coin_id;
    private Integer model_id;
    @Enumerated(EnumType.STRING)
    private TradeType signal_type; // 예: "buy", "sell"
    private String detail; // text

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

}
