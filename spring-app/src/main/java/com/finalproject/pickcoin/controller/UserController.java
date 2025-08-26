package com.finalproject.pickcoin.controller;

import com.finalproject.pickcoin.domain.Users;
import com.finalproject.pickcoin.enums.Role;
import com.finalproject.pickcoin.service.EmailService;
import com.finalproject.pickcoin.service.StatsService;
// import com.finalproject.pickcoin.repository.UsersRepository;
import com.finalproject.pickcoin.service.UserService;
import com.finalproject.pickcoin.util.JwtHelper;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/users")
@Transactional
@RequiredArgsConstructor 
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

    private ArrayList<String> logged_users = new ArrayList<String>();

    private final Map<String, String> otpStore = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> otpExpire = new ConcurrentHashMap<>();
    private final StatsService statsService;

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String name,
            @RequestParam String phone) {

        // logger.info("=========register 호출 ===========");
        Map<String, Object> result = new HashMap<>();
        
        try{
            MDC.put("event_type", "register");
            MDC.put("email", email);
            logger.info("[회원가입 시도] name={}", name);
        }finally{
            MDC.remove("event_type");
            MDC.remove("email");
        }
        


        if (userService.findByEmail(email).isPresent()) {
            result.put("error", "이미 존재하는 이메일입니다.");
            return ResponseEntity.badRequest().body(result);
        }

        if (userService.findByPhone(phone).isPresent()) {
            result.put("error", "이미 존재하는 전화번호입니다.");
            return ResponseEntity.badRequest().body(result);
        }

        // email 인증 token 생성
        String token = UUID.randomUUID().toString();

        Users user = new Users();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setPhone(phone);
        user.setRole(Role.USER);
        user.setVerified(false);  // 이메일 인증 전에는 false
        user.setCreatedAt(LocalDateTime.now());
        user.setVerificationToken(token);        
        // 인증 만료 시간 5분
        user.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        user.setProvider("pickcoin");

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
            user.setVerified(true);  
            user.setVerificationToken(null);
            userService.save(user);

            try{
                MDC.put("event_type", "register");
                MDC.put("email", user.getEmail());
                logger.info("[회원가입 성공] name={}", user.getEmail());
            }finally{
                MDC.remove("event_type");
                MDC.remove("email");
            }
            
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

        logged_users.add(email);
        try{
            MDC.put("event_type", "login");
            MDC.put("email", email);
            logger.info("유저 로그인 발생 - 사용자: {}", email);
        }finally{
            MDC.remove("event_type");
            MDC.remove("email");
        }
        
        
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
        String accesstoken = jwtHelper.createAccessToken(email, Map.of("name", user.getName()));
        String refreshToken = jwtHelper.createRefreshToken(email, 14);

        result.put("access_token", accesstoken);
        result.put("token_type", "bearer");
        result.put("refresh_token", refreshToken);
        result.put("message", email + "님 로그인 성공!");
        result.put("sub", email);
        //추가
        result.put("user_id", user.getUser_id());
        result.put("name", user.getName());

        return ResponseEntity.ok(result);
    }
    
    //카카오, 구글 로그인
    @PostMapping("/social-login")
    public ResponseEntity<Map<String, Object>> socialLogin(
        @RequestParam String provider,
        @RequestParam String email,
        @RequestParam(required = false) String providerId,
        @RequestParam(required = false) String phone // 추후 OTP 후 전달받을 자리
    
    ) {
        logged_users.add(email);
        try{
            MDC.put("event_type", "login");
            logger.info("유저 로그인 발생 - 사용자: {}", email);
        }finally{
            MDC.remove("event_type");
        }        

        Map<String, Object> result = new HashMap<>();
        Users user = null;

        // 1) providerId로 소셜 연결된 유저 먼저 탐색 (googleId/kakaoId → 없으면 레거시 provider+providerId)
        if (providerId != null && !providerId.isBlank()) {
            if ("google".equalsIgnoreCase(provider)) {
                user = userService.findByGoogleId(providerId).orElse(null);
            } else if ("kakao".equalsIgnoreCase(provider)) {
                user = userService.findByKakaoId(providerId).orElse(null);
            }
            if (user == null) {
                user = userService.findByProviderAndProviderId(provider, providerId).orElse(null);
            }
        }

        // 2) 전화번호로 매칭
        String normalizedPhone = null;
        if (user == null && phone != null && !phone.isBlank()) {
            normalizedPhone = phone.replaceAll("[^0-9]", "");
            if (normalizedPhone.startsWith("82")) normalizedPhone = "0" + normalizedPhone.substring(2);
            user = userService.findByPhone(normalizedPhone).orElse(null);
        }

        // 3) 이메일로 매칭 (일반 가입 → 소셜 연결 시나리오)
        if (user == null && email != null && !email.isBlank()) {
            user = userService.findByEmail(email).orElse(null);
        }

        // 4) 여기서도 못 찾았으면 →  insert 하지 말고 전화번호 연결 요구
        if (user == null) {
            String temp = jwtHelper.createAccessToken(
                (email != null ? email : provider + "::" + (providerId != null ? providerId : UUID.randomUUID().toString())),
                Map.of("provider", provider, "providerId", providerId == null ? "" : providerId)
            );
            Map<String, Object> body = new HashMap<>();
            body.put("needPhone", true);
            body.put("socialEmail", email);
            body.put("temp_token", temp);
            // 프론트: OTP 요청 → /phone/verify-otp → /link-social 순서로 진행
            return ResponseEntity.status(428).body(body); // 428 Precondition Required
        }

        // 4) 기존 유저를 찾은 경우에만 소셜 정보 채워넣기(업데이트)
        boolean hasPid = (providerId != null && !providerId.isBlank());
        if ("google".equalsIgnoreCase(provider) && hasPid && user.getGoogleId() == null) user.setGoogleId(providerId);
        if ("kakao".equalsIgnoreCase(provider)  && hasPid && user.getKakaoId()  == null) user.setKakaoId(providerId);
        if ((user.getEmail() == null || user.getEmail().isBlank()) && email != null) user.setEmail(email);
        user.setProvider(provider);
        if (hasPid && (user.getProviderId() == null || user.getProviderId().isBlank())) {
            user.setProviderId(providerId); // (레거시 유지용)
        }
        userService.save(user);



        // jwt 발급
        String accesstoken = jwtHelper.createAccessToken(user.getEmail(), Map.of("name", user.getName()));
        String refreshToken = jwtHelper.createRefreshToken(user.getEmail(), 14);

        result.put("access_token", accesstoken);
        result.put("socialEmail", user.getEmail());
        result.put("provider", user.getProvider());
        result.put("refresh_token", refreshToken);
        //추가
        result.put("user_id", user.getUser_id());
        result.put("name", user.getName());

        result.put("needPhone", (user.getPhone() == null || user.getPhone().isBlank()));

        return ResponseEntity.ok(result);
    }

    // 전화번호 OTP 전송
    @PostMapping("/phone/request-otp")
    public ResponseEntity<?> requestOtp(
        @RequestParam String email,
        @RequestParam String phone) {
        // 1) 전화번호 정규화: 숫자만 남기고, +82 → 0 변환
        String normalized = phone.replaceAll("[^0-9]", "");
        if (normalized.startsWith("82")) normalized = "0" + normalized.substring(2);

        // 2) 이미 다른 계정이 쓰는 번호인지 선 체크 (UNIQUE 충돌 방지)
        // var conflict = userService.findByPhone(normalized);

        // if (conflict.isPresent() && !conflict.get().getEmail().equalsIgnoreCase(email)) {
        //     return ResponseEntity.status(HttpStatus.CONFLICT)
        //             .body("이미 사용 중인 전화번호입니다.");
        // }

        // 3) 6자리 OTP 생성 & 3분 유효
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        otpStore.put(email, otp);
        otpExpire.put(email, LocalDateTime.now().plusMinutes(3));

        // TODO: 실제 SMS 발송 연동(개발 환경에선 서버 로그로 OTP 확인)
        logger.info("SMS OTP to {} : {}", normalized, otp);

        return ResponseEntity.ok("인증번호를 전송했습니다.");
    }


    // 전화번호 OTP 검증 (번호만 추가 저장 => 로그인 상태 유지)
    @PostMapping("/phone/verify-otp")
    public ResponseEntity<?> verifyOtp(
        @RequestParam String email,
        @RequestParam String phone,
        @RequestParam String otp) {

        String saved = otpStore.get(email);
        LocalDateTime exp = otpExpire.get(email);

        if (saved == null || exp == null || LocalDateTime.now().isAfter(exp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("OTP가 만료되었거나 없습니다.");
        }
        if (!saved.equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("OTP가 일치하지 않습니다.");
        }

        // 1) 전화번호 정규화
        String normalized = phone.replaceAll("[^0-9]", "");
        if (normalized.startsWith("82")) normalized = "0" + normalized.substring(2);

        // 2) 유저 로드
        Users user = userService.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("사용자 없음");
        }

        // 3) 최종 UNIQUE 충돌 재확인
        var conflict = userService.findByPhone(normalized);
        if (conflict.isPresent() && !Objects.equals(conflict.get().getUser_id(), user.getUser_id())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 사용 중인 전화번호입니다.");
        }

        // 4) 저장
        user.setPhone(normalized);
        userService.save(user);

        // 5) 일회성 OTP 제거
        otpStore.remove(email);
        otpExpire.remove(email);

        return ResponseEntity.ok("전화번호 인증 및 저장 완료");
    }

    @PostMapping("/link-social")
    public ResponseEntity<Map<String, Object>> linkSocial(
            @RequestParam String email,
            @RequestParam String phone,
            @RequestParam String otp,
            @RequestParam String provider,
            @RequestParam(required = false) String providerId,
            @RequestParam(name = "temp_token", required = false) String tempToken // 선택
    ) {
        // 0) OTP 검증
        String saved = otpStore.get(email);
        LocalDateTime expiresAt = otpExpire.get(email);
        if (saved == null || expiresAt == null || expiresAt.isBefore(LocalDateTime.now()) || !saved.equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "OTP_INVALID_OR_EXPIRED"));
        }

        // 1) 전화번호 정규화
        String normalized = phone.replaceAll("[^0-9]", "");
        if (normalized.startsWith("82")) normalized = "0" + normalized.substring(2);

        // 2) "전화번호 소유자(owner)"를 최우선으로 조회
        Users owner = userService.findByPhone(normalized).orElse(null);

        // 3) 보조 조회: 이메일로 기존 사용자 찾기 (일반가입자의 이메일일 수 있음)
        Users byEmail = null;
        if (owner == null && email != null && !email.isBlank()) {
            byEmail = userService.findByEmail(email).orElse(null);
        }

        // 4) 보조 조회: providerId 로 이미 연결된 사용자 찾기
        Users byProv = null;
        if (owner == null && providerId != null && !providerId.isBlank()) {
            if ("google".equalsIgnoreCase(provider)) {
                byProv = userService.findByGoogleId(providerId).orElse(null);
            } else if ("kakao".equalsIgnoreCase(provider)) {
                byProv = userService.findByKakaoId(providerId).orElse(null);
            }
            if (byProv == null) {
                byProv = userService.findByProviderAndProviderId(provider, providerId).orElse(null);
            }
        }

        // 5) 최종 대상 사용자 결정 (owner > byEmail > byProv)
        Users user = (owner != null) ? owner : (byEmail != null ? byEmail : byProv);

        // 6) 그래도 못 찾았을 때만 "새로 생성"
        if (user == null) {
            user = new Users();
            user.setEmail(email);
            user.setName(
                (email != null && email.contains("@"))
                    ? email.substring(0, email.indexOf('@'))
                    : (providerId != null ? provider + "_" + providerId : "user")
            );
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setVerified(true); // 소셜은 이메일 인증 스킵
            user.setCreatedAt(LocalDateTime.now());
            // 전화번호도 바로 세팅 (우리가 OTP로 검증 완료했으므로)
            user.setPhone(normalized);
            userService.save(user);
        }

        // 7) 기존 사용자(특히 owner)를 쓸 때는 전화번호/소셜 정보 "연결만"
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            user.setPhone(normalized); // owner면 이미 있을 것
        }

        boolean hasPid = (providerId != null && !providerId.isBlank());
        if ("google".equalsIgnoreCase(provider) && hasPid && user.getGoogleId() == null) user.setGoogleId(providerId);
        if ("kakao".equalsIgnoreCase(provider)  && hasPid && user.getKakaoId()  == null) user.setKakaoId(providerId);
        if (user.getProvider() == null) user.setProvider(provider);
        if (hasPid && (user.getProviderId() == null || user.getProviderId().isBlank())) {
            user.setProviderId(providerId); // 레거시 유지용
        }
        // 이메일은 기존 일반가입 이메일을 덮지 않도록: 비어있을 때만 세팅
        if ((user.getEmail() == null || user.getEmail().isBlank()) && email != null && !email.isBlank()) {
            user.setEmail(email);
        }
        userService.save(user);

        // 8) OTP 정리
        otpStore.remove(email);
        otpExpire.remove(email);

        // 9) 토큰 발급 & 응답
        String access = jwtHelper.createAccessToken(user.getEmail(), Map.of("name", user.getName()));
        String refresh = jwtHelper.createRefreshToken(user.getEmail(), 14);

        Map<String, Object> result = new HashMap<>();
        result.put("access_token", access);
        result.put("refresh_token", refresh);
        result.put("email", user.getEmail());
        result.put("user_id", user.getUser_id());
        result.put("name", user.getName());
        result.put("provider", user.getProvider());
        result.put("needPhone", false);
    return ResponseEntity.ok(result);
}


    // 로그아웃
    @DeleteMapping("/logout")
public ResponseEntity<?> logout(@RequestParam String email){
    try {
        MDC.put("event_type", "login");
        logger.info("유저 로그아웃 발생 - 사용자: {}", email);
    } finally {
        MDC.remove("event_type");
    }
    logged_users.remove(email);

    // ✅ 로그아웃 시 통계 브로드캐스트
    Map<String, Object> stats = statsService.getCommunityStats();
    StatsController.StatsWebSocket.broadcast(stats);

    return ResponseEntity.ok("logout");
}

@GetMapping("/active-users")
public ResponseEntity<Map<String, Object>> getActiveUsers() {
    Map<String, Object> result = new HashMap<>();
    result.put("activeUsers", logged_users.size()); // 현재 접속자 수
    result.put("users", logged_users); // 접속자 이메일 목록 (옵션)

    // ✅ 조회 시에도 WebSocket push (선택 사항)
    StatsController.StatsWebSocket.broadcast(result);

    return ResponseEntity.ok(result);
}
}

