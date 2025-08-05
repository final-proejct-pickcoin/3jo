import { Button } from "@/components_admin/ui/button";
import { Input } from "@/components_admin/ui/input";
import { Label } from "@/components_admin/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components_admin/ui/dialog";
import { User, Mail, Phone, Building } from "lucide-react";
import { getDarkClass } from "../utils/theme-utils";

const PROFILE_FIELDS = [
  { id: "name", label: "이름", icon: User, field: "name" },
  { id: "email", label: "이메일", icon: Mail, field: "email", type: "email" },
  { id: "phone", label: "전화번호", icon: Phone, field: "phone" },
  { id: "department", label: "부서", icon: Building, field: "role" }
];

export const ProfileDialog = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  profileData, 
  handleInputChange, 
  handleProfileSave
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className={`sm:max-w-[425px] ${getDarkClass("", "bg-gray-800 border-gray-700")(isDarkMode)}`}>
      <DialogHeader>
        <DialogTitle className={getDarkClass("", "text-white")(isDarkMode)}>프로필 설정</DialogTitle>
        <DialogDescription className={getDarkClass("", "text-gray-400")(isDarkMode)}>
          관리자 계정 정보를 수정합니다.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        {PROFILE_FIELDS.map(({ id, label, icon: Icon, field, type = "text" }) => (
          <div key={id} className="grid gap-2">
            <Label htmlFor={id} className={getDarkClass("", "text-gray-300")(isDarkMode)}>
              <Icon className="h-4 w-4 inline mr-2" />
              {label}
            </Label>
            <Input
              id={id}
              type={type}
              value={profileData[field]}
              onChange={handleInputChange(field)}
              className={getDarkClass("", "bg-gray-700 border-gray-600 text-gray-200")(isDarkMode)}
            />
          </div>
        ))}
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={() => handleProfileSave(onClose)}>저장</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
