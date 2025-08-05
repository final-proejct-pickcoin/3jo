"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// 컴포넌트 imports
import LoginForm from "./components_admin/login-form";
import DashboardOverview from "./components_admin/dashboard-overview-simple";
import SupportManagement from "./components_admin/support-management";
import ProfileDialogs from "./components_admin/profile-dialogs";
import { AdminHeader } from "./components_admin/admin-header";
import AdminTabNavigation from "./components_admin/admin-tab-navigation";
import UserManagementEnhanced from "./components_admin/user-management-enhanced";
import LogManagement from "./components_admin/log-management-new";
import RevenueManagement from "./components_admin/revenue-management";
import SystemManagement from "./components_admin/system-management";
import { AnnouncementManagement } from "./components_admin/announcement-management";

// 훅 imports
import { useAdminDashboard, useDialogStates, useFormData } from "./components_admin/admin-dashboard-hooks";
import { useMockData, useDataActions } from "./components_admin/admin-dashboard-data";

// 메모화된 메인 컴포넌트
const AdminDashboard = memo(() => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // 커스텀 훅들
  const dashboardStates = useAdminDashboard();
  const dialogStates = useDialogStates();
  const formData = useFormData();
  const mockData = useMockData();
  
  // 데이터 액션 훅
  const dataActions = useDataActions(
    mockData.users, 
    mockData.setUsers
  );

  // 통합 핸들러들
  const handlers = {
    logout: async () => {
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
    },

    exportLogs: () => {
      const selectedLogData = mockData.logs.filter(log => 
        dashboardStates.selectedLogs.includes(log.id)
      );
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        "시간,사용자,액션,IP,상태,레벨\n" + 
        selectedLogData.map(log => 
          `${log.timestamp},${log.user},${log.action},${log.ip},${log.status},${log.level}`
        ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = Object.assign(document.createElement("a"), {
        href: encodedUri,
        download: "logs.csv"
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    notifications: {
      markAsRead: (id) => mockData.setNotifications(mockData.notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )),
      markAllAsRead: () => mockData.setNotifications(mockData.notifications.map(notif => ({
        ...notif, read: true
      })))
    },

    logs: {
      deleteSelected: () => {
        mockData.setLogs(mockData.logs.filter(log => 
          !dashboardStates.selectedLogs.includes(log.id)
        ));
        dashboardStates.setSelectedLogs([]);
      },
      archiveSelected: () => {
        console.log("Archiving logs:", dashboardStates.selectedLogs);
        dashboardStates.setSelectedLogs([]);
      }
    }
  };

  // 초기화 및 계산된 값들
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoggedIn(false);
    } else {
      const userProfile = Object.fromEntries(
        ["sub", "name", "role"].map(key => [key === "sub" ? "email" : key, localStorage.getItem(key)])
      );
      
      formData.setProfileData(prev => ({ ...prev, ...userProfile }));
      setIsLoggedIn(true);
    }
  }, []);

  // 계산된 값들
  const computedData = {
    filteredUsers: dataActions.filteredUsers(dashboardStates.searchTerm, dashboardStates.statusFilter),
    filteredLogs: dataActions.filteredLogs(mockData.logs, dashboardStates.logLevelFilter),
    unreadCount: mockData.notifications.filter(n => !n.read).length
  };

  // 로딩 및 로그인 상태 처리
  if (isLoggedIn === null) {
    return <div style={{ background: "#fff", width: "100%", height: "100vh" }} />;
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen ${dashboardStates.isDarkMode ? "dark bg-gray-900" : "bg-background"}`}>
      <AdminHeader
        isDarkMode={dashboardStates.isDarkMode}
        setIsDarkMode={dashboardStates.setIsDarkMode}
        unreadCount={computedData.unreadCount}
        notifications={mockData.notifications}
        isNotificationDialogOpen={dialogStates.isNotificationDialogOpen}
        setIsNotificationDialogOpen={dialogStates.setIsNotificationDialogOpen}
        isSettingsDialogOpen={dialogStates.isSettingsDialogOpen}
        setIsSettingsDialogOpen={dialogStates.setIsSettingsDialogOpen}
        handleMarkAllNotificationsAsRead={handlers.notifications.markAllAsRead}
        handleMarkNotificationAsRead={handlers.notifications.markAsRead}
        handleLogout={handlers.logout}
        setIsProfileDialogOpen={dialogStates.setIsProfileDialogOpen}
        setIsPasswordDialogOpen={dialogStates.setIsPasswordDialogOpen}
        setIsSecurityDialogOpen={dialogStates.setIsSecurityDialogOpen}
        setIsHelpDialogOpen={dialogStates.setIsHelpDialogOpen}
      />

      <div className="flex">
        <aside className={`w-64 ${dashboardStates.isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card border-border"} border-r min-h-screen`}>
          <nav className="p-4">
            <AdminTabNavigation
              activeTab={dashboardStates.activeTab}
              setActiveTab={dashboardStates.setActiveTab}
              isDarkMode={dashboardStates.isDarkMode}
              orientation="vertical"
            />
          </nav>
        </aside>

        <main className={`flex-1 ${dashboardStates.isDarkMode ? "bg-gray-900" : "bg-background"} p-6`}>
          {dashboardStates.activeTab === "dashboard" && (
            <DashboardOverview isDarkMode={dashboardStates.isDarkMode} />
          )}
          {dashboardStates.activeTab === "users" && (
            <UserManagementEnhanced isDarkMode={dashboardStates.isDarkMode} />
          )}
          {dashboardStates.activeTab === "support" && (
            <SupportManagement isDarkMode={dashboardStates.isDarkMode} />
          )}
          {dashboardStates.activeTab === "logs" && (
            <LogManagement isDarkMode={dashboardStates.isDarkMode} />
          )}
          {dashboardStates.activeTab === "revenue" && (
            <RevenueManagement isDarkMode={dashboardStates.isDarkMode} />
          )}
          {dashboardStates.activeTab === "announcements" && (
            <AnnouncementManagement
              isDarkMode={dashboardStates.isDarkMode}
              announcements={mockData.announcements}
              newAnnouncement={formData.newAnnouncement}
              setNewAnnouncement={formData.setNewAnnouncement}
              isAnnouncementDialogOpen={dialogStates.isAnnouncementDialogOpen}
              setIsAnnouncementDialogOpen={dialogStates.setIsAnnouncementDialogOpen}
              isAnnouncementDetailOpen={dialogStates.isAnnouncementDetailOpen}
              setIsAnnouncementDetailOpen={dialogStates.setIsAnnouncementDetailOpen}
              selectedAnnouncement={dialogStates.selectedAnnouncement}
              setSelectedAnnouncement={dialogStates.setSelectedAnnouncement}
              handleCreateAnnouncement={() => {
                if (!formData.newAnnouncement.title.trim() || !formData.newAnnouncement.content.trim()) return;
                const announcement = {
                  id: mockData.announcements.length + 1,
                  ...formData.newAnnouncement,
                  date: new Date().toISOString().split("T")[0],
                  status: "active",
                  views: 0
                };
                mockData.setAnnouncements([announcement, ...mockData.announcements]);
                formData.setNewAnnouncement({ title: "", content: "", important: false });
                dialogStates.setIsAnnouncementDialogOpen(false);
              }}
              handleAnnouncementClick={(announcement) => {
                dialogStates.setSelectedAnnouncement(announcement);
                dialogStates.setIsAnnouncementDetailOpen(true);
                mockData.setAnnouncements(mockData.announcements.map(ann =>
                  ann.id === announcement.id ? { ...ann, views: ann.views + 1 } : ann
                ));
              }}
              handleAnnouncementStatusToggle={(id) => {
                mockData.setAnnouncements(mockData.announcements.map(ann =>
                  ann.id === id ? { ...ann, status: ann.status === "active" ? "expired" : "active" } : ann
                ));
              }}
              handleDeleteAnnouncement={(id) => {
                mockData.setAnnouncements(mockData.announcements.filter(ann => ann.id !== id));
              }}
            />
          )}
          {dashboardStates.activeTab === "system" && (
            <SystemManagement isDarkMode={dashboardStates.isDarkMode} />
          )}
        </main>
      </div>

      <ProfileDialogs
        isProfileDialogOpen={dialogStates.isProfileDialogOpen}
        setIsProfileDialogOpen={dialogStates.setIsProfileDialogOpen}
        isPasswordDialogOpen={dialogStates.isPasswordDialogOpen}
        setIsPasswordDialogOpen={dialogStates.setIsPasswordDialogOpen}
        isSecurityDialogOpen={dialogStates.isSecurityDialogOpen}
        setIsSecurityDialogOpen={dialogStates.setIsSecurityDialogOpen}
        isHelpDialogOpen={dialogStates.isHelpDialogOpen}
        setIsHelpDialogOpen={dialogStates.setIsHelpDialogOpen}
        profileData={formData.profileData}
        setProfileData={formData.setProfileData}
        passwordData={formData.passwordData}
        setPasswordData={formData.setPasswordData}
        isDarkMode={dashboardStates.isDarkMode}
      />
    </div>
  );
});

export default AdminDashboard;
