package com.finalproject.pickcoin.enums;

public enum ChangeType { // 지갑 로그 타입
    BUY,        // 코인 증가
    SELL,       // 코인 감소(음수)
    BUY_FEE,    // KRW 수수료/원금 차감
    SELL_FEE,   // KRW 수수료 차감
    DEPOSIT,    // KRW 입금(충전)
    WITHDRAW    // KRW 출금
    
}
