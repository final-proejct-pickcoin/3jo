"use client";
import React, { useEffect } from "react";

import { useState } from "react";
import { Bell, Settings, Search, Users, TrendingUp, FileText, Activity, DollarSign, Eye, Ban, Edit, Trash2, Plus, LogOut, Moon, Sun, Shield, Server, Download, MoreHorizontal, CheckCircle, XCircle, AlertTriangle, MessageSquare, User, Key, HelpCircle, ChevronDown, Archive } from "lucide-react";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components_admin/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components_admin/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components_admin/ui/dropdown-menu";
import { Label } from "@/components_admin/ui/label";
import { Textarea } from "@/components_admin/ui/textarea";
import { Switch } from "@/components_admin/ui/switch";
import { Checkbox } from "@/components_admin/ui/checkbox";
import { Separator } from "@/components_admin/ui/separator";
import LoginForm from "./components_admin/login-form";
import DashboardOverview from "./components_admin/dashboard-overview";
import SupportManagement from "./components_admin/support-management";
import ProfileDialogs from "./components_admin/profile-dialogs";
import { useRouter } from "next/navigation";
import axios from "axios";
export default function Component() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [logLevelFilter, setLogLevelFilter] = useState("all");
  const [selectedLogs, setSelectedLogs] = useState([]);
  // 프로필 관련 상태들 추가
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isAnnouncementDetailOpen, setIsAnnouncementDetailOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    important: false
  });

  // 프로필 설정 상태
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "010-1234-5678",
    role: ""
  });

  // 비밀번호 변경 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Mock notifications
  const [notifications, setNotifications] = useState([{
    id: 1,
    title: "새로운 출금 요청",
    message: "user123이 1.5 BTC 출금을 요청했습니다.",
    time: "5분 전",
    read: false
  }, {
    id: 2,
    title: "시스템 알림",
    message: "CPU 사용률이 85%에 도달했습니다.",
    time: "12분 전",
    read: false
  }, {
    id: 3,
    title: "KYC 승인 요청",
    message: "3건의 KYC 승인이 대기 중입니다.",
    time: "1시간 전",
    read: true
  }]);

  // Mock data with more realistic information
  const [users, setUsers] = useState([{
    id: 1,
    username: "user123",
    email: "user123@example.com",
    status: "활성",
    joinDate: "2024-01-10",
    balance: "1.2345 BTC",
    lastLogin: "2024-01-15 14:30",
    trades: 45,
    verified: true
  }, {
    id: 2,
    username: "user456",
    email: "user456@example.com",
    status: "정지",
    joinDate: "2024-01-08",
    balance: "0.8901 BTC",
    lastLogin: "2024-01-14 09:15",
    trades: 23,
    verified: false
  }, {
    id: 3,
    username: "user789",
    email: "user789@example.com",
    status: "활성",
    joinDate: "2024-01-05",
    balance: "2.1234 BTC",
    lastLogin: "2024-01-15 13:45",
    trades: 78,
    verified: true
  }]);
  const [logs, setLogs] = useState([{
    id: 1,
    timestamp: "2024-01-15 14:30:25",
    user: "user123",
    action: "로그인",
    ip: "192.168.1.100",
    status: "성공",
    level: "info"
  }, {
    id: 2,
    timestamp: "2024-01-15 14:28:15",
    user: "user456",
    action: "거래 체결",
    ip: "192.168.1.101",
    status: "성공",
    level: "info"
  }, {
    id: 3,
    timestamp: "2024-01-15 14:25:10",
    user: "user789",
    action: "출금 요청",
    ip: "192.168.1.102",
    status: "대기",
    level: "warn"
  }, {
    id: 4,
    timestamp: "2024-01-15 14:22:05",
    user: "suspicious_user",
    action: "로그인 실패",
    ip: "192.168.1.103",
    status: "실패",
    level: "error"
  }]);
  const [announcements, setAnnouncements] = useState([{
    id: 1,
    title: "시스템 점검 안내",
    content: "2024년 1월 20일 새벽 2시부터 4시까지 시스템 점검이 있습니다.",
    date: "2024-01-15",
    important: true,
    status: "active",
    views: 1234
  }, {
    id: 2,
    title: "새로운 코인 상장",
    content: "ETH/USDT 거래쌍이 새롭게 추가되었습니다.",
    date: "2024-01-14",
    important: false,
    status: "active",
    views: 856
  }, {
    id: 3,
    title: "수수료 정책 변경",
    content: "거래 수수료가 0.1%에서 0.08%로 인하됩니다.",
    date: "2024-01-12",
    important: true,
    status: "expired",
    views: 2341
  }]);

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevelFilter === "all" || log.level === logLevelFilter;
    return matchesLevel;
  });

  // Action handlers
  const handleUserStatusToggle = userId => {
    setUsers(users.map(user => user.id === userId ? {
      ...user,
      status: user.status === "활성" ? "정지" : "활성"
    } : user));
  };
  const handleDeleteAnnouncement = id => {
    setAnnouncements(announcements.filter(ann => ann.id !== id));
  };

  const router = useRouter();
  
  const handleLogout = () => {
    const email = localStorage.getItem("sub");

    // 로그아웃 처리
    axios.post("http://localhost:8000/admin/logout", new URLSearchParams({ email }), {
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(() => {
        // 토큰 삭제
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("role");
        localStorage.removeItem("sub");

        // 상태 초기화
        setIsLoggedIn(false);

        // 로그인 페이지로 리다이렉트
        router.push("/admin");
      }).catch(error => {
        console.error("로그아웃 실패:", error);
      });
      
  };
  const handleExportLogs = () => {
    const selectedLogData = logs.filter(log => selectedLogs.includes(log.id));
    const csvContent = "data:text/csv;charset=utf-8," + "시간,사용자,액션,IP,상태,레벨\n" + selectedLogData.map(log => `${log.timestamp},${log.user},${log.action},${log.ip},${log.status},${log.level}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleMarkNotificationAsRead = id => {
    setNotifications(notifications.map(notif => notif.id === id ? {
      ...notif,
      read: true
    } : notif));
  };
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notif => ({
      ...notif,
      read: true
    })));
  };
  const unreadCount = notifications.filter(n => !n.read).length;
  const handleDeleteSelectedLogs = () => {
    setLogs(logs.filter(log => !selectedLogs.includes(log.id)));
    setSelectedLogs([]);
  };
  const handleArchiveSelectedLogs = () => {
    console.log("Archiving logs:", selectedLogs);
    setSelectedLogs([]);
  };
  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    const announcement = {
      id: announcements.length + 1,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: new Date().toISOString().split("T")[0],
      important: newAnnouncement.important,
      status: "active",
      views: 0
    };
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({
      title: "",
      content: "",
      important: false
    });
    setIsAnnouncementDialogOpen(false);
  };
  const handleAnnouncementClick = announcement => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementDetailOpen(true);
    // 조회수 증가
    setAnnouncements(announcements.map(ann => ann.id === announcement.id ? {
      ...ann,
      views: ann.views + 1
    } : ann));
  };
  const handleAnnouncementStatusToggle = id => {
    setAnnouncements(announcements.map(ann => ann.id === id ? {
      ...ann,
      status: ann.status === "active" ? "expired" : "active"
    } : ann));
  };
  
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if(!token){      
      setIsLoggedIn(false);
    }
    else{
      // profileData
      const email = localStorage.getItem("sub");
      const name = localStorage.getItem("name");
      const role = localStorage.getItem("role");

      // console.log(email, name, role);
      setProfileData({
                      ...profileData,
                      role: role,
                      name: name,
                      email: email
                    }); 

      setIsLoggedIn(true);
    }
  }, [])


  if (isLoggedIn === null) {
    return <div style={{ background: "#fff", width: "100%", height: "100vh" }} />; // 로딩 중
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return /*#__PURE__*/React.createElement("div", {
    className: `min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`
  }, /*#__PURE__*/React.createElement("header", {
    className: `${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-white font-bold text-lg"
  }, "P")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: `text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "PickCoin Admin"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2 mt-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-green-500 rounded-full animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "시스템 정상"))))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-4"
  }, /*#__PURE__*/React.createElement(Dialog, {
    open: isNotificationDialogOpen,
    onOpenChange: setIsNotificationDialogOpen
  }, /*#__PURE__*/React.createElement(DialogTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    className: "relative"
  }, /*#__PURE__*/React.createElement(Bell, {
    className: `h-5 w-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }), unreadCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium"
  }, unreadCount))), /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "알림"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: handleMarkAllNotificationsAsRead,
    className: isDarkMode ? "text-gray-300 hover:text-white" : ""
  }, "모두 읽음"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 max-h-96 overflow-y-auto"
  }, notifications.map(notification => /*#__PURE__*/React.createElement("div", {
    key: notification.id,
    className: `p-3 rounded-lg border cursor-pointer transition-colors ${notification.read ? isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200" : isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"}`,
    onClick: () => handleMarkNotificationAsRead(notification.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, notification.title), /*#__PURE__*/React.createElement("p", {
    className: `text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, notification.message), /*#__PURE__*/React.createElement("p", {
    className: `text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, notification.time)), !notification.read && /*#__PURE__*/React.createElement("div", {
    className: "w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"
  }))))))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: () => setIsDarkMode(!isDarkMode),
    className: isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
  }, isDarkMode ? /*#__PURE__*/React.createElement(Sun, {
    className: "h-5 w-5"
  }) : /*#__PURE__*/React.createElement(Moon, {
    className: "h-5 w-5"
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: isSettingsDialogOpen,
    onOpenChange: setIsSettingsDialogOpen
  }, /*#__PURE__*/React.createElement(DialogTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    className: isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
  }, /*#__PURE__*/React.createElement(Settings, {
    className: "h-5 w-5"
  }))), /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "시스템 설정"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "관리자 시스템 설정을 변경합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-6 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "보안 설정"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "2단계 인증필수"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "모든 관련자 결정에 2FA 적용")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "세션 타임 아웃"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "30분 비활성화 시 자동 로그아웃")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "IP 화이트리스트"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "허용된 IP에서만 접근 가능")), /*#__PURE__*/React.createElement(Switch, null)))), /*#__PURE__*/React.createElement(Separator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "알림 설정"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "이메일 알림"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "중요한 이슈 발생 시 이메일 알림")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "푸시 알림"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "모바일 기기로 푸시 알림 전송")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })))), /*#__PURE__*/React.createElement(Separator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: `font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "시스템 설정"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "자동 백업"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "매일 새벽 2시 자동 백업 실행")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "로그 백업"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "시스템 로그 90일 보관")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  }))))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    onClick: () => setIsSettingsDialogOpen(false)
  }, "설정 저장")))), /*#__PURE__*/React.createElement(DropdownMenu, null, /*#__PURE__*/React.createElement(DropdownMenuTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    className: "flex items-center space-x-3 px-3 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gray-600 font-medium text-sm"
  }, "A")), /*#__PURE__*/React.createElement("div", {
    className: "hidden md:block text-left"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, profileData.name), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, profileData.email)), /*#__PURE__*/React.createElement(ChevronDown, {
    className: `h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }))), /*#__PURE__*/React.createElement(DropdownMenuContent, {
    align: "end",
    className: `w-56 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-3 py-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, profileData.name), /*#__PURE__*/React.createElement("p", {
    className: `text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, profileData.email)), /*#__PURE__*/React.createElement(DropdownMenuSeparator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => setIsProfileDialogOpen(true),
    className: isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(User, {
    className: "h-4 w-4 mr-2"
  }), "프로필 설정"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => setIsPasswordDialogOpen(true),
    className: isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(Key, {
    className: "h-4 w-4 mr-2"
  }), "비밀번호 변경"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => setIsSecurityDialogOpen(true),
    className: isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-4 w-4 mr-2"
  }), "보안 설정"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => setIsHelpDialogOpen(true),
    className: isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(HelpCircle, {
    className: "h-4 w-4 mr-2"
  }), "도움말"), /*#__PURE__*/React.createElement(DropdownMenuSeparator, {
    className: isDarkMode ? "bg-gray-700" : ""
  }), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: handleLogout,
    className: `${isDarkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600"}`
  }, /*#__PURE__*/React.createElement(LogOut, {
    className: "h-4 w-4 mr-2"
  }), "로그아웃")))))), /*#__PURE__*/React.createElement("div", {
    className: "flex"
  }, /*#__PURE__*/React.createElement("aside", {
    className: `w-64 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r min-h-screen`
  }, /*#__PURE__*/React.createElement("nav", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: activeTab,
    onValueChange: setActiveTab,
    orientation: "vertical",
    className: "w-full"
  }, /*#__PURE__*/React.createElement(TabsList, {
    className: "grid w-full grid-cols-1 h-auto bg-transparent"
  }, /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "dashboard",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(TrendingUp, {
    className: "h-4 w-4 mr-3"
  }), "대시보드"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "users",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(Users, {
    className: "h-4 w-4 mr-3"
  }), "사용자 관리"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "support",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(MessageSquare, {
    className: "h-4 w-4 mr-3"
  }), "1:1 문의"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "logs",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(Activity, {
    className: "h-4 w-4 mr-3"
  }), "로그 관리"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "revenue",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(DollarSign, {
    className: "h-4 w-4 mr-3"
  }), "수익 관리"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "announcements",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(FileText, {
    className: "h-4 w-4 mr-3"
  }), "공지사항"), /*#__PURE__*/React.createElement(TabsTrigger, {
    value: "system",
    className: "justify-start w-full mb-2"
  }, /*#__PURE__*/React.createElement(Server, {
    className: "h-4 w-4 mr-3"
  }), "시스템 관리"))))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 p-6"
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: activeTab,
    onValueChange: setActiveTab
  }, /*#__PURE__*/React.createElement(TabsContent, {
    value: "dashboard"
  }, /*#__PURE__*/React.createElement(DashboardOverview, {
    isDarkMode: isDarkMode
  })), /*#__PURE__*/React.createElement(TabsContent, {
    value: "users",
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "사용자 관리"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "등록된 사용자들을 관리하고 설정을 조정합니다."))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "사용자 목록"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "총 ", users.length, "명의 사용자")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4 text-gray-400"
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "사용자 검색...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    className: "w-64"
  })), /*#__PURE__*/React.createElement(Select, {
    value: statusFilter,
    onValueChange: setStatusFilter
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, {
    placeholder: "상태"
  })), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "all"
  }, "전체"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "활성"
  }, "활성"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "정지"
  }, "정지")))))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Table, null, /*#__PURE__*/React.createElement(TableHeader, null, /*#__PURE__*/React.createElement(TableRow, null, /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "사용자명"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "이메일"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "가입일"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "재고"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "거래 횟수"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "신뢰도"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "평판"))), /*#__PURE__*/React.createElement(TableBody, null, filteredUsers.map(user => /*#__PURE__*/React.createElement(TableRow, {
    key: user.id,
    className: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement(TableCell, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, user.username, user.verified && /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-500 ml-2"
  }))), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, user.email), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, user.joinDate), /*#__PURE__*/React.createElement(TableCell, {
    className: `font-mono ${isDarkMode ? "text-gray-300" : ""}`
  }, user.balance), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, user.trades), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Badge, {
    variant: user.status === "활성" ? "default" : "destructive"
  }, user.status)), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    onClick: () => {
      setSelectedUser(user);
      setIsUserDetailDialogOpen(true);
    },
    className: isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""
  }, /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4 mr-1"
  }), "상세"), /*#__PURE__*/React.createElement(Button, {
    variant: user.status === "활성" ? "destructive" : "default",
    size: "sm",
    onClick: () => handleUserStatusToggle(user.id),
    className: "w-20" // 고정 너비 추가
  }, user.status === "활성" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Ban, {
    className: "h-4 w-4 mr-1"
  }), "정지") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 mr-1"
  }), "활성화")))))))))), /*#__PURE__*/React.createElement(Dialog, {
    open: isUserDetailDialogOpen,
    onOpenChange: setIsUserDetailDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "사용자 상세 정보"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, selectedUser?.username, "의 계정 정보")), selectedUser && /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "사용자명"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.username)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "이메일"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.email))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "가입일"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.joinDate)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "마지막 로그인"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.lastLogin))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "재고"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-mono ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.balance)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "거래 횟수"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`
  }, selectedUser.trades, "회"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "계정 상태"), /*#__PURE__*/React.createElement("div", {
    className: "mt-1"
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: selectedUser.status === "활성" ? "default" : "destructive"
  }, selectedUser.status), selectedUser.verified && /*#__PURE__*/React.createElement(Badge, {
    variant: "outline",
    className: "ml-2"
  }, "인증 완료")))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsUserDetailDialogOpen(false)
  }, "닫기"))))), /*#__PURE__*/React.createElement(TabsContent, {
    value: "support"
  }, /*#__PURE__*/React.createElement(SupportManagement, {
    isDarkMode: isDarkMode
  })), /*#__PURE__*/React.createElement(TabsContent, {
    value: "logs",
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "로그 관리"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "시스템 로그를 검색하고 분석합니다")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: handleExportLogs,
    disabled: selectedLogs.length === 0,
    variant: "outline",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Download, {
    className: "h-4 w-4 mr-2"
  }), "내보내기"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleDeleteSelectedLogs,
    disabled: selectedLogs.length === 0,
    variant: "destructive",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Trash2, {
    className: "h-4 w-4 mr-2"
  }), "삭제"), /*#__PURE__*/React.createElement(Button, {
    onClick: handleArchiveSelectedLogs,
    disabled: selectedLogs.length === 0,
    variant: "secondary",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Archive, {
    className: "h-4 w-4 mr-2"
  }), "아카이브"))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "시스템 로그"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "최근 30일 시스템 로그 검색")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Select, {
    value: logLevelFilter,
    onValueChange: setLogLevelFilter
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, {
    placeholder: "레벨"
  })), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "all"
  }, "전체"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "info"
  }, "INFO"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "warn"
  }, "WARN"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "error"
  }, "ERROR"))), /*#__PURE__*/React.createElement(Input, {
    type: "date",
    className: "w-40"
  })))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Table, null, /*#__PURE__*/React.createElement(TableHeader, null, /*#__PURE__*/React.createElement(TableRow, null, /*#__PURE__*/React.createElement(TableHead, {
    className: "w-12"
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: selectedLogs.length === filteredLogs.length,
    onCheckedChange: checked => {
      if (checked) {
        setSelectedLogs(filteredLogs.map(log => log.id));
      } else {
        setSelectedLogs([]);
      }
    }
  })), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "시간"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "레벨"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "사용자"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "행위"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "IP"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "상태"))), /*#__PURE__*/React.createElement(TableBody, null, filteredLogs.map(log => /*#__PURE__*/React.createElement(TableRow, {
    key: log.id,
    className: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Checkbox, {
    checked: selectedLogs.includes(log.id),
    onCheckedChange: checked => {
      if (checked) {
        setSelectedLogs([...selectedLogs, log.id]);
      } else {
        setSelectedLogs(selectedLogs.filter(id => id !== log.id));
      }
    }
  })), /*#__PURE__*/React.createElement(TableCell, {
    className: `font-mono text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, log.timestamp), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Badge, {
    variant: log.level === "error" ? "destructive" : log.level === "warn" ? "secondary" : "default"
  }, log.level.toUpperCase())), /*#__PURE__*/React.createElement(TableCell, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, log.user), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, log.action), /*#__PURE__*/React.createElement(TableCell, {
    className: `font-mono text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, log.ip), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, log.status === "성공" ? /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 text-green-500 mr-1"
  }) : log.status === "실패" ? /*#__PURE__*/React.createElement(XCircle, {
    className: "h-4 w-4 text-red-500 mr-1"
  }) : /*#__PURE__*/React.createElement(AlertTriangle, {
    className: "h-4 w-4 text-yellow-500 mr-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-300" : ""}`
  }, log.status)))))))))), /*#__PURE__*/React.createElement(TabsContent, {
    value: "revenue",
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-6`
  }, "수익 관리"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "수수료 설정"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "거래쌍 수수료 설정")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, [{
    pair: "BTC/USDT",
    volume: "28,450",
    fee: "0.08"
  }, {
    pair: "ETH/USDT",
    volume: "15,230",
    fee: "0.10"
  }, {
    pair: "ADA/USDT",
    volume: "8,920",
    fee: "0.15"
  }].map((item, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: `flex items-center justify-between p-4 border rounded-lg ${isDarkMode ? "border-gray-600" : ""}`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, item.pair), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "24시간 거래량: ", item.volume, " BTC")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Input, {
    className: "w-20",
    defaultValue: item.fee
  }), /*#__PURE__*/React.createElement("span", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, "%"))))), /*#__PURE__*/React.createElement(Button, {
    className: "w-full"
  }, "수수료 적용"))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "수익 현황"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "일시적인 수수료 수익 분석")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-green-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, "$12,450"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "어제 수익"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-green-600 mt-1"
  }, "+15.2% \u2197")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-blue-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, "$89,320"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "이번 주"), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-blue-600 mt-1"
  }, "+8.7% \u2197"))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "거래 수수료"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-green-600"
  }, "$847,230 (67%)")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "최근 수익률"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-blue-600"
  }, "$289,450 (23%)")), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`
  }, "상장 수익률"), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-purple-600"
  }, "$125,600 (10%)"))))))))), /*#__PURE__*/React.createElement(TabsContent, {
    value: "announcements",
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "공지사항 관리"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "사용자 생성안내를 작성하고 관련합니다")), /*#__PURE__*/React.createElement(Dialog, {
    open: isAnnouncementDialogOpen,
    onOpenChange: setIsAnnouncementDialogOpen
  }, /*#__PURE__*/React.createElement(DialogTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, null, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4 mr-2"
  }), "새 공지사항")), /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "새 공지사항 작성"), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "사용자에게 전달할 공지사항을 작성하세요.")), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "title",
    className: isDarkMode ? "text-gray-300" : ""
  }, "제목"), /*#__PURE__*/React.createElement(Input, {
    id: "title",
    placeholder: "공지사항 제목을 입력하세요",
    value: newAnnouncement.title,
    onChange: e => setNewAnnouncement({
      ...newAnnouncement,
      title: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-2"
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "content",
    className: isDarkMode ? "text-gray-300" : ""
  }, "내용"), /*#__PURE__*/React.createElement(Textarea, {
    id: "content",
    placeholder: "공지사항 내용을 입력하세요",
    rows: 4,
    value: newAnnouncement.content,
    onChange: e => setNewAnnouncement({
      ...newAnnouncement,
      content: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Switch, {
    id: "important",
    checked: newAnnouncement.important,
    onCheckedChange: checked => setNewAnnouncement({
      ...newAnnouncement,
      important: checked
    })
  }), /*#__PURE__*/React.createElement(Label, {
    htmlFor: "important",
    className: isDarkMode ? "text-gray-300" : ""
  }, "중요 공지사항"))), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    onClick: handleCreateAnnouncement
  }, "공지사항 생성"))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "공지사항 목록"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "등록된 공지사항 (", announcements.length, "개)")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Table, null, /*#__PURE__*/React.createElement(TableHeader, null, /*#__PURE__*/React.createElement(TableRow, null, /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "제목"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "등록일"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "상태"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "조회수"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "썸네일"))), /*#__PURE__*/React.createElement(TableBody, null, announcements.map(announcement => /*#__PURE__*/React.createElement(TableRow, {
    key: announcement.id,
    className: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `font-medium cursor-pointer hover:text-blue-600 ${isDarkMode ? "text-gray-200 hover:text-blue-400" : ""}`,
    onClick: () => handleAnnouncementClick(announcement)
  }, announcement.title), announcement.important && /*#__PURE__*/React.createElement(Badge, {
    variant: "destructive",
    className: "ml-2 text-xs"
  }, "중요"))), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, announcement.date), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Badge, {
    variant: announcement.status === "active" ? "default" : "secondary"
  }, announcement.status === "active" ? "활성" : "만료")), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, announcement.views.toLocaleString()), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(DropdownMenu, null, /*#__PURE__*/React.createElement(DropdownMenuTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(MoreHorizontal, {
    className: "h-4 w-4"
  }))), /*#__PURE__*/React.createElement(DropdownMenuContent, null, /*#__PURE__*/React.createElement(DropdownMenuItem, null, /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4 mr-2"
  }), "미리보기"), /*#__PURE__*/React.createElement(DropdownMenuItem, null, /*#__PURE__*/React.createElement(Edit, {
    className: "h-4 w-4 mr-2"
  }), "수정"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleDeleteAnnouncement(announcement.id),
    className: "text-red-600"
  }, /*#__PURE__*/React.createElement(Trash2, {
    className: "h-4 w-4 mr-2"
  }), "삭제"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleAnnouncementStatusToggle(announcement.id)
  }, announcement.status === "active" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(XCircle, {
    className: "h-4 w-4 mr-2"
  }), "만료로 변경") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 mr-2"
  }), "활성으로 변경")))))))))))), /*#__PURE__*/React.createElement(TabsContent, {
    value: "system",
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-6`
  }, "시스템 관리"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `flex items-center ${isDarkMode ? "text-white" : ""}`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-5 w-5 mr-2"
  }), "보안 설정"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "시스템 보안 및 접근 제어")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "2단계 인증"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "모든 관련자 권한 부여에 2FA 적용")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "IP 화이트 리스트"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "허용된 IP에서만 접근 가능")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "세션 타임아웃"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "30분 비활성화 시 자동 로그아웃")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: `flex items-center ${isDarkMode ? "text-white" : ""}`
  }, /*#__PURE__*/React.createElement(Server, {
    className: "h-5 w-5 mr-2"
  }), "백업 관리"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "데이터 백업 및 복구설정")), /*#__PURE__*/React.createElement(CardContent, {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "자동 백업"), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "매일 새벽 2시 자동 백업 설정")), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement(Label, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "마지막 백업"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-3 bg-green-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium"
  }, "2024-01-15 02:00"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-600"
  }, "크기: 2.4GB")), /*#__PURE__*/React.createElement(Badge, {
    variant: "default"
  }, "성공"))), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    className: "w-full bg-transparent"
  }, "수동 백업 실행")))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "시스템 상태"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, "현재 시스템 상태 모니터링")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-green-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, "99.9%"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "가동률")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-blue-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, "68%"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "CPU 사용률")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-purple-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-purple-600"
  }, "72%"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "메모리 사용률")), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-4 bg-orange-50 rounded-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl font-bold text-orange-600"
  }, "15ms"), /*#__PURE__*/React.createElement("div", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`
  }, "응답 시간")))))))))), /*#__PURE__*/React.createElement(Dialog, {
    open: isAnnouncementDetailOpen,
    onOpenChange: setIsAnnouncementDetailOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, selectedAnnouncement?.title, selectedAnnouncement?.important && /*#__PURE__*/React.createElement(Badge, {
    variant: "destructive",
    className: "ml-2"
  }, "중요")), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, selectedAnnouncement?.date, " \u2022 조회수 ", selectedAnnouncement?.views, "회")), /*#__PURE__*/React.createElement("div", {
    className: "py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `whitespace-pre-wrap ${isDarkMode ? "text-gray-200" : "text-gray-900"}`
  }, selectedAnnouncement?.content)), /*#__PURE__*/React.createElement(DialogFooter, null, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: () => setIsAnnouncementDetailOpen(false)
  }, "닫기")))), /*#__PURE__*/React.createElement(ProfileDialogs, {
    isDarkMode: isDarkMode,
    isProfileDialogOpen: isProfileDialogOpen,
    setIsProfileDialogOpen: setIsProfileDialogOpen,
    isPasswordDialogOpen: isPasswordDialogOpen,
    setIsPasswordDialogOpen: setIsPasswordDialogOpen,
    isSecurityDialogOpen: isSecurityDialogOpen,
    setIsSecurityDialogOpen: setIsSecurityDialogOpen,
    isHelpDialogOpen: isHelpDialogOpen,
    setIsHelpDialogOpen: setIsHelpDialogOpen
  }));
}