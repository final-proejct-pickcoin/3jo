package com.finalproject.pickcoin.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Asset;
import com.finalproject.pickcoin.repository.MarketRepository;

@Service("MarketService")
public class MarketServiceImpl implements MarketService {
    @Autowired
    private MarketRepository marketRepository;

    @Override 
    public List<Asset> get_coin_list(){
        return marketRepository.findAll();
    }

    
}
