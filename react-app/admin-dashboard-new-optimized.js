"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./styles/admin-dashboard.module.css";

// UI Components (최적화된 imports)
import { 
  Bell, Settings, Search, Users, TrendingUp, FileText, Activity, 
  DollarSign, Eye, Ban, Edit, Trash2, Plus, LogOut, Moon, Sun, 
  Shield, Server, Download, MoreHorizontal, CheckCircle, XCircle, 
  AlertTriangle, MessageSquare, User, Key, HelpCircle, ChevronDown, Archive 
} from "lucide-react";

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

// 커스텀 컴포넌트들
import LoginForm from "./components_admin/login-form";
import DashboardOverview from "./components_admin/dashboard-overview";
import SupportManagement from "./components_admin/support-management";
import ProfileDialogs from "./components_admin/profile-dialogs";

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

  // 커스텀 훅들로 상태 관리 최적화
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

  // 계산된 값들
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

  return (
    <div className={`${styles.adminContainer} ${dashboardStates.isDarkMode ? styles.dark : styles.light}`}>
      {/* 헤더 */}
      <header className={`border-b ${dashboardStates.isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className={`text-xl font-bold ${dashboardStates.isDarkMode ? "text-white" : "text-gray-900"}`}>
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* 다크모드 토글 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dashboardStates.setIsDarkMode(!dashboardStates.isDarkMode)}
              className={dashboardStates.isDarkMode ? "text-white hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}
            >
              {dashboardStates.isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* 알림 */}
            <DropdownMenu open={dialogStates.isNotificationDialogOpen} onOpenChange={dialogStates.setIsNotificationDialogOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <h3 className="font-semibold mb-2">알림</h3>
                  {mockData.notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
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

            {/* 설정 메뉴 */}
            <DropdownMenu open={dialogStates.isSettingsDialogOpen} onOpenChange={dialogStates.setIsSettingsDialogOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => dialogStates.setIsProfileDialogOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  프로필 설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dialogStates.setIsPasswordDialogOpen(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  비밀번호 변경
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dialogStates.setIsSecurityDialogOpen(true)}>
                  <Shield className="mr-2 h-4 w-4" />
                  보안 설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => dialogStates.setIsHelpDialogOpen(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  도움말
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className={styles.mainContent}>
        <Tabs value={dashboardStates.activeTab} onValueChange={dashboardStates.setActiveTab}>
          <TabsList className={`grid w-full grid-cols-5 ${dashboardStates.isDarkMode ? "bg-gray-800" : ""}`}>
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="logs">로그 관리</TabsTrigger>
            <TabsTrigger value="announcements">공지사항</TabsTrigger>
            <TabsTrigger value="support">고객지원</TabsTrigger>
          </TabsList>

          <div className={styles.tabContainer}>
            <TabsContent value="dashboard">
              <DashboardOverview isDarkMode={dashboardStates.isDarkMode} />
            </TabsContent>

            <TabsContent value="users">
              <Card className={dashboardStates.isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <CardTitle className={dashboardStates.isDarkMode ? "text-white" : ""}>사용자 관리</CardTitle>
                  <CardDescription className={dashboardStates.isDarkMode ? "text-gray-400" : ""}>
                    등록된 사용자들을 관리하고 모니터링합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4 mb-4">
                    <Input
                      placeholder="사용자명 또는 이메일 검색..."
                      value={dashboardStates.searchTerm}
                      onChange={(e) => dashboardStates.setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={dashboardStates.statusFilter} onValueChange={dashboardStates.setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="상태 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 상태</SelectItem>
                        <SelectItem value="활성">활성</SelectItem>
                        <SelectItem value="정지">정지</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>사용자명</TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>가입일</TableHead>
                        <TableHead>잔액</TableHead>
                        <TableHead>거래 횟수</TableHead>
                        <TableHead>인증</TableHead>
                        <TableHead>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "활성" ? "default" : "destructive"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.joinDate}</TableCell>
                          <TableCell>{user.balance}</TableCell>
                          <TableCell>{user.trades}</TableCell>
                          <TableCell>
                            {user.verified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  dialogStates.setSelectedUser(user);
                                  dialogStates.setIsUserDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => dataActions.handleUserStatusToggle(user.id)}
                              >
                                {user.status === "활성" ? (
                                  <Ban className="h-4 w-4 text-red-500" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card className={dashboardStates.isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <CardTitle className={dashboardStates.isDarkMode ? "text-white" : ""}>시스템 로그</CardTitle>
                  <CardDescription className={dashboardStates.isDarkMode ? "text-gray-400" : ""}>
                    시스템 활동과 사용자 행동을 모니터링합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Select value={dashboardStates.logLevelFilter} onValueChange={dashboardStates.setLogLevelFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="로그 레벨" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 레벨</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleExportLogs}
                        disabled={dashboardStates.selectedLogs.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        내보내기
                      </Button>
                      <Button
                        variant="outline"
                        onClick={logHandlers.archiveSelected}
                        disabled={dashboardStates.selectedLogs.length === 0}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        아카이브
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={logHandlers.deleteSelected}
                        disabled={dashboardStates.selectedLogs.length === 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={dashboardStates.selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                dashboardStates.setSelectedLogs(filteredLogs.map(log => log.id));
                              } else {
                                dashboardStates.setSelectedLogs([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>시간</TableHead>
                        <TableHead>사용자</TableHead>
                        <TableHead>액션</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>레벨</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Checkbox
                              checked={dashboardStates.selectedLogs.includes(log.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  dashboardStates.setSelectedLogs([...dashboardStates.selectedLogs, log.id]);
                                } else {
                                  dashboardStates.setSelectedLogs(dashboardStates.selectedLogs.filter(id => id !== log.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="font-mono">{log.ip}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === "성공" ? "default" :
                                log.status === "대기" ? "secondary" : "destructive"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {log.level === "error" && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                              {log.level === "warn" && <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />}
                              {log.level === "info" && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                              <span className="text-sm capitalize">{log.level}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements">
              <Card className={dashboardStates.isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
                <CardHeader>
                  <CardTitle className={dashboardStates.isDarkMode ? "text-white" : ""}>공지사항 관리</CardTitle>
                  <CardDescription className={dashboardStates.isDarkMode ? "text-gray-400" : ""}>
                    사용자에게 전달할 공지사항을 작성하고 관리합니다.
                  </CardDescription>
                  <div className="flex justify-end">
                    <Button onClick={() => dialogStates.setIsAnnouncementDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      새 공지사항
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>제목</TableHead>
                        <TableHead>날짜</TableHead>
                        <TableHead>중요도</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>조회수</TableHead>
                        <TableHead>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockData.announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => announcementHandlers.click(announcement)}
                          >
                            {announcement.title}
                          </TableCell>
                          <TableCell>{announcement.date}</TableCell>
                          <TableCell>
                            {announcement.important && (
                              <Badge variant="destructive">중요</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={announcement.status === "active" ? "default" : "secondary"}>
                              {announcement.status === "active" ? "활성" : "만료"}
                            </Badge>
                          </TableCell>
                          <TableCell>{announcement.views}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => announcementHandlers.toggleStatus(announcement.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => dataActions.handleDeleteAnnouncement(announcement.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <SupportManagement isDarkMode={dashboardStates.isDarkMode} />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* 프로필 다이얼로그들 */}
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

      {/* 사용자 상세 다이얼로그 */}
      {dialogStates.selectedUser && (
        <Dialog open={dialogStates.isUserDetailDialogOpen} onOpenChange={dialogStates.setIsUserDetailDialogOpen}>
          <DialogContent className={`max-w-2xl ${dashboardStates.isDarkMode ? "bg-gray-800 text-white" : ""}`}>
            <DialogHeader>
              <DialogTitle>사용자 상세 정보</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>사용자명</Label>
                <p className="font-medium">{dialogStates.selectedUser.username}</p>
              </div>
              <div>
                <Label>이메일</Label>
                <p className="font-medium">{dialogStates.selectedUser.email}</p>
              </div>
              <div>
                <Label>상태</Label>
                <Badge variant={dialogStates.selectedUser.status === "활성" ? "default" : "destructive"}>
                  {dialogStates.selectedUser.status}
                </Badge>
              </div>
              <div>
                <Label>가입일</Label>
                <p className="font-medium">{dialogStates.selectedUser.joinDate}</p>
              </div>
              <div>
                <Label>현재 잔액</Label>
                <p className="font-medium">{dialogStates.selectedUser.balance}</p>
              </div>
              <div>
                <Label>거래 횟수</Label>
                <p className="font-medium">{dialogStates.selectedUser.trades}회</p>
              </div>
              <div>
                <Label>마지막 로그인</Label>
                <p className="font-medium">{dialogStates.selectedUser.lastLogin}</p>
              </div>
              <div>
                <Label>인증 상태</Label>
                <div className="flex items-center">
                  {dialogStates.selectedUser.verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span>{dialogStates.selectedUser.verified ? "인증완료" : "미인증"}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 공지사항 작성 다이얼로그 */}
      <Dialog open={dialogStates.isAnnouncementDialogOpen} onOpenChange={dialogStates.setIsAnnouncementDialogOpen}>
        <DialogContent className={dashboardStates.isDarkMode ? "bg-gray-800 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>새 공지사항 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formData.newAnnouncement.title}
                onChange={(e) => formData.setNewAnnouncement({...formData.newAnnouncement, title: e.target.value})}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.newAnnouncement.content}
                onChange={(e) => formData.setNewAnnouncement({...formData.newAnnouncement, content: e.target.value})}
                placeholder="공지사항 내용을 입력하세요"
                rows={5}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={formData.newAnnouncement.important}
                onCheckedChange={(checked) => formData.setNewAnnouncement({...formData.newAnnouncement, important: checked})}
              />
              <Label htmlFor="important">중요 공지사항</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dialogStates.setIsAnnouncementDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={announcementHandlers.create}>작성완료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지사항 상세 다이얼로그 */}
      {dialogStates.selectedAnnouncement && (
        <Dialog open={dialogStates.isAnnouncementDetailOpen} onOpenChange={dialogStates.setIsAnnouncementDetailOpen}>
          <DialogContent className={`max-w-2xl ${dashboardStates.isDarkMode ? "bg-gray-800 text-white" : ""}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogStates.selectedAnnouncement.title}
                {dialogStates.selectedAnnouncement.important && (
                  <Badge variant="destructive">중요</Badge>
                )}
              </DialogTitle>
              <DialogDescription className={dashboardStates.isDarkMode ? "text-gray-400" : ""}>
                {dialogStates.selectedAnnouncement.date} • 조회수: {dialogStates.selectedAnnouncement.views}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="whitespace-pre-wrap">{dialogStates.selectedAnnouncement.content}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

AdminDashboard.displayName = "AdminDashboard";

export default AdminDashboard;
