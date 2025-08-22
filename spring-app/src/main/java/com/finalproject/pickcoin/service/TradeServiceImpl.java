package com.finalproject.pickcoin.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finalproject.pickcoin.domain.Orders;
import com.finalproject.pickcoin.domain.PlaceOrderRequest;
import com.finalproject.pickcoin.enums.OrderStatus;
import com.finalproject.pickcoin.enums.TradeType;
import com.finalproject.pickcoin.repository.TradeRepository;

@Service
public class TradeServiceImpl implements TradeService {

    @Autowired
    private TradeRepository repo;

    private static final BigDecimal FEE_RATE = new BigDecimal("0.001");
    private static final int SCALE_MONEY = 0, SCALE_CRYPTO = 8;

    // Helper: BigDecimal 변환
    private static BigDecimal toBD(Object v) {
    if (v == null) return BigDecimal.ZERO;
    if (v instanceof BigDecimal) return (BigDecimal) v;
    if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
    throw new IllegalArgumentException("unsupported number type: " + v.getClass());
}

    //===============매수 관련=============
    @Override @Transactional
    public Map<String,Object> market_buy(PlaceOrderRequest req) {

    int UNCONCLUDED = OrderStatus.UNCONCLUDED.ordinal();
    int CONCLUDED   = OrderStatus.CONCLUDED.ordinal();
    int ORDER_TYPE_BUY     = TradeType.BUY.ordinal();
    
    // 0) 검증
    if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
        throw new IllegalArgumentException("필수 필드 누락");
    if (req.amount.signum()<=0 || req.price.signum()<=0)
        throw new IllegalArgumentException("수량/가격>0");

    // 1) 주문 생성 (enum → tinyint: BUY=0, SELL=1 / UNCONCLUDED=0, CONCLUDED=1 가정)
    Orders o = new Orders();
    o.setUser_id(req.user_id.intValue());
    o.setAsset_id(req.asset_id.intValue());
    o.setOrder_type(com.finalproject.pickcoin.enums.TradeType.BUY);
    o.setPrice(req.price.doubleValue());
    o.setAmount(req.amount.doubleValue());
    o.setUnconcluded_amount(req.amount.doubleValue());
    o.setStatus(com.finalproject.pickcoin.enums.OrderStatus.UNCONCLUDED);
    repo.insert_order(o,
        com.finalproject.pickcoin.enums.TradeType.BUY.ordinal(),
        com.finalproject.pickcoin.enums.OrderStatus.UNCONCLUDED.ordinal());
    Long orderId = repo.last_id();

    // 2) 지갑 보장
    Long krwId = repo.krw_asset_id();
    repo.ensure_wallet(req.user_id, req.asset_id);
    repo.ensure_wallet(req.user_id, krwId);


    // 3) 잠금 조회
    Map<String,Object> coin = repo.select_wallet_for_update(req.user_id, req.asset_id);
    Map<String,Object> krw  = repo.select_wallet_for_update(req.user_id, krwId);
    // BigDecimal coinQty = (BigDecimal) coin.get("amount");
    // BigDecimal krwAmt  = (BigDecimal) krw.get("amount");
    BigDecimal coinQty = toBD(coin.get("amount"));
    BigDecimal krwAmt  = toBD(krw.get("amount"));

    // 4) 계산/검증
    BigDecimal fee  = req.price.multiply(req.amount).multiply(FEE_RATE)
                        .setScale(SCALE_MONEY, RoundingMode.HALF_UP);
    BigDecimal need = req.price.multiply(req.amount)
                        .setScale(SCALE_MONEY, RoundingMode.HALF_UP)
                        .add(fee);
    if (krwAmt.compareTo(need) < 0) throw new IllegalStateException("KRW 부족");

    // 5) 지갑 업데이트 2건
    repo.add_coin_amount(req.user_id, req.asset_id,
        req.amount.setScale(SCALE_CRYPTO, RoundingMode.HALF_UP));
    repo.add_wallet_amount(req.user_id, krwId, need.negate());

    // 6) 체결 기록
    repo.insert_transaction(orderId, req.price, req.amount, fee);

    // 7) 주문 종결
    repo.conclude_order(orderId,
        com.finalproject.pickcoin.enums.OrderStatus.CONCLUDED.ordinal());

    return Map.of("order_id", orderId, "status", "concluded");
    }

    //===============매도 관련=============

    @Override @Transactional
    public Map<String,Object> market_sell(PlaceOrderRequest req) {
        final int UNCONCLUDED = OrderStatus.UNCONCLUDED.ordinal();
        final int CONCLUDED   = OrderStatus.CONCLUDED.ordinal();
        final int ORDER_TYPE_SELL = TradeType.SELL.ordinal();

        if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
            throw new IllegalArgumentException("필수 필드 누락");
        if (req.amount.signum()<=0 || req.price.signum()<=0)
            throw new IllegalArgumentException("수량/가격>0");

        Orders o = new Orders();
        o.setUser_id(req.user_id.intValue());
        o.setAsset_id(req.asset_id.intValue());
        o.setOrder_type(TradeType.SELL);
        o.setPrice(req.price.doubleValue());
        o.setAmount(req.amount.doubleValue());
        o.setUnconcluded_amount(req.amount.doubleValue());
        o.setStatus(OrderStatus.UNCONCLUDED);

        repo.insert_order(o, ORDER_TYPE_SELL, UNCONCLUDED);
        Long orderId = repo.last_id();

        Long krwId = repo.krw_asset_id();
        repo.ensure_wallet(req.user_id, req.asset_id);
        repo.ensure_wallet(req.user_id, krwId);

        Map<String,Object> coin = repo.select_wallet_for_update(req.user_id, req.asset_id);
        Map<String,Object> krw  = repo.select_wallet_for_update(req.user_id, krwId);
        BigDecimal coinQty = toBD(coin.get("amount"));

        if (coinQty.compareTo(req.amount) < 0) throw new IllegalStateException("보유 수량 부족");

        BigDecimal gross   = req.price.multiply(req.amount).setScale(SCALE_MONEY, RoundingMode.HALF_UP);
        BigDecimal fee     = gross.multiply(FEE_RATE).setScale(SCALE_MONEY, RoundingMode.HALF_UP);
        BigDecimal receive = gross.subtract(fee);

        repo.sub_coin_amount(req.user_id, req.asset_id,
                req.amount.setScale(SCALE_CRYPTO, RoundingMode.HALF_UP));
        repo.add_wallet_amount(req.user_id, krwId, receive);

        repo.insert_transaction(orderId, req.price, req.amount, fee);
        repo.conclude_order(orderId, CONCLUDED);

        return Map.of("order_id", orderId, "status", "concluded");
    }

    /** 보유자산 */
    @Override
    public java.util.List<Map<String,Object>> holdings(Long userId) {
        return repo.holdings(userId);
    }

    /** KRW 잔액 */
    @Override
    public BigDecimal krw_balance(Long userId) {
        BigDecimal v = repo.krw_balance(userId);
        return v == null ? BigDecimal.ZERO : v;
    }

    /** 거래내역 */
    @Override
    public java.util.List<Map<String,Object>> trades(Long userId) {
        return repo.find_trades(userId);
    }

    /** 자산별 미체결 거래 내역 */
    @Override
    public java.util.List<Map<String,Object>> asset_unconcluded_orders(Long user_id, Long asset_id) {
        return repo.asset_unconcluded_orders(user_id, asset_id);
    }
    
    /** 자산별 체결 거래 내역 */
    @Override
    public java.util.List<Map<String,Object>> asset_concluded_orders(Long user_id, Long asset_id) {
        return repo.asset_concluded_orders(user_id, asset_id);
    }
        
}