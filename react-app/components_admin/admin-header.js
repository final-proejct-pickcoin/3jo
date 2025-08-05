import { memo } from "react";
import { Button } from "@/components_admin/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components_admin/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components_admin/ui/dropdown-menu";
import { Bell, Moon, Sun, Settings, LogOut, User, Key, Shield, HelpCircle } from "lucide-react";
import UserProfileDropdown from "./user-profile-dropdown";

// 메모화된 헤더 컴포넌트
export const AdminHeader = memo(({ 
  isDarkMode, 
  setIsDarkMode, 
  unreadCount, 
  notifications,
  isNotificationDialogOpen,
  setIsNotificationDialogOpen,
  isSettingsDialogOpen,
  setIsSettingsDialogOpen,
  handleMarkAllNotificationsAsRead,
  handleMarkNotificationAsRead,
  handleLogout,
  // 설정 다이얼로그 핸들러들
  setIsProfileDialogOpen,
  setIsPasswordDialogOpen,
  setIsSecurityDialogOpen,
  setIsHelpDialogOpen,
  user
}) => (
  <header className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-b px-6 py-4`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              PickCoin Admin
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                시스템 정상
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <NotificationDialog
          isDarkMode={isDarkMode}
          unreadCount={unreadCount}
          notifications={notifications}
          isOpen={isNotificationDialogOpen}
          setIsOpen={setIsNotificationDialogOpen}
          handleMarkAllAsRead={handleMarkAllNotificationsAsRead}
          handleMarkAsRead={handleMarkNotificationAsRead}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <SettingsDropdown
          isDarkMode={isDarkMode}
          isOpen={isSettingsDialogOpen}
          setIsOpen={setIsSettingsDialogOpen}
          setIsProfileDialogOpen={setIsProfileDialogOpen}
          setIsPasswordDialogOpen={setIsPasswordDialogOpen}
          setIsSecurityDialogOpen={setIsSecurityDialogOpen}
          setIsHelpDialogOpen={setIsHelpDialogOpen}
          handleLogout={handleLogout}
        />
        
        <UserProfileDropdown
          user={user || { username: '', email: '' }}
          isDarkMode={isDarkMode}
          onLogout={handleLogout}
          onChangePassword={() => setIsPasswordDialogOpen(true)}
        />
      </div>
    </div>
  </header>
));

// 메모화된 설정 드롭다운 컴포넌트
const SettingsDropdown = memo(({
  isDarkMode,
  isOpen,
  setIsOpen,
  setIsProfileDialogOpen,
  setIsPasswordDialogOpen,
  setIsSecurityDialogOpen,
  setIsHelpDialogOpen,
  handleLogout
}) => (
  <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent 
      align="end"
      className={`w-56 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
    >
      <DropdownMenuItem 
        onClick={() => {
          setIsProfileDialogOpen(true);
          setIsOpen(false);
        }}
        className={isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white" : ""}
      >
        <User className="mr-2 h-4 w-4" />
        프로필 설정
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => {
          setIsPasswordDialogOpen(true);
          setIsOpen(false);
        }}
        className={isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white" : ""}
      >
        <Key className="mr-2 h-4 w-4" />
        비밀번호 변경
      </DropdownMenuItem>
      
      <DropdownMenuItem 
        onClick={() => {
          setIsSecurityDialogOpen(true);
          setIsOpen(false);
        }}
        className={isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white" : ""}
      >
        <Shield className="mr-2 h-4 w-4" />
        보안 설정
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700" : ""} />
      
      <DropdownMenuItem 
        onClick={() => {
          setIsHelpDialogOpen(true);
          setIsOpen(false);
        }}
        className={isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white" : ""}
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        도움말
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className={isDarkMode ? "bg-gray-700" : ""} />
      
      <DropdownMenuItem 
        onClick={() => {
          handleLogout();
          setIsOpen(false);
        }}
        className={`text-red-600 ${isDarkMode ? "hover:bg-gray-700 focus:bg-gray-700" : ""}`}
      >
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  
));

// 메모화된 알림 대화상자 컴포넌트
const NotificationDialog = memo(({ 
  isDarkMode, 
  unreadCount, 
  notifications, 
  isOpen, 
  setIsOpen,
  handleMarkAllAsRead,
  handleMarkAsRead
}) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : ""}`}>알림</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          className={isDarkMode ? "text-gray-300 hover:text-white" : ""}
        >
          모두 읽음
        </Button>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              notification.read 
                ? isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                : isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"
            }`}
            onClick={() => handleMarkAsRead(notification.id)}
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
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
));
