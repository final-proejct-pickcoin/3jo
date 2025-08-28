package com.finalproject.pickcoin.service;

import java.util.List;

import com.finalproject.pickcoin.domain.Reply;

public interface ReplyService {
     //댓글과 대댓글 공용 등록
    void addReply(Reply r);

    //특정 게시글의 루트 댓글 목록
    List<Reply> listRoots(int post_id);

    //특정 댓글의 대댓글 목록
    List<Reply> listChildren(int parentId); 

    //본인 댓글 수정
    void update(int replyId, int userId, String content);

    //본인 댓글 삭제
    void delete(int replyId, int userId);
    
}
