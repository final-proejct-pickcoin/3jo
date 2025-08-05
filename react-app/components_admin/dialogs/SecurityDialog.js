import { Button } from "@/components_admin/ui/button";
import { Label } from "@/components_admin/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { Switch } from "@/components_admin/ui/switch";
import { Separator } from "@/components_admin/ui/separator";
import { Shield, Smartphone, Mail, CheckCircle } from "lucide-react";

const NOTIFICATION_SETTINGS = [
  { 
    setting: "emailNotifications", 
    icon: Mail, 
    iconColor: "text-orange-500",
    label: "이메일 알림", 
    description: "중요한 보안 이벤트 시 이메일 발송" 
  },
  { 
    setting: "loginAlerts", 
    icon: Shield, 
    iconColor: "text-red-500",
    label: "로그인 알림", 
    description: "새로운 기기에서 로그인 시 알림" 
  }
];

export const SecurityDialog = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  securitySettings,
  toggleSecuritySetting,
  handleSecuritySave,
  getDarkClass 
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className={`sm:max-w-[525px] ${getDarkClass("", "bg-gray-800 border-gray-700")(isDarkMode)}`}>
      <DialogHeader>
        <DialogTitle className={getDarkClass("", "text-white")(isDarkMode)}>보안 설정</DialogTitle>
        <DialogDescription className={getDarkClass("", "text-gray-400")(isDarkMode)}>
          계정 보안 및 알림 설정을 관리합니다.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* 인증 설정 */}
        <div className="space-y-4">
          <h4 className={`font-medium ${getDarkClass("text-gray-900", "text-white")(isDarkMode)}`}>인증 설정</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <div>
                  <Label className={`font-medium ${getDarkClass("", "text-gray-200")(isDarkMode)}`}>2단계 인증</Label>
                  <p className={`text-sm ${getDarkClass("text-gray-600", "text-gray-400")(isDarkMode)}`}>
                    모바일 앱을 통한 추가 보안 인증
                  </p>
                </div>
              </div>
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={toggleSecuritySetting("twoFactorEnabled")}
              />
            </div>
            
            {securitySettings.twoFactorEnabled && (
              <div className={`ml-8 p-3 ${getDarkClass("bg-green-50", "bg-green-900/20")(isDarkMode)} rounded-lg`}>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className={`text-sm ${getDarkClass("text-green-700", "text-green-400")(isDarkMode)}`}>
                    2단계 인증이 활성화되어 있습니다
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className={getDarkClass("", "bg-gray-700")(isDarkMode)} />

        {/* 알림 설정 */}
        <div className="space-y-4">
          <h4 className={`font-medium ${getDarkClass("text-gray-900", "text-white")(isDarkMode)}`}>알림 설정</h4>
          <div className="space-y-3">
            {NOTIFICATION_SETTINGS.map(({ setting, icon: Icon, iconColor, label, description }) => (
              <div key={setting} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                  <div>
                    <Label className={`font-medium ${getDarkClass("", "text-gray-200")(isDarkMode)}`}>{label}</Label>
                    <p className={`text-sm ${getDarkClass("text-gray-600", "text-gray-400")(isDarkMode)}`}>{description}</p>
                  </div>
                </div>
                <Switch
                  checked={securitySettings[setting]}
                  onCheckedChange={toggleSecuritySetting(setting)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator className={getDarkClass("", "bg-gray-700")(isDarkMode)} />

        {/* 세션 관리 */}
        <div className="space-y-4">
          <h4 className={`font-medium ${getDarkClass("text-gray-900", "text-white")(isDarkMode)}`}>세션 관리</h4>
          <div className="flex items-center justify-between">
            <div>
              <Label className={`font-medium ${getDarkClass("", "text-gray-200")(isDarkMode)}`}>자동 로그아웃</Label>
              <p className={`text-sm ${getDarkClass("text-gray-600", "text-gray-400")(isDarkMode)}`}>
                30분 비활성 시 자동 로그아웃
              </p>
            </div>
            <Switch
              checked={securitySettings.sessionTimeout}
              onCheckedChange={toggleSecuritySetting("sessionTimeout")}
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={() => handleSecuritySave(onClose)}>저장</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
