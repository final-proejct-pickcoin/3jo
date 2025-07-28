package com.finalproject.pickcoin.domain;

import java.util.Date;

import lombok.Data;

@Data
public class Report {
    
    private Integer report_id; // 신고 ID
    private Integer user_id;
    private Integer post_id;
    private Integer reply_id;
    private String description; // 신고 사유
    private String status; // 신고 상태 (예: "pending", "resolved", "rejected") enum으로 바꿔야할수도.
    private Date created_at; // 신고 생성 시간
    private Date processed_at; // 신고 생성 시간
}
