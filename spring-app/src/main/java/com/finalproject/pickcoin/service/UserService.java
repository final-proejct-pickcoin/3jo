package com.finalproject.pickcoin.service;

import java.util.Optional;

import com.finalproject.pickcoin.domain.Users;

public interface UserService {

        Optional<Users> findByEmail(String email);
        void save(Users user);
        Optional<Users> findByVerificationToken(String token);

        // 인증 만료시 데이터베이스에서 삭제
        void deleteExpiredUnverifiedUsers();
}
