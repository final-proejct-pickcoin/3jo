package com.finalproject.pickcoin.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ResponseStatusException;

import com.finalproject.pickcoin.domain.Notice;
import com.finalproject.pickcoin.service.NoticeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/announcements")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // 사용자(읽기 전용)
     @GetMapping("/public/latest")
        public ResponseEntity<Notice> latestPublic() {
            return noticeService.latestPublic()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NO_CONTENT).build());
}

    // 목록 (active=true만, 최신순, limit 지원)
    @GetMapping("/public")
        public List<Notice> listPublic(@RequestParam(defaultValue = "20") int limit) {
            return noticeService.listPublic(limit);
}


    //관리자

    // 전체 목록 (모두 접근 허용)
    @GetMapping
    public List<Notice> list() {
        return noticeService.list();
    }

    // 단건 조회 (모두 접근 허용)
    @GetMapping("/{id}")
    public Notice get(@PathVariable Integer id) {
        return noticeService.get(id);
    }

    // 공지 생성  관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Notice> create(@RequestBody Notice notice) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.create(notice));
    }

    // 공지 수정  관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Notice> update(@PathVariable Integer id, @RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.update(id, notice));
    }

    // 공지 활성/비활성 토글  관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Integer id, @RequestParam boolean active) {
        noticeService.setActive(id, active);
        return ResponseEntity.ok().build();
    }

    // 공지 삭제  관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        noticeService.delete(id);
        return ResponseEntity.ok().build();
    }
}
