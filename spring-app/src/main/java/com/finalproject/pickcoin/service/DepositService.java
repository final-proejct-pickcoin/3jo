package com.finalproject.pickcoin.service;

import java.math.BigDecimal;
import java.util.Map;

public interface DepositService {
    Map<String,Object> deposit(Long user_id, BigDecimal amount);
    Map<String,Object> withdraw(Long user_id, BigDecimal amount);
    BigDecimal krw_balance(Long user_id);
}