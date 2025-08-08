package com.finalproject.pickcoin.repository;

import com.finalproject.pickcoin.domain.Asset;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;


@Mapper
public interface MarketRepository {
    
    public List<Asset> get_coin_list();

}
