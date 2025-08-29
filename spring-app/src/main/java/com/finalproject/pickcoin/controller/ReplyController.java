package com.finalproject.pickcoin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finalproject.pickcoin.domain.Reply;
import com.finalproject.pickcoin.service.ReplyService;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${FRONTEND_APP_URL}")
@RestController
@RequestMapping("/community")
@RequiredArgsConstructor
public class ReplyController {

    private final ReplyService replyService;

    /**
     * 루트 댓글 등록 (게시글에 직접 달리는 댓글)
     * POST /community/{postId}/replies
     * Body: { "user_id": 1, "content": "댓글 내용" }
     */
    @PostMapping("/{postId}/replies")
    public ResponseEntity<Void> addRoot(
            @PathVariable int postId,
            @RequestBody Reply r
    ) {
        r.setPost_id(postId);
        r.setParent_id(null);
        replyService.addReply(r);
        return ResponseEntity.ok().build();
    }

    /**
     * 대댓글 등록 (댓글의 댓글, 1단계만 허용)
     * POST /community/replies/{parentId}
     * Body: { "post_id": 1, "user_id": 1, "content": "대댓글 내용" }
     *  - post_id는 프런트에서 함께 넘겨주면 좋습니다(백엔드 검증/로깅 용).
     */
    @PostMapping("/replies/{parentId}")
    public ResponseEntity<Void> addChild(
            @PathVariable int parentId,
            @RequestBody Reply r
    ) {
        r.setParent_id(parentId);
        replyService.addReply(r);
        return ResponseEntity.ok().build();
    }

    /**
     * 특정 게시글의 루트 댓글 목록 조회
     * GET /community/{postId}/replies
     */
    @GetMapping("/{postId}/replies")
    public ResponseEntity<List<Reply>> listRoots(@PathVariable int postId) {
        return ResponseEntity.ok(replyService.listRoots(postId));
    }

    /**
     * 특정 댓글의 대댓글 목록 조회
     * GET /community/replies/{parentId}/children
     */
    @GetMapping("/replies/{parentId}/children")
    public ResponseEntity<List<Reply>> listChildren(@PathVariable int parentId) {
        return ResponseEntity.ok(replyService.listChildren(parentId));
    }

    /** 댓글/대댓글 수정 (본인만)
     *  PUT /community/replies/{replyId}?userId=1&content=새내용
     */
    @PutMapping("/replies/{replyId}")
    public ResponseEntity<Void> update(@PathVariable int replyId,
                                       @RequestParam("userId") int userId,
                                       @RequestParam("content") String content) {
        replyService.update(replyId, userId, content);
        return ResponseEntity.ok().build();
    }

    /**
     * 댓글 삭제 (본인만 가능)
     * DELETE /community/replies/{replyId}?userId=1
     */
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> delete(
            @PathVariable int replyId,
            @RequestParam("userId") int userId
    ) {
        replyService.delete(replyId, userId);
        return ResponseEntity.ok().build();
    }
}
