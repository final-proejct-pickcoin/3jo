"use client";

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, RadialBarChart, RadialBar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { getCardClass, getTitleClass, getSubtitleClass, getTooltipStyle } from './utils/theme-utils';
import { CHART_COLORS, COLORS } from './utils/chart-utils';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign,
  Settings,
  Bell,
  Moon,
  User,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Shield,
  Server,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

// 거래 데이터
const tradingPairData = [
  { name: "BTC/USDT", price: 43250, change: 2.45, volume: 1250.5, color: COLORS.primary },
  { name: "ETH/USDT", price: 2650, change: -1.23, volume: 856.3, color: COLORS.secondary },
  { name: "BNB/USDT", price: 315, change: 0.87, volume: 432.1, color: COLORS.success },
  { name: "ADA/USDT", price: 0.485, change: 3.21, volume: 267.8, color: COLORS.warning },
  { name: "SOL/USDT", price: 85.2, change: -0.95, volume: 189.4, color: COLORS.danger }
];

// 시간별 거래량 데이터
const hourlyTradingData = [
  { time: '00:00', volume: 850, price: 43100 },
  { time: '04:00', volume: 920, price: 43200 },
  { time: '08:00', volume: 1150, price: 43350 },
  { time: '12:00', volume: 1350, price: 43250 },
  { time: '16:00', volume: 1200, price: 43180 },
  { time: '20:00', volume: 980, price: 43220 }
];

// 보안 메트릭
const securityMetrics = [
  { name: "정상 로그인", value: 89, color: COLORS.success },
  { name: "실패한 로그인", value: 8, color: COLORS.warning },
  { name: "차단된 IP", value: 3, color: COLORS.danger }
];

// 시스템 성능 데이터
const systemPerformance = [
  { name: 'CPU', value: 65, color: COLORS.primary },
  { name: 'Memory', value: 78, color: COLORS.secondary },
  { name: 'Storage', value: 45, color: COLORS.success },
  { name: 'Network', value: 82, color: COLORS.warning }
];

// 실시간 활동 피드
const getActivityColors = (type) => {
  const colors = {
    trade: COLORS.success,
    login: COLORS.primary,
    withdrawal: COLORS.warning,
    security: COLORS.danger,
    system: COLORS.secondary
  };
  return colors[type] || COLORS.primary;
};

const activityFeed = [
  { id: 1, type: 'trade', message: 'BTC/USDT 대량 거래 감지', time: '2분 전', status: 'active' },
  { id: 2, type: 'login', message: '관리자 로그인', time: '5분 전', status: 'success' },
  { id: 3, type: 'withdrawal', message: '대량 출금 요청 대기', time: '8분 전', status: 'pending' },
  { id: 4, type: 'security', message: '의심스러운 IP 차단', time: '12분 전', status: 'alert' },
  { id: 5, type: 'system', message: '시스템 백업 완료', time: '15분 전', status: 'success' }
];

// 메인 대시보드 컴포넌트
const PickCoinDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemLoad, setSystemLoad] = useState(67);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSystemLoad(prev => Math.max(30, Math.min(90, prev + (Math.random() - 0.5) * 10)));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // 헤더 컴포넌트
  const Header = () => (
    <div className={`flex justify-between items-center p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${getTitleClass(isDarkMode)}`}>PickCoin Admin</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-sm ${getSubtitleClass(isDarkMode)}`}>시스템 정상</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className={`text-sm ${getSubtitleClass(isDarkMode)}`}>
          {currentTime.toLocaleTimeString()}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center space-x-2"
        >
          <Moon className="w-4 h-4" />
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </Button>
        
        <div className="relative">
          <Bell className={`w-5 h-5 ${getSubtitleClass(isDarkMode)} cursor-pointer`} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white">3</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className={`text-xs ${getSubtitleClass(isDarkMode)}`}>abc@abc</span>
          <ChevronDown className={`w-4 h-4 ${getSubtitleClass(isDarkMode)}`} />
        </div>
      </div>
    </div>
  );

  // 통계 카드 컴포넌트
  const StatCard = ({ title, value, icon: Icon, change, gradient }) => (
    <Card className={getCardClass(isDarkMode)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${getSubtitleClass(isDarkMode)}`}>{title}</p>
            <p className={`text-2xl font-bold ${getTitleClass(isDarkMode)}`}>{value}</p>
            {change && (
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">{change}%</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradient} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 거래량 차트 컴포넌트
  const TradingChart = () => (
    <Card className={`col-span-2 ${getCardClass(isDarkMode)}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg font-semibold flex items-center ${getTitleClass(isDarkMode)}`}>
          <BarChart3 className="w-5 h-5 mr-2" />
          거래량 분석
        </CardTitle>
        <p className={`text-sm ${getSubtitleClass(isDarkMode)}`}>24시간 거래량 및 실시간 시스템 리소스 사용률</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className={`text-sm font-medium mb-3 ${getTitleClass(isDarkMode)}`}>시간별 거래량</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyTradingData}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="time" fontSize={12} fill={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis fontSize={12} fill={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={getTooltipStyle(isDarkMode)}
                  labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#volumeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {systemPerformance.map((item, index) => (
              <div key={index} className="text-center">
                <div className={`text-xs ${getSubtitleClass(isDarkMode)} mb-1`}>{item.name}</div>
                <Progress value={item.value} className="h-2" />
                <div className={`text-xs font-semibold mt-1 ${getTitleClass(isDarkMode)}`}>{item.value}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 코인 분포 차트 컴포넌트
  const CoinDistributionChart = () => (
    <Card className={getCardClass(isDarkMode)}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg font-semibold flex items-center ${getTitleClass(isDarkMode)}`}>
          <PieChartIcon className="w-5 h-5 mr-2" />
          코인별 거래량
        </CardTitle>
        <p className={`text-sm ${getSubtitleClass(isDarkMode)}`}>24시간 거래량 및 변동률</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tradingPairData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="volume"
              >
                {tradingPairData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={getTooltipStyle(isDarkMode)}
                formatter={(value) => [`${value.toLocaleString()} BTC`, '거래량']}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2">
            {tradingPairData.map((pair, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pair.color }}></div>
                  <span className={`font-medium ${getTitleClass(isDarkMode)}`}>{pair.name}</span>
                  <Badge 
                    variant={pair.change >= 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {pair.change >= 0 ? '+' : ''}{pair.change}%
                  </Badge>
                </div>
                <span className={`text-sm ${getSubtitleClass(isDarkMode)}`}>{pair.volume.toLocaleString()} BTC</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 보안 모니터링 컴포넌트
  const SecurityMonitoring = () => (
    <Card className={getCardClass(isDarkMode)}>
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center ${getTitleClass(isDarkMode)}`}>
          <Shield className="w-5 h-5 mr-2" />
          보안 모니터링
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={securityMetrics}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
              >
                {securityMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={getTooltipStyle(isDarkMode)}
                formatter={(value) => [value, '건수']}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2">
            {securityMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }}></div>
                  <span className={`text-sm ${getTitleClass(isDarkMode)}`}>{metric.name}</span>
                </div>
                <span className={`text-sm font-semibold ${getTitleClass(isDarkMode)}`}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 활동 피드 컴포넌트
  const ActivityFeed = () => (
    <Card className={getCardClass(isDarkMode)}>
      <CardHeader className="pb-2">
        <CardTitle className={getTitleClass(isDarkMode)}>실시간 활동 피드</CardTitle>
        <p className={`text-sm ${getSubtitleClass(isDarkMode)}`}>최근 시스템 활동 및 알림</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activityFeed.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getActivityColors(activity.type) + '20' }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getActivityColors(activity.type) }}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${getTitleClass(isDarkMode)}`}>{activity.message}</p>
                <p className={`text-xs ${getSubtitleClass(isDarkMode)}`}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      
      <div className="p-6 space-y-6">
        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="총 사용자" 
            value="12,540" 
            icon={Users} 
            change={12.5}
            gradient="from-blue-500 to-blue-600" 
          />
          <StatCard 
            title="일일 거래량" 
            value="$2.4M" 
            icon={DollarSign} 
            change={8.2}
            gradient="from-green-500 to-green-600" 
          />
          <StatCard 
            title="활성 거래" 
            value="1,547" 
            icon={Activity} 
            change={-2.1}
            gradient="from-orange-500 to-orange-600" 
          />
          <StatCard 
            title="시스템 부하" 
            value={`${systemLoad}%`} 
            icon={Server} 
            gradient="from-purple-500 to-purple-600" 
          />
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TradingChart />
          <CoinDistributionChart />
        </div>

        {/* 하단 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityMonitoring />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default PickCoinDashboard;
