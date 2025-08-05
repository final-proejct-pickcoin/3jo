package com.finalproject.pickcoin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "coin")
public class Coin {
    @Id
    @Column(name = "coin_id")
    private Long coinId;

    @Column(name = "coin_name")
    private String coinName;
    
        @Column(name = "market")
        private String market;

    @Column(name = "symbol")
    private String symbol;


    // getter/setter
    public Long getCoinId() { return coinId; }
    public void setCoinId(Long coinId) { this.coinId = coinId; }
    public String getCoinName() { return coinName; }
    public void setCoinName(String coinName) { this.coinName = coinName; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
}

// javax.persistence.* import 및 JPA 어노테이션이 인식되지 않는 문제는 build.gradle에 JPA 의존성이 없어서 발생합니다.
// build.gradle에 아래 의존성을 추가하세요:
// implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
// 그리고 다시 gradle 빌드/리프레시 후 이 파일의 에러가 사라집니다.
