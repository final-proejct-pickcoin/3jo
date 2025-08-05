"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Checkbox } from "@/components_admin/ui/checkbox";
import { Download, Archive, Trash2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

const LogManagement = ({ isDarkMode }) => {
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [logLevelFilter, setLogLevelFilter] = useState("전체");
  const [dateFilter, setDateFilter] = useState("2024-01-15");
  
  // 로그 데이터를 상태로 관리
  const [logs, setLogs] = useState([
    { 
      id: 1, 
      timestamp: "2024-01-15 14:30:25", 
      level: "INFO", 
      user: "user123", 
      action: "로그인", 
      ip: "192.168.1.100", 
      status: "성공" 
    },
    { 
      id: 2, 
      timestamp: "2024-01-15 14:28:15", 
      level: "INFO", 
      user: "user456", 
      action: "거래 체결", 
      ip: "192.168.1.101", 
      status: "성공" 
    },
    { 
      id: 3, 
      timestamp: "2024-01-15 14:25:10", 
      level: "WARN", 
      user: "user789", 
      action: "출금 요청", 
      ip: "192.168.1.102", 
      status: "대기" 
    },
    { 
      id: 4, 
      timestamp: "2024-01-15 14:22:05", 
      level: "ERROR", 
      user: "suspicious_user", 
      action: "로그인 실패", 
      ip: "192.168.1.103", 
      status: "실패" 
    }
  ]);

  const filteredLogs = logs.filter(log => {
    const levelMatch = logLevelFilter === "전체" || log.level === logLevelFilter;
    const dateMatch = !dateFilter || log.timestamp.startsWith(dateFilter);
    return levelMatch && dateMatch;
  });

  const handleSelectAll = (checked) => {
    setSelectedLogs(checked ? filteredLogs.map(log => log.id) : []);
  };

  const handleSelectLog = (logId, checked) => {
    setSelectedLogs(prev => 
      checked ? [...prev, logId] : prev.filter(id => id !== logId)
    );
  };

  const getBadgeVariant = (level) => {
    switch(level) {
      case "ERROR": return "destructive";
      case "WARN": return "secondary";
      case "INFO": return "default";
      default: return "default";
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case "성공": return "default";
      case "실패": return "destructive";
      case "대기": return "secondary";
      default: return "default";
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case "성공": return "bg-green-100 text-green-700 border border-green-200";
      case "실패": return "bg-red-100 text-red-700 border border-red-200";
      case "대기": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const handleExport = () => {
    if (selectedLogs.length === 0) {
      return;
    }
    
    const selectedLogData = logs.filter(log => selectedLogs.includes(log.id));
    const csvContent = [
      ["시간", "레벨", "사용자", "액션", "IP", "상태"].join(","),
      ...selectedLogData.map(log => [
        log.timestamp,
        log.level,
        log.user,
        log.action,
        log.ip,
        log.status
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (selectedLogs.length === 0) {
      return;
    }
    
    // 실제로 로그 목록에서 선택된 로그들을 제거
    setLogs(prevLogs => prevLogs.filter(log => !selectedLogs.includes(log.id)));
    setSelectedLogs([]);
  };

  const handleArchive = () => {
    if (selectedLogs.length === 0) {
      return;
    }
    
    // 실제로는 서버에 아카이브 요청을 보내야 합니다.
    const selectedLogData = logs.filter(log => selectedLogs.includes(log.id));
    console.log("아카이브된 로그:", selectedLogData);
    
    setSelectedLogs([]);
  };

  const handleRefresh = () => {
    // 실제로는 서버에서 최신 로그를 가져와야 합니다.
    // 여기서는 시뮬레이션으로 새로운 로그를 추가합니다.
    const newLog = {
      id: logs.length + 1,
      timestamp: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\. /g, '-').replace(/\./g, '').replace(',', ''),
      level: "INFO",
      user: "current_user",
      action: "페이지 새로고침",
      ip: "192.168.1.105",
      status: "성공"
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs]);
    setSelectedLogs([]);
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
      {/* 헤더 */}
      <div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>로그 관리</h1>
        <p className={`${isDarkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>시스템 로그를 검색하고 분석합니다</p>
      </div>

      {/* 컨트롤 섹션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleExport}
            variant="outline" 
            size="sm"
            disabled={selectedLogs.length === 0}
            className={`${isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""} ${
              selectedLogs.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Download className="h-4 w-4 mr-2" />
            내보내기 ({selectedLogs.length})
          </Button>
          <Button 
            onClick={handleDelete}
            variant="outline" 
            size="sm"
            disabled={selectedLogs.length === 0}
            className={`${isDarkMode ? "border-gray-600 text-red-400 hover:bg-gray-700" : "text-red-600"} ${
              selectedLogs.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            삭제 ({selectedLogs.length})
          </Button>
          <Button 
            onClick={handleArchive}
            variant="outline" 
            size="sm"
            disabled={selectedLogs.length === 0}
            className={`${isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""} ${
              selectedLogs.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Archive className="h-4 w-4 mr-2" />
            아카이브 ({selectedLogs.length})
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            className={isDarkMode ? "border-gray-600 text-gray-200 hover:bg-gray-700" : ""}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
            <SelectTrigger className={`w-40 ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDarkMode ? "bg-gray-700 border-gray-600" : ""}>
              <SelectItem value="전체">전체</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`}
          />
        </div>
      </div>

      {/* 시스템 로그 카드 */}
      <Card className={isDarkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader>
          <CardTitle className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            시스템 로그
          </CardTitle>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            실시간 시스템 활동 로그
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={isDarkMode ? "border-gray-700" : ""}>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>
                  <Checkbox 
                    checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>시간</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>레벨</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>사용자</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>액션</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>IP</TableHead>
                <TableHead className={isDarkMode ? "text-gray-300" : ""}>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className={isDarkMode ? "border-gray-700" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedLogs.includes(log.id)}
                      onCheckedChange={(checked) => handleSelectLog(log.id, checked)}
                    />
                  </TableCell>
                  <TableCell className={isDarkMode ? "text-gray-300" : ""}>{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(log.level)}>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell className={isDarkMode ? "text-gray-300" : ""}>{log.user}</TableCell>
                  <TableCell className={isDarkMode ? "text-gray-300" : ""}>{log.action}</TableCell>
                  <TableCell className={isDarkMode ? "text-gray-300" : ""}>{log.ip}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(log.status)}`}>
                      {log.status === "성공" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {log.status === "실패" && <XCircle className="h-3 w-3 mr-1" />}
                      {log.status === "대기" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {log.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogManagement;
