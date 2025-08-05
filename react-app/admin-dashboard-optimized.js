"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/admin-dashboard.module.css";

// 컴포넌트 imports
import LoginForm from "./components_admin/login-form";
import ProfileDialogs from "./components_admin/profile-dialogs";
import { AdminHeader } from "./components_admin/admin-header";
import { AdminTabNavigation } from "./components_admin/admin-tab-navigation";
import AdminTabContent from "./components_admin/admin-tab-content";

// 훅 imports
import { useAdminDashboard, useDialogStates, useFormData } from "./components_admin/admin-dashboard-hooks";
import { useMockData, useDataActions } from "./components_admin/admin-dashboard-data";
import { 
  useLogoutHandler, 
  useExportLogsHandler, 
  useNotificationHandlers, 
  useLogHandlers, 
  useAnnouncementHandlers 
} from "./components_admin/admin-handlers";
import { 
  useUserManagementProps,
  useLogManagementProps,
  useAnnouncementManagementProps,
  useProfileDialogsProps
} from "./components_admin/admin-props";

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
    mockData.setUsers, 
    mockData.announcements, 
    mockData.setAnnouncements
  );

  // 계산된 값들 (메모화)
  const filteredUsers = useMemo(() => 
    dataActions.filteredUsers(dashboardStates.searchTerm, dashboardStates.statusFilter),
    [dataActions, dashboardStates.searchTerm, dashboardStates.statusFilter]
  );
  
  const filteredLogs = useMemo(() => 
    dataActions.filteredLogs(mockData.logs, dashboardStates.logLevelFilter),
    [dataActions, mockData.logs, dashboardStates.logLevelFilter]
  );
  
  const unreadCount = useMemo(() => 
    mockData.notifications.filter(n => !n.read).length,
    [mockData.notifications]
  );

  // 공통 props 객체 (메모화)
  const commonProps = useMemo(() => ({
    isDarkMode: dashboardStates.isDarkMode,
    mockData,
    dialogStates,
    formData,
    dataActions
  }), [dashboardStates.isDarkMode, mockData, dialogStates, formData, dataActions]);

  // 핸들러들 (커스텀 훅 사용)
  const handleLogout = useLogoutHandler(router, setIsLoggedIn);
  const handleExportLogs = useExportLogsHandler(mockData.logs, dashboardStates.selectedLogs);
  const notificationHandlers = useNotificationHandlers(mockData.notifications, mockData.setNotifications);
  const logHandlers = useLogHandlers(mockData.logs, mockData.setLogs, dashboardStates.selectedLogs, dashboardStates.setSelectedLogs);
  const announcementHandlers = useAnnouncementHandlers(
    formData.newAnnouncement, 
    formData.setNewAnnouncement,
    mockData.announcements, 
    mockData.setAnnouncements,
    dialogStates.setIsAnnouncementDialogOpen,
    dialogStates.setSelectedAnnouncement,
    dialogStates.setIsAnnouncementDetailOpen
  );

  // 초기화 효과
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    
    const userProfile = Object.fromEntries(
      ["sub", "name", "role"].map(key => [key === "sub" ? "email" : key, localStorage.getItem(key)])
    );
    
    formData.setProfileData(prev => ({ ...prev, ...userProfile }));
    setIsLoggedIn(true);
  }, [formData.setProfileData]);

  // 로딩 및 로그인 상태 처리
  if (isLoggedIn === null) {
    return <div className={styles.loadingContainer} />;
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  // Props 객체들 (최적화된 커스텀 훅 사용)
  const userManagementProps = useUserManagementProps({
    ...commonProps,
    users: mockData.users,
    searchTerm: dashboardStates.searchTerm,
    setSearchTerm: dashboardStates.setSearchTerm,
    statusFilter: dashboardStates.statusFilter,
    setStatusFilter: dashboardStates.setStatusFilter,
    filteredUsers,
    handleUserStatusToggle: dataActions.handleUserStatusToggle,
    setSelectedUser: dialogStates.setSelectedUser,
    setIsUserDetailDialogOpen: dialogStates.setIsUserDetailDialogOpen
  });

  const logManagementProps = useLogManagementProps({
    ...commonProps,
    logs: mockData.logs,
    logLevelFilter: dashboardStates.logLevelFilter,
    setLogLevelFilter: dashboardStates.setLogLevelFilter,
    filteredLogs,
    selectedLogs: dashboardStates.selectedLogs,
    setSelectedLogs: dashboardStates.setSelectedLogs,
    handleExportLogs,
    deleteSelected: logHandlers.deleteSelected,
    archiveSelected: logHandlers.archiveSelected
  });

  const announcementManagementProps = useAnnouncementManagementProps({
    ...commonProps,
    announcements: mockData.announcements,
    newAnnouncement: formData.newAnnouncement,
    setNewAnnouncement: formData.setNewAnnouncement,
    isAnnouncementDialogOpen: dialogStates.isAnnouncementDialogOpen,
    setIsAnnouncementDialogOpen: dialogStates.setIsAnnouncementDialogOpen,
    isAnnouncementDetailOpen: dialogStates.isAnnouncementDetailOpen,
    setIsAnnouncementDetailOpen: dialogStates.setIsAnnouncementDetailOpen,
    selectedAnnouncement: dialogStates.selectedAnnouncement,
    create: announcementHandlers.create,
    click: announcementHandlers.click,
    toggleStatus: announcementHandlers.toggleStatus,
    handleDeleteAnnouncement: dataActions.handleDeleteAnnouncement
  });

  const profileDialogsProps = useProfileDialogsProps({
    ...commonProps,
    isProfileDialogOpen: dialogStates.isProfileDialogOpen,
    setIsProfileDialogOpen: dialogStates.setIsProfileDialogOpen,
    isPasswordDialogOpen: dialogStates.isPasswordDialogOpen,
    setIsPasswordDialogOpen: dialogStates.setIsPasswordDialogOpen,
    isSecurityDialogOpen: dialogStates.isSecurityDialogOpen,
    setIsSecurityDialogOpen: dialogStates.setIsSecurityDialogOpen,
    isHelpDialogOpen: dialogStates.isHelpDialogOpen,
    setIsHelpDialogOpen: dialogStates.setIsHelpDialogOpen,
    profileData: formData.profileData,
    setProfileData: formData.setProfileData,
    passwordData: formData.passwordData,
    setPasswordData: formData.setPasswordData
  });

  return (
    <div className={`${styles.adminContainer} ${dashboardStates.isDarkMode ? styles.dark : styles.light}`}>
      <AdminHeader
        isDarkMode={dashboardStates.isDarkMode}
        setIsDarkMode={dashboardStates.setIsDarkMode}
        unreadCount={unreadCount}
        notifications={mockData.notifications}
        isNotificationDialogOpen={dialogStates.isNotificationDialogOpen}
        setIsNotificationDialogOpen={dialogStates.setIsNotificationDialogOpen}
        isSettingsDialogOpen={dialogStates.isSettingsDialogOpen}
        setIsSettingsDialogOpen={dialogStates.setIsSettingsDialogOpen}
        onMarkAllNotificationsAsRead={notificationHandlers.markAllAsRead}
        onMarkNotificationAsRead={notificationHandlers.markAsRead}
        onLogout={handleLogout}
      />

      <main className={styles.mainContent}>
        <AdminTabNavigation
          activeTab={dashboardStates.activeTab}
          setActiveTab={dashboardStates.setActiveTab}
          isDarkMode={dashboardStates.isDarkMode}
        />

        <div className={styles.tabContainer}>
          <AdminTabContent
            userManagementProps={userManagementProps}
            logManagementProps={logManagementProps}
            announcementManagementProps={announcementManagementProps}
            activeTab={dashboardStates.activeTab}
            isDarkMode={dashboardStates.isDarkMode}
          />
        </div>
      </main>

      <ProfileDialogs {...profileDialogsProps} />
    </div>
  );
});

export default AdminDashboard;
