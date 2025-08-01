"use client";
import React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Progress } from "@/components_admin/ui/progress";
import { Users, Activity, DollarSign, TrendingUp, Server, Shield, RefreshCw, AlertTriangle, CheckCircle, Pause, Play, Eye, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// Mock data
const tradingData = [{
  time: "00:00",
  volume: 1200,
  users: 45
}, {
  time: "04:00",
  volume: 800,
  users: 32
}, {
  time: "08:00",
  volume: 1800,
  users: 67
}, {
  time: "12:00",
  volume: 2400,
  users: 89
}, {
  time: "16:00",
  volume: 2100,
  users: 78
}, {
  time: "20:00",
  volume: 1600,
  users: 56
}];
const coinData = [{
  name: "BTC",
  value: 45,
  volume: "28,450"
}, {
  name: "ETH",
  value: 25,
  volume: "15,230"
}, {
  name: "ADA",
  value: 15,
  volume: "8,920"
}, {
  name: "DOT",
  value: 10,
  volume: "5,670"
}, {
  name: "Others",
  value: 5,
  volume: "2,340"
}];
const pendingWithdrawals = [{
  id: 1,
  user: "user123",
  amount: "1.2345 BTC",
  time: "5분 전",
  status: "대기"
}, {
  id: 2,
  user: "user456",
  amount: "15.67 ETH",
  time: "12분 전",
  status: "대기"
}, {
  id: 3,
  user: "user789",
  amount: "5000 USDT",
  time: "18분 전",
  status: "대기"
}];
const kycPending = [{
  id: 1,
  user: "newuser1",
  level: "Level 2",
  submitted: "2시간 전"
}, {
  id: 2,
  user: "newuser2",
  level: "Level 3",
  submitted: "4시간 전"
}, {
  id: 3,
  user: "newuser3",
  level: "Level 2",
  submitted: "6시간 전"
}];
export default function DashboardOverview({
  isDarkMode
}) {
  const [stats, setStats] = useState({
    totalUsers: 15420,
    onlineUsers: 1247,
    dailyVolume: 28450.67,
    revenue: 847230,
    systemLoad: 68,
    uptime: 99.9,
    pendingWithdrawals: 23,
    kycPending: 12
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tradingEnabled, setTradingEnabled] = useState(true);

  // 실시간 데이터 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 20 - 10),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 6 - 3)))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + Math.floor(Math.random() * 10),
      dailyVolume: prev.dailyVolume + Math.random() * 1000,
      revenue: prev.revenue + Math.floor(Math.random() * 10000)
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
  const handleKycReview = id => {
    console.log(`KYC ${id} review`);
    // 실제로는 KYC 상세 페이지로 이동
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "대시보드"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "실시간 시스템 현황 및 주요 지표")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: handleTradingToggle,
    variant: tradingEnabled ? "destructive" : "default",
    size: "sm"
  }, tradingEnabled ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Pause, {
    className: "h-4 w-4 mr-2"
  }), "거래중단") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Play, {
    className: "h-4 w-4 mr-2"
  }), "거래재개")), /*#__PURE__*/React.createElement(Button, {
    onClick: handleRefresh,
    disabled: isRefreshing,
    variant: "outline",
    size: "sm"
  }, /*#__PURE__*/React.createElement(RefreshCw, {
    className: `h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`
  }), "새로고침"))), !tradingEnabled && /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-5 w-5 text-red-500 mr-2"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-red-800 font-medium"
  }, "거래가 일시 중단되었습니다."))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "총 사용자"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, stats.totalUsers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 text-green-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-green-600"
  }, "+12.5%"))), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Users, {
    className: "h-6 w-6 text-orange-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "유저 활동 사용자"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, stats.onlineUsers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "1분 전"))), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "h-6 w-6 text-blue-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "24시간 거래량"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, stats.dailyVolume.toFixed(2), " BTC"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 text-green-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-green-600"
  }, "+8.3%"))), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(DollarSign, {
    className: "h-6 w-6 text-green-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "총 거래량"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "$", stats.revenue.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 text-green-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-green-600"
  }, "+15.2%"))), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(DollarSign, {
    className: "h-6 w-6 text-purple-600"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "거래량 추이"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "24시간 거래량 및 사용자 현황")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: tradingData
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: isDarkMode ? "#374151" : "#f0f0f0"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "time",
    stroke: isDarkMode ? "#9CA3AF" : "#666",
    fontSize: 12
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: isDarkMode ? "#9CA3AF" : "#666",
    fontSize: 12
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      backgroundColor: isDarkMode ? "#1F2937" : "white",
      border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      color: isDarkMode ? "#F9FAFB" : "#111827"
    }
  }), /*#__PURE__*/React.createElement(Line, {
    type: "monotone",
    dataKey: "volume",
    stroke: "#f97316",
    strokeWidth: 2,
    dot: {
      fill: "#f97316",
      strokeWidth: 2,
      r: 4
    },
    activeDot: {
      r: 6
    }
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "코인별 거래량 분포"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "24시간 거래량 기준")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(PieChart, null, /*#__PURE__*/React.createElement(Pie, {
    data: coinData,
    cx: "50%",
    cy: "50%",
    outerRadius: 80,
    fill: "#8884d8",
    dataKey: "value",
    label: ({
      name,
      percent
    }) => `${name} ${(percent * 100).toFixed(0)}%`
  }, coinData.map((entry, index) => /*#__PURE__*/React.createElement(Cell, {
    key: `cell-${index}`,
    fill: COLORS[index % COLORS.length]
  }))), /*#__PURE__*/React.createElement(Tooltip, null)))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-2"
  }, coinData.map((coin, index) => /*#__PURE__*/React.createElement("div", {
    key: coin.name,
    className: "flex items-center justify-between text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 rounded-full mr-2",
    style: {
      backgroundColor: COLORS[index % COLORS.length]
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, coin.name)), /*#__PURE__*/React.createElement("span", {
    className: isDarkMode ? "text-gray-300" : "text-gray-600"
  }, coin.volume, " BTC"))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Clock, {
    className: "h-5 w-5 mr-2 text-orange-500"
  }), "최근 1분"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "승인이 필요한 출금요청 (", stats.pendingWithdrawals, "건)")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, pendingWithdrawals.map(withdrawal => /*#__PURE__*/React.createElement("div", {
    key: withdrawal.id,
    className: `flex items-center justify-between p-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} rounded-lg`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, withdrawal.user), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, withdrawal.amount, " \u2022 ", withdrawal.time)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => handleWithdrawalApproval(withdrawal.id, "approve"),
    className: "bg-green-500 hover:bg-green-600 text-white"
  }, "승인"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "destructive",
    onClick: () => handleWithdrawalApproval(withdrawal.id, "reject")
  }, "거부")))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2 text-blue-500"
  }), "KYC 인증 대기"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "검토가 필요한 KYC 신청 (", stats.kycPending, "건)")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, kycPending.map(kyc => /*#__PURE__*/React.createElement("div", {
    key: kyc.id,
    className: `flex items-center justify-between p-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} rounded-lg`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, kyc.user), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, kyc.level, " \u2022 ", kyc.submitted)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "outline",
    onClick: () => handleKycReview(kyc.id),
    className: isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4 mr-1"
  }), "검토")))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Server, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "서버 상태")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "서버 가동률"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-green-600"
  }, stats.uptime, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: `flex justify-between text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, /*#__PURE__*/React.createElement("span", null, "시스템 부하"), /*#__PURE__*/React.createElement("span", null, stats.systemLoad, "%")), /*#__PURE__*/React.createElement(Progress, {
    value: stats.systemLoad,
    className: "h-2"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "응답 시간"), /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "15ms")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "보안 현황")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "정상 로깅"), /*#__PURE__*/React.createElement(Badge, {
    variant: "default"
  }, "1,234건")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "의심스러운 로깅"), /*#__PURE__*/React.createElement(Badge, {
    variant: "secondary"
  }, "23건")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "차단된 IP"), /*#__PURE__*/React.createElement(Badge, {
    variant: "destructive"
  }, "3건")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "최근 알림")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "시스템 백업 완료"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "5분 전"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-yellow-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "CPU 사용률 급증"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "12분 전"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-blue-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "신규 사용자 가입"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "18분 전")))))));
}