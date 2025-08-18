package com.finalproject.pickcoin.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finalproject.pickcoin.domain.Community;
import com.finalproject.pickcoin.service.CommunityLikeService;
import com.finalproject.pickcoin.service.CommunityService;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/community")
public class CommunityController {

    @Autowired
    private CommunityService communityService;

    @Autowired
    private CommunityLikeService communityLikeService;

    Logger logger = LoggerFactory.getLogger(CommunityController.class);

    // 전체조회
    @GetMapping("/findAll")
    public List<Community> findAll() {
        return communityService.findAll();
    }

    // 단건 조회
    @GetMapping("/{id}")
    public Community findById(@PathVariable("id") Integer id) {        
        return communityService.findById(id);
    }

    // 등록
    @PostMapping("/insert")
    public Community insert(@RequestBody Community community) {

        try{
            MDC.put("event_type", "community");
            logger.info("[커뮤니티 작성] content={}, user={}", community.getContent(), community.getUser_id());
        }finally{
            MDC.remove("event_type");
        }


        communityService.insert(community);
        return community;
    }

    // 수정 - 본인만 가능
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable("id") Integer id, @RequestBody Community community) {
        Community existing = communityService.findById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existing.getUser_id().equals(community.getUser_id())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("본인만 수정할 수 있습니다.");
        }

        try{
            MDC.put("event_type", "community");
            logger.info("[커뮤니티 수정] content={}, user={}", community.getContent(), community.getUser_id());
        }finally{
            MDC.remove("event_type");
        }

        community.setPost_id(id);
        communityService.update(community);
        return ResponseEntity.ok().build();
    }

    // 삭제 - 본인만 가능
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Integer id, @RequestParam("userId") Integer userId) {
        Community existing = communityService.findById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existing.getUser_id().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("본인만 삭제할 수 있습니다.");
        }

        try{
            MDC.put("event_type", "community");
            logger.info("[커뮤니티 작성] cummunity_id", id);
        }finally{
            MDC.remove("event_type");
        }

        communityService.delete(id);
        return ResponseEntity.ok().build();
    }

    // 좋아요 토글 (좋아요 / 취소)
    @PutMapping("/{postId}/like/{userId}")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable int postId, @PathVariable int userId) {
        boolean liked = communityLikeService.toggleLike(postId, userId); // true=좋아요, false=취소
        int count = communityLikeService.countLikesByPostId(postId);

        return ResponseEntity.ok(
            Map.of(
                "liked", liked,
                "like_count", count
            )
        );
    }

    // 내가 좋아요한 게시글 목록
    @GetMapping("/liked")
    public ResponseEntity<List<Integer>> getMyLikedPosts(@RequestParam int userId) {
        List<Integer> likedPostIds = communityLikeService.getLikePostIdByUser(userId);
        return ResponseEntity.ok(likedPostIds);
    }
}
