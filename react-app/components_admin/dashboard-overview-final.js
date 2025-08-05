"use client";
import React, { memo } from "react";
import { Button } from "@/components_admin/ui/button";
import { Users, Activity, DollarSign, TrendingUp, RefreshCw, AlertTriangle, Pause, Play, Eye, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import { 
  CHART_COLORS, 
  TRADING_DATA, 
  COIN_DATA, 
  PENDING_WITHDRAWALS, 
  KYC_PENDING 
} from "./dashboard-overview-data";
import { useDashboardStats, useDashboardActions } from "./dashboard-overview-hooks";
import { DASHBOARD_STYLES, CHART_CONFIG } from "./dashboard-overview-styles";
import { 
  StatCard, 
  ChartCard, 
  PendingItem, 
  PendingCard, 
  SystemStatusCard 
} from "./dashboard-overview-components";

const DashboardOverview = memo(() => {
  const { stats, isRefreshing, tradingEnabled, handleRefresh, handleTradingToggle } = useDashboardStats();
  const { handleWithdrawalApproval, handleKycReview } = useDashboardActions();

  return (
    <div className={DASHBOARD_STYLES.container}>
      {/* 헤더 */}
      <div className={DASHBOARD_STYLES.header}>
        <div>
          <h1 className={DASHBOARD_STYLES.title}>대시보드</h1>
          <p className={DASHBOARD_STYLES.subtitle}>실시간 시스템 현황 및 주요 지표</p>
        </div>
        <div className={DASHBOARD_STYLES.controls}>
          <Button
            onClick={handleTradingToggle}
            variant={tradingEnabled ? "destructive" : "default"}
            size="sm"
          >
            {tradingEnabled ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                거래 중단
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                거래 재개
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 거래 중단 알림 */}
      {!tradingEnabled && (
        <div className={DASHBOARD_STYLES.tradingAlert}>
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">거래가 일시 중단되었습니다.</span>
          </div>
        </div>
      )}

      {/* 통계 카드 그리드 */}
      <div className={DASHBOARD_STYLES.statsGrid}>
        <StatCard title="총 사용자" value={stats.totalUsers} icon={Users} trend="+12.5%" theme="orange" />
        <StatCard title="온라인 사용자" value={stats.onlineUsers} icon={Activity} theme="blue" />
        <StatCard title="일일 거래량" value={stats.dailyVolume} icon={DollarSign} trend="+8.2%" theme="green" />
        <StatCard title="수익" value={stats.revenue} icon={TrendingUp} trend="+15.3%" theme="purple" />
      </div>

      {/* 차트 그리드 */}
      <div className={DASHBOARD_STYLES.chartGrid}>
        <ChartCard title="거래량 추이">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={TRADING_DATA}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="time" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} />
              <Tooltip {...CHART_CONFIG.tooltip} />
              <Line type="monotone" dataKey="volume" stroke={CHART_COLORS[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="코인별 거래량">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={COIN_DATA}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {COIN_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="사용자 활동">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={TRADING_DATA}>
              <CartesianGrid {...CHART_CONFIG.grid} />
              <XAxis dataKey="time" {...CHART_CONFIG.axis} />
              <YAxis {...CHART_CONFIG.axis} />
              <Tooltip {...CHART_CONFIG.tooltip} />
              <Line type="monotone" dataKey="users" stroke={CHART_COLORS[2]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <SystemStatusCard systemLoad={67} />
      </div>

      {/* 대기 작업 그리드 */}
      <div className={DASHBOARD_STYLES.pendingGrid}>
        <PendingCard 
          title="출금 대기" 
          description="승인이 필요한 출금 요청" 
          count={23} 
          icon={Clock}
        >
          {PENDING_WITHDRAWALS.map(item => (
            <PendingItem
              key={item.id}
              item={item}
              actions={
                <>
                  <Button size="sm" onClick={() => handleWithdrawalApproval(item.id, "approve")}>
                    승인
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleWithdrawalApproval(item.id, "reject")}>
                    거절
                  </Button>
                </>
              }
            />
          ))}
        </PendingCard>

        <PendingCard 
          title="KYC 검토 대기" 
          description="신원 확인이 필요한 사용자" 
          count={12} 
          icon={Eye}
        >
          {KYC_PENDING.map(item => (
            <PendingItem
              key={item.id}
              item={item}
              actions={
                <Button size="sm" onClick={() => handleKycReview(item.id)}>
                  <Eye className="h-4 w-4 mr-1" />
                  검토
                </Button>
              }
            />
          ))}
        </PendingCard>
      </div>
    </div>
  );
});

DashboardOverview.displayName = "DashboardOverview";

export default DashboardOverview;
