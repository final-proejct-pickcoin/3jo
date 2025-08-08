package com.finalproject.pickcoin.repository;
import com.finalproject.pickcoin.domain.Asset;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface MarketRepository {
    
    public List<Asset> get_coin_list();

}
