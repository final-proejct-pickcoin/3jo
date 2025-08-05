import { useState } from "react";

// 대시보드 상태 관리 훅
export const useAdminDashboardOriginal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [selectedLogs, setSelectedLogs] = useState([]);

  return {
    activeTab,
    setActiveTab,
    isDarkMode,
    setIsDarkMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    logLevelFilter,
    setLogLevelFilter,
    selectedLogs,
    setSelectedLogs
  };
};

// 다이얼로그 상태 관리 훅
export const useDialogStatesOriginal = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isAnnouncementDetailOpen, setIsAnnouncementDetailOpen] = useState(false);

  return {
    selectedUser,
    setSelectedUser,
    isAnnouncementDialogOpen,
    setIsAnnouncementDialogOpen,
    isUserDetailDialogOpen,
    setIsUserDetailDialogOpen,
    isSettingsDialogOpen,
    setIsSettingsDialogOpen,
    isNotificationDialogOpen,
    setIsNotificationDialogOpen,
    isProfileDialogOpen,
    setIsProfileDialogOpen,
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
    isSecurityDialogOpen,
    setIsSecurityDialogOpen,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    selectedAnnouncement,
    setSelectedAnnouncement,
    isAnnouncementDetailOpen,
    setIsAnnouncementDetailOpen
  };
};

// 폼 데이터 관리 훅
export const useFormDataOriginal = () => {
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    important: false
  });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "010-1234-5678",
    role: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  return {
    newAnnouncement,
    setNewAnnouncement,
    profileData,
    setProfileData,
    passwordData,
    setPasswordData
  };
};
