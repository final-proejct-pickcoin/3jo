// Dashboard Overview 데이터 상수들
export const CHART_COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export const INITIAL_STATS = {
  totalUsers: 15420,
  onlineUsers: 1247,
  dailyVolume: 28450.67,
  revenue: 847230,
  systemLoad: 68,
  uptime: 99.9,
  pendingWithdrawals: 23,
  kycPending: 12
};

export const TRADING_DATA = [
  { time: "00:00", volume: 1200, users: 45 },
  { time: "04:00", volume: 800, users: 32 },
  { time: "08:00", volume: 1800, users: 67 },
  { time: "12:00", volume: 2400, users: 89 },
  { time: "16:00", volume: 2100, users: 78 },
  { time: "20:00", volume: 1600, users: 56 }
];

export const COIN_DATA = [
  { name: "BTC", value: 45, volume: "28,450" },
  { name: "ETH", value: 25, volume: "15,230" },
  { name: "ADA", value: 15, volume: "8,920" },
  { name: "DOT", value: 10, volume: "5,670" },
  { name: "Others", value: 5, volume: "2,340" }
];

export const PENDING_WITHDRAWALS = [
  { id: 1, user: "user123", amount: "1.2345 BTC", time: "5분 전", status: "대기" },
  { id: 2, user: "user456", amount: "15.67 ETH", time: "12분 전", status: "대기" },
  { id: 3, user: "user789", amount: "5000 USDT", time: "18분 전", status: "대기" }
];

export const KYC_PENDING = [
  { id: 1, user: "newuser1", level: "Level 2", submitted: "2시간 전" },
  { id: 2, user: "newuser2", level: "Level 3", submitted: "4시간 전" },
  { id: 3, user: "newuser3", level: "Level 2", submitted: "6시간 전" }
];
