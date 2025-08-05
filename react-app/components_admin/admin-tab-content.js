import { memo } from "react";
import { TabsContent } from "@/components_admin/ui/tabs";
import DashboardOverview from "./dashboard-overview";
import { UserManagement } from "./user-management";
import { LogManagement } from "./log-management";
import { AnnouncementManagement } from "./announcement-management";
import SupportManagement from "./support-management";

const AdminTabContent = memo(({
  userManagementProps,
  logManagementProps,
  announcementManagementProps,
  isDarkMode
}) => (
  <>
    <TabsContent value="dashboard">
      <DashboardOverview isDarkMode={isDarkMode} />
    </TabsContent>

    <TabsContent value="users">
      <UserManagement {...userManagementProps} />
    </TabsContent>

    <TabsContent value="logs">
      <LogManagement {...logManagementProps} />
    </TabsContent>

    <TabsContent value="announcements">
      <AnnouncementManagement {...announcementManagementProps} />
    </TabsContent>

    <TabsContent value="support">
      <SupportManagement isDarkMode={isDarkMode} />
    </TabsContent>
  </>
));

AdminTabContent.displayName = "AdminTabContent";

export default AdminTabContent;
