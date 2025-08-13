package com.finalproject.pickcoin.controller;

import com.finalproject.pickcoin.domain.Users;
import com.finalproject.pickcoin.enums.Role;
import com.finalproject.pickcoin.service.EmailService;
// import com.finalproject.pickcoin.repository.UsersRepository;
import com.finalproject.pickcoin.service.UserService;
import com.finalproject.pickcoin.util.JwtHelper;



import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/users")
@Transactional
public class UserController {

    @Autowired
    private UserService userService;
    // @Autowired
    // private UsersRepository usersRepository;
    @Autowired
    private JwtHelper jwtHelper;
    @Autowired
    private EmailService emailService;

    Logger logger = LoggerFactory.getLogger(UserController.class);

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String name) {

        logger.info("=========register 호출 ===========");
        Map<String, Object> result = new HashMap<>();
        if (userService.findByEmail(email).isPresent()) {
            result.put("error", "이미 존재하는 이메일입니다.");
            return ResponseEntity.badRequest().body(result);
        }

        // email 인증 token 생성
        String token = UUID.randomUUID().toString();

        Users user = new Users();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole(Role.USER);
        user.setVerified(false);  /// ??
        user.setCreatedAt(LocalDateTime.now());
        user.setVerificationToken(token);        
        // 인증 만료 시간 5분
        user.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        emailService.sendVerificationEmail(email, token); // 이메일 인증 발송
        
        result.put("success", "5분 이내에 이메일 인증을 완료해주세요.");        

        userService.save(user);
        return ResponseEntity.ok(result);
    }

    // email 인증 확인 처리
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token){
        Optional<Users> optionalUser = userService.findByVerificationToken(token);
        if (optionalUser.isPresent()){
            Users user = optionalUser.get();
            user.setVerified(true);  //???
            user.setVerificationToken(null);
            userService.save(user);

            return ResponseEntity.ok("이메일 인증이 완료되었습니다.");
        }else{
            return ResponseEntity.badRequest().body("유효하지 않은 링크입니다.");
        }
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String email,
            @RequestParam String password) {

        logger.info("로그인 시도: email={}, password={}", email, password);
        
        Map<String, Object> result = new HashMap<>();
        Optional<Users> optionalUser  = userService.findByEmail(email);
        if (optionalUser .isEmpty()) {
            result.put("error", "존재하지 않는 사용자입니다.");
            return ResponseEntity.status(404).body(result);
        }
        Users user = optionalUser.get();

        // 이메일 인증 여부 확인
        if (!user.isVerified()) {
            result.put("error", "이메일 인증을 완료한 후 로그인할 수 있습니다.");
            return ResponseEntity.status(403).body(result);
        }


        if (!passwordEncoder.matches(password, user.getPassword())) {
            result.put("error", "비밀번호가 일치하지 않습니다.");
            return ResponseEntity.status(401).body(result);
        }
        
        //로그인 성공시 토큰 발급
        String token = jwtHelper.createAccessToken(email, Map.of("name", user.getName()));
        result.put("access_token", token);
        result.put("token_type", "bearer");
        result.put("message", email + "님 로그인 성공!");
        result.put("sub", email);
        //추가
        result.put("user_id", user.getUser_id());
        result.put("name", user.getName());        
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/social-login")
    public ResponseEntity<Map<String, Object>> socialLogin(
        @RequestParam String provider,
        @RequestParam String email,
        @RequestParam(required = false) String providerId
    
    ) {
        logger.info("[소셜 로그인] 요청 들어옴");
        logger.info("provider: {}, email: {}, providerId: {}", provider, email, providerId);

        Map<String, Object> result = new HashMap<>();

        Optional<Users> existingUser = userService.findByEmail(email);
        Users user;

        if (existingUser.isEmpty()) {

            user = new Users();
            user.setEmail(email);
            user.setName(email.split("@")[0]); // 이메일 앞부분을 닉네임으로 사용
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setVerified(true); // 소셜 로그인은 이메일 인증 생략
            user.setCreatedAt(LocalDateTime.now());

            logger.info("신규 유저 저장 전: {}", user);
            userService.save(user); // 신규 유저 저장
            logger.info("신규 유저 저장 완료");
        } else {
            user = existingUser.get();
            logger.info("기존 유저: {}", user);
        }

        // jwt 발급
        String token = jwtHelper.createAccessToken(user.getEmail(), Map.of("name", user.getName()));

        result.put("access_token", token);
        result.put("sub", user.getEmail());
        result.put("provider", user.getProvider());
        //추가
        result.put("user_id", user.getUser_id());
        result.put("name", user.getName());

        return ResponseEntity.ok(result);
    }


    
}

