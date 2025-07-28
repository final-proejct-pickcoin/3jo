package com.finalproject.pickcoin.domain;

import java.util.Date;

import com.finalproject.pickcoin.enums.EntityType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
public class Files {
    
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer id;

    private Integer uploaded_id;
    private EntityType target_type; // enum으로 변경 가능
    private String target_id;
    private String origin_filename;
    private String filename;
    private String filepath;
    private Double file_size;
    private String file_type; // 확장자
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "uploaded_at")
    private Date uploadedAt;
}
