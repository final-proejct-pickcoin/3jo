"use client";
import React, { useEffect, useState } from "react";

import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { Switch } from "@/components_admin/ui/switch";
import { Separator } from "@/components_admin/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
import { Eye, EyeOff, Shield, Smartphone, Mail, Phone, User, Building, CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";


  const fastapiUrl = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL;
  const springUrl  = process.env.NEXT_PUBLIC_SPRING_BASE_URL;
  const clean = (u) => (u || "").replace(/\/$/, "");

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

    if (passwordData.newPassword.length < 8) {
      setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 유효성 검사
    const formData = new FormData();
    formData.append("email", profileData.email);
    formData.append("currentPassword", passwordData.currentPassword);
    formData.append("newPassword", passwordData.newPassword);
    axios.post(`${clean(fastapiUrl)}/admin/change-pwd`, formData)
      .then(response => {
        console.log(response.data);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        console.log("Password changed successfully");
        setIsPasswordDialogOpen(false);
      }).catch(error => {
        console.error("Error changing password:", error);
        setPasswordError("현재 비밀번호가 일치하지 않습니다.")
      });
  };
  const handleSecuritySave = () => {
    // 실제로는 API 호출
    console.log("Security settings updated:", securitySettings);
    setIsSecurityDialogOpen(false);
  };

  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      const email = localStorage.getItem("sub");
      const name = localStorage.getItem("name");
      const role = localStorage.getItem("role");
      const phone = localStorage.getItem("phone") || "010-1234-5678";

      const newProfileData = {
        email: email,
        name: name,
        role: role, // 기본값 설정
        phone: phone
      }

      setProfileData(newProfileData);
    }
  }, []);

  return (
    <>
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>프로필 설정</DialogTitle>
            <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>사용자 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className={isDarkMode ? "text-gray-300" : ""}>
                <User className="h-4 w-4 inline mr-2" />이름
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                className={isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className={isDarkMode ? "text-gray-300" : ""}>
                <Mail className="h-4 w-4 inline mr-2" />이메일
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                className={isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className={isDarkMode ? "text-gray-300" : ""}>
                <Phone className="h-4 w-4 inline mr-2" />전화번호
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                className={isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department" className={isDarkMode ? "text-gray-300" : ""}>
                <Building className="h-4 w-4 inline mr-2" />부서
              </Label>
              <Input
                id="department"
                value={profileData.role}
                onChange={e => setProfileData({ ...profileData, role: e.target.value })}
                className={isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>취소</Button>
            <Button onClick={handleProfileSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>비밀번호 변경</DialogTitle>
            <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password" className={isDarkMode ? "text-gray-300" : ""}>현재 비밀번호</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password" className={isDarkMode ? "text-gray-300" : ""}>새 비밀번호</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password" className={isDarkMode ? "text-gray-300" : ""}>새 비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`pr-10 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {passwordError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-2`}>
              <p>비밀번호 요구사항:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>최소 8자 이상</li>
                <li>영문, 숫자, 특수문자 조합 필수</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>취소</Button>
            <Button onClick={handlePasswordChange}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
        <DialogContent className={`sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>보안 설정</DialogTitle>
            <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>계정 보안 및 접근 설정을 관리합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>인증 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>2단계 인증</Label>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>모바일 앱을 통한 추가 인증 절차입니다.</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={checked => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                  />
                </div>
                {securitySettings.twoFactorEnabled && (
                  <div className={`ml-8 p-3 ${isDarkMode ? "bg-green-900/20" : "bg-green-50"} rounded-lg`}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className={`text-sm ${isDarkMode ? "text-green-400" : "text-green-700"}`}>2단계 인증이 활성화되어 있습니다.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator className={isDarkMode ? "bg-gray-700" : ""} />
            <div className="space-y-4">
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>알림 설정</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>이메일 알림</Label>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>중요한 정보가 포함된 이메일을 발송</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.emailNotifications}
                    onCheckedChange={checked => setSecuritySettings({ ...securitySettings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-red-500" />
                    <div>
                      <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>로그인 알림</Label>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>새로운 기기에서 로그인할 때 알림을 받습니다.</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={checked => setSecuritySettings({ ...securitySettings, loginAlerts: checked })}
                  />
                </div>
              </div>
            </div>
            <Separator className={isDarkMode ? "bg-gray-700" : ""} />
            <div className="space-y-4">
              <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>세션 관리</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>자동 로그아웃</Label>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>30분 비활성화 시 자동 로그아웃</p>
                </div>
                <Switch
                  checked={securitySettings.sessionTimeout}
                  onCheckedChange={checked => setSecuritySettings({ ...securitySettings, sessionTimeout: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecurityDialogOpen(false)}>취소</Button>
            <Button onClick={handleSecuritySave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent className={`sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>도움말</DialogTitle>
            <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>PickCoin 관련자 시스템 사용법을 안내합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
            <Card className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className={`text-lg ${isDarkMode ? "text-white" : ""}`}>주요 기능</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>대시보드</h4>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>실시간 상태 대시보드를 통해 주요 지표를 확인할 수 있습니다.</p>
                </div>
                <div>
                  <h4 className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>사용자 관리</h4>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>사용자 계정을 관리하고 상세 정보를 확인할 수 있습니다.</p>
                </div>
                <div>
                  <h4 className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>1:1 문의</h4>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>사용자 문의사항에 실시간으로 대응할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className={`text-lg ${isDarkMode ? "text-white" : ""}`}>단축키</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>새로고침</span>
                  <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`}>Ctrl + R</code>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>검색</span>
                  <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`}>Ctrl + F</code>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>다크모드 전환</span>
                  <code className={`text-xs px-2 py-1 rounded ${isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-100"}`}>Ctrl + D</code>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
              <CardHeader>
                <CardTitle className={`text-lg ${isDarkMode ? "text-white" : ""}`}>문의하기</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-3`}>
                  시스템 사용 중 문제가 발생하면 아래 연락처로 문의해 주시기 바랍니다.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-blue-500" />
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>support@pickcoin.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-500" />
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>1588-1234</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpDialogOpen(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
