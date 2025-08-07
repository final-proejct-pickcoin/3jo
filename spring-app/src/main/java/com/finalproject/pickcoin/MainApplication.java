package com.finalproject.pickcoin;

<<<<<<< HEAD
import org.mybatis.spring.annotation.MapperScan;
=======
>>>>>>> feature_jh
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

<<<<<<< HEAD
@MapperScan("com.finalproject.pickcoin.mapper") // mapper 인터페이스 패키지 경로
=======
>>>>>>> feature_jh
@SpringBootApplication
@EnableScheduling
public class MainApplication {

<<<<<<< HEAD
    public static void main(String[] args) {
        SpringApplication.run(MainApplication.class, args);
    }
=======
	public static void main(String[] args) {
		SpringApplication.run(MainApplication.class, args);
	}

>>>>>>> feature_jh
}
