import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import energyTrackingService from './energyTrackingService';

const prisma = new PrismaClient();

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: string;
  title: string;
  message: string;
  priority: number;
  actionable?: boolean;
  action?: {
    label: string;
    route?: string;
    handler?: string;
  };
}

class AIInsightsService {
  /**
   * Generate personalized insights for user
   */
  async generateInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get user data
    const [energyPattern, taskStats, streakData, budgetData] = await Promise.all([
      energyTrackingService.analyzeEnergyPattern(userId).catch(() => null),
      this.getTaskStats(userId),
      this.getStreakData(userId),
      this.getBudgetData(userId)
    ]);

    // Energy Pattern Insight
    if (energyPattern && energyPattern.peakHours.length > 0) {
      const peakHour = energyPattern.peakHours[0];
      const peakTime = this.formatHour(peakHour);
      
      insights.push({
        id: 'energy_peak',
        type: 'success',
        icon: '🎯',
        title: 'Peak Performance',
        message: `You peak at ${peakTime} daily. Schedule hard work then.`,
        priority: 10,
        actionable: true,
        action: {
          label: 'View Calendar',
          route: '/plan'
        }
      });
    }

    // Streak Insight
    if (streakData && streakData.count > 0) {
      const daysToNextMilestone = this.getNextStreakMilestone(streakData.count);
      const emblemName = this.getStreakEmblemName(daysToNextMilestone);
      
      insights.push({
        id: 'streak_power',
        type: 'warning',
        icon: '🔥',
        title: 'Streak Power',
        message: `${streakData.count}-day streak! Keep logging energy to unlock ${emblemName}.`,
        priority: 9
      });
    }

    // Budget Insight
    if (budgetData) {
      const percentage = budgetData.percentageUsed;
      let message = '';
      let type: 'success' | 'warning' | 'info' = 'info';
      let icon = '📊';

      if (percentage <= 85) {
        message = `Budget ${percentage}% healthy. Great job this month!`;
        type = 'success';
        icon = '📊';
      } else if (percentage <= 95) {
        message = `Budget ${percentage}% used. Watch spending this week.`;
        type = 'warning';
        icon = '⚠️';
      } else {
        message = `Budget ${percentage}% exceeded. Review expenses.`;
        type = 'warning';
        icon = '🚨';
      }

      insights.push({
        id: 'budget_status',
        type,
        icon,
        title: percentage <= 85 ? 'On Track' : 'Budget Alert',
        message,
        priority: percentage > 95 ? 10 : 7,
        actionable: percentage > 85,
        action: {
          label: 'Review Budget',
          route: '/manage?tab=money'
        }
      });
    }

    // Task Productivity Insight
    if (taskStats) {
      const completionRate = taskStats.total > 0 
        ? Math.round((taskStats.completed / taskStats.total) * 100) 
        : 0;

      if (completionRate >= 70) {
        insights.push({
          id: 'productivity_high',
          type: 'success',
          icon: '🚀',
          title: 'High Productivity',
          message: `${completionRate}% task completion rate! You're crushing it.`,
          priority: 8
        });
      } else if (completionRate < 40 && taskStats.total > 5) {
        insights.push({
          id: 'productivity_low',
          type: 'warning',
          icon: '💡',
          title: 'Productivity Opportunity',
          message: `${completionRate}% completion. Match tasks to your energy for better results.`,
          priority: 9,
          actionable: true,
          action: {
            label: 'View Tasks',
            route: '/do'
          }
        });
      }
    }

    // Energy Match Insight
    if (energyPattern) {
      const currentHour = new Date().getHours();
      const isPeakTime = energyPattern.peakHours.includes(currentHour);
      
      if (isPeakTime) {
        insights.push({
          id: 'peak_time_now',
          type: 'success',
          icon: '⚡',
          title: 'Perfect Timing!',
          message: `You're in your peak hour! Tackle your hardest tasks now.`,
          priority: 10,
          actionable: true,
          action: {
            label: 'See Tasks',
            route: '/do'
          }
        });
      }
    }

    // Sort by priority (highest first)
    return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  /**
   * Get task statistics
   */
  private async getTaskStats(userId: string): Promise<{ total: number; completed: number } | null> {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM tasks
        WHERE userId = ${userId} AND deletedAt IS NULL
      ` as any[];

      return {
        total: stats[0].total,
        completed: stats[0].completed
      };
    } catch (error) {
      logger.error('Error getting task stats', { userId, error });
      return null;
    }
  }

  /**
   * Get streak data
   */
  private async getStreakData(userId: string): Promise<{ count: number; type: string } | null> {
    try {
      const streaks = await prisma.$queryRaw`
        SELECT * FROM streaks
        WHERE userId = ${userId}
        ORDER BY count DESC
        LIMIT 1
      ` as any[];

      return streaks.length > 0 ? streaks[0] : null;
    } catch (error) {
      logger.error('Error getting streak data', { userId, error });
      return null;
    }
  }

  /**
   * Get budget data
   */
  private async getBudgetData(userId: string): Promise<{ percentageUsed: number } | null> {
    try {
      // Mock for now - would calculate from financial data
      return { percentageUsed: 85 };
    } catch (error) {
      logger.error('Error getting budget data', { userId, error });
      return null;
    }
  }

  /**
   * Format hour to readable time
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12am';
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return '12pm';
    return `${hour - 12}pm`;
  }

  /**
   * Get next streak milestone
   */
  private getNextStreakMilestone(currentStreak: number): number {
    const milestones = [7, 14, 30, 50, 100];
    return milestones.find(m => m > currentStreak) || 100;
  }

  /**
   * Get emblem name for streak milestone
   */
  private getStreakEmblemName(milestone: number): string {
    const emblemMap: Record<number, string> = {
      7: 'Steady Flame',
      14: 'Sunrise Keeper',
      30: 'Dragon\'s Breath',
      100: 'Eternal Light'
    };
    return emblemMap[milestone] || 'a special emblem';
  }

  /**
   * Generate task suggestions based on current energy
   */
  async generateTaskSuggestions(
    userId: string,
    currentEnergy: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK'
  ): Promise<any[]> {
    // Get incomplete tasks
    const tasks = await prisma.$queryRaw`
      SELECT id, title, priority, energyRequired, estimatedDuration
      FROM tasks
      WHERE userId = ${userId} 
        AND status != 'COMPLETED'
        AND deletedAt IS NULL
      ORDER BY priority DESC
      LIMIT 10
    ` as any[];

    // Energy level mapping
    const energyMap: Record<string, number> = {
      'LOW': 3,
      'MEDIUM': 5,
      'HIGH': 7,
      'PEAK': 10
    };

    const userEnergyValue = energyMap[currentEnergy];

    // Score and sort tasks
    const scoredTasks = tasks.map(task => {
      const taskEnergy = task.energyRequired || 5;
      const energyDiff = Math.abs(taskEnergy - userEnergyValue);
      const priorityScore = task.priority === 'HIGH' ? 10 : task.priority === 'MEDIUM' ? 5 : 2;
      
      // Lower energy difference = better match
      const matchScore = (10 - energyDiff) + priorityScore;

      return { ...task, matchScore };
    });

    // Return top 3 matches
    return scoredTasks
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }
}

export default new AIInsightsService();

