package com.finalproject.pickcoin.service;

import java.util.List;
import java.util.Map;

import com.finalproject.pickcoin.domain.PortfolioSummary;

public interface PortfolioService {
    //자산 포트폴리오 요약
    PortfolioSummary getSummary(long userId);
    //현재 보유 자산
    List<Map<String,Object>> getHoldings(long userId);
    //거래 내역
    List<Map<String,Object>> getTrades(long userId, Long assetId, int limit, int offset);

}
