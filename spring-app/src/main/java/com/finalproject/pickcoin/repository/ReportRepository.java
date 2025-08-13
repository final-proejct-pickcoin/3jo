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
}
