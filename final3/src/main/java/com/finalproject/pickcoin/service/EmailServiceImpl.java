package com.finalproject.pickcoin.service;

// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender){
        
    this.mailSender = mailSender;

    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        
        String ip = "http://localhost:8080";
        String tokenReq = "/users/verify?token=";
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("이메일 인증을 완료해주세요.");
            String link = ip + tokenReq + token;
            String content = "<p>회원가입을 완료하려면 아래 링크를 클릭하세요:</p>"
                           + "<a href='" + link + "'>이메일 인증</a>";
            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            // 로깅 또는 예외 처리
        }
    }
    
}
