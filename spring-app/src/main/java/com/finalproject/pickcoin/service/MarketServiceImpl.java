package com.finalproject.pickcoin.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Market_item;
import com.finalproject.pickcoin.repository.MarketRepository;

@Service
public class MarketServiceImpl implements MarketService {
    @Autowired
    private MarketRepository marketRepository;

    @Override
    public List<Integer> find_bookmarked_asset(int userId) {
        // 관심코인 테이블에서 사용자 id를 기준으로 코인 id 검색
        return marketRepository.find_bookmarked_asset(userId);
    }

    @Override
    public List<Market_item> find_asset_and_bookmark(Long user_id) {
        // 관심코인 테이블에서 사용자 id를 기준으로 코인 id 검색하고, 해당 코인의 상세 정보 가져오기
        return marketRepository.find_asset_and_bookmark(user_id);
    }

    @Override
    public void insert_bookmark(int userId, int assetId) {
        // 관심코인 테이블에 클릭한 코인 id와 사용자 id 정보 넣기
        marketRepository.insert_bookmark(userId, assetId);
    }

    @Override
    public void delete_bookmark(int userId, int assetId) {
        // 관심코인 테이블에서 사용자 id와 코인 id를 기준으로 컬럼 삭제
        marketRepository.delete_bookmark(userId, assetId);
    }

}