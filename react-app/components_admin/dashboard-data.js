// Static data constants (성능 최적화를 위해 분리)
export const CHART_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"
];

export const COLORS = {
  primary: "#f97316",
  secondary: "#3b82f6", 
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444"
};

// Trading pair data
export const tradingPairData = [
  { name: "BTC/USDT", value: 45, volume: 28450.67, change: 2.34 },
  { name: "ETH/USDT", value: 25, volume: 15230.45, change: -1.23 },
  { name: "ADA/USDT", value: 15, volume: 8920.12, change: 5.67 },
  { name: "DOT/USDT", value: 10, volume: 5670.89, change: 3.45 },
  { name: "Others", value: 5, volume: 2340.56, change: 0.89 }
];

// Performance monitoring data
export const performanceData = [
  { time: "00:00", cpu: 45, memory: 62, network: 78 },
  { time: "04:00", cpu: 52, memory: 58, network: 82 },
  { time: "08:00", cpu: 78, memory: 71, network: 65 },
  { time: "12:00", cpu: 85, memory: 79, network: 88 },
  { time: "16:00", cpu: 72, memory: 68, network: 75 },
  { time: "20:00", cpu: 58, memory: 64, network: 70 }
];

// Revenue stream data
export const revenueStreamData = [
  { name: "거래 수수료", value: 67, amount: 847230 },
  { name: "출금 수수료", value: 23, amount: 289450 },
  { name: "상장 수수료", value: 10, amount: 125600 }
];

// Security metrics data
export const securityMetrics = [
  { name: "정상 로그인", value: 89, color: COLORS.success },
  { name: "실패한 로그인", value: 8, color: COLORS.warning },
  { name: "차단된 IP", value: 3, color: COLORS.danger }
];

// Trading volume data (통합된 차트 데이터)
export const tradingVolumeData = [
  { date: "01/10", volume: 25000, trades: 1200, users: 890, revenue: 2500 },
  { date: "01/11", volume: 28000, trades: 1350, users: 920, revenue: 2800 },
  { date: "01/12", volume: 32000, trades: 1450, users: 1050, revenue: 3200 },
  { date: "01/13", volume: 29000, trades: 1380, users: 980, revenue: 2900 },
  { date: "01/14", volume: 35000, trades: 1520, users: 1120, revenue: 3500 },
  { date: "01/15", volume: 42000, trades: 1680, users: 1340, revenue: 4200 },
  { date: "01/16", volume: 38000, trades: 1590, users: 1250, revenue: 3800 }
];
