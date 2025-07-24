package com.finalproject.pickcoin.domain;

import java.util.Date;

import org.springframework.data.annotation.CreatedDate;

import com.finalproject.pickcoin.enums.PointType;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
public class Point {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer point_id;
    private Integer user_id;
    private Integer tx_id;

    @Enumerated(EnumType.STRING)
    private PointType type;

    private Double amount;

    @CreatedDate
    @Temporal(TemporalType.TIMESTAMP)
    private Date created_at;
    
}
