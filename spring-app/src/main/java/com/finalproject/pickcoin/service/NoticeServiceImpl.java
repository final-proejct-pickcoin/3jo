package com.finalproject.pickcoin.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Notice;
import com.finalproject.pickcoin.repository.NoticeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;

    //사용자
    @Override
    @Transactional(readOnly = true)
    public Optional<Notice> latestPublic() {
        return Optional.ofNullable(noticeRepository.findLatestActive());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notice> listPublic(int limit) {
        return noticeRepository.findActiveList(limit);
    }


    //관리자
    @Override
    @Transactional(readOnly = true)
    public List<Notice> list() {
        return noticeRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Notice get(Integer id) {
        Notice n = noticeRepository.findById(id);
        if (n == null) {
            throw new IllegalArgumentException("Notice not found: " + id);
        }
        return n;
    }

    @Override
    @Transactional
    public Notice create(Notice n) {
        // created_at / updated_at 은 XML에서 NOW(6)로 처리
        noticeRepository.insert(n);               // useGeneratedKeys 로 notice_id 세팅됨
        return noticeRepository.findById(n.getNotice_id());
    }

    @Override
    @Transactional
    public Notice update(Integer id, Notice n) {
        // 안전하게 PK 고정
        n.setNotice_id(id);
        // 존재 확인(Optional)
        if (noticeRepository.findById(id) == null) {
            throw new IllegalArgumentException("Notice not found: " + id);
        }
        noticeRepository.update(n);
        return noticeRepository.findById(id);
    }

    @Override
    @Transactional
    public void setActive(Integer id, boolean active) {
        // 존재 확인(Optional)
        if (noticeRepository.findById(id) == null) {
            throw new IllegalArgumentException("Notice not found: " + id);
        }
        noticeRepository.updateActive(id, active);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        // 존재 확인(Optional)
        if (noticeRepository.findById(id) == null) {
            throw new IllegalArgumentException("Notice not found: " + id);
        }
        noticeRepository.delete(id);
    }
}
