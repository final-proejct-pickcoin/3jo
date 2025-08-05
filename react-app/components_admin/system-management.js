"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Switch } from "@/components_admin/ui/switch";
import { Progress } from "@/components_admin/ui/progress";
import { 
  Shield, 
  Database, 
  Activity, 
  Settings, 
  Lock, 
  Globe, 
  Timer,
  Download,
  CheckCircle
} from "lucide-react";

const SystemManagement = ({ isDarkMode }) => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    ipWhitelist: true,
    sessionTimeout: true
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true
  });

  const handleSecurityToggle = (setting) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleBackupToggle = () => {
    setBackupSettings(prev => ({
      ...prev,
      autoBackup: !prev.autoBackup
    }));
  };

  const handleManualBackup = () => {
    console.log("Manual backup initiated");
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen p-6`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>시스템 관리</h1>
        <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>시스템 보안 및 환경 제어</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 보안 설정 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={`flex items-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Shield className="h-5 w-5 mr-2" />
              보안 설정
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              시스템 보안 및 접근 제어
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>2단계 인증 필수</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>모든 관리자 계정에 2FA 적용</p>
              </div>
              <Switch
                checked={securitySettings.twoFactor}
                onCheckedChange={() => handleSecurityToggle('twoFactor')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>IP 화이트리스트</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>허용된 IP에서만 접근 가능</p>
              </div>
              <Switch
                checked={securitySettings.ipWhitelist}
                onCheckedChange={() => handleSecurityToggle('ipWhitelist')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>세션 타임아웃</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>30분 비활성 시 자동 로그아웃</p>
              </div>
              <Switch
                checked={securitySettings.sessionTimeout}
                onCheckedChange={() => handleSecurityToggle('sessionTimeout')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 백업 관리 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={`flex items-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Database className="h-5 w-5 mr-2" />
              백업 관리
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              데이터 백업 및 복구 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>자동 백업</p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>매일 새벽 2시 자동 백업</p>
              </div>
              <Switch
                checked={backupSettings.autoBackup}
                onCheckedChange={handleBackupToggle}
              />
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"} mb-2`}>마지막 백업</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>2024-01-15 02:00</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>크기: 2.4GB</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  성공
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleManualBackup}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              수동 백업 실행
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 시스템 상태 */}
      <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader>
          <CardTitle className={`flex items-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <Activity className="h-5 w-5 mr-2" />
            시스템 상태
          </CardTitle>
          <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            실시간 시스템 모니터링
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={`text-center p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-green-50"}`}>
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>가동률</div>
            </div>

            <div className={`text-center p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}>
              <div className="text-3xl font-bold text-blue-600 mb-2">68%</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>CPU 사용률</div>
            </div>

            <div className={`text-center p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-purple-50"}`}>
              <div className="text-3xl font-bold text-purple-600 mb-2">72%</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>메모리 사용률</div>
            </div>

            <div className={`text-center p-6 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-orange-50"}`}>
              <div className="text-3xl font-bold text-orange-600 mb-2">15ms</div>
              <div className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>응답 시간</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemManagement;
