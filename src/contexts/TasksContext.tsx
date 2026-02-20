/**
 * Tasks Context Provider
 * 
 * Provides task management functionality to all components.
 * Uses the Repository Pattern - backend-agnostic!
 * 
 * INTEGRATIONS:
 * - Energy System: Awards energy on task completion
 * - Resonance Engine: Tracks task-energy alignment
 * 
 * USAGE:
 * - Wrap your app with <TasksProvider>
 * - Use useTasks() hook in any component
 * - All components share the same task state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, CreateTeamTaskInput, TaskMilestone, TaskValidationResult, TaskEditHistory } from '../types/task';
import { taskRepository } from '../services';
import { toast } from 'sonner@2.0.3';
import { useEnergy } from './EnergyContext';

interface TasksContextValue {
  // State
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshTasks: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<Task>;
  scheduleTask: (id: string, scheduledTime: string) => Promise<Task>;
  unscheduleTask: (id: string) => Promise<Task>;
  duplicateTask: (id: string) => Promise<Task>;
  
  // Phase 1.1: Team Task Creation
  createTeamTask: (input: CreateTeamTaskInput) => Promise<any>; // Returns TeamTask structure
  validateTaskDates: (dueDate: string, milestones: TaskMilestone[]) => TaskValidationResult;
  
  // Phase 1.2: Team Task Editing & Deletion
  updateTeamTask: (taskId: string, updates: Partial<CreateTeamTaskInput>, userId: string) => Promise<any>;
  deleteTeamTask: (taskId: string, archiveInstead: boolean, reason?: string) => Promise<void>;
  getTaskEditHistory: (taskId: string) => Promise<TaskEditHistory[]>;
  
  // Queries (cached from current tasks)
  getUnscheduledTasks: () => Task[];
  getScheduledTasks: () => Task[];
  getTodaysTasks: () => Task[];
  getPrioritizedTasks: () => Task[];
  getTasksByTag: (tag: string) => Task[];
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

interface TasksProviderProps {
  children: React.ReactNode;
}

export function TasksProvider({ children }: TasksProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Energy System Integration
  const energyContext = useEnergy();
  
  // Defensive check - ensure energy context is available
  if (!energyContext || !energyContext.completeTask) {
    console.error('❌ TasksProvider: Energy context not available or missing completeTask');
  }
  
  const awardTaskEnergy = energyContext?.completeTask || (() => {
    console.warn('⚠️ awardTaskEnergy called but energy context not available');
  });
  
  // Load tasks on mount
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await taskRepository.getTasks();
      setTasks(allTasks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      toast.error('Failed to load tasks', { description: message });
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);
  
  // ==================== CRUD OPERATIONS ====================
  
  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    try {
      const newTask = await taskRepository.createTask(input);
      setTasks(prev => [...prev, newTask]);
      toast.success('Task created', { description: newTask.title });

      try { const { checklistTracking } = await import('../components/onboarding/OnboardingChecklist'); checklistTracking.completeItem('task'); } catch {}

      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      toast.error('Failed to create task', { description: message });
      throw err;
    }
  }, []);
  
  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput): Promise<Task> => {
    try {
      const updatedTask = await taskRepository.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      toast.success('Task updated');
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      toast.error('Failed to update task', { description: message });
      throw err;
    }
  }, []);
  
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await taskRepository.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      toast.error('Failed to delete task', { description: message });
      throw err;
    }
  }, []);
  
  const toggleTaskCompletion = useCallback(async (id: string): Promise<Task> => {
    console.log('[toggleTaskCompletion] Called with id:', id);
    
    try {
      // ═══════════════════════════════════════════════════════════════════
      // ARCHITECTURAL FIX: Access tasks from state, not closure
      // ═══════════════════════════════════════════════════════════════════
      // PROBLEM: Having `tasks` in dependency array caused function to
      // recreate on every tasks change → race conditions in consuming components
      // 
      // SOLUTION: Use functional setState to access current tasks
      // This eliminates the need for `tasks` in the dependency array
      // Result: Stable function reference → no race conditions
      // ═══════════════════════════════════════════════════════════════════
      let currentTask: Task | undefined;
      setTasks(prevTasks => {
        currentTask = prevTasks.find(t => t.id === id);
        return prevTasks; // Don't actually update state here
      });
      
      if (!currentTask) {
        // More concise error logging - get task count via functional update
        let taskCount = 0;
        let sampleIds: string[] = [];
        setTasks(prevTasks => {
          taskCount = prevTasks.length;
          sampleIds = prevTasks.slice(0, 3).map(t => t.id);
          return prevTasks;
        });
        
        console.warn(`[toggleTaskCompletion] Task not found: ${id}`);
        if (taskCount > 0) {
          console.warn(`[toggleTaskCompletion] ${taskCount} tasks available. Sample IDs:`, sampleIds);
        } else {
          console.warn('[toggleTaskCompletion] No tasks loaded yet');
        }
        throw new Error(`Task not found: ${id}`);
      }
      
      console.log(`[toggleTaskCompletion] Toggling "${currentTask.title}" (${currentTask.completed ? 'completed' : 'incomplete'} → ${!currentTask.completed ? 'completed' : 'incomplete'})`);
      
      const updatedTask = await taskRepository.toggleTaskCompletion(id);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      // Award energy if task was completed (not reopened)
      if (updatedTask.completed) {
        // Map task priority to energy priority format
        const energyPriority = currentTask.priority === 'urgent' ? 'high' : 
                               currentTask.priority === 'high' ? 'high' :
                               currentTask.priority === 'medium' ? 'medium' : 'low';
        
        // Calculate rewards for enhanced feedback display
        const pointsEarned = energyPriority === 'high' ? 30 : 
                            energyPriority === 'medium' ? 20 : 10;
        const readinessBoost = 10; // Matches updated formula (10% per task)
        
        console.log(`✅ Task completed: "${currentTask.title}" | +${pointsEarned} pts | +${readinessBoost}% readiness`);
        
        // Pass resonance if task has it
        awardTaskEnergy(currentTask.id, currentTask.title, energyPriority, currentTask.resonance);
        
        // ═══════════════════════════════════════════════════════════════════
        // ENHANCED FEEDBACK: Show both Energy Points AND Readiness boost
        // ═══════════════════════════════════════════════════════════════════
        // Research: B.F. Skinner (1957) - "Immediate, specific feedback 
        // reinforces behavior and increases motivation"
        // ═══════════════════════════════════════════════════════════════════
        toast.success('Task completed! 🎉', {
          description: `+${pointsEarned} Energy Points ⚡ | +${readinessBoost}% Readiness Boost 🧠`,
          duration: 3500,
        });
      } else {
        console.log(`⏪ Task reopened: "${currentTask.title}"`);
        toast.success('Task reopened');
      }
      
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle task';
      console.error('[toggleTaskCompletion] Error:', {
        message,
        error: err,
        taskId: id
      });
      toast.error('Failed to toggle task completion', { description: message });
      throw err;
    }
  }, [awardTaskEnergy]); // ✅ FIXED: Removed `tasks` dependency → stable function reference
  
  const scheduleTask = useCallback(async (id: string, scheduledTime: string): Promise<Task> => {
    try {
      const updatedTask = await taskRepository.scheduleTask(id, scheduledTime);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      toast.success('Task scheduled', { 
        description: new Date(scheduledTime).toLocaleString()
      });
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule task';
      toast.error('Failed to schedule task', { description: message });
      throw err;
    }
  }, []);
  
  const unscheduleTask = useCallback(async (id: string): Promise<Task> => {
    try {
      const updatedTask = await taskRepository.unscheduleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      toast.success('Task unscheduled');
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unschedule task';
      toast.error('Failed to unschedule task', { description: message });
      throw err;
    }
  }, []);
  
  const duplicateTask = useCallback(async (id: string): Promise<Task> => {
    try {
      const duplicatedTask = await taskRepository.duplicateTask(id);
      setTasks(prev => [...prev, duplicatedTask]);
      toast.success('Task duplicated', { description: duplicatedTask.title });
      return duplicatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate task';
      toast.error('Failed to duplicate task', { description: message });
      throw err;
    }
  }, []);
  
  // ==================== QUERY METHODS (Client-side filtering) ====================
  
  const getUnscheduledTasks = useCallback((): Task[] => {
    return tasks.filter(t => !t.scheduledTime && !t.completed);
  }, [tasks]);
  
  const getScheduledTasks = useCallback((): Task[] => {
    return tasks.filter(t => !!t.scheduledTime);
  }, [tasks]);
  
  const getTodaysTasks = useCallback((): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.scheduledTime) return false;
      const scheduledDate = new Date(task.scheduledTime);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }, [tasks]);
  
  const getPrioritizedTasks = useCallback((): Task[] => {
    const priorityTasks = tasks.filter(task => 
      !task.completed && 
      (task.priority === 'urgent' || task.priority === 'high')
    );
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks]);
  
  const getTasksByTag = useCallback((tag: string): Task[] => {
    return tasks.filter(t => t.tags.includes(tag));
  }, [tasks]);
  
  // ==================== PHASE 1.1: TEAM TASK CREATION ====================
  
  const createTeamTask = useCallback(async (input: CreateTeamTaskInput): Promise<any> => {
    try {
      const teamTask = await taskRepository.createTeamTask(input);
      toast.success('Team task created', { description: teamTask.title });
      return teamTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team task';
      toast.error('Failed to create team task', { description: message });
      throw err;
    }
  }, []);
  
  const validateTaskDates = useCallback((dueDate: string, milestones: TaskMilestone[]): TaskValidationResult => {
    const errors: { field: string; message: string }[] = [];
    const due = new Date(dueDate);
    const now = new Date();
    
    // Check if due date is in the future
    if (due < now) {
      errors.push({ field: 'dueDate', message: 'Due date must be in the future' });
    }
    
    // Check each milestone
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      if (milestone.targetDate) {
        const milestoneDate = new Date(milestone.targetDate);
        
        if (milestoneDate < now) {
          errors.push({ field: `milestones[${i}].targetDate`, message: `Milestone "${milestone.title}" date must be in the future` });
        }
        
        if (milestoneDate > due) {
          errors.push({ field: `milestones[${i}].targetDate`, message: `Milestone "${milestone.title}" date must be before task due date` });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, []);
  
  // ==================== PHASE 1.2: TEAM TASK EDITING & DELETION ====================
  
  const updateTeamTask = useCallback(async (taskId: string, updates: Partial<CreateTeamTaskInput>, userId: string): Promise<any> => {
    try {
      const updatedTask = await taskRepository.updateTeamTask(taskId, updates, userId);
      toast.success('Team task updated');
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update team task';
      toast.error('Failed to update team task', { description: message });
      throw err;
    }
  }, []);
  
  const deleteTeamTask = useCallback(async (taskId: string, archiveInstead: boolean, reason?: string): Promise<void> => {
    try {
      await taskRepository.deleteTeamTask({
        taskId,
        archiveInstead,
        deleteReason: reason,
        cascadeDelete: true,
      });
      
      toast.success(archiveInstead ? 'Task archived' : 'Task deleted permanently', {
        description: archiveInstead ? 'Task can be restored from archive' : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team task';
      toast.error('Failed to delete team task', { description: message });
      throw err;
    }
  }, []);
  
  const getTaskEditHistory = useCallback(async (taskId: string): Promise<TaskEditHistory[]> => {
    try {
      const editHistory = await taskRepository.getTaskEditHistory(taskId);
      return editHistory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get task edit history';
      toast.error('Failed to get task edit history', { description: message });
      throw err;
    }
  }, []);
  
  // ==================== CONTEXT VALUE ====================
  
  // Create context value object
  const value: TasksContextValue = {
    tasks,
    loading,
    error,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion, // Direct reference - always defined as useCallback
    scheduleTask,
    unscheduleTask,
    duplicateTask,
    createTeamTask,
    validateTaskDates,
    updateTeamTask,
    deleteTeamTask,
    getTaskEditHistory,
    getUnscheduledTasks,
    getScheduledTasks,
    getTodaysTasks,
    getPrioritizedTasks,
    getTasksByTag,
  };
  
  // Debug logging
  console.log('✅ TasksProvider: Context value created', {
    hasToggleTaskCompletion: !!value.toggleTaskCompletion,
    toggleTaskCompletionType: typeof value.toggleTaskCompletion,
    isFunction: typeof value.toggleTaskCompletion === 'function'
  });
  
  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

// ==================== HOOK ====================

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  
  // Debug: Verify toggleTaskCompletion is in the context
  if (!context.toggleTaskCompletion) {
    console.error('❌ useTasks: toggleTaskCompletion is missing from context!', context);
  }
  
  return context;
}
