import { useMemo } from "react";

// 공통 Props 생성 헬퍼 함수
const createPropsHook = (propsMapper) => (...args) => {
  const props = propsMapper(...args);
  return useMemo(() => props, Object.values(props));
};

// Props 매핑 함수들
const userManagementPropsMapper = (
  isDarkMode,
  users,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredUsers,
  handleUserStatusToggle,
  setSelectedUser,
  setIsUserDetailDialogOpen
) => ({
  isDarkMode,
  users,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredUsers,
  handleUserStatusToggle,
  setSelectedUser,
  setIsUserDetailDialogOpen
});

const logManagementPropsMapper = (
  isDarkMode,
  logs,
  logLevelFilter,
  setLogLevelFilter,
  filteredLogs,
  selectedLogs,
  setSelectedLogs,
  handleExportLogs,
  handleDeleteSelectedLogs,
  handleArchiveSelectedLogs
) => ({
  isDarkMode,
  logs,
  logLevelFilter,
  setLogLevelFilter,
  filteredLogs,
  selectedLogs,
  setSelectedLogs,
  handleExportLogs,
  handleDeleteSelectedLogs,
  handleArchiveSelectedLogs
});

const announcementManagementPropsMapper = (
  isDarkMode,
  announcements,
  newAnnouncement,
  setNewAnnouncement,
  isAnnouncementDialogOpen,
  setIsAnnouncementDialogOpen,
  isAnnouncementDetailOpen,
  setIsAnnouncementDetailOpen,
  selectedAnnouncement,
  handleCreateAnnouncement,
  handleAnnouncementClick,
  handleAnnouncementStatusToggle,
  handleDeleteAnnouncement
) => ({
  isDarkMode,
  announcements,
  newAnnouncement,
  setNewAnnouncement,
  isAnnouncementDialogOpen,
  setIsAnnouncementDialogOpen,
  isAnnouncementDetailOpen,
  setIsAnnouncementDetailOpen,
  selectedAnnouncement,
  handleCreateAnnouncement,
  handleAnnouncementClick,
  handleAnnouncementStatusToggle,
  handleDeleteAnnouncement
});

const profileDialogsPropsMapper = (
  isProfileDialogOpen,
  setIsProfileDialogOpen,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  isSecurityDialogOpen,
  setIsSecurityDialogOpen,
  isHelpDialogOpen,
  setIsHelpDialogOpen,
  profileData,
  setProfileData,
  passwordData,
  setPasswordData,
  isDarkMode
) => ({
  isProfileDialogOpen,
  setIsProfileDialogOpen,
  isPasswordDialogOpen,
  setIsPasswordDialogOpen,
  isSecurityDialogOpen,
  setIsSecurityDialogOpen,
  isHelpDialogOpen,
  setIsHelpDialogOpen,
  profileData,
  setProfileData,
  passwordData,
  setPasswordData,
  isDarkMode
});

// 최적화된 훅들
export const useUserManagementProps = createPropsHook(userManagementPropsMapper);
export const useLogManagementProps = createPropsHook(logManagementPropsMapper);
export const useAnnouncementManagementProps = createPropsHook(announcementManagementPropsMapper);
export const useProfileDialogsProps = createPropsHook(profileDialogsPropsMapper);
