package com.finalproject.pickcoin.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Wallet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer wallert_id; // 월렛 ID
    private Integer user_id; // 사용자 ID
    private Integer asset_id;
    private Double amount;
}
