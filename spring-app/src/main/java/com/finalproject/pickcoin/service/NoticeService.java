package com.finalproject.pickcoin.service;

import java.util.List;

import com.finalproject.pickcoin.domain.Notice;

public interface NoticeService {
    List<Notice> list();
    Notice get(Integer id);
    Notice create(Notice n);
    Notice update(Integer id, Notice n);
    void setActive(Integer id, boolean active);
    void delete(Integer id);
    
    
}
