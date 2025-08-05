import { memo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components_admin/ui/tabs";
import { Users, Activity, FileText, DollarSign, MessageSquare, Settings, Shield, TrendingUp } from "lucide-react";

// 이미지와 동일한 탭 구성
export const AdminTabNavigation = memo(({ activeTab, setActiveTab, isDarkMode, orientation = "vertical" }) => (
  <Tabs value={activeTab} onValueChange={setActiveTab} orientation={orientation} className="w-full">
    <TabsList className={orientation === "vertical"
      ? "grid w-full grid-cols-1 h-auto bg-transparent"
      : `grid w-full grid-cols-7 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`
    }>
      <TabsTrigger
        value="dashboard"
        className="justify-start w-full mb-2 flex items-center"
      >
        <TrendingUp className="h-4 w-4 mr-3" />
        대시보드
      </TabsTrigger>
      <TabsTrigger
        value="users"
        className="justify-start w-full mb-2 flex items-center"
      >
        <Users className="h-4 w-4 mr-3" />
        사용자 관리
      </TabsTrigger>
      <TabsTrigger
        value="support"
        className="justify-start w-full mb-2 flex items-center"
      >
        <MessageSquare className="h-4 w-4 mr-3" />
        1:1 문의
      </TabsTrigger>
      <TabsTrigger
        value="logs"
        className="justify-start w-full mb-2 flex items-center"
      >
        <Activity className="h-4 w-4 mr-3" />
        로그 관리
      </TabsTrigger>
      <TabsTrigger
        value="revenue"
        className="justify-start w-full mb-2 flex items-center"
      >
        <DollarSign className="h-4 w-4 mr-3" />
        수익 관리
      </TabsTrigger>
      <TabsTrigger
        value="announcements"
        className="justify-start w-full mb-2 flex items-center"
      >
        <FileText className="h-4 w-4 mr-3" />
        공지사항
      </TabsTrigger>
      <TabsTrigger
        value="system"
        className="justify-start w-full mb-2 flex items-center"
      >
        <Shield className="h-4 w-4 mr-3" />
        시스템 관리
      </TabsTrigger>
    </TabsList>
  </Tabs>
));

export default AdminTabNavigation;
