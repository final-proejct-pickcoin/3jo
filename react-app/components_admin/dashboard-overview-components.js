import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Button } from "@/components_admin/ui/button";
import { Badge } from "@/components_admin/ui/badge";
import { Progress } from "@/components_admin/ui/progress";
import { TrendingUp, Server, Shield, AlertCircle } from "lucide-react";
import { getCardClass, getTitleClass, getSubtitleClass } from './utils/theme-utils';

// 통계 카드 - 트렌드 표시 최적화
const TrendIndicator = memo(({ trend }) => (
  <div className="flex items-center mt-2">
    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
    <span className="text-sm text-green-600">{trend}</span>
  </div>
));

// 통계 카드
export const StatCard = memo(({ title, value, subtitle, icon: Icon, trend, theme = "blue", isDarkMode = false }) => {
  const gradientMap = {
    orange: "bg-gradient-to-br from-orange-500 to-amber-500",
    blue: "bg-gradient-to-br from-blue-500 to-cyan-500", 
    green: "bg-gradient-to-br from-green-500 to-emerald-500",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500"
  };
  
  const baseCardClass = isDarkMode 
    ? "relative overflow-hidden border border-gray-700 shadow-lg" 
    : "relative overflow-hidden border-0 shadow-lg";
  
  return (
    <Card className={`${baseCardClass} ${gradientMap[theme]} text-white`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium">{title}</p>
            <div className="flex items-baseline space-x-2 mt-2">
              <p className="text-3xl font-bold text-white">{value}</p>
              {subtitle && (
                <span className="text-lg text-white/80">{subtitle}</span>
              )}
            </div>
            {trend && (
              <div className="flex items-center mt-3">
                <TrendingUp className="h-4 w-4 text-white/80 mr-1" />
                <span className="text-sm text-white/80">{trend}</span>
              </div>
            )}
          </div>
          <Icon className="h-12 w-12 text-white/70" />
        </div>
      </CardContent>
    </Card>
  );
});

// 차트 카드
export const ChartCard = memo(({ title, subtitle, children, isDarkMode = false }) => (
  <Card className="border shadow-sm bg-card text-card-foreground">
    <CardHeader>
      <CardTitle className="text-card-foreground">{title}</CardTitle>
      {subtitle && (
        <CardDescription className="text-muted-foreground">{subtitle}</CardDescription>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
));

// 대기 목록 아이템
export const PendingItem = memo(({ item, actions, isDarkMode = false }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
    <div>
      <p className="font-medium text-foreground">{item.user}</p>
      <p className="text-sm text-muted-foreground">
        {item.amount || item.level} • {item.time || item.submitted}
      </p>
    </div>
    <div className="flex items-center space-x-2">{actions}</div>
  </div>
));

// 대기 목록 카드
export const PendingCard = memo(({ title, description, count, icon: Icon, children, isDarkMode = false }) => (
  <Card className="border shadow-sm bg-card text-card-foreground">
    <CardHeader>
      <CardTitle className="text-card-foreground flex items-center">
        <Icon className="h-5 w-5 mr-2" />
        {title} ({count})
      </CardTitle>
      <CardDescription className="text-muted-foreground">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">{children}</div>
    </CardContent>
  </Card>
));

// 시스템 상태 카드 - 상태 아이템 최적화
const StatusBadge = memo(({ icon: Icon, label, color }) => (
  <Badge variant="default" className={`bg-${color}-600`}>
    <Icon className="h-3 w-3 mr-1" />
    {label}
  </Badge>
));

export const SystemStatusCard = memo(({ title = "시스템 상태", systemLoad, uptime, responseTime, isDarkMode = false }) => (
  <Card className="border shadow-sm bg-card text-card-foreground">
    <CardHeader>
      <CardTitle className="text-card-foreground flex items-center">
        <Server className="h-5 w-5 mr-2" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">서버 가동률</span>
          <span className="text-foreground">{uptime || 99.9}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${uptime || 99.9}%` }}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">시스템 부하</span>
          <span className="text-foreground">{systemLoad}%</span>
        </div>
        <Progress value={systemLoad} className="h-2" />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">응답 시간</span>
        <span className="text-foreground">{responseTime || 15}ms</span>
      </div>
    </CardContent>
  </Card>
));

// 보안 현황 카드
export const SecurityCard = memo(({ title = "보안 현황", normalLogins, failedLogins, blockedIPs, isDarkMode = false }) => (
  <Card className="border shadow-sm bg-card text-card-foreground">
    <CardHeader>
      <CardTitle className="text-card-foreground flex items-center">
        <Shield className="h-5 w-5 mr-2" />
        보안 현황
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">정상 로그인</span>
        <Badge variant="secondary" className="bg-gray-800 text-white">
          1,234건
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">실패한 로그인</span>
        <Badge variant="secondary" className="bg-gray-600 text-white">
          23건
        </Badge>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">차단된 IP</span>
        <Badge variant="destructive" className="bg-red-600 text-white">
          3개
        </Badge>
      </div>
    </CardContent>
  </Card>
));

// 최근 알림 카드
export const AlertCard = memo(({ title = "최근 알림", isDarkMode = false }) => (
  <Card className="border shadow-sm bg-card text-card-foreground">
    <CardHeader>
      <CardTitle className="text-card-foreground flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        최근 알림
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-muted-foreground">시스템 백업 완료</span>
        </div>
        <span className="text-sm text-muted-foreground">5분 전</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-muted-foreground">CPU 사용률 증가</span>
        </div>
        <span className="text-sm text-muted-foreground">12분 전</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-muted-foreground">신규 사용자 가입</span>
        </div>
        <span className="text-sm text-muted-foreground">18분 전</span>
      </div>
    </CardContent>
  </Card>
));

// displayName을 객체로 일괄 설정
Object.assign(TrendIndicator, { displayName: "TrendIndicator" });
Object.assign(StatusBadge, { displayName: "StatusBadge" });
Object.assign(StatCard, { displayName: "StatCard" });
Object.assign(ChartCard, { displayName: "ChartCard" });
Object.assign(PendingItem, { displayName: "PendingItem" });
Object.assign(PendingCard, { displayName: "PendingCard" });
Object.assign(SystemStatusCard, { displayName: "SystemStatusCard" });
Object.assign(SecurityCard, { displayName: "SecurityCard" });
Object.assign(AlertCard, { displayName: "AlertCard" });
