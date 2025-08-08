package com.finalproject.pickcoin.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Inquriy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer inquiry_id;
    private String category;
    private Double amount;
    private String status;
    private Integer priority;

    @Column(name="created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name="closed_at", updatable = false)
    private LocalDateTime closedAt;

}
