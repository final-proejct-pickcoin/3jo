"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { forwardRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components_admin/ui/tabs";
import { Switch } from "@/components_admin/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components_admin/ui/avatar";
import { Eye, UserCheck, Activity, Shield, Clock, MoreHorizontal, RefreshCw, Download, Plus, User, KeyRound, HelpCircle, LogOut, CheckCircle, DollarSign, Search } from "lucide-react";
import { getCardClass, getTitleClass, getSubtitleClass } from "@/components_admin/utils/theme-utils";

const mockUsers = [
  { id: 1, username: "user123", email: "user123@example.com", status: "활성", level: "Level 2", joinDate: "2024-01-10", lastLogin: "2024-01-15", balance: "1.2345 BTC", balanceKRW: "₩45,000,000", totalTrades: 45, verified: true, kycStatus: "승인", riskLevel: "낮음", country: "KR", phone: "+82-10-1234-5678", avatar: null },
  { id: 2, username: "user456", email: "user456@example.com", status: "정지", level: "Level 1", joinDate: "2024-01-08", lastLogin: "2024-01-12", balance: "0.8901 BTC", balanceKRW: "₩23,000,000", totalTrades: 23, verified: false, kycStatus: "대기", riskLevel: "보통", country: "KR", phone: "+82-10-5678-9012", avatar: null },
  { id: 3, username: "user789", email: "user789@example.com", status: "활성", level: "Level 3", joinDate: "2024-01-05", lastLogin: "2024-01-14", balance: "2.1234 BTC", balanceKRW: "₩78,000,000", totalTrades: 78, verified: true, kycStatus: "승인", riskLevel: "낮음", country: "KR", phone: "+82-10-9012-3456", avatar: null }
];
const statusColors = { "활성": "bg-green-100 text-green-800 border-green-200", "정지": "bg-red-100 text-red-800 border-red-200", default: "bg-gray-100 text-gray-800 border-gray-200" };
const kycColors = { "승인": "bg-green-100 text-green-800", "대기": "bg-yellow-100 text-yellow-800", "거부": "bg-red-100 text-red-800", default: "bg-gray-100 text-gray-800" };
const riskColors = { "낮음": "text-green-600", "보통": "text-yellow-600", "높음": "text-red-600", default: "text-gray-600" };

function UserManagementEnhanced({ isDarkMode = false }) {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [levelFilter, setLevelFilter] = useState("전체");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const filteredUsers = users.filter(u => (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === "전체" || u.status === statusFilter) && (levelFilter === "전체" || u.level === levelFilter));
  const stats = { total: users.length, active: users.filter(u => u.status === "활성").length, verified: users.filter(u => u.verified).length, pendingKyc: users.filter(u => u.kycStatus === "대기").length };
  const handleStatusToggle = id => setUsers(users => users.map(u => u.id === id ? { ...u, status: u.status === "활성" ? "정지" : "활성" } : u));
  const handleViewUser = user => { setSelectedUser(user); setIsUserDetailOpen(true); };
  const handleRefresh = async () => { setIsLoading(true); await new Promise(r => setTimeout(r, 1000)); setIsLoading(false); };
  const getStatusColor = s => statusColors[s] || statusColors.default;
  const getKycStatusColor = s => kycColors[s] || kycColors.default;
  const getRiskLevelColor = l => riskColors[l] || riskColors.default;

  return (
    <div className={`space-y-6 ${isDarkMode ? 'dark' : ''}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>사용자 관리</h1>
            <p className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>등록된 사용자들을 관리하고 계정 상태를 조정합니다</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="sm"><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />새로고침</Button>
            <Button variant="default" size="sm"><Download className="h-4 w-4 mr-2" />내보내기</Button>
            <Button variant="default" size="sm"><Plus className="h-4 w-4 mr-2" />사용자 추가</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "총 사용자", value: `${stats.total}명`, icon: <UserCheck className="h-8 w-8 text-blue-500" /> },
            { label: "활성 사용자", value: `${stats.active}명`, icon: <Activity className="h-8 w-8 text-green-500" /> },
            { label: "인증 완료", value: `${stats.verified}명`, icon: <Shield className="h-8 w-8 text-purple-500" /> },
            { label: "KYC 대기", value: `${stats.pendingKyc}건`, icon: <Clock className="h-8 w-8 text-orange-500" /> }
          ].map((c, i) => (
            <Card key={i} className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{c.label}</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{c.value}</p>
                </div>
                {c.icon}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card className={`mt-6 ${getCardClass(isDarkMode)}`}>
        <CardHeader>
          <CardTitle className={getTitleClass(isDarkMode)}>사용자 목록</CardTitle>
          <CardDescription className={getSubtitleClass(isDarkMode)}>총 {filteredUsers.length}명의 사용자를 관리하고 계정 상태를 조정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input placeholder="사용자명 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"><Search className="h-4 w-4" /></span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="상태" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="활성">활성</SelectItem>
                <SelectItem value="정지">정지</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="레벨" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="전체">전체</SelectItem>
                <SelectItem value="Level 1">Level 1</SelectItem>
                <SelectItem value="Level 2">Level 2</SelectItem>
                <SelectItem value="Level 3">Level 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className={isDarkMode ? "border-gray-700 bg-gray-750" : "bg-gray-50"}>
                  {["사용자명", "이메일", "가입일", "잔고", "거래 횟수", "상태", "액션"].map((h, i) => <TableHead key={i} className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id} className={isDarkMode ? "border-gray-700 hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{user.username}</span>
                            {user.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <div className="text-sm text-gray-500">{user.level}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{user.email}</TableCell>
                    <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{user.joinDate}</TableCell>
                    <TableCell>
                      <div>
                        <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{user.balance}</div>
                        <div className="text-sm text-gray-500">{user.balanceKRW}</div>
                      </div>
                    </TableCell>
                    <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{user.totalTrades}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(user.status)}>{user.status}</Badge></TableCell>
                    <TableCell>
                      <div className="relative user-action-menu" ref={menuRef}>
                        <Button variant="ghost" size="sm" aria-label="액션 메뉴" onClick={e => { e.stopPropagation(); setOpenMenuId(user.id); }}><MoreHorizontal className="h-4 w-4" /></Button>
                        {openMenuId === user.id && (
                          <div className={`absolute right-0 z-20 mt-2 w-32 border rounded shadow-lg py-1 text-sm user-action-menu ${isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`} style={{minWidth:'120px'}}>
                            {[{ label: "상세 보기", onClick: () => { handleViewUser(user); setOpenMenuId(null); } }, { label: "수정", onClick: () => { alert('수정 기능은 추후 구현'); setOpenMenuId(null); } }, { label: user.status === "활성" ? "정지" : "활성", onClick: () => { handleStatusToggle(user.id); setOpenMenuId(null); } }, { label: "삭제", onClick: () => { alert('삭제 기능은 추후 구현'); setOpenMenuId(null); }, className: isDarkMode ? 'text-red-400' : 'text-red-600' }].map((item, i) => (
                              <button key={i} className={`w-full text-left px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${item.className || ''}`} onClick={item.onClick}>{item.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="h-10 w-10"><AvatarImage src={selectedUser?.avatar} /><AvatarFallback className="bg-blue-100 text-blue-600">{selectedUser?.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div>
                <div className="flex items-center space-x-2"><span>{selectedUser?.username}</span>{selectedUser?.verified && <CheckCircle className="h-5 w-5 text-green-500" />}</div>
                <div className="text-sm text-gray-500">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription>사용자의 상세 정보와 계정 활동을 확인할 수 있습니다.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {["기본 정보", "보안", "거래 내역", "활동 로그"].map((t, i) => <TabsTrigger key={i} value={["info","security","trading","activity"][i]}>{t}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "사용자명", value: selectedUser.username }, { label: "이메일", value: selectedUser.email }, { label: "가입일", value: selectedUser.joinDate }, { label: "마지막 로그인", value: selectedUser.lastLogin }].map((f, i) => (
                    <div key={i} className="space-y-2"><label className="text-sm font-medium">{f.label}</label><div className="p-2 bg-gray-50 rounded">{f.value}</div></div>
                  ))}
                  <div className="space-y-2"><label className="text-sm font-medium">계정 상태</label><div className="flex items-center space-x-2"><Badge className={getStatusColor(selectedUser.status)}>{selectedUser.status}</Badge><Switch checked={selectedUser.status === "활성"} onCheckedChange={() => handleStatusToggle(selectedUser.id)} /></div></div>
                  <div className="space-y-2"><label className="text-sm font-medium">KYC 상태</label><Badge className={getKycStatusColor(selectedUser.kycStatus)}>{selectedUser.kycStatus}</Badge></div>
                </div>
              </TabsContent>
              <TabsContent value="security" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium">인증 상태</label><div className="flex items-center space-x-2">{selectedUser.verified ? <Badge className="bg-green-100 text-green-800">인증 완료</Badge> : <Badge className="bg-red-100 text-red-800">미인증</Badge>}</div></div>
                  <div className="space-y-2"><label className="text-sm font-medium">리스크 레벨</label><span className={`font-medium ${getRiskLevelColor(selectedUser.riskLevel)}`}>{selectedUser.riskLevel}</span></div>
                  <div className="space-y-2"><label className="text-sm font-medium">국가</label><div className="p-2 bg-gray-50 rounded">{selectedUser.country}</div></div>
                  <div className="space-y-2"><label className="text-sm font-medium">전화번호</label><div className="p-2 bg-gray-50 rounded">{selectedUser.phone}</div></div>
                </div>
              </TabsContent>
              <TabsContent value="trading" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "현재 잔고", value: selectedUser.balance, sub: selectedUser.balanceKRW, icon: <DollarSign className="h-8 w-8 text-green-500" /> },
                    { label: "총 거래 횟수", value: `${selectedUser.totalTrades}회`, icon: <Activity className="h-8 w-8 text-blue-500" /> },
                    { label: "사용자 레벨", value: selectedUser.level, icon: <Shield className="h-8 w-8 text-purple-500" /> }
                  ].map((c, i) => (
                    <Card key={i}><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-gray-600">{c.label}</p><p className="text-lg font-bold">{c.value}</p>{c.sub && <p className="text-sm text-gray-500">{c.sub}</p>}</div>{c.icon}</CardContent></Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="activity" className="space-y-4">
                <div className="space-y-3">
                  {[
                    { color: "bg-green-500", title: "로그인 성공", desc: "2024-01-15 14:30:25 (IP: 192.168.1.100)" },
                    { color: "bg-blue-500", title: "BTC 거래 체결", desc: "2024-01-15 13:45:12 (0.1 BTC 매수)" },
                    { color: "bg-yellow-500", title: "출금 요청", desc: "2024-01-15 12:20:45 (0.05 BTC)" }
                  ].map((a, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded"><div className={`w-2 h-2 ${a.color} rounded-full`}></div><div className="flex-1"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-gray-500">{a.desc}</p></div></div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDetailOpen(false)}>닫기</Button>
            <Button variant="destructive">계정 정지</Button>
            <Button>정보 수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordChangeDialog({ open, onClose, onChangePassword }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!current || !next || !confirm) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    if (next.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await onChangePassword(current, next);
      onClose();
    } catch (e) {
      setError(e.message || "비밀번호 변경 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} forceMount>
      <DialogContent className="max-w-md pointer-events-auto z-50">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
          <DialogDescription>보안을 위해 현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">현재 비밀번호</label>
            <div className="relative">
              <input
                id="current-password"
                name="current-password"
                type={showCurrent ? "text" : "password"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                autoComplete="current-password"
                disabled={false}
                readOnly={false}
                tabIndex={0}
                autoFocus
                style={{ pointerEvents: 'auto', opacity: 1, zIndex: 1000 }}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}>
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">새 비밀번호</label>
            <div className="relative">
              <input
                id="new-password"
                name="new-password"
                type={showNext ? "text" : "password"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                value={next}
                onChange={e => setNext(e.target.value)}
                autoComplete="new-password"
                disabled={false}
                readOnly={false}
                tabIndex={0}
                style={{ pointerEvents: 'auto', opacity: 1, zIndex: 1000 }}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1} onClick={() => setShowNext(v => !v)}>
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">새 비밀번호 확인</label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirm ? "text" : "password"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={false}
                readOnly={false}
                tabIndex={0}
                style={{ pointerEvents: 'auto', opacity: 1, zIndex: 1000 }}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}>
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <div className="mb-1">비밀번호 요구사항:</div>
            <ul className="list-disc pl-5">
              <li>최소 8자 이상</li>
              <li>영문, 숫자, 특수문자 조합 권장</li>
            </ul>
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>취소</Button>
            <Button type="submit" disabled={loading} className="bg-black text-white">변경</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserProfileDropdown({ user, isDarkMode, onLogout, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const [pwDialog, setPwDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  // Move profile state up so it persists while dialog is open
  const [profileUsername, setProfileUsername] = useState(user.username || "");
  const [profileEmail, setProfileEmail] = useState(user.email || "");
  const [profileError, setProfileError] = useState("");
  const menuRef = React.useRef();
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest('.profile-dropdown-menu')) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);
  // When dialog opens, initialize state
  useEffect(() => {
    if (profileDialog) {
      setProfileUsername(user.username || "");
      setProfileEmail(user.email || "");
      setProfileError("");
    }
  }, [profileDialog, user]);

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-300 text-gray-700">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start ml-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 leading-tight">{user.username}</span>
          <span className="text-xs text-gray-500 leading-tight">{user.email}</span>
        </div>
        <svg className="ml-1 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className={`profile-dropdown-menu absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50`}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{user.username}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setProfileDialog(true)}> <User className="h-4 w-4 mr-2" /> 프로필 설정 </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setPwDialog(true)}> <KeyRound className="h-4 w-4 mr-2" /> 비밀번호 변경 </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => alert('보안 설정')}> <Shield className="h-4 w-4 mr-2" /> 보안 설정 </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => alert('도움말')}> <HelpCircle className="h-4 w-4 mr-2" /> 도움말 </button>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700">
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={onLogout}> <LogOut className="h-4 w-4 mr-2" /> 로그아웃 </button>
          </div>
        </div>
      )}
      <PasswordChangeDialog open={pwDialog} onClose={() => setPwDialog(false)} onChangePassword={onChangePassword} />
      <ProfileSettingDialog 
        open={profileDialog} 
        onClose={() => setProfileDialog(false)} 
        username={profileUsername}
        setUsername={setProfileUsername}
        email={profileEmail}
        setEmail={setProfileEmail}
        error={profileError}
        setError={setProfileError}
      />
    </div>
  );
}

// 프로필 설정 다이얼로그 (입력 가능, 상태를 상위에서 받음)
const ProfileSettingDialog = forwardRef(function ProfileSettingDialog({ open, onClose, username, setUsername, email, setEmail, error, setError }, ref) {
  // Prevent form reset on every open by using useRef for initial values
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !email) {
      setError("모든 항목을 입력하세요.");
      return;
    }
    // 실제 저장 로직 필요
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" ref={ref}>
        <DialogHeader>
          <DialogTitle>프로필 설정</DialogTitle>
          <DialogDescription>사용자 정보를 수정할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block mb-1 text-sm font-medium">사용자명</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">이메일</label>
            <input
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit" className="bg-black text-white">저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default UserManagementEnhanced;
