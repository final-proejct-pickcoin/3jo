package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.ReportStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    private Integer reportId; // 신고 ID
    private Integer userId;
    private Integer postId;
    private Integer reply_id;
    private String description; // 신고 사유
    private ReportStatus status; // 신고 상태 (예: "pending", "resolved", "rejected") enum으로 바꿔야할수도.

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)   
    private Date createdAt; // 신고 생성 시간
    
}
