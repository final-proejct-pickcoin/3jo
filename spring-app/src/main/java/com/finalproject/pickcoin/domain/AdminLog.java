package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.LogType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity(name = "admin_log")
public class AdminLog {
    
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer log_id; // 로그 ID
    private Integer admin_id; // 관리자 ID
    private LogType action; // 수행한 작업 (예: "CREATE", "UPDATE", "DELETE") enum 해야함
    @Enumerated(EnumType.STRING)
    private EntityType entityType; // 엔티티 타입 (예: "User", "Post", "Comment") enum 해야함
    private Integer entity_id; // 엔티티 ID
    private String detail; // text
    
    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)    
    private Date createdAt; // 로그 생성 시간
}
