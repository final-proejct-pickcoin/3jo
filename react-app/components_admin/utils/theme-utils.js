// 공통 테마 유틸리티 함수들
export const getDarkClass = (base = "", dark = "", important = false) => (isDarkMode) => {
  if (!important) return isDarkMode ? dark : base;
  // tailwind !important 적용
  const addBang = (cls) => cls.split(' ').map(c => c ? `!${c}` : '').join(' ');
  return isDarkMode ? addBang(dark) : addBang(base);
};

export const getCardClass = (isDarkMode) => 
  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white';

export const getTitleClass = (isDarkMode) => 
  isDarkMode ? 'text-white' : 'text-gray-900';

export const getSubtitleClass = (isDarkMode) => 
  isDarkMode ? 'text-gray-400' : 'text-gray-600';

export const getTooltipStyle = (isDarkMode) => ({
  contentStyle: {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    border: 'none',
    borderRadius: '8px',
    color: isDarkMode ? '#ffffff' : '#000000'
  }
});

// 강제 다이얼로그 배경/텍스트 유틸 (Tailwind !important 적용)
export const getDialogThemeClass = (isDarkMode) =>
  isDarkMode
    ? '!bg-gray-800 !text-gray-100 border-gray-700'
    : '!bg-white !text-gray-900';

// 상태 색상 매핑
export const getStatusColors = (status, isDarkMode) => {
  const colors = {
    light: {
      active: 'text-green-600',
      suspended: 'text-red-600',
      pending: 'text-yellow-600',
      resolved: 'text-green-600',
      open: 'text-blue-600',
      closed: 'text-gray-600'
    },
    dark: {
      active: 'text-green-400',
      suspended: 'text-red-400',
      pending: 'text-yellow-400',
      resolved: 'text-green-400',
      open: 'text-blue-400',
      closed: 'text-gray-400'
    }
  };
  
  return colors[isDarkMode ? 'dark' : 'light'][status] || 'text-gray-500';
};

// 우선순위 색상 매핑
export const getPriorityColors = (priority, isDarkMode) => {
  const colors = {
    light: {
      high: 'text-red-600 bg-red-50',
      medium: 'text-yellow-600 bg-yellow-50',
      low: 'text-green-600 bg-green-50'
    },
    dark: {
      high: 'text-red-400 bg-red-900/20',
      medium: 'text-yellow-400 bg-yellow-900/20',
      low: 'text-green-400 bg-green-900/20'
    }
  };
  
  return colors[isDarkMode ? 'dark' : 'light'][priority] || 'text-gray-500';
};
