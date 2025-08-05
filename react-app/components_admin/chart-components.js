import { memo } from "react";
import { 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Line, RadialBarChart, RadialBar, BarChart, Bar
} from "recharts";
import { COLORS, CHART_COLORS } from "./dashboard-data";
import { TOOLTIP_STYLE } from "./dashboard-styles";

// 차트용 통합 Gradients 컴포넌트
export const ChartGradients = memo(() => (
  <defs>
    {Object.entries(COLORS).map(([key, color]) => (
      <linearGradient key={key} id={`${key}Gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
        <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
      </linearGradient>
    ))}
  </defs>
));

// 공통 차트 설정 및 포맷터들
const COMMON_CHART_CONFIG = {
  cartesianGrid: { strokeDasharray: "3 3", stroke: "#f0f0f0" },
  axis: { stroke: "#666" },
  tooltip: { contentStyle: TOOLTIP_STYLE },
  containerProps: { width: "100%" }
};

// 포맷터 함수들 (중복 제거)
const formatters = {
  tradingVolume: (value, name) => [
    name === "volume" ? `${value.toLocaleString()} BTC` : 
    name === "trades" ? `${value.toLocaleString()} 건` : 
    `${value.toLocaleString()} 명`,
    name === "volume" ? "거래량" : 
    name === "trades" ? "거래 건수" : "활성 사용자"
  ],
  users: value => [value.toLocaleString(), "사용자"],
  activity: value => [`${value}명`, "활성 사용자"],
  revenue: value => [`$${value.toLocaleString()}`, ""]
};

// 공통 차트 베이스 컴포넌트
const ChartBase = memo(({ children, height = 300 }) => (
  <ResponsiveContainer {...COMMON_CHART_CONFIG.containerProps} height={height}>
    {children}
  </ResponsiveContainer>
));

// 공통 차트 요소들
const CommonChartElements = memo(() => (
  <>
    <ChartGradients />
    <CartesianGrid {...COMMON_CHART_CONFIG.cartesianGrid} />
  </>
));

// 공통 Area 컴포넌트 팩토리 (간소화)
const createArea = (dataKey, color, gradientId, strokeWidth = 2) => (
  <Area 
    key={dataKey}
    type="monotone" 
    dataKey={dataKey} 
    stroke={color} 
    fillOpacity={1} 
    fill={`url(#${gradientId})`} 
    strokeWidth={strokeWidth} 
  />
);

// 성능 모니터링 차트 컴포넌트 (통합 최적화)
export const PerformanceChart = memo(({ data }) => (
  <ChartBase height={300}>
    <AreaChart data={data}>
      <CommonChartElements />
      <XAxis dataKey="time" {...COMMON_CHART_CONFIG.axis} />
      <YAxis {...COMMON_CHART_CONFIG.axis} />
      <Tooltip {...COMMON_CHART_CONFIG.tooltip} />
      {createArea("cpu", COLORS.primary, "primaryGradient")}
      {createArea("memory", COLORS.secondary, "secondaryGradient")}
      {createArea("network", COLORS.success, "successGradient")}
    </AreaChart>
  </ChartBase>
));

// 거래쌍 파이차트 컴포넌트 (간소화)
export const TradingPairChart = memo(({ data }) => (
  <ChartBase height={350}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={100}
        dataKey="value"
        stroke="none"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip {...COMMON_CHART_CONFIG.tooltip} />
    </PieChart>
  </ChartBase>
));

// 거래량 추이 차트 컴포넌트 (통합 최적화)
export const TradingVolumeChart = memo(({ data }) => (
  <ChartBase height={350}>
    <AreaChart data={data}>
      <CommonChartElements />
      <XAxis dataKey="date" {...COMMON_CHART_CONFIG.axis} />
      <YAxis {...COMMON_CHART_CONFIG.axis} />
      <Tooltip 
        {...COMMON_CHART_CONFIG.tooltip}
        formatter={formatters.tradingVolume}
      />
      {createArea("volume", COLORS.primary, "primaryGradient", 3)}
      <Line 
        type="monotone" 
        dataKey="trades" 
        stroke={COLORS.secondary} 
        strokeWidth={2} 
        dot={{r: 4}} 
      />
    </AreaChart>
  </ChartBase>
));

// 수익원 방사형 차트 컴포넌트 (간소화)
export const RevenueRadialChart = memo(({ stream, index }) => (
  <div className="text-center">
    <ChartBase height={200}>
      <RadialBarChart 
        cx="50%" 
        cy="50%" 
        innerRadius="60%" 
        outerRadius="90%" 
        data={[stream]}
      >
        <RadialBar 
          dataKey="value" 
          cornerRadius={10} 
          fill={CHART_COLORS[index]} 
          strokeWidth={2} 
        />
      </RadialBarChart>
    </ChartBase>
    <div className="mt-4">
      <h3 className="font-semibold text-lg">{stream.name}</h3>
      <p className="text-2xl font-bold text-gray-800">
        ${stream.amount.toLocaleString()}
      </p>
      <p className="text-sm text-gray-600">{stream.value}% of total</p>
    </div>
  </div>
));

// 사용자 상태 파이차트 컴포넌트 (간소화)
export const UserStatusChart = memo(({ data }) => (
  <ChartBase height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={40}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip 
        {...COMMON_CHART_CONFIG.tooltip}
        formatter={formatters.users}
      />
    </PieChart>
  </ChartBase>
));

// 시간별 활동량 바차트 컴포넌트 (간소화)
export const HourlyActivityChart = memo(({ data }) => (
  <ChartBase height={300}>
    <BarChart data={data}>
      <CommonChartElements />
      <XAxis dataKey="hour" {...COMMON_CHART_CONFIG.axis} />
      <YAxis {...COMMON_CHART_CONFIG.axis} />
      <Tooltip 
        {...COMMON_CHART_CONFIG.tooltip}
        formatter={formatters.activity}
      />
      <Bar 
        dataKey="activity" 
        fill={COLORS.primary} 
        radius={[4, 4, 0, 0]} 
      />
    </BarChart>
  </ChartBase>
));

// 월별 수익 분석 차트 컴포넌트 (간소화)
export const MonthlyRevenueChart = memo(({ data }) => (
  <ChartBase height={300}>
    <BarChart data={data}>
      <CommonChartElements />
      <XAxis dataKey="month" {...COMMON_CHART_CONFIG.axis} />
      <YAxis {...COMMON_CHART_CONFIG.axis} />
      <Tooltip 
        {...COMMON_CHART_CONFIG.tooltip}
        formatter={formatters.revenue}
      />
      <Bar dataKey="trading" stackId="a" fill={COLORS.primary} name="거래 수수료" />
      <Bar dataKey="withdrawal" stackId="a" fill={COLORS.secondary} name="출금 수수료" />
      <Bar dataKey="listing" stackId="a" fill={COLORS.success} name="상장 수수료" />
    </BarChart>
  </ChartBase>
));
