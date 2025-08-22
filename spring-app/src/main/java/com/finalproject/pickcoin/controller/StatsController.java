package com.finalproject.pickcoin.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.service.StatsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /**
     * 커뮤니티 통계 API
     * GET /community/stats
     */
    @GetMapping("/community/stats")
    public Map<String, Object> stats() {
        return statsService.getCommunityStats();
    }
}
