package com.finalproject.pickcoin.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.finalproject.pickcoin.domain.Reply;

@Mapper
public interface ReplyRepository {
    void insert(Reply r);
    List<Reply> findRootsByPostId(@Param("post_id") int postId);
    List<Reply> findChildren(@Param("parent_id") int parentId);
    Integer isReply(@Param("reply_id") int replyId);
    Reply findById(@Param("reply_id") int replyId); 
    void update(@Param("reply_id") int replyId, 
                @Param("user_id") int userId, 
                @Param("content") String content);
    void delete(@Param("reply_id") int replyId, @Param("user_id") int userId);
    
}

