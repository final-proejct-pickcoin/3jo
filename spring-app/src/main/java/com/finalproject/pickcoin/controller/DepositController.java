// src/main/java/com/finalproject/pickcoin/controller/DepositController.java
package com.finalproject.pickcoin.controller;

import com.finalproject.pickcoin.domain.Inquiry;
import com.finalproject.pickcoin.service.DepositService;
import com.finalproject.pickcoin.service.InquiryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
@CrossOrigin(origins = "*")
public class DepositController {

    @Autowired private DepositService depositService;
    @Autowired private InquiryService inquiryService;

    /** 입금 (예: POST /api/deposit?user_id=3&amount=250000) */
    @PostMapping("/deposit")
    public Map<String,Object> deposit(@RequestParam("user_id") Long user_id,
                                        @RequestParam("amount") BigDecimal amount) {
        
        Inquiry inq = new Inquiry();
        inq.setAmount(amount.doubleValue());
        inq.setCategory("입금");
        inq.setUser_id(user_id.intValue());
        inq.setStatus("신규");
        inquiryService.insert(inq);

        return depositService.deposit(user_id, amount);
    }

    /** 출금 (예: POST /api/deposit/withdraw?user_id=3&amount=50000) */
    @PostMapping("/withdraw")
    public Map<String,Object> withdraw(@RequestParam("user_id") Long user_id,
                                        @RequestParam("amount") BigDecimal amount) {

        Inquiry inq = new Inquiry();
        inq.setAmount(amount.doubleValue());
        inq.setCategory("출금");
        inq.setUser_id(user_id.intValue());
        inq.setStatus("신규");
        inquiryService.insert(inq);
        return depositService.withdraw(user_id, amount);
    }

    /** 잔액 조회 (예: GET /api/deposit/balance?user_id=3) */
    @GetMapping("/balance")
    public Map<String,Object> balance(@RequestParam("user_id") Long user_id) {
        return Map.of("ok", true, "user_id", user_id, "krw_balance", depositService.krw_balance(user_id));
    }
}