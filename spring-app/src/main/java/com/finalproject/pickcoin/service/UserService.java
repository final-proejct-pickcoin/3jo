package com.finalproject.pickcoin.service;

import java.util.Optional;

import com.finalproject.pickcoin.domain.Users;

public interface UserService {

        Optional<Users> findByEmail(String email);
        void save(Users user);
        Optional<Users> findByVerificationToken(String token);

        Optional<Users> findByPhone(String phone);
        Optional<Users> findByProviderAndProviderId(String provider, String providerId);

        Optional<Users> findByGoogleId(String googleId);
        Optional<Users> findByKakaoId(String kakaoId);

        // 인증 만료시 데이터베이스에서 삭제
        void deleteExpiredUnverifiedUsers();

        
}
