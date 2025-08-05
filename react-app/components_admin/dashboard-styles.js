// Dashboard 컴포넌트 스타일과 유틸리티
export const DASHBOARD_STYLES = {
  mainContainer: "space-y-8",
  metricsGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
  contentGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  analysisGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  revenueGrid: "grid grid-cols-1 md:grid-cols-3 gap-6",
  
  // Card variants
  gradientCard: "relative overflow-hidden border-0 text-white",
  cardOverlay: "absolute inset-0 bg-black/10",
  cardContent: "relative p-6",
  
  // Gradient backgrounds
  gradients: {
    orange: "bg-gradient-to-br from-orange-500 to-amber-500",
    blue: "bg-gradient-to-br from-blue-500 to-cyan-500",
    green: "bg-gradient-to-br from-green-500 to-emerald-500",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500"
  },
  
  // Text colors
  textColors: {
    orange: "text-orange-100",
    blue: "text-blue-100", 
    green: "text-green-100",
    purple: "text-purple-100"
  },
  
  // Icon colors
  iconColors: {
    orange: "text-orange-200",
    blue: "text-blue-200",
    green: "text-green-200", 
    purple: "text-purple-200"
  },
  
  // Activity feed
  activityItem: "flex items-center p-4 rounded-lg border-l-4",
  activityIcon: "h-5 w-5 mr-3",
  activityContent: "flex-1",
  activityTime: "text-xs",
  
  // Activity variants
  activityVariants: {
    success: "bg-green-50 dark:bg-green-900/20 border-green-500",
    warning: "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
  },
  
  // Security metrics
  securityItem: "space-y-2",
  securityHeader: "flex justify-between items-center",
  securityName: "text-sm font-medium",
  securityValue: "text-sm font-bold",
  securityProgress: "h-2",
  
  // Trading pair styles
  tradingPairItem: "flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800",
  tradingPairIndicator: "w-3 h-3 rounded-full mr-3",
  tradingPairName: "font-medium",
  tradingPairBadge: "text-xs",
  tradingPairVolume: "text-sm text-gray-600 dark:text-gray-300"
};

// Tooltip styles
export const TOOLTIP_STYLE = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb", 
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
};

// Chart gradients
export const CHART_GRADIENTS = {
  cpu: "cpuGradient",
  memory: "memoryGradient", 
  network: "networkGradient",
  volume: "volumeGradient"
};
