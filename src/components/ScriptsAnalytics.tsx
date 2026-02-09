import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Clock, Star, PieChart, CheckCircle2, 
  Zap, AlertTriangle, Award, Users
} from 'lucide-react';

// 1. User's Automation Usage Trend - Line chart of script-driven actions over time
// Research: Zapier analytics showing task automation trends to identify inefficiencies
export const AutomationUsageTrend = memo(() => {
  const weeklyData = [
    { week: 'W1', tasks: 12, label: 'Week 1' },
    { week: 'W2', tasks: 18, label: 'Week 2' },
    { week: 'W3', tasks: 25, label: 'Week 3' },
    { week: 'W4', tasks: 42, label: 'Week 4 (Email-to-task installed)' },
    { week: 'W5', tasks: 45, label: 'Week 5' },
    { week: 'W6', tasks: 48, label: 'Week 6' },
    { week: 'W7', tasks: 51, label: 'Week 7' },
    { week: 'W8', tasks: 53, label: 'This Week' },
  ];

  const maxTasks = Math.max(...weeklyData.map(d => d.tasks));
  const growth = ((weeklyData[7].tasks - weeklyData[0].tasks) / weeklyData[0].tasks * 100).toFixed(0);

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1d24] rounded-lg p-3 border border-purple-500/20">
          <div className="text-xs text-gray-500 mb-1">This Week</div>
          <div className="text-2xl font-bold text-purple-400">{weeklyData[7].tasks}</div>
          <div className="text-xs text-purple-400/70">automated tasks</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-3 border border-emerald-500/20">
          <div className="text-xs text-gray-500 mb-1">Growth</div>
          <div className="text-2xl font-bold text-emerald-400">+{growth}%</div>
          <div className="text-xs text-emerald-400/70">vs Week 1</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 mb-3">Automation Adoption Trend (8 Weeks)</div>
        <div className="relative h-40 flex items-end gap-1.5">
          {weeklyData.map((point, index) => {
            const height = (point.tasks / maxTasks) * 100;
            const isSpike = index === 3; // Week 4 spike
            
            return (
              <motion.div
                key={point.week}
                className="flex-1 relative group"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div 
                  className={`w-full rounded-t-sm ${isSpike ? 'bg-gradient-to-t from-purple-600 to-purple-400' : 'bg-gradient-to-t from-purple-700 to-purple-500'}`}
                  style={{ height: '100%' }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap shadow-lg">
                    <div className="font-medium">{point.label}</div>
                    <div className="text-gray-400">{point.tasks} tasks</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center mt-1">{point.week}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        📈 Spike in W4: Email-to-task script automated 30 tasks/week
      </div>
    </div>
  );
});

AutomationUsageTrend.displayName = 'AutomationUsageTrend';

// 2. Time Saved Estimate - Hours saved through automation
// Research: Zapier case studies showing workdays saved via automation
export const TimeSavedEstimate = memo(() => {
  const thisWeek = 4.2;
  const thisMonth = 16.8;
  const allTime = 127;
  const tasksAutomated = 53;
  const avgTimePerTask = 5; // minutes

  return (
    <div className="space-y-4">
      {/* Main stat */}
      <div className="text-center">
        <motion.div 
          className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-4 border-amber-500/30 mb-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <div>
            <div className="text-4xl font-bold text-amber-400">{thisWeek}</div>
            <div className="text-xs text-gray-400">hours</div>
          </div>
        </motion.div>
        
        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
          <Award className="w-5 h-5" />
          <span className="text-lg font-medium">Time Saved This Week</span>
        </div>
        <div className="text-sm text-gray-500">{tasksAutomated} automated tasks × {avgTimePerTask} min avg</div>
      </div>

      {/* Time period breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a1d24] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{thisMonth}h</div>
          <div className="text-xs text-gray-500">This Month</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{allTime}h</div>
          <div className="text-xs text-gray-500">All Time</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        💡 Based on avg 5 min per task. Keep automating to save more time!
      </div>
    </div>
  );
});

TimeSavedEstimate.displayName = 'TimeSavedEstimate';

// 3. Top 5 Scripts (Community) - Most popular scripts in marketplace
// Research: Community metrics (downloads, ratings) surface quality content
export const TopCommunityScripts = memo(() => {
  const topScripts = [
    { name: 'Meeting Notes Auto-capture', users: 1247, rating: 4.9, color: '#3b82f6' },
    { name: 'Email-to-Task Converter', users: 1089, rating: 4.8, color: '#8b5cf6' },
    { name: 'Pomodoro Planner', users: 956, rating: 4.7, color: '#ec4899' },
    { name: 'Project Kickoff Template', users: 834, rating: 4.8, color: '#10b981' },
    { name: 'Daily Standup Generator', users: 721, rating: 4.6, color: '#f59e0b' },
  ];

  const maxUsers = Math.max(...topScripts.map(s => s.users));

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 mb-2">Most Downloaded Scripts (Community)</div>
      
      {/* Horizontal bars */}
      <div className="space-y-3">
        {topScripts.map((script, index) => (
          <motion.div
            key={script.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs font-medium">#{index + 1}</span>
                <span className="text-sm text-gray-300">{script.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-400">{script.rating}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#1a1d24] rounded-full h-6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full flex items-center justify-end px-2"
                  style={{ 
                    background: `linear-gradient(90deg, ${script.color}AA, ${script.color})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(script.users / maxUsers) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                >
                  <span className="text-xs font-medium text-white">{script.users}</span>
                </motion.div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 w-20">
                <Users className="w-3 h-3" />
                <span>{script.users}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        🌟 Social proof: Popular scripts used by 1000+ users
      </div>
    </div>
  );
});

TopCommunityScripts.displayName = 'TopCommunityScripts';

// 4. User's Script Categories - Pie chart of script types used
// Research: Category tracking helps identify automation gaps
export const ScriptCategories = memo(() => {
  const categories = [
    { name: 'Scheduling', percentage: 50, color: '#3b82f6', count: 8 },
    { name: 'Project Templates', percentage: 30, color: '#8b5cf6', count: 5 },
    { name: 'Health/Fitness', percentage: 20, color: '#10b981', count: 3 },
    { name: 'Financial', percentage: 0, color: '#f59e0b', count: 0 },
  ];

  // Donut chart calculation
  let cumulativePercentage = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

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
              r={radius}
              fill="none"
              stroke="#2a2d35"
              strokeWidth="24"
            />
            
            {/* Segments */}
            {categories.filter(c => c.percentage > 0).map((category, index) => {
              const dashOffset = circumference - (circumference * cumulativePercentage / 100);
              const segmentLength = circumference * (category.percentage / 100);
              
              cumulativePercentage += category.percentage;
              
              return (
                <motion.circle
                  key={category.name}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={category.color}
                  strokeWidth="24"
                  strokeDasharray={`${segmentLength} ${circumference}`}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">16</div>
            <div className="text-xs text-gray-500">scripts used</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            className="flex items-center justify-between"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="text-sm text-gray-300">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{category.count}</span>
              <span className="text-xs text-gray-500">({category.percentage}%)</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendation */}
      {categories.some(c => c.percentage === 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm text-amber-300 font-medium">Explore New Categories</div>
              <div className="text-xs text-amber-400/70 mt-1">
                You haven't tried Financial scripts yet. Automate budgeting & expenses!
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        📊 Diversify automation to save time across all work areas
      </div>
    </div>
  );
});

ScriptCategories.displayName = 'ScriptCategories';

// 5. Script Success/Failure Rate - Gauge showing reliability
// Research: Zapier enhanced analytics highlight error rates for trust
export const ScriptSuccessRate = memo(() => {
  const successRate = 98; // percentage
  const totalRuns = 847;
  const successfulRuns = 830;
  const failedRuns = 17;

  const getStatusColor = () => {
    if (successRate >= 95) return { gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', status: 'Excellent', icon: CheckCircle2 };
    if (successRate >= 85) return { gradient: 'from-blue-500 to-cyan-400', text: 'text-blue-400', status: 'Good', icon: CheckCircle2 };
    if (successRate >= 70) return { gradient: 'from-amber-500 to-yellow-400', text: 'text-amber-400', status: 'Fair', icon: AlertTriangle };
    return { gradient: 'from-red-500 to-orange-400', text: 'text-red-400', status: 'Needs Attention', icon: AlertTriangle };
  };

  const statusColor = getStatusColor();
  const StatusIcon = statusColor.icon;

  return (
    <div className="space-y-4">
      {/* Gauge */}
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
            {/* Success arc */}
            <motion.circle
              cx="96"
              cy="96"
              r="85"
              fill="none"
              stroke="url(#successGradient)"
              strokeWidth="16"
              strokeDasharray={`${2 * Math.PI * 85}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 85 * (1 - successRate / 100)
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <StatusIcon className={`w-8 h-8 ${statusColor.text} mb-2`} />
            <motion.div 
              className={`text-5xl font-bold ${statusColor.text}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {successRate}%
            </motion.div>
            <div className="text-xs text-gray-600 mt-1">{statusColor.status}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#1a1d24] rounded-lg p-2">
          <div className="text-lg font-bold text-white">{totalRuns}</div>
          <div className="text-xs text-gray-500">Total Runs</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-2 border border-emerald-500/20">
          <div className="text-lg font-bold text-emerald-400">{successfulRuns}</div>
          <div className="text-xs text-gray-500">Successful</div>
        </div>
        <div className="bg-[#1a1d24] rounded-lg p-2 border border-red-500/20">
          <div className="text-lg font-bold text-red-400">{failedRuns}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
      </div>

      {/* Alert if issues */}
      {successRate < 95 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
            <div>
              <div className="text-sm text-amber-300 font-medium">Some Scripts Need Attention</div>
              <div className="text-xs text-amber-400/70 mt-1">
                {failedRuns} runs failed this month. Check for missing data or API issues.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
        ✅ High success rate ensures you can trust your automations
      </div>
    </div>
  );
});

ScriptSuccessRate.displayName = 'ScriptSuccessRate';
