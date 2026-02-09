/**
 * useIntelligentTaskPriority Hook
 * 
 * Provides access to research-backed intelligent task prioritization
 * across the dashboard.
 */

import { useTasks } from './useTasks';
import { getTopPriorityTasks, selectTopPriorityTask } from '../utils/intelligent-task-selector';

export function useIntelligentTaskPriority() {
  const { tasks, loading } = useTasks();
  
  return {
    /**
     * Get the #1 top priority task right now
     */
    getTopTask: () => selectTopPriorityTask(tasks),
    
    /**
     * Get top N priority tasks
     */
    getTopTasks: (count: number = 2) => getTopPriorityTasks(tasks, count),
    
    /**
     * Check if a task is in the top priority list
     */
    isTopPriority: (taskId: string, count: number = 2) => {
      const topTasks = getTopPriorityTasks(tasks, count);
      return topTasks.some(t => t.task.id === taskId);
    },
    
    loading,
  };
}
