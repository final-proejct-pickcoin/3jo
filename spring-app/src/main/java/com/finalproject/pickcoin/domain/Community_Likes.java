package com.finalproject.pickcoin.domain;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Data;

@Data
@Entity
@Table(name = "community_likes")
public class Community_Likes {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer like_id;
    @Column(nullable = false)
    private Integer post_id;
    @Column(nullable = false)
    private Integer user_id;

    @Column(name="created_at", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;


}
