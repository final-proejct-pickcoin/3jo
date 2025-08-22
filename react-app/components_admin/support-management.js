"use client";
import React, { useEffect, useRef, useState } from "react";
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
import axios from "axios";

export default function SupportManagement({ isDarkMode }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);
  // 한 번에 보여줄 페이지 번호 수 설정
  const maxPageButtons = 5;
  const getPageNumbers = () => {
    let start = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
    let end = start + maxPageButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxPageButtons + 1, 1);
    }
    let pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =      
      (ticket.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (ticket.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleTicketClick = async (ticket) => {
    // console.log("선택된 티켓:", ticket);

    try{
      const res = await axios.get(`http://localhost:8000/chat/history/${ticket.user_id}`);
      const messages = res.data.messages || [];
      
      // 티켓에 messages를 보함시켜서 셋팅
      const ticketWithMessages = {
        ...ticket,
        messages
      }

      setSelectedTicket(ticketWithMessages);
      setIsTicketDialogOpen(true);

    }catch(err){
      console.error("채팅 기록 불러오기 실패:", err);
      setSelectedTicket({...ticket, messages:[]});
      setIsTicketDialogOpen(true)
    }

    
  };

  const handleStatusChange = (ticketId, newStatus) => {
    
    setTickets(
      tickets.map((ticket) =>
        ticket.inquiry_id === ticketId
          ? {
              ...ticket,
              status: newStatus,
            }
          : ticket
      )
    );
    
    axios.post("http://localhost:8000/admin/inq-status", null, {
      params: {
        inquiry_id: ticketId,
        status: newStatus
      }
    }).then(()=>{
        setSelectedTicket(prev =>
          prev && prev.inquiry_id === ticketId
            ? { ...prev, status: newStatus }
            : prev
        );

    })
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const newMessage = {
      id: selectedTicket.messages.length + 1,
      sender: "admin",
      message: replyMessage,
      timestamp: new Date().toISOString(),
    };

    // 화면 먼저 업데이트
    setTickets((prev) => 
      prev.map((ticket) => 
        ticket.user_id === selectedTicket.user_id ? {
          ...ticket,
          messages: [...ticket.messages, newMessage],
          lastReply: newMessage.timestamp,
        } : ticket
      )
    );
    setSelectedTicket((prev) => 
      prev ? {...prev, messages: [...prev.messages, newMessage], lastReply: newMessage} : prev
    );

    // 웹소켓으로 전송
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("보내는 메시지:", replyMessage, "WebSocket readyState:", ws.current.readyState);

      ws.current.send(JSON.stringify({
        room_id: selectedTicket.user_id,
        sender: "admin",
        message: replyMessage
      }));
    }else{
      console.log("WebSocket이 연결되어 있지 않습니다.");
    }

    setReplyMessage("");

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

  const getPage = async (requestPage, itemsPerPage) => {

    setCurrentPage(requestPage)

    await axios.get("http://localhost:8000/admin/getinq",{
      params:{
        page: requestPage,
        limit: itemsPerPage
      }
    })
      .then((res) => {
        // console.log(res.data.inquiry)
        // 메세지 - redis에서 저장된 것 가져옮 (handleTicketClick에서 백엔드 요청 -> redis)
        const updatedTickets = res.data.inquiry.map(ticket => ({
          ...ticket,
          messages: ticket.messages || [],  // 기존에 message가 없으면 빈 배열 할당
        }));
        console.log("프론트 문의:", res)
        setTickets(updatedTickets)
        setTotal(res.data.total);
        
      }).catch((error) => {
      console.error("데이터 불러오기 실패:", error);
    });
  }

  useEffect(() => {
    
    getPage(currentPage, itemsPerPage)
    // 웹소켓 - 연결
    // room_id 생성    
    const roomId = selectedTicket?.user_id    
    if(!roomId) return;

    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${roomId}`)
    // console.log(roomId)
    ws.current.onopen = () => {
      console.log("웹소켓 연결됨");
    }

    ws.current.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      console.log(`받은메세지: ${msg}`) // 여기서 ticket / selectedTicet 업데이트 가능
        // 1) tickets 상태 업데이트
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.user_id === selectedTicket?.user_id
            ? { ...ticket, messages: [...(ticket.messages || []), msg] }
            : ticket
        )
      );

      // 2) selectedTicket 상태도 업데이트 (채팅창 열려 있는 경우 즉시 반영)
      setSelectedTicket((prev) =>
        prev
          ? { ...prev, messages: [...(prev.messages || []), msg] }
          : prev
      );
      
      
    }
    // messages 바뀔 때마다 스크롤 아래로.
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); 
    });

    ws.current.onclose = () => {
      console.log("웹소켓 연결 종료")
    }

    return () => {
      if (ws.current) ws.current.close();
    }
    // , selectedTicket?.messages
  },[selectedTicket?.user_id, selectedTicket?.messages])

  // 버튼 클릭 시 페이지 증가
const loadMore = () => {
  if (currentPage < Math.ceil(total / itemsPerPage)) {
    setCurrentPage(currentPage + 1);
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
                  placeholder="사용자 검색..."
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
                  <SelectItem value="all">상태검색</SelectItem>
                  <SelectItem value="신규">신규</SelectItem>
                  <SelectItem value="진행중">진행중</SelectItem>
                  <SelectItem value="완료">완료</SelectItem>
                  <SelectItem value="삭제">삭제</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">내용검색</SelectItem>
                  <SelectItem value="입금">입금</SelectItem>
                  <SelectItem value="출금">출금</SelectItem>
                  <SelectItem value="신고">신고</SelectItem>
                  <SelectItem value="탈퇴">탈퇴</SelectItem>
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
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>신청금액</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>문의날짜</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow
                  key={ticket.inquiry_id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell>
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-gray-200" : ""}`}>
                        {ticket.name}
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
                    <div className={isDarkMode ? "text-gray-300" : ""}>
                      {ticket.amount !== undefined && ticket.amount !== null
                        ? `${ticket.amount.toLocaleString()} 원`
                        : "기타문의"}
                    </div>
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
                    {ticket.created_at.replace("T", ", ").slice(0, -3)}
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
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.inquiry_id, "진행중")}>
                          <Clock className="h-4 w-4 mr-2" />
                          진행중으로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.inquiry_id, "완료")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          완료로 변경
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(ticket.inquiry_id, "대기")}>
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

          {/* 페이지네이션 UI 입력 */}
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button onClick={() => getPage(1)} disabled={currentPage === 1}>
              맨 처음
            </button>
            <button onClick={() => getPage(currentPage - 1)} disabled={currentPage === 1}>
              이전
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => getPage(pageNum)}
                style={{
                  fontWeight: pageNum === currentPage ? 'bold' : 'normal',
                  textDecoration: pageNum === currentPage ? 'underline' : 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: pageNum === currentPage ? '2px solid #2563eb' : '1px solid #ccc',
                  backgroundColor: pageNum === currentPage ? '#bfdbfe' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                {pageNum}
              </button>
            ))}

            <button onClick={() => getPage(currentPage + 1)} disabled={currentPage === total}>
              다음
            </button>
            <button onClick={() => getPage(total)} disabled={currentPage === total}>
              맨 끝
            </button>
          </div>     
        </CardContent>
      </Card>

      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className={`sm:max-w-[700px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
          <DialogHeader>
            <DialogTitle className={isDarkMode ? "text-white" : ""}>
              문의 상세 - #{selectedTicket?.inquiry_id}
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
                    {selectedTicket.name}
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
                  <p className={`isDarkMode ? "text-gray-200" : "text-gray-900"`}>
                    {selectedTicket.amount ? `${selectedTicket.amount.toLocaleString()} 원` : "금액 정보 없음"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    상태
                  </p>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.inquiry_id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent >
                      <SelectItem value="신규">신규</SelectItem>
                      <SelectItem value="진행중">진행중</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                      <SelectItem value="대기">대기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    문의 날짜
                  </p>
                  <p className={isDarkMode ? "text-gray-200" : "text-gray-900"}>
                    {selectedTicket.created_at.replace("T", ", ").slice(0, -3)}
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedTicket.messages.map((message,idx) => (
                  <div
                    key={idx}
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
                          {message.sender === "admin" ? "관리자" : selectedTicket.name}
                        </span>
                        <span className="text-xs ml-2 opacity-70">{new Date(message.timestamp).toLocaleString("ko-KR")}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>                    
                  </div>
                ))}
                {/* 메세지 보내고 스크롤 아래쪽으로 */}
                <div ref={messagesEndRef} />
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
