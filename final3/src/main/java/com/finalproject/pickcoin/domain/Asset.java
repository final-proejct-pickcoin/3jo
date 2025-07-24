package com.finalproject.pickcoin.domain;

import lombok.Data;

@Data
public class Asset {
    
    private Integer asset_id;
    private Integer user_id;
    private Integer coin_id;
    private Double amount;
}
