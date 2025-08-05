import { cn } from '@/lib/utils';

// 차트 스타일 상수들
export const CHART_STYLES = {
  container: 'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke=\'#ccc\']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke=\'#fff\']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke=\'#ccc\']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke=\'#ccc\']]:stroke-border [&_.recharts-sector[stroke=\'#fff\']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
  tooltip: 'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
  tooltipGrid: 'grid gap-1.5',
  tooltipItem: 'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
  tooltipItemCenter: 'items-center',
  tooltipLabel: 'font-medium',
  tooltipContent: 'flex flex-1 justify-between leading-none',
  tooltipContentEnd: 'items-end',
  tooltipContentCenter: 'items-center',
  tooltipContentGrid: 'grid gap-1.5',
  tooltipName: 'text-muted-foreground',
  tooltipValue: 'font-mono font-medium tabular-nums text-foreground',
  legend: 'flex items-center justify-center gap-4',
  legendTop: 'pb-3',
  legendBottom: 'pt-3',
  legendItem: 'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground',
  legendIcon: 'h-2 w-2 shrink-0 rounded-[2px]',
  indicatorDot: 'h-2.5 w-2.5',
  indicatorLine: 'w-1',
  indicatorDashed: 'w-0 border-[1.5px] border-dashed bg-transparent',
  indicatorNest: 'my-0.5',
  indicatorBase: 'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]'
};

// 인디케이터 스타일 계산 함수
export const getIndicatorStyle = (indicator, nestLabel) => {
  return cn(CHART_STYLES.indicatorBase, {
    [CHART_STYLES.indicatorDot]: indicator === "dot",
    [CHART_STYLES.indicatorLine]: indicator === "line",
    [CHART_STYLES.indicatorDashed]: indicator === "dashed",
    [CHART_STYLES.indicatorNest]: nestLabel && indicator === "dashed",
  });
};

// 범례 클래스명 계산 함수
export const getLegendClassName = (verticalAlign, className) => {
  return cn(
    CHART_STYLES.legend,
    verticalAlign === "top" ? CHART_STYLES.legendTop : CHART_STYLES.legendBottom,
    className
  );
};
