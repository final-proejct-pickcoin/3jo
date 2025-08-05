"use client";

import { createContext, useContext, forwardRef } from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import { CHART_STYLES, getLegendClassName } from './chart-styles';
import { ChartStyle, TooltipLabel, TooltipItem, LegendItem } from './ui-chart-components';
import { useChartLogic, useTooltipLogic } from './chart-hooks';

const ChartContext = createContext(null);

const useChart = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
};

const ChartContainer = forwardRef(({
  id,
  className,
  children,
  config,
  ...props
}, ref) => {
  const { chartId } = useChartLogic(id);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(CHART_STYLES.container, className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = forwardRef(({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}, ref) => {
  const { config } = useChart();
  const { nestLabel } = useTooltipLogic(payload, indicator);

  if (!active || !payload?.length) {
    return null;
  }

  const tooltipLabel = (
    <TooltipLabel
      hideLabel={hideLabel}
      payload={payload}
      label={label}
      labelFormatter={labelFormatter}
      labelClassName={labelClassName}
      config={config}
      labelKey={labelKey}
    />
  );

  return (
    <div
      ref={ref}
      className={cn(CHART_STYLES.tooltip, className)}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className={CHART_STYLES.tooltipGrid}>
        {payload.map((item, index) => (
          <TooltipItem
            key={item.dataKey}
            item={item}
            index={index}
            config={config}
            nameKey={nameKey}
            indicator={indicator}
            hideIndicator={hideIndicator}
            color={color}
            formatter={formatter}
            nestLabel={nestLabel}
            tooltipLabel={tooltipLabel}
          />
        ))}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = forwardRef(({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey
}, ref) => {
  const { config } = useChart();
  
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={getLegendClassName(verticalAlign, className)}
    >
      {payload.map((item) => (
        <LegendItem
          key={item.value}
          item={item}
          nameKey={nameKey}
          config={config}
          hideIcon={hideIcon}
        />
      ))}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
