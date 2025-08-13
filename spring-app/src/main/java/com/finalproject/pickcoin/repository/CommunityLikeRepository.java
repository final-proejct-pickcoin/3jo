package com.finalproject.pickcoin.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.finalproject.pickcoin.domain.Community_Likes;

@Mapper
public interface CommunityLikeRepository {

    void insertLike(Community_Likes like);
    
    int isLikedByUser(@Param("post_id") int postId, @Param("user_id") int userId);
    
    int countLikesByPostId(@Param("post_id") int postId);
    
    void deleteLike(Community_Likes like); // 선택사항

    List<Integer> findPostIdsByUser(@Param("user_id") int userId);
}
