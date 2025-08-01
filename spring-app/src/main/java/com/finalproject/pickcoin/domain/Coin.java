package com.finalproject.pickcoin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Coin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer coin_id;
    @Column(nullable = false)
    private String symbol;
    @Column(nullable = false)
    private String coin_name;
    @Column(nullable = false)
    private String market;
}
