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
  }, "\uB300\uC2DC\uBCF4\uB4DC"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "\uC2E4\uC2DC\uAC04 \uC2DC\uC2A4\uD15C \uD604\uD669 \uBC0F \uC8FC\uC694 \uC9C0\uD45C")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: handleTradingToggle,
    variant: tradingEnabled ? "destructive" : "default",
    size: "sm"
  }, tradingEnabled ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Pause, {
    className: "h-4 w-4 mr-2"
  }), "\uAC70\uB798 \uC911\uB2E8") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Play, {
    className: "h-4 w-4 mr-2"
  }), "\uAC70\uB798 \uC7AC\uAC1C")), /*#__PURE__*/React.createElement(Button, {
    onClick: handleRefresh,
    disabled: isRefreshing,
    variant: "outline",
    size: "sm"
  }, /*#__PURE__*/React.createElement(RefreshCw, {
    className: `h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`
  }), "\uC0C8\uB85C\uACE0\uCE68"))), !tradingEnabled && /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-5 w-5 text-red-500 mr-2"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-red-800 font-medium"
  }, "\uAC70\uB798\uAC00 \uC77C\uC2DC \uC911\uB2E8\uB418\uC5C8\uC2B5\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uCD1D \uC0AC\uC6A9\uC790"), /*#__PURE__*/React.createElement("p", {
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
  }, "\uC628\uB77C\uC778 \uC0AC\uC6A9\uC790"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, stats.onlineUsers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC2E4\uC2DC\uAC04"))), /*#__PURE__*/React.createElement("div", {
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
  }, "24\uC2DC\uAC04 \uAC70\uB798\uB7C9"), /*#__PURE__*/React.createElement("p", {
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
  }, "\uC218\uC218\uB8CC \uC218\uC775"), /*#__PURE__*/React.createElement("p", {
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
  }, "\uAC70\uB798\uB7C9 \uCD94\uC774"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "24\uC2DC\uAC04 \uAC70\uB798\uB7C9 \uBC0F \uD65C\uC131 \uC0AC\uC6A9\uC790")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
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
  }, "\uCF54\uC778\uBCC4 \uAC70\uB798 \uBD84\uD3EC"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "24\uC2DC\uAC04 \uAC70\uB798\uB7C9 \uAE30\uC900")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
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
  }), "\uCD9C\uAE08 \uC2B9\uC778 \uB300\uAE30"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "\uC2B9\uC778\uC774 \uD544\uC694\uD55C \uCD9C\uAE08 \uC694\uCCAD (", stats.pendingWithdrawals, "\uAC74)")), /*#__PURE__*/React.createElement(CardContent, {
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
  }, "\uC2B9\uC778"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "destructive",
    onClick: () => handleWithdrawalApproval(withdrawal.id, "reject")
  }, "\uAC70\uBD80")))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2 text-blue-500"
  }), "KYC \uC778\uC99D \uB300\uAE30"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "\uAC80\uD1A0\uAC00 \uD544\uC694\uD55C KYC \uC2E0\uCCAD (", stats.kycPending, "\uAC74)")), /*#__PURE__*/React.createElement(CardContent, {
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
  }), "\uAC80\uD1A0")))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Server, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "\uC2DC\uC2A4\uD15C \uC0C1\uD0DC")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "\uC11C\uBC84 \uAC00\uB3D9\uB960"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-green-600"
  }, stats.uptime, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: `flex justify-between text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, /*#__PURE__*/React.createElement("span", null, "\uC2DC\uC2A4\uD15C \uBD80\uD558"), /*#__PURE__*/React.createElement("span", null, stats.systemLoad, "%")), /*#__PURE__*/React.createElement(Progress, {
    value: stats.systemLoad,
    className: "h-2"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "\uC751\uB2F5 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "15ms")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "\uBCF4\uC548 \uD604\uD669")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "\uC815\uC0C1 \uB85C\uADF8\uC778"), /*#__PURE__*/React.createElement(Badge, {
    variant: "default"
  }, "1,234\uAC74")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "\uC2E4\uD328\uD55C \uB85C\uADF8\uC778"), /*#__PURE__*/React.createElement(Badge, {
    variant: "secondary"
  }, "23\uAC74")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`
  }, "\uCC28\uB2E8\uB41C IP"), /*#__PURE__*/React.createElement(Badge, {
    variant: "destructive"
  }, "3\uAC1C")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `text-lg font-semibold flex items-center ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-5 w-5 mr-2 text-gray-600"
  }), "\uCD5C\uADFC \uC54C\uB9BC")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "\uC2DC\uC2A4\uD15C \uBC31\uC5C5 \uC644\uB8CC"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "5\uBD84 \uC804"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-yellow-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "CPU \uC0AC\uC6A9\uB960 \uC99D\uAC00"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "12\uBD84 \uC804"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-start space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-blue-500 rounded-full mt-2"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, "\uC2E0\uADDC \uC0AC\uC6A9\uC790 \uAC00\uC785"), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "18\uBD84 \uC804")))))));
}