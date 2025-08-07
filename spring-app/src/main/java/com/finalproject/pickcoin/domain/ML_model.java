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
@Entity
public class ML_model {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer model_id;
    private String model_name;
    private String version;
    private Double accuracy;

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
}
