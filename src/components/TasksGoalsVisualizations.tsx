import { memo } from 'react';

// ==================== TASKS AI INSIGHTS VISUALIZATIONS ====================

// 1. Tasks Completed Over Time (Trend Line)
interface TasksCompletedOverTimeProps {
  data: { day: string; completed: number }[];
}

export const TasksCompletedOverTime = memo(function TasksCompletedOverTime({ data }: TasksCompletedOverTimeProps) {
  const maxCompleted = Math.max(...data.map(d => d.completed));
  
  return (
    <div className="space-y-3">
      {/* Line chart with area */}
      <div className="h-40 relative">
        <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={160 - (percent / 100) * 160}
              x2="300"
              y2={160 - (percent / 100) * 160}
              stroke="#2a2c34"
              strokeWidth="1"
            />
          ))}
          
          {/* Area fill */}
          <path
            d={`M 0 160 ${data.map((item, i) => 
              `L ${(i / (data.length - 1)) * 300} ${160 - (item.completed / maxCompleted) * 160}`
            ).join(' ')} L 300 160 Z`}
            fill="url(#taskGradient)"
            opacity="0.2"
          />
          
          {/* Line */}
          <polyline
            points={data.map((item, i) => 
              `${(i / (data.length - 1)) * 300},${160 - (item.completed / maxCompleted) * 160}`
            ).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
          />
          
          {/* Data points */}
          {data.map((item, i) => (
            <circle
              key={i}
              cx={(i / (data.length - 1)) * 300}
              cy={160 - (item.completed / maxCompleted) * 160}
              r="4"
              fill="#10b981"
              stroke="#1e2128"
              strokeWidth="2"
            />
          ))}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Day labels */}
        <div className="flex justify-between mt-2">
          {data.map((item, i) => (
            <span key={i} className="text-[9px] text-gray-500">{item.day}</span>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <div>
          <div className="text-xs text-emerald-400">Total Completed This Week</div>
          <div className="text-lg text-white mt-0.5">{data.reduce((sum, d) => sum + d.completed, 0)} tasks</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Daily Average</div>
          <div className="text-lg text-emerald-400 mt-0.5">{(data.reduce((sum, d) => sum + d.completed, 0) / data.length).toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
});

// 2. Task Status Distribution (Pie/Bar Chart)
interface TaskStatusDistributionProps {
  data: { status: string; count: number; percentage: number; color: string }[];
}

export const TaskStatusDistribution = memo(function TaskStatusDistribution({ data }: TaskStatusDistributionProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="space-y-4">
      {/* Horizontal stacked bar */}
      <div className="space-y-2">
        <div className="flex h-12 rounded-lg overflow-hidden">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-center transition-all hover:brightness-110 cursor-pointer"
              style={{ 
                width: `${item.percentage}%`,
                backgroundColor: item.color 
              }}
              title={`${item.status}: ${item.count} (${item.percentage}%)`}
            >
              {item.percentage > 15 && (
                <span className="text-xs text-white">{item.percentage}%</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend with details */}
      <div className="grid grid-cols-3 gap-3">
        {data.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-400">{item.status}</span>
            </div>
            <div className="text-lg text-white">{item.count}</div>
            <div className="text-[9px] text-gray-500">{item.percentage}% of total</div>
          </div>
        ))}
      </div>
      
      {/* Insight */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-blue-400">📊 Total Tasks: {total}</div>
        <div className="text-[10px] text-gray-400 mt-1">
          {data[0].percentage >= 50 ? '✨ Great completion rate!' : '⚠️ Focus on clearing pending tasks'}
        </div>
      </div>
    </div>
  );
});

// 3. On-Time vs Overdue Tasks
interface OnTimeVsOverdueProps {
  data: {
    onTime: number;
    overdue: number;
    total: number;
    onTimePercentage: number;
    weeklyBreakdown: { week: string; onTime: number; overdue: number }[];
  };
}

export const OnTimeVsOverdue = memo(function OnTimeVsOverdue({ data }: OnTimeVsOverdueProps) {
  const { onTime, overdue, onTimePercentage, weeklyBreakdown } = data;
  
  return (
    <div className="space-y-4">
      {/* Large gauge display */}
      <div className="relative flex items-center justify-center py-6">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="#2a2c34"
            strokeWidth="12"
          />
          {/* Progress arc */}
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke={onTimePercentage >= 80 ? '#10b981' : onTimePercentage >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="12"
            strokeDasharray={`${(onTimePercentage / 100) * 377} 377`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl text-white">{onTimePercentage}%</div>
          <div className="text-[10px] text-gray-400 mt-1">On-Time Rate</div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="text-[10px] text-emerald-400">On-Time</div>
          <div className="text-2xl text-white mt-1">{onTime}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-[10px] text-red-400">Overdue</div>
          <div className="text-2xl text-white mt-1">{overdue}</div>
        </div>
      </div>
      
      {/* Weekly breakdown */}
      <div className="space-y-2">
        <div className="text-[10px] text-gray-400">Weekly Breakdown</div>
        {weeklyBreakdown.map((week, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-16 text-[9px] text-gray-500">{week.week}</div>
            <div className="flex-1 flex gap-1">
              <div 
                className="h-5 bg-emerald-500 rounded-l flex items-center justify-center"
                style={{ width: `${(week.onTime / (week.onTime + week.overdue)) * 100}%` }}
              >
                <span className="text-[9px] text-white">{week.onTime}</span>
              </div>
              <div 
                className="h-5 bg-red-500 rounded-r flex items-center justify-center"
                style={{ width: `${(week.overdue / (week.onTime + week.overdue)) * 100}%` }}
              >
                <span className="text-[9px] text-white">{week.overdue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// 4. Task Priority Breakdown
interface TaskPriorityBreakdownProps {
  data: { priority: string; count: number; pending: number; completed: number; color: string }[];
}

export const TaskPriorityBreakdown = memo(function TaskPriorityBreakdown({ data }: TaskPriorityBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* Stacked bars */}
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-300">{item.priority} Priority</span>
              </div>
              <span className="text-xs text-gray-500">{item.count} tasks</span>
            </div>
            <div className="flex gap-1 h-8">
              <div
                className="bg-emerald-600 rounded-l flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                style={{ width: `${(item.completed / item.count) * 100}%` }}
                title={`Completed: ${item.completed}`}
              >
                {item.completed > 0 && <span className="text-[10px] text-white">{item.completed}</span>}
              </div>
              <div
                className="bg-amber-600 rounded-r flex items-center justify-center hover:brightness-110 transition-all cursor-pointer"
                style={{ width: `${(item.pending / item.count) * 100}%` }}
                title={`Pending: ${item.pending}`}
              >
                {item.pending > 0 && <span className="text-[10px] text-white">{item.pending}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-600 rounded" />
          <span className="text-[9px] text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-600 rounded" />
          <span className="text-[9px] text-gray-400">Pending</span>
        </div>
      </div>
      
      {/* Priority insight */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-amber-400">
          ⚠️ {data[0].pending} high-priority tasks pending
        </div>
        <div className="text-[10px] text-gray-400 mt-1">Consider tackling these during peak energy hours</div>
      </div>
    </div>
  );
});

// 5. Workload by Person or Project
interface WorkloadByProjectProps {
  data: { name: string; completed: number; pending: number; total: number; color: string }[];
}

export const WorkloadByProject = memo(function WorkloadByProject({ data }: WorkloadByProjectProps) {
  return (
    <div className="space-y-3">
      {/* Horizontal bars */}
      <div className="space-y-2.5">
        {data.map((project, i) => {
          const completionRate = ((project.completed / project.total) * 100).toFixed(0);
          
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="text-xs text-gray-300">{project.name}</span>
                </div>
                <span className="text-xs text-gray-500">{project.total} tasks</span>
              </div>
              
              <div className="relative h-7 bg-gray-800/50 rounded-lg overflow-hidden">
                {/* Completed section */}
                <div
                  className="absolute left-0 top-0 h-full flex items-center justify-center transition-all"
                  style={{ 
                    width: `${(project.completed / project.total) * 100}%`,
                    backgroundColor: project.color
                  }}
                >
                  {project.completed > 0 && (
                    <span className="text-[10px] text-white z-10">{project.completed}</span>
                  )}
                </div>
                
                {/* Pending section */}
                <div
                  className="absolute h-full flex items-center justify-center transition-all"
                  style={{ 
                    left: `${(project.completed / project.total) * 100}%`,
                    width: `${(project.pending / project.total) * 100}%`,
                    backgroundColor: project.color,
                    opacity: 0.3
                  }}
                >
                  {project.pending > 0 && (
                    <span className="text-[10px] text-white z-10">{project.pending}</span>
                  )}
                </div>
                
                {/* Completion % label */}
                <div className="absolute right-2 top-0 h-full flex items-center">
                  <span className="text-[10px] text-gray-400">{completionRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-[9px] text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500/30 rounded" />
          <span className="text-[9px] text-gray-400">Pending</span>
        </div>
      </div>
      
      {/* Workload insight */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-cyan-400">
          💼 Most loaded: {data[0].name} ({data[0].total} tasks)
        </div>
        <div className="text-[10px] text-gray-400 mt-1">Consider redistributing if capacity allows</div>
      </div>
    </div>
  );
});

// ==================== GOALS AI INSIGHTS VISUALIZATIONS ====================

// 1. Goal Progress Over Time (Actual vs Expected)
interface GoalProgressOverTimeProps {
  data: {
    goals: { name: string; actual: number; expected: number; color: string }[];
  };
}

export const GoalProgressOverTime = memo(function GoalProgressOverTime({ data }: GoalProgressOverTimeProps) {
  const { goals } = data;
  
  return (
    <div className="space-y-4">
      {/* Progress bars for each goal */}
      {goals.map((goal, goalIdx) => {
        const isAhead = goal.actual >= goal.expected;
        
        return (
          <div key={goalIdx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: goal.color }} />
                <span className="text-xs text-gray-300">{goal.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{goal.actual}%</span>
                <span className={`text-xs ${isAhead ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isAhead ? '↑' : '↓'} {Math.abs(goal.actual - goal.expected)}%
                </span>
              </div>
            </div>
            
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
              {/* Expected baseline */}
              <div 
                className="absolute top-0 left-0 h-full bg-gray-600/50 rounded-full"
                style={{ width: `${goal.expected}%` }}
              />
              {/* Actual progress */}
              <div 
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{ 
                  width: `${goal.actual}%`,
                  backgroundColor: goal.color
                }}
              />
            </div>
          </div>
        );
      })}
      
      {/* Summary card */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-4">
        <div className="text-xs text-purple-400">Overall Progress</div>
        <div className="text-2xl text-white mt-1">
          {Math.round(goals.reduce((sum, g) => sum + g.actual, 0) / goals.length)}%
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          Average across {goals.length} active goals
        </div>
      </div>
    </div>
  );
});

// 2. Goal Health / Summary Gauge
interface GoalHealthGaugeProps {
  data: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    overallProgress: number;
    onTrack: number;
    atRisk: number;
  };
}

export const GoalHealthGauge = memo(function GoalHealthGauge({ data }: GoalHealthGaugeProps) {
  const { totalGoals, activeGoals, completedGoals, overallProgress, onTrack, atRisk } = data;
  const healthColor = overallProgress >= 70 ? '#10b981' : overallProgress >= 40 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="space-y-4">
      {/* Large circular gauge */}
      <div className="relative flex items-center justify-center py-6">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Background arc */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#2a2c34"
            strokeWidth="14"
          />
          {/* Progress arc */}
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={healthColor}
            strokeWidth="14"
            strokeDasharray={`${(overallProgress / 100) * 440} 440`}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl text-white">{overallProgress}%</div>
          <div className="text-xs text-gray-400 mt-1">Overall Progress</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{activeGoals} active goals</div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-xl text-white mt-1">{totalGoals}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center">
          <div className="text-xs text-emerald-400">Completed</div>
          <div className="text-xl text-white mt-1">{completedGoals}</div>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 text-center">
          <div className="text-xs text-cyan-400">Active</div>
          <div className="text-xl text-white mt-1">{activeGoals}</div>
        </div>
      </div>
      
      {/* Health indicator */}
      <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-xs text-gray-300">On Track: {onTrack}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-xs text-gray-300">At Risk: {atRisk}</span>
        </div>
      </div>
    </div>
  );
});

// 3. Goals by Status (Pie Chart)
interface GoalsByStatusProps {
  data: { status: string; count: number; percentage: number; color: string }[];
}

export const GoalsByStatus = memo(function GoalsByStatus({ data }: GoalsByStatusProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="space-y-4">
      {/* Pie chart */}
      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {data.map((item, i) => {
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
            cumulativePercentage += item.percentage;
            
            // Convert to radians
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 90 + 80 * Math.cos(startRad);
            const y1 = 90 + 80 * Math.sin(startRad);
            const x2 = 90 + 80 * Math.cos(endRad);
            const y2 = 90 + 80 * Math.sin(endRad);
            
            const largeArc = item.percentage > 50 ? 1 : 0;
            
            return (
              <path
                key={i}
                d={`M 90 90 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                opacity="0.9"
                className="hover:opacity-100 transition-opacity cursor-pointer"
              />
            );
          })}
          {/* Center circle */}
          <circle cx="90" cy="90" r="45" fill="#1e2128" />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl text-white">{total}</div>
          <div className="text-[10px] text-gray-400">Total Goals</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-300">{item.status}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">{item.count}</div>
              <div className="text-[9px] text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Status insight */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-blue-400">
          {data[0].percentage >= 50 ? '✨ Majority of goals on track!' : '⚠️ ' + data.find(d => d.percentage > 30)?.status + ' goals need attention'}
        </div>
      </div>
    </div>
  );
});

// 4. Goals Achieved (Tasks Removed)
interface GoalsAchievedVsTasksProps {
  data: {
    goalsSet: number;
    goalsAchieved: number;
    quarterlyData: { quarter: string; set: number; achieved: number }[];
    categories: { name: string; achieved: number; color: string }[];
  };
}

export const GoalsAchievedVsTasks = memo(function GoalsAchievedVsTasks({ data }: GoalsAchievedVsTasksProps) {
  const { goalsSet, goalsAchieved, quarterlyData, categories } = data;
  const goalRate = ((goalsAchieved / goalsSet) * 100).toFixed(0);
  
  return (
    <div className="space-y-4">
      {/* Main achievement display */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
        <div className="text-xs text-purple-400 mb-3">Goals Achieved This Period</div>
        
        {/* Large progress ring */}
        <div className="relative flex items-center justify-center mb-4">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#2a2c34"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#a855f7"
              strokeWidth="10"
              strokeDasharray={`${(parseInt(goalRate) / 100) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl text-white">{goalsAchieved}</div>
            <div className="text-xs text-gray-400">of {goalsSet}</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl text-purple-400">{goalRate}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Achievement Rate</div>
        </div>
      </div>
      
      {/* Quarterly trend */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Quarterly Performance</div>
        {quarterlyData.map((quarter, i) => {
          const rate = ((quarter.achieved / quarter.set) * 100).toFixed(0);
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{quarter.quarter}</span>
                <span className="text-xs text-gray-400">{quarter.achieved}/{quarter.set}</span>
              </div>
              <div className="relative h-5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full flex items-center justify-center"
                  style={{ width: `${rate}%` }}
                >
                  <span className="text-[9px] text-white">{rate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Goals by category */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Achievement by Category</div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat, i) => (
            <div key={i} className="bg-gray-800/30 rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-gray-400">{cat.name}</span>
              </div>
              <div className="text-lg text-white">{cat.achieved}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Insight */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-indigo-400">
          {parseInt(goalRate) >= 80 
            ? '🎯 Outstanding goal achievement rate!' 
            : parseInt(goalRate) >= 60
            ? '✨ Good progress - keep the momentum!'
            : '💡 Focus on completing existing goals before setting new ones'}
        </div>
      </div>
    </div>
  );
});

// 5. Goal Milestones / Timeline
interface GoalMilestonesTimelineProps {
  data: {
    goals: {
      name: string;
      progress: number;
      dueDate: string;
      daysLeft: number;
      status: 'ahead' | 'on-track' | 'at-risk' | 'overdue';
      color: string;
      milestones: { name: string; completed: boolean }[];
    }[];
  };
}

export const GoalMilestonesTimeline = memo(function GoalMilestonesTimeline({ data }: GoalMilestonesTimelineProps) {
  const { goals } = data;
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ahead': return '#10b981';
      case 'on-track': return '#06b6d4';
      case 'at-risk': return '#f59e0b';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ahead': return 'Ahead';
      case 'on-track': return 'On Track';
      case 'at-risk': return 'At Risk';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="space-y-4">
        {goals.map((goal, i) => {
          const completedMilestones = goal.milestones.filter(m => m.completed).length;
          const totalMilestones = goal.milestones.length;
          
          return (
            <div key={i} className="relative pl-6">
              {/* Timeline line */}
              {i < goals.length - 1 && (
                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-800" />
              )}
              
              {/* Timeline dot */}
              <div 
                className="absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-gray-900"
                style={{ backgroundColor: getStatusColor(goal.status) }}
              />
              
              {/* Goal card */}
              <div className="bg-gray-800/30 rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-white">{goal.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Due: {goal.dueDate} ({goal.daysLeft} days left)
                    </div>
                  </div>
                  <div 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `${getStatusColor(goal.status)}20`,
                      color: getStatusColor(goal.status)
                    }}
                  >
                    {getStatusLabel(goal.status)}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${goal.progress}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>
                
                {/* Milestones */}
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400">
                    Milestones: {completedMilestones}/{totalMilestones}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {goal.milestones.map((milestone, mIdx) => (
                      <div 
                        key={mIdx}
                        className={`text-[9px] px-1.5 py-0.5 rounded ${
                          milestone.completed 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-gray-700/50 text-gray-500'
                        }`}
                      >
                        {milestone.completed ? '✓' : '○'} {milestone.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary insight */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-violet-400">
          {goals.filter(g => g.status === 'at-risk' || g.status === 'overdue').length > 0
            ? `⚠️ ${goals.filter(g => g.status === 'at-risk' || g.status === 'overdue').length} goal(s) need immediate attention`
            : '✨ All goals progressing well - keep up the momentum!'}
        </div>
      </div>
    </div>
  );
});

// ==================== AI ASSISTANT METRICS VISUALIZATIONS ====================

// 1. Assistant Usage Frequency (Simplified)
interface AssistantUsageFrequencyProps {
  data: {
    totalQueries: number;
    trend: number;
    weekOverWeekChange: number;
  };
}

export const AssistantUsageFrequency = memo(function AssistantUsageFrequency({ data }: AssistantUsageFrequencyProps) {
  const { totalQueries, trend, weekOverWeekChange } = data;
  
  return (
    <div className="space-y-4">
      {/* Main metric */}
      <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-6 text-center">
        <div className="text-xs text-teal-400 mb-3">Weekly Interactions</div>
        <div className="text-5xl text-white mb-3">{totalQueries}</div>
        <div className="flex items-center justify-center gap-4">
          <div className={`text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
          </div>
        </div>
      </div>
      
      {/* Engagement level */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-400 mb-1">Engagement Level</div>
          <div className="text-xl text-white">
            {totalQueries > 150 ? 'High' : totalQueries > 100 ? 'Medium' : 'Growing'}
          </div>
        </div>
        <div className={`rounded-lg p-3 text-center ${
          weekOverWeekChange > 0 ? 'bg-green-600/20' : 'bg-gray-800/50'
        }`}>
          <div className={`text-xs mb-1 ${weekOverWeekChange > 0 ? 'text-green-400' : 'text-gray-400'}`}>
            Weekly Growth
          </div>
          <div className={`text-xl ${weekOverWeekChange > 0 ? 'text-green-400' : 'text-white'}`}>
            {weekOverWeekChange > 0 ? '+' : ''}{weekOverWeekChange}
          </div>
        </div>
      </div>
      
      {/* Insight */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
        <div className="text-xs text-blue-400">
          {trend > 20 
            ? '📈 Strong engagement increase - AI is becoming a trusted tool!' 
            : trend > 0
            ? '✨ Steady adoption - AI usage is growing consistently'
            : '💡 Usage stabilizing - AI has found its rhythm in your workflow'}
        </div>
      </div>
    </div>
  );
});

// 2. Average Response Time
interface AverageResponseTimeProps {
  data: {
    weekly: { week: string; avgTime: number }[];
    currentAvg: number;
    target: number;
    improvement: number;
  };
}

export const AverageResponseTime = memo(function AverageResponseTime({ data }: AverageResponseTimeProps) {
  const { weekly, currentAvg, target, improvement } = data;
  const maxTime = Math.max(...weekly.map(w => w.avgTime));
  
  return (
    <div className="space-y-4">
      {/* Current average */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-lg p-3">
          <div className="text-xs text-cyan-400 mb-1">Current Avg</div>
          <div className="text-2xl text-white">{currentAvg}s</div>
          <div className={`text-[10px] mt-1 ${improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {improvement >= 0 ? '↓' : '↑'} {Math.abs(improvement)}s faster
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Target</div>
          <div className="text-2xl text-white">{target}s</div>
          <div className={`text-[10px] mt-1 ${currentAvg <= target ? 'text-green-400' : 'text-amber-400'}`}>
            {currentAvg <= target ? '✓ On target' : 'Above target'}
          </div>
        </div>
      </div>
      
      {/* Weekly trend bars */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Weekly Response Time</div>
        {weekly.map((week, i) => {
          const isUnderTarget = week.avgTime <= target;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{week.week}</span>
                <span className="text-xs text-white">{week.avgTime}s</span>
              </div>
              <div className="relative h-5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isUnderTarget ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-amber-600 to-yellow-500'
                  }`}
                  style={{ width: `${(week.avgTime / maxTime) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Insight */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-cyan-400">
          {currentAvg <= 1.0 
            ? '⚡ Lightning fast! AI responding in under 1 second' 
            : currentAvg <= 2.0
            ? '✨ Great response time - well within user expectations'
            : '💡 Response time acceptable but could be optimized'}
        </div>
      </div>
    </div>
  );
});

// 3. Resolution/Success Rate (Gauge - Simplified)
interface ResolutionSuccessRateProps {
  data: {
    successRate: number;
    totalRequests: number;
    successful: number;
    needsImprovement: number;
  };
}

export const ResolutionSuccessRate = memo(function ResolutionSuccessRate({ data }: ResolutionSuccessRateProps) {
  const { successRate, totalRequests, successful, needsImprovement } = data;
  const gaugeColor = successRate >= 85 ? '#10b981' : successRate >= 70 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="space-y-4">
      {/* Large gauge */}
      <div className="relative flex items-center justify-center py-6">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#2a2c34"
            strokeWidth="14"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="14"
            strokeDasharray={`${(successRate / 100) * 440} 440`}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl text-white">{successRate}%</div>
          <div className="text-xs text-gray-400 mt-2">Success Rate</div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
          <div className="text-xs text-emerald-400 mb-1">Successful</div>
          <div className="text-2xl text-white">{successful}</div>
          <div className="text-[10px] text-gray-400 mt-1">requests</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
          <div className="text-xs text-amber-400 mb-1">Needs Work</div>
          <div className="text-2xl text-white">{needsImprovement}</div>
          <div className="text-[10px] text-gray-400 mt-1">requests</div>
        </div>
      </div>
      
      {/* Total requests */}
      <div className="bg-gray-800/30 rounded-lg p-3 text-center">
        <div className="text-xs text-gray-400 mb-1">Total Requests</div>
        <div className="text-xl text-white">{totalRequests}</div>
      </div>
      
      {/* Insight */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
        <div className="text-xs text-purple-400">
          {successRate >= 90 
            ? '🎯 Exceptional! AI recommendations highly trusted' 
            : successRate >= 75
            ? '✨ Strong performance - users rely on AI guidance'
            : '💡 Improvement needed - refining AI responses'}
        </div>
      </div>
    </div>
  );
});

// 4. Fallback/Confusion Incidents
interface FallbackConfusionIncidentsProps {
  data: {
    weekly: { week: string; incidents: number }[];
    total: number;
    trend: number;
    topReasons: { reason: string; count: number }[];
  };
}

export const FallbackConfusionIncidents = memo(function FallbackConfusionIncidents({ data }: FallbackConfusionIncidentsProps) {
  const { weekly, total, trend, topReasons } = data;
  const maxIncidents = Math.max(...weekly.map(w => w.incidents));
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-amber-400">Failed Assists This Month</div>
          <div className={`text-xs ${trend <= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend <= 0 ? '↓' : '↑'} {Math.abs(trend)}%
          </div>
        </div>
        <div className="text-3xl text-white">{total}</div>
        <div className="text-[10px] text-gray-400 mt-1">
          {trend <= 0 ? 'Improving - incidents decreasing' : 'Needs attention'}
        </div>
      </div>
      
      {/* Weekly bars */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Weekly Breakdown</div>
        {weekly.map((week, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{week.week}</span>
              <span className="text-xs text-white">{week.incidents} incidents</span>
            </div>
            <div className="relative h-5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full"
                style={{ width: `${(week.incidents / maxIncidents) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Top reasons */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400">Top Confusion Reasons</div>
        <div className="space-y-1.5">
          {topReasons.map((reason, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2">
              <span className="text-xs text-gray-300">{reason.reason}</span>
              <span className="text-xs text-red-400">{reason.count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Insight */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-red-400">
          {trend <= -10 
            ? '✅ Great progress! AI learning from failures' 
            : trend <= 0
            ? '📉 Slight improvement in AI understanding'
            : '⚠️ Consider providing more context in queries'}
        </div>
      </div>
    </div>
  );
});

// 5. Top Query Categories (Pie Chart)
interface TopQueryCategoriesProps {
  data: { category: string; count: number; percentage: number; color: string }[];
}

export const TopQueryCategories = memo(function TopQueryCategories({ data }: TopQueryCategoriesProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="space-y-4">
      {/* Pie chart */}
      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {data.map((item, i) => {
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
            cumulativePercentage += item.percentage;
            
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            const x1 = 90 + 80 * Math.cos(startRad);
            const y1 = 90 + 80 * Math.sin(startRad);
            const x2 = 90 + 80 * Math.cos(endRad);
            const y2 = 90 + 80 * Math.sin(endRad);
            
            const largeArc = item.percentage > 50 ? 1 : 0;
            
            return (
              <path
                key={i}
                d={`M 90 90 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                opacity="0.9"
                className="hover:opacity-100 transition-opacity cursor-pointer"
              />
            );
          })}
          <circle cx="90" cy="90" r="45" fill="#1e2128" />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl text-white">{total}</div>
          <div className="text-[10px] text-gray-400">Queries</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-300">{item.category}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">{item.count}</div>
              <div className="text-[9px] text-gray-500">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Insight */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2.5 text-center">
        <div className="text-xs text-indigo-400">
          {data[0].percentage >= 40 
            ? `🎯 Primary use: ${data[0].category} (${data[0].percentage}%)` 
            : '📊 Balanced AI usage across multiple categories'}
        </div>
      </div>
    </div>
  );
});
