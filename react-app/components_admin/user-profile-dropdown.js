import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components_admin/ui/avatar";
import { User, KeyRound, Shield, HelpCircle, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components_admin/ui/dialog";

// 프로필 설정 다이얼로그 (입력 가능, 상태를 상위에서 받음)
const ProfileSettingDialog = React.forwardRef(function ProfileSettingDialog({ open, onClose, username, setUsername, email, setEmail, error, setError }, ref) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !email) {
      setError("모든 항목을 입력하세요.");
      return;
    }
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
            <input className="w-full border rounded px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">이메일</label>
            <input className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

// 비밀번호 변경 다이얼로그 (간단 버전)
const PasswordChangeDialog = ({ open, onClose, onChangePassword }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError("비밀번호를 입력하세요.");
      return;
    }
    onChangePassword(password);
    setPassword("");
    setError("");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block mb-1 text-sm font-medium">새 비밀번호</label>
            <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">변경</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function UserProfileDropdown({ user, isDarkMode, onLogout, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const [pwDialog, setPwDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [profileUsername, setProfileUsername] = useState(user.username || "");
  const [profileEmail, setProfileEmail] = useState(user.email || "");
  const [profileError, setProfileError] = useState("");
  const menuRef = useRef();
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest('.profile-dropdown-menu')) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);
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
