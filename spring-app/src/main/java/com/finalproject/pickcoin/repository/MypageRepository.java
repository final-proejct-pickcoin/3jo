package com.finalproject.pickcoin.repository;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;
import org.apache.ibatis.annotations.Param;

import com.finalproject.pickcoin.domain.Market_item;

@Mapper
public interface MypageRepository {

    List<Market_item> find_bookmarked_only(Long user_id);
    List<Market_item> find_unbookmarked_only(Long user_id);

    Integer getUserIdByEmail(@Param("email") String email);

    void insert_bookmark(@Param("user_id") int user_id,
                        @Param("asset_id") int asset_id);

    void delete_bookmark(@Param("user_id") int user_id,
                        @Param("asset_id") int asset_id);
    
}
