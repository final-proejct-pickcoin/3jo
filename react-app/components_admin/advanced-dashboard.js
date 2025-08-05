"use client";

import { memo } from "react";
import { DASHBOARD_STYLES } from "./dashboard-styles";
import {
  MetricsSection, PerformanceSection, SecuritySection,
  TradingAnalysisSection, RevenueSection, ActivityFeedSection
} from "./dashboard-sections";
import { useRealTimeData, useMetricsData, useActivityFeeds } from "./dashboard-hooks";

// 메모화된 메인 대시보드 컴포넌트
const AdvancedDashboard = memo(() => {
  // 커스텀 훅으로 데이터 관리
  const realTimeData = useRealTimeData();
  const metricsData = useMetricsData(realTimeData);
  const activityFeeds = useActivityFeeds();

  return (
    <div className={DASHBOARD_STYLES.mainContainer}>
      <MetricsSection metricsData={metricsData} />
      
      <div className={DASHBOARD_STYLES.contentGrid}>
        <PerformanceSection />
        <SecuritySection />
      </div>

      <TradingAnalysisSection />
      <RevenueSection />
      <ActivityFeedSection activityFeeds={activityFeeds} />
    </div>
  );
});

AdvancedDashboard.displayName = "AdvancedDashboard";

export default AdvancedDashboard;
