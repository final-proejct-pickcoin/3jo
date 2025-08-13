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
    
}
