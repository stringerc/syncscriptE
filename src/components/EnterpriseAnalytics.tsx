import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Users, Target, Clock, Calendar, 
  CheckCircle2, AlertCircle, Building2, BarChart3
} from 'lucide-react';
import { Progress } from './ui/progress';

// 1. Organization Productivity Index - High-level KPI gauge
// Research: Composite metrics for executive reference (Worklytics)
export const OrganizationProductivityIndex = memo(() => {
  const productivityScore = 82; // Out of 100
  const trend = '+5 vs last quarter';
  const quarterlyChange = 5;
  
  const getScoreColor = () => {
    if (productivityScore >= 85) return { gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', status: 'Excellent' };
    if (productivityScore >= 70) return { gradient: 'from-blue-500 to-cyan-400', text: 'text-blue-400', status: 'Good' };
    if (productivityScore >= 55) return { gradient: 'from-amber-500 to-yellow-400', text: 'text-amber-400', status: 'Fair' };
    return { gradient: 'from-red-500 to-orange-400', text: 'text-red-400', status: 'Needs Attention' };
  };

  const scoreColor = getScoreColor();

  return (
    <div className="space-y-4">
      {/* Large Gauge Display */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background arc */}
            <circle
              cx="96"
              cy="96"
              r="85"
              fill="none"
              stroke="#2a2d35"
              strokeWidth="16"
            />
            {/* Progress arc */}
            <motion.circle
              cx="96"
              cy="96"
              r="85"
              fill="none"
              stroke="url(#productivityGradient)"
              strokeWidth="16"
              strokeDasharray={`${2 * Math.PI * 85}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 85 * (1 - productivityScore / 100)
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="productivityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div 
              className={`text-5xl font-bold ${scoreColor.text}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {productivityScore}
            </motion.div>
            <div className="text-sm text-gray-500">/ 100</div>
            <div className="text-xs text-gray-600 mt-1">{scoreColor.status}</div>
          </div>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-[#1a1d24] rounded-lg p-3">
          <div className="text-2xl font-bold text-white">15.2</div>
          <div className="text-xs text-gray-500">Tasks/Person/Week</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-3">
          <div className="text-2xl font-bold text-white">6.8h</div>
          <div className="text-xs text-gray-500">Avg Focus Time</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-3">
          <div className="text-2xl font-bold text-emerald-400">+{quarterlyChange}%</div>
          <div className="text-xs text-gray-500">This Quarter</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        📊 Composite metric: Task completion rate, focus time, goal attainment
      </div>
    </div>
  );
});

OrganizationProductivityIndex.displayName = 'OrganizationProductivityIndex';

// 2. Department Performance Comparison - Grouped bar chart
// Research: Identifying high-performing units vs lagging (Worklytics, Teramind)
export const DepartmentPerformance = memo(() => {
  const departments = [
    { name: 'Engineering', tasksPerPerson: 15, completionRate: 92, color: '#3b82f6' },
    { name: 'Product', tasksPerPerson: 12, completionRate: 88, color: '#8b5cf6' },
    { name: 'Marketing', tasksPerPerson: 8, completionRate: 85, color: '#ec4899' },
    { name: 'Sales', tasksPerPerson: 11, completionRate: 90, color: '#10b981' },
    { name: 'Support', tasksPerPerson: 14, completionRate: 87, color: '#f59e0b' },
  ];

  const maxTasks = Math.max(...departments.map(d => d.tasksPerPerson));

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="space-y-3">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">{dept.name}</span>
              <span className="text-xs text-gray-500">{dept.tasksPerPerson} tasks/person/week</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#1a1d24] rounded-full h-8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full flex items-center justify-end px-3"
                  style={{ 
                    background: `linear-gradient(90deg, ${dept.color}CC, ${dept.color})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(dept.tasksPerPerson / maxTasks) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                >
                  <span className="text-xs font-medium text-white">{dept.completionRate}%</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        💡 Engineering leads with 15 tasks/person, Marketing needs efficiency support
      </div>
    </div>
  );
});

DepartmentPerformance.displayName = 'DepartmentPerformance';

// 3. Adoption & Usage Stats - Line chart over time
// Research: Platform engagement tracking for ROI (Worklytics)
export const AdoptionUsageStats = memo(() => {
  const weeklyData = [
    { week: 'W1', users: 70, tasks: 45, calendar: 62, energy: 38 },
    { week: 'W2', users: 73, tasks: 52, calendar: 65, energy: 42 },
    { week: 'W3', users: 76, tasks: 58, calendar: 68, energy: 45 },
    { week: 'W4', users: 80, tasks: 65, calendar: 72, energy: 50 },
    { week: 'W5', users: 82, tasks: 70, calendar: 75, energy: 54 },
    { week: 'W6', users: 85, tasks: 75, calendar: 78, energy: 58 },
  ];

  const currentWeek = weeklyData[weeklyData.length - 1];
  const maxValue = 100;

  return (
    <div className="space-y-4">
      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1d24] rounded-lg p-3 border border-emerald-500/20">
          <div className="text-xs text-gray-500 mb-1">Active Users</div>
          <div className="text-2xl font-bold text-emerald-400">{currentWeek.users}%</div>
          <div className="text-xs text-emerald-400/70">↑ +15% vs W1</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-3 border border-blue-500/20">
          <div className="text-xs text-gray-500 mb-1">Platform ROI</div>
          <div className="text-2xl font-bold text-blue-400">High</div>
          <div className="text-xs text-blue-400/70">85% engaged</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 mb-2">Feature Adoption Trends (Last 6 Weeks)</div>
        {[
          { name: 'Tasks Module', key: 'tasks', color: '#3b82f6' },
          { name: 'Calendar Sync', key: 'calendar', color: '#10b981' },
          { name: 'Energy Tracking', key: 'energy', color: '#f59e0b' },
        ].map((feature, i) => (
          <div key={feature.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{feature.name}</span>
              <span className="text-xs" style={{ color: feature.color }}>
                {currentWeek[feature.key as keyof typeof currentWeek]}%
              </span>
            </div>
            <div className="h-1.5 bg-[#1a1d24] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: feature.color }}
                initial={{ width: 0 }}
                animate={{ width: `${currentWeek[feature.key as keyof typeof currentWeek]}%` }}
                transition={{ duration: 1, delay: i * 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        📈 Energy tracking underutilized (58%) – training opportunity identified
      </div>
    </div>
  );
});

AdoptionUsageStats.displayName = 'AdoptionUsageStats';

// 4. Meeting vs Focus Time - Company-wide time allocation
// Research: Meeting cost and focus time at org level (Microsoft, Worklytics)
export const MeetingVsFocusTime = memo(() => {
  const timeData = {
    meetings: 5000,
    focus: 3000,
    email: 1500,
    other: 1000,
  };

  const total = Object.values(timeData).reduce((a, b) => a + b, 0);
  
  const categories = [
    { name: 'Meeting Time', hours: timeData.meetings, color: '#ef4444', percentage: (timeData.meetings / total) * 100 },
    { name: 'Focus Time', hours: timeData.focus, color: '#10b981', percentage: (timeData.focus / total) * 100 },
    { name: 'Email/Comms', hours: timeData.email, color: '#3b82f6', percentage: (timeData.email / total) * 100 },
    { name: 'Other', hours: timeData.other, color: '#6b7280', percentage: (timeData.other / total) * 100 },
  ];

  return (
    <div className="space-y-4">
      {/* Stacked bars */}
      <div className="space-y-3">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">{cat.name}</span>
              <span className="text-xs text-gray-500">{cat.hours.toLocaleString()}h ({cat.percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-6 bg-[#1a1d24] rounded-full overflow-hidden">
              <motion.div
                className="h-full flex items-center justify-end px-3"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${cat.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              >
                <span className="text-xs font-medium text-white">{cat.percentage.toFixed(0)}%</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alert if meetings overwhelm focus */}
      {timeData.meetings > timeData.focus && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div>
              <div className="text-sm text-red-300 font-medium">Meeting Overload Detected</div>
              <div className="text-xs text-red-400/70 mt-1">
                Meetings (5,000h) exceed focus time (3,000h) by 67%. Consider meeting-free days.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        ⚠️ Quantifiable evidence to drive meeting policy changes (Microsoft research)
      </div>
    </div>
  );
});

MeetingVsFocusTime.displayName = 'MeetingVsFocusTime';

// 5. Goal Achievement Rate - Strategic initiatives tracking
// Research: Visualizing outcomes not just activities (Executive metrics)
export const GoalAchievementRate = memo(() => {
  const initiatives = {
    onTrack: 40,
    atRisk: 7,
    behind: 3,
  };

  const total = initiatives.onTrack + initiatives.atRisk + initiatives.behind;
  const onTrackPercentage = (initiatives.onTrack / total) * 100;
  
  const segments = [
    { name: 'On Track', count: initiatives.onTrack, color: '#10b981', percentage: (initiatives.onTrack / total) * 100 },
    { name: 'At Risk', count: initiatives.atRisk, color: '#f59e0b', percentage: (initiatives.atRisk / total) * 100 },
    { name: 'Behind', count: initiatives.behind, color: '#ef4444', percentage: (initiatives.behind / total) * 100 },
  ];

  // Donut chart
  let cumulativePercentage = 0;

  return (
    <div className="space-y-4">
      {/* Donut Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#2a2d35"
              strokeWidth="20"
            />
            
            {/* Segments */}
            {segments.map((segment, index) => {
              const dashArray = 2 * Math.PI * 70;
              const dashOffset = dashArray - (dashArray * cumulativePercentage / 100);
              const segmentLength = dashArray * (segment.percentage / 100);
              
              cumulativePercentage += segment.percentage;
              
              return (
                <motion.circle
                  key={segment.name}
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeDasharray={`${segmentLength} ${dashArray}`}
                  initial={{ strokeDashoffset: dashArray }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-emerald-400">{onTrackPercentage.toFixed(0)}%</div>
            <div className="text-xs text-gray-500">On Track</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.name}
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-sm text-gray-300">{segment.name}</span>
            </div>
            <span className="text-sm font-medium text-white">
              {segment.count} <span className="text-gray-500">({segment.percentage.toFixed(0)}%)</span>
            </span>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        🎯 {total} strategic initiatives tracked • 80% success rate this quarter
      </div>
    </div>
  );
});

GoalAchievementRate.displayName = 'GoalAchievementRate';
