import { useState } from "react";

// 관리자 대시보드 커스텀 훅들
export const useAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [selectedLogs, setSelectedLogs] = useState([]);

  return {
    activeTab, setActiveTab,
    isDarkMode, setIsDarkMode,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    logLevelFilter, setLogLevelFilter,
    selectedLogs, setSelectedLogs
  };
};

// 대화상자 상태 관리 훅
export const useDialogStates = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  // 공지사항 관리용 상태
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isAnnouncementDetailOpen, setIsAnnouncementDetailOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  return {
    selectedUser, setSelectedUser,
    isUserDetailDialogOpen, setIsUserDetailDialogOpen,
    isSettingsDialogOpen, setIsSettingsDialogOpen,
    isNotificationDialogOpen, setIsNotificationDialogOpen,
    isProfileDialogOpen, setIsProfileDialogOpen,
    isPasswordDialogOpen, setIsPasswordDialogOpen,
    isSecurityDialogOpen, setIsSecurityDialogOpen,
    isHelpDialogOpen, setIsHelpDialogOpen,
    isAnnouncementDialogOpen, setIsAnnouncementDialogOpen,
    isAnnouncementDetailOpen, setIsAnnouncementDetailOpen,
    selectedAnnouncement, setSelectedAnnouncement
  };
};

// 폼 데이터 관리 훅
export const useFormData = () => {
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

  // 공지사항 관리용 상태
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    important: false
  });

  return {
    profileData, setProfileData,
    passwordData, setPasswordData,
    newAnnouncement, setNewAnnouncement
  };
};
