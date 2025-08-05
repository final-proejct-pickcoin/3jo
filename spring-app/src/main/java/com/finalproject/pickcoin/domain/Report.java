package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.EntityType;
import com.finalproject.pickcoin.enums.ReportStatus;

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
@Entity
public class Report {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer report_id; // 신고 ID
    private Integer reported_id;
    @Enumerated(EnumType.STRING)
    private EntityType reported_type; // 신고 대상
    private String description; // 신고 사유
    @Enumerated(EnumType.STRING)
    private ReportStatus status; // 신고 상태 (예: "pending", "resolved", "rejected") enum으로 바꿔야할수도.

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date createdAt; // 신고 생성 시간

    @Column(name="processed_at", updatable = false)   
    private Date processedAT; // 신고 생성 시간
    
}
