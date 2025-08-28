package com.finalproject.pickcoin.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import com.finalproject.pickcoin.domain.Market_item;



@Mapper
public interface MarketRepository {

    List<Integer> find_bookmarked_asset(int user_id);
    List<Market_item> find_asset_and_bookmark(Long user_id);

    void insert_bookmark(int user_id, int asset_id);

    void delete_bookmark(int user_id, int asset_id);

    List<Market_item> get_assets_id(String asset_symbol);

}
