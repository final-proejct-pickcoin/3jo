package com.finalproject.pickcoin.service;

import java.util.List;

public interface CommunityLikeService {

    /**
     * 좋아요 추가
     */
    boolean likePost(int postId, int userId);

    /**
     * 좋아요 취소
     */
    void unlikePost(int postId, int userId);

    /**
     * 특정 사용자가 특정 게시글을 좋아요했는지 여부
     */
    boolean isLikedByUser(int postId, int userId);

    /**
     * 특정 게시글의 총 좋아요 수
     */
    int countLikesByPostId(int postId);

    /**
     * 특정 사용자가 좋아요한 게시글 ID 목록
     */
    List<Integer> getLikePostIdByUser(int userId);

    /**
     * 좋아요 토글 (이미 좋아요면 취소, 아니면 추가)
     * @return true = 좋아요됨, false = 좋아요 취소됨
     */
    default boolean toggleLike(int postId, int userId) {
        if (isLikedByUser(postId, userId)) {
            unlikePost(postId, userId);
            return false;
        } else {
            likePost(postId, userId);
            return true;
        }
    }
}
