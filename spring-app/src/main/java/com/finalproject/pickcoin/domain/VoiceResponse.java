package com.finalproject.pickcoin.domain;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity(name = "voice_response")
public class VoiceResponse {
    
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer response_id;
    private Integer command_id; // voice_command 테이블의 command_id와 연결
    private Integer user_id; 
    private String message; // AI가 생성한 응답 텍스트
    private String status; // 응답 상태 (예: "success", "error") enum으로 변경 가능

    @Column(name = "created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt; // 생성일시
}
