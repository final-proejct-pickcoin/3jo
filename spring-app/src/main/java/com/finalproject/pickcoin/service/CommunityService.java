package com.finalproject.pickcoin.service;

import java.util.List;

import com.finalproject.pickcoin.domain.Community;

public interface CommunityService {
    List<Community> findAll();
    Community findById(Integer postId);
    void insert(Community community);
    void update(Community community);
    void delete(Integer postId);
    void increaseLikeCount(int postid);
    
}
