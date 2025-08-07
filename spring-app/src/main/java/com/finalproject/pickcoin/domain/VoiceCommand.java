package com.finalproject.pickcoin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity(name = "voice_command")
public class VoiceCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer commnad_id;

    private Integer user_id;
    private String transcript; // text (텍스트변환 결과)
    private String intent; // AI가 추출한 의도
    private Integer coin_id;
    private Double amount;
    private String status; // enum으로 변경 해야함.

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)    
    private String createdAt; 
}