import { Badge } from "@/components_admin/ui/badge";
import { Button } from "@/components_admin/ui/button";
import { Textarea } from "@/components_admin/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { User, Send } from "lucide-react";
import { getDarkClass, getStatusColors, getPriorityColors } from "../utils/theme-utils";

// 상수 정의
const OPTIONS = {
  priority: ["긴급", "높음", "보통", "낮음"],
  status: ["신규", "진행중", "대기", "완료"]
};

const TicketDialog = ({ 
  isOpen, 
  onClose, 
  selectedTicket, 
  isDarkMode, 
  handlePriorityChange, 
  handleStatusChange, 
  replyMessage, 
  setReplyMessage, 
  handleSendReply 
}) => {
  if (!selectedTicket) return null;

  // 정보 필드 렌더링
  const renderInfoField = (label, value, isSelect = false, type = null) => (
    <div>
      <p className={`text-sm font-medium ${getDarkClass("text-gray-600", "text-gray-300")}`}>
        {label}
      </p>
      {isSelect ? (
        <Select
          value={value}
          onValueChange={(newValue) => 
            type === "priority" 
              ? handlePriorityChange(selectedTicket.id, newValue)
              : handleStatusChange(selectedTicket.id, newValue)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPTIONS[type].map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : typeof value === "string" ? (
        <p className={getDarkClass("text-gray-900", "text-gray-200")}>
          {value}
        </p>
      ) : (
        value
      )}
    </div>
  );

  // 메시지 스타일링
  const getMessageStyle = (sender) => {
    if (sender === "admin") return "bg-orange-500 text-white";
    return getDarkClass("bg-gray-100 text-gray-900", "bg-gray-700 text-gray-200");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[700px] ${getDarkClass("", "bg-gray-800 border-gray-700")}`}>
        <DialogHeader>
          <DialogTitle className={getDarkClass("", "text-white")}>
            문의 상세 - #{selectedTicket.id}
          </DialogTitle>
          <DialogDescription className={getDarkClass("", "text-gray-400")}>
            {selectedTicket.subject}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 티켓 정보 */}
          <div className={`grid grid-cols-2 gap-4 p-4 ${getDarkClass("bg-gray-50", "bg-gray-700")} rounded-lg`}>
            {renderInfoField("사용자", selectedTicket.user)}
            {renderInfoField("이메일", selectedTicket.email)}
            {renderInfoField("카테고리", <Badge variant="outline">{selectedTicket.category}</Badge>)}
            {renderInfoField("우선순위", selectedTicket.priority, true, "priority")}
            {renderInfoField("상태", selectedTicket.status, true, "status")}
            {renderInfoField("생성일", selectedTicket.createdAt)}
          </div>

          {/* 메시지 히스토리 */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedTicket.messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] p-3 rounded-lg ${getMessageStyle(message.sender)}`}>
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      {message.sender === "admin" ? "관리자" : selectedTicket.user}
                    </span>
                    <span className="text-xs ml-2 opacity-70">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 답변 입력 */}
          <div className="space-y-3">
            <Textarea
              placeholder="답변을 입력하세요..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={3}
              className={getDarkClass("", "bg-gray-700 border-gray-600 text-gray-200")}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendReply}
                disabled={!replyMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                답변 전송
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDialog;
