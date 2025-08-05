"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/admin-dashboard.module.css";

// UI Components
import { 
  Bell, Settings, LogOut, Moon, Sun, Shield, User, Key, HelpCircle
} from "lucide-react";

import { Button } from "@/components_admin/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components_admin/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components_admin/ui/dropdown-menu";
import { Separator } from "@/components_admin/ui/separator";

// 커스텀 컴포넌트들
import LoginForm from "./components_admin/login-form";
import DashboardOverview from "./components_admin/dashboard-overview";
import SupportManagement from "./components_admin/support-management";
import ProfileDialogs from "./components_admin/profile-dialogs";
import UserManagementTab from "./components_admin/user-management-tab";
import LogManagementTab from "./components_admin/log-management-tab";
import AnnouncementManagementTab from "./components_admin/announcement-management-tab";
import AdminDialogs from "./components_admin/admin-dialogs";
import UserProfileDropdown from "./components_admin/user-profile-dropdown";

// 커스텀 훅들
import { useAdminDashboardOriginal, useDialogStatesOriginal, useFormDataOriginal } from "./components_admin/admin-dashboard-hooks-original";
import { useMockDataOriginal, useDataActionsOriginal } from "./components_admin/admin-dashboard-data-original";
import { 
  useLogoutHandler, 
  useExportLogsHandler, 
  useNotificationHandlers, 
  useLogHandlers, 
  useAnnouncementHandlers 
} from "./components_admin/admin-handlers";

const AdminDashboard = memo(() => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // 커스텀 훅들로 상태 관리
  const dashboardStates = useAdminDashboardOriginal();
  const dialogStates = useDialogStatesOriginal();
  const formData = useFormDataOriginal();
  const mockData = useMockDataOriginal();
  
  // 데이터 액션 훅
  const dataActions = useDataActionsOriginal(
    mockData.users, 
    mockData.setUsers, 
    mockData.announcements, 
    mockData.setAnnouncements
  );

  // 핸들러들
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

  // 공통 유틸리티 함수들
  const getBadgeVariant = useMemo(() => ({
    userStatus: (status) => status === "활성" ? "default" : "destructive",
    announcementStatus: (status) => status === "active" ? "default" : "secondary",
    logStatus: (status) => status === "성공" ? "default" : status === "대기" ? "secondary" : "destructive"
  }), []);

  const styleUtilities = useMemo(() => {
    const getDarkModeClass = (lightClass = "", darkClass = "") => 
      dashboardStates.isDarkMode ? darkClass : lightClass;
    
    return {
      getDarkModeClass,
      getCardClass: () => getDarkModeClass("", "bg-gray-800 border-gray-700"),
      getTextClass: () => getDarkModeClass("", "text-white"),
      getDescriptionClass: () => getDarkModeClass("", "text-gray-400")
    };
  }, [dashboardStates.isDarkMode]);

  // 계산된 값들 (메모화)
  const computedValues = useMemo(() => {
    const filteredUsers = dataActions.filteredUsers(dashboardStates.searchTerm, dashboardStates.statusFilter);
    const filteredLogs = dataActions.filteredLogs(mockData.logs, dashboardStates.logLevelFilter);
    const unreadCount = mockData.notifications.filter(n => !n.read).length;
    const hasSelectedLogs = dashboardStates.selectedLogs.length > 0;
    const allLogsSelected = dashboardStates.selectedLogs.length === filteredLogs.length && filteredLogs.length > 0;

    return { filteredUsers, filteredLogs, unreadCount, hasSelectedLogs, allLogsSelected };
  }, [
    dataActions,
    dashboardStates.searchTerm,
    dashboardStates.statusFilter,
    dashboardStates.logLevelFilter,
    dashboardStates.selectedLogs.length,
    mockData.logs,
    mockData.notifications
  ]);

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

  // 메인 렌더링
  return (
    <div className={`${styles.adminContainer} ${dashboardStates.isDarkMode ? styles.dark : styles.light}`}>
      {/* 헤더 */}
      <header className={`border-b ${styleUtilities.getDarkModeClass("border-gray-200 bg-white", "border-gray-700 bg-gray-800")}`}>
        <div className="flex items-center justify-between p-4">
          <h1 className={`text-xl font-bold ${styleUtilities.getDarkModeClass("text-gray-900", "text-white")}`}>Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            {/* 다크모드 토글 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dashboardStates.setIsDarkMode(!dashboardStates.isDarkMode)}
              className={styleUtilities.getDarkModeClass("text-gray-600 hover:bg-gray-100", "text-white hover:bg-gray-700")}
            >
              {dashboardStates.isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {/* 알림 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {computedValues.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {computedValues.unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              {/* 알림 내용 */}
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <h3 className="font-semibold mb-2">알림</h3>
                  {mockData.notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${!notification.read ? "bg-blue-50" : ""}`}
                      onClick={() => notificationHandlers.markAsRead(notification.id)}
                    >
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-600">{notification.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{notification.time}</div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={notificationHandlers.markAllAsRead}
                  >
                    모두 읽음 처리
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* 설정 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              {/* 설정 내용 */}
              <DropdownMenuContent align="end">
                {[
                  { icon: User, text: "프로필 설정", onClick: () => dialogStates.setIsProfileDialogOpen(true) },
                  { icon: Key, text: "비밀번호 변경", onClick: () => dialogStates.setIsPasswordDialogOpen(true) },
                  { icon: Shield, text: "보안 설정", onClick: () => dialogStates.setIsSecurityDialogOpen(true) },
                  { separator: true },
                  { icon: HelpCircle, text: "도움말", onClick: () => dialogStates.setIsHelpDialogOpen(true) },
                  { separator: true },
                  { icon: LogOut, text: "로그아웃", onClick: handleLogout, className: "text-red-600" }
                ].map((item, index) =>
                  item.separator ? (
                    <DropdownMenuSeparator key={index} />
                  ) : (
                    <DropdownMenuItem key={item.text} onClick={item.onClick} className={item.className}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.text}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            {/* 사용자 프로필 드롭다운 */}
            <UserProfileDropdown
              user={{
                username: formData.profileData?.name || 'Admin',
                email: formData.profileData?.email || 'admin@example.com'
              }}
              isDarkMode={dashboardStates.isDarkMode}
              onLogout={handleLogout}
              onChangePassword={() => dialogStates.setIsPasswordDialogOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className={styles.mainContent}>
        <Tabs value={dashboardStates.activeTab} onValueChange={dashboardStates.setActiveTab}>
          <TabsList className={`grid w-full grid-cols-5 ${styleUtilities.getDarkModeClass("", "bg-gray-800")}`}>
            {['dashboard', 'users', 'logs', 'announcements', 'support'].map((tab, index) => (
              <TabsTrigger key={tab} value={tab}>
                {['대시보드', '사용자 관리', '로그 관리', '공지사항', '고객지원'][index]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={styles.tabContainer}>
            <TabsContent value="dashboard">
              <DashboardOverview isDarkMode={dashboardStates.isDarkMode} />
            </TabsContent>

            <TabsContent value="users">
              <UserManagementTab
                searchTerm={dashboardStates.searchTerm}
                setSearchTerm={dashboardStates.setSearchTerm}
                statusFilter={dashboardStates.statusFilter}
                setStatusFilter={dashboardStates.setStatusFilter}
                filteredUsers={computedValues.filteredUsers}
                getBadgeVariant={getBadgeVariant}
                onUserSelect={(user) => {
                  dialogStates.setSelectedUser(user);
                  dialogStates.setIsUserDetailDialogOpen(true);
                }}
                onUserStatusToggle={dataActions.handleUserStatusToggle}
                {...styleUtilities}
              />
            </TabsContent>

            <TabsContent value="logs">
              <LogManagementTab
                logLevelFilter={dashboardStates.logLevelFilter}
                setLogLevelFilter={dashboardStates.setLogLevelFilter}
                filteredLogs={computedValues.filteredLogs}
                selectedLogs={dashboardStates.selectedLogs}
                setSelectedLogs={dashboardStates.setSelectedLogs}
                allLogsSelected={computedValues.allLogsSelected}
                hasSelectedLogs={computedValues.hasSelectedLogs}
                getBadgeVariant={getBadgeVariant}
                onExportLogs={handleExportLogs}
                onArchiveSelected={logHandlers.archiveSelected}
                onDeleteSelected={logHandlers.deleteSelected}
                {...styleUtilities}
              />
            </TabsContent>

            <TabsContent value="announcements">
              <AnnouncementManagementTab
                announcements={mockData.announcements}
                getBadgeVariant={getBadgeVariant}
                onNewAnnouncement={() => dialogStates.setIsAnnouncementDialogOpen(true)}
                onAnnouncementClick={announcementHandlers.click}
                onToggleStatus={announcementHandlers.toggleStatus}
                onDeleteAnnouncement={dataActions.handleDeleteAnnouncement}
                {...styleUtilities}
              />
            </TabsContent>

            <TabsContent value="support">
              <SupportManagement isDarkMode={dashboardStates.isDarkMode} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* 다이얼로그들 */}
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

      <AdminDialogs
        selectedUser={dialogStates.selectedUser}
        isUserDetailDialogOpen={dialogStates.isUserDetailDialogOpen}
        setIsUserDetailDialogOpen={dialogStates.setIsUserDetailDialogOpen}
        isAnnouncementDialogOpen={dialogStates.isAnnouncementDialogOpen}
        setIsAnnouncementDialogOpen={dialogStates.setIsAnnouncementDialogOpen}
        newAnnouncement={formData.newAnnouncement}
        setNewAnnouncement={formData.setNewAnnouncement}
        onCreateAnnouncement={announcementHandlers.create}
        selectedAnnouncement={dialogStates.selectedAnnouncement}
        isAnnouncementDetailOpen={dialogStates.isAnnouncementDetailOpen}
        setIsAnnouncementDetailOpen={dialogStates.setIsAnnouncementDetailOpen}
        getBadgeVariant={getBadgeVariant}
        getDarkModeClass={styleUtilities.getDarkModeClass}
        getDescriptionClass={styleUtilities.getDescriptionClass}
      />
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;