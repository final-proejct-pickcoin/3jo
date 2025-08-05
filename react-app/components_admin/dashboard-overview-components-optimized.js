import React, { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Button } from "@/components_admin/ui/button";
import { Badge } from "@/components_admin/ui/badge";
import { Progress } from "@/components_admin/ui/progress";
import { TrendingUp, Server, Shield } from "lucide-react";
import { DASHBOARD_STYLES, ICON_THEMES } from "./dashboard-overview-styles";

// 통계 카드 - 트렌드 표시 최적화
const TrendIndicator = memo(({ trend }) => (
  <div className={DASHBOARD_STYLES.statTrend}>
    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
    <span className="text-sm text-green-600">{trend}</span>
  </div>
));

// 통계 카드
export const StatCard = memo(({ title, value, icon: Icon, trend, theme = "blue" }) => {
  const gradientMap = {
    orange: "bg-gradient-to-br from-orange-500 to-amber-500",
    blue: "bg-gradient-to-br from-blue-500 to-cyan-500", 
    green: "bg-gradient-to-br from-green-500 to-emerald-500",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500"
  };
  
  return (
    <Card className={`relative overflow-hidden border-0 ${gradientMap[theme]} text-white shadow-lg`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/20"></div>
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
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
export const ChartCard = memo(({ title, children }) => (
  <Card className={`${DASHBOARD_STYLES.card} bg-card border shadow-sm`}>
    <CardHeader>
      <CardTitle className={DASHBOARD_STYLES.chartTitle}>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
));

// 대기 목록 아이템
export const PendingItem = memo(({ item, actions }) => (
  <div className={DASHBOARD_STYLES.pendingItem}>
    <div>
      <p className={DASHBOARD_STYLES.pendingUser}>{item.user}</p>
      <p className={DASHBOARD_STYLES.pendingDetails}>
        {item.amount || item.level} • {item.time || item.submitted}
      </p>
    </div>
    <div className={DASHBOARD_STYLES.pendingActions}>{actions}</div>
  </div>
));

// 대기 목록 카드
export const PendingCard = memo(({ title, description, count, icon: Icon, children }) => (
  <Card className={`${DASHBOARD_STYLES.card} bg-card border shadow-sm`}>
    <CardHeader>
      <CardTitle className={`${DASHBOARD_STYLES.chartTitle} flex items-center`}>
        <Icon className="h-5 w-5 mr-2" />
        {title} ({count})
      </CardTitle>
      <CardDescription className="text-gray-400">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className={DASHBOARD_STYLES.pendingList}>{children}</div>
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

export const SystemStatusCard = memo(({ systemLoad }) => (
  <Card className={`${DASHBOARD_STYLES.card} bg-card border shadow-sm`}>
    <CardHeader>
      <CardTitle className={DASHBOARD_STYLES.chartTitle}>시스템 상태</CardTitle>
    </CardHeader>
    <CardContent className={DASHBOARD_STYLES.systemStatus}>
      <div>
        <div className={DASHBOARD_STYLES.progressLabel}>
          <span className="text-gray-300">CPU 사용률</span>
          <span className="text-white">{systemLoad}%</span>
        </div>
        <Progress value={systemLoad} className="h-2" />
      </div>
      <div className={DASHBOARD_STYLES.statusItem}>
        <span className="text-gray-300">서버 상태</span>
        <StatusBadge icon={Server} label="정상" color="green" />
      </div>
      <div className={DASHBOARD_STYLES.statusItem}>
        <span className="text-gray-300">보안 상태</span>
        <StatusBadge icon={Shield} label="안전" color="blue" />
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
