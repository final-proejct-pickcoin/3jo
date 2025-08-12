package com.finalproject.pickcoin.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

// reactive 말고 MVC용 import
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // ★ CORS 적용
            .cors(cors -> {})
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // 프리플라이트 허용
                .requestMatchers("/api/**").permitAll() // 마켓 API 개발용 오픈
                .requestMatchers("/users/register", "/users/verify", "/community/findAll", 
                                "/users/login", "/css/**", "/js/**", "/error", "/test",
                                 "/WEB-INF/views/**", "/WEB-INF/**").permitAll() // 회원가입, 로그인 등
                .requestMatchers("/api/Market/**").permitAll()
                .anyRequest().authenticated() // 인증 필요
            );
        return http.build();
    }

    // CORS 설정 (리액트 호출 허용)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("*")); // 개발 중 전체 허용 (운영 시 도메인 제한 권장)
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
