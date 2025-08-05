import { useState, useEffect, useCallback, useMemo } from "react";
import { INITIAL_STATS } from "./dashboard-overview-data";

// Dashboard Overview 상태 관리 훅
export const useDashboardStats = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(true);

  // 실시간 데이터 업데이트 (메모이제이션)
  const updateRealTimeData = useCallback(() => {
    setStats(prev => ({
      ...prev,
      onlineUsers: Math.max(0, prev.onlineUsers + Math.floor(Math.random() * 20 - 10)),
      systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 6 - 3)))
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateRealTimeData, 5000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  // 데이터 새로고침 (최적화)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + Math.floor(Math.random() * 10),
      dailyVolume: prev.dailyVolume + Math.random() * 1000,
      revenue: prev.revenue + Math.floor(Math.random() * 10000)
    }));
    
    setIsRefreshing(false);
  }, []);

  // 거래 토글 (최적화)
  const handleTradingToggle = useCallback(() => {
    setTradingEnabled(prev => !prev);
  }, []);

  // 통계 포맷팅 (메모이제이션)
  const formattedStats = useMemo(() => ({
    totalUsers: stats.totalUsers.toLocaleString(),
    onlineUsers: stats.onlineUsers.toLocaleString(),
    dailyVolume: `$${stats.dailyVolume.toLocaleString()}`,
    revenue: `$${stats.revenue.toLocaleString()}`,
    systemLoad: stats.systemLoad
  }), [stats]);

  return {
    stats: formattedStats,
    isRefreshing,
    tradingEnabled,
    handleRefresh,
    handleTradingToggle
  };
};

// 액션 핸들러 훅 (최적화)
export const useDashboardActions = () => {
  const handleWithdrawalApproval = useCallback((id, action) => {
    console.log(`Withdrawal ${id} ${action}ed`);
    // 실제로는 API 호출
  }, []);

  const handleKycReview = useCallback((id) => {
    console.log(`KYC ${id} review`);
    // 실제로는 KYC 상세 페이지로 이동
  }, []);

  return useMemo(() => ({
    handleWithdrawalApproval,
    handleKycReview
  }), [handleWithdrawalApproval, handleKycReview]);
};
