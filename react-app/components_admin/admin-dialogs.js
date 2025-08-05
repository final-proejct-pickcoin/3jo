import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components_admin/ui/dialog";
import { Label } from "@/components_admin/ui/label";
import { Input } from "@/components_admin/ui/input";
import { Textarea } from "@/components_admin/ui/textarea";
import { Checkbox } from "@/components_admin/ui/checkbox";
import { Button } from "@/components_admin/ui/button";
import { Badge } from "@/components_admin/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

const AdminDialogs = memo(({
  // 사용자 상세 다이얼로그
  selectedUser,
  isUserDetailDialogOpen,
  setIsUserDetailDialogOpen,
  
  // 공지사항 작성 다이얼로그
  isAnnouncementDialogOpen,
  setIsAnnouncementDialogOpen,
  newAnnouncement,
  setNewAnnouncement,
  onCreateAnnouncement,
  
  // 공지사항 상세 다이얼로그
  selectedAnnouncement,
  isAnnouncementDetailOpen,
  setIsAnnouncementDetailOpen,
  
  // 유틸리티 함수들
  getBadgeVariant,
  getDarkModeClass,
  getDescriptionClass
}) => {
  // 유틸리티 함수들
  const getVerificationDisplay = (verified) => (
    <div className="flex items-center">
      {verified ? (
        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 mr-1" />
      )}
      <span>{verified ? "인증완료" : "미인증"}</span>
    </div>
  );

  // 공지사항 필드 업데이트 헬퍼
  const updateAnnouncement = (field, value) => 
    setNewAnnouncement(prev => ({ ...prev, [field]: value }));

  // 사용자 정보 필드 매핑
  const userFields = [
    { label: '사용자명', value: selectedUser?.username, type: 'text' },
    { label: '이메일', value: selectedUser?.email, type: 'text' },
    { label: '상태', value: selectedUser?.status, type: 'badge' },
    { label: '가입일', value: selectedUser?.joinDate, type: 'text' },
    { label: '현재 잔액', value: selectedUser?.balance, type: 'text' },
    { label: '거래 횟수', value: `${selectedUser?.trades}회`, type: 'text' },
    { label: '마지막 로그인', value: selectedUser?.lastLogin, type: 'text' },
    { label: '인증 상태', value: selectedUser?.verified, type: 'verification' }
  ];

  // 필드 렌더링 함수
  const renderField = (field) => {
    const { label, value, type } = field;
    return (
      <div key={label}>
        <Label>{label}</Label>
        {type === 'badge' ? (
          <Badge variant={getBadgeVariant.userStatus(value)}>{value}</Badge>
        ) : type === 'verification' ? (
          getVerificationDisplay(value)
        ) : (
          <p className="font-medium">{value}</p>
        )}
      </div>
    );
  };
  return (
    <>
      {/* 사용자 상세 다이얼로그 */}
      {selectedUser && (
        <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
          <DialogContent className={`max-w-2xl ${getDarkModeClass("", "bg-gray-800 text-white")}`}>
            <DialogHeader>
              <DialogTitle>사용자 상세 정보</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {userFields.map(renderField)}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 공지사항 작성 다이얼로그 */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className={getDarkModeClass("", "bg-gray-800 text-white")}>
          <DialogHeader>
            <DialogTitle>새 공지사항 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { id: 'title', label: '제목', type: 'input', placeholder: '공지사항 제목을 입력하세요' },
              { id: 'content', label: '내용', type: 'textarea', placeholder: '공지사항 내용을 입력하세요', rows: 5 }
            ].map(({ id, label, type, placeholder, rows }) => (
              <div key={id}>
                <Label htmlFor={id}>{label}</Label>
                {type === 'input' ? (
                  <Input
                    id={id}
                    value={newAnnouncement[id]}
                    onChange={(e) => updateAnnouncement(id, e.target.value)}
                    placeholder={placeholder}
                  />
                ) : (
                  <Textarea
                    id={id}
                    value={newAnnouncement[id]}
                    onChange={(e) => updateAnnouncement(id, e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={newAnnouncement.important}
                onCheckedChange={(checked) => updateAnnouncement('important', checked)}
              />
              <Label htmlFor="important">중요 공지사항</Label>
            </div>
          </div>
          <DialogFooter>
            {[
              { text: '취소', variant: 'outline', onClick: () => setIsAnnouncementDialogOpen(false) },
              { text: '작성완료', onClick: onCreateAnnouncement }
            ].map(({ text, variant, onClick }) => (
              <Button key={text} variant={variant} onClick={onClick}>
                {text}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지사항 상세 다이얼로그 */}
      {selectedAnnouncement && (
        <Dialog open={isAnnouncementDetailOpen} onOpenChange={setIsAnnouncementDetailOpen}>
          <DialogContent className={`max-w-2xl ${getDarkModeClass("", "bg-gray-800 text-white")}`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAnnouncement.title}
                {selectedAnnouncement.important && (
                  <Badge variant="destructive">중요</Badge>
                )}
              </DialogTitle>
              <DialogDescription className={getDescriptionClass()}>
                {selectedAnnouncement.date} • 조회수: {selectedAnnouncement.views}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

AdminDialogs.displayName = "AdminDialogs";

export default AdminDialogs;
