package com.finalproject.pickcoin.service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.repository.MypageRepository;
import com.finalproject.pickcoin.domain.Market_item;

@Service
public class MypageServiceImpl implements MypageService {

    @Autowired
    private MypageRepository mypageRepository;

    @Override
    public List<Market_item> find_bookmarked_only(Long user_id) {
        return mypageRepository.find_bookmarked_only(user_id);
    }

    @Override
    public List<Market_item> find_unbookmarked_only(Long user_id) {
        return mypageRepository.find_unbookmarked_only(user_id);
    }

    public Integer getUserIdByEmail(String email){
        return mypageRepository.getUserIdByEmail(email);
    }

    @Override
    public void insert_bookmark(int user_id, int asset_id) {
        mypageRepository.insert_bookmark(user_id, asset_id);
    }

    @Override
    public void delete_bookmark(int user_id, int asset_id) {
        mypageRepository.delete_bookmark(user_id, asset_id);
    }
    
}
