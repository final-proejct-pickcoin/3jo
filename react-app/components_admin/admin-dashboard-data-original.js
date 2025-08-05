import { useState, useMemo, useCallback } from "react";

// 초기 데이터 상수들
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "새로운 출금 요청",
    message: "user123이 1.5 BTC 출금을 요청했습니다.",
    time: "5분 전",
    read: false
  },
  {
    id: 2,
    title: "시스템 알림",
    message: "CPU 사용률이 85%에 도달했습니다.",
    time: "12분 전",
    read: false
  },
  {
    id: 3,
    title: "KYC 승인 요청",
    message: "3건의 KYC 승인이 대기 중입니다.",
    time: "1시간 전",
    read: true
  }
];

const INITIAL_USERS = [
  {
    id: 1,
    username: "user123",
    email: "user123@example.com",
    status: "활성",
    joinDate: "2024-01-10",
    balance: "1.2345 BTC",
    lastLogin: "2024-01-15 14:30",
    trades: 45,
    verified: true
  },
  {
    id: 2,
    username: "user456",
    email: "user456@example.com",
    status: "정지",
    joinDate: "2024-01-08",
    balance: "0.8901 BTC",
    lastLogin: "2024-01-14 09:15",
    trades: 23,
    verified: false
  },
  {
    id: 3,
    username: "user789",
    email: "user789@example.com",
    status: "활성",
    joinDate: "2024-01-05",
    balance: "2.1234 BTC",
    lastLogin: "2024-01-15 13:45",
    trades: 78,
    verified: true
  }
];

const INITIAL_LOGS = [
  {
    id: 1,
    timestamp: "2024-01-15 14:30:25",
    user: "user123",
    action: "로그인",
    ip: "192.168.1.100",
    status: "성공",
    level: "info"
  },
  {
    id: 2,
    timestamp: "2024-01-15 14:28:15",
    user: "user456",
    action: "거래 체결",
    ip: "192.168.1.101",
    status: "성공",
    level: "info"
  },
  {
    id: 3,
    timestamp: "2024-01-15 14:25:10",
    user: "user789",
    action: "출금 요청",
    ip: "192.168.1.102",
    status: "대기",
    level: "warn"
  },
  {
    id: 4,
    timestamp: "2024-01-15 14:22:05",
    user: "suspicious_user",
    action: "로그인 실패",
    ip: "192.168.1.103",
    status: "실패",
    level: "error"
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "시스템 점검 안내",
    content: "2024년 1월 16일 02:00-04:00 정기 점검이 있습니다.",
    date: "2024-01-15",
    important: true,
    status: "active",
    views: 156
  },
  {
    id: 2,
    title: "새로운 거래쌍 추가",
    content: "ETH/KRW 거래쌍이 새롭게 추가되었습니다.",
    date: "2024-01-14",
    important: false,
    status: "active",
    views: 89
  }
];

// 데이터 유효성 검사 함수들
const validateNotification = (notification) => {
  return notification && 
    typeof notification.id === 'number' &&
    typeof notification.title === 'string' &&
    typeof notification.message === 'string';
};

const validateUser = (user) => {
  return user && 
    typeof user.id === 'number' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string';
};

// 목 데이터 관리 훅
export const useMockDataOriginal = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);

  // 알림 관련 함수들
  const addNotification = useCallback((notification) => {
    if (!validateNotification(notification)) return false;
    
    setNotifications(prev => [{
      ...notification,
      id: Math.max(...prev.map(n => n.id), 0) + 1,
      time: "방금 전",
      read: false
    }, ...prev]);
    return true;
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // 사용자 관련 함수들
  const updateUserStatus = useCallback((userId, status) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, status }
          : user
      )
    );
  }, []);

  // 통계 데이터 계산
  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(user => user.status === '활성').length,
    unreadNotifications: notifications.filter(notification => !notification.read).length,
    totalLogs: logs.length
  }), [users, notifications, logs]);

  return {
    notifications,
    users,
    logs,
    announcements,
    stats,
    addNotification,
    markNotificationAsRead,
    updateUserStatus,
    setNotifications,
    setUsers,
    setLogs,
    setAnnouncements
  };
};

// 데이터 액션 훅
export const useDataActionsOriginal = (users, setUsers, announcements, setAnnouncements) => {
  const filteredUsers = useCallback((searchTerm, statusFilter) => 
    users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [users]);

  const filteredLogs = useCallback((logs, logLevelFilter) =>
    logs.filter(log => logLevelFilter === "all" || log.level === logLevelFilter), []);

  const handleUserStatusToggle = useCallback((userId) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "활성" ? "정지" : "활성" }
        : user
    ));
  }, [users, setUsers]);

  const handleDeleteAnnouncement = useCallback((id) => {
    setAnnouncements(announcements.filter(ann => ann.id !== id));
  }, [announcements, setAnnouncements]);

  return {
    filteredUsers,
    filteredLogs,
    handleUserStatusToggle,
    handleDeleteAnnouncement
  };
};
