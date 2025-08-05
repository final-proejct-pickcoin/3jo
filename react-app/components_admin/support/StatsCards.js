import { Card, CardContent } from "@/components_admin/ui/card";
import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { getDarkClass } from "../utils/theme-utils";

// 상수 정의
const STATS_CONFIG = [
  { key: "신규", label: "신규 문의", icon: AlertCircle, bgColor: "bg-red-100", iconColor: "text-red-600" },
  { key: "진행중", label: "진행중", icon: Clock, bgColor: "bg-yellow-100", iconColor: "text-yellow-600" },
  { key: "완료", label: "완료", icon: CheckCircle, bgColor: "bg-green-100", iconColor: "text-green-600" },
  { key: "전체", label: "전체 문의", icon: MessageSquare, bgColor: "bg-blue-100", iconColor: "text-blue-600" }
];

const StatsCards = ({ stats, isDarkMode }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {STATS_CONFIG.map(({ key, label, icon: Icon, bgColor, iconColor }) => (
        <Card key={key} className={getDarkClass("", "bg-gray-800 border-gray-700")(isDarkMode)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${getDarkClass("text-gray-600", "text-gray-300")(isDarkMode)}`}>
                  {label}
                </p>
                <p className={`text-2xl font-bold ${getDarkClass("text-gray-900", "text-white")(isDarkMode)}`}>
                  {stats[key]}
                </p>
              </div>
              <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
