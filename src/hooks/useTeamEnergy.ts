import { useCallback } from 'react';
import { useEnergy } from '../contexts/EnergyContext';
import { useTeam } from '../contexts/TeamContext';

/**
 * useTeamEnergy Hook
 * 
 * Bridges EnergyContext and TeamContext for team-based energy tracking.
 * When a user completes a task/goal/milestone/step that belongs to a team,
 * this hook ensures both individual and team energy are updated.
 * 
 * Features:
 * - Automatic team energy contribution
 * - Team multiplier bonuses
 * - Activity feed updates
 * - Dual toast notifications (individual + team bonus)
 */

const CURRENT_USER_ID = 'user-1'; // Mock current user

export function useTeamEnergy() {
  const { completeTask, completeGoal, completeMilestone, completeStep } = useEnergy();
  const { addTeamEnergy, addTeamActivity } = useTeam();

  /**
   * Complete a task with team energy integration
   */
  const completeTaskWithTeam = useCallback((
    taskId: string,
    taskTitle: string,
    priority: 'low' | 'medium' | 'high',
    teamId?: string
  ) => {
    // Always add individual energy
    completeTask(taskId, taskTitle, priority);

    // If part of a team, add team energy
    if (teamId) {
      const energyAmount = priority === 'low' ? 10 : priority === 'medium' ? 20 : 30;
      addTeamEnergy(teamId, CURRENT_USER_ID, energyAmount, `task-${priority}`);
      
      addTeamActivity({
        teamId,
        userId: CURRENT_USER_ID,
        userName: 'You',
        userImage: '/avatars/default-user.png',
        type: 'event_completed',
        description: `completed task "${taskTitle}"`,
        metadata: { taskId, priority, energy: energyAmount },
      });
    }
  }, [completeTask, addTeamEnergy, addTeamActivity]);

  /**
   * Complete a goal with team energy integration
   */
  const completeGoalWithTeam = useCallback((
    goalId: string,
    goalTitle: string,
    size: 'small' | 'medium' | 'large',
    teamId?: string
  ) => {
    // Always add individual energy
    completeGoal(goalId, goalTitle, size);

    // If part of a team, add team energy
    if (teamId) {
      const energyAmount = size === 'small' ? 50 : size === 'medium' ? 100 : 200;
      addTeamEnergy(teamId, CURRENT_USER_ID, energyAmount, `goal-${size}`);
      
      addTeamActivity({
        teamId,
        userId: CURRENT_USER_ID,
        userName: 'You',
        userImage: '/avatars/default-user.png',
        type: 'goal_completed',
        description: `completed goal "${goalTitle}"`,
        metadata: { goalId, size, energy: energyAmount },
      });
    }
  }, [completeGoal, addTeamEnergy, addTeamActivity]);

  /**
   * Complete a milestone with team energy integration
   */
  const completeMilestoneWithTeam = useCallback((
    milestoneId: string,
    milestoneTitle: string,
    teamId?: string
  ) => {
    // Always add individual energy
    completeMilestone(milestoneId, milestoneTitle);

    // If part of a team, add team energy
    if (teamId) {
      const energyAmount = 50;
      addTeamEnergy(teamId, CURRENT_USER_ID, energyAmount, 'milestone');
      
      addTeamActivity({
        teamId,
        userId: CURRENT_USER_ID,
        userName: 'You',
        userImage: '/avatars/default-user.png',
        type: 'milestone_completed',
        description: `completed milestone "${milestoneTitle}"`,
        metadata: { milestoneId, energy: energyAmount },
      });
    }
  }, [completeMilestone, addTeamEnergy, addTeamActivity]);

  /**
   * Complete a step with team energy integration
   */
  const completeStepWithTeam = useCallback((
    stepId: string,
    stepTitle: string,
    teamId?: string
  ) => {
    // Always add individual energy
    completeStep(stepId, stepTitle);

    // If part of a team, add team energy
    if (teamId) {
      const energyAmount = 5;
      addTeamEnergy(teamId, CURRENT_USER_ID, energyAmount, 'step');
      
      addTeamActivity({
        teamId,
        userId: CURRENT_USER_ID,
        userName: 'You',
        userImage: '/avatars/default-user.png',
        type: 'event_completed',
        description: `completed step "${stepTitle}"`,
        metadata: { stepId, energy: energyAmount },
      });
    }
  }, [completeStep, addTeamEnergy, addTeamActivity]);

  return {
    completeTaskWithTeam,
    completeGoalWithTeam,
    completeMilestoneWithTeam,
    completeStepWithTeam,
  };
}
