package com.finalproject.pickcoin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Community;
import com.finalproject.pickcoin.service.CommunityService;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/community")
public class CommunityController {
    
    @Autowired
    private CommunityService communityService;

    // 전체조회
    @GetMapping("/findAll")
    public List<Community> findAll(){
        System.out.println("커뮤니티 전체 조회 진입");
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
        communityService.insert(community);
        return community; 
    }

    // 수정
    @PutMapping("/{id}")
    public void update(@PathVariable("id") Integer id, @RequestBody Community community) {
    System.out.println("===== 수정 요청 ID: + id");
    System.out.println("===== 수정 요청 BODY: " + community);
    community.setPost_id(id);
    communityService.update(community);
}

    // 삭제
    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Integer id) {
        communityService.delete(id);
    }

    // 댓글 좋아요 
    @PutMapping("/{id}/like")
    public void like(@PathVariable("id") Integer id){
        System.out.println("좋아요 요청 post_id = " + id);
        communityService.increaseLikeCount(id);
    }
}
