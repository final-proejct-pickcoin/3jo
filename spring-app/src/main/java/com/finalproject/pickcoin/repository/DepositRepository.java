package com.finalproject.pickcoin.repository;

import org.apache.ibatis.annotations.Mapper;
import java.math.BigDecimal;
import java.util.Map;

@Mapper
public interface DepositRepository {
    Long krw_asset_id();

    void ensure_wallet(Long user_id, Long asset_id);
    Map<String,Object> select_wallet_for_update(Long user_id, Long asset_id);
    void add_wallet_amount(Long user_id, Long asset_id, BigDecimal delta);

    BigDecimal krw_balance(Long user_id);
}