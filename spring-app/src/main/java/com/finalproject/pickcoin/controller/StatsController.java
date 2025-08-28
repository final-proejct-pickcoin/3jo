package com.finalproject.pickcoin.controller;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finalproject.pickcoin.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /**
     * 커뮤니티 통계 API (초기 로딩용)
     * GET /community/stats
     */
    @GetMapping("/community/stats")
    public Map<String, Object> stats() {
        return statsService.getCommunityStats();
    }

    /**
     * 실시간 통계 WebSocket
     * ws://localhost:8080/ws/stats
     */
    @Component
    @ServerEndpoint("/ws/stats")
    public static class StatsWebSocket {
        private static final Set<Session> sessions = new CopyOnWriteArraySet<>();
        private static final ObjectMapper mapper = new ObjectMapper();

        private static StatsService statsService;

        // ✅ static 필드에 주입
        @Autowired
        public void setStatsService(StatsService service) {
            StatsWebSocket.statsService = service;
        }

        @OnOpen
        public void onOpen(Session session) {
            sessions.add(session);
            System.out.println("✅ Stats WebSocket 연결됨: " + session.getId());
            // 접속자가 늘어나면 즉시 push
            broadcast(statsService.getCommunityStats());
        }

        @OnClose
        public void onClose(Session session) {
            sessions.remove(session);
            System.out.println("❌ Stats WebSocket 종료: " + session.getId());
            // 접속자가 줄어들면 즉시 push
            broadcast(statsService.getCommunityStats());
        }

        @OnError
        public void onError(Session session, Throwable throwable) {
            System.out.println("⚠️ Stats WebSocket 에러: " + throwable.getMessage());
        }

        @OnMessage
        public void onMessage(String message, Session session) {
            System.out.println("📩 클라이언트 메시지: " + message);
        }

        // 통계 브로드캐스트 메서드
        public static void broadcast(Object stats) {
            try {
                String json = mapper.writeValueAsString(stats);
                for (Session session : sessions) {
                    if (session.isOpen()) {
                        session.getBasicRemote().sendText(json);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // ✅ 현재 접속자 수 반환
        public static int getOnlineNow() {
            return sessions.size();
        }
    }
}
