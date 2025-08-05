import { useMemo, useCallback } from "react";
import axios from "axios";

// 로그아웃 핸들러 훅
export const useLogoutHandler = (router, setIsLoggedIn) => {
  return useCallback(async () => {
    try {
      const email = localStorage.getItem("sub");
      await axios.post(
        "http://localhost:8000/admin/logout",
        new URLSearchParams({ email }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      ["access_token", "user_name", "role", "sub"].forEach(key => 
        localStorage.removeItem(key)
      );
      
      setIsLoggedIn(false);
      router.push("/admin");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  }, [router, setIsLoggedIn]);
};

// 로그 내보내기 핸들러 훅
export const useExportLogsHandler = (logs, selectedLogs) => {
  return useCallback(() => {
    const selectedLogData = logs.filter(log => selectedLogs.includes(log.id));
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "시간,사용자,액션,IP,상태,레벨\n" + 
      selectedLogData.map(log => 
        `${log.timestamp},${log.user},${log.action},${log.ip},${log.status},${log.level}`
      ).join("\n");
    
    const link = document.createElement("a");
    Object.assign(link, {
      href: encodeURI(csvContent),
      download: "logs.csv"
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logs, selectedLogs]);
};

// 알림 핸들러 훅
export const useNotificationHandlers = (notifications, setNotifications) => {
  return useMemo(() => ({
    markAsRead: (id) => {
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    },
    markAllAsRead: () => {
      setNotifications(notifications.map(notif => ({
        ...notif, read: true
      })));
    }
  }), [notifications, setNotifications]);
};

// 로그 핸들러 훅
export const useLogHandlers = (logs, setLogs, selectedLogs, setSelectedLogs) => {
  return useMemo(() => ({
    deleteSelected: () => {
      setLogs(logs.filter(log => !selectedLogs.includes(log.id)));
      setSelectedLogs([]);
    },
    archiveSelected: () => {
      console.log("Archiving logs:", selectedLogs);
      setSelectedLogs([]);
    }
  }), [logs, setLogs, selectedLogs, setSelectedLogs]);
};

// 시스템 관리 핸들러 훅
export const useSystemHandlers = () => {
  return useMemo(() => ({
    toggleSecurity: (setting, currentSettings, setSettings) => {
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    },
    executeBackup: () => {
      console.log("Manual backup initiated");
      // 실제 백업 로직 구현
    },
    toggleBackup: (currentSettings, setSettings) => {
      setSettings(prev => ({
        ...prev,
        autoBackup: !prev.autoBackup
      }));
    },
    restartSystem: () => {
      console.log("System restart initiated");
      // 시스템 재시작 로직
    },
    updateSystem: () => {
      console.log("System update initiated");
      // 시스템 업데이트 로직
    }
  }), []);
};
