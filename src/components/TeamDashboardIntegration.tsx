/**
 * Team Dashboard Integration View
 * 
 * Displays comprehensive team statistics including:
 * - Calendar events integration
 * - Tasks & goals tracking
 * - Energy management
 * - Resonance scoring
 * - Gamification metrics
 * 
 * This is the central hub for team collaboration and coordination.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Users, Target, Calendar, Zap, Brain, Trophy, TrendingUp,
  CheckCircle2, Clock, AlertCircle, Star, Award, Flame
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Team, 
  TeamStatistics,
  TeamActivity,
  getResonanceLevel 
} from '../utils/team-integration';

interface TeamDashboardIntegrationProps {
  team: Team;
  statistics: TeamStatistics;
  activities: TeamActivity[];
}

export function TeamDashboardIntegration({
  team,
  statistics,
  activities,
}: TeamDashboardIntegrationProps) {
  
  const resonanceInfo = getResonanceLevel(statistics.teamResonance);
  
  return (
    <div className="space-y-6">
      
      {/* Header Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Team Members */}
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-400" />}
          label="Team Members"
          value={statistics.totalMembers}
          color="purple"
        />
        
        {/* Tasks Progress */}
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          label="Tasks Completed"
          value={`${statistics.completedTasks}/${statistics.activeTasks + statistics.completedTasks}`}
          color="emerald"
        />
        
        {/* Goals Progress */}
        <StatCard
          icon={<Target className="w-5 h-5 text-blue-400" />}
          label="Active Goals"
          value={statistics.activeGoals}
          color="blue"
          badge={statistics.completedGoals > 0 ? `${statistics.completedGoals} done` : undefined}
        />
        
        {/* Upcoming Events */}
        <StatCard
          icon={<Calendar className="w-5 h-5 text-teal-400" />}
          label="Upcoming Events"
          value={statistics.upcomingEvents}
          color="teal"
        />
        
      </div>
      
      {/* Integration Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Energy Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-medium">Avg Energy</h3>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {statistics.avgEnergyLevel}%
            </div>
          </div>
          <Progress 
            value={statistics.avgEnergyLevel} 
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-500"
          />
          <p className="text-xs text-gray-400 mt-2">
            {statistics.avgEnergyLevel >= 75 ? 'High team energy!' :
             statistics.avgEnergyLevel >= 50 ? 'Moderate energy level' :
             'Team needs rest'}
          </p>
        </motion.div>
        
        {/* Team Resonance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-teal-400" />
              <h3 className="text-white font-medium">Resonance</h3>
            </div>
            <div className={`text-2xl font-bold ${resonanceInfo.color}`}>
              {statistics.teamResonance}
            </div>
          </div>
          <Progress 
            value={statistics.teamResonance} 
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-teal-500 to-blue-500"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{resonanceInfo.level}</p>
            <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs">
              Harmony
            </Badge>
          </div>
        </motion.div>
        
        {/* Team Level (Gamification) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-medium">Team Level</h3>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {statistics.teamLevel}
            </div>
          </div>
          <Progress 
            value={statistics.nextLevelProgress} 
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-amber-500 to-orange-500"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">
              {statistics.nextLevelProgress}/100 to level {statistics.teamLevel + 1}
            </p>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              {statistics.totalPoints} pts
            </Badge>
          </div>
        </motion.div>
        
      </div>
      
      {/* Productivity & Collaboration Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Productivity Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Productivity Score</h3>
              <p className="text-xs text-gray-400">Task completion rate</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-4xl font-bold text-emerald-400">
              {statistics.productivityScore}
            </div>
            <div className="text-gray-400 mb-2">/100</div>
          </div>
          <Progress 
            value={statistics.productivityScore} 
            className="h-3 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
          />
        </motion.div>
        
        {/* Collaboration Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Collaboration Score</h3>
              <p className="text-xs text-gray-400">Team interaction level</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-4xl font-bold text-blue-400">
              {statistics.collaborationScore}
            </div>
            <div className="text-gray-400 mb-2">/100</div>
          </div>
          <Progress 
            value={statistics.collaborationScore} 
            className="h-3 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </motion.div>
        
      </div>
      
      {/* Alerts Row */}
      {statistics.overdueTasks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">
                {statistics.overdueTasks} overdue {statistics.overdueTasks === 1 ? 'task' : 'tasks'}
              </p>
              <p className="text-xs text-red-400/70">Requires immediate attention</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Recent Achievements */}
      {statistics.recentAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-medium">Recent Achievements</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {statistics.recentAchievements.map((achievement, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-amber-500/10 text-amber-400 border-amber-500/30"
              >
                <Star className="w-3 h-3 mr-1" />
                {achievement}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e2128] border border-gray-800 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-white font-medium">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity</p>
          ) : (
            activities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
          )}
        </div>
      </motion.div>
      
    </div>
  );
}

// ========================================
// SUB-COMPONENTS
// ========================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  badge?: string;
}

function StatCard({ icon, label, value, color, badge }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1e2128] border border-gray-800 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <div className="flex items-end justify-between">
        <div className={`text-2xl font-bold text-${color}-400`}>
          {value}
        </div>
        {badge && (
          <Badge variant="outline" className={`bg-${color}-500/10 text-${color}-400 border-${color}-500/30 text-xs`}>
            {badge}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

interface ActivityItemProps {
  activity: TeamActivity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'goal_achieved':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'event_created':
        return <Calendar className="w-4 h-4 text-teal-400" />;
      case 'member_joined':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'achievement_unlocked':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-medium">{activity.memberName}</span>
          {' '}
          <span className="text-gray-400">{activity.description}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</p>
          {activity.points && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              +{activity.points} pts
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
