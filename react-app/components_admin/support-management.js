"use client";
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import StatsCards from "./support/StatsCards";
import FilterControls from "./support/FilterControls";
import TicketsTable from "./support/TicketsTable";
import TicketDialog from "./support/TicketDialog";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { getDarkClass, getStatusColors } from "./utils/theme-utils";
// 상수 정의
const INITIAL_TICKETS = [
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
    messages: [{
      id: 1,
      sender: "user",
      message: "어제 출금 신청을 했는데 아직 처리되지 않았습니다. 확인 부탁드립니다.",
      timestamp: "2024-01-15 14:30"
    }]
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
    messages: [{
      id: 1,
      sender: "user",
      message: "KYC 인증을 완료했는데 계정이 아직 인증되지 않았습니다.",
      timestamp: "2024-01-15 10:15"
    }, {
      id: 2,
      sender: "admin",
      message: "안녕하세요. 제출해주신 서류를 검토 중입니다. 추가 서류가 필요할 수 있습니다.",
      timestamp: "2024-01-15 15:20"
    }]
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
    messages: [{
      id: 1,
      sender: "user",
      message: "거래 수수료가 예상보다 높게 나왔는데 확인 부탁드립니다.",
      timestamp: "2024-01-14 16:45"
    }, {
      id: 2,
      sender: "admin",
      message: "확인해보니 정상적으로 적용된 수수료입니다. 자세한 내용은 수수료 안내 페이지를 참고해주세요.",
      timestamp: "2024-01-15 09:30"
    }]
  }
];

const STATUS_CONFIG = {
  "신규": { color: "destructive", icon: AlertCircle },
  "진행중": { color: "secondary", icon: Clock },
  "대기": { color: "secondary", icon: Clock },
  "완료": { color: "default", icon: CheckCircle }
};

const PRIORITY_OPTIONS = ["긴급", "높음", "보통", "낮음"];
const STATUS_OPTIONS = ["신규", "진행중", "대기", "완료"];

export default function SupportManagement({ isDarkMode }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // 필터링된 티켓 목록 (메모이제이션)
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = ticket.subject.toLowerCase().includes(searchLower) ||
                          ticket.user.toLowerCase().includes(searchLower) ||
                          ticket.email.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // 통계 계산 (메모이제이션)
  const stats = useMemo(() => ({
    신규: tickets.filter(t => t.status === "신규").length,
    진행중: tickets.filter(t => t.status === "진행중").length,
    완료: tickets.filter(t => t.status === "완료").length,
    전체: tickets.length
  }), [tickets]);

  // 헬퍼 함수들
  const handleTicketClick = useCallback((ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  }, []);

  const updateTicket = useCallback((ticketId, updates) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId ? { ...ticket, ...updates } : ticket
    ));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, ...updates }));
    }
  }, [selectedTicket]);

  const handleStatusChange = useCallback((ticketId, newStatus) => {
    updateTicket(ticketId, { status: newStatus });
  }, [updateTicket]);

  const handlePriorityChange = useCallback((ticketId, newPriority) => {
    updateTicket(ticketId, { priority: newPriority });
  }, [updateTicket]);
  const handleSendReply = useCallback(() => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    const newMessage = {
      id: selectedTicket.messages.length + 1,
      sender: "admin",
      message: replyMessage,
      timestamp: new Date().toLocaleString("ko-KR")
    };
    
    const updatedTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newMessage],
      lastReply: newMessage.timestamp,
      status: "진행중"
    };
    
    updateTicket(selectedTicket.id, {
      messages: updatedTicket.messages,
      lastReply: updatedTicket.lastReply,
      status: "진행중"
    });
    setSelectedTicket(updatedTicket);
    setReplyMessage("");
  }, [selectedTicket, replyMessage, updateTicket]);

  const getPriorityColor = useCallback((priority) => {
    return ["긴급", "높음"].includes(priority) ? "destructive" : 
           priority === "보통" ? "secondary" : "default";
  }, []);

  const getStatusInfo = useCallback((status) => STATUS_CONFIG[status] || STATUS_CONFIG["완료"], []);
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            1:1 문의 관리
          </h1>
          <p className={`mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            사용자 문의사항을 관리하고 응답합니다
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <StatsCards stats={stats} isDarkMode={isDarkMode} />

      {/* 문의 목록 */}
      <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>
                문의 목록
              </CardTitle>
              <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                총 {filteredTickets.length}개의 문의
              </CardDescription>
            </div>
            <FilterControls
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
            />
          </div>
        </CardHeader>
        <CardContent>
          <TicketsTable
            filteredTickets={filteredTickets}
            isDarkMode={isDarkMode}
            handleTicketClick={handleTicketClick}
            handlePriorityChange={handlePriorityChange}
            handleStatusChange={handleStatusChange}
            getStatusInfo={getStatusInfo}
            getPriorityColor={getPriorityColor}
          />
        </CardContent>
      </Card>

      {/* 문의 상세 다이얼로그 */}
      <TicketDialog
        isOpen={isTicketDialogOpen}
        onClose={() => setIsTicketDialogOpen(false)}
        selectedTicket={selectedTicket}
        isDarkMode={isDarkMode}
        handlePriorityChange={handlePriorityChange}
        handleStatusChange={handleStatusChange}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        handleSendReply={handleSendReply}
      />
    </div>
  );
}