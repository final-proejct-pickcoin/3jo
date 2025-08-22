package com.finalproject.pickcoin.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.finalproject.pickcoin.domain.Orders;

@Mapper
public interface TradeRepository {

    // ===============매수 관련=============
    void insert_order(Orders o, int order_type_code, int status_code);
    Long last_id();
    // <============================매수 관련==============================>
    void ensure_wallet(Long user_id, Long asset_id);

    Map<String,Object> select_wallet_for_update(Long user_id, Long asset_id);
    void add_coin_amount(Long user_id, Long asset_id, BigDecimal add_qty);
    void add_wallet_amount(Long user_id, Long asset_id, BigDecimal delta);

    void insert_transaction(Long order_id, BigDecimal price, BigDecimal amount, BigDecimal fee);
    void conclude_order(Long order_id, int status_code);

    Long krw_asset_id();

    void sub_coin_amount(Long user_id, Long asset_id, BigDecimal sub_qty);

    List<Map<String,Object>> holdings(Long user_id);
    BigDecimal krw_balance(Long user_id);
    //사용자 전체 거래 내역
    List<Map<String,Object>> find_trades(Long user_id);
    // 자산별 미체결 거래 내역
    List<Map<String,Object>> asset_unconcluded_orders(Long user_id, Long asset_id);
    // 자산별 체결 거래 내역
    List<Map<String,Object>> asset_concluded_orders(Long user_id, Long asset_id);
    
}
