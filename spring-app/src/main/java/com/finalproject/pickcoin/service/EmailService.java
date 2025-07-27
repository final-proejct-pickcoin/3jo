package com.finalproject.pickcoin.service;

public interface EmailService {
    
    void sendVerificationEmail(String to, String token);
}
