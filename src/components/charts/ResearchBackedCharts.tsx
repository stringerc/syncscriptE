import { memo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

// ============================================================================
// COLOR PALETTES (Research-backed for accessibility)
// ============================================================================

export const CHART_COLORS = {
  primary: ['#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#14b8a6'],
  status: {
    todo: '#6b7280',
    inProgress: '#3b82f6',
    done: '#10b981',
    overdue: '#ef4444',
  },
  energy: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6'],
  gradient: ['#06b6d4', '#8b5cf6'],
};

// ============================================================================
// 1. LINE CHART (Productivity Trends, Time Series)
// ============================================================================

interface TrendLineChartProps {
  data: Array<{ name: string; value: number; target?: number }>;
  height?: number;
  color?: string;
  showTarget?: boolean;
  showGrid?: boolean;
}

export const TrendLineChart = memo(function TrendLineChart({
  data,
  height = 200,
  color = '#06b6d4',
  showTarget = false,
  showGrid = true,
}: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
        <YAxis stroke="#9ca3af" fontSize={11} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#f3f4f6' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
        {showTarget && (
          <Line
            type="monotone"
            dataKey="target"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 2. BULLET CHART (Goal Progress vs Target)
// ============================================================================

interface BulletChartProps {
  value: number;
  target: number;
  max?: number;
  label: string;
  color?: string;
  height?: number;
}

export const BulletChart = memo(function BulletChart({
  value,
  target,
  max,
  label,
  color = '#06b6d4',
  height = 60,
}: BulletChartProps) {
  const actualMax = max || Math.max(value, target) * 1.2;
  const percentage = (value / actualMax) * 100;
  const targetPercentage = (target / actualMax) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {value} / {target}
        </span>
      </div>
      <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
        {/* Background ranges */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-gray-700/50" style={{ width: '60%' }} />
          <div className="h-full bg-gray-700/30" style={{ width: '20%' }} />
          <div className="h-full bg-gray-700/10" style={{ width: '20%' }} />
        </div>
        {/* Actual value bar */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
        {/* Target marker */}
        <div
          className="absolute inset-y-0 w-1 bg-white"
          style={{ left: `${targetPercentage}%` }}
        />
      </div>
    </div>
  );
});

// ============================================================================
// 3. STACKED BAR CHART (Task Status, Composition)
// ============================================================================

interface StackedBarChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  keys: string[];
  colors?: string[];
  height?: number;
  horizontal?: boolean;
}

export const StackedBarChart = memo(function StackedBarChart({
  data,
  keys,
  colors = CHART_COLORS.primary,
  height = 300,
  horizontal = false,
}: StackedBarChartProps) {
  const ChartComponent = horizontal ? BarChart : BarChart;
  const layout = horizontal ? 'horizontal' : 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} layout={layout} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={colors[index % colors.length]}
            radius={index === keys.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </ChartComponent>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 4. COMPARISON BAR CHART (Category Comparison)
// ============================================================================

interface ComparisonBarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  horizontal?: boolean;
  sortByValue?: boolean;
}

export const ComparisonBarChart = memo(function ComparisonBarChart({
  data,
  height = 300,
  horizontal = true,
  sortByValue = true,
}: ComparisonBarChartProps) {
  const sortedData = sortByValue
    ? [...data].sort((a, b) => b.value - a.value)
    : data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout={horizontal ? 'horizontal' : 'vertical'}
        margin={{ top: 10, right: 10, left: horizontal ? 80 : -20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="#9ca3af" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={100} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" radius={4}>
          {sortedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 5. SCATTER PLOT (Correlations)
// ============================================================================

interface ScatterPlotChartProps {
  data: Array<{ x: number; y: number; name?: string }>;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  color?: string;
}

export const ScatterPlotChart = memo(function ScatterPlotChart({
  data,
  height = 300,
  xLabel = 'X',
  yLabel = 'Y',
  color = '#06b6d4',
}: ScatterPlotChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis type="number" dataKey="x" name={xLabel} stroke="#9ca3af" fontSize={11} />
        <YAxis type="number" dataKey="y" name={yLabel} stroke="#9ca3af" fontSize={11} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter name="Data" data={data} fill={color} />
      </ScatterChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 6. DONUT CHART (Part-to-Whole, Categories)
// ============================================================================

interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  showLabel?: boolean;
  innerRadius?: number;
}

export const DonutChart = memo(function DonutChart({
  data,
  height = 200,
  showLabel = true,
  innerRadius = 60,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius + 30}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl text-white">{total}</span>
          <span className="text-xs text-gray-400">Total</span>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// 7. AREA CHART (Cumulative, Stacked Time Series)
// ============================================================================

interface AreaChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  keys: string[];
  colors?: string[];
  height?: number;
  stacked?: boolean;
}

export const AreaChartComponent = memo(function AreaChartComponent({
  data,
  keys,
  colors = CHART_COLORS.primary,
  height = 250,
  stacked = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <defs>
          {keys.map((key, index) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
        <YAxis stroke="#9ca3af" fontSize={11} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {keys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? '1' : undefined}
            stroke={colors[index % colors.length]}
            fill={`url(#gradient-${key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 8. HISTOGRAM (Distribution)
// ============================================================================

interface HistogramProps {
  data: Array<{ range: string; count: number }>;
  height?: number;
  color?: string;
}

export const Histogram = memo(function Histogram({
  data,
  height = 200,
  color = '#06b6d4',
}: HistogramProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
        <YAxis stroke="#9ca3af" fontSize={11} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 9. COMBINED CHART (Multiple Metrics)
// ============================================================================

interface CombinedChartProps {
  data: Array<{ name: string; [key: string]: string | number }>;
  lineKeys: string[];
  barKeys: string[];
  colors?: string[];
  height?: number;
}

export const CombinedChart = memo(function CombinedChart({
  data,
  lineKeys,
  barKeys,
  colors = CHART_COLORS.primary,
  height = 300,
}: CombinedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
        <YAxis stroke="#9ca3af" fontSize={11} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {barKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
        {lineKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[(barKeys.length + index) % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// 10. KPI CARD (Single Metric Display)
// ============================================================================

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export const KPICard = memo(function KPICard({
  label,
  value,
  trend,
  icon,
  color = '#06b6d4',
  subtitle,
}: KPICardProps) {
  const trendColor = trend && trend > 0 ? '#10b981' : trend && trend < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className="bg-[#1e2128] rounded-lg p-4 border border-gray-800">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon && <div style={{ color }}>{icon}</div>}
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-2xl text-white">{value}</span>
        {trend !== undefined && (
          <span className="text-sm mb-1" style={{ color: trendColor }}>
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
});
