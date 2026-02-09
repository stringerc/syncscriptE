import { memo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface MiniSparklineProps {
  data: number[];
  label?: string;
}

export const MiniSparkline = memo(function MiniSparkline({ data, label }: MiniSparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#06b6d4" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

interface MiniBarChartProps {
  data: { name: string; value: number }[];
  label?: string;
}

export const MiniBarChart = memo(function MiniBarChart({ data, label }: MiniBarChartProps) {
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <ResponsiveContainer width="100%" height={60}>
        <BarChart data={data}>
          <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

interface MiniLineChartProps {
  data: { name?: string; time?: string; week?: string; value: number; target?: number }[];
  label?: string;
}

export const MiniLineChart = memo(function MiniLineChart({ data, label }: MiniLineChartProps) {
  const hasTarget = data.some(d => d.target !== undefined);
  
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 15, left: -15 }}>
          {/* Actual value line */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#06b6d4" 
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 3 }}
            label={{ 
              position: 'top', 
              fill: '#06b6d4', 
              fontSize: 10,
              offset: 5
            }}
          />
          {/* Target line (dashed) */}
          {hasTarget && (
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#6b7280" 
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-cyan-400" />
          <span className="text-[9px] text-gray-400">Actual</span>
        </div>
        {hasTarget && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-gray-500 border-dashed border-t border-gray-500" />
            <span className="text-[9px] text-gray-400">Target</span>
          </div>
        )}
      </div>
    </div>
  );
});

interface MiniAreaChartProps {
  data: { name?: string; week?: string; value: number }[];
  label?: string;
}

export const MiniAreaChart = memo(function MiniAreaChart({ data, label }: MiniAreaChartProps) {
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#06b6d4" 
            strokeWidth={2}
            fill="url(#colorArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

interface MiniDonutChartProps {
  data: { name: string; value: number }[];
  label?: string;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'];

export const MiniDonutChart = memo(function MiniDonutChart({ data, label }: MiniDonutChartProps) {
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <div className="flex items-center gap-3">
        <ResponsiveContainer width="50%" height={60}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={15}
              outerRadius={25}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[10px] text-gray-400">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

interface MiniGaugeProps {
  value: number;
  max?: number;
  label?: string;
}

export const MiniGauge = memo(function MiniGauge({ value, max = 100, label }: MiniGaugeProps) {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;
  
  return (
    <div className="mt-3">
      {label && <p className="text-xs text-gray-400 mb-2">{label}</p>}
      <div className="relative w-full h-14 flex items-end justify-center">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#1e2128"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 10 45 A 40 40 0 0 1 90 45"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.26} 126`}
          />
          {/* Needle */}
          <line
            x1="50"
            y1="45"
            x2="50"
            y2="15"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation} 50 45)`}
          />
          {/* Center dot */}
          <circle cx="50" cy="45" r="3" fill="#8b5cf6" />
        </svg>
        <div className="absolute bottom-0 text-center">
          <p className="text-white text-xs font-medium">{value}</p>
        </div>
      </div>
    </div>
  );
});

// Dynamic chart selector
interface DynamicMiniChartProps {
  type?: 'line' | 'bar' | 'area' | 'sparkline' | 'donut' | 'gauge';
  data?: any[];
  label?: string;
}

export const DynamicMiniChart = memo(function DynamicMiniChart({ type, data, label }: DynamicMiniChartProps) {
  if (!type || !data || data.length === 0) {
    return null;
  }

  switch (type) {
    case 'sparkline':
      return <MiniSparkline data={data as number[]} label={label} />;
    case 'bar':
      return <MiniBarChart data={data as { name: string; value: number }[]} label={label} />;
    case 'line':
      return <MiniLineChart data={data as any[]} label={label} />;
    case 'area':
      return <MiniAreaChart data={data as any[]} label={label} />;
    case 'donut':
      return <MiniDonutChart data={data as { name: string; value: number }[]} label={label} />;
    case 'gauge':
      return <MiniGauge value={data[0] as number} label={label} />;
    default:
      return null;
  }
});
