package com.finalproject.pickcoin.service;

import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;
import com.finalproject.pickcoin.repository.ReportRepository; 

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository; // 주입

    @Transactional
    @Override
    public void submit(Report r) {
    // 상태 기본값 처리
    if (r.getStatus() == null) {
        r.setStatus(ReportStatus.IN_PROGRESS);
    }

    // 중복 체크
    if (reportRepository.exists(r.getReporter_id(), r.getReported_type(), r.getReported_id()) > 0) {
        throw new IllegalStateException("이미 신고한 대상입니다.");
    }

    try {
        reportRepository.insert(r);
    } catch (DuplicateKeyException e) {
        throw new IllegalStateException("이미 신고한 대상입니다.");
    }
}

    @Override
    public List<Report> list(ReportStatus status) {
        return reportRepository.findAll(status);
    }

    @Transactional
    @Override
    public void updateStatus(int reportId, ReportStatus status) {
        reportRepository.updateStatus(reportId, status);
    }

   @Override
    public boolean exists(int reporterId, EntityType reportedType, int reportedId) {
        return reportRepository.exists(reporterId, reportedType, reportedId) > 0;
}
}
