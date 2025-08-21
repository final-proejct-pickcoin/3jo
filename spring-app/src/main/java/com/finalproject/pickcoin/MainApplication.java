package com.finalproject.pickcoin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.finalproject.pickcoin.service.CommunityService;

@SpringBootApplication
@EnableScheduling
public class MainApplication implements CommandLineRunner {

    @Autowired
    private CommunityService communityService;

    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }

    public void run(String... args) throws Exception{
        communityService.createCommunityPostsIndex();
    }
}
