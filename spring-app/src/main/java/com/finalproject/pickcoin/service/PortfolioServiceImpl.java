package com.finalproject.pickcoin.service;

import com.finalproject.pickcoin.domain.PortfolioSummary;
import com.finalproject.pickcoin.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioServiceImpl implements PortfolioService {

    private final PortfolioRepository portfolioRepository;

    @Override
    public PortfolioSummary getSummary(long userId) {
        PortfolioSummary out = new PortfolioSummary();

        // KRW
        out.krwBalance = portfolioRepository.krwBalance(userId);
        if (out.krwBalance == null) out.krwBalance = BigDecimal.ZERO;

        // Holdings
        List<Map<String, Object>> rows = portfolioRepository.holdings(userId);
        List<PortfolioSummary.Holding> holdings = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            PortfolioSummary.Holding h = new PortfolioSummary.Holding();
            h.assetId   = ((Number) r.get("assetId")).longValue();
            h.symbol    = (String) r.get("symbol");
            h.assetName = (String) r.get("assetName");
            h.market    = (String) r.get("market");
            h.amount    = new BigDecimal(String.valueOf(r.get("amount")));
            holdings.add(h);
        }
        out.holdings = holdings;

        // Recent fills
        List<Map<String, Object>> fills = portfolioRepository.recentFills(userId);
        List<PortfolioSummary.RecentFill> rf = new ArrayList<>();
        for (Map<String, Object> r : fills) {
            PortfolioSummary.RecentFill f = new PortfolioSummary.RecentFill();
            f.assetId  = ((Number) r.get("assetId")).longValue();
            f.symbol   = (String) r.get("symbol");
            f.side     = (String) r.get("side");
            f.qty      = new BigDecimal(String.valueOf(r.get("qty")));
            f.price    = new BigDecimal(String.valueOf(r.get("price")));
            f.fee      = new BigDecimal(String.valueOf(r.get("fee")));
            f.filledAt = (String) r.get("filledAt");
            rf.add(f);
        }
        out.recentFills = rf;

        return out;
    }

@Override
public List<Map<String, Object>> getHoldings(long userId) {
    // 1) 보유 로드
    List<Map<String,Object>> rows = portfolioRepository.holdings(userId);
    if (rows.isEmpty()) return rows;

    // 2) 자산ID 수집
    var assetIds = rows.stream()
        .map(r -> ((Number) r.get("assetId")).longValue())
        .collect(java.util.stream.Collectors.toSet());

    // 3) 체결 이력 로드 → 이동평균(평단) 계산
    var fills  = portfolioRepository.fillsForAvg(userId, assetIds);
    var avgMap = computeAvgByAsset(fills); // BUY=평단 갱신, SELL=수량만 감소

    // 4) avgPrice 주입 (nowPrice는 프론트 실시간 사용이라 0)
    for (var r : rows) {
        long aid = ((Number) r.get("assetId")).longValue();
        r.put("avgPrice", avgMap.getOrDefault(aid, BigDecimal.ZERO));
        if (r.get("nowPrice") == null) r.put("nowPrice", BigDecimal.ZERO);
    }

    return rows; // ✅ 반드시 반환
}

/** 이동평균법: BUY=평단 갱신, SELL=수량 감소(평단 유지) */
private static Map<Long, BigDecimal> computeAvgByAsset(List<Map<String,Object>> fills) {
    Map<Long, BigDecimal> avg = new HashMap<>();
    Map<Long, BigDecimal> qty = new HashMap<>();

    for (Map<String,Object> f : fills) {
        long aid = ((Number) f.get("assetId")).longValue();
        int  side= ((Number) f.get("side")).intValue(); // 0 buy, 1 sell
        BigDecimal q = toBD(f.get("qty"));
        BigDecimal p = toBD(f.get("price"));

        BigDecimal cq = qty.getOrDefault(aid, BigDecimal.ZERO);
        BigDecimal ca = avg.getOrDefault(aid, BigDecimal.ZERO);

        if (side == 0) { // BUY
            BigDecimal newQty = cq.add(q);
            BigDecimal denom  = newQty.signum()==0 ? BigDecimal.ONE : newQty;
            BigDecimal newAvg = (cq.multiply(ca).add(q.multiply(p)))
                                .divide(denom, 8, RoundingMode.HALF_UP);
            qty.put(aid, newQty);
            avg.put(aid, newAvg);
        } else {         // SELL
            qty.put(aid, cq.subtract(q).max(BigDecimal.ZERO)); // avg 유지
        }
    }
    return avg;
}


    private static BigDecimal toBD(Object o){
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        return new BigDecimal(String.valueOf(o));
    }
    //거래 내역
    @Override
    public List<Map<String, Object>> getTrades(long userId, Long assetId, int limit, int offset) {
        return portfolioRepository.trades(userId, assetId, limit, offset);
    }
    
}
