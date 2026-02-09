import { memo } from 'react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer } from 'recharts';

// ====================================================================
// TEAM PRODUCTIVITY METRICS - SmartTask, Atlassian, Worklytics Research
// ====================================================================

// 1. Tasks Completed vs Pending - Health check on team throughput
// Research: SmartTask - Seeing pending vs completed lets managers assess if team meets KPIs
interface TasksCompletedVsPendingProps {
  data: {
    completed: number;
    pending: number;
    overdue: number;
    weekData?: { week: string; completed: number; pending: number; overdue: number }[];
  };
}

export const TasksCompletedVsPending = memo(function TasksCompletedVsPending({ data }: TasksCompletedVsPendingProps) {
  const total = data.completed + data.pending + data.overdue;
  const completedPercent = (data.completed / total) * 100;
  const pendingPercent = (data.pending / total) * 100;
  const overduePercent = (data.overdue / total) * 100;

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-emerald-400">{data.completed}</div>
          <div className="text-[10px] text-gray-400">Completed</div>
          <div className="text-xs text-emerald-400 mt-1">{completedPercent.toFixed(0)}%</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-400">{data.pending}</div>
          <div className="text-[10px] text-gray-400">In Progress</div>
          <div className="text-xs text-amber-400 mt-1">{pendingPercent.toFixed(0)}%</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{data.overdue}</div>
          <div className="text-[10px] text-gray-400">Overdue</div>
          <div className="text-xs text-red-400 mt-1">{overduePercent.toFixed(0)}%</div>
        </div>
      </div>

      {/* Trend Bar Chart */}
      {data.weekData && (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data.weekData}>
            <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="overdue" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Health Indicator */}
      <div className={`text-xs p-2 rounded border ${
        completedPercent > 60 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
        completedPercent > 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
        'bg-red-500/10 border-red-500/30 text-red-400'
      }`}>
        {completedPercent > 60 ? '✅ Team throughput is healthy' :
         completedPercent > 40 ? '⚠️ Monitor for bottlenecks' :
         '❌ Investigate capacity issues'}
      </div>
    </div>
  );
});

// 2. Workload Distribution - Bar chart per team member showing task/hour balance
// Research: SmartTask - View workload to spot imbalances and prevent burnout
interface WorkloadDistributionProps {
  data: {
    name: string;
    tasks: number;
    hours: number;
    utilization: number;
  }[];
}

export const WorkloadDistribution = memo(function WorkloadDistribution({ data }: WorkloadDistributionProps) {
  const avgUtilization = data.reduce((sum, member) => sum + member.utilization, 0) / data.length;

  return (
    <div className="space-y-3">
      {/* Team members */}
      {data.map((member, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white">{member.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{member.tasks} tasks • {member.hours}h</span>
              <span className={`text-xs font-medium ${
                member.utilization > 100 ? 'text-red-400' :
                member.utilization > 90 ? 'text-amber-400' :
                member.utilization < 75 ? 'text-blue-400' :
                'text-emerald-400'
              }`}>
                {member.utilization}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                member.utilization > 100 ? 'bg-red-500' :
                member.utilization > 90 ? 'bg-amber-500' :
                member.utilization < 75 ? 'bg-blue-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(member.utilization, 100)}%` }}
            />
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Team Average Utilization</span>
          <span className="text-white font-medium">{avgUtilization.toFixed(0)}%</span>
        </div>
        {data.some(m => m.utilization > 100) && (
          <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
            ⚠️ {data.filter(m => m.utilization > 100).length} team member(s) overloaded
          </div>
        )}
      </div>
    </div>
  );
});

// 3. Team Productivity Trend - Line chart of team output over time
// Research: Atlassian - Consistent tracking provides real-time insights for decision-making
interface TeamProductivityTrendProps {
  data: {
    week: string;
    tasksCompleted: number;
    projectsFinished: number;
    productivity: number;
  }[];
}

export const TeamProductivityTrend = memo(function TeamProductivityTrend({ data }: TeamProductivityTrendProps) {
  const trend = data[data.length - 1].productivity - data[0].productivity;
  const isImproving = trend > 0;

  return (
    <div className="space-y-3">
      {/* Trend Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`text-xs font-medium ${
            isImproving ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isImproving ? '📈' : '📉'} {Math.abs(trend).toFixed(0)}% {isImproving ? 'increase' : 'decrease'}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Latest: <span className="text-white font-medium">{data[data.length - 1].productivity}%</span>
        </div>
      </div>

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="productivity" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="tasksCompleted" 
            stroke="#06b6d4" 
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-emerald-500 rounded"></div>
          <span className="text-gray-400">Productivity %</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-cyan-500 rounded" style={{ borderTop: '1px dashed' }}></div>
          <span className="text-gray-400">Tasks Completed</span>
        </div>
      </div>
    </div>
  );
});

// 4. Collaboration/Communication Chart - Meeting efficiency & focus time balance
// Research: Worklytics - Meeting load vs focus time is key workforce analytics metric
interface CollaborationChartProps {
  data: {
    avgFocusHours: number;
    avgMeetingHours: number;
    avgMessagesPerDay: number;
    weeklyData: {
      day: string;
      focusHours: number;
      meetingHours: number;
      messages: number;
    }[];
    goalFocusHours: number;
  };
}

export const CollaborationChart = memo(function CollaborationChart({ data }: CollaborationChartProps) {
  const focusRatio = (data.avgFocusHours / (data.avgFocusHours + data.avgMeetingHours)) * 100;
  const meetsGoal = data.avgFocusHours >= data.goalFocusHours;

  return (
    <div className="space-y-3">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
          <div className="text-lg font-bold text-blue-400">{data.avgFocusHours.toFixed(1)}h</div>
          <div className="text-[9px] text-gray-400">Avg Focus Time</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
          <div className="text-lg font-bold text-purple-400">{data.avgMeetingHours.toFixed(1)}h</div>
          <div className="text-[9px] text-gray-400">Avg Meetings</div>
        </div>
        <div className="bg-teal-500/10 border border-teal-500/30 rounded p-2">
          <div className="text-lg font-bold text-teal-400">{data.avgMessagesPerDay}</div>
          <div className="text-[9px] text-gray-400">Messages/Day</div>
        </div>
      </div>

      {/* Focus vs Meeting Time Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data.weeklyData}>
          <Bar dataKey="focusHours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="meetingHours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Goal Status */}
      <div className={`text-xs p-2 rounded border ${
        meetsGoal ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
        'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        {meetsGoal ? `✅ Team meets ${data.goalFocusHours}h focus time goal` :
         `⚠️ ${(data.goalFocusHours - data.avgFocusHours).toFixed(1)}h below focus time goal`}
      </div>

      {/* Efficiency Ratio */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-gray-400">Focus/Meeting Ratio</span>
        <span className="text-white font-medium">{focusRatio.toFixed(0)}% focus time</span>
      </div>
    </div>
  );
});

// 5. Team Goal/Achievement Progress - Visual progress toward collective goals
// Research: Orizon - Achievement tracking leverages gamification to rally teams
interface TeamGoalProgressProps {
  data: {
    goal: string;
    progress: number;
    target: number;
    current: number;
    total: number;
    status: 'ahead' | 'on-track' | 'at-risk';
    dueDate: string;
  }[];
}

export const TeamGoalProgress = memo(function TeamGoalProgress({ data }: TeamGoalProgressProps) {
  return (
    <div className="space-y-3">
      {data.map((goal, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-xs text-white font-medium">{goal.goal}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {goal.current}/{goal.total} • Due {goal.dueDate}
              </div>
            </div>
            <div className={`text-xs px-2 py-0.5 rounded border ${
              goal.status === 'ahead' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              goal.status === 'on-track' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {goal.status === 'ahead' ? '🚀 Ahead' :
               goal.status === 'on-track' ? '✓ On Track' :
               '⚠️ At Risk'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                goal.status === 'ahead' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                goal.status === 'on-track' ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${goal.progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{goal.progress}%</span>
            </div>
          </div>
        </div>
      ))}

      {/* Overall Summary */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs font-bold text-emerald-400">
              {data.filter(g => g.status === 'ahead').length}
            </div>
            <div className="text-[9px] text-gray-400">Ahead</div>
          </div>
          <div>
            <div className="text-xs font-bold text-blue-400">
              {data.filter(g => g.status === 'on-track').length}
            </div>
            <div className="text-[9px] text-gray-400">On Track</div>
          </div>
          <div>
            <div className="text-xs font-bold text-red-400">
              {data.filter(g => g.status === 'at-risk').length}
            </div>
            <div className="text-[9px] text-gray-400">At Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
});
