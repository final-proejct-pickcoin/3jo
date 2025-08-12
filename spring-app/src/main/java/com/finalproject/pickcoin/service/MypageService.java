package com.finalproject.pickcoin.service;

import java.util.List;
import com.finalproject.pickcoin.domain.Market_item;

public interface MypageService {

    List<Market_item> find_bookmarked_only(Long user_id);
    List<Market_item> find_unbookmarked_only(Long user_id);

    void insert_bookmark(int user_id, int asset_id);
    void delete_bookmark(int user_id, int asset_id);
    
}
