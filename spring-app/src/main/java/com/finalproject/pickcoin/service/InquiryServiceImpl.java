package com.finalproject.pickcoin.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Inquiry;
import com.finalproject.pickcoin.repository.InquiryRepository;

@Service
public class InquiryServiceImpl implements InquiryService{

    @Autowired private InquiryRepository inquiryRepository;
    
    @Override
    public void insert(Inquiry inquiry){
        inquiryRepository.insert(inquiry);
    }
}
