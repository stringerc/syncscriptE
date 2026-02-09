import React, { useState } from 'react';
import { TrendingUp, Target, Award, Activity, ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

// Multi-Factor Correlation Heatmap - Compact version for sidebar
export function CorrelationHeatmap() {
  const factors = ['Sleep', 'Energy', 'Focus', 'Tasks', 'Meetings'];
  
  // Correlation matrix (symmetric, -1 to 1) - reduced to 5x5 for space
  const correlations = [
    [1.0, 0.72, 0.65, 0.81, -0.43],   // Sleep
    [0.72, 1.0, 0.78, 0.69, -0.35],   // Energy
    [0.65, 0.78, 1.0, 0.88, -0.52],   // Focus
    [0.81, 0.69, 0.88, 1.0, -0.61],   // Tasks
    [-0.43, -0.35, -0.52, -0.61, 1.0] // Meetings
  ];

  const getColor = (value: number) => {
    if (value === 1.0) return 'bg-gray-800'; // Diagonal (self-correlation)
    
    // Positive correlations: green shades
    if (value > 0.7) return 'bg-emerald-500';
    if (value > 0.5) return 'bg-emerald-400';
    if (value > 0.3) return 'bg-teal-400';
    if (value > 0) return 'bg-teal-300';
    
    // Negative correlations: red/orange shades
    if (value < -0.5) return 'bg-red-500';
    if (value < -0.3) return 'bg-orange-500';
    if (value < -0.1) return 'bg-orange-400';
    return 'bg-gray-600';
  };

  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded" />
          <span>Strong+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-teal-400 rounded" />
          <span>Mod+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded" />
          <span>Neg</span>
        </div>
      </div>

      {/* Compact Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `50px repeat(${factors.length}, 1fr)` }}>
          {/* Top-left corner cell */}
          <div />
          
          {/* Column headers */}
          {factors.map((factor, i) => (
            <div key={`header-${i}`} className="text-[9px] text-gray-400 text-center pb-1 min-w-[36px]">
              <div className="transform -rotate-45 origin-left mt-5 whitespace-nowrap">{factor}</div>
            </div>
          ))}
          
          {/* Rows */}
          {factors.map((rowFactor, rowIdx) => (
            <React.Fragment key={`row-${rowIdx}`}>
              {/* Row label */}
              <div className="text-[9px] text-gray-400 pr-1 flex items-center justify-end">
                {rowFactor}
              </div>
              
              {/* Cells */}
              {factors.map((colFactor, colIdx) => {
                const value = correlations[rowIdx][colIdx];
                const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                
                return (
                  <div
                    key={`cell-${rowIdx}-${colIdx}`}
                    className={`${getColor(value)} rounded transition-all cursor-pointer hover:scale-110 hover:z-10 relative group min-w-[36px] h-[36px] flex items-center justify-center`}
                    onMouseEnter={() => setHoveredCell({row: rowIdx, col: colIdx})}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {/* Value label - only show for non-diagonal */}
                    {rowIdx !== colIdx && (
                      <span className={`text-[8px] font-medium ${
                        Math.abs(value) > 0.5 ? 'text-white' : 'text-gray-900'
                      }`}>
                        {value.toFixed(1)}
                      </span>
                    )}
                    
                    {/* Hover tooltip */}
                    {isHovered && rowIdx !== colIdx && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                        <div className="font-medium">{rowFactor} ↔ {colFactor}</div>
                        <div className="text-gray-400">
                          {value > 0 ? '+' : ''}{value.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Key Insight from heatmap */}
      <div className="mt-2 p-2 bg-emerald-950/30 border border-emerald-600/30 rounded">
        <p className="text-[10px] text-gray-300 leading-relaxed">
          <span className="text-emerald-400 font-medium">Top resonance:</span> Focus & Tasks (0.88) – focused hours amplify output
        </p>
      </div>
    </div>
  );
}

// Key Insight Highlight
export function KeyInsightHighlight() {
  return (
    <div className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border border-purple-600/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
        <Badge className="bg-purple-600 text-white border-0 text-[10px]">KEY INSIGHT</Badge>
      </div>
      
      <h3 className="text-white text-sm mb-2 leading-tight">
        Focus Time = Goal Achievement
      </h3>
      <p className="text-gray-400 text-xs mb-3 leading-relaxed">
        Days with 3+ focused hours yield 2.4× more completed tasks.
      </p>
      
      {/* Mini metrics */}
      <div className="flex items-center gap-4">
        <div className="text-center flex-1 bg-black/30 rounded p-2">
          <div className="text-lg text-purple-400 font-bold">0.88</div>
          <div className="text-[10px] text-gray-500">Correlation</div>
        </div>
        <div className="text-center flex-1 bg-black/30 rounded p-2">
          <div className="text-lg text-emerald-400 font-bold">+240%</div>
          <div className="text-[10px] text-gray-500">Output</div>
        </div>
      </div>
    </div>
  );
}

// Personal Benchmarking Chart
export function PersonalBenchmarking() {
  const userPercentile = 82; // User is in top 18%
  const vsLastQuarter = 15; // +15% improvement
  
  return (
    <div className="space-y-4">
      {/* Community Benchmark */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm text-gray-300">Community Ranking</h4>
          <Badge className="bg-teal-600/20 text-teal-400 border-teal-600/30">Top 18%</Badge>
        </div>
        
        <div className="relative h-12 bg-gray-800 rounded-full overflow-hidden">
          {/* Full bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-teal-600/30 to-teal-600" />
          
          {/* User marker */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50"
            style={{ left: `${userPercentile}%` }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-white text-gray-900 text-xs font-bold px-2 py-1 rounded">
                You: {userPercentile}th
              </div>
            </div>
          </div>
          
          {/* Percentile markers */}
          <div className="absolute inset-0 flex justify-between items-center px-2 text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Your weekly productivity score is higher than 82% of active users
        </p>
      </div>

      {/* vs Last Quarter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm text-gray-300">vs 3-Month Avg</h4>
          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">+{vsLastQuarter}%</Badge>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Previous Quarter</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '70%' }} />
            </div>
            <div className="text-sm text-white mt-1">70 pts</div>
          </div>
          
          <div className="flex-1 bg-gray-800 rounded-lg p-3 ring-2 ring-emerald-600/50">
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
            </div>
            <div className="text-sm text-emerald-400 mt-1 font-bold">85 pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// All-Features Usage Spider Chart
export function FeatureUsageSpider() {
  const features = [
    { name: 'Tasks', value: 90, color: 'text-blue-400' },
    { name: 'Calendar', value: 75, color: 'text-purple-400' },
    { name: 'Energy', value: 85, color: 'text-amber-400' },
    { name: 'AI', value: 60, color: 'text-cyan-400' },
    { name: 'Analytics', value: 70, color: 'text-pink-400' },
    { name: 'Scripts', value: 35, color: 'text-teal-400' },
  ];

  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;
  const numPoints = features.length;

  // Calculate polygon points
  const points = features.map((feature, i) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
    const radius = (feature.value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      labelX: centerX + (maxRadius + 25) * Math.cos(angle),
      labelY: centerY + (maxRadius + 25) * Math.sin(angle),
    };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Create web grid (background circles)
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <div className="space-y-4">
      <svg viewBox="0 0 200 200" className="w-full h-[240px]">
        {/* Background web circles */}
        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={centerX}
            cy={centerY}
            r={(level / 100) * maxRadius}
            fill="none"
            stroke="#374151"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* Web lines from center */}
        {points.map((point, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={point.labelX}
            y2={point.labelY}
            stroke="#374151"
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* User's usage polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(20, 184, 166, 0.2)"
          stroke="#14b8a6"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#14b8a6"
              stroke="#fff"
              strokeWidth="2"
            />
            
            {/* Labels */}
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-gray-300 font-medium"
            >
              {features[i].name}
            </text>
            <text
              x={point.labelX}
              y={point.labelY + 10}
              textAnchor="middle"
              className="text-[9px] fill-gray-500"
            >
              {features[i].value}%
            </text>
          </g>
        ))}
      </svg>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-950/30 border border-emerald-600/30 rounded p-2">
          <div className="text-xs text-emerald-400 font-medium mb-0.5">Well utilized</div>
          <div className="text-xs text-gray-400">Tasks, Energy</div>
        </div>
        <div className="bg-orange-950/30 border border-orange-600/30 rounded p-2 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs text-orange-400 font-medium mb-0.5">Opportunity</div>
            <div className="text-xs text-gray-400">Scripts (35%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Forecast vs Actual Chart
export function ForecastVsActual() {
  const data = [
    { day: 'Mon', predicted: 8, actual: 7 },
    { day: 'Tue', predicted: 7, actual: 8 },
    { day: 'Wed', predicted: 9, actual: 9 },
    { day: 'Thu', predicted: 6, actual: 5 },
    { day: 'Fri', predicted: 8, actual: 8 },
    { day: 'Sat', predicted: 4, actual: 3 },
    { day: 'Sun', predicted: 3, actual: 4 },
  ];

  const maxValue = 10;
  const accuracy = Math.round(
    (data.reduce((sum, d) => sum + (1 - Math.abs(d.predicted - d.actual) / maxValue), 0) / data.length) * 100
  );

  return (
    <div className="space-y-4">
      {/* Accuracy Badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm text-gray-300">AI Prediction Accuracy</h4>
        <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">{accuracy}% accurate</Badge>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        {data.map((item, i) => {
          const predictedHeight = (item.predicted / maxValue) * 100;
          const actualHeight = (item.actual / maxValue) * 100;
          const diff = item.actual - item.predicted;
          
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">{item.day}</div>
              
              {/* Bars */}
              <div className="flex-1 flex gap-2">
                {/* Predicted */}
                <div className="flex-1">
                  <div className="h-8 bg-gray-800 rounded overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500/50 border-t-2 border-blue-400"
                      style={{ height: `${predictedHeight}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-300">
                      {item.predicted}
                    </div>
                  </div>
                </div>
                
                {/* Actual */}
                <div className="flex-1">
                  <div className="h-8 bg-gray-800 rounded overflow-hidden relative">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-emerald-500 border-t-2 border-emerald-400"
                      style={{ height: `${actualHeight}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {item.actual}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Difference indicator */}
              <div className="w-12 text-xs text-right">
                <span className={diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-orange-400' : 'text-gray-500'}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500/50 border border-blue-400 rounded" />
          <span>AI Predicted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500 rounded" />
          <span>Actual</span>
        </div>
      </div>

      {/* Insight */}
      <div className="p-3 bg-blue-950/30 border border-blue-600/30 rounded-lg">
        <p className="text-xs text-gray-300">
          <span className="text-blue-400 font-medium">Strong alignment:</span> The AI's predictions closely match your 
          actual performance, validating the resonance model. Thursday's dip was accurately forecasted.
        </p>
      </div>
    </div>
  );
}
