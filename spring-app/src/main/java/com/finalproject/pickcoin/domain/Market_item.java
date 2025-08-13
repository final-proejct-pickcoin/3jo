package com.finalproject.pickcoin.domain;

import lombok.Data;

@Data
public class Market_item {

    private Integer asset_id;
    private String asset_name;
    private String asset_type;
    private String symbol;
    private String market;
    private Integer is_bookmarked;
    private Double price;
    private Double change_rate;

    
}
