package com.finalproject.pickcoin.service;

import com.finalproject.pickcoin.domain.PortfolioSummary;
import com.finalproject.pickcoin.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
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
        // 1) 보유 + 현재가(+평단) 로딩 (키 이름: assetId/symbol/assetName/market/amount/avgPrice/nowPrice)
        List<Map<String,Object>> rows = portfolioRepository.holdings(userId);

        // 2) 총 평가금액(코인 부분) 먼저 계산
        BigDecimal coinTotal = BigDecimal.ZERO;
        for (Map<String,Object> r : rows) {
            BigDecimal amt  = toBD(r.get("amount"));
            BigDecimal now  = toBD(r.get("nowPrice"));
            coinTotal = coinTotal.add( amt.multiply(now) );
        }

        // 3)衍生값 계산해서 같은 Map에 키 추가
        for (Map<String,Object> r : rows) {
            BigDecimal amt   = toBD(r.get("amount"));
            BigDecimal avg   = toBD(r.get("avgPrice"));   // 없으면 0
            BigDecimal now   = toBD(r.get("nowPrice"));   // 없으면 0

            BigDecimal mv    = amt.multiply(now);         // 평가금액
            BigDecimal pnl   = amt.multiply(now.subtract(avg)); // 미실현손익(평단 없으면 0)
            BigDecimal pnlPct = (avg.signum()==0)
                    ? BigDecimal.ZERO
                    : now.divide(avg, 8, RoundingMode.HALF_UP).subtract(BigDecimal.ONE)
                        .multiply(BigDecimal.valueOf(100));

            BigDecimal weightPct = (coinTotal.signum()==0)
                    ? BigDecimal.ZERO
                    : mv.multiply(BigDecimal.valueOf(100))
                        .divide(coinTotal, 4, RoundingMode.HALF_UP);

            r.put("marketValue", mv);
            r.put("pnlAmount",   pnl);
            r.put("pnlPct",      pnlPct.setScale(2, RoundingMode.HALF_UP));
            r.put("weightPct",   weightPct.setScale(2, RoundingMode.HALF_UP));
        }

        // 4) 비중 내림차순
        rows.sort((a,b) -> Double.compare(
            toBD(b.get("weightPct")).doubleValue(),
            toBD(a.get("weightPct")).doubleValue()
        ));
        return rows;
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
