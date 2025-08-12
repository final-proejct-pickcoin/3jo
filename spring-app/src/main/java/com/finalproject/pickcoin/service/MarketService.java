package com.finalproject.pickcoin.service;
import java.util.List;

import com.finalproject.pickcoin.domain.Market_item;



public interface MarketService {

    List<Integer> find_bookmarked_asset(int user_id); // 관심코인 테이블에서 사용자 id를 기준으로 코인 id 검색
    
    List<Market_item> find_asset_and_bookmark(Long user_id); // 관심코인 테이블에서 사용자 id를 기준으로 코인 id 검색하고, 해당 코인의 상세 정보 가져오기
    void insert_bookmark(int user_id, int asset_id); // 관심코인 테이블에 클릭한 코인 id와 사용자 id 정보 넣기

    void delete_bookmark(int user_id, int asset_id); // 관심코인 테이블에서 사용자 id와 코인 id를 기준으로 컬럼 삭제
}
