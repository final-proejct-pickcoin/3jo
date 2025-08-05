import { useMemo, useId } from 'react';

// 차트 로직을 위한 커스텀 훅
export const useChartLogic = (id) => {
  const uniqueId = useId();
  
  const chartId = useMemo(() => 
    `chart-${id || uniqueId.replace(/:/g, "")}`,
    [id, uniqueId]
  );
  
  return { chartId };
};

// 툴팁 로직을 위한 커스텀 훅
export const useTooltipLogic = (payload, indicator) => {
  const nestLabel = useMemo(() => 
    payload?.length === 1 && indicator !== "dot",
    [payload, indicator]
  );
  
  return { nestLabel };
};
