import { memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components_admin/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

const AnnouncementManagementTab = memo(({
  announcements,
  getBadgeVariant,
  onNewAnnouncement,
  onAnnouncementClick,
  onToggleStatus,
  onDeleteAnnouncement,
  getCardClass,
  getTextClass,
  getDescriptionClass
}) => {
  // 중요도 표시 로직
  const getImportanceBadge = (important) => 
    important ? <Badge variant="destructive">중요</Badge> : null;

  // 상태 표시 로직
  const getStatusText = (status) => status === "active" ? "활성" : "만료";
  return (
    <Card className={getCardClass()}>
      <CardHeader>
        <CardTitle className={getTextClass()}>공지사항 관리</CardTitle>
        <CardDescription className={getDescriptionClass()}>
          사용자에게 전달할 공지사항을 작성하고 관리합니다.
        </CardDescription>
        <div className="flex justify-end">
          <Button onClick={onNewAnnouncement}>
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
            {announcements.map((announcement) => (
              <TableRow key={announcement.id}>
                <TableCell
                  className="font-medium cursor-pointer hover:text-blue-600"
                  onClick={() => onAnnouncementClick(announcement)}
                >
                  {announcement.title}
                </TableCell>
                <TableCell>{announcement.date}</TableCell>
                <TableCell>
                  {getImportanceBadge(announcement.important)}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant.announcementStatus(announcement.status)}>
                    {getStatusText(announcement.status)}
                  </Badge>
                </TableCell>
                <TableCell>{announcement.views}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleStatus(announcement.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteAnnouncement(announcement.id)}
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
  );
});

AnnouncementManagementTab.displayName = "AnnouncementManagementTab";

export default AnnouncementManagementTab;
