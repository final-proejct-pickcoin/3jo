package com.finalproject.pickcoin.repository;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;

@Mapper
public interface ReportRepository {
    void insert(Report report);

    int exists(@Param("reporter_id") int reporterId,
                @Param("reported_type") EntityType reportedType,
                @Param("reported_id") int reportedId);

    List<Report> findAll(@Param("status") ReportStatus status);

    void updateStatus(@Param("report_id") int reportId,
                      @Param("status") ReportStatus status);

//8-22 상태별 카운트
int countByStatus(@Param("status") ReportStatus status);

//8-22 최근 신고건
List<Report> findRecent(@Param("status") ReportStatus status,
                            @Param("limit") int limit);

 // ===== 알림(종)용 메서드 =====
int countUnread();                            // admin_seen = 0 개수
List<Report> findUnread(@Param("limit") int limit); // 최근 미확인 신고
int markAllRead();                            // 전부 읽음 처리
int markOneRead(@Param("report_id") int reportId);  // 개별 읽음 처리

}

