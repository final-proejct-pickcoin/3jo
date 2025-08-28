package com.finalproject.pickcoin.domain;



import java.util.Date;

import com.finalproject.pickcoin.enums.OrderStatus;
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
public class Orders {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer order_id;
    private Integer user_id;
    private Integer asset_id;
    private TradeType order_type;
    private Double price;
    private Double amount;
    private Double unconcluded_amount;
    private OrderStatus status;

    @Column(name="order_date", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date orderDate;
}
