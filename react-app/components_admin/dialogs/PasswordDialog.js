import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { Alert, AlertDescription } from "@/components_admin/ui/alert";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

const PASSWORD_FIELDS = [
  { id: "current-password", label: "현재 비밀번호", field: "currentPassword", show: "current" },
  { id: "new-password", label: "새 비밀번호", field: "newPassword", show: "new" },
  { id: "confirm-password", label: "새 비밀번호 확인", field: "confirmPassword", show: "confirm" }
];

export const PasswordDialog = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  passwordData, 
  showPasswords,
  passwordError,
  handleInputChange, 
  togglePasswordVisibility,
  handlePasswordChange,
  getDarkClass 
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className={`sm:max-w-[425px] ${getDarkClass("", "bg-gray-800 border-gray-700")(isDarkMode)}`}>
      <DialogHeader>
        <DialogTitle className={getDarkClass("", "text-white")(isDarkMode)}>비밀번호 변경</DialogTitle>
        <DialogDescription className={getDarkClass("", "text-gray-400")(isDarkMode)}>
          보안을 위해 현재 비밀번호를 확인한 후 새 비밀번호를 설정합니다.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        {PASSWORD_FIELDS.map(({ id, label, field, show }) => (
          <div key={id} className="grid gap-2">
            <Label htmlFor={id} className={getDarkClass("", "text-gray-300")(isDarkMode)}>{label}</Label>
            <div className="relative">
              <Input
                id={id}
                type={showPasswords[show] ? "text" : "password"}
                value={passwordData[field]}
                onChange={handleInputChange(field)}
                className={`pr-10 ${getDarkClass("", "bg-gray-700 border-gray-600 text-gray-200")(isDarkMode)}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility(show)}
              >
                {showPasswords[show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
        
        {passwordError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}
        
        <div className={`text-xs ${getDarkClass("text-gray-500", "text-gray-400")(isDarkMode)} mt-2`}>
          <p>비밀번호 요구사항:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>최소 8자 이상</li>
            <li>영문, 숫자, 특수문자 조합 권장</li>
          </ul>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={() => handlePasswordChange(onClose)}>변경</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
