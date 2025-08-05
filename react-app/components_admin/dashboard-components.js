import { memo } from "react";
import { Card, CardContent } from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Progress } from "@/components_admin/ui/progress";
import { TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { DASHBOARD_STYLES } from "./dashboard-styles";

// 메모화된 메트릭 카드 컴포넌트
export const MetricCard = memo(({ title, value, change, icon: Icon, gradient, textColor, iconColor }) => (
  <Card className={`${DASHBOARD_STYLES.gradientCard} ${gradient} border shadow-sm`}>
    <div className={DASHBOARD_STYLES.cardOverlay} />
    <CardContent className={DASHBOARD_STYLES.cardContent}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textColor} text-sm font-medium`}>{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-sm">{change}</span>
          </div>
        </div>
        <Icon className={`h-12 w-12 ${iconColor}`} />
      </div>
    </CardContent>
  </Card>
));

// 메모화된 보안 메트릭 컴포넌트
export const SecurityMetric = memo(({ metric, index }) => (
  <div key={index} className={DASHBOARD_STYLES.securityItem}>
    <div className={DASHBOARD_STYLES.securityHeader}>
      <span className={DASHBOARD_STYLES.securityName}>{metric.name}</span>
      <span className={DASHBOARD_STYLES.securityValue}>{metric.value}%</span>
    </div>
    <Progress value={metric.value} className={DASHBOARD_STYLES.securityProgress} />
  </div>
));

// 메모화된 거래쌍 아이템 컴포넌트
export const TradingPairItem = memo(({ pair, index, colors }) => (
  <div className={DASHBOARD_STYLES.tradingPairItem}>
    <div className="flex items-center">
      <div 
        className={DASHBOARD_STYLES.tradingPairIndicator}
        style={{ backgroundColor: colors[index % colors.length] }}
      />
      <span className={DASHBOARD_STYLES.tradingPairName}>{pair.name}</span>
    </div>
    <div className="flex items-center space-x-2">
      <Badge 
        variant={pair.change > 0 ? "default" : "destructive"}
        className={DASHBOARD_STYLES.tradingPairBadge}
      >
        {pair.change > 0 ? "+" : ""}{pair.change}%
      </Badge>
      <span className={DASHBOARD_STYLES.tradingPairVolume}>
        {pair.volume.toLocaleString()} BTC
      </span>
    </div>
  </div>
));

// 메모화된 활동 피드 아이템 컴포넌트
export const ActivityFeedItem = memo(({ icon: Icon, title, description, time, variant }) => (
  <div className={`${DASHBOARD_STYLES.activityItem} ${DASHBOARD_STYLES.activityVariants[variant]}`}>
    <Icon className={`${DASHBOARD_STYLES.activityIcon} text-${variant}-500`} />
    <div className={DASHBOARD_STYLES.activityContent}>
      <p className={`font-medium text-${variant}-800`}>{title}</p>
      <p className={`text-sm text-${variant}-600`}>{description}</p>
    </div>
    <span className={`${DASHBOARD_STYLES.activityTime} text-${variant}-600`}>{time}</span>
  </div>
));

// 메모화된 보안 상태 카드 컴포넌트
export const SecurityStatusCard = memo(() => (
  <div className="pt-4 border-t">
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
        <div className="text-lg font-bold text-green-600">99.9%</div>
        <div className="text-xs text-gray-600">가동률</div>
      </div>
      <div className="text-center p-3 bg-orange-50 rounded-lg">
        <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-1" />
        <div className="text-lg font-bold text-orange-600">3</div>
        <div className="text-xs text-gray-600">알림</div>
      </div>
    </div>
  </div>
));
