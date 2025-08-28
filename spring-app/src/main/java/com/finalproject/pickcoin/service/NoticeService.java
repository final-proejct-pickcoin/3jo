package com.finalproject.pickcoin.service;

import java.util.List;
import java.util.Optional;

import com.finalproject.pickcoin.domain.Notice;

public interface NoticeService {

    //사용자 
    Optional<Notice> latestPublic();
    List<Notice> listPublic(int limit);

    //관리자
    List<Notice> list();
    Notice get(Integer id);
    Notice create(Notice n);
    Notice update(Integer id, Notice n);
    void setActive(Integer id, boolean active);
    void delete(Integer id);
    
    
}
