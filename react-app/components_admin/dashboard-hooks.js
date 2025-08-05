import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Activity, DollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import { DASHBOARD_STYLES } from "./dashboard-styles";

// 실시간 데이터 업데이트 훅
export const useRealTimeData = () => {
  const [realTimeData, setRealTimeData] = useState({
    onlineUsers: 1247,
    activeTrades: 342,
    systemLoad: 68,
    responseTime: 15
  });

  const updateRealTimeData = useCallback(() => {
    setRealTimeData(prev => ({
      onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 20 - 10),
      activeTrades: prev.activeTrades + Math.floor(Math.random() * 10 - 5),
      systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 6 - 3))),
      responseTime: Math.max(5, prev.responseTime + Math.floor(Math.random() * 4 - 2))
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateRealTimeData, 3000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  return realTimeData;
};

// 메트릭 데이터 생성 훅 (최적화된 버전)
export const useMetricsData = (realTimeData) => {
  return useMemo(() => {
    const createMetric = (title, value, change, icon, colorKey) => ({
      title, value, change, icon,
      gradient: DASHBOARD_STYLES.gradients[colorKey],
      textColor: DASHBOARD_STYLES.textColors[colorKey],
      iconColor: DASHBOARD_STYLES.iconColors[colorKey]
    });

    return [
      createMetric("총 사용자", "15,420", "+12.5%", Users, "orange"),
      createMetric("온라인 사용자", realTimeData.onlineUsers.toLocaleString(), "실시간", Activity, "blue"),
      createMetric("24시간 거래량", "28,450 BTC", "+8.3%", DollarSign, "green"),
      createMetric("수수료 수익", "$847K", "+15.2%", DollarSign, "purple")
    ];
  }, [realTimeData.onlineUsers]);
};

// 활동 피드 데이터 생성 훅 (최적화된 버전)
export const useActivityFeeds = () => {
  return useMemo(() => {
    const createFeed = (icon, title, description, time, variant) => ({
      icon, title, description, time, variant
    });

    return [
      createFeed(
        CheckCircle, 
        "대용량 거래 처리 완료",
        "BTC/USDT 거래쌍에서 1,000 BTC 거래가 성공적으로 처리되었습니다.",
        "방금 전",
        "success"
      ),
      createFeed(
        AlertTriangle,
        "시스템 부하 증가",
        "CPU 사용률이 85%에 도달했습니다. 모니터링이 필요합니다.",
        "2분 전",
        "warning"
      ),
      createFeed(
        Users,
        "신규 사용자 급증",
        "지난 1시간 동안 234명의 신규 사용자가 가입했습니다.",
        "5분 전",
        "info"
      )
    ];
  }, []);
};
