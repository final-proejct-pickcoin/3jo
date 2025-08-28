package com.finalproject.pickcoin.domain;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class PortfolioSummary {
    public BigDecimal krwBalance;    // 보유 원화
    public List<Holding> holdings;   // 보유 코인 목록
    public List<RecentFill> recentFills; // 최근 체결 내역

    public static class Holding {
        public Long assetId;
        public String symbol;
        public String assetName;
        public String market;
        public BigDecimal amount;     // 수량만 내려줌
    }

    public static class RecentFill {
        public Long assetId;
        public String symbol;
        public String side;           // BUY/SELL
        public BigDecimal qty;
        public BigDecimal price;
        public BigDecimal fee;
        public String filledAt;
    }
}