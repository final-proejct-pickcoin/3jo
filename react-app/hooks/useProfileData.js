import { useState, useEffect, useCallback } from "react";

// 상수 정의
const INITIAL_PROFILE_DATA = {
  name: "",
  email: "",
  phone: "010-1234-5678",
  role: ""
};

const INITIAL_PASSWORD_DATA = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const INITIAL_SHOW_PASSWORDS = {
  current: false,
  new: false,
  confirm: false
};

const INITIAL_SECURITY_SETTINGS = {
  twoFactorEnabled: true,
  emailNotifications: true,
  loginAlerts: true,
  sessionTimeout: true
};

// 비밀번호 검증 규칙
const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  ADMIN_PASSWORD: "admin123"
};

const PASSWORD_ERRORS = {
  WRONG_CURRENT: "현재 비밀번호가 올바르지 않습니다.",
  TOO_SHORT: `새 비밀번호는 ${PASSWORD_RULES.MIN_LENGTH}자 이상이어야 합니다.`,
  NOT_MATCH: "새 비밀번호가 일치하지 않습니다."
};

export const useProfileData = () => {
  const [profileData, setProfileData] = useState(INITIAL_PROFILE_DATA);
  const [passwordData, setPasswordData] = useState(INITIAL_PASSWORD_DATA);
  const [showPasswords, setShowPasswords] = useState(INITIAL_SHOW_PASSWORDS);
  const [passwordError, setPasswordError] = useState("");
  const [securitySettings, setSecuritySettings] = useState(INITIAL_SECURITY_SETTINGS);

  // 다크모드 클래스 헬퍼
  const getDarkClass = useCallback((lightClass = "", darkClass = "") => 
    (isDarkMode) => isDarkMode ? darkClass : lightClass, []);

  // 범용 입력 핸들러 생성기
  const createInputHandler = useCallback((setter) => (field) => (e) => {
    setter(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // 토글 함수들
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const toggleSecuritySetting = useCallback((setting) => (checked) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: checked }));
  }, []);

  // 비밀번호 검증 함수
  const validatePassword = useCallback(() => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (currentPassword !== PASSWORD_RULES.ADMIN_PASSWORD) {
      return PASSWORD_ERRORS.WRONG_CURRENT;
    }
    if (newPassword.length < PASSWORD_RULES.MIN_LENGTH) {
      return PASSWORD_ERRORS.TOO_SHORT;
    }
    if (newPassword !== confirmPassword) {
      return PASSWORD_ERRORS.NOT_MATCH;
    }
    
    return null;
  }, [passwordData]);

  // 액션 핸들러들
  const handleProfileSave = useCallback((onClose) => {
    console.log("Profile updated:", profileData);
    onClose();
  }, [profileData]);

  const handlePasswordChange = useCallback((onClose) => {
    setPasswordError("");
    
    const error = validatePassword();
    if (error) {
      setPasswordError(error);
      return;
    }

    console.log("Password changed successfully");
    setPasswordData(INITIAL_PASSWORD_DATA);
    onClose();
  }, [validatePassword]);

  const handleSecuritySave = useCallback((onClose) => {
    console.log("Security settings updated:", securitySettings);
    onClose();
  }, [securitySettings]);

  // 로컬스토리지에서 프로필 데이터 로드
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const userData = {
      email: localStorage.getItem("sub") || "",
      name: localStorage.getItem("name") || "",
      role: localStorage.getItem("role") || "",
      phone: "010-1234-5678"
    };

    setProfileData(userData);
  }, []);

  // 프로필/비밀번호 전용 입력 핸들러들
  const profileInputHandler = createInputHandler(setProfileData);
  const passwordInputHandler = createInputHandler(setPasswordData);

  return {
    // 상태값들
    profileData,
    passwordData,
    showPasswords,
    passwordError,
    securitySettings,
    
    // 상태 설정 함수들
    setProfileData,
    setPasswordData,
    
    // 헬퍼 함수들
    getDarkClass,
    
    // 입력 핸들러들
    profileInputHandler,
    passwordInputHandler,
    
    // 토글 함수들
    togglePasswordVisibility,
    toggleSecuritySetting,
    
    // 액션 핸들러들
    handleProfileSave,
    handlePasswordChange,
    handleSecuritySave
  };
};
