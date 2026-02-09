/**
 * PHASE 2.2: Team Event Collaboration Panel
 * 
 * Displays team collaboration features within an event:
 * - Team member activity
 * - Energy contributions
 * - Task assignments
 * - Recent updates
 */

import React, { useMemo } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import { Event, Task } from '../../utils/event-task-types';
import { 
  Users, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';

interface TeamEventCollaborationPanelProps {
  event: Event;
  tasks: Task[];
  className?: string;
}

export function TeamEventCollaborationPanel({
  event,
  tasks,
  className = '',
}: TeamEventCollaborationPanelProps) {
  const { teams, getTeamActivity } = useTeam();
  const team = teams.find(t => t.id === event.teamId);

  // Get team activity for this event
  const recentActivity = useMemo(() => {
    if (!team) return [];
    return getTeamActivity(team.id, 10);
  }, [team, getTeamActivity]);

  // Calculate member contributions
  const memberContributions = useMemo(() => {
    if (!team) return [];

    return team.members.map(member => {
      const memberTasks = tasks.filter(task =>
        task.assignedTo?.some(assigned => assigned.id === member.userId)
      );
      const completedTasks = memberTasks.filter(t => t.completed).length;
      
      return {
        member,
        tasksAssigned: memberTasks.length,
        tasksCompleted: completedTasks,
        completionRate: memberTasks.length > 0 
          ? Math.round((completedTasks / memberTasks.length) * 100)
          : 0,
      };
    }).sort((a, b) => b.tasksCompleted - a.tasksCompleted);
  }, [team, tasks]);

  if (!team) {
    return (
      <div className={`p-4 rounded-lg bg-neutral-800/30 border border-neutral-700/50 ${className}`}>
        <div className="flex items-center gap-2 text-neutral-400">
          <Users className="w-4 h-4" />
          <span className="text-sm">No team assigned to this event</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Team Header */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: team.color + '20', color: team.color }}
        >
          {team.icon || <Users className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-100">{team.name}</h3>
          <p className="text-xs text-neutral-400">{team.memberCount} team members</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-green-400">
            <TrendingUp className="w-3 h-3" />
            <span>{team.energyStats.energyTrend}</span>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Zap className="w-3 h-3" />
            <span className="text-xs">Energy</span>
          </div>
          <p className="text-lg font-semibold text-neutral-100">
            {team.energyStats.currentDayEnergy.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500">Today</p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-xs">Completed</span>
          </div>
          <p className="text-lg font-semibold text-neutral-100">
            {tasks.filter(t => t.completed).length}/{tasks.length}
          </p>
          <p className="text-xs text-neutral-500">Tasks</p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Activity className="w-3 h-3" />
            <span className="text-xs">Active</span>
          </div>
          <p className="text-lg font-semibold text-neutral-100">
            {team.members.filter(m => m.status === 'online').length}
          </p>
          <p className="text-xs text-neutral-500">Members</p>
        </div>
      </div>

      {/* Member Contributions */}
      <div>
        <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          Member Contributions
        </h4>
        <div className="space-y-2">
          {memberContributions.slice(0, 5).map(({ member, tasksAssigned, tasksCompleted, completionRate }) => (
            <div 
              key={member.userId}
              className="flex items-center gap-3 p-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-300">
                {member.fallback}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">{member.name}</p>
                <p className="text-xs text-neutral-500">
                  {tasksCompleted}/{tasksAssigned} tasks
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-20">
                <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Completion Rate */}
              <div className="text-xs font-medium text-neutral-400 w-10 text-right">
                {completionRate}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentActivity.slice(0, 5).map(activity => (
              <div 
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/20 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  {activity.userImage ? (
                    <div className="w-full h-full rounded-full bg-neutral-600" />
                  ) : (
                    <span className="text-[10px] text-neutral-400">
                      {activity.userName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-300">
                    <span className="font-medium">{activity.userName}</span>
                    {' '}
                    <span className="text-neutral-400">{activity.description}</span>
                  </p>
                  <p className="text-neutral-500 text-[11px] mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Energy Breakdown */}
      {team.settings.sharedEnergyPool && (
        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-neutral-200">Team Energy Pool</span>
            {team.settings.energyMultiplier > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                {team.settings.energyMultiplier}x bonus
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Tasks</span>
              <span className="text-neutral-200">{team.energyStats.energyFromTasks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Milestones</span>
              <span className="text-neutral-200">{team.energyStats.energyFromMilestones.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Steps</span>
              <span className="text-neutral-200">{team.energyStats.energyFromSteps.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Goals</span>
              <span className="text-neutral-200">{team.energyStats.energyFromGoals.toLocaleString()}</span>
            </div>
            {team.energyStats.bonusEnergyFromMultiplier > 0 && (
              <div className="flex justify-between pt-1 border-t border-neutral-700">
                <span className="text-purple-400">Bonus</span>
                <span className="text-purple-300 font-medium">
                  +{team.energyStats.bonusEnergyFromMultiplier.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
