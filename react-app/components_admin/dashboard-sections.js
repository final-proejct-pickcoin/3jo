import { memo } from "react";
import { Server, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { DASHBOARD_STYLES } from "./dashboard-styles";
import { 
  MetricCard, SecurityMetric, TradingPairItem, 
  ActivityFeedItem, SecurityStatusCard 
} from "./dashboard-components";
import {
  PerformanceChart, TradingPairChart, TradingVolumeChart, RevenueRadialChart
} from "./dashboard-chart-components";
import {
  performanceData, tradingPairData, tradingVolumeData, 
  revenueStreamData, securityMetrics, CHART_COLORS
} from "./dashboard-data";

// 메트릭 카드 섹션
export const MetricsSection = memo(({ metricsData }) => (
  <div className={DASHBOARD_STYLES.metricsGrid}>
    {metricsData.map((metric, index) => (
      <MetricCard key={index} {...metric} />
    ))}
  </div>
));

// 성능 모니터링 섹션
export const PerformanceSection = memo(() => (
  <Card className="lg:col-span-2 bg-card border shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Server className="h-5 w-5 mr-2 text-orange-500" />
        시스템 성능 모니터링
      </CardTitle>
      <CardDescription>실시간 서버 리소스 사용률</CardDescription>
    </CardHeader>
    <CardContent>
      <PerformanceChart data={performanceData} />
    </CardContent>
  </Card>
));

// 보안 현황 섹션
export const SecuritySection = memo(() => (
  <Card className="bg-card border shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Shield className="h-5 w-5 mr-2 text-green-500" />
        보안 현황
      </CardTitle>
      <CardDescription>실시간 보안 지표</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {securityMetrics.map((metric, index) => (
        <SecurityMetric key={index} metric={metric} index={index} />
      ))}
      <SecurityStatusCard />
    </CardContent>
  </Card>
));

// 거래 분석 섹션
export const TradingAnalysisSection = memo(() => (
  <div className={DASHBOARD_STYLES.analysisGrid}>
    <Card className="bg-card border shadow-sm">
      <CardHeader>
        <CardTitle>거래쌍별 분석</CardTitle>
        <CardDescription>24시간 거래량 및 변동률</CardDescription>
      </CardHeader>
      <CardContent>
        <TradingPairChart data={tradingPairData} />
        <div className="mt-4 space-y-2">
          {tradingPairData.map((pair, index) => (
            <TradingPairItem 
              key={index} 
              pair={pair} 
              index={index} 
              colors={CHART_COLORS} 
            />
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="bg-card border shadow-sm">
      <CardHeader>
        <CardTitle>거래량 추이</CardTitle>
        <CardDescription>최근 7일간 거래 활동</CardDescription>
      </CardHeader>
      <CardContent>
        <TradingVolumeChart data={tradingVolumeData} />
      </CardContent>
    </Card>
  </div>
));

// 수익원 분석 섹션
export const RevenueSection = memo(() => (
  <Card className="bg-card border shadow-sm">
    <CardHeader>
      <CardTitle>수익원 분석</CardTitle>
      <CardDescription>수수료 유형별 수익 구성</CardDescription>
    </CardHeader>
    <CardContent>
      <div className={DASHBOARD_STYLES.revenueGrid}>
        {revenueStreamData.map((stream, index) => (
          <RevenueRadialChart key={index} stream={stream} index={index} />
        ))}
      </div>
    </CardContent>
  </Card>
));

// 활동 피드 섹션
export const ActivityFeedSection = memo(({ activityFeeds }) => (
  <Card className="bg-card border shadow-sm">
    <CardHeader>
      <CardTitle>실시간 활동 피드</CardTitle>
      <CardDescription>최근 시스템 활동 및 알림</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {activityFeeds.map((feed, index) => (
          <ActivityFeedItem key={index} {...feed} />
        ))}
      </div>
    </CardContent>
  </Card>
));
