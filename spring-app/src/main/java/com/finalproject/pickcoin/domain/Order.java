package com.finalproject.pickcoin.domain;

import com.finalproject.pickcoin.enums.DefaultStatus;
import com.finalproject.pickcoin.enums.TradeType;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer order_id;
    private Integer user_id;
    private Integer asset_id;
    private TradeType order_type;
    private Double price;
    private Double amount;
    private Double unconcluded_amount;
    private DefaultStatus status;
}
