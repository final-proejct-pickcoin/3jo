package com.finalproject.pickcoin.domain;

import java.util.Date;

import lombok.Data;

@Data
public class Onboarding {
    
    private Integer onboarding_id;
    private Integer user_id;
    private String step_status;
    private Date completed_at;
}
