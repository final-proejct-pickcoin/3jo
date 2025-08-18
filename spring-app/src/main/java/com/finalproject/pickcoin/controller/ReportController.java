package com.finalproject.pickcoin.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;
import com.finalproject.pickcoin.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/report")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    Logger logger = LoggerFactory.getLogger(ReportController.class);

     // 신고 생성
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Report r) {
        reportService.submit(r);

        try{
            MDC.put("event_type", "report");
            logger.info("[신고 발생] reporter_id={}, reported_id={}", r.getReporter_id(), r.getReported_id());
        }finally{
            MDC.remove("event_type");
        }
        return ResponseEntity.ok().build();
    }

    // 목록 (status 없으면 전체)
    @GetMapping
    public List<Report> list(@RequestParam(required = false) ReportStatus status) {
        return reportService.list(status);
    }

    // 상태 변경 (IN_PROGRESS/COMPLETED/REJECTED)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> update(@PathVariable int id, @RequestParam ReportStatus status) {
        reportService.updateStatus(id, status);
        return ResponseEntity.ok().build();
    }

    // 중복 신고 등 에러 응답
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> dup(IllegalStateException e) {
        return ResponseEntity.status(409).body(e.getMessage());
    }

    // 신고 여부 확인 API
    @GetMapping("/exists")
   public boolean exists(@RequestParam("reporter_id") int reporterId,
                      @RequestParam("reported_type") EntityType reportedType,
                      @RequestParam("reported_id") int reportedId) {
    return reportService.exists(reporterId, reportedType, reportedId);
}







}
