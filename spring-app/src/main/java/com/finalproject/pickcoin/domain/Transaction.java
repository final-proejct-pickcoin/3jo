package com.finalproject.pickcoin.domain;

import java.util.Date;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;

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
    private Integer order_id;
    private Double price;
    private Double amount;
    private Double fee;

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date createdAt; // 거래 생성 시간
}
