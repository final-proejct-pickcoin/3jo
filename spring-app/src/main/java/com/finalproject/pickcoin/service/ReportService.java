package com.finalproject.pickcoin.service;

import java.util.List;

import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;

public interface ReportService {
    void submit(Report report);
    List<Report> list(ReportStatus status);
    void updateStatus(int reportId, ReportStatus status);
    boolean exists(int reporterId, EntityType reportedType, int reportedId);

    // 알림 관련
    int getUnreadCount(); // 안 읽은 신고 개수
    List<Report> getUnread(int limit); // 최근 읽지 않은 신고
    int markAllRead(); // 모두 읽음 처리
    void markOneRead(int reportId); // 개별 읽음 처리
    
}