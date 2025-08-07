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
@Entity
public class Onboarding {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Integer onboardingId;
    private Integer user_id;
    private String step_status;

    @Column(name="completed_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;
}
