package com.finalproject.pickcoin.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Community_Likes;
import com.finalproject.pickcoin.repository.CommunityLikeRepository;
import com.finalproject.pickcoin.repository.CommunityRepository;

@Service
public class CommunityLikeServiceImpl implements CommunityLikeService {

    @Autowired
    private CommunityLikeRepository communityLikeRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Override
    @Transactional
    public boolean likePost(int postId, int userId) {
        Community_Likes like = new Community_Likes();
        like.setPost_id(postId);
        like.setUser_id(userId);
        like.setCreatedAt(new Date());

        communityLikeRepository.insertLike(like);
        communityRepository.increaseLikeCount(postId);
        return true;
    }

    @Override
    @Transactional
    public void unlikePost(int postId, int userId) {
        Community_Likes like = new Community_Likes();
        like.setPost_id(postId);
        like.setUser_id(userId);

        communityLikeRepository.deleteLike(like);
        communityRepository.increaseLikeCount(postId);
    }

    @Override
    public boolean isLikedByUser(int postId, int userId) {
        return communityLikeRepository.isLikedByUser(postId, userId) > 0;
    }

    @Override
    public int countLikesByPostId(int postId) {
        return communityLikeRepository.countLikesByPostId(postId);
    }

    @Override
    public List<Integer> getLikePostIdByUser(int userId) {
        return communityLikeRepository.findPostIdsByUser(userId);
    }
}
