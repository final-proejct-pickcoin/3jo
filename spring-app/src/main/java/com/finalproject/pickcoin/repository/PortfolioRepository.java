package com.finalproject.pickcoin.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Mapper
public interface PortfolioRepository {
    // KRW 잔액
    java.math.BigDecimal krwBalance(@Param("userId") long userId);

    // 보유 코인
    java.util.List<java.util.Map<String,Object>> holdings(@Param("userId") long userId);

    // 최근 체결 20건
    java.util.List<java.util.Map<String,Object>> recentFills(@Param("userId") long userId);
    
    //거래내역
    List<Map<String,Object>> trades(
    @org.apache.ibatis.annotations.Param("userId") long userId,
    @org.apache.ibatis.annotations.Param("assetId") Long assetId, // null이면 전체
    @org.apache.ibatis.annotations.Param("limit")   int limit,
    @org.apache.ibatis.annotations.Param("offset")  int offset
);
}

