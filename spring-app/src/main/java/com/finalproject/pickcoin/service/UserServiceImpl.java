package com.finalproject.pickcoin.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.finalproject.pickcoin.domain.Users;
import com.finalproject.pickcoin.repository.UsersRepository;


@Service
public class UserServiceImpl implements UserService {

    Logger logger = LoggerFactory.getLogger("UserServiceImpl");

    @Autowired
    private UsersRepository usersRepository;

    @Override
    public Optional<Users> findByEmail(String email) {
        Optional<Users> result = usersRepository.findByEmail(email);

        return result;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void save(Users user) {
        usersRepository.save(user);
    }

    @Override
    public Optional<Users> findByVerificationToken(String token) {
        Optional<Users> result = usersRepository.findByVerificationToken(token);
        return result;
    }

    @Override
    @Scheduled(fixedRate = 300000)
    public void deleteExpiredUnverifiedUsers() {
        LocalDateTime now = LocalDateTime.now();
        List<Users> expiredUsers = usersRepository.findExpiredUnverifiedUsers(now);
        // logger.info("삭제 대상 유저 수: {}", expiredUsers.size());
        for(Users user : expiredUsers){
            // logger.info("삭제할 유저: {}", user.getEmail());
            usersRepository.delete(user);
        }
    }
    
}
