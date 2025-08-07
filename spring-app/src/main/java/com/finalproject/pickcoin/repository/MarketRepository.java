package com.finalproject.pickcoin.repository;

import com.finalproject.pickcoin.domain.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketRepository extends JpaRepository<Asset, Long> {
    // JpaRepository 기본 CRUD 제공
    // 필요시 커스텀 쿼리 메서드 추가 가능
}
