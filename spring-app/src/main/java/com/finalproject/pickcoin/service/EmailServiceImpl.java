package com.finalproject.pickcoin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
    @Value("${APP_BASE_URL:http://localhost:8080}")
    private String baseUrl;

    Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Override
    public void sendVerificationEmail(String to, String token) {
        
        if (to.contains(",")) {
            to = to.split(",")[0].trim();
            logger.warn("이메일에 콤마가 포함되어 첫 번째 주소만 사용: {}", to);
        }
        
        String tokenReq = "/users/verify?token=";
        
        // logger.info("메일인증 이메일 전송 메서드 호출");

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject("이메일 인증을 완료해주세요.");
            String link = baseUrl + tokenReq + token;
            String content = "<p>회원가입을 완료하려면 아래 링크를 클릭하세요:</p>"
                           + "<a href='" + link + "'>이메일 인증</a>";
            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            // logger.info("메일전송 에러:"+e);
            e.printStackTrace();
        }
    }
    
}
