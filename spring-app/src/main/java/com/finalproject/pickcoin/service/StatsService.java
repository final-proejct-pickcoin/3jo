package com.finalproject.pickcoin.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.controller.StatsController;
import com.finalproject.pickcoin.repository.CommunityRepository;
import com.finalproject.pickcoin.repository.UsersRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UsersRepository usersRepository;          
    private final CommunityRepository communityRepository;  

    /**
     * 커뮤니티 통계
     * - activeUsers : users 테이블 총 인원
     * - postsToday  : community.created_at이 오늘인 글 수 (DB 로컬 타임 기준)
     * - totalPosts  : community 총 글 수
     * - onlineNow   : 현재 접속자(미집계이므로 null)
     */
     public Map<String, Object> getCommunityStats() {
        long activeUsers = usersRepository.count();                // 활동 회원
        int  postsToday  = communityRepository.countPostsToday();  // 오늘의 게시글
        long totalPosts  = communityRepository.countTotalPosts();  // 누적 게시글
        int  onlineNow   = StatsController.StatsWebSocket.getOnlineNow(); // ✅ 현재 접속자

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeUsers", activeUsers);   // 현재 회원 수
        stats.put("postsToday", postsToday);     // 오늘 게시글 수
        stats.put("totalPosts", totalPosts);     // 전체 누적 게시글 수
        stats.put("onlineNow", onlineNow);       // ✅ 접속자 수

        return stats;
    }
}
