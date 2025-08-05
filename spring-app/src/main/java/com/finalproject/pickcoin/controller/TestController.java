package com.finalproject.pickcoin.controller;

import org.slf4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class TestController {

    Logger logger = org.slf4j.LoggerFactory.getLogger(TestController.class);
    
    @RequestMapping("/test")
    public void test() {
        logger.info("서버껐다키기");
    }
}
