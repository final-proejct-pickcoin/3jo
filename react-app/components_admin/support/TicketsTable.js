import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components_admin/ui/dropdown-menu";
import { Clock, CheckCircle, Eye, Archive, MoreHorizontal } from "lucide-react";
import { getDarkClass, getStatusColors, getPriorityColors } from "../utils/theme-utils";

// 상수 정의
const PRIORITY_OPTIONS = ["긴급", "높음", "보통", "낮음"];
const TABLE_HEADERS = ["ID", "사용자", "제목", "카테고리", "우선순위", "상태", "생성일", "액션"];
const ACTION_ITEMS = [
  { label: "상세 보기", icon: Eye, action: "view" },
  { label: "진행중으로 변경", icon: Clock, action: "진행중" },
  { label: "완료로 변경", icon: CheckCircle, action: "완료" },
  { label: "대기로 변경", icon: Archive, action: "대기" }
];

const TicketsTable = ({ 
  filteredTickets, 
  isDarkMode, 
  handleTicketClick, 
  handlePriorityChange, 
  handleStatusChange, 
  getStatusInfo 
}) => {
  const getStatusIcon = (status) => {
    const { icon: Icon } = getStatusInfo(status);
    return <Icon className="h-4 w-4" />;
  };

  // 액션 핸들러
  const handleAction = (ticket, action) => {
    if (action === "view") {
      handleTicketClick(ticket);
    } else {
      handleStatusChange(ticket.id, action);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {TABLE_HEADERS.map(header => (
            <TableHead key={header} className={getDarkClass("", "text-gray-300")}>
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTickets.map(ticket => (
          <TableRow
            key={ticket.id}
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <TableCell className={`font-medium ${getDarkClass("", "text-gray-200")}`}>
              #{ticket.id}
            </TableCell>
            <TableCell>
              <div>
                <p className={`font-medium ${getDarkClass("", "text-gray-200")}`}>
                  {ticket.user}
                </p>
                <p className={`text-sm ${getDarkClass("text-gray-500", "text-gray-400")}`}>
                  {ticket.email}
                </p>
              </div>
            </TableCell>
            <TableCell className={`font-medium ${getDarkClass("", "text-gray-200")}`}>
              {ticket.subject}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{ticket.category}</Badge>
            </TableCell>
            <TableCell>
              <Select
                value={ticket.priority}
                onValueChange={(value) => handlePriorityChange(ticket.id, value)}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {getStatusIcon(ticket.status)}
                <Badge variant={getStatusInfo(ticket.status).color} className="ml-2">
                  {ticket.status}
                </Badge>
              </div>
            </TableCell>
            <TableCell className={getDarkClass("", "text-gray-300")}>
              {ticket.createdAt}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {ACTION_ITEMS.map(({ label, icon: Icon, action }) => (
                    <DropdownMenuItem 
                      key={action}
                      onClick={() => handleAction(ticket, action)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TicketsTable;
