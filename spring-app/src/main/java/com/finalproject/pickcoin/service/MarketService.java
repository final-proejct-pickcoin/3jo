package com.finalproject.pickcoin.service;
import java.util.List;
import com.finalproject.pickcoin.domain.Asset;


public interface MarketService {
    
    public List<Asset> get_coin_list();
}
