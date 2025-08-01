"use client";
import React, { useEffect } from "react";

import { useState } from "react";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { Switch } from "@/components_admin/ui/switch";
import { Separator } from "@/components_admin/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
import { Eye, EyeOff, Shield, Smartphone, Mail, Phone, User, Building, CheckCircle, AlertTriangle } from "lucide-react";
export default function ProfileDialogs({
  isDarkMode,
  isProfileDialogOpen,
  setIsProfileDialogOpen,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  isSecurityDialogOpen,
  setIsSecurityDialogOpen,
  isHelpDialogOpen,
  setIsHelpDialogOpen
}) {
  // 프로필 설정 상태
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "010-1234-5678",
    role: ""
  });

  // 비밀번호 변경 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState("");

  // 보안 설정 상태
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: true
  });
  const handleProfileSave = () => {
    // 실제로는 API 호출
    console.log("Profile updated:", profileData);
    setIsProfileDialogOpen(false);
  };
  const handlePasswordChange = () => {
    setPasswordError("");
    if (passwordData.currentPassword !== "admin123") {
      setPasswordError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    // 실제로는 API 호출
    console.log("Password changed successfully");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setIsPasswordDialogOpen(false);
  };
  const handleSecuritySave = () => {
    // 실제로는 API 호출
    console.log("Security settings updated:", securitySettings);
    setIsSecurityDialogOpen(false);
  };

  useEffect(() => {
    if(localStorage.getItem("access_token")){

      const email = localStorage.getItem("sub");
      const name = localStorage.getItem("name");
      const role = localStorage.getItem("role");

      const newProfileData = {
        email: email ,
        name: name ,
        role: role // 기본값 설정
      }

      setProfileData(newProfileData);
        
    }
  }, []);

  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Dialog, {
    open: isProfileDialogOpen,
    onOpenChange: setIsProfileDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "프로필 설정"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "사용자 정보를 수정합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "name",
    className: isDarkMode ? "text-gray-300" : ""
  }, /*#__PURE__*/React.createElement(User, {
    className: "h-4 w-4 inline mr-2"
  }), "이름"), /*#__PURE__*/React.createElement(Input, {
    id: "name",
    value: profileData.name,
    onChange: e => setProfileData({
      ...profileData,
      name: e.target.value
    }),
    className: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "email",
    className: isDarkMode ? "text-gray-300" : ""
  }, /*#__PURE__*/React.createElement(Mail, {
    className: "h-4 w-4 inline mr-2"
  }), "이메일"), /*#__PURE__*/React.createElement(Input, {
    id: "email",
    type: "email",
    value: profileData.email,
    onChange: e => setProfileData({
      ...profileData,
      email: e.target.value
    }),
    className: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "phone",
    className: isDarkMode ? "text-gray-300" : ""
  }, /*#__PURE__*/React.createElement(Phone, {
    className: "h-4 w-4 inline mr-2"
  }), "전화번호"), /*#__PURE__*/React.createElement(Input, {
    id: "phone",
    value: profileData.phone,
    onChange: e => setProfileData({
      ...profileData,
      phone: e.target.value
    }),
    className: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "department",
    className: isDarkMode ? "text-gray-300" : ""
  }, /*#__PURE__*/React.createElement(Building, {
    className: "h-4 w-4 inline mr-2"
  }), "부서"), /*#__PURE__*/React.createElement(Input, {
    id: "department",
    value: profileData.role,
    onChange: e => setProfileData({
      ...profileData,
      role: e.target.value
    }),
    className: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
  }))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsProfileDialogOpen(false)
  }, "취소"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleProfileSave
  }, "저장")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isPasswordDialogOpen,
    onOpenChange: setIsPasswordDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "비밀번호 변경"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "current-password",
    className: isDarkMode ? "text-gray-300" : ""
  }, "현재 비밀번호"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "current-password",
    type: showPasswords.current ? "text" : "password",
    value: passwordData.currentPassword,
    onChange: e => setPasswordData({
      ...passwordData,
      currentPassword: e.target.value
    }),
    className: `pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`
  }), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "ghost",
    size: "sm",
    className: "absolute right-0 top-0 h-full px-3 hover:bg-transparent",
    onClick: () => setShowPasswords({
      ...showPasswords,
      current: !showPasswords.current
    })
  }, showPasswords.current ? /*#__PURE__*/React.createElement(EyeOff, {
    className: "h-4 w-4"
  }) : /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "new-password",
    className: isDarkMode ? "text-gray-300" : ""
  }, "새 비밀번호"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "new-password",
    type: showPasswords.new ? "text" : "password",
    value: passwordData.newPassword,
    onChange: e => setPasswordData({
      ...passwordData,
      newPassword: e.target.value
    }),
    className: `pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`
  }), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "ghost",
    size: "sm",
    className: "absolute right-0 top-0 h-full px-3 hover:bg-transparent",
    onClick: () => setShowPasswords({
      ...showPasswords,
      new: !showPasswords.new
    })
  }, showPasswords.new ? /*#__PURE__*/React.createElement(EyeOff, {
    className: "h-4 w-4"
  }) : /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "confirm-password",
    className: isDarkMode ? "text-gray-300" : ""
  }, "새 비밀번호 확인"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Input, {
    id: "confirm-password",
    type: showPasswords.confirm ? "text" : "password",
    value: passwordData.confirmPassword,
    onChange: e => setPasswordData({
      ...passwordData,
      confirmPassword: e.target.value
    }),
    className: `pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`
  }), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "ghost",
    size: "sm",
    className: "absolute right-0 top-0 h-full px-3 hover:bg-transparent",
    onClick: () => setShowPasswords({
      ...showPasswords,
      confirm: !showPasswords.confirm
    })
  }, showPasswords.confirm ? /*#__PURE__*/React.createElement(EyeOff, {
    className: "h-4 w-4"
  }) : /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4"
  })))), passwordError && /*#__PURE__*/React.createElement(Alert, {
    variant: "destructive"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-4 w-4"
  }), /*#__PURE__*/React.createElement(AlertDescription, null, passwordError)), /*#__PURE__*/React.createElement("div", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-2`
  }, /*#__PURE__*/React.createElement("p", null, "비밀번호 요구사항:"), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc list-inside mt-1 space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "최소 8자 이상"), /*#__PURE__*/React.createElement("li", null, "영문, 숫자, 특수문자 조합 필수")))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsPasswordDialogOpen(false)
  }, "취소"), /*#__PURE__*/React.createElement(Button, {
    onClick: handlePasswordChange
  }, "저장")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isSecurityDialogOpen,
    onOpenChange: setIsSecurityDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "보안 설정"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "계정 보안 및 접근 설정을 관리합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "인증 설정"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement(Smartphone, {
    className: "h-5 w-5 text-blue-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "2단계 인증"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "모바일 앱을 통한 추가 인증 절차입니다."))), /*#__PURE__*/React.createElement(Switch, {
    checked: securitySettings.twoFactorEnabled,
    onCheckedChange: checked => setSecuritySettings({
      ...securitySettings,
      twoFactorEnabled: checked
    })
  })), securitySettings.twoFactorEnabled && /*#__PURE__*/React.createElement("div", {
    className: `ml-8 p-3 ${isDarkMode ? "bg-green-900/20" : "bg-green-50"} rounded-lg`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-500 mr-2"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-green-400" : "text-green-700"}`
  }, "2단계 인증이 활성화되어 있습니다.")))))), /*#__PURE__*/React.createElement(Separator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "알림 설정"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement(Mail, {
    className: "h-5 w-5 text-orange-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "이메일 알림"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "중요한 정보가 포함된 이메일을 발송"))), /*#__PURE__*/React.createElement(Switch, {
    checked: securitySettings.emailNotifications,
    onCheckedChange: checked => setSecuritySettings({
      ...securitySettings,
      emailNotifications: checked
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 text-red-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "로그인 알림"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "새로운 기기에서 로그인할 때 알림을 받습니다."))), /*#__PURE__*/React.createElement(Switch, {
    checked: securitySettings.loginAlerts,
    onCheckedChange: checked => setSecuritySettings({
      ...securitySettings,
      loginAlerts: checked
    })
  })))), /*#__PURE__*/React.createElement(Separator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "세션 관리"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "자동 로그아웃"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "30분 비활성화 시 자동 로그아웃")), /*#__PURE__*/React.createElement(Switch, {
    checked: securitySettings.sessionTimeout,
    onCheckedChange: checked => setSecuritySettings({
      ...securitySettings,
      sessionTimeout: checked
    })
  })))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsSecurityDialogOpen(false)
  }, "취소"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleSecuritySave
  }, "저장")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isHelpDialogOpen,
    onOpenChange: setIsHelpDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "도움말"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "PickCoin 관련자 시스템 사용법을 안내합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 py-4 max-h-96 overflow-y-auto"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "주요 기능")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "대시보드"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "실시간 상태 대시보드를 통해 주요 지표를 확인할 수 있습니다.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "사용자 관리"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "사용자 계정을 관리하고 상세 정보를 확인할 수 있습니다.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "1:1 문의"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "사용자 문의사항에 실시간으로 대응할 수 있습니다.")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "단축키")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "새로고침"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + R")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "검색"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + F")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "다크모드 전환"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + D")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "문의하기")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-3`
  }, "시스템 사용 중 문제가 발생하면 아래 연락처로 문의해 주시기 바랍니다."), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(Mail, {
    className: "h-4 w-4 mr-2 text-blue-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "support@pickcoin.com")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(Phone, {
    className: "h-4 w-4 mr-2 text-green-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "1588-1234")))))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setIsHelpDialogOpen(false)
  }, "확인"))));
}