package com.finalproject.pickcoin.domain;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity(name = "chat_session")
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer session_id; // 세션 ID
    private Integer user_id; // 사용자 ID
    private Integer admin_id;

    @Column(name="start_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)    
    private Date startAt;

    @Column(name="end_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)    
    private Date endAt;
    
}
