package com.finalproject.pickcoin.service;

<<<<<<< HEAD
import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Community;

@Service
public class CommunityServiceImpl implements CommunityService {

    @Autowired
    private SqlSession sqlSession; // DAO 대신 SqlSession 직접 사용

    @Override
    public List<Community> findAll() {
        return sqlSession.selectList("com.finalproject.pickcoin.repository.CommunityRepository.findAll");
    }

    @Override
    public Community findById(Integer post_id) {
        return sqlSession.selectOne("com.finalproject.pickcoin.repository.CommunityRepository.findById", post_id);
    }

    @Override
    public void insert(Community community) {
        sqlSession.insert("com.finalproject.pickcoin.repository.CommunityRepository.insert", community);
    }

    @Override
    public void update(Community community) {
        sqlSession.update("com.finalproject.pickcoin.repository.CommunityRepository.update", community);
    }

    @Override
    public void delete(Integer post_id) {
        sqlSession.delete("com.finalproject.pickcoin.repository.CommunityRepository.delete", post_id);
    }

    @Override
    public void increaseLikeCount(int post_id){
        sqlSession.update("com.finalproject.pickcoin.repository.CommunityRepository.increaseLikeCount", post_id);
    }
=======
public class CommunityServiceImpl implements CommunityService {
    
>>>>>>> feature_jh
}
