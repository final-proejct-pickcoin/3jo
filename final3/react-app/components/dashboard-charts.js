"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Mock data for charts
const tradingPairData = [{
  name: "BTC/USDT",
  value: 45,
  volume: 28450.67
}, {
  name: "ETH/USDT",
  value: 25,
  volume: 15230.45
}, {
  name: "ADA/USDT",
  value: 15,
  volume: 8920.12
}, {
  name: "DOT/USDT",
  value: 10,
  volume: 5670.89
}, {
  name: "Others",
  value: 5,
  volume: 2340.56
}];
const dailyVolumeData = [{
  date: "01/10",
  volume: 25000,
  users: 1200,
  revenue: 2500
}, {
  date: "01/11",
  volume: 28000,
  users: 1350,
  revenue: 2800
}, {
  date: "01/12",
  volume: 32000,
  users: 1450,
  revenue: 3200
}, {
  date: "01/13",
  volume: 29000,
  users: 1380,
  revenue: 2900
}, {
  date: "01/14",
  volume: 35000,
  users: 1520,
  revenue: 3500
}, {
  date: "01/15",
  volume: 42000,
  users: 1680,
  revenue: 4200
}, {
  date: "01/16",
  volume: 38000,
  users: 1590,
  revenue: 3800
}];
const userStatusData = [{
  name: "활성 사용자",
  value: 12450,
  color: "#10b981"
}, {
  name: "휴면 사용자",
  value: 2340,
  color: "#f59e0b"
}, {
  name: "정지 사용자",
  value: 630,
  color: "#ef4444"
}];
const hourlyActivityData = [{
  hour: "00",
  activity: 120
}, {
  hour: "02",
  activity: 80
}, {
  hour: "04",
  activity: 60
}, {
  hour: "06",
  activity: 90
}, {
  hour: "08",
  activity: 200
}, {
  hour: "10",
  activity: 350
}, {
  hour: "12",
  activity: 420
}, {
  hour: "14",
  activity: 480
}, {
  hour: "16",
  activity: 380
}, {
  hour: "18",
  activity: 320
}, {
  hour: "20",
  activity: 280
}, {
  hour: "22",
  activity: 180
}];
const revenueData = [{
  month: "Jan",
  trading: 45000,
  withdrawal: 12000,
  listing: 8000
}, {
  month: "Feb",
  trading: 52000,
  withdrawal: 14000,
  listing: 10000
}, {
  month: "Mar",
  trading: 48000,
  withdrawal: 13000,
  listing: 9000
}, {
  month: "Apr",
  trading: 61000,
  withdrawal: 16000,
  listing: 12000
}, {
  month: "May",
  trading: 55000,
  withdrawal: 15000,
  listing: 11000
}, {
  month: "Jun",
  trading: 67000,
  withdrawal: 18000,
  listing: 14000
}];
export default function DashboardCharts() {
  return /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "xl:col-span-1"
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uAC70\uB798\uC30D\uBCC4 \uAC70\uB798\uB7C9 \uBD84\uD3EC"), /*#__PURE__*/React.createElement(CardDescription, null, "24\uC2DC\uAC04 \uAE30\uC900 \uAC70\uB798\uB7C9 \uBE44\uC728")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(PieChart, null, /*#__PURE__*/React.createElement(Pie, {
    data: tradingPairData,
    cx: "50%",
    cy: "50%",
    labelLine: false,
    label: ({
      name,
      percent
    }) => `${name} ${(percent * 100).toFixed(0)}%`,
    outerRadius: 80,
    fill: "#8884d8",
    dataKey: "value"
  }, tradingPairData.map((entry, index) => /*#__PURE__*/React.createElement(Cell, {
    key: `cell-${index}`,
    fill: COLORS[index % COLORS.length]
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: value => [`${value}%`, "비율"]
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: "xl:col-span-2"
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uC77C\uBCC4 \uAC70\uB798\uB7C9 \uCD94\uC774"), /*#__PURE__*/React.createElement(CardDescription, null, "\uCD5C\uADFC 7\uC77C\uAC04 \uAC70\uB798\uB7C9 \uBC0F \uC218\uC775 \uD604\uD669")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: dailyVolumeData
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "date"
  }), /*#__PURE__*/React.createElement(YAxis, null), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: (value, name) => [name === "volume" ? `${value.toLocaleString()} BTC` : name === "revenue" ? `$${value.toLocaleString()}` : `${value.toLocaleString()}명`, name === "volume" ? "거래량" : name === "revenue" ? "수익" : "사용자"]
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "volume",
    stackId: "1",
    stroke: "#f97316",
    fill: "#f97316",
    fillOpacity: 0.6
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "revenue",
    stackId: "2",
    stroke: "#3b82f6",
    fill: "#3b82f6",
    fillOpacity: 0.6
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uC0AC\uC6A9\uC790 \uC0C1\uD0DC \uBD84\uD3EC"), /*#__PURE__*/React.createElement(CardDescription, null, "\uC804\uCCB4 \uC0AC\uC6A9\uC790 \uD604\uD669")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, userStatusData.map((item, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 rounded-full",
    style: {
      backgroundColor: item.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium"
  }, item.name)), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-bold"
  }, item.value.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gray-500"
  }, (item.value / userStatusData.reduce((sum, d) => sum + d.value, 0) * 100).toFixed(1), "%"))))), /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 200,
    className: "mt-4"
  }, /*#__PURE__*/React.createElement(PieChart, null, /*#__PURE__*/React.createElement(Pie, {
    data: userStatusData,
    cx: "50%",
    cy: "50%",
    innerRadius: 40,
    outerRadius: 80,
    paddingAngle: 5,
    dataKey: "value"
  }, userStatusData.map((entry, index) => /*#__PURE__*/React.createElement(Cell, {
    key: `cell-${index}`,
    fill: entry.color
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: value => [value.toLocaleString(), "사용자"]
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uC2DC\uAC04\uBCC4 \uD65C\uB3D9\uB7C9"), /*#__PURE__*/React.createElement(CardDescription, null, "24\uC2DC\uAC04 \uC0AC\uC6A9\uC790 \uD65C\uB3D9 \uD328\uD134")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: hourlyActivityData
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "hour"
  }), /*#__PURE__*/React.createElement(YAxis, null), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: value => [`${value}명`, "활성 사용자"]
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "activity",
    fill: "#f97316",
    radius: [4, 4, 0, 0]
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uC218\uC775\uC6D0\uBCC4 \uBD84\uC11D"), /*#__PURE__*/React.createElement(CardDescription, null, "\uC6D4\uBCC4 \uC218\uC775 \uAD6C\uC131 \uD604\uD669")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: 300
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: revenueData
  }, /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "month"
  }), /*#__PURE__*/React.createElement(YAxis, null), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: value => [`$${value.toLocaleString()}`, ""]
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "trading",
    stackId: "a",
    fill: "#f97316",
    name: "\uAC70\uB798 \uC218\uC218\uB8CC"
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "withdrawal",
    stackId: "a",
    fill: "#3b82f6",
    name: "\uCD9C\uAE08 \uC218\uC218\uB8CC"
  }), /*#__PURE__*/React.createElement(Bar, {
    dataKey: "listing",
    stackId: "a",
    fill: "#10b981",
    name: "\uC0C1\uC7A5 \uC218\uC218\uB8CC"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: "xl:col-span-3"
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "\uC2E4\uC2DC\uAC04 \uC9C0\uD45C"), /*#__PURE__*/React.createElement(CardDescription, null, "\uD604\uC7AC \uC2DC\uC2A4\uD15C \uC0C1\uD0DC \uBC0F \uC8FC\uC694 \uC9C0\uD45C")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-green-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, "99.9%"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uC2DC\uC2A4\uD15C \uAC00\uB3D9\uB960")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-blue-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, "1,247"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uC628\uB77C\uC778 \uC0AC\uC6A9\uC790")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-orange-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-orange-600"
  }, "342"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uD65C\uC131 \uAC70\uB798")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-purple-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-purple-600"
  }, "15ms"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uD3C9\uADE0 \uC751\uB2F5\uC2DC\uAC04")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-red-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-red-600"
  }, "3"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uB300\uAE30 \uC911\uC778 \uBB38\uC758")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-yellow-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-yellow-600"
  }, "$2.4M"), /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "\uC77C\uC77C \uAC70\uB798\uB7C9"))))));
}