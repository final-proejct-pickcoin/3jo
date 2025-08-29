// navigation.jsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Bell, LogOut, User, Zap, Wifi, WifiOff, Briefcase, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { useWebSocket } from "@/components/websocket-provider"
import { useRouter } from "next/navigation"
import LogoIcon from '@/assets/logo.svg'

const avatarGradients = [
  "bg-[conic-gradient(at_top_left,_#d1c4e9,_#b3e5fc,_#f8bbd0,_#b2dfdb,_#f3e5f5,_#e1bee7,_#b2ebf2,_#d1c4e9)]",
  "bg-[conic-gradient(at_top_left,_#f3ec78,_#af4261,_#43cea2,_#185a9d,_#f64f59,_#c471f5,_#12c2e9,_#f3ec78)]",
  "bg-[conic-gradient(at_top_left,_#e0c3fc,_#8ec5fc,_#f9d29d,_#a1c4fd,_#fbc2eb,_#fcb69f,_#a1c4fd,_#e0c3fc)]",
  "bg-[conic-gradient(at_top_left,_#fbc2eb,_#a6c1ee,_#fdcbf1,_#a1c4fd,_#f9d29d,_#fbc2eb,_#a6c1ee,_#fdcbf1)]",
  "bg-[conic-gradient(at_top_left,_#a1c4fd,_#c2e9fb,_#fbc2eb,_#f9d29d,_#a1c4fd,_#c2e9fb,_#fbc2eb,_#f9d29d)]",
]
const getRandomGradient = () => avatarGradients[Math.floor(Math.random() * avatarGradients.length)]

export const Navigation = () => {
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()
  const router = useRouter()
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editNickname, setEditNickname] = useState(user?.nickname || "")
  const [editEmail, setEditEmail] = useState(user?.email || "")
  const [avatar, setAvatar] = useState(user?.avatar || "/placeholder-user.jpg")
  const [editAvatar, setEditAvatar] = useState(avatar)

  const [avatarGradient, setAvatarGradient] = useState(getRandomGradient())
  const handleProfileDialogChange = (open) => {
    setShowProfileDialog(open)
    if (open) setAvatarGradient(getRandomGradient())
  }

  return (
    <>
      <nav className="border-b border-border bg-background text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-xl font-bold cursor-pointer text-foreground bg-transparent border-0 p-0 m-0 focus:outline-none"
                  onClick={() => router.push("/")}
                  style={{ background: "none" }}
                  aria-label="홈으로 이동"
                >
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <img 
                      src={LogoIcon.src} 
                      alt="pickCoin 로고" 
                      className="h-6 w-6" // 아이콘 크기는 내부 콘텐츠에 맞게 조절
                    /> 
                  </div>
                  <span>PickCoin</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                    <Wifi className="h-3 w-3 mr-1" />실시간
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="h-3 w-3 mr-1" />오프라인
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" data-tour="notifications" onClick={() => setShowNotificationDialog(true)}>
                <Bell className="h-4 w-4" />
              </Button>
              <div data-tour="theme-toggle">
                <ThemeToggle />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar || "/placeholder.svg"} alt={user?.nickname} />
                      <AvatarFallback>{user?.nickname?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.nickname}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShowProfileDialog(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>프로필</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* 알림 다이얼로그 */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md p-8 rounded-xl shadow-2xl bg-white/95 backdrop-blur-lg border border-gray-100">
          <DialogHeader className="flex flex-col items-center gap-1 mb-2">
            <Bell className="h-8 w-8 text-primary mb-2" />
            <DialogTitle className="text-lg font-semibold text-gray-900">알림 환경설정</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 text-center">
              거래소 내 알림 종류별 수신 여부를 관리하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            <div className="flex flex-col gap-4 px-4 py-4 rounded-lg bg-white/60 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="font-medium text-gray-800">가격 변동 알림</span>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked readOnly className="accent-primary w-5 h-5" />
                  <span className="ml-2 text-sm">수신</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-800">시스템 공지</span>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="accent-primary w-5 h-5" />
                  <span className="ml-2 text-sm">수신</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-800">커뮤니티 메시지</span>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked readOnly className="accent-primary w-5 h-5" />
                  <span className="ml-2 text-sm">수신</span>
                </label>
              </div>
            </div>
            <div className="rounded-lg px-4 py-3 bg-gray-50 text-center border border-gray-100">
              <p className="text-xs text-gray-500">알림은 언제든 켜고 끌 수 있습니다.<br/>설정은 저장 버튼을 눌러 적용됩니다.</p>
            </div>
            <div className="flex gap-2 mt-6">
              <Button className="flex-1" variant="default" onClick={() => setShowNotificationDialog(false)}>
                저장
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setShowNotificationDialog(false)}>
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* 프로필 다이얼로그 */}
      <Dialog open={showProfileDialog} onOpenChange={handleProfileDialogChange}>
        <DialogContent className="max-w-sm p-7 rounded-xl shadow-2xl bg-white/90 backdrop-blur-lg border border-gray-100 flex flex-col items-center">
          <DialogHeader className="sr-only">
            <DialogTitle>프로필 관리</DialogTitle>
            <DialogDescription>프로필 정보를 확인하고 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center mb-3">
            <div className="mt-8" />
            <Avatar className="h-36 w-36">
              {isEditingProfile || avatar ? (
                <AvatarImage
                  src={isEditingProfile ? editAvatar : avatar}
                  alt={editNickname || user?.nickname}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-gray-400 border border-gray-300 text-white text-3xl flex items-center justify-center min-h-[112px] min-w-[112px]">
                <span className="font-bold text-white text-4xl">{user?.nickname?.charAt(0).toUpperCase() || "U"}</span>
              </AvatarFallback>
            </Avatar>
          </div>
          {isEditingProfile ? (
            <form className="w-full flex flex-col gap-3 mt-2">
              <label className="text-sm font-medium text-gray-700">프로필 사진</label>
              <input
                type="file"
                accept="image/*"
                className="border rounded px-3 py-2 text-sm"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => setEditAvatar(ev.target.result)
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <label className="text-sm font-medium text-gray-700">닉네임</label>
              <input
                className="border rounded px-3 py-2 text-sm"
                value={editNickname}
                onChange={e => setEditNickname(e.target.value)}
                placeholder="닉네임 입력"
              />
              <label className="text-sm font-medium text-gray-700">이메일</label>
              <input
                className="border rounded px-3 py-2 text-sm"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                placeholder="이메일 입력"
                type="email"
              />
              <div className="flex gap-2 mt-3">
                <Button className="flex-1" variant="default" type="button" onClick={() => {
                  setAvatar(editAvatar)
                  setIsEditingProfile(false)
                }}>저장</Button>
                <Button className="flex-1" variant="outline" type="button" onClick={() => {
                  setEditNickname(user?.nickname || "")
                  setEditEmail(user?.email || "")
                  setEditAvatar(user?.avatar || "/placeholder-user.jpg")
                  setIsEditingProfile(false)
                }}>뒤로가기</Button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-base font-semibold text-gray-900 mb-1">{user?.nickname || "사용자"}</p>
              <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary">거래 등급: <span className="font-bold ml-1">{user?.tier || "일반"}</span></Badge>
                <Badge variant="outline">잔고: <span className="font-bold ml-1">{user?.balance ? `$${user.balance}` : "비공개"}</span></Badge>
              </div>

            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

