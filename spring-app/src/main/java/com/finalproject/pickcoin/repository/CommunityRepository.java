package com.finalproject.pickcoin.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.finalproject.pickcoin.domain.Community;

@Mapper
public interface CommunityRepository {
    List<Community> findAll();
    Community findById(@Param("post_id") Integer post_id); 
    void insert(Community community);
    void update(Community community);
    void delete(@Param("post_id") Integer post_id);        
    void increaseLikeCount(@Param("post_id") Integer post_id); 
}

