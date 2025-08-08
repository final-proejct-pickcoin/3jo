"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Textarea } from "@/components_admin/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components_admin/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components_admin/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components_admin/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components_admin/ui/dropdown-menu";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  MoreHorizontal,
  Send,
  Eye,
  Archive,
} from "lucide-react";

export default function SupportManagement({ isDarkMode }) {
  const [tickets, setTickets] = useState([
    {
      id: 1,
      user: "user123",
      email: "user123@example.com",
      subject: "출금이 처리되지 않습니다",
      category: "출금",
      priority: "높음",
      status: "신규",
      createdAt: "2024-01-15 14:30",
      lastReply: "2024-01-15 14:30",
      messages: [
        {
          id: 1,
          sender: "user",
          message: "어제 출금 신청을 했는데 아직 처리되지 않았습니다. 확인 부탁드립니다.",
          timestamp: "2024-01-15 14:30",
        },
      ],
    },
    {
      id: 2,
      user: "user456",
      email: "user456@example.com",
      subject: "계정 인증 문제",
      category: "계정",
      priority: "보통",
      status: "진행중",
      createdAt: "2024-01-15 10:15",
      lastReply: "2024-01-15 15:20",
      messages: [
        {
          id: 1,
          sender: "user",
          message: "KYC 인증을 완료했는데 계정이 아직 인증되지 않았습니다.",
          timestamp: "2024-01-15 10:15",
        },
        {
          id: 2,
          sender: "admin",
          message: "안녕하세요. 제출해주신 서류를 검토 중입니다. 추가 서류가 필요할 수 있습니다.",
          timestamp: "2024-01-15 15:20",
        },
      ],
    },
    {
      id: 3,
      user: "user789",
      email: "user789@example.com",
      subject: "거래 수수료 문의",
      category: "거래",
      priority: "낮음",
      status: "완료",
      createdAt: "2024-01-14 16:45",
      lastReply: "2024-01-15 09:30",
      messages: [
        {
          id: 1,
          sender: "user",
          message: "거래 수수료가 예상보다 높게 나왔는데 확인 부탁드립니다.",
          timestamp: "2024-01-14 16:45",
        },
        {
          id: 2,
          sender: "admin",
          message:
            "확인해보니 정상적으로 적용된 수수료입니다. 자세한 내용은 수수료 안내 페이지를 참고해주세요.",
          timestamp: "2024-01-15 09:30",
        },
      ],
    },
  ]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: newStatus,
            }
          : ticket
      )
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus,
      });
    }
  };

  const handlePriorityChange = (ticketId, newPriority) => {
    setTickets(
      tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              priority: newPriority,
            }
          : ticket
      )
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        priority: newPriority,
      });
    }
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    const newMessage = {
      id: selectedTicket.messages.length + 1,
      sender: "admin",
      message: replyMessage,
      timestamp: new Date().toLocaleString("ko-KR"),
    };
    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage],
      lastReply: newMessage.timestamp,
      status: "진행중",
    };
    setTickets(tickets.map((ticket) => (ticket.id === selectedTicket.id ? updatedTicket : ticket)));
    setSelectedTicket(updatedTicket);
    setReplyMessage("");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "긴급":
      case "높음":
        return "destructive";
      case "보통":
        return "secondary";
      case "낮음":
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "신규":
        return "destructive";
      case "진행중":
      case "대기":
        return "secondary";
      case "완료":
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "신규":
        return <AlertCircle className="h-4 w-4" />;
      case "진행중":
      case "대기":
        return <Clock className="h-4 w-4" />;
      case "완료":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            1:1 문의 관리
          </h1>
          <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
            사용자 문의사항에 실시간으로 대응할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  신규 문의
                </p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tickets.filter((t) => t.status === "신규").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>진행중</p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tickets.filter((t) => t.status === "진행중").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>완료</p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tickets.filter((t) => t.status === "완료").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>접수 문의</p>
                <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {tickets.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>문의 목록</CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                총 {filteredTickets.length}개의 문의
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="문의 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="신규">신규</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                  <SelectItem value="삭제">삭제</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="낮음">낮음</SelectItem>
                  <SelectItem value="보통">보통</SelectItem>
                  <SelectItem value="높음">높음</SelectItem>
                  <SelectItem value="매우높음">매우높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>                
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>사용자</TableHead>                
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>카테고리</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>우선순위</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>답변일</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell>
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>
                        {ticket.user}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {ticket.email}
                      </p>
                    </div>
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
                        <SelectItem value="낮음">낮음</SelectItem>
                        <SelectItem value="보통">보통</SelectItem>
                        <SelectItem value="높음">높음</SelectItem>
                        <SelectItem value="매우높음">매우높음</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <Badge variant={getStatusColor(ticket.status)} className="ml-2">
                        {ticket.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={isDarkMode ? "text-gray-300" : ""}>
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
                        <DropdownMenuItem onClick={() => handleTicketClick(ticket)}>
                          <Eye className="h-4 w-4 mr-2" />
                          고객 대화
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "진행중")}>
                          <Clock className="h-4 w-4 mr-2" />
                          진행중으로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "완료")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          완료로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, "대기")}>
                          <Archive className="h-4 w-4 mr-2" />
                          대기로 변경
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className={`sm:max-w-[700px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>
              문의 상세 - #{selectedTicket?.id}
            </DialogTitle>
            <DialogDescription className={isDarkMode ? "text-gray-400" : ""}>
              {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <>
              <div
                className={`grid grid-cols-2 gap-4 p-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                } rounded-lg`}
              >
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    사용자
                  </p>
                  <p className={isDarkMode ? "text-gray-200" : "text-gray-900"}>
                    {selectedTicket.user}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    이메일
                  </p>
                  <p className={isDarkMode ? "text-gray-200" : "text-gray-900"}>
                    {selectedTicket.email}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    카테고리
                  </p>
                  <Badge variant="outline">{selectedTicket.category}</Badge>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    신청 금액
                  </p>
                  <p className={`w-32 p-2 rounded border ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                    {selectedTicket.amount ? `${selectedTicket.amount} 원` : "금액 정보 없음"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    상태
                  </p>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="신규">신규</SelectItem>
                      <SelectItem value="진행중">진행중</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                      <SelectItem value="해제">해제</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    문의 날짜
                  </p>
                  <p className={isDarkMode ? "text-gray-200" : "text-gray-900"}>
                    {selectedTicket.createdAt}
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender === "admin"
                          ? "bg-orange-500 text-white"
                          : isDarkMode
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">
                          {message.sender === "admin" ? "관리자" : selectedTicket.user}
                        </span>
                        <span className="text-xs ml-2 opacity-70">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="답변을 입력하세요..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                  className={isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    답변 전송
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
