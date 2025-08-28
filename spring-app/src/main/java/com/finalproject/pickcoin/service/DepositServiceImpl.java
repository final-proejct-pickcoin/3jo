package com.finalproject.pickcoin.service;

import com.finalproject.pickcoin.domain.Users;
import com.finalproject.pickcoin.repository.DepositRepository;
import com.finalproject.pickcoin.repository.UsersRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Service
public class DepositServiceImpl implements DepositService {

    @Autowired private DepositRepository repo;
    @Autowired private UsersRepository usersRepository;

    Logger logger = LoggerFactory.getLogger(DepositRepository.class);

    private static BigDecimal toBD(Object v){
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
        throw new IllegalArgumentException("unsupported number type: " + v.getClass());
    }

    @Override @Transactional
    public Map<String,Object> deposit(Long user_id, BigDecimal amount) {
        if (user_id == null || amount == null) throw new IllegalArgumentException("필수 필드 누락");
        if (amount.signum() <= 0) throw new IllegalArgumentException("금액>0");

        Long krwId = repo.krw_asset_id();
        if (krwId == null) throw new IllegalStateException("KRW 자산 미정의");

        repo.ensure_wallet(user_id, krwId);
        repo.select_wallet_for_update(user_id, krwId);      // 잠금
        repo.add_wallet_amount(user_id, krwId, amount);     // +입금

        BigDecimal bal = repo.krw_balance(user_id);

        try{

            Optional<Users> user = usersRepository.findById(user_id.intValue());

            MDC.put("event_type", "krw");
            MDC.put("user_id", user_id.toString());
            MDC.put("email", user.get().getEmail());
            MDC.put("amount", amount.toString());
            MDC.put("action", "deposit");

            logger.info("{} depsit {}", user.get().getEmail(), amount);

        }catch(Exception e){

        }finally{
            MDC.clear();
        }

        return Map.of("ok", true, "type", "deposit", "user_id", user_id, "krw_balance", bal == null ? BigDecimal.ZERO : bal);
    }

    @Override @Transactional
    public Map<String,Object> withdraw(Long user_id, BigDecimal amount) {
        if (user_id == null || amount == null) throw new IllegalArgumentException("필수 필드 누락");
        if (amount.signum() <= 0) throw new IllegalArgumentException("금액>0");

        Long krwId = repo.krw_asset_id();
        if (krwId == null) throw new IllegalStateException("KRW 자산 미정의");

        repo.ensure_wallet(user_id, krwId);
        Map<String,Object> krw = repo.select_wallet_for_update(user_id, krwId); // 잠금
        BigDecimal bal = toBD(krw.get("amount"));
        if (bal.compareTo(amount) < 0) throw new IllegalStateException("KRW 부족");

        repo.add_wallet_amount(user_id, krwId, amount.negate()); // -출금

        BigDecimal newBal = repo.krw_balance(user_id);

        try{

            Optional<Users> user = usersRepository.findById(user_id.intValue());

            MDC.put("event_type", "krw");
            MDC.put("user_id", user_id.toString());
            MDC.put("email", user.get().getEmail());
            MDC.put("amount", amount.toString());
            MDC.put("action", "withdraw");

            logger.info("{} withdraw {}", user.get().getEmail(), amount);

        }catch(Exception e){

        }finally{
            MDC.clear();
        }

        return Map.of("ok", true, "type", "withdraw", "user_id", user_id, "krw_balance", newBal == null ? BigDecimal.ZERO : newBal);
    }

    @Override
    public BigDecimal krw_balance(Long user_id) {
        BigDecimal v = repo.krw_balance(user_id);
        return v == null ? BigDecimal.ZERO : v;
    }
}