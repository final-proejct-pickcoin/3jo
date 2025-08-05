// 공통 차트 색상 팔레트
export const CHART_COLORS = [
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6"  // Teal
];

// 공통 색상 상수
export const COLORS = {
  primary: '#f97316',
  secondary: '#3b82f6', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6'
};

// 차트 공통 설정
export const CHART_CONFIG = {
  grid: {
    strokeDasharray: "3 3",
    stroke: "#374151"
  },
  axis: {
    fontSize: 12,
    fill: "#9ca3af"
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#1f2937',
      border: 'none',
      borderRadius: '8px',
      color: '#ffffff'
    }
  }
};
