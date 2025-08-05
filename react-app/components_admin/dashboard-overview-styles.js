// Dashboard Overview 스타일 상수
export const DASHBOARD_STYLES = {
  container: "space-y-6",
  header: "flex items-center justify-between",
  title: "text-2xl font-bold text-white",
  subtitle: "text-gray-300 mt-1",
  controls: "flex items-center space-x-2",
  tradingAlert: "bg-red-50 border border-red-200 rounded-lg p-4",
  statsGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
  chartGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  pendingGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  
  // Card 스타일
  card: "bg-gray-800 border-gray-700",
  cardContent: "p-6",
  cardLayout: "flex items-center justify-between",
  
  // Stat 스타일
  statInfo: "space-y-1",
  statTitle: "text-sm font-medium text-gray-300",
  statValue: "text-2xl font-bold text-white",
  statTrend: "flex items-center mt-2",
  statIcon: "w-12 h-12 rounded-lg flex items-center justify-center",
  
  // Pending 스타일
  pendingList: "space-y-3",
  pendingItem: "flex items-center justify-between p-3 bg-gray-700 rounded-lg",
  pendingInfo: "space-y-1",
  pendingUser: "text-white font-medium",
  pendingDetails: "text-gray-400 text-sm",
  pendingActions: "flex space-x-2",
  
  // Chart 스타일
  chartTitle: "text-white",
  
  // System 스타일
  systemStatus: "space-y-4",
  progressLabel: "flex justify-between text-sm mb-2",
  statusItem: "flex items-center justify-between"
};

// 아이콘 색상 조합
export const ICON_THEMES = {
  orange: { bg: "bg-orange-100", color: "text-orange-600" },
  blue: { bg: "bg-blue-100", color: "text-blue-600" },
  green: { bg: "bg-green-100", color: "text-green-600" },
  purple: { bg: "bg-purple-100", color: "text-purple-600" }
};

// 차트 공통 설정
export const CHART_CONFIG = {
  tooltip: {
    contentStyle: { 
      backgroundColor: '#1F2937', 
      border: 'none', 
      borderRadius: '8px' 
    }
  },
  grid: {
    strokeDasharray: "3 3",
    stroke: "#374151"
  },
  axis: {
    stroke: "#9CA3AF"
  }
};
