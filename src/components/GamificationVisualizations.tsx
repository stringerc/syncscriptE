import { memo } from 'react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Flame, TrendingUp, Trophy, Award } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

// ====================================================================
// GAMIFICATION HUB - Research-Backed Engagement Visualizations
// Research: Duolingo gamification studies (Orizon.co research)
// ====================================================================

// 1. Current Streak & History (Calendar Heatmap)
// Purpose: Visual streak history - taps into loss aversion
// Research: 7-day streak users are 3.6× more likely to stay engaged long-term
interface StreakHistoryProps {
  currentStreak: number;
  longestStreak: number;
  dailyHistory: {
    week: number;
    days: boolean[]; // 7 days, true if goal met
  }[];
}

export const StreakHistory = memo(function StreakHistory({ 
  currentStreak, 
  longestStreak,
  dailyHistory 
}: StreakHistoryProps) {
  return (
    <div className="space-y-4">
      {/* Prominent Streak Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{currentStreak}</span>
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-xs text-gray-400">Day streak</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Longest Streak</div>
          <div className="text-xl font-bold text-yellow-400">{longestStreak} days</div>
        </div>
      </div>

      {/* Calendar Heatmap - Last 8 weeks */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Daily completion history (last 8 weeks)</div>
        <div className="space-y-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 w-8">{day}</span>
              <div className="flex gap-1">
                {dailyHistory.map((week, weekIndex) => {
                  const completed = week.days[dayIndex];
                  return (
                    <motion.div
                      key={weekIndex}
                      className={`w-4 h-4 rounded ${
                        completed ? 'bg-emerald-500' : 'bg-gray-800'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                      title={`Week ${week.week}, ${day}: ${completed ? 'Goal met ✓' : 'Missed'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Motivation Message */}
      <div className={`p-3 rounded-lg border ${
        currentStreak >= 7 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : currentStreak >= 3
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        <div className="text-xs font-medium">
          {currentStreak >= 7 
            ? `🔥 Amazing! You're ${currentStreak - 7} days past the magic 7-day threshold`
            : currentStreak >= 3
            ? `💪 Keep going! ${7 - currentStreak} more days to reach 7-day milestone`
            : `🎯 Start strong! Build a 3-day streak for momentum`
          }
        </div>
      </div>

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Users with 7+ day streaks are 3.6× more likely to stay engaged long-term
      </div>
    </div>
  );
});

// 2. Points/XP Progression Chart
// Purpose: Visualize steady climb in points - reinforces progress
// Research: XP system increased engagement by encouraging users to "level up"
interface XPProgressionProps {
  weeklyData: {
    week: string;
    xp: number;
    isDoubleXP?: boolean;
  }[];
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
}

export const XPProgression = memo(function XPProgression({ 
  weeklyData,
  currentXP,
  nextLevelXP,
  currentLevel
}: XPProgressionProps) {
  const totalXP = weeklyData.reduce((sum, w) => sum + w.xp, 0);
  const avgXP = Math.round(totalXP / weeklyData.length);

  return (
    <div className="space-y-4">
      {/* Current Level Progress */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Current Level</div>
          <div className="text-2xl font-bold text-white">Level {currentLevel}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Progress to Level {currentLevel + 1}</div>
          <div className="text-sm text-white">{(currentXP || 0).toLocaleString()} / {(nextLevelXP || 0).toLocaleString()} XP</div>
        </div>
      </div>

      <Progress 
        value={(currentXP / nextLevelXP) * 100} 
        className="h-3"
        indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
      />

      {/* XP Earned Per Week - Line Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400">Weekly XP earned (last 8 weeks)</div>
          <div className="text-xs text-white">Avg: {avgXP} XP/week</div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis 
              dataKey="week" 
              stroke="#6b7280" 
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '10px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e2128', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                fontSize: '11px'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Line 
              type="monotone" 
              dataKey="xp" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload, index } = props;
                return (
                  <circle
                    key={`xp-dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isDoubleXP ? 6 : 4}
                    fill={payload.isDoubleXP ? '#f59e0b' : '#8b5cf6'}
                    stroke={payload.isDoubleXP ? '#fbbf24' : '#8b5cf6'}
                    strokeWidth={payload.isDoubleXP ? 2 : 0}
                  />
                );
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Double XP Event Notice */}
      {weeklyData.some(w => w.isDoubleXP) && (
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-400 flex items-center gap-2">
            ⚡ Weeks with double XP events shown with gold markers
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: XP progression systems increase engagement by encouraging users to level up and compete
      </div>
    </div>
  );
});

// 3. Leaderboard Snapshot (Top 5 Bar Chart)
// Purpose: Competition drives motivation
// Research: Leaderboard users completed 40% more activities per week
interface LeaderboardSnapshotProps {
  leaderboard: {
    rank: number;
    name: string;
    points: number;
    isCurrentUser?: boolean;
  }[];
}

export const LeaderboardSnapshot = memo(function LeaderboardSnapshot({ leaderboard }: LeaderboardSnapshotProps) {
  const currentUser = leaderboard.find(u => u.isCurrentUser);
  const topUsers = leaderboard.slice(0, 5);
  const maxPoints = Math.max(...topUsers.map(u => u.points));

  return (
    <div className="space-y-4">
      {/* Current User Rank */}
      {currentUser && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-teal-500/10 border border-teal-500/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-xs text-gray-400">Your Rank</div>
              <div className="text-xl font-bold text-white">#{currentUser.rank}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Your Points</div>
            <div className="text-lg font-bold text-teal-400">{(currentUser.points || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Top 5 Bar Chart */}
      <div>
        <div className="text-xs text-gray-400 mb-3">Top 5 Performers</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topUsers} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis 
              type="number" 
              stroke="#6b7280" 
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="#6b7280" 
              style={{ fontSize: '10px' }}
              width={80}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e2128', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                fontSize: '11px'
              }}
            />
            <Bar dataKey="points" radius={[0, 4, 4, 0]}>
              {topUsers.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.isCurrentUser ? '#14b8a6' : index === 0 ? '#fbbf24' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Next Rank Target */}
      {currentUser && currentUser.rank > 1 && (
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="text-xs text-blue-400">
            🎯 {leaderboard[currentUser.rank - 2].points - currentUser.points} more points to reach Rank #{currentUser.rank - 1}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Users participating in leaderboards complete 40% more activities per week
      </div>
    </div>
  );
});

// 4. Achievement Completion (Category Progress)
// Purpose: Overview of badge/achievement progress
// Research: Earning badges increased course completion by ~30%
interface AchievementCompletionProps {
  categories: {
    name: string;
    unlocked: number;
    total: number;
    icon: any;
    color: string;
  }[];
}

export const AchievementCompletion = memo(function AchievementCompletion({ categories }: AchievementCompletionProps) {
  const totalUnlocked = categories.reduce((sum, c) => sum + c.unlocked, 0);
  const totalBadges = categories.reduce((sum, c) => sum + c.total, 0);
  const overallPercent = Math.round((totalUnlocked / totalBadges) * 100);

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Total Achievements</div>
          <div className="text-2xl font-bold text-white">{totalUnlocked} / {totalBadges}</div>
        </div>
        <div className="w-20 h-20 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="#2a2d35"
              strokeWidth="6"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 32}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 32 * (1 - overallPercent / 100) 
              }}
              transition={{ duration: 1 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold">{overallPercent}%</span>
          </div>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div className="space-y-3">
        {categories.map((category, index) => {
          const percent = Math.round((category.unlocked / category.total) * 100);
          const IconComponent = category.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <IconComponent className={`w-4 h-4 ${category.color}`} />
                  <span className="text-xs text-white">{category.name}</span>
                </div>
                <span className="text-xs text-gray-400">{category.unlocked}/{category.total}</span>
              </div>
              <Progress 
                value={percent} 
                className="h-2"
                indicatorClassName={`bg-gradient-to-r ${
                  percent === 100 ? 'from-emerald-600 to-emerald-400' :
                  percent >= 75 ? 'from-blue-500 to-cyan-400' :
                  percent >= 50 ? 'from-amber-500 to-yellow-400' :
                  percent >= 25 ? 'from-orange-600 to-amber-500' :
                  'from-red-600 to-orange-600'
                }`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Nearly Complete Badge */}
      {categories.some(c => (c.unlocked / c.total) >= 0.8 && (c.unlocked / c.total) < 1) && (
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="text-xs text-purple-400">
            🏆 You're close! Just a few more to complete {categories.find(c => (c.unlocked / c.total) >= 0.8 && (c.unlocked / c.total) < 1)?.name}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Earning badges increases completion rates by ~30% (Duolingo study)
      </div>
    </div>
  );
});

// 5. Daily Engagement Trend (Bar Sparkline)
// Purpose: Visualize consistency - "don't break the chain"
// Research: Feedback loops drive sustained engagement
interface DailyEngagementProps {
  dailyData: {
    day: string;
    tasksCompleted: number;
    goalMet: boolean;
    dailyGoal: number;
  }[];
}

export const DailyEngagement = memo(function DailyEngagement({ dailyData }: DailyEngagementProps) {
  const totalDays = dailyData.length;
  const goalMetDays = dailyData.filter(d => d.goalMet).length;
  const consistencyRate = Math.round((goalMetDays / totalDays) * 100);

  return (
    <div className="space-y-4">
      {/* Consistency Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Consistency Rate</div>
          <div className="text-2xl font-bold text-white">{consistencyRate}%</div>
        </div>
        <Badge variant="outline" className={
          consistencyRate >= 80 ? 'border-emerald-400 text-emerald-400' :
          consistencyRate >= 60 ? 'border-blue-400 text-blue-400' :
          'border-amber-400 text-amber-400'
        }>
          {goalMetDays}/{totalDays} days
        </Badge>
      </div>

      {/* Daily Bar Chart */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Last 30 days activity</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280" 
              style={{ fontSize: '9px' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280" 
              style={{ fontSize: '10px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e2128', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                fontSize: '11px'
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1e2128] border border-gray-700 rounded-lg p-2">
                      <div className="text-xs text-white font-medium">{data.day}</div>
                      <div className="text-xs text-gray-400">
                        Tasks: {data.tasksCompleted} / {data.dailyGoal}
                      </div>
                      <div className={`text-xs font-medium ${data.goalMet ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.goalMet ? '✓ Goal met' : '✗ Goal missed'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="tasksCompleted" radius={[4, 4, 0, 0]}>
              {dailyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.goalMet ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement Pattern */}
      <div className={`p-2 rounded-lg border ${
        consistencyRate >= 80 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : consistencyRate >= 60
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      }`}>
        <div className="text-xs font-medium">
          {consistencyRate >= 80 
            ? `🌟 Excellent consistency! You're hitting your daily goals ${consistencyRate}% of the time`
            : consistencyRate >= 60
            ? `💪 Good progress! Aim for 80%+ consistency for best results`
            : `🎯 Keep pushing! Small daily wins build momentum`
          }
        </div>
      </div>

      <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
        📊 Research: Visual feedback loops drive sustained engagement - "don't break the chain"
      </div>
    </div>
  );
});