import { memo } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

export const TrendIndicator = memo(function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <div className="flex items-center gap-1">
      {isNeutral ? (
        <Minus className="w-3 h-3 text-gray-400" />
      ) : isPositive ? (
        <TrendingUp className="w-3 h-3 text-green-400" />
      ) : (
        <TrendingDown className="w-3 h-3 text-red-400" />
      )}
      <span className={`text-[10px] ${isPositive ? 'text-green-400' : isNeutral ? 'text-gray-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{value}%
      </span>
      {label && <span className="text-[10px] text-gray-500">{label}</span>}
    </div>
  );
});

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export const CircularProgress = memo(function CircularProgress({ 
  value, 
  max = 100, 
  size = 40, 
  strokeWidth = 4,
  color = '#06b6d4',
  label
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e2128"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] fill-white transform rotate-90"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {Math.round(percentage)}%
        </text>
      </svg>
      {label && <span className="text-[9px] text-gray-400">{label}</span>}
    </div>
  );
});

interface MiniMetricBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export const MiniMetricBar = memo(function MiniMetricBar({ 
  label, 
  value, 
  max = 100,
  color = '#06b6d4'
}: MiniMetricBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-400">{label}</span>
        <span className="text-[10px] text-white">{value}</span>
      </div>
      <div className="h-1.5 bg-[#1e2128] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
});

interface RadarMetricsProps {
  data: {
    metric: string;
    value: number;
    max?: number;
  }[];
}

export const RadarMetrics = memo(function RadarMetrics({ data }: RadarMetricsProps) {
  const chartData = data.map(item => ({
    subject: item.metric,
    value: item.value,
    fullMark: item.max || 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#2a2d35" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#9ca3af', fontSize: 9 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 8 }}
        />
        <Radar 
          name="Score" 
          dataKey="value" 
          stroke="#06b6d4" 
          fill="#06b6d4" 
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
});

interface ComparisonBarsProps {
  data: ({
    label: string;
    current: number;
    previous: number;
  } | {
    label: string;
    value: number;
    color?: string;
  })[];
}

export const ComparisonBars = memo(function ComparisonBars({ data }: ComparisonBarsProps) {
  // Check if data is in value/color format or current/previous format
  const isValueFormat = data.length > 0 && 'value' in data[0];
  
  if (isValueFormat) {
    // Calculate total for percentages
    const total = (data as any[]).reduce((sum, item) => sum + (item.value || 0), 0);
    
    return (
      <div className="space-y-2.5">
        {(data as any[]).map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">{item.label}</span>
                <span className="text-[9px] text-gray-300">{Math.round(percentage)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color || '#06b6d4'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  // Original current/previous format
  return (
    <div className="space-y-3">
      {(data as any[]).map((item, index) => {
        const change = ((item.current - item.previous) / item.previous) * 100;
        const isPositive = change > 0;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500">{item.current}%</span>
                <TrendIndicator value={Math.round(change)} />
              </div>
            </div>
            <div className="flex gap-1">
              {/* Previous value (gray) */}
              <div className="flex-1 h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-600 rounded-full"
                  style={{ width: `${item.previous}%` }}
                />
              </div>
              {/* Current value (colored) */}
              <div className="flex-1 h-1.5 bg-[#1e2128] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-cyan-500'}`}
                  style={{ width: `${item.current}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

interface MetricGridProps {
  metrics: {
    label: string;
    value: number;
    max?: number;
    color?: string;
  }[];
}

export const MetricGrid = memo(function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric, index) => {
        const percentage = Math.min((metric.value / (metric.max || 100)) * 100, 100);
        const radius = 18;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;
        
        return (
          <div 
            key={index}
            className="bg-[#1a1c20] rounded-lg p-2.5 border border-gray-800/50 flex flex-col items-center gap-1.5"
          >
            <div className="relative flex-shrink-0">
              <svg width={44} height={44} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={22}
                  cy={22}
                  r={radius}
                  fill="none"
                  stroke="#1e2128"
                  strokeWidth={3.5}
                />
                {/* Progress circle */}
                <circle
                  cx={22}
                  cy={22}
                  r={radius}
                  fill="none"
                  stroke={metric.color || '#06b6d4'}
                  strokeWidth={3.5}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {/* Number inside circle - kept horizontal */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-white">{Math.round(percentage)}</span>
              </div>
            </div>
            <span className="text-[9px] text-gray-400 text-center leading-tight">{metric.label}</span>
          </div>
        );
      })}
    </div>
  );
});

interface MiniSparklineProps {
  data: number[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showAxis?: boolean;
  showLabels?: boolean;
  labels?: string[];
}

export const InlineSparkline = memo(function InlineSparkline({ 
  data, 
  height = 20,
  color = '#06b6d4',
  showDots = false,
  showAxis = false,
  showLabels = false,
  labels
}: MiniSparklineProps) {
  const chartData = data.map((value, index) => ({ 
    index, 
    value,
    label: labels?.[index] || `${index + 1}`
  }));
  
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const currentValue = data[data.length - 1];
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-gray-500">Min: {minValue}</span>
        <span className="text-[9px] text-cyan-400">Now: {currentValue}</span>
        <span className="text-[9px] text-gray-500">Max: {maxValue}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: showAxis ? 20 : 0 }}>
          {showAxis && (
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              dot={showDots ? { fill: color, r: 3 } : false}
            />
          )}
          {!showAxis && (
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={1.5}
              dot={showDots ? { fill: color, r: 2 } : false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {showLabels && labels && (
        <div className="flex justify-between mt-1 px-1">
          {labels.map((label, index) => (
            <span key={index} className="text-[9px] text-gray-500">{label}</span>
          ))}
        </div>
      )}
    </div>
  );
});

interface VerticalBarsProps {
  data: number[];
  labels?: string[];
  color?: string;
}

export const VerticalMicroBars = memo(function VerticalMicroBars({ 
  data, 
  labels,
  color = '#06b6d4'
}: VerticalBarsProps) {
  const max = Math.max(...data);
  
  return (
    <div className="flex items-end justify-between gap-1 h-12">
      {data.map((value, index) => {
        const heightPercent = (value / max) * 100;
        return (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full bg-[#1e2128] rounded-t flex items-end" style={{ height: '100%' }}>
              <div 
                className="w-full rounded-t transition-all duration-300"
                style={{ 
                  height: `${heightPercent}%`,
                  backgroundColor: color
                }}
              />
            </div>
            {labels && labels[index] && (
              <span className="text-[8px] text-gray-500">{labels[index]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
});

interface HeatmapCellProps {
  value: number;
  max?: number;
}

const HeatmapCell = memo(function HeatmapCell({ value, max = 100 }: HeatmapCellProps) {
  const intensity = Math.min((value / max), 1);
  const opacity = 0.2 + (intensity * 0.8);
  
  return (
    <div 
      className="w-3 h-3 rounded-sm transition-all duration-300"
      style={{ 
        backgroundColor: '#06b6d4',
        opacity: opacity
      }}
      title={`${value}`}
    />
  );
});

interface ActivityHeatmapProps {
  data: number[][];
  days?: string[];
  showLegend?: boolean;
}

export const ActivityHeatmap = memo(function ActivityHeatmap({ 
  data,
  days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  showLegend = false
}: ActivityHeatmapProps) {
  const max = Math.max(...data.flat());
  
  // If data looks like status columns (4 columns), show different labels
  const isStatusData = data.length > 0 && data[0].length === 4;
  const statusLabels = ['Done', 'In Prog', 'Todo', 'Late'];
  
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {data.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((value, dayIndex) => (
              <div key={dayIndex} className="flex-1">
                <HeatmapCell value={value} max={max} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-0.5">
        {(isStatusData ? statusLabels : days).map((label, index) => (
          <span key={index} className="text-[8px] text-gray-500">{label}</span>
        ))}
      </div>
      {showLegend && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[8px] text-gray-500">Less</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
              <div 
                key={i}
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: '#06b6d4', opacity }}
              />
            ))}
          </div>
          <span className="text-[8px] text-gray-500">More</span>
        </div>
      )}
    </div>
  );
});

interface TrendChartProps {
  data: {
    label: string;
    value: number;
  }[];
}

export const TrendChart = memo(function TrendChart({ data }: TrendChartProps) {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = (item.value / max) * 100;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-400">{item.label}</span>
              <span className="text-[10px] text-white">{item.value}%</span>
            </div>
            <div className="h-2 bg-[#1e2128] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ============ DASHBOARD-SPECIFIC VISUALIZATIONS ============

// 1. Daily Activity Timeline (Hourly)
interface HourlyTimelineProps {
  data: {
    hour: string;
    active: number;
    label: string;
  }[];
}

export const HourlyTimeline = memo(function HourlyTimeline({ data }: HourlyTimelineProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 20, left: -10 }}>
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="active" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fill="url(#activityGradient)"
          dot={{ fill: '#3b82f6', r: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// 2. Energy Level Trend
interface EnergyTrendProps {
  data: {
    hour: string;
    energy: number;
    label: string;
  }[];
}

export const EnergyTrend = memo(function EnergyTrend({ data }: EnergyTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 20, left: -10 }}>
        <defs>
          <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="energy" 
          stroke="#facc15" 
          strokeWidth={2.5}
          fill="url(#energyGradient)"
          dot={{ fill: '#facc15', r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// 3. Productivity "Pulse" Gauge
interface ProductivityGaugeProps {
  data: {
    score: number;
    max: number;
    label: string;
    comparison?: {
      yesterday: number;
      lastWeek: number;
    };
  };
}

export const ProductivityGauge = memo(function ProductivityGauge({ data }: ProductivityGaugeProps) {
  const { score, max, label, comparison } = data;
  const percentage = (score / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;
  
  // Calculate comparison metrics
  const vsYesterday = comparison ? score - comparison.yesterday : 0;
  const vsLastWeek = comparison ? score - comparison.lastWeek : 0;
  
  return (
    <div className="space-y-3">
      <div className="relative w-full h-24 flex items-end justify-center">
        <svg viewBox="0 0 120 65" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 15 55 A 45 45 0 0 1 105 55"
            fill="none"
            stroke="#1e2128"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Color segments */}
          <path
            d="M 15 55 A 45 45 0 0 1 105 55"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.4} 140`}
          />
          {/* Needle */}
          <line
            x1="60"
            y1="55"
            x2="60"
            y2="20"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${rotation} 60 55)`}
          />
          <circle cx="60" cy="55" r="4" fill="#06b6d4" />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score display */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-2xl text-white">{score}</div>
          <div className="text-[9px] text-gray-400">{label}</div>
        </div>
      </div>
      
      {/* Comparison metrics */}
      {comparison && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/20 rounded-lg p-2 text-center">
            <div className={`text-xs ${vsYesterday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {vsYesterday >= 0 ? '+' : ''}{vsYesterday}
            </div>
            <div className="text-[9px] text-gray-500">vs Yesterday</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2 text-center">
            <div className={`text-xs ${vsLastWeek >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {vsLastWeek >= 0 ? '+' : ''}{vsLastWeek}
            </div>
            <div className="text-[9px] text-gray-500">vs Last Week</div>
          </div>
        </div>
      )}
    </div>
  );
});

// 4. Time Allocation by Category
interface TimeAllocationProps {
  data: {
    category: string;
    value: number;
    color: string;
  }[];
}

export const TimeAllocation = memo(function TimeAllocation({ data }: TimeAllocationProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-3">
      {/* Pie chart */}
      <ResponsiveContainer width="100%" height={100}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={25}
            outerRadius={45}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend with percentages */}
      <div className="space-y-1.5">
        {data.map((entry, index) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[10px] text-gray-400">{entry.category}</span>
              </div>
              <span className="text-[10px] text-white">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// 5. Tasks Completed vs Planned
interface TaskProgressProps {
  data: {
    completed: number;
    planned: number;
    weekData: {
      day: string;
      completed: number;
      planned: number;
    }[];
  };
}

export const TaskProgress = memo(function TaskProgress({ data }: TaskProgressProps) {
  const { completed, planned, weekData } = data;
  const completionRate = ((completed / planned) * 100).toFixed(0);
  
  return (
    <div className="space-y-3">
      {/* Today's progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Today</span>
          <span className="text-xs text-cyan-400">{completed}/{planned}</span>
        </div>
        <div className="h-3 bg-[#1a1c20] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="text-center">
          <span className="text-lg text-white">{completionRate}%</span>
          <span className="text-[9px] text-gray-500 ml-1">complete</span>
        </div>
      </div>
      
      {/* Week overview */}
      <div className="space-y-2">
        <div className="text-[9px] text-gray-500 text-center">Weekly Trend</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weekData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
            <Bar dataKey="planned" fill="#374151" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between px-1">
          {weekData.map((day, idx) => (
            <span key={idx} className="text-[8px] text-gray-500">{day.day}</span>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-gray-700" />
            <span className="text-[9px] text-gray-500">Planned</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-cyan-500" />
            <span className="text-[9px] text-gray-500">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// 6. Team vs You Comparison (Managers only)
interface TeamComparisonProps {
  data: {
    userTasks: number;
    teamAverage: number;
    metric: string;
  };
}

export const TeamComparison = memo(function TeamComparison({ data }: TeamComparisonProps) {
  const { userTasks, teamAverage, metric } = data;
  const maxValue = Math.max(userTasks, teamAverage);
  const userPercentage = (userTasks / maxValue) * 100;
  const teamPercentage = (teamAverage / maxValue) * 100;
  const difference = userTasks - teamAverage;
  const isAboveAverage = difference > 0;
  
  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="text-center">
        <div className="text-xs text-gray-400">{metric}</div>
        <div className={`text-sm mt-1 ${isAboveAverage ? 'text-green-400' : 'text-amber-400'}`}>
          {isAboveAverage ? '+' : ''}{difference} {isAboveAverage ? 'above' : 'below'} team average
        </div>
      </div>
      
      {/* Bar comparison */}
      <div className="space-y-3">
        {/* You */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400">You</span>
            <span className="text-[10px] text-white">{userTasks} tasks</span>
          </div>
          <div className="h-6 bg-[#1a1c20] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${userPercentage}%` }}
            >
              <span className="text-[10px] text-white">{userTasks}</span>
            </div>
          </div>
        </div>
        
        {/* Team Average */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-400">Team Avg</span>
            <span className="text-[10px] text-white">{teamAverage} tasks</span>
          </div>
          <div className="h-6 bg-[#1a1c20] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${teamPercentage}%` }}
            >
              <span className="text-[10px] text-white">{teamAverage}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance indicator */}
      <div className="bg-black/20 rounded-lg p-2 text-center">
        <div className={`text-xs ${isAboveAverage ? 'text-green-400' : 'text-amber-400'}`}>
          {isAboveAverage ? '🎯 Excellent!' : '💪 Keep pushing!'}
        </div>
        <div className="text-[9px] text-gray-500 mt-0.5">
          {isAboveAverage ? 'You\'re outperforming the team' : 'Opportunities to improve'}
        </div>
      </div>
    </div>
  );
});

// Add Team Button (for users without a team)
interface AddTeamButtonProps {
  onAddTeam?: () => void;
}

export const AddTeamButton = memo(function AddTeamButton({ onAddTeam }: AddTeamButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">👥</div>
        <div className="text-sm text-gray-300 mb-1">Team Insights</div>
        <div className="text-xs text-gray-500">
          Add a team to see performance comparisons
        </div>
      </div>
      <button 
        onClick={onAddTeam}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      >
        Add a Team
      </button>
    </div>
  );
});

// ===== CALENDAR PAGE VISUALIZATIONS =====

// 1. Meeting Hours by Day (Week)
interface MeetingHoursByDayProps {
  data: {
    day: string;
    hours: number;
    label: string;
  }[];
}

export const MeetingHoursByDay = memo(function MeetingHoursByDay({ data }: MeetingHoursByDayProps) {
  const maxHours = Math.max(...data.map(d => d.hours));
  
  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="space-y-2">
        {data.map((entry, index) => {
          const percentage = (entry.hours / maxHours) * 100;
          const isHeavy = entry.hours >= 5;
          const isLight = entry.hours < 4;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{entry.label}</span>
                <span className="text-[10px] text-white">{entry.hours}h</span>
              </div>
              <div className="h-5 bg-[#1a1c20] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHeavy ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                    isLight ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 text-[9px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
          <span>Light (&lt;4h)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-gradient-to-r from-red-500 to-orange-500" />
          <span>Heavy (5h+)</span>
        </div>
      </div>
    </div>
  );
});

// 2. Peak Productivity vs Meetings (Time-of-day overlay)
interface ProductivityVsMeetingsProps {
  data: {
    hours: string[];
    productivity: number[];
    meetings: number[];
  };
}

export const ProductivityVsMeetings = memo(function ProductivityVsMeetings({ data }: ProductivityVsMeetingsProps) {
  const { hours, productivity, meetings } = data;
  const maxValue = 100;
  
  return (
    <div className="space-y-3">
      {/* Dual line chart */}
      <div className="h-32 relative">
        <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <line
              key={value}
              x1="0"
              y1={120 - (value / 100) * 120}
              x2="300"
              y2={120 - (value / 100) * 120}
              stroke="#2a2c34"
              strokeWidth="1"
            />
          ))}
          
          {/* Productivity line (blue) */}
          <polyline
            points={productivity.map((value, i) => 
              `${(i / (productivity.length - 1)) * 300},${120 - (value / maxValue) * 120}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Meetings line (orange) */}
          <polyline
            points={meetings.map((value, i) => 
              `${(i / (meetings.length - 1)) * 300},${120 - (value / maxValue) * 120}`
            ).join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
        
        {/* Time labels */}
        <div className="flex justify-between mt-1">
          {hours.filter((_, i) => i % 2 === 0).map((hour, i) => (
            <span key={i} className="text-[8px] text-gray-500">{hour}</span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-[9px] text-gray-400">Your Productivity</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-orange-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 3px, transparent 3px, transparent 5px)' }} />
          <span className="text-[9px] text-gray-400">Meeting Density</span>
        </div>
      </div>
      
      {/* Insight */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
        <div className="text-xs text-amber-400">⚠️ ~50% meeting overlap during peak hours</div>
        <div className="text-[9px] text-gray-400 mt-0.5">Consider blocking 10-11 AM for focus time</div>
      </div>
    </div>
  );
});

// 3. Focus Time Availability (2+ hour blocks)
interface FocusTimeAvailabilityProps {
  data: {
    day: string;
    focusHours: number;
    hasFocusBlock: boolean;
    label: string;
  }[];
  goal: number;
  daysWithFocus: number;
}

export const FocusTimeAvailability = memo(function FocusTimeAvailability({ data, goal, daysWithFocus }: FocusTimeAvailabilityProps) {
  const totalDays = data.length;
  const completionRate = ((daysWithFocus / totalDays) * 100).toFixed(0);
  
  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="text-center bg-black/20 rounded-lg p-2">
        <div className="text-lg text-cyan-400">{daysWithFocus}/{totalDays} days</div>
        <div className="text-[9px] text-gray-500">with {goal}+ hour focus blocks</div>
      </div>
      
      {/* Bar chart */}
      <div className="space-y-2">
        {data.map((entry, index) => {
          const percentage = (entry.focusHours / 8) * 100; // Out of 8-hour workday
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{entry.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white">{entry.focusHours}h</span>
                  {entry.hasFocusBlock && <span className="text-green-400 text-[10px]">✓</span>}
                </div>
              </div>
              <div className="h-4 bg-[#1a1c20] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    entry.hasFocusBlock 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-gray-600 to-gray-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Goal indicator */}
      <div className={`bg-black/20 rounded-lg p-2 text-center ${
        daysWithFocus >= 4 ? 'border border-green-500/20' : 'border border-amber-500/20'
      }`}>
        <div className={`text-xs ${daysWithFocus >= 4 ? 'text-green-400' : 'text-amber-400'}`}>
          {daysWithFocus >= 4 ? '🎯 Great job!' : '💪 Room to improve'}
        </div>
        <div className="text-[9px] text-gray-500 mt-0.5">
          Goal: 5 days with {goal}h+ blocks
        </div>
      </div>
    </div>
  );
});

// 4. Meetings by Type/Size
interface MeetingsByTypeProps {
  data: {
    type: string;
    value: number;
    color: string;
  }[];
}

export const MeetingsByType = memo(function MeetingsByType({ data }: MeetingsByTypeProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  
  return (
    <div className="space-y-3">
      {/* Donut chart representation */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {data.map((entry, index) => {
              const percentage = entry.value / total;
              const previousPercentages = data.slice(0, index).reduce((sum, e) => sum + e.value / total, 0);
              const startAngle = previousPercentages * 360;
              const endAngle = startAngle + percentage * 360;
              
              // Convert to radians and calculate path
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              const innerRadius = 30;
              const outerRadius = 45;
              
              const x1 = 50 + outerRadius * Math.cos(startRad);
              const y1 = 50 + outerRadius * Math.sin(startRad);
              const x2 = 50 + outerRadius * Math.cos(endRad);
              const y2 = 50 + outerRadius * Math.sin(endRad);
              const x3 = 50 + innerRadius * Math.cos(endRad);
              const y3 = 50 + innerRadius * Math.sin(endRad);
              const x4 = 50 + innerRadius * Math.cos(startRad);
              const y4 = 50 + innerRadius * Math.sin(startRad);
              
              const largeArc = percentage > 0.5 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`}
                  fill={entry.color}
                  opacity="0.9"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-white">{total}%</div>
              <div className="text-[8px] text-gray-500">Time</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend with percentages */}
      <div className="space-y-2">
        {data.map((entry, index) => {
          const percentage = ((entry.value / total) * 100).toFixed(0);
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[10px] text-gray-400">{entry.type}</span>
              </div>
              <span className="text-[10px] text-white">{entry.value}% ({percentage}%)</span>
            </div>
          );
        })}
      </div>
      
      {/* Warning for large meetings */}
      {data.find(d => d.type.includes('Large') && d.value > 10) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
          <div className="text-xs text-red-400">⚠️ High % of large meetings</div>
          <div className="text-[9px] text-gray-400 mt-0.5">Consider reducing attendance or duration</div>
        </div>
      )}
    </div>
  );
});

// 5. Calendar Heatmap (Busy Days This Month)
interface CalendarHeatmapProps {
  data: {
    date: number;
    intensity: number; // 0-10 scale
  }[];
  month: string;
}

export const CalendarHeatmap = memo(function CalendarHeatmap({ data, month }: CalendarHeatmapProps) {
  const maxIntensity = 10;
  const weeks = 5;
  const daysInWeek = 7;
  
  // Create grid of days (35 total for 5 weeks)
  const grid = Array(weeks).fill(null).map(() => Array(daysInWeek).fill(null));
  
  // Fill in data
  data.forEach(item => {
    const dayIndex = item.date - 1;
    const weekIndex = Math.floor(dayIndex / daysInWeek);
    const dayOfWeek = dayIndex % daysInWeek;
    if (weekIndex < weeks && dayOfWeek < daysInWeek) {
      grid[weekIndex][dayOfWeek] = item.intensity;
    }
  });
  
  const getColor = (intensity: number | null) => {
    if (intensity === null) return '#1a1c20';
    if (intensity === 0) return '#2a2c34';
    const ratio = intensity / maxIntensity;
    if (ratio < 0.3) return '#10b981';
    if (ratio < 0.6) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="space-y-3">
      {/* Month label */}
      <div className="text-center text-xs text-gray-400">{month}</div>
      
      {/* Heatmap grid */}
      <div className="space-y-1">
        {grid.map((week, weekIndex) => (
          <div key={weekIndex} className="flex gap-1">
            {week.map((intensity, dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 aspect-square rounded transition-all duration-200 hover:ring-1 hover:ring-cyan-400"
                style={{ backgroundColor: getColor(intensity) }}
                title={intensity !== null ? `${intensity} events` : 'No data'}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Week labels */}
      <div className="flex justify-between text-[8px] text-gray-500 px-1">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[9px] text-gray-500">Light</span>
        <div className="flex gap-1">
          {[0, 0.3, 0.6, 0.9].map((ratio, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getColor(ratio * maxIntensity) }}
            />
          ))}
        </div>
        <span className="text-[9px] text-gray-500">Heavy</span>
      </div>
    </div>
  );
});

// 6. Team Calendar Load Comparison
interface TeamCalendarLoadProps {
  data: {
    userMeetingHours: number;
    teamAverage: number;
    metric: string;
  };
}

export const TeamCalendarLoad = memo(function TeamCalendarLoad({ data }: TeamCalendarLoadProps) {
  const { userMeetingHours, teamAverage, metric } = data;
  const maxValue = Math.max(userMeetingHours, teamAverage);
  const userPercentage = (userMeetingHours / maxValue) * 100;
  const teamPercentage = (teamAverage / maxValue) * 100;
  const difference = userMeetingHours - teamAverage;
  const isOverloaded = difference > 5; // More than 5 hours above average
  
  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="text-center">
        <div className="text-xs text-gray-400">{metric}</div>
        <div className={`text-sm mt-1 ${isOverloaded ? 'text-red-400' : difference > 0 ? 'text-amber-400' : 'text-green-400'}`}>
          {difference > 0 ? '+' : ''}{difference.toFixed(1)}h {difference > 0 ? 'above' : 'below'} team average
        </div>
      </div>
      
      {/* Bar comparison */}
      <div className="space-y-3">
        {/* You */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400">You</span>
            <span className="text-[10px] text-white">{userMeetingHours}h</span>
          </div>
          <div className="h-6 bg-[#1a1c20] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                isOverloaded 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${userPercentage}%` }}
            >
              <span className="text-[10px] text-white">{userMeetingHours}h</span>
            </div>
          </div>
        </div>
        
        {/* Team Average */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-400">Team Avg</span>
            <span className="text-[10px] text-white">{teamAverage}h</span>
          </div>
          <div className="h-6 bg-[#1a1c20] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${teamPercentage}%` }}
            >
              <span className="text-[10px] text-white">{teamAverage}h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Warning/recommendation */}
      <div className={`rounded-lg p-2 text-center ${
        isOverloaded 
          ? 'bg-red-500/10 border border-red-500/20' 
          : difference > 0 
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'bg-green-500/10 border border-green-500/20'
      }`}>
        <div className={`text-xs ${
          isOverloaded ? 'text-red-400' : difference > 0 ? 'text-amber-400' : 'text-green-400'
        }`}>
          {isOverloaded ? '⚠️ Meeting overload!' : difference > 0 ? '📊 Above average' : '✅ Well-balanced'}
        </div>
        <div className="text-[9px] text-gray-500 mt-0.5">
          {isOverloaded 
            ? 'Consider declining or delegating meetings' 
            : difference > 0 
            ? 'Slightly more meetings than team'
            : 'Your schedule is well-balanced'}
        </div>
      </div>
    </div>
  );
});

// 7. Hourly Intensity Heatmap (for showing meeting intensity by hour of day)
interface HourlyIntensityProps {
  data: {
    hour: string;
    intensity: number; // 0-10 scale
  }[];
}

export const HourlyIntensity = memo(function HourlyIntensity({ data }: HourlyIntensityProps) {
  const maxIntensity = 10;
  
  const getColor = (intensity: number) => {
    if (intensity === 0) return '#2a2c34';
    const ratio = intensity / maxIntensity;
    if (ratio < 0.3) return '#10b981';
    if (ratio < 0.6) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="space-y-3">
      {/* Horizontal heatmap bars */}
      <div className="space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-12 text-[10px] text-gray-500">{item.hour}</div>
            <div className="flex-1 flex gap-0.5">
              <div
                className="flex-1 h-6 rounded transition-all duration-200 hover:ring-1 hover:ring-cyan-400 flex items-center justify-center"
                style={{ backgroundColor: getColor(item.intensity) }}
                title={`${item.hour}: ${item.intensity} meetings`}
              >
                <span className="text-[9px] text-white/80">{item.intensity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[9px] text-gray-500">Light</span>
        <div className="flex gap-1">
          {[0, 0.3, 0.6, 0.9].map((ratio, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getColor(ratio * maxIntensity) }}
            />
          ))}
        </div>
        <span className="text-[9px] text-gray-500">Heavy</span>
      </div>
    </div>
  );
});

// ============================================================================
// ENERGY & FOCUS VISUALIZATIONS - Research-backed energy management graphs
// ============================================================================

// 1. Daily Energy Curve - Shows personalized circadian rhythm throughout the day
interface DailyEnergyCurveProps {
  data: {
    time: string;
    energy: number;
  }[];
}

export const DailyEnergyCurve = memo(function DailyEnergyCurve({ data }: DailyEnergyCurveProps) {
  const maxEnergy = Math.max(...data.map(d => d.energy));
  const minEnergy = Math.min(...data.map(d => d.energy));
  
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-400">
        Personalized circadian rhythm - schedule tough tasks during peaks
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="energy" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fill="url(#energyGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[9px] text-gray-500">
        <div>Peak: {maxEnergy}% @ {data.find(d => d.energy === maxEnergy)?.time}</div>
        <div>Low: {minEnergy}% @ {data.find(d => d.energy === minEnergy)?.time}</div>
      </div>
    </div>
  );
});

// 2. Weekly Energy Trend - Shows average daily energy for each day of the week
interface WeeklyEnergyTrendProps {
  data: {
    day: string;
    energy: number;
    focus: number;
  }[];
}

export const WeeklyEnergyTrend = memo(function WeeklyEnergyTrend({ data }: WeeklyEnergyTrendProps) {
  const avgEnergy = data.reduce((sum, d) => sum + d.energy, 0) / data.length;
  const lowestDay = data.reduce((min, d) => d.energy < min.energy ? d : min, data[0]);
  
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-400">
        Weekly patterns - {lowestDay.day} shows lowest energy at {lowestDay.energy}%
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.energy >= avgEnergy ? '#10b981' : '#f59e0b'} 
              />
            ))}
          </Bar>
          <Bar dataKey="focus" radius={[4, 4, 0, 0]} fill="#8b5cf6" opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 text-[9px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Energy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-gray-400">Focus</span>
        </div>
      </div>
    </div>
  );
});

// 3. Energy vs Sleep Correlation - Scatter plot showing sleep-energy relationship
interface EnergySleepCorrelationProps {
  data: {
    sleep: number;
    energy: number;
  }[];
}

export const EnergySleepCorrelation = memo(function EnergySleepCorrelation({ data }: EnergySleepCorrelationProps) {
  // Calculate simple correlation
  const avgSleep = data.reduce((sum, d) => sum + d.sleep, 0) / data.length;
  const avgEnergy = data.reduce((sum, d) => sum + d.energy, 0) / data.length;
  
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-400">
        More sleep generally correlates with higher energy levels
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data.sort((a, b) => a.sleep - b.sleep)}>
          <defs>
            <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="energy" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fill="url(#sleepGradient)" 
          />
          <Line 
            type="monotone" 
            dataKey={(d) => avgEnergy} 
            stroke="#4b5563" 
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div className="bg-[#1a1c20] rounded p-2">
          <div className="text-gray-500">Avg Sleep</div>
          <div className="text-white">{avgSleep.toFixed(1)}h</div>
        </div>
        <div className="bg-[#1a1c20] rounded p-2">
          <div className="text-gray-500">Avg Energy</div>
          <div className="text-white">{avgEnergy.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
});

// 4. Focus Session Durations - Histogram showing distribution of focus intervals
interface FocusSessionDurationsProps {
  data: {
    duration: string;
    count: number;
    color: string;
  }[];
}

export const FocusSessionDurations = memo(function FocusSessionDurations({ data }: FocusSessionDurationsProps) {
  const totalSessions = data.reduce((sum, d) => sum + d.count, 0);
  const mostCommon = data.reduce((max, d) => d.count > max.count ? d : max, data[0]);
  
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-400">
        Most sessions are {mostCommon.duration} ({mostCommon.count} times) - gradually increase duration
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-[10px]">
        <span className="text-gray-400">Total Sessions: </span>
        <span className="text-white">{totalSessions}</span>
      </div>
    </div>
  );
});

// 5. Energy Heatmap - 7x24 grid showing energy patterns by time of day and day of week
interface EnergyHeatmapProps {
  data: {
    Mon: number[];
    Tue: number[];
    Wed: number[];
    Thu: number[];
    Fri: number[];
    Sat: number[];
    Sun: number[];
  };
}

export const EnergyHeatmap = memo(function EnergyHeatmap({ data }: EnergyHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['12a', '4a', '8a', '12p', '4p', '8p'];
  
  const getColor = (energy: number) => {
    if (energy < 40) return '#1e2128';
    if (energy < 50) return '#374151';
    if (energy < 60) return '#4b5563';
    if (energy < 70) return '#6b7280';
    if (energy < 80) return '#f59e0b';
    return '#10b981';
  };
  
  return (
    <div className="space-y-3">
      <div className="text-[10px] text-gray-400">
        Dark pockets indicate low energy - schedule breaks or lighter tasks
      </div>
      
      {/* Heatmap Grid */}
      <div className="space-y-1">
        {days.map((day) => (
          <div key={day} className="flex items-center gap-1">
            <div className="w-8 text-[9px] text-gray-500">{day}</div>
            <div className="flex-1 grid grid-cols-24 gap-0.5">
              {data[day as keyof typeof data].map((energy, hour) => (
                <div
                  key={hour}
                  className="h-4 rounded-sm transition-all duration-200 hover:ring-1 hover:ring-cyan-400"
                  style={{ backgroundColor: getColor(energy) }}
                  title={`${day} ${hour}:00 - ${energy}%`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Time labels */}
      <div className="flex items-center gap-1">
        <div className="w-8"></div>
        <div className="flex-1 grid grid-cols-6 text-[8px] text-gray-500">
          {hours.map((hour) => (
            <div key={hour}>{hour}</div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[9px] text-gray-500">Low</span>
        <div className="flex gap-1">
          {[35, 55, 65, 75, 85].map((val) => (
            <div
              key={val}
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getColor(val) }}
            />
          ))}
        </div>
        <span className="text-[9px] text-gray-500">High</span>
      </div>
    </div>
  );
});
