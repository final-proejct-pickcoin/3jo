import React, { memo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components_admin/ui/dialog";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Textarea } from "@/components_admin/ui/textarea";
import { Switch } from "@/components_admin/ui/switch";
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { getDarkClass } from "@/components_admin/utils/theme-utils";

// 메모화된 공지사항 관리 컴포넌트
export const AnnouncementManagement = memo(({
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
}) => {
  // 액션 메뉴 상태 관리
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  useEffect(() => {
    if (openMenuId === null) return;
    const onClick = (e) => {
      if (!e.target.closest('.announcement-action-menu')) setOpenMenuId(null);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [openMenuId]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">공지사항 관리</h2>
        <p className="text-gray-500 text-sm">사용자 공지사항을 작성하고 관리합니다</p>
      </div>
      <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className={isDarkMode ? "text-white" : ""}>공지사항 목록</CardTitle>
            <p className="text-gray-500 text-xs mt-1">등록된 공지사항 ({announcements.length}개)</p>
          </div>
          <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-black text-white hover:bg-gray-800">
                <Plus className="h-4 w-4" />
                <span>새 공지사항</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[600px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
              <DialogHeader>
                <DialogTitle className={isDarkMode ? "text-white" : ""}>새 공지사항</DialogTitle>
                <DialogDescription className={isDarkMode ? "text-gray-300" : ""}>
                  새로운 공지사항을 작성하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className={isDarkMode ? "text-gray-300" : ""}>제목</Label>
                  <Input
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content" className={isDarkMode ? "text-gray-300" : ""}>내용</Label>
                  <Textarea
                    id="content"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    placeholder="공지사항 내용을 입력하세요"
                    rows={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="important"
                    checked={newAnnouncement.important}
                    onCheckedChange={(checked) => setNewAnnouncement({...newAnnouncement, important: checked})}
                  />
                  <Label htmlFor="important" className={isDarkMode ? "text-gray-300" : ""}>
                    중요 공지사항
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateAnnouncement}>게시</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className={isDarkMode ? "border-gray-700" : ""}>
                  <TableHead className={isDarkMode ? "text-gray-300" : ""}>제목</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : ""}>작성일</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : ""}>조회수</TableHead>
                  <TableHead className={isDarkMode ? "text-gray-300" : ""}>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id} className={isDarkMode ? "border-gray-700" : ""}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`cursor-pointer hover:underline ${isDarkMode ? "text-gray-300" : ""}`}
                          onClick={() => handleAnnouncementClick(announcement)}
                        >
                          {announcement.title}
                        </span>
                        {announcement.important && (
                          <Badge variant="destructive" className="text-xs">중요</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={isDarkMode ? "text-gray-300" : ""}>
                      {announcement.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant={announcement.status === "active" ? "default" : "secondary"}>
                        {announcement.status === "active" ? "활성" : "만료"}
                      </Badge>
                    </TableCell>
                    <TableCell className={isDarkMode ? "text-gray-300" : ""}>
                      {announcement.views.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="relative announcement-action-menu" ref={menuRef}>
                        <button
                          type="button"
                          aria-label="액션 메뉴"
                          className="flex items-center justify-center w-full h-8 focus:outline-none bg-transparent border-none p-0"
                          tabIndex={0}
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuId(announcement.id);
                          }}
                        >
                          <MoreHorizontal className="h-5 w-5 text-gray-700" />
                        </button>
                        {openMenuId === announcement.id && (
                          <div className="absolute right-0 z-20 mt-2 w-28 bg-white border rounded shadow-lg py-1 text-sm announcement-action-menu" style={{minWidth:'100px'}}>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                handleAnnouncementClick(announcement);
                                setOpenMenuId(null);
                              }}
                            >상세 보기</button>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                // 수정 기능이 있다면 여기에 연결
                                alert('수정 기능은 추후 구현');
                                setOpenMenuId(null);
                              }}
                            >수정</button>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                              onClick={() => {
                                handleDeleteAnnouncement(announcement.id);
                                setOpenMenuId(null);
                              }}
                            >삭제</button>
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
      {/* 공지사항 상세 보기 다이얼로그 */}
      <Dialog open={isAnnouncementDetailOpen} onOpenChange={setIsAnnouncementDetailOpen}>
        <DialogContent
          className={`sm:max-w-[600px] !bg-white !text-gray-900 ${isDarkMode ? '!bg-gray-800 !text-gray-100 border-gray-700' : ''}`}
        >
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className={isDarkMode ? "text-gray-100" : "text-gray-900"}>
                    {selectedAnnouncement.title}
                  </DialogTitle>
                  {selectedAnnouncement.important && (
                    <Badge variant="destructive">중요</Badge>
                  )}
                </div>
                <DialogDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  {selectedAnnouncement.date} • 조회수 {selectedAnnouncement.views.toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className={`whitespace-pre-wrap ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                  {selectedAnnouncement.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
