import { Button } from "@/components_admin/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components_admin/ui/card";
import { Mail, Phone } from "lucide-react";

const SHORTCUTS = [
  { label: "새로고침", shortcut: "Ctrl + R" },
  { label: "검색", shortcut: "Ctrl + F" },
  { label: "다크모드 전환", shortcut: "Ctrl + D" }
];

const FEATURES = [
  { title: "대시보드", description: "실시간 시스템 현황과 주요 지표를 확인할 수 있습니다." },
  { title: "사용자 관리", description: "사용자 계정 상태를 관리하고 상세 정보를 확인할 수 있습니다." },
  { title: "1:1 문의", description: "사용자 문의사항에 실시간으로 응답할 수 있습니다." }
];

const CONTACT_INFO = [
  { icon: Mail, color: "text-blue-500", info: "support@pickcoin.com" },
  { icon: Phone, color: "text-green-500", info: "1588-1234" }
];

export const HelpDialog = ({ isOpen, onClose, isDarkMode, getDarkClass }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className={`sm:max-w-[600px] ${getDarkClass("", "bg-gray-800 border-gray-700")(isDarkMode)}`}>
      <DialogHeader>
        <DialogTitle className={getDarkClass("", "text-white")(isDarkMode)}>도움말</DialogTitle>
        <DialogDescription className={getDarkClass("", "text-gray-400")(isDarkMode)}>
          PickCoin 관리자 시스템 사용법을 안내합니다.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
        {/* 주요 기능 */}
        <Card className={getDarkClass("", "bg-gray-700 border-gray-600")(isDarkMode)}>
          <CardHeader>
            <CardTitle className={`text-lg ${getDarkClass("", "text-white")(isDarkMode)}`}>주요 기능</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map(({ title, description }) => (
              <div key={title}>
                <h4 className={`font-medium ${getDarkClass("", "text-gray-200")(isDarkMode)}`}>{title}</h4>
                <p className={`text-sm ${getDarkClass("text-gray-600", "text-gray-400")(isDarkMode)}`}>{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 단축키 */}
        <Card className={getDarkClass("", "bg-gray-700 border-gray-600")(isDarkMode)}>
          <CardHeader>
            <CardTitle className={`text-lg ${getDarkClass("", "text-white")(isDarkMode)}`}>단축키</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SHORTCUTS.map(({ label, shortcut }) => (
              <div key={label} className="flex justify-between">
                <span className={`text-sm ${getDarkClass("", "text-gray-300")(isDarkMode)}`}>{label}</span>
                <code className={`text-xs px-2 py-1 rounded ${getDarkClass("bg-gray-100", "bg-gray-600 text-gray-200")(isDarkMode)}`}>
                  {shortcut}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 문의하기 */}
        <Card className={getDarkClass("", "bg-gray-700 border-gray-600")(isDarkMode)}>
          <CardHeader>
            <CardTitle className={`text-lg ${getDarkClass("", "text-white")(isDarkMode)}`}>문의하기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${getDarkClass("text-gray-600", "text-gray-400")(isDarkMode)} mb-3`}>
              시스템 사용 중 문제가 발생하면 아래 연락처로 문의해주세요.
            </p>
            <div className="space-y-2">
              {CONTACT_INFO.map(({ icon: Icon, color, info }) => (
                <div key={info} className="flex items-center">
                  <Icon className={`h-4 w-4 mr-2 ${color}`} />
                  <span className={`text-sm ${getDarkClass("", "text-gray-300")(isDarkMode)}`}>{info}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DialogFooter>
        <Button onClick={onClose}>확인</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
