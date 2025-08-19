package com.finalproject.pickcoin.controller;

import com.finalproject.pickcoin.domain.Users;
import com.finalproject.pickcoin.enums.Role;
import com.finalproject.pickcoin.service.EmailService;
// import com.finalproject.pickcoin.repository.UsersRepository;
import com.finalproject.pickcoin.service.UserService;
import com.finalproject.pickcoin.util.JwtHelper;

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
        user.setVerified(false);  /// ??
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
            user.setVerified(true);  //???
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

        Optional<Users> existingUser = userService.findByEmail(email);
        Users user = null;

        // 1) provider + providerId 로 1차 식별 (이미 연동된 경우)
        if (providerId != null && !providerId.isBlank()) {
            user = userService.findByProviderAndProviderId(provider, providerId).orElse(null);
        }

         // 2) (구글) 검증된 이메일 매칭: email로 기존 유저 찾기
        if (user == null && email != null && !email.isBlank()) {
            // 구글은 email_verified=true가 보통이므로 email 우선 매칭
            user = userService.findByEmail(email).orElse(null);
            if (user != null) {
                // 연동정보 최신화
                user.setProvider(provider);
                user.setProviderId(providerId);
                userService.save(user);
            }
        }

         // 3) 전화번호 매칭 (카카오/구글 공통. OTP 후 phone이 넘어오는 시점에 동작)
        if (user == null && phone != null && !phone.isBlank()) {
            // 전화번호 정규화(선택): 010-1234-5678 -> 01012345678 / +8210... -> 010...
            String normalized = phone.replaceAll("[^0-9]", "");
            if (normalized.startsWith("82")) normalized = "0" + normalized.substring(2);

            user = userService.findByPhone(normalized).orElse(null);
            if (user != null) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                if (user.getEmail() == null || user.getEmail().isBlank()) {
                    user.setEmail(email);
                }
                // phone은 기존 계정의 것을 그대로 유지
                userService.save(user);
            }
        }

        if (existingUser.isEmpty()) {

            user = new Users();
            user.setEmail(email);
            user.setName(email.split("@")[0]); // 이메일 앞부분을 닉네임으로 사용
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setVerified(true); // 소셜 로그인은 이메일 인증 생략
            user.setCreatedAt(LocalDateTime.now());
            user.setRole(Role.USER);
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); //password는 null 안되므로 임의 값 설정

                // provider별 추가 로직
            if ("google".equalsIgnoreCase(provider)) {
                // logger.info("구글 신규 가입 처리 로직 실행");
                // 필요하면 구글 전용 처리 추가
            } else if ("kakao".equalsIgnoreCase(provider)) {
                // logger.info("카카오 신규 가입 처리 로직 실행");
                // 필요하면 카카오 전용 처리 추가
            }

            // logger.info("신규 유저 저장 전: {}", user);
            userService.save(user);
            // logger.info("신규 유저 저장 완료");
        } else {
            // 기존 유저
            user = existingUser.get();
            // logger.info("기존 유저: {}", user);

            // provider 정보가 다르면 업데이트
            if (!provider.equalsIgnoreCase(user.getProvider())) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                userService.save(user);
                // logger.info("기존 유저 provider 정보 업데이트 완료");
            }
        }



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


    // 전화번호 OTP 검증
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
    // 1) OTP 검증 (컨트롤러의 otpStore/otpExpire는 email 기준으로 저장되어 있음)
    String saved = otpStore.get(email);
    LocalDateTime expiresAt = otpExpire.get(email);
    if (saved == null || expiresAt == null || expiresAt.isBefore(LocalDateTime.now()) || !saved.equals(otp)) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "OTP_INVALID_OR_EXPIRED"));
    }

    // 2) 전화번호 정규화
    String normalized = phone.replaceAll("[^0-9]", "");
    if (normalized.startsWith("82")) normalized = "0" + normalized.substring(2);

    // 3) 소셜 시도 중인 '현재 사용자' 로드
    Users user = userService.findByEmail(email).orElse(null);
    if (user == null && providerId != null) {
        user = userService.findByProviderAndProviderId(provider, providerId).orElse(null);
    }
    if (user == null) {
        // 혹시 소셜로그인에서 아직 레코드가 안만들어진 경우 대비
        user = new Users();
        user.setEmail(email);
        user.setName(email != null ? email.split("@")[0] : null);
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setVerified(true); // 소셜은 이메일 인증 스킵
        user.setCreatedAt(LocalDateTime.now());
        userService.save(user);
    }

    // 4) 전화번호의 '원래 주인' 조회  (※ 예전: "전화번호 UNIQUE 충돌 확인 (요청대로 409 유지)")
    var conflictOpt = userService.findByPhone(normalized);

    if (conflictOpt.isPresent() && !Objects.equals(conflictOpt.get().getUser_id(), user.getUser_id())) {
        // ▶ 병합: 번호 주인(owner) 계정으로 소셜을 붙이고 그 계정으로 로그인 완료
        Users owner = conflictOpt.get();

        // 필요 시 소셜 정보 업데이트(필드명은 현재 엔티티에 맞게)
        if (owner.getProvider() == null) owner.setProvider(provider);
        if (owner.getProviderId() == null && providerId != null) owner.setProviderId(providerId);
        if (owner.getPhone() == null) owner.setPhone(normalized); // 방어적 세팅

        userService.save(owner);

        // 6) 일회성 OTP 제거
        otpStore.remove(email);
        otpExpire.remove(email);

        // 7) 토큰 발급 & 응답 (프론트 기대 키에 맞춤)  — owner 기준
        String access = jwtHelper.createAccessToken(owner.getEmail(), Map.of("name", owner.getName()));
        String refresh = jwtHelper.createRefreshToken(owner.getEmail(), 14);

        Map<String, Object> result = new HashMap<>();
        result.put("access_token", access);
        result.put("refresh_token", refresh);
        result.put("email", owner.getEmail());
        result.put("user_id", owner.getUser_id());
        result.put("name", owner.getName());
        result.put("provider", owner.getProvider());
        result.put("needPhone", false);
        return ResponseEntity.ok(result);
    }

    // 5) 업데이트 & 저장
    user.setPhone(normalized);
    if (user.getProvider() == null) user.setProvider(provider);
    if (user.getProviderId() == null && providerId != null) user.setProviderId(providerId);
    userService.save(user);

    // 6) 일회성 OTP 제거
    otpStore.remove(email);
    otpExpire.remove(email);

    // 7) 토큰 발급 & 응답 (프론트 기대 키에 맞춤)
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
        try{
            MDC.put("event_type", "login");
        logger.info("유저 로그아웃 발생 - 사용자: {}", email);
        }finally{
            MDC.remove("event_type");
        }
        logged_users.remove(email);
        
        return ResponseEntity.ok("logout");
    }
    
}

