/**
 * Task Repository Interface (Contract)
 * 
 * This interface defines the contract that ALL implementations must follow.
 * Whether using Mock Data, Supabase, Firebase, or custom API - they all
 * implement this same interface.
 * 
 * BENEFITS:
 * ✅ UI components never know about the backend
 * ✅ Swap backends by changing ONE line of code
 * ✅ Easy to test with mock data
 * ✅ Future-proof architecture
 */

import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, Priority, EnergyLevel, TaskStatus, CreateTeamTaskInput, DeleteTaskInput, TaskEditHistory } from '../types/task';

export interface ITaskRepository {
  // ==================== CORE CRUD OPERATIONS ====================
  
  /**
   * Get all tasks (optionally filtered)
   */
  getTasks(filters?: TaskFilters): Promise<Task[]>;
  
  /**
   * Get a single task by ID
   */
  getTaskById(id: string): Promise<Task | null>;
  
  /**
   * Create a new task
   */
  createTask(input: CreateTaskInput): Promise<Task>;
  
  /**
   * Update an existing task
   */
  updateTask(id: string, updates: UpdateTaskInput): Promise<Task>;
  
  /**
   * Delete a task
   */
  deleteTask(id: string): Promise<void>;
  
  /**
   * Toggle task completion status
   */
  toggleTaskCompletion(id: string): Promise<Task>;
  
  
  // ==================== QUERY METHODS ====================
  
  /**
   * Get tasks by priority level
   */
  getTasksByPriority(priority: Priority): Promise<Task[]>;
  
  /**
   * Get tasks by energy level
   */
  getTasksByEnergyLevel(energyLevel: EnergyLevel): Promise<Task[]>;
  
  /**
   * Get tasks by status
   */
  getTasksByStatus(status: TaskStatus): Promise<Task[]>;
  
  /**
   * Get tasks by tag
   */
  getTasksByTag(tag: string): Promise<Task[]>;
  
  /**
   * Get unscheduled tasks (for calendar sidebar)
   */
  getUnscheduledTasks(): Promise<Task[]>;
  
  /**
   * Get scheduled tasks (tasks with scheduledTime set)
   */
  getScheduledTasks(): Promise<Task[]>;
  
  /**
   * Get today's tasks (for dashboard)
   */
  getTodaysTasks(): Promise<Task[]>;
  
  /**
   * Get high-priority incomplete tasks (for dashboard)
   */
  getPrioritizedTasks(): Promise<Task[]>;
  
  /**
   * Get completed tasks
   */
  getCompletedTasks(): Promise<Task[]>;
  
  /**
   * Get tasks due soon (within next 7 days)
   */
  getUpcomingTasks(): Promise<Task[]>;
  
  
  // ==================== BULK OPERATIONS ====================
  
  /**
   * Schedule a task to a specific time
   */
  scheduleTask(id: string, scheduledTime: string): Promise<Task>;
  
  /**
   * Unschedule a task (remove from calendar)
   */
  unscheduleTask(id: string): Promise<Task>;
  
  /**
   * Duplicate a task
   */
  duplicateTask(id: string): Promise<Task>;
  
  // ==================== PHASE 1.1: TEAM TASK OPERATIONS ====================
  
  /**
   * Create a team task with milestones and steps
   */
  createTeamTask(input: CreateTeamTaskInput): Promise<any>;
  
  // ==================== PHASE 1.2: EDIT HISTORY & DELETION ====================
  
  /**
   * Update a team task with edit history tracking
   */
  updateTeamTask(taskId: string, updates: Partial<CreateTeamTaskInput>, userId: string): Promise<any>;
  
  /**
   * Delete a team task (soft or hard delete)
   */
  deleteTeamTask(input: DeleteTaskInput): Promise<void>;
  
  /**
   * Archive a team task (soft delete)
   */
  archiveTeamTask(taskId: string, reason?: string, userId?: string): Promise<any>;
  
  /**
   * Get edit history for a task
   */
  getTaskEditHistory(taskId: string): Promise<TaskEditHistory[]>;
  
  /**
   * Restore an archived task
   */
  restoreArchivedTask(taskId: string): Promise<any>;
}