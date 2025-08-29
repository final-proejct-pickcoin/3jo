package com.finalproject.pickcoin;

import org.mybatis.spring.annotation.MapperScan;
import org.apache.ibatis.annotations.Mapper; 

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

import com.finalproject.pickcoin.service.CommunityService;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableScheduling

@MapperScan(basePackages = "com.finalproject.pickcoin.repository", annotationClass = Mapper.class)
public class MainApplication implements CommandLineRunner {

    @Autowired
    private CommunityService communityService;

    public static void main(String[] args) {

        // .env 파일을 로드하여 시스템 프로퍼티에 설정하는 코드 추가
        Dotenv dotenv = Dotenv.load();
        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });
        
        SpringApplication.run(MainApplication.class, args);
    }

    public void run(String... args) throws Exception{
        communityService.createCommunityPostsIndex();
    }
}
