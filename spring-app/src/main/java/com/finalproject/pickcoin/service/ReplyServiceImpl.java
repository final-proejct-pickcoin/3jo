package com.finalproject.pickcoin.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Reply;
import com.finalproject.pickcoin.repository.ReplyRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReplyServiceImpl implements ReplyService {

    private final ReplyRepository repo;

    /**
     * 댓글/대댓글 등록
     * - parent_id == null  -> 루트 댓글
     * - parent_id != null  -> 대댓글
     * - 대댓글의 대댓글(2단계 이상)은 금지
     */
    @Transactional
    @Override
    public void addReply(Reply r) {
        if (r.getParent_id() != null) {
            Integer parentIsReply = repo.isReply(r.getParent_id());
            if (parentIsReply != null && parentIsReply == 1) {
                throw new IllegalStateException("대댓글에는 또 대댓글을 달 수 없습니다.");
            }
        }

        // 최소 유효성 체크
        if (r.getPost_id() == null && r.getParent_id() == null) {

            throw new IllegalArgumentException("post_id가 필요합니다.");
        }
        if (r.getUser_id() == null) {
            throw new IllegalArgumentException("user_id가 필요합니다.");
        }
        if (r.getContent() == null || r.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("content가 비어 있습니다.");
        }

        repo.insert(r);
    }

    

    @Override
    public List<Reply> listRoots(int postId) {
        return repo.findRootsByPostId(postId);
    }

    @Override
    public List<Reply> listChildren(int parentId) {
        return repo.findChildren(parentId);
    }

    @Override
    @Transactional
    public void update(int replyId, int userId, String content) {
        repo.update(replyId, userId, content);
    }

    @Transactional
    @Override
    public void delete(int replyId, int userId) {
        repo.delete(replyId, userId);
    }
}
