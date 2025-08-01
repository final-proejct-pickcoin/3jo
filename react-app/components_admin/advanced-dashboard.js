"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line, RadialBarChart, RadialBar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Progress } from "@/components_admin/ui/progress";
import { TrendingUp, Users, Activity, DollarSign, Shield, Server, AlertTriangle, CheckCircle } from "lucide-react";

// Enhanced color palette
const COLORS = {
  primary: "#f97316",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6"
};
const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple, COLORS.pink, COLORS.teal];

// Mock real-time data
const tradingPairData = [{
  name: "BTC/USDT",
  value: 45,
  volume: 28450.67,
  change: 2.34
}, {
  name: "ETH/USDT",
  value: 25,
  volume: 15230.45,
  change: -1.23
}, {
  name: "ADA/USDT",
  value: 15,
  volume: 8920.12,
  change: 5.67
}, {
  name: "DOT/USDT",
  value: 10,
  volume: 5670.89,
  change: 3.45
}, {
  name: "Others",
  value: 5,
  volume: 2340.56,
  change: 0.89
}];
const performanceData = [{
  time: "00:00",
  cpu: 45,
  memory: 62,
  network: 78
}, {
  time: "04:00",
  cpu: 52,
  memory: 58,
  network: 82
}, {
  time: "08:00",
  cpu: 78,
  memory: 71,
  network: 65
}, {
  time: "12:00",
  cpu: 85,
  memory: 79,
  network: 88
}, {
  time: "16:00",
  cpu: 72,
  memory: 68,
  network: 75
}, {
  time: "20:00",
  cpu: 58,
  memory: 64,
  network: 70
}];
const revenueStreamData = [{
  name: "거래 수수료",
  value: 67,
  amount: 847230
}, {
  name: "출금 수수료",
  value: 23,
  amount: 289450
}, {
  name: "상장 수수료",
  value: 10,
  amount: 125600
}];
const securityMetrics = [{
  name: "정상 로그인",
  value: 89,
  color: COLORS.success
}, {
  name: "실패한 로그인",
  value: 8,
  color: COLORS.warning
}, {
  name: "차단된 IP",
  value: 3,
  color: COLORS.danger
}];
const tradingVolumeData = [{
  date: "01/10",
  volume: 25000,
  trades: 1200,
  users: 890
}, {
  date: "01/11",
  volume: 28000,
  trades: 1350,
  users: 920
}, {
  date: "01/12",
  volume: 32000,
  trades: 1450,
  users: 1050
}, {
  date: "01/13",
  volume: 29000,
  trades: 1380,
  users: 980
}, {
  date: "01/14",
  volume: 35000,
  trades: 1520,
  users: 1120
}, {
  date: "01/15",
  volume: 42000,
  trades: 1680,
  users: 1340
}, {
  date: "01/16",
  volume: 38000,
  trades: 1590,
  users: 1250
}];
export default function AdvancedDashboard() {
  const [realTimeData, setRealTimeData] = useState({
    onlineUsers: 1247,
    activeTrades: 342,
    systemLoad: 68,
    responseTime: 15
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        onlineUsers: prev.onlineUsers + Math.floor(Math.random() * 20 - 10),
        activeTrades: prev.activeTrades + Math.floor(Math.random() * 10 - 5),
        systemLoad: Math.max(0, Math.min(100, prev.systemLoad + Math.floor(Math.random() * 6 - 3))),
        responseTime: Math.max(5, prev.responseTime + Math.floor(Math.random() * 4 - 2))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 border-0 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/10"
  }), /*#__PURE__*/React.createElement(CardContent, {
    className: "relative p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-orange-100 text-sm font-medium"
  }, "총 사용자"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold"
  }, "15,420"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "+12.5%"))), /*#__PURE__*/React.createElement(Users, {
    className: "h-12 w-12 text-orange-200"
  })))), /*#__PURE__*/React.createElement(Card, {
    className: "relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 border-0 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/10"
  }), /*#__PURE__*/React.createElement(CardContent, {
    className: "relative p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-blue-100 text-sm font-medium"
  }, "온라인 사용자"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold"
  }, realTimeData.onlineUsers.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "h-4 w-4 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "실시간"))), /*#__PURE__*/React.createElement(Activity, {
    className: "h-12 w-12 text-blue-200"
  })))), /*#__PURE__*/React.createElement(Card, {
    className: "relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 border-0 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/10"
  }), /*#__PURE__*/React.createElement(CardContent, {
    className: "relative p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-green-100 text-sm font-medium"
  }, "24시간 거래량"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold"
  }, "28,450 BTC"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "+8.3%"))), /*#__PURE__*/React.createElement(DollarSign, {
    className: "h-12 w-12 text-green-200"
  })))), /*#__PURE__*/React.createElement(Card, {
    className: "relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 border-0 text-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/10"
  }), /*#__PURE__*/React.createElement(CardContent, {
    className: "relative p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-purple-100 text-sm font-medium"
  }, "수수료 수익"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold"
  }, "$847K"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "+15.2%"))), /*#__PURE__*/React.createElement(DollarSign, {
    className: "h-12 w-12 text-purple-200"
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-3 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "lg:col-span-2"
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(Server, {
    className: "h-5 w-5 mr-2 text-orange-500"
  }), "시스템 성능 모니터링"), /*#__PURE__*/React.createElement(CardDescription, null, "실시간 서버 리소스 사용량")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: performanceData
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "cpuGradient",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "5%",
    stopColor: COLORS.primary,
    stopOpacity: 0.8
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "95%",
    stopColor: COLORS.primary,
    stopOpacity: 0.1
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "memoryGradient",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "5%",
    stopColor: COLORS.secondary,
    stopOpacity: 0.8
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "95%",
    stopColor: COLORS.secondary,
    stopOpacity: 0.1
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "networkGradient",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "5%",
    stopColor: COLORS.success,
    stopOpacity: 0.8
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "95%",
    stopColor: COLORS.success,
    stopOpacity: 0.1
  }))), /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#f0f0f0"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "time",
    stroke: "#666"
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: "#666"
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "cpu",
    stroke: COLORS.primary,
    fillOpacity: 1,
    fill: "url(#cpuGradient)",
    strokeWidth: 2
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "memory",
    stroke: COLORS.secondary,
    fillOpacity: 1,
    fill: "url(#memoryGradient)",
    strokeWidth: 2
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "network",
    stroke: COLORS.success,
    fillOpacity: 1,
    fill: "url(#networkGradient)",
    strokeWidth: 2
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2 text-green-500"
  }), "보안 현황"), /*#__PURE__*/React.createElement(CardDescription, null, "실시간 보안 지표")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-6"
  }, securityMetrics.map((metric, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium"
  }, metric.name), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold"
  }, metric.value, "%")), /*#__PURE__*/React.createElement(Progress, {
    value: metric.value,
    className: "h-2"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pt-4 border-t"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-3 bg-green-50 rounded-lg"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-6 w-6 text-green-500 mx-auto mb-1"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-green-600"
  }, "99.9%"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "가동률")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-3 bg-orange-50 rounded-lg"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-6 w-6 text-orange-500 mx-auto mb-1"
  }), /*#__PURE__*/React.createElement("div", {
    className: "text-lg font-bold text-orange-600"
  }, "3"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "경고"))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "거래쌍별 분석"), /*#__PURE__*/React.createElement(CardDescription, null, "24시간 거래량 및 변동성")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 350
  }, /*#__PURE__*/React.createElement(PieChart, null, /*#__PURE__*/React.createElement(Pie, {
    data: tradingPairData,
    cx: "50%",
    cy: "50%",
    labelLine: false,
    label: ({
      name,
      percent
    }) => `${name} ${(percent * 100).toFixed(0)}%`,
    outerRadius: 100,
    fill: "#8884d8",
    dataKey: "value",
    stroke: "none"
  }, tradingPairData.map((entry, index) => /*#__PURE__*/React.createElement(Cell, {
    key: `cell-${index}`,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 space-y-2"
  }, tradingPairData.map((pair, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "flex items-center justify-between p-2 rounded-lg bg-gray-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 rounded-full mr-3",
    style: {
      backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium"
  }, pair.name)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: pair.change > 0 ? "default" : "destructive",
    className: "text-xs"
  }, pair.change > 0 ? "+" : "", pair.change, "%"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-600"
  }, pair.volume.toLocaleString(), " BTC"))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "거래량 추이"), /*#__PURE__*/React.createElement(CardDescription, null, "최근 7일간 거래량 추이")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 350
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: tradingVolumeData
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "volumeGradient",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "5%",
    stopColor: COLORS.primary,
    stopOpacity: 0.8
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "95%",
    stopColor: COLORS.primary,
    stopOpacity: 0.1
  }))), /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#f0f0f0"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date",
    stroke: "#666"
  }), /*#__PURE__*/React.createElement(YAxis, {
    stroke: "#666"
  }), /*#__PURE__*/React.createElement(Tooltip, {
    contentStyle: {
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
    },
    formatter: (value, name) => [name === "volume" ? `${value.toLocaleString()} BTC` : name === "trades" ? `${value.toLocaleString()} 건` : `${value.toLocaleString()} 명`, name === "volume" ? "거래량" : name === "trades" ? "거래 건수" : "활성 사용자"]
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "volume",
    stroke: COLORS.primary,
    fillOpacity: 1,
    fill: "url(#volumeGradient)",
    strokeWidth: 3
  }), /*#__PURE__*/React.createElement(Line, {
    type: "monotone",
    dataKey: "trades",
    stroke: COLORS.secondary,
    strokeWidth: 2,
    dot: {
      r: 4
    }
  })))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "유저별 분석"), /*#__PURE__*/React.createElement(CardDescription, null, "상세 유저 유형별 유저 구성")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-6"
  }, revenueStreamData.map((stream, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "text-center"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200
  }, /*#__PURE__*/React.createElement(RadialBarChart, {
    cx: "50%",
    cy: "50%",
    innerRadius: "60%",
    outerRadius: "90%",
    data: [stream]
  }, /*#__PURE__*/React.createElement(RadialBar, {
    dataKey: "value",
    cornerRadius: 10,
    fill: CHART_COLORS[index],
    stroke: CHART_COLORS[index],
    strokeWidth: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-lg"
  }, stream.name), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-bold text-gray-800"
  }, "$", stream.amount.toLocaleString()), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-600"
  }, stream.value, "% of total"))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "실시간 활동 피드"), /*#__PURE__*/React.createElement(CardDescription, null, "최근 시스템 활동 및 알림")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-500"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-5 w-5 text-green-500 mr-3"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-medium text-green-800"
  }, "대용량 거래 처리완료"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-green-600"
  }, "BTC/USDT 거래쌍에서 1,000 BTC 거래가 성공적으로 체결되었습니다.")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-green-600"
  }, "방금 전")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-5 w-5 text-orange-500 mr-3"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-medium text-orange-800"
  }, "시스템 부하 경고"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-orange-600"
  }, "CPU 사용률이 85%에 도달했습니다. 모니터링을 강화합니다.")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-orange-600"
  }, "2분 전")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500"
  }, /*#__PURE__*/React.createElement(Users, {
    className: "h-5 w-5 text-blue-500 mr-3"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-medium text-blue-800"
  }, "신규 사용자 급증"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-blue-600"
  }, "지난 1시간 동안 234명의 신규사용자가 가입했습니다.")), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-blue-600"
  }, "5분 전"))))));
}