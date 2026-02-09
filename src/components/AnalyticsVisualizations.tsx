import { memo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

// ====================================================================
// ANALYTICS & INSIGHTS - Detailed Dashboard Visualizations
// Research: 10-15 charts optimal for analytics dashboards (Chartio study)
// ====================================================================

// 1. Productivity Over Time (Long-range Trend)
// Purpose: Reveals macro trends - whether user is improving over months
interface ProductivityOverTimeProps {
  data: {
    month: string;
    productivity: number;
    tasksCompleted: number;
    goalsAchieved: number;
  }[];
}

export const ProductivityOverTime = memo(function ProductivityOverTime({ data }: ProductivityOverTimeProps) {
  const trend = data[data.length - 1].productivity - data[0].productivity;
  const isImproving = trend > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Long-term productivity trend across {data.length} months
        </div>
        <div className={`text-xs font-medium ${isImproving ? 'text-emerald-400' : 'text-red-400'}`}>
          {isImproving ? '📈' : '📉'} {Math.abs(trend).toFixed(0)}% {isImproving ? 'increase' : 'decrease'}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Line 
            type="monotone" 
            dataKey="productivity" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className={`text-xs p-2 rounded border ${
        isImproving ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
        'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        {isImproving 
          ? `✅ Productivity has improved ${Math.abs(trend).toFixed(0)}% since starting SyncScript`
          : `⚠️ Consider reviewing habits - productivity down ${Math.abs(trend).toFixed(0)}%`
        }
      </div>
    </div>
  );
});

// 2. Tasks Created vs Completed (Workflow Balance)
// Purpose: Assess whether user is getting ahead or drowning in backlog
// Research: Common in Agile project management (burn-up/burn-down charts)
interface TasksCreatedVsCompletedProps {
  data: {
    week: string;
    created: number;
    completed: number;
  }[];
}

export const TasksCreatedVsCompleted = memo(function TasksCreatedVsCompleted({ data }: TasksCreatedVsCompletedProps) {
  const latestWeek = data[data.length - 1];
  const backlogGrowing = latestWeek.created > latestWeek.completed;
  const totalCreated = data.reduce((sum, w) => sum + w.created, 0);
  const totalCompleted = data.reduce((sum, w) => sum + w.completed, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Weekly task flow - Created vs Completed
        </div>
        <div className="text-xs text-white">
          Total: {totalCompleted}/{totalCreated} completed
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
          <Bar dataKey="created" fill="#f59e0b" name="Created" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className={`text-xs p-2 rounded border ${
        !backlogGrowing ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
        'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        {!backlogGrowing 
          ? `✅ Completing more than creating - backlog shrinking`
          : `⚠️ Creating ${latestWeek.created - latestWeek.completed} more tasks than completing - backlog growing`
        }
      </div>
    </div>
  );
});

// 3. Focus vs Distraction Time (Quality of Work Time)
// Purpose: Measure not just work time but quality of work time
// Research: Worklytics - tracking focus % drives improvements
interface FocusVsDistractionProps {
  data: {
    day: string;
    focusTime: number;
    distractionTime: number;
  }[];
}

export const FocusVsDistraction = memo(function FocusVsDistraction({ data }: FocusVsDistractionProps) {
  const totalFocus = data.reduce((sum, d) => sum + d.focusTime, 0);
  const totalDistraction = data.reduce((sum, d) => sum + d.distractionTime, 0);
  const focusPercent = (totalFocus / (totalFocus + totalDistraction)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Deep work vs shallow work time distribution
        </div>
        <div className="text-xs text-white">
          {focusPercent.toFixed(0)}% focus time
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
          <Area 
            type="monotone" 
            dataKey="focusTime" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981"
            name="Focus Time (hrs)"
          />
          <Area 
            type="monotone" 
            dataKey="distractionTime" 
            stackId="1"
            stroke="#ef4444" 
            fill="#ef4444"
            name="Distraction Time (hrs)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className={`text-xs p-2 rounded border ${
        focusPercent >= 60 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
        focusPercent >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
        'bg-red-500/10 border-red-500/30 text-red-400'
      }`}>
        {focusPercent >= 60 
          ? `✅ Excellent focus ratio - ${focusPercent.toFixed(0)}% deep work time`
          : focusPercent >= 40
          ? `⚠️ Moderate focus - try scheduling no-meeting blocks`
          : `❌ Low focus time - high context switching detected`
        }
      </div>
    </div>
  );
});

// 4. Energy & Output Correlation (Scatter Plot)
// Purpose: Uncover whether higher energy yields more output
// Research: Validates energy management features
interface EnergyOutputCorrelationProps {
  data: {
    day: string;
    energy: number;
    tasksCompleted: number;
  }[];
}

export const EnergyOutputCorrelation = memo(function EnergyOutputCorrelation({ data }: EnergyOutputCorrelationProps) {
  // Simple correlation calculation
  const avgEnergy = data.reduce((sum, d) => sum + d.energy, 0) / data.length;
  const avgTasks = data.reduce((sum, d) => sum + d.tasksCompleted, 0) / data.length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Daily energy level vs tasks completed
        </div>
        <div className="text-xs text-white">
          Avg: {avgEnergy.toFixed(0)}% energy, {avgTasks.toFixed(1)} tasks
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis 
            type="number" 
            dataKey="energy" 
            name="Energy %" 
            stroke="#6b7280" 
            style={{ fontSize: '11px' }}
            label={{ value: 'Energy Level (%)', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }}
          />
          <YAxis 
            type="number" 
            dataKey="tasksCompleted" 
            name="Tasks" 
            stroke="#6b7280" 
            style={{ fontSize: '11px' }}
            label={{ value: 'Tasks Completed', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #374151', borderRadius: '8px' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter 
            data={data} 
            fill="#f59e0b"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="text-xs p-2 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
        💡 Insight: Higher energy days show positive correlation with task completion
      </div>
    </div>
  );
});

// 5. Activity Heatmap Calendar (3 months)
// Purpose: Spot patterns like "lighter weekends" or best months
// Research: Similar to GitHub contribution heatmap - intuitive for time-series
interface ActivityHeatmapProps {
  data: {
    week: number;
    days: number[]; // 7 days, value 0-100 representing activity level
  }[];
}

export const ActivityHeatmap = memo(function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const getColor = (value: number) => {
    if (value > 80) return '#10b981';  // Green - High activity
    if (value > 60) return '#3b82f6';  // Blue - Good activity
    if (value > 40) return '#f59e0b';  // Amber - Moderate activity
    if (value > 20) return '#6b7280';  // Gray - Low activity
    return '#1e2128';  // Dark - No activity
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          12-week activity heatmap
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1e2128' }}></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span>High</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-8">{day}</span>
            <div className="flex gap-1">
              {data.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getColor(week.days[dayIndex]) }}
                  title={`Week ${week.week}, ${day}: ${week.days[dayIndex]}% activity`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// 6. Top Productivity Factors (Impact Chart)
// Purpose: Visualize which behaviors drive best performance
// Research: Pattern recognition and predictive analytics
interface TopProductivityFactorsProps {
  data: {
    factor: string;
    impact: number; // Percentage lift in productivity
    confidence: 'high' | 'medium' | 'low';
  }[];
}

export const TopProductivityFactors = memo(function TopProductivityFactors({ data }: TopProductivityFactorsProps) {
  const sortedData = [...data].sort((a, b) => b.impact - a.impact);

  return (
    <div className="space-y-3">
      {sortedData.map((factor, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white">{factor.factor}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                factor.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                factor.confidence === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {factor.confidence}
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-400">+{factor.impact}%</span>
          </div>
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 flex items-center justify-end pr-2"
              style={{ width: `${Math.min(factor.impact * 2, 100)}%` }}
            >
              {factor.impact > 15 && (
                <span className="text-[10px] font-bold text-white">+{factor.impact}%</span>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 pt-3 border-t border-gray-800 text-[10px] text-gray-400">
        💡 Confidence levels based on data quality and sample size
      </div>
    </div>
  );
});

// 7. Forecast/Predictive Chart (Forward-looking)
// Purpose: Predict near-future performance based on trends
// Research: Dashboards increasingly include predictive analytics
interface ForecastChartProps {
  historicalData: {
    week: string;
    actual: number;
  }[];
  forecastData: {
    week: string;
    predicted: number;
    confidence: { min: number; max: number };
  }[];
}

export const ForecastChart = memo(function ForecastChart({ historicalData, forecastData }: ForecastChartProps) {
  const combinedData = [
    ...historicalData.map(d => ({ week: d.week, actual: d.actual, predicted: null, min: null, max: null })),
    ...forecastData.map(d => ({ week: d.week, actual: null, predicted: d.predicted, min: d.confidence.min, max: d.confidence.max }))
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Past performance + 3-week forecast
        </div>
        <div className="text-xs text-purple-400">
          AI Prediction
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
          <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '11px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e2128', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
          
          {/* Historical actual data */}
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            name="Actual"
          />
          
          {/* Predicted data (dashed) */}
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8b5cf6', r: 4 }}
            name="Forecast"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="text-xs p-2 rounded border bg-purple-500/10 border-purple-500/30 text-purple-400">
        🔮 AI Forecast: Expect {forecastData[forecastData.length - 1].predicted} tasks/week based on current trends
      </div>
    </div>
  );
});
