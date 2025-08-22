package com.finalproject.pickcoin.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.finalproject.pickcoin.domain.Users;


public interface UsersRepository extends CrudRepository<Users, Integer> {

    Optional<Users> findByEmail(String email);
    Optional<Users> findByVerificationToken(String token);
    Optional<Users> findByPhone(String phone);
    Optional<Users> findByProviderAndProviderId(String provider, String providerId);

    Optional<Users> findByGoogleId(String googleId);
    Optional<Users> findByKakaoId(String kakaoId);

    // 인증 만료시 데이터베이스에서 삭제
    @Query(value = "SELECT * FROM users WHERE is_verified = false AND expires_at < :now", nativeQuery = true)
    List<Users> findExpiredUnverifiedUsers(@Param("now") LocalDateTime now);
}