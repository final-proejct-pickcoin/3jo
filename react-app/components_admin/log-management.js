import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components_admin/ui/table";
import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Checkbox } from "@/components_admin/ui/checkbox";
import { Download, Archive, Trash2 } from "lucide-react";

// 상수 정의
const BADGE_VARIANTS = {
  level: {
    error: "destructive",
    warn: "secondary", 
    info: "default"
  },
  status: {
    "성공": "default",
    "실패": "destructive",
    "대기": "secondary"
  }
};

const LOG_LEVEL_OPTIONS = [
  { value: "all", label: "모든 레벨" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" }
];

// 메모화된 로그 관리 컴포넌트
const LogManagement = memo(({ 
  isDarkMode,
  logs,
  logLevelFilter,
  setLogLevelFilter,
  filteredLogs,
  selectedLogs,
  setSelectedLogs,
  handleExportLogs,
  handleDeleteSelectedLogs,
  handleArchiveSelectedLogs
}) => {
  const handleSelectAll = (checked) => {
    setSelectedLogs(checked ? filteredLogs.map(log => log.id) : []);
  };

  const handleSelectLog = (logId, checked) => {
    setSelectedLogs(prev => 
      checked ? [...prev, logId] : prev.filter(id => id !== logId)
    );
  };

  const getBadgeVariant = (type, value) => 
    BADGE_VARIANTS[type]?.[value] || "default";

  const darkClass = (className) => isDarkMode ? className : "";

  const allSelected = selectedLogs.length === filteredLogs.length && filteredLogs.length > 0;
  const hasSelection = selectedLogs.length > 0;

  return (
    <Card className={darkClass("bg-gray-800 border-gray-700")}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className={darkClass("text-white")}>시스템 로그</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="레벨" />
              </SelectTrigger>
              <SelectContent>
                {LOG_LEVEL_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {hasSelection && (
              <>
                {[
                  { icon: Download, label: "내보내기", handler: handleExportLogs },
                  { icon: Archive, label: "보관", handler: handleArchiveSelectedLogs },
                  { icon: Trash2, label: "삭제", handler: handleDeleteSelectedLogs }
                ].map(({ icon: Icon, label, handler }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={handler}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className={darkClass("border-gray-700")}>
                <TableHead className={darkClass("text-gray-300")}>
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
                {["시간", "사용자", "액션", "IP 주소", "상태", "레벨"].map(header => (
                  <TableHead key={header} className={darkClass("text-gray-300")}>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className={darkClass("border-gray-700")}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLogs.includes(log.id)}
                      onCheckedChange={(checked) => handleSelectLog(log.id, checked)}
                    />
                  </TableCell>
                  <TableCell className={`font-mono text-sm ${darkClass("text-gray-300")}`}>
                    {log.timestamp}
                  </TableCell>
                  <TableCell className={darkClass("text-gray-300")}>{log.user}</TableCell>
                  <TableCell className={darkClass("text-gray-300")}>{log.action}</TableCell>
                  <TableCell className={`font-mono ${darkClass("text-gray-300")}`}>
                    {log.ip}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant("status", log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant("level", log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

export default LogManagement;
