"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Progress } from "@/components_admin/ui/progress";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  Server,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Eye,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { createContext } from "vm";

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// Mock data
const tradingData = [
  { time: "00:00", volume: 1200, users: 45 },
  { time: "04:00", volume: 800, users: 32 },
  { time: "08:00", volume: 1800, users: 67 },
  { time: "12:00", volume: 2400, users: 89 },
  { time: "16:00", volume: 2100, users: 78 },
  { time: "20:00", volume: 1600, users: 56 },
];
const coinData = [
  { name: "BTC", value: 45, volume: "28,450" },
  { name: "ETH", value: 25, volume: "15,230" },
  { name: "ADA", value: 15, volume: "8,920" },
  { name: "DOT", value: 10, volume: "5,670" },
  { name: "Others", value: 5, volume: "2,340" },
];
const pendingWithdrawals = [
  { id: 1, user: "user123", amount: "1.2345 BTC", time: "5분 전", status: "대기" },
  { id: 2, user: "user456", amount: "15.67 ETH", time: "12분 전", status: "대기" },
  { id: 3, user: "user789", amount: "5000 USDT", time: "18분 전", status: "대기" },
];
const kycPending = [
  { id: 1, user: "newuser1", level: "Level 2", submitted: "2시간 전" },
  { id: 2, user: "newuser2", level: "Level 3", submitted: "4시간 전" },
  { id: 3, user: "newuser3", level: "Level 2", submitted: "6시간 전" },
];

export default function DashboardOverview({ isDarkMode }) {
  const [stats, setStats] = useState({
    totalUsers: 15420,
    onlineUsers: 1247,
    dailyVolume: 28450.67,
    revenue: 847230,
    systemLoad: 68,
    uptime: 99.9,
    pendingWithdrawals: 23,
    kycPending: 12,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(true);

  const [interval, setInterval] = useState("month"); // 기본: 일별
  const [userTrend, setUserTrend] = useState([]);  // { date, count } 데이터 배열
  const [latestTotal, setLatestTotal] = useState(0);
  const INTERVAL_OPTIONS = [
    { label: "시간별", value: "hour" },
    { label: "일별", value: "day" },
    { label: "주간별", value: "week" },
    { label: "월간별", value: "month" },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStats((prev) => ({
      ...prev,
      totalUsers: prev.totalUsers + Math.floor(Math.random() * 10),
      dailyVolume: prev.dailyVolume + Math.random() * 1000,
      revenue: prev.revenue + Math.floor(Math.random() * 10000),
    }));
    setIsRefreshing(false);
  };

  const handleTradingToggle = () => {
    setTradingEnabled(!tradingEnabled);
  };

  const handleWithdrawalApproval = (id, action) => {
    console.log(`Withdrawal ${id} ${action}ed`);
    // 실제로는 API 호출
  };

  const handleKycReview = (id) => {
    console.log(`KYC ${id} review`);
    // 실제로는 KYC 상세 페이지로 이동
  };

  useEffect(() => {
    const fetchInterval = interval || "month";
    fetch(`http://localhost:8000/api/stats/users?interval=${fetchInterval}`)
      .then((res) => res.json())
      .then((data) => {
        setUserTrend(data);
        if (data && data.length > 0) {
          setLatestTotal(data[data.length - 1].count); // 마지막 항목의 count
        }
      });

  },[interval])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            대시보드
          </h1>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
            실시간 시스템 현황 및 주요 지표
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleTradingToggle}
            variant={tradingEnabled ? "destructive" : "default"}
            size="sm"
          >
            {tradingEnabled ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                거래중단
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                거래재개
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>

      {!tradingEnabled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800 font-medium">거래가 일시 중단되었습니다.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  총 사용자
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {latestTotal}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  유저 활동 사용자
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.onlineUsers.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    1분 전
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  24시간 거래량
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {stats.dailyVolume.toFixed(2)} BTC
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  총 거래량
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  ${stats.revenue.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+15.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 거래량 추이 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              거래량 추이
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              24시간 거래량 및 사용자 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tradingData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#374151" : "#f0f0f0"}
                />
                <XAxis
                  dataKey="time"
                  stroke={isDarkMode ? "#9CA3AF" : "#666"}
                  fontSize={12}
                />
                <YAxis stroke={isDarkMode ? "#9CA3AF" : "#666"} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#1F2937" : "white",
                    border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    color: isDarkMode ? "#F9FAFB" : "#111827",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 코인별 거래량 분포 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              코인별 거래량 분포
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              24시간 거래량 기준
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={coinData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {coinData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {coinData.map((coin, index) => (
                <div
                  key={coin.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span
                      className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
                    >
                      {coin.name}
                    </span>
                  </div>
                  <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                    {coin.volume} BTC
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 총 사용자 추이 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className={`${isDarkMode ? "text-white" : "text-gray-900"} text-lg font-semibold flex items-center`}>
              <Users className="h-5 w-5 mr-2 text-green-500" />
              총 사용자 수 추이
            </CardTitle>
            {/* 집계 기준 선택 */}
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className={isDarkMode ? "bg-gray-700 text-white border-gray-500 rounded p-1" : "bg-gray-50 text-gray-900 rounded p-1"}
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent>
            {/* KPI 카드 */}
            <div className={`mb-4 text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              최근 {interval === "day" ? "일" : interval === "week" ? "주간" : interval ==="hour" ? "시간" : "월"} 기준 총 사용자수:&nbsp;
              <span className="text-green-600">{latestTotal}</span>
            </div>
            {/* 선그래프 */}
            {userTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      if (interval === "hour") {
                        // 시간만: '2025-08-18T16:00:00.000+09:00' → '16시'
                        const hour = value.slice(11, 13);
                        return `${hour}시`;
                      } else if (interval === "day") {
                        // 월-일: '2025-08-18...' → '08-18'
                        return value.slice(5, 10); // MM-DD
                      } else if (interval === "month") {
                        // 월: '2025-08...' → '08월'
                        return value.slice(5, 7) + "월";
                      } else {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#38b2ac" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-center py-20`}>데이터가 없습니다.</div>
            )}
          </CardContent>
        </Card>
        {/* 승인 대기 출금 요청 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold flex items-center ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              최근 1분
            </CardTitle>
            <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              승인​이 필요한 출금요청 ({stats.pendingWithdrawals}건)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className={`flex items-center justify-between p-3 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg`}
              >
                <div>
                  <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {withdrawal.user}
                  </p>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {withdrawal.amount} &bull; {withdrawal.time}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleWithdrawalApproval(withdrawal.id, "approve")}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    승인
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleWithdrawalApproval(withdrawal.id, "reject")}
                  >
                    거부
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 서버 상태 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold flex items-center ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Server className="h-5 w-5 mr-2 text-gray-600" />
              서버 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                서버 가동률
              </span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-bold text-green-600">{stats.uptime}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className={`flex justify-between text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                <span>시스템 부하</span>
                <span>{stats.systemLoad}%</span>
              </div>
              <Progress value={stats.systemLoad} className="h-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                응답 시간
              </span>
              <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                15ms
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 보안 현황 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold flex items-center ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <Shield className="h-5 w-5 mr-2 text-gray-600" />
              보안 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                정상 로깅
              </span>
              <Badge variant="default">1,234건</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                의심스러운 로깅
              </span>
              <Badge variant="secondary">23건</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                차단된 IP
              </span>
              <Badge variant="destructive">3건</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 최근 알림 */}
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold flex items-center ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <AlertTriangle className="h-5 w-5 mr-2 text-gray-600" />
              최근 알림
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  시스템 백업 완료
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>5분 전</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  CPU 사용률 급증
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>12분 전</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                  신규 사용자 가입
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>18분 전</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
