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
import { checklistTracking } from '../components/onboarding/checklist-tracking';
import { ensureExecutionProjectForTask } from '../utils/work-operating-model';
import { emitContractDomainEvent } from '../contracts/runtime/contract-runtime';
import { TaskRepositoryCommandAdapter } from '../contracts/adapters/task-repository-command-adapter';
import type { ContractCommandContext } from '../contracts/core/command-contract';
import { syncShadowTaskProjection } from '../contracts/runtime/backend-projection-mirror';
import {
  executeAuthorityRoutedCommand,
} from '../contracts/runtime/backend-authority-routing';
import { useAuth } from './AuthContext';
import { markDashboardSawRealTasksForUser, userHasDashboardTaskHistory } from '../utils/dashboard-task-history';

function extractPrimaryAgent(assignees: any[], collaborators: any[]): { id?: string; name: string } | null {
  const entries = [...(Array.isArray(assignees) ? assignees : []), ...(Array.isArray(collaborators) ? collaborators : [])];
  for (const entry of entries) {
    const role = String(entry?.role || '').toLowerCase().trim();
    const type = String(entry?.type || '').toLowerCase().trim();
    const collaboratorType = String(entry?.collaboratorType || '').toLowerCase().trim();
    const looksAgent =
      role === 'agent'
      || type === 'agent'
      || collaboratorType === 'agent'
      || Boolean(entry?.assignmentDirective)
      || Boolean(entry?.roleMission)
      || Boolean(entry?.roleDomain);
    if (!looksAgent) continue;
    const name = String(entry?.name || entry?.agentName || '').trim();
    if (!name) continue;
    const id = String(entry?.id || entry?.agentId || '').trim() || undefined;
    return { id, name };
  }
  return null;
}

function resolveTaskWorkspaceId(taskLike: Partial<Task> | null | undefined): string {
  const projectId = String((taskLike as any)?.projectId || '').trim();
  return projectId || 'workspace-main';
}

const taskCommandAdapter = new TaskRepositoryCommandAdapter();

function resolveActorId(): string {
  if (typeof window === 'undefined') return 'system';
  return (
    window.localStorage.getItem('syncscript_auth_user_id') ||
    window.localStorage.getItem('auth_user_id') ||
    'system'
  );
}

function buildCommandContext(workspaceId: string): ContractCommandContext {
  return {
    workspaceId: workspaceId || 'workspace-main',
    actorType: 'human',
    actorId: resolveActorId(),
    routeContext: 'tasks-context',
  };
}

function canUseContractTaskUpdate(updates: UpdateTaskInput): boolean {
  const allowed = new Set(['title', 'description', 'status', 'priority', 'dueDate', 'scheduledTime', 'projectId']);
  return Object.keys((updates || {}) as Record<string, unknown>).every((key) => allowed.has(key));
}

interface TasksContextValue {
  // State
  tasks: Task[];
  loading: boolean;
  /** True after the first `refreshTasks` completes for the current session token (avoids AI Focus / demo mix before the first fetch). */
  initialTasksLoadComplete: boolean;
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
  const { user, loading: authLoading, accessToken } = useAuth();
  const TASKS_REFRESH_TIMEOUT_MS = 12000;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialTasksLoadComplete, setInitialTasksLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = React.useRef<string | null>(null);
  accessTokenRef.current = accessToken;
  
  // Energy System Integration
  const energyContext = useEnergy();
  
  // Defensive check - ensure energy context is available
  if (!energyContext || !energyContext.completeTask) {
    console.error('❌ TasksProvider: Energy context not available or missing completeTask');
  }
  
  const awardTaskEnergy = energyContext?.completeTask || (() => {
    console.warn('⚠️ awardTaskEnergy called but energy context not available');
  });

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error('Task fetch timed out'));
      }, timeoutMs);
      promise
        .then((value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((err) => {
          window.clearTimeout(timeoutId);
          reject(err);
        });
    });
  }, []);
  
  // Load tasks on mount
  const refreshTasks = useCallback(async () => {
    const tokenAtStart = accessTokenRef.current;
    try {
      setLoading(true);
      setError(null);
      const allTasks = await withTimeout(taskRepository.getTasks(), TASKS_REFRESH_TIMEOUT_MS);
      if (accessTokenRef.current === tokenAtStart) {
        setTasks(allTasks);
        if (user?.id && (allTasks?.length || 0) > 0) {
          markDashboardSawRealTasksForUser(user.id);
        }
        void syncShadowTaskProjection(allTasks as Array<Record<string, unknown>>).catch(() => {
          // Shadow reads are non-authoritative in Batch 1; never block task refresh.
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      if (accessTokenRef.current === tokenAtStart) {
        setError(message);
        toast.error('Failed to load tasks', { description: message });
      }
    } finally {
      if (accessTokenRef.current === tokenAtStart) {
        setLoading(false);
        setInitialTasksLoadComplete(true);
      }
    }
  }, [withTimeout, user?.id]);

  useEffect(() => {
    if (user?.id && tasks.length > 0) {
      markDashboardSawRealTasksForUser(user.id);
    }
  }, [user?.id, tasks.length]);

  const hasDashboardTaskHistory = React.useMemo(() => {
    if (!user?.id) return false;
    if (tasks.length > 0) return true;
    return userHasDashboardTaskHistory(user.id);
  }, [user?.id, tasks.length]);

  useEffect(() => {
    setInitialTasksLoadComplete(false);
  }, [accessToken]);
  
  // Wait for auth hydration so SupabaseTaskRepository sees JWT + user id (avoids empty first fetch).
  useEffect(() => {
    if (authLoading) return;
    void refreshTasks();
  }, [authLoading, accessToken, refreshTasks]);

  useEffect(() => {
    const onNexusTools = (ev: Event) => {
      const detail = (ev as CustomEvent<{ toolTrace?: Array<{ ok?: boolean; tool?: string }> }>).detail;
      const trace = detail?.toolTrace;
      if (
        Array.isArray(trace) &&
        trace.some(
          (t) => t?.ok && (t.tool === 'create_task' || t.tool === 'add_note' || t.tool === 'propose_calendar_hold'),
        )
      ) {
        void refreshTasks();
      }
    };
    window.addEventListener('syncscript:nexus-tool-trace', onNexusTools);
    return () => window.removeEventListener('syncscript:nexus-tool-trace', onNexusTools);
  }, [refreshTasks]);
  
  // ==================== CRUD OPERATIONS ====================
  
  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    try {
      const workspaceId = String((input as any)?.projectId || 'workspace-main').trim() || 'workspace-main';
      const commandResult = await executeAuthorityRoutedCommand({
        domain: 'task',
        commandType: 'task.create',
        workspaceId,
        payload: {
          title: String(input?.title || '').trim() || 'Untitled Task',
          description: input?.description || null,
          priority: (input as any)?.priority || null,
          projectId: (input as any)?.projectId || null,
          goalId: (input as any)?.goalId || null,
        },
        runLocal: () =>
          taskCommandAdapter.createTask(
            buildCommandContext(workspaceId),
            {
              title: String(input?.title || '').trim() || 'Untitled Task',
              description: input?.description,
              priority: (input as any)?.priority,
              projectId: (input as any)?.projectId,
              goalId: (input as any)?.goalId,
            },
          ),
      });

      let createdTask: Task;
      if (commandResult.ok && commandResult.data?.taskId) {
        const taskId = String(commandResult.data.taskId);
        const enrichedPatch = {
          ...input,
          title: undefined,
          description: undefined,
          priority: undefined,
          projectId: undefined,
          goalId: undefined,
        } as Record<string, unknown>;
        const hasEnrichment = Object.values(enrichedPatch).some((value) => value !== undefined);
        if (hasEnrichment) {
          await taskRepository.updateTask(taskId, enrichedPatch as UpdateTaskInput);
        }
        const hydrated = await taskRepository.getTaskById(taskId);
        if (hydrated) {
          createdTask = hydrated;
        } else {
          const allTasks = await taskRepository.getTasks();
          const recovered = allTasks.find((task) => String(task.id) === taskId);
          if (!recovered) throw new Error('Command created task but hydration failed');
          createdTask = recovered;
        }
      } else {
        createdTask = await taskRepository.createTask(input);
      }
      const createdAssignees = Array.isArray((createdTask as any)?.assignees) ? (createdTask as any).assignees : [];
      const createdCollaborators = Array.isArray((createdTask as any)?.collaborators) ? (createdTask as any).collaborators : [];
      const primaryAgent = extractPrimaryAgent(createdAssignees, createdCollaborators);
      let newTask = createdTask;
      if (!(newTask as any)?.projectId && primaryAgent) {
        const projectId = ensureExecutionProjectForTask({
          taskId: String(newTask.id),
          taskTitle: String(newTask.title || 'Untitled Task'),
          agentName: primaryAgent.name,
          agentId: primaryAgent.id,
        });
        newTask = await taskRepository.updateTask(String(newTask.id), { projectId } as any);
      }

      setTasks(prev => [...prev, newTask]);
      emitContractDomainEvent('task.created', 'task', String(newTask.id), {
        title: newTask.title,
        status: (newTask as any)?.status || (newTask.completed ? 'done' : 'todo'),
        priority: newTask.priority,
        dueAt: newTask.dueDate || null,
        scheduledAt: newTask.scheduledTime || null,
      }, {
        workspaceId: resolveTaskWorkspaceId(newTask),
      });
      // Product analytics — funnel tracking for "manual" task creation. Voice/
      // chat/agent/n8n call sites pass their own `source` via input metadata
      // (see emit in voice-engine, agent runner, n8n webhook handler).
      try {
        const src = String((input as { source?: string })?.source || 'manual');
        // Lazy import — analytics module no-ops when key unset.
        import('../observability/analytics').then((m) => {
          m.Events.taskCreated({ source: src as Parameters<typeof m.Events.taskCreated>[0]['source'] });
        }).catch(() => { /* ignore */ });
      } catch { /* ignore */ }
      toast.success('Task created', { description: newTask.title });

      if (createdAssignees.length > 0 || createdCollaborators.length > 0) {
        window.dispatchEvent(
          new CustomEvent('syncscript:task-assignees-updated', {
            detail: {
              taskId: newTask.id,
              taskTitle: newTask.title,
              assignedAt: newTask.updatedAt || new Date().toISOString(),
              assignees: createdAssignees,
              collaborators: createdCollaborators,
            },
          }),
        );
      }

      checklistTracking.completeItem('task');

      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      toast.error('Failed to create task', { description: message });
      throw err;
    }
  }, []);
  
  const updateTask = useCallback(async (id: string, updates: UpdateTaskInput): Promise<Task> => {
    try {
      const commandEligible = canUseContractTaskUpdate(updates);
      let candidateTask: Task;
      if (commandEligible) {
        const workspaceId = String((updates as any)?.projectId || 'workspace-main');
        const commandResult = await executeAuthorityRoutedCommand({
          domain: 'task',
          commandType: 'task.update',
          workspaceId,
          payload: {
            taskId: id,
            updates: updates as Record<string, unknown>,
          },
          runLocal: () =>
            taskCommandAdapter.updateTask(
              buildCommandContext(workspaceId),
              {
                taskId: id,
                title: (updates as any)?.title,
                description: (updates as any)?.description,
                status: (updates as any)?.status,
                priority: (updates as any)?.priority,
                dueAt: (updates as any)?.dueDate,
                scheduledAt: Object.prototype.hasOwnProperty.call(updates as Record<string, unknown>, 'scheduledTime')
                  ? ((updates as any)?.scheduledTime ?? null)
                  : undefined,
                projectId: (updates as any)?.projectId,
              },
            ),
        });
        if (commandResult.ok) {
          candidateTask = (await taskRepository.getTaskById(id)) || (await taskRepository.updateTask(id, updates));
        } else {
          candidateTask = await taskRepository.updateTask(id, updates);
        }
      } else {
        candidateTask = await taskRepository.updateTask(id, updates);
      }
      const assigneesAfterUpdate = Array.isArray((candidateTask as any)?.assignees) ? (candidateTask as any).assignees : [];
      const collaboratorsAfterUpdate = Array.isArray((candidateTask as any)?.collaborators) ? (candidateTask as any).collaborators : [];
      const primaryAgent = extractPrimaryAgent(assigneesAfterUpdate, collaboratorsAfterUpdate);

      let updatedTask = candidateTask;
      if (!(updatedTask as any)?.projectId && primaryAgent) {
        const projectId = ensureExecutionProjectForTask({
          taskId: String(updatedTask.id),
          taskTitle: String(updatedTask.title || 'Untitled Task'),
          agentName: primaryAgent.name,
          agentId: primaryAgent.id,
        });
        updatedTask = await taskRepository.updateTask(String(updatedTask.id), { projectId } as any);
      }

      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      emitContractDomainEvent('task.updated', 'task', String(updatedTask.id), {
        patch: updates as Record<string, unknown>,
        status: (updatedTask as any)?.status || (updatedTask.completed ? 'done' : 'todo'),
        scheduledAt: updatedTask.scheduledTime || null,
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
      const includesAssigneeMutations =
        Object.prototype.hasOwnProperty.call(updates as Record<string, unknown>, 'assignees')
        || Object.prototype.hasOwnProperty.call(updates as Record<string, unknown>, 'collaborators');
      if (includesAssigneeMutations) {
        const assignees = Array.isArray((updatedTask as any)?.assignees) ? (updatedTask as any).assignees : [];
        const collaborators = Array.isArray((updatedTask as any)?.collaborators) ? (updatedTask as any).collaborators : [];
        window.dispatchEvent(
          new CustomEvent('syncscript:task-assignees-updated', {
            detail: {
              taskId: updatedTask.id,
              taskTitle: updatedTask.title,
              assignedAt: updatedTask.updatedAt || new Date().toISOString(),
              assignees,
              collaborators,
            },
          }),
        );
      }
      const updateKeys = Object.keys((updates || {}) as Record<string, unknown>);
      const isMicroModalUpdate =
        updateKeys.length > 0 &&
        updateKeys.every((key) => key === 'subtasks' || key === 'collaborators');
      if (!isMicroModalUpdate) {
        toast.success('Task updated');
      }

      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      toast.error('Failed to update task', { description: message });
      throw err;
    }
  }, []);
  
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      let deletedTaskSnapshot: Task | null = null;
      setTasks(prev => {
        deletedTaskSnapshot = prev.find(t => t.id === id) || null;
        return prev;
      });
      await taskRepository.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      emitContractDomainEvent('task.deleted', 'task', id, {
        deletedAt: new Date().toISOString(),
      }, {
        workspaceId: resolveTaskWorkspaceId(deletedTaskSnapshot),
      });
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
      emitContractDomainEvent('task.updated', 'task', String(updatedTask.id), {
        status: updatedTask.completed ? 'done' : 'todo',
        completed: updatedTask.completed,
        completedAt: updatedTask.completedAt || null,
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
      
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
        window.dispatchEvent(
          new CustomEvent('syncscript:task-completed', {
            detail: {
              taskId: currentTask.id,
              taskTitle: currentTask.title,
              priority: currentTask.priority,
              resonance: currentTask.resonance,
              completedAt: updatedTask.completedAt ?? new Date().toISOString(),
              dueDate: currentTask.dueDate,
              assignees: Array.isArray((currentTask as any)?.assignees) ? (currentTask as any).assignees : [],
              collaborators: Array.isArray((currentTask as any)?.collaborators) ? (currentTask as any).collaborators : [],
            },
          }),
        );
        
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
      const commandResult = await executeAuthorityRoutedCommand({
        domain: 'schedule',
        commandType: 'schedule.task.bind',
        workspaceId: 'workspace-main',
        payload: {
          taskId: id,
          scheduledAt: scheduledTime,
        },
        runLocal: () =>
          taskCommandAdapter.updateTask(
            buildCommandContext('workspace-main'),
            {
              taskId: id,
              scheduledAt: scheduledTime,
            },
          ),
      });
      const updatedTask = commandResult.ok
        ? ((await taskRepository.getTaskById(id)) || (await taskRepository.scheduleTask(id, scheduledTime)))
        : await taskRepository.scheduleTask(id, scheduledTime);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      emitContractDomainEvent('task.updated', 'task', String(updatedTask.id), {
        scheduledAt: scheduledTime,
        scheduleAction: 'scheduled',
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
      emitContractDomainEvent('schedule.binding.created', 'task', String(updatedTask.id), {
        taskId: updatedTask.id,
        scheduledAt: scheduledTime,
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
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
      const commandResult = await executeAuthorityRoutedCommand({
        domain: 'schedule',
        commandType: 'schedule.task.unbind',
        workspaceId: 'workspace-main',
        payload: {
          taskId: id,
        },
        runLocal: () =>
          taskCommandAdapter.updateTask(
            buildCommandContext('workspace-main'),
            {
              taskId: id,
              scheduledAt: null,
            },
          ),
      });
      const updatedTask = commandResult.ok
        ? ((await taskRepository.getTaskById(id)) || (await taskRepository.unscheduleTask(id)))
        : await taskRepository.unscheduleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      emitContractDomainEvent('task.updated', 'task', String(updatedTask.id), {
        scheduledAt: null,
        scheduleAction: 'unscheduled',
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
      emitContractDomainEvent('schedule.binding.deleted', 'task', String(updatedTask.id), {
        taskId: updatedTask.id,
      }, {
        workspaceId: resolveTaskWorkspaceId(updatedTask),
      });
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
    initialTasksLoadComplete,
    hasDashboardTaskHistory,
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
