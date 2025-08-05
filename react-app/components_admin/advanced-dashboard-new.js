
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { DASHBOARD_STYLES } from "./dashboard-styles";
import { MetricCard, SecurityMetric, TradingPairItem, ActivityFeedItem, SecurityStatusCard } from "./dashboard-components";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Line, RadialBarChart, RadialBar } from "recharts";
import { Users, Activity, DollarSign, Shield, Server, AlertTriangle, CheckCircle } from "lucide-react";

// 상수 데이터 및 컬러
const COLORS = { primary: "#f97316", secondary: "#3b82f6", success: "#10b981", warning: "#f59e0b", danger: "#ef4444", purple: "#8b5cf6", pink: "#ec4899", teal: "#14b8a6" };
const CHART_COLORS = Object.values(COLORS);
const tradingPairData = [ { name: "BTC/USDT", value: 45, volume: 28450.67, change: 2.34 }, { name: "ETH/USDT", value: 25, volume: 15230.45, change: -1.23 }, { name: "ADA/USDT", value: 15, volume: 8920.12, change: 5.67 }, { name: "DOT/USDT", value: 10, volume: 5670.89, change: 3.45 }, { name: "Others", value: 5, volume: 2340.56, change: 0.89 } ];
const performanceData = [ { time: "00:00", cpu: 45, memory: 62, network: 78 }, { time: "04:00", cpu: 52, memory: 58, network: 82 }, { time: "08:00", cpu: 78, memory: 71, network: 65 }, { time: "12:00", cpu: 85, memory: 79, network: 88 }, { time: "16:00", cpu: 72, memory: 68, network: 75 }, { time: "20:00", cpu: 58, memory: 64, network: 70 } ];
const revenueStreamData = [ { name: "거래 수수료", value: 67, amount: 847230 }, { name: "출금 수수료", value: 23, amount: 289450 }, { name: "상장 수수료", value: 10, amount: 125600 } ];
const securityMetrics = [ { name: "정상 로그인", value: 89, color: COLORS.success }, { name: "실패한 로그인", value: 8, color: COLORS.warning }, { name: "차단된 IP", value: 3, color: COLORS.danger } ];
const tradingVolumeData = [ { date: "01/10", volume: 25000, trades: 1200, users: 890 }, { date: "01/11", volume: 28000, trades: 1350, users: 920 }, { date: "01/12", volume: 32000, trades: 1450, users: 1050 }, { date: "01/13", volume: 29000, trades: 1380, users: 980 }, { date: "01/14", volume: 35000, trades: 1520, users: 1120 }, { date: "01/15", volume: 42000, trades: 1680, users: 1340 }, { date: "01/16", volume: 38000, trades: 1590, users: 1250 } ];
const activityFeeds = [
  { type: "success", icon: CheckCircle, title: "대용량 거래 처리 완료", description: "BTC/USDT 거래쌍에서 1,000 BTC 거래가 성공적으로 처리되었습니다.", time: "방금 전", variant: "success" },
  { type: "warning", icon: AlertTriangle, title: "시스템 부하 증가", description: "CPU 사용률이 85%에 도달했습니다. 모니터링이 필요합니다.", time: "2분 전", variant: "warning" },
  { type: "info", icon: Users, title: "신규 사용자 급증", description: "지난 1시간 동안 234명의 신규 사용자가 가입했습니다.", time: "5분 전", variant: "info" }
];

export default function AdvancedDashboard() {
  const [onlineUsers, setOnlineUsers] = useState(1247);
  useEffect(() => { const i = setInterval(() => setOnlineUsers(u => u + Math.floor(Math.random() * 20 - 10)), 3000); return () => clearInterval(i); }, []);
  const metricsData = [
    { title: "총 사용자", value: "15,420", change: "+12.5%", icon: Users, gradient: DASHBOARD_STYLES.gradients.orange, textColor: DASHBOARD_STYLES.textColors.orange, iconColor: DASHBOARD_STYLES.iconColors.orange },
    { title: "온라인 사용자", value: onlineUsers.toLocaleString(), change: "실시간", icon: Activity, gradient: DASHBOARD_STYLES.gradients.blue, textColor: DASHBOARD_STYLES.textColors.blue, iconColor: DASHBOARD_STYLES.iconColors.blue },
    { title: "24시간 거래량", value: "28,450 BTC", change: "+8.3%", icon: DollarSign, gradient: DASHBOARD_STYLES.gradients.green, textColor: DASHBOARD_STYLES.textColors.green, iconColor: DASHBOARD_STYLES.iconColors.green },
    { title: "수수료 수익", value: "$847K", change: "+15.2%", icon: DollarSign, gradient: DASHBOARD_STYLES.gradients.purple, textColor: DASHBOARD_STYLES.textColors.purple, iconColor: DASHBOARD_STYLES.iconColors.purple }
  ];

  return (
    <div className={DASHBOARD_STYLES.mainContainer}>
      <div className={DASHBOARD_STYLES.metricsGrid}>
        {metricsData.map((m, i) => <MetricCard key={i} {...m} />)}
      </div>
      <div className={DASHBOARD_STYLES.contentGrid}>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><Server className="h-5 w-5 mr-2 text-orange-500" />시스템 성능 모니터링</CardTitle>
            <CardDescription>실시간 서버 리소스 사용률</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/></linearGradient>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/></linearGradient>
                  <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke={COLORS.primary} fillOpacity={1} fill="url(#cpuGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="memory" stroke={COLORS.secondary} fillOpacity={1} fill="url(#memoryGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="network" stroke={COLORS.success} fillOpacity={1} fill="url(#networkGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Shield className="h-5 w-5 mr-2 text-green-500" />보안 현황</CardTitle>
            <CardDescription>실시간 보안 지표</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {securityMetrics.map((m, i) => <SecurityMetric key={i} metric={m} index={i} />)}
            <SecurityStatusCard />
          </CardContent>
        </Card>
      </div>
      <div className={DASHBOARD_STYLES.analysisGrid}>
        <Card>
          <CardHeader>
            <CardTitle>거래쌍별 분석</CardTitle>
            <CardDescription>24시간 거래량 및 변동률</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={tradingPairData} cx="50%" cy="50%" labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value" stroke="none">
                  {tradingPairData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {tradingPairData.map((pair, i) => <TradingPairItem key={i} pair={pair} index={i} colors={CHART_COLORS} />)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>거래량 추이</CardTitle>
            <CardDescription>최근 7일간 거래 활동</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={tradingVolumeData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Area type="monotone" dataKey="volume" stroke={COLORS.primary} fillOpacity={1} fill="url(#volumeGradient)" strokeWidth={3} />
                <Line type="monotone" dataKey="trades" stroke={COLORS.secondary} strokeWidth={2} dot={{r: 4}} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>수익원 분석</CardTitle>
          <CardDescription>수수료 유형별 수익 구성</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={DASHBOARD_STYLES.revenueGrid}>
            {revenueStreamData.map((stream, i) => (
              <div key={i} className="text-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[stream]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill={CHART_COLORS[i]} stroke={CHART_COLORS[i]} strokeWidth={2} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-4">
                  <h3 className="font-semibold text-lg">{stream.name}</h3>
                  <p className="text-2xl font-bold text-gray-800">${stream.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{stream.value}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>실시간 활동 피드</CardTitle>
          <CardDescription>최근 시스템 활동 및 알림</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityFeeds.map((feed, i) => <ActivityFeedItem key={i} {...feed} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
