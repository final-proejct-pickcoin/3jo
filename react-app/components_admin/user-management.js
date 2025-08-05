import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Eye, Ban, Edit, Trash2 } from "lucide-react";
import { getDarkClass, getStatusColors } from "./utils/theme-utils";

// 상수 정의
const CONFIG = {
  statusOptions: [
    { value: "all", label: "모든 상태" },
    { value: "활성", label: "활성" },
    { value: "정지", label: "정지" }
  ],
  tableHeaders: ["사용자명", "이메일", "상태", "가입일", "잔액", "액션"],
  actionButtons: [
    { icon: Eye, action: "view", label: "보기" },
    { icon: Ban, action: "toggle", label: "상태 변경" },
    { icon: Edit, action: "edit", label: "수정" },
    { icon: Trash2, action: "delete", label: "삭제" }
  ]
};

// 메모화된 사용자 관리 컴포넌트
export const UserManagement = memo(({ 
  isDarkMode,
  users,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredUsers,
  handleUserStatusToggle,
  setSelectedUser,
  setIsUserDetailDialogOpen
}) => {
  // 액션 버튼 핸들러
  const handleAction = useCallback((action, user) => {
    const actions = {
      view: () => {
        setSelectedUser(user);
        setIsUserDetailDialogOpen(true);
      },
      toggle: () => handleUserStatusToggle(user.id),
      edit: () => console.log("Edit user:", user.id),
      delete: () => console.log("Delete user:", user.id)
    };
    
    actions[action]?.();
  }, [setSelectedUser, setIsUserDetailDialogOpen, handleUserStatusToggle]);

  // 테이블 셀 렌더러
  const renderUserCell = useCallback((user, type) => {
    const cellClass = getDarkClass("", "text-gray-300");
    
    switch (type) {
      case "username":
        return (
          <TableCell className={cellClass}>
            <div className="flex items-center space-x-2">
              <span>{user.username}</span>
              {user.verified && (
                <Badge variant="secondary" className="text-xs">인증</Badge>
              )}
            </div>
          </TableCell>
        );
      case "email":
      case "joinDate":
      case "balance":
        return <TableCell className={cellClass}>{user[type]}</TableCell>;
      case "status":
        return (
          <TableCell>
            <Badge variant={user.status === "활성" ? "default" : "destructive"}>
              {user.status}
            </Badge>
          </TableCell>
        );
      case "actions":
        return (
          <TableCell>
            <div className="flex items-center space-x-2">
              {CONFIG.actionButtons.map(({ icon: Icon, action, label }) => (
                <Button
                  key={action}
                  variant="outline"
                  size="icon"
                  onClick={() => handleAction(action, user)}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </TableCell>
        );
      default:
        return null;
    }
  }, [getDarkClass, handleAction]);

  return (
    <Card className={getDarkClass("", "bg-gray-800 border-gray-700")}>
      <CardHeader>
        <CardTitle className={getDarkClass("", "text-white")}>사용자 관리</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="사용자명 또는 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              {CONFIG.statusOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 사용자 테이블 */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className={getDarkClass("", "border-gray-700")}>
                {CONFIG.tableHeaders.map((header) => (
                  <TableHead key={header} className={getDarkClass("", "text-gray-300")}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={getDarkClass("", "border-gray-700")}>
                  {renderUserCell(user, "username")}
                  {renderUserCell(user, "email")}
                  {renderUserCell(user, "status")}
                  {renderUserCell(user, "joinDate")}
                  {renderUserCell(user, "balance")}
                  {renderUserCell(user, "actions")}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

UserManagement.displayName = 'UserManagement';
