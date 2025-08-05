import { Input } from "@/components_admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components_admin/ui/select";
import { Search } from "lucide-react";

// 상수 정의
const FILTER_OPTIONS = {
  status: ["전체", "신규", "진행중", "대기", "완료"],
  priority: ["전체", "긴급", "높음", "보통", "낮음"]
};

const FilterControls = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  priorityFilter, 
  setPriorityFilter 
}) => {
  // 공통 Select 컴포넌트 렌더링 함수
  const renderSelect = (value, onChange, options, placeholder, width = "w-32") => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem 
            key={option} 
            value={option === "전체" ? "all" : option}
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex items-center space-x-2">
      {/* 검색 입력 */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="문의 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>
      
      {/* 상태 필터 */}
      {renderSelect(statusFilter, setStatusFilter, FILTER_OPTIONS.status, "상태")}
      
      {/* 우선순위 필터 */}
      {renderSelect(priorityFilter, setPriorityFilter, FILTER_OPTIONS.priority, "우선순위")}
    </div>
  );
};

export default FilterControls;
