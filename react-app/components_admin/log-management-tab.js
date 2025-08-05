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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components_admin/ui/select";
import { Checkbox } from "@/components_admin/ui/checkbox";
import { Download, Archive, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const LogManagementTab = memo(({
  logLevelFilter,
  setLogLevelFilter,
  filteredLogs,
  selectedLogs,
  setSelectedLogs,
  allLogsSelected,
  hasSelectedLogs,
  getBadgeVariant,
  onExportLogs,
  onArchiveSelected,
  onDeleteSelected,
  getCardClass,
  getTextClass,
  getDescriptionClass
}) => {
  // 유틸리티 함수들
  const getLogLevelIcon = (level) => ({
    error: <XCircle className="h-4 w-4 text-red-500 mr-1" />,
    warn: <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />,
    info: <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
  }[level]);

  const handleSelectAll = (checked) => 
    setSelectedLogs(checked ? filteredLogs.map(log => log.id) : []);

  const handleSelectLog = (logId, checked) => 
    setSelectedLogs(checked 
      ? [...selectedLogs, logId]
      : selectedLogs.filter(id => id !== logId));
  return (
    <Card className={getCardClass()}>
      <CardHeader>
        <CardTitle className={getTextClass()}>시스템 로그</CardTitle>
        <CardDescription className={getDescriptionClass()}>
          시스템 활동과 사용자 행동을 모니터링합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="로그 레벨" />
            </SelectTrigger>
            <SelectContent>
              {['all', 'info', 'warn', 'error'].map(level => (
                <SelectItem key={level} value={level}>
                  {level === 'all' ? '모든 레벨' : level === 'warn' ? 'Warning' : level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex space-x-2">
            {[
              { onClick: onExportLogs, icon: Download, text: '내보내기', variant: 'outline' },
              { onClick: onArchiveSelected, icon: Archive, text: '아카이브', variant: 'outline' },
              { onClick: onDeleteSelected, icon: Trash2, text: '삭제', variant: 'destructive' }
            ].map(({ onClick, icon: Icon, text, variant }) => (
              <Button
                key={text}
                variant={variant}
                onClick={onClick}
                disabled={!hasSelectedLogs}
              >
                <Icon className="mr-2 h-4 w-4" />
                {text}
              </Button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={allLogsSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              {['시간', '사용자', '액션', 'IP', '상태', '레벨'].map(header => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLogs.includes(log.id)}
                    onCheckedChange={(checked) => handleSelectLog(log.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="font-mono">{log.ip}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant.logStatus(log.status)}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getLogLevelIcon(log.level)}
                    <span className="text-sm capitalize">{log.level}</span>
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

LogManagementTab.displayName = "LogManagementTab";

export default LogManagementTab;
