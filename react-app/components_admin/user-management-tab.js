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
import { Input } from "@/components_admin/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components_admin/ui/select";
import { Eye, Ban, CheckCircle, XCircle } from "lucide-react";

const UserManagementTab = memo(({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredUsers,
  getBadgeVariant,
  onUserSelect,
  onUserStatusToggle,
  getCardClass,
  getTextClass,
  getDescriptionClass
}) => {
  // 상태별 아이콘 매핑
  const getStatusIcon = (isActive) => 
    isActive ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />;
  
  const getVerificationIcon = (verified) =>
    verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  return (
    <Card className={getCardClass()}>
      <CardHeader>
        <CardTitle className={getTextClass()}>사용자 관리</CardTitle>
        <CardDescription className={getDescriptionClass()}>
          등록된 사용자들을 관리하고 모니터링합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Input
            placeholder="사용자명 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Badge variant={getBadgeVariant.userStatus(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.joinDate}</TableCell>
                <TableCell>{user.balance}</TableCell>
                <TableCell>{user.trades}</TableCell>
                <TableCell>
                  {getVerificationIcon(user.verified)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUserSelect(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUserStatusToggle(user.id)}
                    >
                      {getStatusIcon(user.status === "활성")}
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

UserManagementTab.displayName = "UserManagementTab";

export default UserManagementTab;
