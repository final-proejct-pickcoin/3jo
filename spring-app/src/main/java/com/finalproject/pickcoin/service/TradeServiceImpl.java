package com.finalproject.pickcoin.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
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

    // ===== 공통 상수/유틸 =====
    private static final BigDecimal FEE_RATE = new BigDecimal("0.001"); // 0.1%
    private static final int SCALE_MONEY = 0, SCALE_CRYPTO = 8;

    private static BigDecimal toBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
        return new BigDecimal(v.toString());
    }
    private static BigDecimal feeKRW(BigDecimal grossExact) {
        return grossExact.multiply(FEE_RATE).setScale(SCALE_MONEY, RoundingMode.HALF_UP);
    }

    // ===== 공통 체결 로직 =====
    private void settleBuy(Long userId, Long assetId, Long orderId, BigDecimal execPrice, BigDecimal qty) {
        Long krwId = repo.krw_asset_id();

        // 잠금
        repo.select_wallet_for_update(userId, assetId);
        Map<String,Object> krw = repo.select_wallet_for_update(userId, krwId);
        BigDecimal krwAmt = toBD(krw.get("amount"));

        // 계산(마지막에만 원단위 반올림)
        BigDecimal gExact = execPrice.multiply(qty);
        BigDecimal fee    = feeKRW(gExact);
        BigDecimal gross  = gExact.setScale(SCALE_MONEY, RoundingMode.HALF_UP);
        BigDecimal net    = gross.subtract(fee);

        if (krwAmt.compareTo(net) < 0) throw new IllegalStateException("KRW 부족");

        // 지갑 반영: KRW ↓ net, 코인 ↑ qty
        repo.add_coin_amount(userId, assetId, qty.setScale(SCALE_CRYPTO, RoundingMode.HALF_UP));
        repo.add_wallet_amount(userId, krwId, net.negate());

        // 이력 + 종결
        repo.insert_transaction(orderId, execPrice, qty, fee);
        repo.conclude_order(orderId, OrderStatus.CONCLUDED.ordinal());
    }

    private void settleSell(Long userId, Long assetId, Long orderId, BigDecimal execPrice, BigDecimal qty) {
        Long krwId = repo.krw_asset_id();

        // 잠금
        Map<String,Object> coin = repo.select_wallet_for_update(userId, assetId);
        repo.select_wallet_for_update(userId, krwId);
        BigDecimal coinQty = toBD(coin.get("amount"));
        if (coinQty.compareTo(qty) < 0) throw new IllegalStateException("보유 수량 부족");

        // 계산
        BigDecimal gExact = execPrice.multiply(qty);
        BigDecimal fee    = feeKRW(gExact);
        BigDecimal gross  = gExact.setScale(SCALE_MONEY, RoundingMode.HALF_UP);
        BigDecimal net    = gross.subtract(fee);

        // 지갑 반영: 코인 ↓ qty, KRW ↑ net
        repo.sub_coin_amount(userId, assetId, qty.setScale(SCALE_CRYPTO, RoundingMode.HALF_UP));
        repo.add_wallet_amount(userId, krwId, net);

        // 이력 + 종결
        repo.insert_transaction(orderId, execPrice, qty, fee);
        repo.conclude_order(orderId, OrderStatus.CONCLUDED.ordinal());
    }

    // ===== 시장가 =====
    @Override @Transactional
    public Map<String,Object> market_buy(PlaceOrderRequest req) {
        if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
            throw new IllegalArgumentException("필수 필드 누락");
        if (req.amount.signum()<=0 || req.price.signum()<=0)
            throw new IllegalArgumentException("수량/가격>0");

        // 주문 생성 (UNCONCLUDED → 즉시 체결 → CONCLUDED)
        Orders o = new Orders();
        o.setUser_id(req.user_id.intValue());
        o.setAsset_id(req.asset_id.intValue());
        o.setOrder_type(TradeType.BUY);
        o.setPrice(req.price.doubleValue());              // 체결가로 사용
        o.setAmount(req.amount.doubleValue());
        o.setUnconcluded_amount(req.amount.doubleValue());
        o.setStatus(OrderStatus.UNCONCLUDED);
        repo.insert_order(o, TradeType.BUY.ordinal(), OrderStatus.UNCONCLUDED.ordinal());
        Long orderId = repo.last_id();

        // 지갑 보장
        Long krwId = repo.krw_asset_id();
        repo.ensure_wallet(req.user_id, req.asset_id);
        repo.ensure_wallet(req.user_id, krwId);

        // 공통 체결
        settleBuy(req.user_id, req.asset_id, orderId, req.price, req.amount);
        return Map.of("order_id", orderId, "status", "concluded");
    }

    @Override @Transactional
    public Map<String,Object> market_sell(PlaceOrderRequest req) {
        if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
            throw new IllegalArgumentException("필수 필드 누락");
        if (req.amount.signum()<=0 || req.price.signum()<=0)
            throw new IllegalArgumentException("수량/가격>0");

        Orders o = new Orders();
        o.setUser_id(req.user_id.intValue());
        o.setAsset_id(req.asset_id.intValue());
        o.setOrder_type(TradeType.SELL);
        o.setPrice(req.price.doubleValue());              // 체결가로 사용
        o.setAmount(req.amount.doubleValue());
        o.setUnconcluded_amount(req.amount.doubleValue());
        o.setStatus(OrderStatus.UNCONCLUDED);
        repo.insert_order(o, TradeType.SELL.ordinal(), OrderStatus.UNCONCLUDED.ordinal());
        Long orderId = repo.last_id();

        Long krwId = repo.krw_asset_id();
        repo.ensure_wallet(req.user_id, req.asset_id);
        repo.ensure_wallet(req.user_id, krwId);

        settleSell(req.user_id, req.asset_id, orderId, req.price, req.amount);
        return Map.of("order_id", orderId, "status", "concluded");
    }

    // ===== 지정가(미체결 등록) =====
    @Override @Transactional
    public Map<String,Object> limit_buys(PlaceOrderRequest req) {
        if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
            throw new IllegalArgumentException("필수 필드 누락");
        if (req.amount.signum()<=0 || req.price.signum()<=0)
            throw new IllegalArgumentException("수량/가격>0");

        Orders o = new Orders();
        o.setUser_id(req.user_id.intValue());
        o.setAsset_id(req.asset_id.intValue());
        o.setOrder_type(TradeType.BUY);
        o.setPrice(req.price.doubleValue());              // 지정가
        o.setAmount(req.amount.doubleValue());
        o.setUnconcluded_amount(req.amount.doubleValue());
        o.setStatus(OrderStatus.UNCONCLUDED);
        repo.insert_order(o, TradeType.BUY.ordinal(), OrderStatus.UNCONCLUDED.ordinal());
        Long orderId = repo.last_id();

        Long krwId = repo.krw_asset_id();
        repo.ensure_wallet(req.user_id, req.asset_id);
        repo.ensure_wallet(req.user_id, krwId);

        return Map.of("order_id", orderId, "status", "unconcluded");
    }

    @Override @Transactional
    public Map<String,Object> limit_sells(PlaceOrderRequest req) {
        if (req.user_id==null || req.asset_id==null || req.amount==null || req.price==null)
            throw new IllegalArgumentException("필수 필드 누락");
        if (req.amount.signum()<=0 || req.price.signum()<=0)
            throw new IllegalArgumentException("수량/가격>0");

        // (선택) 보유수량 선검증을 하려면 여기서 wallet 조회 후 체크
        Orders o = new Orders();
        o.setUser_id(req.user_id.intValue());
        o.setAsset_id(req.asset_id.intValue());
        o.setOrder_type(TradeType.SELL);
        o.setPrice(req.price.doubleValue());              // 지정가
        o.setAmount(req.amount.doubleValue());
        o.setUnconcluded_amount(req.amount.doubleValue());
        o.setStatus(OrderStatus.UNCONCLUDED);
        repo.insert_order(o, TradeType.SELL.ordinal(), OrderStatus.UNCONCLUDED.ordinal());
        Long orderId = repo.last_id();

        Long krwId = repo.krw_asset_id();
        repo.ensure_wallet(req.user_id, req.asset_id);
        repo.ensure_wallet(req.user_id, krwId);

        return Map.of("order_id", orderId, "status", "unconcluded");
    }

    // ===== 지정가 매칭(현재가 들어올 때 호출) =====
    @Override @Transactional
    public Map<String,Object> match_limits(Long assetId, BigDecimal currentPrice) {
        List<Map<String,Object>> buys  = repo.limit_buys(assetId, currentPrice);
        List<Map<String,Object>> sells = repo.limit_sells(assetId, currentPrice);

        for (var row : buys) {
            Long orderId = ((Number)row.get("order_id")).longValue();
            Long userId  = ((Number)row.get("user_id")).longValue();
            Long aId     = ((Number)row.get("asset_id")).longValue();
            BigDecimal qty = new BigDecimal(row.get("amount").toString());
            // 현재가로 전량 체결 (MVP)
            settleBuy(userId, aId, orderId, currentPrice, qty);
        }
        for (var row : sells) {
            Long orderId = ((Number)row.get("order_id")).longValue();
            Long userId  = ((Number)row.get("user_id")).longValue();
            Long aId     = ((Number)row.get("asset_id")).longValue();
            BigDecimal qty = new BigDecimal(row.get("amount").toString());
            settleSell(userId, aId, orderId, currentPrice, qty);
        }
        return Map.of("matched_buys", buys.size(), "matched_sells", sells.size());
    }

    // ===== 조회 =====
    @Override public List<Map<String,Object>> holdings(Long userId) { return repo.holdings(userId); }
    @Override public BigDecimal krw_balance(Long userId) {
        BigDecimal v = repo.krw_balance(userId);
        return v == null ? BigDecimal.ZERO : v;
    }
    @Override public List<Map<String,Object>> trades(Long userId) { return repo.find_trades(userId); }
    @Override public List<Map<String,Object>> asset_unconcluded_orders(Long user_id, Long asset_id) {
        return repo.asset_unconcluded_orders(user_id, asset_id);
    }
    @Override public List<Map<String,Object>> asset_concluded_orders(Long user_id, Long asset_id) {
        return repo.asset_concluded_orders(user_id, asset_id);
    }
}
