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
import { jwtDecode } from "jwt-decode";
// import { headers } from "next/headers";

//API
const API_BASE = "http://localhost:8000";
// 공지 전용 Spring API
const BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/$/, "");
const ANN_API_BASE = `${BASE}/admin/announcements`;

const toInt = (v) => {
  if (v === null || v === undefined) return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

const makeClientId = () =>
  `tmp-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))}`;

export default function Component() {
  // const jwt_decode = require("jwt-decode");
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
  // 공지 편집용 상태 추가
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  // 프로필 관련 상태들 추가
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isAnnouncementDetailOpen, setIsAnnouncementDetailOpen] = useState(false);
  const [token, setToken] = useState('')

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  // 한 번에 보여줄 페이지 번호 수 설정
  const maxPageButtons = 5;
  const getPageNumbers = () => {
    let start = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
    let end = start + maxPageButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxPageButtons + 1, 1);
    }
    let pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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
  const [notifications, setNotifications] = useState([
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
  ]);

  // Mock data with more realistic information
  const [users, setUsers] = useState([]);  
  const [logs, setLogs] = useState([
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
  ]);

  const [announcements, setAnnouncements] = useState([]);

  // Filter functions
  const filteredUsers = users.filter((user) => {
    const name = user.name?.toLowerCase() ?? "";
    const email = user.email?.toLowerCase() ?? "";
    const search = searchTerm.toLowerCase();

    const status = user.is_verified === 1 ? "활성" : "정지";

    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesStatus = statusFilter === "all" || String(user.is_verified) === statusFilter;
  return matchesSearch && matchesStatus;
  });
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = logLevelFilter === "all" || log.level === logLevelFilter;
    return matchesLevel;
  });

  // Action handlers
const handleUserStatusToggle = async (userId) => {
  const targetUser = users.find((u) => u.user_id === userId);
  if (!targetUser) return;

  const nextVerified = targetUser.is_verified === 1 ? 0 : 1;

  // 1) 낙관적 업데이트(여기서 nextVerified를 그대로 사용)
  setUsers((prev) =>
    prev.map((u) =>
      u.user_id === userId ? { ...u, is_verified: nextVerified } : u
    )
  );

  try {
    await axios.get("http://localhost:8000/admin/user-status", {
      params: { user_id: userId, is_verified: nextVerified },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (err) {
    // 2) 실패 시 롤백
    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, is_verified: targetUser.is_verified } : u
      )
    );
    console.error("상태 업데이트 실패:", err);
  }
};

// === 공지 목록 불러오기 ===
const fetchAnnouncements = async () => {
  try {    

    const { data } = await axios.get(ANN_API_BASE, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const mapped = (Array.isArray(data) ? data : []).map((it) => {
      const created = it.createdAt || it.created_at || it.date || it.created || null;

      const active =
        typeof it.active === "boolean"
          ? it.active
          : it.status === "active" ||
            it.status === "ACTIVE" ||
            it.is_active === 1 ||
            it.isActive === true;

      const serverId =
        toInt(it.id) ??
        toInt(it.noticeId) ??
        toInt(it.announcementId) ??
        toInt(it.notice_id);

      return {
        // 렌더링용 id (항상 존재)
        id: serverId ?? makeClientId(),
        // 서버 호출용 id (없으면 null)
        serverId,
        title: it.title ?? "(제목 없음)",
        content: it.content ?? "",
        date: created
          ? new Date(created).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        important: Boolean(it.important ?? it.isImportant ?? false),
        status: active ? "active" : "expired",
        views: it.views ?? it.viewCount ?? 0,
      };
    });

    setAnnouncements(mapped);
  } catch (err) {
    console.error("공지 목록 불러오기 실패:", err);
  }
};

// === 공지 생성 ===
const createAnnouncement = async (payload) => {
  try {

    const { data } = await axios.post(
      ANN_API_BASE,
      {
        title: payload.title,
        content: payload.content,
        important: payload.important ?? false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const created = data?.createdAt || data?.created_at || data?.date || new Date();

    const serverId =
      toInt(data?.id) ??
      toInt(data?.noticeId) ??
      toInt(data?.announcementId) ??
      toInt(data?.notice_id);

    const newItem = {
      id: serverId ?? makeClientId(),
      serverId,
      title: data?.title ?? payload.title,
      content: data?.content ?? payload.content,
      date: new Date(created).toISOString().slice(0, 10),
      important: Boolean(data?.important ?? payload.important),
      status:
        typeof data?.active === "boolean"
          ? data.active
            ? "active"
            : "expired"
          : data?.status === "expired"
          ? "expired"
          : (data?.is_active === 0 ? "expired" : "active"),
      views: data?.views ?? 0,
    };

    setAnnouncements((prev) => [newItem, ...prev]);
    setNewAnnouncement({ title: "", content: "", important: false });
    setIsAnnouncementDialogOpen(false);
  } catch (err) {
    console.error("공지 생성 실패:", err);
  }
};

// === 공지 상태/삭제 API (여기에 붙여넣기) ===
const patchAnnouncementStatus = async (serverId, active) => {
  const sid = toInt(serverId);                 // ← 숫자로 캐스팅
  if (sid === null) throw new Error("상태 변경 불가: serverId 없음");

  console.log("[PATCH] /admin/announcements/%s/status?active=%s", sid, active);
  await axios.patch(`${ANN_API_BASE}/${sid}/status`, {}, {
    params: { active },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
});
};

const deleteAnnouncement = async (serverId) => {
  const sid = toInt(serverId);                 // ← 숫자로 캐스팅
  if (sid === null) throw new Error("삭제 불가: serverId 없음");

  console.log("[DELETE] /admin/announcements/%s", sid); // 디버그

  await axios.delete(`${ANN_API_BASE}/${sid}`, {
   headers: token ? { Authorization: `Bearer ${token}` } : undefined,
 });
};


// === 버튼 클릭 시 ===
const handleCreateAnnouncement = () => {
  if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
  createAnnouncement(newAnnouncement);
};

  const handleDeleteAnnouncement = async (serverId) => {
   const backup = announcements;
   const sid = toInt(serverId);
   // serverId가 없는 임시 항목 보호
   if (sid === null) {
     alert("서버에 저장되지 않은 임시 항목이라 삭제할 수 없습니다.");
     return;
   }
   const cur = announcements.find(a => toInt(a.serverId) === sid);
   setAnnouncements(prev => prev.filter(a => toInt(a.serverId) !== sid)); // 낙관적 삭제

  try {
     await deleteAnnouncement(sid); // 이미 숫자로 캐스팅된 sid 사용
    console.log("[DEL] done:", cur?.serverId);
  } catch (e) {
    console.error("공지 삭제 실패:", e?.response?.status, e?.response?.data || e?.message);
    setAnnouncements(backup);     // 실패 시 롤백
    alert(`삭제 실패: ${e?.response?.status || ""} ${e?.response?.data || e?.message}`);
  }
};

// 다이얼로그 열기
const openEditDialog = (ann) => {
  setEditingAnnouncement({
    id: ann.id,
    serverId: toInt(ann.serverId),
    title: ann.title ?? "",
    content: ann.content ?? "",
    important: !!ann.important,
  });
  setIsEditDialogOpen(true);
};

// 공지 수정 API
const updateAnnouncement = async (serverId, payload) => {
  
  const { data } = await axios.put(`${ANN_API_BASE}/${serverId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return data;
};

// 저장 핸들러
const handleSaveEdit = async () => {
  if (!editingAnnouncement) return;
  const sid = toInt(editingAnnouncement.serverId);
  if (sid === null) {
    alert("서버에 저장되지 않은 임시 항목은 수정할 수 없습니다.");
    return;
  }

  const { id, title, content, important } = editingAnnouncement;
  const backup = announcements;

  // 낙관적 업데이트
  setAnnouncements(prev =>
    prev.map(a => String(a.id) === String(id) ? { ...a, title, content, important } : a)
  );

  try {
    const data = await updateAnnouncement(sid, { title, content, important });

    const created =
      data?.createdAt || data?.created_at || data?.date || null;
    const active =
      typeof data?.active === "boolean"
        ? data.active
        : data?.status === "active" || data?.is_active === 1 || data?.isActive === true;

    const newServerId =
      toInt(data?.id) ??
      toInt(data?.noticeId) ??
      toInt(data?.announcementId) ??
      toInt(data?.notice_id) ?? sid;

    setAnnouncements(prev =>
      prev.map(a =>
        String(a.id) === String(id)
          ? {
              ...a,
              serverId: newServerId,
              title: data?.title ?? title,
              content: data?.content ?? content,
              important: Boolean(data?.important ?? important),
              date: created ? new Date(created).toISOString().slice(0, 10) : a.date,
              status: active ? "active" : (data?.status === "expired" ? "expired" : a.status),
              views: toInt(data?.views) ?? a.views ?? 0,
            }
          : a
      )
    );

    setIsEditDialogOpen(false);
    setEditingAnnouncement(null);
  } catch (e) {
    console.error("공지 수정 실패:", e?.response?.status, e?.response?.data || e?.message);
    setAnnouncements(backup);
    alert(`수정 실패: ${e?.response?.status || ""} ${e?.response?.data || e?.message}`);
  }
};

const router = useRouter();

const handleLogout = () => {
  const email = localStorage.getItem("sub");
  // 로그아웃 처리
  axios
    .post(
      "http://localhost:8000/admin/logout",
      new URLSearchParams({ email }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    )
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
    })
    .catch((error) => {
      console.error("로그아웃 실패:", error);
    });
};
  const handleExportLogs = () => {
    const selectedLogData = logs.filter((log) => selectedLogs.includes(log.id));
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "시간,사용자,액션,IP,상태,레벨\n" +
      selectedLogData
        .map(
          (log) =>
            `${log.timestamp},${log.user},${log.action},${log.ip},${log.status},${log.level}`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleMarkNotificationAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id
          ? {
              ...notif,
              read: true
            }
          : notif
      )
    );
  };
  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({
        ...notif,
        read: true
      }))
    );
  };
  const unreadCount = notifications.filter((n) => !n.read).length;
  const handleDeleteSelectedLogs = () => {
    setLogs(logs.filter((log) => !selectedLogs.includes(log.id)));
    setSelectedLogs([]);
  };
  const handleArchiveSelectedLogs = () => {
    console.log("Archiving logs:", selectedLogs);
    setSelectedLogs([]);
  };
 
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementDetailOpen(true);
    // 조회수 증가
    setAnnouncements((prev) =>
   prev.map((ann) =>
     ann.id === announcement.id ? { ...ann, views: ann.views + 1 } : ann
   )
 );
};

  const handleAnnouncementStatusToggle = async (id) => {
   const cur = announcements.find(a => String(a.id) === String(id));
    if (!cur) return;
    const nextActive = cur.status !== "active";

    setAnnouncements(prev =>
      prev.map(a =>
        String(a.id) === String(id)
          ? { ...a, status: nextActive ? "active" : "expired" }
               : a
              )
             );
    try {
     // [추가] 서버 PATCH 호출 (흐릿함 사라짐)
     await patchAnnouncementStatus(cur.serverId, nextActive);
   } catch (e) {
     // [추가] 실패 시 원래 상태로 롤백
     setAnnouncements(prev =>
       prev.map(a =>
         String(a.id) === String(id) ? { ...a, status: cur.status } : a
       )
     );
     console.error("상태 변경 실패:", e);
   }
 };          

  const isTokenExpired = (token) => {
    if(!token) return true
    try {
      const {exp} = jwtDecode(token);
      if (!exp) return true;
      return (Date.now() >= exp*1000);
    }catch(e){
      console.log("JWT decode error", e)
      return true; // 실패시 만료로 간주
    }
  }

  const getUserPerPage = async (requestPage, itemsPerPage) => {

    setCurrentPage(requestPage)

    await axios.get("http://localhost:8000/admin/getuser", {
      params:{
        page: requestPage,
        limit: itemsPerPage
      }
    })
      .then((result)=>{
        console.log("프론트 유저정보", result.data.users)
        setUsers(result.data.users)
        setTotal(result.data.total);
      })
      .catch((err)=> console.log(err))
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    setToken(token);

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("sub");
      localStorage.removeItem("name");
      localStorage.removeItem("role");      
      setIsLoggedIn(false);
    } else {


      // profileData
      const email = localStorage.getItem("sub");
      const name = localStorage.getItem("name");
      const role = localStorage.getItem("role");

      setProfileData((prev) => ({ ...prev, role, name, email }));
      // , {headers:{Authorization:`Bearer ${token}`}} <- get()에 두번째 인자로.
      
      getUserPerPage(currentPage, itemsPerPage);

      setIsLoggedIn(true);      
      fetchAnnouncements();
    }
  }, [token]);

  if (isLoggedIn === null) {
    return <div style={{ background: "#fff", width: "100%", height: "100vh" }} />; // 로딩 중
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <header className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  PickCoin 관리자
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>시스템 정상</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className={`h-5 w-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-medium">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className={isDarkMode ? "text-white" : ""}>알림</DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllNotificationsAsRead}
                      className={isDarkMode ? "text-gray-300 hover:text-white" : ""}
                    >
                      모두 읽음
                    </Button>
                  </div>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        notification.read
                          ? isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                          : isDarkMode
                          ? "bg-blue-900/20 border-blue-700"
                          : "bg-blue-50 border-blue-200"
                      }`}
                      onClick={() => handleMarkNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {notification.title}
                          </h4>
                          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className={`sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                <DialogHeader>
                  <DialogTitle className={isDarkMode ? "text-white" : ""}>시스템 설정</DialogTitle>
                  <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
                    관리자 시스템 설정을 변경합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>보안 설정</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>2단계 인증필수</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            모든 관련자 결정에 2FA 적용
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>세션 타임 아웃</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            30분 비활성화 시 자동 로그아웃
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>IP 화이트리스트</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            허용된 IP에서만 접근 가능
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  <Separator className={isDarkMode ? "bg-gray-700" : ""} />
                  <div className="space-y-4">
                    <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>알림 설정</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>이메일 알림</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            중요한 이슈 발생 시 이메일 알림
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>푸시 알림</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            모바일 기기로 푸시 알림 전송
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                  <Separator className={isDarkMode ? "bg-gray-700" : ""} />
                  <div className="space-y-4">
                    <h4 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>시스템 설정</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>자동 백업</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            매일 새벽 2시 자동 백업 실행
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>로그 백업</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            시스템 로그 90일 보관
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsSettingsDialogOpen(false)}>설정 저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">A</span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {profileData.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{profileData.email}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-56 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                <div className="px-3 py-2">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{profileData.name}</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {profileData.email}
                  </p>
                </div>
                <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700" : ""} />
                <DropdownMenuItem
                  onClick={() => setIsProfileDialogOpen(true)}
                  className={isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""}
                >
                  <User className="h-4 w-4 mr-2" />
                  프로필 설정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className={isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""}
                >
                  <Key className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsSecurityDialogOpen(true)}
                  className={isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  보안 설정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsHelpDialogOpen(true)}
                  className={isDarkMode ? "text-gray-200 hover:bg-gray-700" : ""}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  도움말
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700" : ""} />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className={`${isDarkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600"}`}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className={`w-64 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-r min-h-screen`}>
          <nav className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="grid w-full grid-cols-1 h-auto bg-transparent">
                <TabsTrigger value="dashboard" className="justify-start w-full mb-2">
                  <TrendingUp className="h-4 w-4 mr-3" />
                  대시보드
                </TabsTrigger>
                <TabsTrigger value="users" className="justify-start w-full mb-2">
                  <Users className="h-4 w-4 mr-3" />
                  사용자 관리
                </TabsTrigger>
                <TabsTrigger value="support" className="justify-start w-full mb-2">
                  <MessageSquare className="h-4 w-4 mr-3" />
                  1:1 문의
                </TabsTrigger>
                <TabsTrigger value="logs" className="justify-start w-full mb-2">
                  <Activity className="h-4 w-4 mr-3" />
                  로그 관리
                </TabsTrigger>
                <TabsTrigger value="revenue" className="justify-start w-full mb-2">
                  <DollarSign className="h-4 w-4 mr-3" />
                  수익 관리
                </TabsTrigger>
                <TabsTrigger value="announcements" className="justify-start w-full mb-2">
                  <FileText className="h-4 w-4 mr-3" />
                  공지사항
                </TabsTrigger>
                <TabsTrigger value="system" className="justify-start w-full mb-2">
                  <Server className="h-4 w-4 mr-3" />
                  시스템 관리
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard">
              <DashboardOverview isDarkMode={isDarkMode} />
            </TabsContent>
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>사용자 관리</h1>
                  <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                    등록된 사용자들을 관리하고 설정을 조정합니다.
                  </p>
                </div>
              </div>
              <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDarkMode ? "text-white" : ""}>사용자 목록</CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
                        총 {users.length}명의 사용자
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="사용자 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                          autoComplete="off"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="상태" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="1">활성</SelectItem>
                          <SelectItem value="0">정지</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>사용자명</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>이메일</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>가입일</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>신고</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>권한</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>계정상태</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>상세</TableHead>                        
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                          <TableCell className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>
                            <div className="flex items-center">
                              {user.name}
                              {user.verified && <CheckCircle className="h-4 w-4 text-green-500 ml-2" />}
                            </div>
                          </TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{user.email}</TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{user.created_at?user.created_at.slice(0,10):'정보 없음'}</TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{user.reported_count}</TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{user.role}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_verified === 1 ? "default" : "destructive"}>{user.is_verified === 1? "활성": "정지"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsUserDetailDialogOpen(true);
                                }}
                                className={isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                상세
                              </Button>
                              <Button
                                variant={user.is_verified === 1 ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleUserStatusToggle(user.user_id)}
                                className="w-20" 
                              >
                                {/* 고정 너비 추가 */}
                                {user.is_verified === 1 ? (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    정지
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    활성화
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* 페이지네이션 UI 입력 */}
                  <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button onClick={() => getUserPerPage(1)} disabled={currentPage === 1}>
                      맨 처음
                    </button>
                    <button onClick={() => getUserPerPage(currentPage - 1)} disabled={currentPage === 1}>
                      이전
                    </button>

                    {getPageNumbers().map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => getUserPerPage(pageNum)}
                        style={{
                          fontWeight: pageNum === currentPage ? 'bold' : 'normal',
                          textDecoration: pageNum === currentPage ? 'underline' : 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: pageNum === currentPage ? '2px solid #2563eb' : '1px solid #ccc',
                          backgroundColor: pageNum === currentPage ? '#bfdbfe' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button onClick={() => getUserPerPage(currentPage + 1)} disabled={currentPage === total}>
                      다음
                    </button>
                    <button onClick={() => getUserPerPage(total)} disabled={currentPage === total}>
                      맨 끝
                    </button>
                  </div>     
                </CardContent>
              </Card>

              <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
                <DialogContent className={`sm:max-w-[425px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                  <DialogHeader>
                    <DialogTitle className={isDarkMode ? "text-white" : ""}>사용자 상세 정보</DialogTitle>
                    <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
                      {selectedUser?.name}의 계정 정보
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>사용자명</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.name}
                          </p>
                        </div>
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>이메일</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.email} 
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>가입일</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.created_at ? selectedUser.created_at.slice(0,10):'정보 없음'}
                          </p>
                        </div>
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>마지막 로그인</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.last_login_at}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>신고 횟수</Label>
                          <p className={`text-sm font-mono ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.reported_count}
                          </p>
                        </div>
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>거래 횟수</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.tx_count}회
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>권한</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.role}
                          </p>
                        </div>
                        <div>
                          <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>총 입금액</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-600"}`}>
                            {selectedUser.balance}원
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>계정 상태</Label>
                        <div className="mt-1">
                          <Badge variant={selectedUser.is_verified === 1 ? "default" : "destructive"}>
                            {selectedUser.is_verified == 1 ? "활성화" : "정지"}
                          </Badge>
                          
                          {selectedUser.is_verified && <Badge variant="outline" className="ml-2">인증 완료</Badge>}
                        </div>                        
                      </div>
                      
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUserDetailDialogOpen(false)}>
                          닫기
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="support">
              <SupportManagement isDarkMode={isDarkMode} />
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>로그 관리</h1>
                  <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>시스템 로그를 검색하고 분석합니다</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleExportLogs}
                    disabled={selectedLogs.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    내보내기
                  </Button>
                  <Button
                    onClick={handleDeleteSelectedLogs}
                    disabled={selectedLogs.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                  <Button
                    onClick={handleArchiveSelectedLogs}
                    disabled={selectedLogs.length === 0}
                    variant="secondary"
                    size="sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    아카이브
                  </Button>
                </div>
              </div>
              <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={isDarkMode ? "text-white" : ""}>시스템 로그</CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>최근 30일 시스템 로그 검색</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="레벨" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="info">INFO</SelectItem>
                          <SelectItem value="warn">WARN</SelectItem>
                          <SelectItem value="error">ERROR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" className="w-40" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedLogs.length === filteredLogs.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLogs(filteredLogs.map((log) => log.id));
                              } else {
                                setSelectedLogs([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>시간</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>레벨</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>사용자</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>행위</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>IP</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLogs.includes(log.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLogs([...selectedLogs, log.id]);
                                } else {
                                  setSelectedLogs(selectedLogs.filter((id) => id !== log.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className={`font-mono text-sm ${isDarkMode ? "text-gray-300" : ""}`}>
                            {log.timestamp}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.level === "error"
                                  ? "destructive"
                                  : log.level === "warn"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {log.level.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>{log.user}</TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{log.action}</TableCell>
                          <TableCell className={`font-mono text-sm ${isDarkMode ? "text-gray-300" : ""}`}>{log.ip}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {log.status === "성공" ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : log.status === "실패" ? (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                              )}
                              <span className={`text-sm ${isDarkMode ? "text-gray-300" : ""}`}>{log.status}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-6`}>수익 관리</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <CardHeader>
                      <CardTitle className={isDarkMode ? "text-white" : ""}>수수료 설정</CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>거래쌍 수수료 설정</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        {[
                          { pair: "BTC/USDT", volume: "28,450", fee: "0.08" },
                          { pair: "ETH/USDT", volume: "15,230", fee: "0.10" },
                          { pair: "ADA/USDT", volume: "8,920", fee: "0.15" }
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-4 border rounded-lg ${
                              isDarkMode ? "border-gray-600" : ""
                            }`}
                          >
                            <div>
                              <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>{item.pair}</Label>
                              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                24시간 거래량: {item.volume} BTC
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input className="w-20" defaultValue={item.fee} />
                              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full">수수료 적용</Button>
                    </CardContent>
                  </Card>
                  <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <CardHeader>
                      <CardTitle className={isDarkMode ? "text-white" : ""}>수익 현황</CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>일시적인 수수료 수익 분석</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">$12,450</div>
                            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>어제 수익</div>
                            <div className="text-xs text-green-600 mt-1">+15.2% &#8599;</div>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">$89,320</div>
                            <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>이번 주</div>
                            <div className="text-xs text-blue-600 mt-1">+8.7% &#8599;</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            {/* 계속 이어서 수익 관리 부분 */}
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>
                                거래 수수료
                              </span>
                              <span className="font-bold text-green-600">$847,230 (67%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>
                                최근 수익률
                              </span>
                              <span className="font-bold text-blue-600">$289,450 (23%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : ""}`}>
                                상장 수익률
                              </span>
                              <span className="font-bold text-purple-600">$125,600 (10%)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-6">

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className={`sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                  <DialogHeader>
                    <DialogTitle className={isDarkMode ? "text-white" : ""}>공지 수정</DialogTitle>
                    <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
                      선택한 공지사항을 수정합니다.
                    </DialogDescription>
                  </DialogHeader>

                  {editingAnnouncement && (
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label className={isDarkMode ? "text-gray-300" : ""}>제목</Label>
                        <Input
                          value={editingAnnouncement.title}
                          onChange={(e) =>
                            setEditingAnnouncement(prev => ({ ...prev, title: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className={isDarkMode ? "text-gray-300" : ""}>내용</Label>
                        <Textarea
                          rows={4}
                          value={editingAnnouncement.content}
                          onChange={(e) =>
                            setEditingAnnouncement(prev => ({ ...prev, content: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-important"
                          checked={!!editingAnnouncement.important}
                          onCheckedChange={(checked) =>
                            setEditingAnnouncement(prev => ({ ...prev, important: checked }))
                          }
                        />
                        <Label htmlFor="edit-important" className={isDarkMode ? "text-gray-300" : ""}>
                          중요 공지사항
                        </Label>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>취소</Button>
                    <Button onClick={handleSaveEdit}>저장</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
               {/*미리보기 모달*/}
               <Dialog open={isAnnouncementDetailOpen} onOpenChange={setIsAnnouncementDetailOpen}>
                <DialogContent className={`sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle className={isDarkMode ? "text-white" : ""}>
                        {selectedAnnouncement?.title || "공지 미리보기"}
                      </DialogTitle>
                      {selectedAnnouncement?.important && <Badge variant="destructive">중요</Badge>}
                    </div>
                    <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
                      등록일 {selectedAnnouncement?.date} ·{" "}
                      상태 {selectedAnnouncement?.status === "active" ? "활성" : "만료"} ·{" "}
                      조회수 {selectedAnnouncement?.views?.toLocaleString?.()}
                    </DialogDescription>
                  </DialogHeader>

                  <div className={`mt-4 rounded-md border p-4 max-h-[60vh] overflow-y-auto ${
                    isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 text-gray-800"
                  }`}>
                    <pre className="whitespace-pre-wrap break-words">
                      {selectedAnnouncement?.content}
                    </pre>
                  </div>

                  <DialogFooter>
                    <Button onClick={() => setIsAnnouncementDetailOpen(false)}>닫기</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    공지사항 관리
                  </h1>
                  <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                    사용자에게 전달할 안내사항을 작성하고 관리합니다.
                  </p>
                </div>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> 새 공지사항
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`sm:max-w-[525px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                    <DialogHeader>
                      <DialogTitle className={isDarkMode ? "text-white" : ""}>새 공지사항 작성</DialogTitle>
                      <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
                        사용자에게 전달할 공지사항을 작성하세요.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title" className={isDarkMode ? "text-gray-300" : ""}>
                          제목
                        </Label>
                        <Input
                          id="title"
                          placeholder="공지사항 제목을 입력하세요"
                          value={newAnnouncement.title}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="content" className={isDarkMode ? "text-gray-300" : ""}>
                          내용
                        </Label>
                        <Textarea
                          id="content"
                          placeholder="공지사항 내용을 입력하세요"
                          rows={4}
                          value={newAnnouncement.content}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="important"
                          checked={newAnnouncement.important}
                          onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, important: checked })}
                        />
                        <Label htmlFor="important" className={isDarkMode ? "text-gray-300" : ""}>
                          중요 공지사항
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" onClick={handleCreateAnnouncement}>
                        공지사항 생성
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? "text-white" : ""}>공지사항 목록</CardTitle>
                  <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
                    등록된 공지사항 ({announcements.length}개)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>제목</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>등록일</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>조회수</TableHead>
                        <TableHead className={isDarkMode ? "text-gray-300" : ""}>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow
                          key={announcement.id}
                          className={isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                        >
                          <TableCell>
                            <div className="flex items-center">
                              <span
                                className={`font-medium cursor-pointer hover:text-blue-600 ${
                                  isDarkMode ? "text-gray-200 hover:text-blue-400" : ""
                                }`}
                                onClick={() => handleAnnouncementClick(announcement)}
                              >
                                {announcement.title}
                              </span>
                              {announcement.important && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  중요
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>{announcement.date}</TableCell>
                          <TableCell>
                            <Badge variant={announcement.status === "active" ? "default" : "secondary"}>
                              {announcement.status === "active" ? "활성" : "만료"}
                            </Badge>
                          </TableCell>
                          <TableCell className={isDarkMode ? "text-gray-300" : ""}>
                            {announcement.views.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleAnnouncementClick(announcement)}>
                                  <Eye className="h-4 w-4 mr-2" /> 미리보기
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(announcement)}
                                  >
                                  <Edit className="h-4 w-4 mr-2" /> 수정
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAnnouncement(announcement.serverId)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> 삭제
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAnnouncementStatusToggle(announcement.id)}>
                                  {announcement.status === "active" ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" /> 만료로 변경
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" /> 활성으로 변경
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} mb-6`}>
                  시스템 관리
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <CardHeader>
                      <CardTitle className={`flex items-center ${isDarkMode ? "text-white" : ""}`}>
                        <Shield className="h-5 w-5 mr-2" /> 보안 설정
                      </CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
                        시스템 보안 및 접근 제어 설정
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>2단계 인증</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            모든 관련자 권한 부여에 2FA 적용
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>IP 화이트 리스트</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            허용된 IP에서만 접근 가능
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>세션 타임아웃</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            30분 비활성화 시 자동 로그아웃
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <CardHeader>
                      <CardTitle className={`flex items-center ${isDarkMode ? "text-white" : ""}`}>
                        <Server className="h-5 w-5 mr-2" /> 백업 관리
                      </CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
                        데이터 백업 및 복구 설정
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>자동 백업</Label>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            매일 새벽 2시 자동 백업 설정
                          </p>
                        </div>
                        <Switch defaultChecked={true} />
                      </div>
                      <div className="space-y-2">
                        <Label className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>마지막 백업</Label>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium">2024-01-15 02:00</p>
                            <p className="text-xs text-gray-600">크기: 2.4GB</p>
                          </div>
                          <Badge variant="default">성공</Badge>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full bg-transparent">
                        수동 백업 실행
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                    <CardHeader>
                      <CardTitle className={isDarkMode ? "text-white" : ""}>시스템 상태</CardTitle>
                      <CardDescription className={isDarkMode ? "text-gray-400" : ""}>
                        현재 시스템 상태 모니터링
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">99.9%</div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>가동률</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">68%</div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>CPU 사용률</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">72%</div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>메모리 사용률</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">15ms</div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>응답 시간</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* 프로필, 보안, 비밀번호 관련 다이얼로그 */}
      <ProfileDialogs
        isDarkMode={isDarkMode}
        isProfileDialogOpen={isProfileDialogOpen}
        setIsProfileDialogOpen={setIsProfileDialogOpen}
        isPasswordDialogOpen={isPasswordDialogOpen}
        setIsPasswordDialogOpen={setIsPasswordDialogOpen}
        isSecurityDialogOpen={isSecurityDialogOpen}
        setIsSecurityDialogOpen={setIsSecurityDialogOpen}
        isHelpDialogOpen={isHelpDialogOpen}
        setIsHelpDialogOpen={setIsHelpDialogOpen}
      />
    </div>
  );
}
