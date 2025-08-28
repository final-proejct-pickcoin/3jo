package com.finalproject.pickcoin.repository;

import org.apache.ibatis.annotations.Mapper;

import com.finalproject.pickcoin.domain.Inquiry;

@Mapper
public interface InquiryRepository {
    void insert(Inquiry inquiry);
}