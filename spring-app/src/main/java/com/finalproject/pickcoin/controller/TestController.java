package com.finalproject.pickcoin.controller;

import org.slf4j.Logger;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
public class TestController {

    Logger logger = org.slf4j.LoggerFactory.getLogger(TestController.class);
    
    @RequestMapping("/test")
    public String test() {
        logger.info("서버껐다키기");
        return "test";
    }

    @GetMapping("/user/log-test")
    public String testLog() {
        logger.info("유저 로그 테스팅, 사용자={}, 액션= 로그조회, ip=127.0.0.1", "dubbyUser");
        return "ok";
    }
    
}
