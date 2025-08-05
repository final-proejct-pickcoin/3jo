import { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CHART_STYLES, getIndicatorStyle } from './chart-styles';

// 메모화된 차트 스타일 컴포넌트
export const ChartStyle = memo(({ id, config }) => {
  const styleHTML = useMemo(() => {
    const colorConfig = Object.entries(config).filter(([_, cfg]) => cfg.theme || cfg.color);
    if (!colorConfig.length) return '';
    
    const generateThemeStyles = (theme, prefix) =>
      `${prefix} [data-chart=${id}] {\n${colorConfig
        .map(([key, itemConfig]) => {
          const color = itemConfig.theme?.[theme] || itemConfig.color;
          return color ? `  --color-${key}: ${color};` : null;
        })
        .filter(Boolean)
        .join("\n")}\n}`;
    
    return [
      generateThemeStyles('light', ''),
      generateThemeStyles('dark', '.dark')
    ].join('\n');
  }, [config, id]);

  return styleHTML ? <style dangerouslySetInnerHTML={{ __html: styleHTML }} /> : null;
});
ChartStyle.displayName = 'ChartStyle';

// 메모화된 툴팁 라벨 컴포넌트
export const TooltipLabel = memo(({ 
  hideLabel, 
  payload, 
  label, 
  labelFormatter, 
  labelClassName, 
  config, 
  labelKey 
}) => {
  const renderLabel = useCallback((value, payload) => (
    <div className={cn(CHART_STYLES.tooltipLabel, labelClassName)}>
      {labelFormatter ? labelFormatter(value, payload) : value}
    </div>
  ), [labelFormatter, labelClassName]);

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) return null;
    
    const [item] = payload;
    const key = `${labelKey || item.dataKey || item.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === "string" 
      ? config[label]?.label || label 
      : itemConfig?.label;
    
    return value ? renderLabel(value, payload) : null;
  }, [hideLabel, payload, label, config, labelKey, renderLabel]);

  return tooltipLabel;
});
TooltipLabel.displayName = 'TooltipLabel';

// 메모화된 툴팁 아이템 컴포넌트
export const TooltipItem = memo(({ 
  item, 
  index, 
  config, 
  nameKey, 
  indicator, 
  hideIndicator, 
  color, 
  formatter, 
  nestLabel, 
  tooltipLabel 
}) => {
  const key = `${nameKey || item.name || item.dataKey || "value"}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const indicatorColor = color || item.payload?.fill || item.color;

  const renderContent = useCallback(() => {
    if (formatter && item?.value !== undefined && item.name) {
      return formatter(item.value, item.name, item, index, item.payload);
    }

    return (
      <>
        {itemConfig?.icon ? (
          <itemConfig.icon />
        ) : (
          !hideIndicator && (
            <div
              className={getIndicatorStyle(indicator, nestLabel)}
              style={{
                "--color-bg": indicatorColor,
                "--color-border": indicatorColor,
              }}
            />
          )
        )}
        <div className={cn(
          CHART_STYLES.tooltipContent,
          nestLabel ? CHART_STYLES.tooltipContentEnd : CHART_STYLES.tooltipContentCenter
        )}>
          <div className={CHART_STYLES.tooltipContentGrid}>
            {nestLabel && tooltipLabel}
            <span className={CHART_STYLES.tooltipName}>
              {itemConfig?.label || item.name}
            </span>
          </div>
          {item.value && (
            <span className={CHART_STYLES.tooltipValue}>
              {item.value.toLocaleString()}
            </span>
          )}
        </div>
      </>
    );
  }, [item, index, formatter, itemConfig, hideIndicator, indicator, nestLabel, indicatorColor, tooltipLabel]);

  return (
    <div
      key={item.dataKey}
      className={cn(
        CHART_STYLES.tooltipItem,
        indicator === "dot" && CHART_STYLES.tooltipItemCenter
      )}
    >
      {renderContent()}
    </div>
  );
});
TooltipItem.displayName = 'TooltipItem';

// 메모화된 범례 아이템 컴포넌트
export const LegendItem = memo(({ item, nameKey, config, hideIcon }) => {
  const key = `${nameKey || item.dataKey || "value"}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);

  const renderIcon = useCallback(() => {
    if (hideIcon) return null;
    
    return itemConfig?.icon ? (
      <itemConfig.icon />
    ) : (
      <div
        className={CHART_STYLES.legendIcon}
        style={{ backgroundColor: item.color }}
      />
    );
  }, [hideIcon, itemConfig, item.color]);

  return (
    <div key={item.value} className={CHART_STYLES.legendItem}>
      {renderIcon()}
      {itemConfig?.label}
    </div>
  );
});
LegendItem.displayName = 'LegendItem';

// Helper 함수 - 메모화된 버전
const getPayloadConfigFromPayload = memo((config, payload, key) => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }
  
  const payloadPayload = "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;
  
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  
  return configLabelKey in config ? config[configLabelKey] : config[key];
});
