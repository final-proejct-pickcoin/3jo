package com.finalproject.pickcoin.controller;

import java.util.List;
import java.util.Map;

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

import com.finalproject.pickcoin.domain.Inquiry;
import com.finalproject.pickcoin.domain.Report;
import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;
import com.finalproject.pickcoin.service.InquiryService;
import com.finalproject.pickcoin.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/report")
@CrossOrigin(origins = "${FRONTEND_APP_URL}")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final InquiryService inquiryService;

    Logger logger = LoggerFactory.getLogger(ReportController.class);

     // 신고 생성
    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Report r) {
        reportService.submit(r);

        // 4) inquiry 동시 저장
            Inquiry inq = new Inquiry();
            inq.setAmount(null);                 // 신고는 금액 없음
            inq.setCategory("신고");
            inq.setUser_id(r.getReporter_id());
            inq.setStatus("신규");
        inquiryService.insert(inq);

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

 /** 안 읽은 신고 개수 → 종 배지 */
    @GetMapping("/alerts/count")
    public ResponseEntity<?> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", reportService.getUnreadCount()));
    }

    /** 안 읽은 신고 목록 */
    @GetMapping("/alerts/unread")
    public ResponseEntity<List<Report>> getUnread(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(reportService.getUnread(limit));
    }

    /** 모두 읽음 처리 */
    @PatchMapping("/alerts/read-all")
    public ResponseEntity<?> markAllRead() {
        int affected = reportService.markAllRead();
        return ResponseEntity.ok(Map.of("affected", affected));
    }

    /** 개별 읽음 처리 */
    @PatchMapping("/alerts/{id}/read")
    public ResponseEntity<?> markOneRead(@PathVariable int id) {
        reportService.markOneRead(id);
        return ResponseEntity.ok().build();
    }





}