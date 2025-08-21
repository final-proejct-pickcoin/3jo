package com.finalproject.pickcoin.service;

import java.io.IOException;
import java.util.List;

import com.finalproject.pickcoin.domain.Community;
import com.finalproject.pickcoin.domain.KeywordCount;

public interface CommunityService {
    List<Community> findAll();
    Community findById(Integer postId);
    void insert(Community community);
    void update(Community community);
    void delete(Integer postId);
    void increaseLikeCount(int postid);
    List<KeywordCount> getPopularKeword() throws IOException;
    void indexPostToElasticsearch(Community community) throws IOException;
}
