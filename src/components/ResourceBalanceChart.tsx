/**
 * Resource Balance Radar Chart
 * 
 * Visualizes multi-dimensional resource balance using a radar/spider chart
 * Inspired by Figure 4 from Resonance Calculus framework
 */

import { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ResourceBalance, getDimensionColor } from '../utils/resource-balance';

interface ResourceBalanceChartProps {
  balance: ResourceBalance;
  showLegend?: boolean;
  height?: number;
}

export function ResourceBalanceChart({ 
  balance, 
  showLegend = true,
  height = 400 
}: ResourceBalanceChartProps) {
  // Transform balance data for recharts
  const chartData = useMemo(() => {
    return [
      {
        dimension: 'Time',
        score: balance.time * 100, // Convert to percentage
        fullMark: 100,
      },
      {
        dimension: 'Energy',
        score: balance.energy * 100,
        fullMark: 100,
      },
      {
        dimension: 'Budget',
        score: balance.budget * 100,
        fullMark: 100,
      },
      {
        dimension: 'Focus',
        score: balance.focus * 100,
        fullMark: 100,
      },
    ];
  }, [balance]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const score = data.score / 100;
      
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-1">{data.dimension}</p>
          <p className="text-teal-400 text-sm">
            Score: {data.score.toFixed(0)}%
          </p>
          <div className="mt-1">
            <div 
              className="h-1 rounded-full"
              style={{
                width: '60px',
                backgroundColor: getDimensionColor(score),
              }}
            />
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData}>
          {/* Grid */}
          <PolarGrid 
            stroke="#374151" 
            strokeWidth={1}
          />
          
          {/* Angle Axis (dimension labels) */}
          <PolarAngleAxis 
            dataKey="dimension"
            tick={{ fill: '#9ca3af', fontSize: 14 }}
            tickLine={false}
          />
          
          {/* Radius Axis (score scale) */}
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickCount={6}
          />
          
          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />
          
          {/* Data */}
          <Radar
            name="Balance"
            dataKey="score"
            stroke="#14b8a6"
            fill="#14b8a6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-400">Excellent (85-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-gray-400">Good (70-84%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-400">Fair (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-400">Poor (&lt;50%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact dimension card for detailed view
 */
interface DimensionCardProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
  insights?: string[];
}

export function DimensionCard({ label, score, icon, insights }: DimensionCardProps) {
  const color = getDimensionColor(score);
  const percentage = Math.round(score * 100);
  
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-white font-medium">{label}</h4>
        </div>
        <div className="text-right">
          <div 
            className="text-2xl font-bold"
            style={{ color }}
          >
            {percentage}%
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      
      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="space-y-1">
          {insights.slice(0, 2).map((insight, idx) => (
            <p key={idx} className="text-xs text-gray-400">
              {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Balance summary widget (compact version for dashboard)
 */
interface BalanceSummaryProps {
  balance: ResourceBalance;
  onClick?: () => void;
}

export function BalanceSummary({ balance, onClick }: BalanceSummaryProps) {
  const dimensions = [
    { label: 'Time', value: balance.time, key: 'time' },
    { label: 'Energy', value: balance.energy, key: 'energy' },
    { label: 'Budget', value: balance.budget, key: 'budget' },
    { label: 'Focus', value: balance.focus, key: 'focus' },
  ];
  
  const lowestDimension = dimensions.reduce((min, d) => 
    d.value < min.value ? d : min
  );
  
  return (
    <div 
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 cursor-pointer hover:border-teal-500/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">Resource Balance</h4>
        <div className="text-right">
          <div 
            className="text-xl font-bold"
            style={{ color: getDimensionColor(balance.overall) }}
          >
            {Math.round(balance.overall * 100)}%
          </div>
          <div className="text-xs text-gray-400">Overall</div>
        </div>
      </div>
      
      {/* Dimension bars */}
      <div className="space-y-2">
        {dimensions.map(d => (
          <div key={d.key} className="flex items-center gap-2">
            <div className="text-xs text-gray-400 w-14">{d.label}</div>
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${d.value * 100}%`,
                  backgroundColor: getDimensionColor(d.value),
                }}
              />
            </div>
            <div 
              className="text-xs font-medium w-10 text-right"
              style={{ color: getDimensionColor(d.value) }}
            >
              {Math.round(d.value * 100)}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Warning if any dimension is low */}
      {lowestDimension.value < 0.50 && (
        <div className="mt-3 text-xs text-orange-400 flex items-center gap-1">
          <span>⚠️</span>
          <span>{lowestDimension.label} needs attention</span>
        </div>
      )}
    </div>
  );
}