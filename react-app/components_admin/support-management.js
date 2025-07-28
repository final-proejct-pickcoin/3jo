"use client";
import React from "react";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Textarea } from "@/components_admin/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components_admin/ui/dropdown-menu";
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Search, MoreHorizontal, Send, Eye, Archive } from "lucide-react";
export default function SupportManagement({
  isDarkMode
}) {
  const [tickets, setTickets] = useState([{
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
  }, {
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
  }, {
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
  }]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
  const handleTicketClick = ticket => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };
  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(tickets.map(ticket => ticket.id === ticketId ? {
      ...ticket,
      status: newStatus
    } : ticket));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        status: newStatus
      });
    }
  };
  const handlePriorityChange = (ticketId, newPriority) => {
    setTickets(tickets.map(ticket => ticket.id === ticketId ? {
      ...ticket,
      priority: newPriority
    } : ticket));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({
        ...selectedTicket,
        priority: newPriority
      });
    }
  };
  const handleSendReply = () => {
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
    setTickets(tickets.map(ticket => ticket.id === selectedTicket.id ? updatedTicket : ticket));
    setSelectedTicket(updatedTicket);
    setReplyMessage("");
  };
  const getPriorityColor = priority => {
    switch (priority) {
      case "긴급":
        return "destructive";
      case "높음":
        return "destructive";
      case "보통":
        return "secondary";
      case "낮음":
        return "default";
      default:
        return "default";
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case "신규":
        return "destructive";
      case "진행중":
        return "secondary";
      case "대기":
        return "secondary";
      case "완료":
        return "default";
      default:
        return "default";
    }
  };
  const getStatusIcon = status => {
    switch (status) {
      case "신규":
        return /*#__PURE__*/React.createElement(AlertCircle, {
          className: "h-4 w-4"
        });
      case "진행중":
        return /*#__PURE__*/React.createElement(Clock, {
          className: "h-4 w-4"
        });
      case "대기":
        return /*#__PURE__*/React.createElement(Clock, {
          className: "h-4 w-4"
        });
      case "완료":
        return /*#__PURE__*/React.createElement(CheckCircle, {
          className: "h-4 w-4"
        });
      default:
        return /*#__PURE__*/React.createElement(Clock, {
          className: "h-4 w-4"
        });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, "1:1 \uBB38\uC758 \uAD00\uB9AC"), /*#__PURE__*/React.createElement("p", {
    className: `${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`
  }, "\uC0AC\uC6A9\uC790 \uBB38\uC758\uC0AC\uD56D\uC744 \uAD00\uB9AC\uD558\uACE0 \uC751\uB2F5\uD569\uB2C8\uB2E4"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-4 gap-6"
  }, /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC2E0\uADDC \uBB38\uC758"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, tickets.filter(t => t.status === "신규").length)), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(AlertCircle, {
    className: "h-6 w-6 text-red-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC9C4\uD589\uC911"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, tickets.filter(t => t.status === "진행중").length)), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Clock, {
    className: "h-6 w-6 text-yellow-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC644\uB8CC"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, tickets.filter(t => t.status === "완료").length)), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-6 w-6 text-green-600"
  }))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardContent, {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC804\uCCB4 \uBB38\uC758"), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`
  }, tickets.length)), /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(MessageSquare, {
    className: "h-6 w-6 text-blue-600"
  })))))), /*#__PURE__*/React.createElement(Card, {
    className: isDarkMode ? "bg-gray-800 border-gray-700" : ""
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CardTitle, {
    className: isDarkMode ? "text-white" : "text-gray-900"
  }, "\uBB38\uC758 \uBAA9\uB85D"), /*#__PURE__*/React.createElement(CardDescription, {
    className: isDarkMode ? "text-gray-400" : "text-gray-600"
  }, "\uCD1D ", filteredTickets.length, "\uAC1C\uC758 \uBB38\uC758")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4 text-gray-400"
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "\uBB38\uC758 \uAC80\uC0C9...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    className: "w-64"
  })), /*#__PURE__*/React.createElement(Select, {
    value: statusFilter,
    onValueChange: setStatusFilter
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, {
    placeholder: "\uC0C1\uD0DC"
  })), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "all"
  }, "\uC804\uCCB4"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC2E0\uADDC"
  }, "\uC2E0\uADDC"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC9C4\uD589\uC911"
  }, "\uC9C4\uD589\uC911"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB300\uAE30"
  }, "\uB300\uAE30"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC644\uB8CC"
  }, "\uC644\uB8CC"))), /*#__PURE__*/React.createElement(Select, {
    value: priorityFilter,
    onValueChange: setPriorityFilter
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, {
    placeholder: "\uC6B0\uC120\uC21C\uC704"
  })), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "all"
  }, "\uC804\uCCB4"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uAE34\uAE09"
  }, "\uAE34\uAE09"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB192\uC74C"
  }, "\uB192\uC74C"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uBCF4\uD1B5"
  }, "\uBCF4\uD1B5"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB0AE\uC74C"
  }, "\uB0AE\uC74C")))))), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement(Table, null, /*#__PURE__*/React.createElement(TableHeader, null, /*#__PURE__*/React.createElement(TableRow, null, /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "ID"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC0AC\uC6A9\uC790"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC81C\uBAA9"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uCE74\uD14C\uACE0\uB9AC"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC6B0\uC120\uC21C\uC704"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC0C1\uD0DC"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC0DD\uC131\uC77C"), /*#__PURE__*/React.createElement(TableHead, {
    className: isDarkMode ? "text-gray-300" : ""
  }, "\uC561\uC158"))), /*#__PURE__*/React.createElement(TableBody, null, filteredTickets.map(ticket => /*#__PURE__*/React.createElement(TableRow, {
    key: ticket.id,
    className: "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
  }, /*#__PURE__*/React.createElement(TableCell, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, "#", ticket.id), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, ticket.user), /*#__PURE__*/React.createElement("p", {
    className: `text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`
  }, ticket.email))), /*#__PURE__*/React.createElement(TableCell, {
    className: `font-medium ${isDarkMode ? "text-gray-200" : ""}`
  }, ticket.subject), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Badge, {
    variant: "outline"
  }, ticket.category)), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(Select, {
    value: ticket.priority,
    onValueChange: value => handlePriorityChange(ticket.id, value)
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-20"
  }, /*#__PURE__*/React.createElement(SelectValue, null)), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uAE34\uAE09"
  }, "\uAE34\uAE09"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB192\uC74C"
  }, "\uB192\uC74C"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uBCF4\uD1B5"
  }, "\uBCF4\uD1B5"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB0AE\uC74C"
  }, "\uB0AE\uC74C")))), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, getStatusIcon(ticket.status), /*#__PURE__*/React.createElement(Badge, {
    variant: getStatusColor(ticket.status),
    className: "ml-2"
  }, ticket.status))), /*#__PURE__*/React.createElement(TableCell, {
    className: isDarkMode ? "text-gray-300" : ""
  }, ticket.createdAt), /*#__PURE__*/React.createElement(TableCell, null, /*#__PURE__*/React.createElement(DropdownMenu, null, /*#__PURE__*/React.createElement(DropdownMenuTrigger, {
    asChild: true
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, /*#__PURE__*/React.createElement(MoreHorizontal, {
    className: "h-4 w-4"
  }))), /*#__PURE__*/React.createElement(DropdownMenuContent, null, /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleTicketClick(ticket)
  }, /*#__PURE__*/React.createElement(Eye, {
    className: "h-4 w-4 mr-2"
  }), "\uC0C1\uC138 \uBCF4\uAE30"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleStatusChange(ticket.id, "진행중")
  }, /*#__PURE__*/React.createElement(Clock, {
    className: "h-4 w-4 mr-2"
  }), "\uC9C4\uD589\uC911\uC73C\uB85C \uBCC0\uACBD"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleStatusChange(ticket.id, "완료")
  }, /*#__PURE__*/React.createElement(CheckCircle, {
    className: "h-4 w-4 mr-2"
  }), "\uC644\uB8CC\uB85C \uBCC0\uACBD"), /*#__PURE__*/React.createElement(DropdownMenuItem, {
    onClick: () => handleStatusChange(ticket.id, "대기")
  }, /*#__PURE__*/React.createElement(Archive, {
    className: "h-4 w-4 mr-2"
  }), "\uB300\uAE30\uB85C \uBCC0\uACBD")))))))))), /*#__PURE__*/React.createElement(Dialog, {
    open: isTicketDialogOpen,
    onOpenChange: setIsTicketDialogOpen
  }, /*#__PURE__*/React.createElement(DialogContent, {
    className: `sm:max-w-[700px] ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`
  }, /*#__PURE__*/React.createElement(DialogHeader, null, /*#__PURE__*/React.createElement(DialogTitle, {
    className: isDarkMode ? "text-white" : ""
  }, "\uBB38\uC758 \uC0C1\uC138 - #", selectedTicket?.id), /*#__PURE__*/React.createElement(DialogDescription, {
    className: isDarkMode ? "text-gray-400" : ""
  }, selectedTicket?.subject)), selectedTicket && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `grid grid-cols-2 gap-4 p-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"} rounded-lg`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC0AC\uC6A9\uC790"), /*#__PURE__*/React.createElement("p", {
    className: isDarkMode ? "text-gray-200" : "text-gray-900"
  }, selectedTicket.user)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC774\uBA54\uC77C"), /*#__PURE__*/React.createElement("p", {
    className: isDarkMode ? "text-gray-200" : "text-gray-900"
  }, selectedTicket.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uCE74\uD14C\uACE0\uB9AC"), /*#__PURE__*/React.createElement(Badge, {
    variant: "outline"
  }, selectedTicket.category)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC6B0\uC120\uC21C\uC704"), /*#__PURE__*/React.createElement(Select, {
    value: selectedTicket.priority,
    onValueChange: value => handlePriorityChange(selectedTicket.id, value)
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, null)), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uAE34\uAE09"
  }, "\uAE34\uAE09"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB192\uC74C"
  }, "\uB192\uC74C"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uBCF4\uD1B5"
  }, "\uBCF4\uD1B5"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB0AE\uC74C"
  }, "\uB0AE\uC74C")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC0C1\uD0DC"), /*#__PURE__*/React.createElement(Select, {
    value: selectedTicket.status,
    onValueChange: value => handleStatusChange(selectedTicket.id, value)
  }, /*#__PURE__*/React.createElement(SelectTrigger, {
    className: "w-32"
  }, /*#__PURE__*/React.createElement(SelectValue, null)), /*#__PURE__*/React.createElement(SelectContent, null, /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC2E0\uADDC"
  }, "\uC2E0\uADDC"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC9C4\uD589\uC911"
  }, "\uC9C4\uD589\uC911"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uB300\uAE30"
  }, "\uB300\uAE30"), /*#__PURE__*/React.createElement(SelectItem, {
    value: "\uC644\uB8CC"
  }, "\uC644\uB8CC")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`
  }, "\uC0DD\uC131\uC77C"), /*#__PURE__*/React.createElement("p", {
    className: isDarkMode ? "text-gray-200" : "text-gray-900"
  }, selectedTicket.createdAt))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 max-h-96 overflow-y-auto"
  }, selectedTicket.messages.map(message => /*#__PURE__*/React.createElement("div", {
    key: message.id,
    className: `flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `max-w-[70%] p-3 rounded-lg ${message.sender === "admin" ? "bg-orange-500 text-white" : isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-900"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mb-2"
  }, /*#__PURE__*/React.createElement(User, {
    className: "h-4 w-4 mr-2"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium"
  }, message.sender === "admin" ? "관리자" : selectedTicket.user), /*#__PURE__*/React.createElement("span", {
    className: "text-xs ml-2 opacity-70"
  }, message.timestamp)), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, message.message))))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement(Textarea, {
    placeholder: "\uB2F5\uBCC0\uC744 \uC785\uB825\uD558\uC138\uC694...",
    value: replyMessage,
    onChange: e => setReplyMessage(e.target.value),
    rows: 3,
    className: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: handleSendReply,
    disabled: !replyMessage.trim()
  }, /*#__PURE__*/React.createElement(Send, {
    className: "h-4 w-4 mr-2"
  }), "\uB2F5\uBCC0 \uC804\uC1A1")))))));
}