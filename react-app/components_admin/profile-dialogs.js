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
  }, "\uD504\uB85C\uD544 \uC124\uC815"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "\uAD00\uB9AC\uC790 \uACC4\uC815 \uC815\uBCF4\uB97C \uC218\uC815\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "name",
    className: isDarkMode ? "text-gray-300" : ""
  }, /*#__PURE__*/React.createElement(User, {
    className: "h-4 w-4 inline mr-2"
  }), "\uC774\uB984"), /*#__PURE__*/React.createElement(Input, {
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
  }), "\uC774\uBA54\uC77C"), /*#__PURE__*/React.createElement(Input, {
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
  }), "\uC804\uD654\uBC88\uD638"), /*#__PURE__*/React.createElement(Input, {
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
  }), "\uBD80\uC11C"), /*#__PURE__*/React.createElement(Input, {
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
  }, "\uCDE8\uC18C"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleProfileSave
  }, "\uC800\uC7A5")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isPasswordDialogOpen,
    onOpenChange: setIsPasswordDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "\uBCF4\uC548\uC744 \uC704\uD574 \uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uB97C \uD655\uC778\uD55C \uD6C4 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC124\uC815\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "current-password",
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638"), /*#__PURE__*/React.createElement("div", {
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
  }, "\uC0C8 \uBE44\uBC00\uBC88\uD638"), /*#__PURE__*/React.createElement("div", {
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
  }, "\uC0C8 \uBE44\uBC00\uBC88\uD638 \uD655\uC778"), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("p", null, "\uBE44\uBC00\uBC88\uD638 \uC694\uAD6C\uC0AC\uD56D:"), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc list-inside mt-1 space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "\uCD5C\uC18C 8\uC790 \uC774\uC0C1"), /*#__PURE__*/React.createElement("li", null, "\uC601\uBB38, \uC22B\uC790, \uD2B9\uC218\uBB38\uC790 \uC870\uD569 \uAD8C\uC7A5")))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsPasswordDialogOpen(false)
  }, "\uCDE8\uC18C"), /*#__PURE__*/React.createElement(Button, {
    onClick: handlePasswordChange
  }, "\uBCC0\uACBD")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isSecurityDialogOpen,
    onOpenChange: setIsSecurityDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "\uBCF4\uC548 \uC124\uC815"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "\uACC4\uC815 \uBCF4\uC548 \uBC0F \uC54C\uB9BC \uC124\uC815\uC744 \uAD00\uB9AC\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "\uC778\uC99D \uC124\uC815"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement(Smartphone, {
    className: "h-5 w-5 text-blue-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "2\uB2E8\uACC4 \uC778\uC99D"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uBAA8\uBC14\uC77C \uC571\uC744 \uD1B5\uD55C \uCD94\uAC00 \uBCF4\uC548 \uC778\uC99D"))), /*#__PURE__*/React.createElement(Switch, {
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
  }, "2\uB2E8\uACC4 \uC778\uC99D\uC774 \uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4"))))), /*#__PURE__*/React.createElement(Separator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "\uC54C\uB9BC \uC124\uC815"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement(Mail, {
    className: "h-5 w-5 text-orange-500"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "\uC774\uBA54\uC77C \uC54C\uB9BC"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uC911\uC694\uD55C \uBCF4\uC548 \uC774\uBCA4\uD2B8 \uC2DC \uC774\uBA54\uC77C \uBC1C\uC1A1"))), /*#__PURE__*/React.createElement(Switch, {
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
  }, "\uB85C\uADF8\uC778 \uC54C\uB9BC"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uC0C8\uB85C\uC6B4 \uAE30\uAE30\uC5D0\uC11C \uB85C\uADF8\uC778 \uC2DC \uC54C\uB9BC"))), /*#__PURE__*/React.createElement(Switch, {
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
  }, "\uC138\uC158 \uAD00\uB9AC"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "\uC790\uB3D9 \uB85C\uADF8\uC544\uC6C3"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "30\uBD84 \uBE44\uD65C\uC131 \uC2DC \uC790\uB3D9 \uB85C\uADF8\uC544\uC6C3")), /*#__PURE__*/React.createElement(Switch, {
    checked: securitySettings.sessionTimeout,
    onCheckedChange: checked => setSecuritySettings({
      ...securitySettings,
      sessionTimeout: checked
    })
  })))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsSecurityDialogOpen(false)
  }, "\uCDE8\uC18C"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleSecuritySave
  }, "\uC800\uC7A5")))), /*#__PURE__*/React.createElement(Dialog, {
    open: isHelpDialogOpen,
    onOpenChange: setIsHelpDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "\uB3C4\uC6C0\uB9D0"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "PickCoin \uAD00\uB9AC\uC790 \uC2DC\uC2A4\uD15C \uC0AC\uC6A9\uBC95\uC744 \uC548\uB0B4\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 py-4 max-h-96 overflow-y-auto"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "\uC8FC\uC694 \uAE30\uB2A5")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "\uB300\uC2DC\uBCF4\uB4DC"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uC2E4\uC2DC\uAC04 \uC2DC\uC2A4\uD15C \uD604\uD669\uACFC \uC8FC\uC694 \uC9C0\uD45C\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "\uC0AC\uC6A9\uC790 \uAD00\uB9AC"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uC0AC\uC6A9\uC790 \uACC4\uC815 \uC0C1\uD0DC\uB97C \uAD00\uB9AC\uD558\uACE0 \uC0C1\uC138 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "1:1 \uBB38\uC758"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "\uC0AC\uC6A9\uC790 \uBB38\uC758\uC0AC\uD56D\uC5D0 \uC2E4\uC2DC\uAC04\uC73C\uB85C \uC751\uB2F5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "\uB2E8\uCD95\uD0A4")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "\uC0C8\uB85C\uACE0\uCE68"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + R")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "\uAC80\uC0C9"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + F")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, "\uB2E4\uD06C\uBAA8\uB4DC \uC804\uD658"), /*#__PURE__*/React.createElement("code", {
    className: `text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`
  }, "Ctrl + D")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-700 border-gray-600" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg ${isDarkMode ? "text-white" : ""}`
  }, "\uBB38\uC758\uD558\uAE30")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-3`
  }, "\uC2DC\uC2A4\uD15C \uC0AC\uC6A9 \uC911 \uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD558\uBA74 \uC544\uB798 \uC5F0\uB77D\uCC98\uB85C \uBB38\uC758\uD574\uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
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
  }, "\uD655\uC778")))));
}