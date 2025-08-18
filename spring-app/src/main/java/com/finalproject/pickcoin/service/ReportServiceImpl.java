package com.finalproject.pickcoin.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Inquiry;
import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;
import com.finalproject.pickcoin.repository.InquiryRepository;
import com.finalproject.pickcoin.repository.ReportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final InquiryRepository inquiryRepository;
    private final ReportRepository reportRepository;

    @Transactional
    @Override
    public void submit(Report r) {
        // 1) 상태 기본값
        if (r.getStatus() == null) {
            r.setStatus(ReportStatus.IN_PROGRESS);
        }

        // 2) 중복 체크
        if (reportRepository.exists(r.getReporter_id(), r.getReported_type(), r.getReported_id()) > 0) {
            throw new IllegalStateException("이미 신고한 대상입니다.");
        }

        try {
            // 3) report 저장
            // Report 엔티티의 createdAt은 Date 타입(@Temporal)이라서 굳이 세팅 안 해도 OK.
            // DB default/Trigger/Mapper COALESCE(NOW()) 중 하나가 채워줄 겁니다.
            reportRepository.insert(r);

            // 4) inquiry 동시 저장
            Inquiry inq = new Inquiry();
            inq.setAmount(null);                 // 신고는 금액 없음
            inq.setCategory("신고");
            inq.setStatus("신규"); 
            inq.setClosedAt(null);
            // Inquiry.createdAt 은 @CreationTimestamp라 생략해도 됨.
            // MyBatis XML에서 COALESCE(NOW())를 쓰는 경우엔 아래 줄을 써도 됩니다.
            // inq.setCreatedAt(LocalDateTime.now());

            // 사용자 필드명은 snake_case → setter 이름도 setUser_id
            inq.setUser_id(r.getReporter_id());  // 대상 기준이면 r.getReported_id()

            inquiryRepository.insert(inq);

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
