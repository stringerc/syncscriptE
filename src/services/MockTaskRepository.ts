/**
 * Mock Task Repository Implementation
 * 
 * In-memory implementation of ITaskRepository using mock data.
 * Perfect for development and testing without backend dependency.
 * 
 * FEATURES:
 * ✅ Simulates async operations (realistic delays)
 * ✅ Full CRUD operations
 * ✅ Advanced filtering and queries
 * ✅ Maintains state across operations
 * ✅ Easy to swap for real backend later
 */

import { ITaskRepository } from './ITaskRepository';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, Priority, EnergyLevel, TaskStatus, CreateTeamTaskInput, DeleteTaskInput, TaskEditHistory } from '../types/task';
import { getFreshMockTasks } from '../data/mockTasks';

export class MockTaskRepository implements ITaskRepository {
  private tasks: Task[] = [];
  private readonly STORAGE_KEY = 'syncscript_tasks_v1';
  private readonly HISTORY_STORAGE_KEY = 'syncscript_task_history_v1';
  private readonly ARCHIVED_STORAGE_KEY = 'syncscript_archived_tasks_v1';
  private editHistory: TaskEditHistory[] = [];
  private archivedTasks: any[] = [];
  
  constructor() {
    // Load from localStorage or use fresh mock data
    this.loadTasks();
    this.loadEditHistory();
    this.loadArchivedTasks();
  }
  
  /**
   * Load tasks from localStorage or initialize with mock data
   */
  private loadTasks(): void {
    if (typeof window === 'undefined') {
      this.tasks = getFreshMockTasks();
      return;
    }
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.tasks = JSON.parse(stored);
        console.log('📦 Loaded', this.tasks.length, 'tasks from localStorage');
      } else {
        this.tasks = getFreshMockTasks();
        this.saveTasks();
        console.log('✨ Initialized with', this.tasks.length, 'fresh mock tasks');
      }
    } catch (err) {
      console.error('Failed to load tasks from localStorage:', err);
      this.tasks = getFreshMockTasks();
    }
  }
  
  /**
   * Save tasks to localStorage
   */
  private saveTasks(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
      console.log('💾 Saved', this.tasks.length, 'tasks to localStorage');
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
      
      // If localStorage is full or corrupted, try to recover
      if (err instanceof Error && (err.name === 'QuotaExceededError' || err.message.includes('quota'))) {
        console.warn('⚠️ localStorage quota exceeded - attempting to clear and retry');
        try {
          localStorage.removeItem(this.STORAGE_KEY);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
          console.log('✅ Successfully recovered from quota error');
        } catch (retryErr) {
          console.error('❌ Failed to recover from quota error:', retryErr);
          throw new Error('localStorage is full - please clear browser data');
        }
      } else {
        throw err;
      }
    }
  }
  
  /**
   * Load edit history from localStorage
   */
  private loadEditHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.HISTORY_STORAGE_KEY);
      if (stored) {
        this.editHistory = JSON.parse(stored);
        console.log('📦 Loaded', this.editHistory.length, 'edit history entries from localStorage');
      } else {
        this.editHistory = [];
        this.saveEditHistory();
        console.log('✨ Initialized with empty edit history');
      }
    } catch (err) {
      console.error('Failed to load edit history from localStorage:', err);
      this.editHistory = [];
    }
  }
  
  /**
   * Save edit history to localStorage
   */
  private saveEditHistory(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.editHistory));
      console.log('💾 Saved', this.editHistory.length, 'edit history entries to localStorage');
    } catch (err) {
      console.error('Failed to save edit history to localStorage:', err);
    }
  }
  
  /**
   * Load archived tasks from localStorage
   */
  private loadArchivedTasks(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.ARCHIVED_STORAGE_KEY);
      if (stored) {
        this.archivedTasks = JSON.parse(stored);
        console.log('📦 Loaded', this.archivedTasks.length, 'archived tasks from localStorage');
      } else {
        this.archivedTasks = [];
        this.saveArchivedTasks();
        console.log('✨ Initialized with empty archived tasks');
      }
    } catch (err) {
      console.error('Failed to load archived tasks from localStorage:', err);
      this.archivedTasks = [];
    }
  }
  
  /**
   * Save archived tasks to localStorage
   */
  private saveArchivedTasks(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.ARCHIVED_STORAGE_KEY, JSON.stringify(this.archivedTasks));
      console.log('💾 Saved', this.archivedTasks.length, 'archived tasks to localStorage');
    } catch (err) {
      console.error('Failed to save archived tasks to localStorage:', err);
    }
  }
  
  // Simulate network delay (realistic async behavior)
  private async delay(ms: number = 50): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Generate unique ID
  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // ==================== CORE CRUD OPERATIONS ====================
  
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    await this.delay();
    
    let filtered = [...this.tasks];
    
    if (!filters) return filtered;
    
    // Apply filters
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }
    
    if (filters.energyLevel && filters.energyLevel !== 'all') {
      filtered = filtered.filter(t => t.energyLevel === filters.energyLevel);
    }
    
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    if (filters.tag && filters.tag !== 'all') {
      filtered = filtered.filter(t => t.tags.includes(filters.tag));
    }
    
    if (filters.scheduled !== undefined) {
      filtered = filtered.filter(t => 
        filters.scheduled ? !!t.scheduledTime : !t.scheduledTime
      );
    }
    
    if (filters.completed !== undefined) {
      filtered = filtered.filter(t => t.completed === filters.completed);
    }
    
    return filtered;
  }
  
  async getTaskById(id: string): Promise<Task | null> {
    await this.delay();
    return this.tasks.find(t => t.id === id) || null;
  }
  
  async createTask(input: CreateTaskInput): Promise<Task> {
    await this.delay(100);
    
    const now = new Date().toISOString();
    const newTask: Task = {
      id: this.generateId(),
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: 'todo',
      completed: false,
      energyLevel: input.energyLevel,
      estimatedTime: input.estimatedTime,
      dueDate: input.dueDate,
      scheduledTime: input.scheduledTime,
      progress: 0,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      createdBy: 'You',
    };
    
    this.tasks.push(newTask);
    this.saveTasks();
    return newTask;
  }
  
  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    await this.delay(75);
    
    console.log('[MockTaskRepository] updateTask called:', { id, updates });
    
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      console.error('[MockTaskRepository] updateTask - Task not found:', {
        id,
        availableIds: this.tasks.map(t => t.id)
      });
      throw new Error(`Task with id ${id} not found`);
    }
    
    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    console.log('[MockTaskRepository] Updating task at index', taskIndex, 'with:', updatedTask);
    this.tasks[taskIndex] = updatedTask;
    this.saveTasks();
    console.log('[MockTaskRepository] Task updated and saved');
    return updatedTask;
  }
  
  async deleteTask(id: string): Promise<void> {
    await this.delay(50);
    
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    this.tasks.splice(taskIndex, 1);
    this.saveTasks();
  }
  
  async toggleTaskCompletion(id: string): Promise<Task> {
    await this.delay(50);
    
    console.log('[MockTaskRepository] toggleTaskCompletion called:', {
      id,
      totalTasks: this.tasks.length,
      taskIds: this.tasks.map(t => t.id)
    });
    
    const task = await this.getTaskById(id);
    if (!task) {
      console.error('[MockTaskRepository] Task not found:', {
        id,
        availableTasks: this.tasks.map(t => ({ id: t.id, title: t.title }))
      });
      throw new Error(`Task with id ${id} not found`);
    }
    
    const updates = {
      completed: !task.completed,
      status: !task.completed ? 'completed' : 'todo',
      progress: !task.completed ? 100 : task.progress,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    
    console.log('[MockTaskRepository] Updating task with:', updates);
    const updatedTask = await this.updateTask(id, updates);
    console.log('[MockTaskRepository] Task updated successfully:', {
      id: updatedTask.id,
      completed: updatedTask.completed
    });
    
    return updatedTask;
  }
  
  // ==================== QUERY METHODS ====================
  
  async getTasksByPriority(priority: Priority): Promise<Task[]> {
    return this.getTasks({ priority });
  }
  
  async getTasksByEnergyLevel(energyLevel: EnergyLevel): Promise<Task[]> {
    return this.getTasks({ energyLevel });
  }
  
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.getTasks({ status });
  }
  
  async getTasksByTag(tag: string): Promise<Task[]> {
    return this.getTasks({ tag });
  }
  
  async getUnscheduledTasks(): Promise<Task[]> {
    return this.getTasks({ scheduled: false, completed: false });
  }
  
  async getScheduledTasks(): Promise<Task[]> {
    return this.getTasks({ scheduled: true });
  }
  
  async getTodaysTasks(): Promise<Task[]> {
    await this.delay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.tasks.filter(task => {
      if (!task.scheduledTime) return false;
      const scheduledDate = new Date(task.scheduledTime);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }
  
  async getPrioritizedTasks(): Promise<Task[]> {
    await this.delay();
    
    // Get high/urgent priority tasks that are not completed
    const priorityTasks = this.tasks.filter(task => 
      !task.completed && 
      (task.priority === 'urgent' || task.priority === 'high')
    );
    
    // Sort by priority (urgent first) then by due date
    return priorityTasks.sort((a, b) => {
      // Priority ranking
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }
  
  async getCompletedTasks(): Promise<Task[]> {
    return this.getTasks({ completed: true });
  }
  
  async getUpcomingTasks(): Promise<Task[]> {
    await this.delay();
    
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return this.tasks.filter(task => {
      if (task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    });
  }
  
  // ==================== BULK OPERATIONS ====================
  
  async scheduleTask(id: string, scheduledTime: string): Promise<Task> {
    return this.updateTask(id, { scheduledTime });
  }
  
  async unscheduleTask(id: string): Promise<Task> {
    return this.updateTask(id, { scheduledTime: undefined });
  }
  
  async duplicateTask(id: string): Promise<Task> {
    await this.delay(100);
    
    const originalTask = await this.getTaskById(id);
    if (!originalTask) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    const now = new Date().toISOString();
    const duplicatedTask: Task = {
      ...originalTask,
      id: this.generateId(),
      title: `${originalTask.title} (Copy)`,
      completed: false,
      status: 'todo',
      progress: 0,
      scheduledTime: undefined, // Don't copy schedule
      createdAt: now,
      updatedAt: now,
      subtasks: originalTask.subtasks?.map(st => ({
        ...st,
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        completed: false,
        completedBy: null,
        completedAt: null,
      })),
    };
    
    this.tasks.push(duplicatedTask);
    this.saveTasks();
    return duplicatedTask;
  }
  
  // ==================== UTILITY METHODS ====================
  
  /**
   * Reset to fresh mock data (useful for testing/demos)
   */
  async reset(): Promise<void> {
    await this.delay(50);
    this.tasks = getFreshMockTasks();
    this.saveTasks();
  }
  
  /**
   * Get all unique tags from tasks
   */
  async getAllTags(): Promise<string[]> {
    await this.delay();
    const tagsSet = new Set<string>();
    this.tasks.forEach(task => {
      task.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }
  
  /**
   * Diagnostic method to check localStorage health
   */
  async diagnoseStorage(): Promise<{healthy: boolean; errors: string[]}> {
    const errors: string[] = [];
    
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined' || !window.localStorage) {
        errors.push('localStorage not available');
        return { healthy: false, errors };
      }
      
      // Try to read current storage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          JSON.parse(stored);
        } catch (e) {
          errors.push('localStorage data corrupted - cannot parse JSON');
        }
      }
      
      // Try to write test data
      try {
        localStorage.setItem('test_key', 'test_value');
        localStorage.removeItem('test_key');
      } catch (e) {
        errors.push('localStorage write failed - quota may be exceeded');
      }
      
      return { healthy: errors.length === 0, errors };
    } catch (e) {
      errors.push(`Unexpected error: ${e}`);
      return { healthy: false, errors };
    }
  }
  
  // ==================== PHASE 1.1: TEAM TASK OPERATIONS ====================
  
  /**
   * Create a team task with full hierarchy (milestones + steps)
   * Returns the structure used by TeamTasksTab
   */
  async createTeamTask(input: CreateTeamTaskInput): Promise<any> {
    await this.delay(150);
    
    const now = new Date().toISOString();
    const taskId = this.generateId();
    
    // Create milestones with steps
    const milestones = (input.milestones || []).map((milestone, mIdx) => ({
      id: `milestone-${taskId}-${mIdx}`,
      title: milestone.title,
      description: milestone.description,
      completed: false,
      energyAwarded: false,
      targetDate: milestone.targetDate,
      steps: (milestone.steps || []).map((step, sIdx) => ({
        id: `step-${taskId}-${mIdx}-${sIdx}`,
        title: step.title,
        completed: false,
        energyAwarded: false,
        assignedTo: step.assignedTo,
      })),
    }));
    
    // Create the team task structure
    const teamTask = {
      id: taskId,
      title: input.title,
      description: input.description,
      completed: false,
      energyAwarded: false,
      priority: input.priority,
      dueDate: input.dueDate,
      estimatedTime: input.estimatedTime,
      energyLevel: input.energyLevel,
      tags: input.tags || [],
      location: input.location,
      milestones,
      assignedTo: (input.assignedTo || []).map(userId => ({
        name: 'Team Member', // In real implementation, fetch from TeamContext
        image: '',
        fallback: 'TM',
      })),
      teamId: input.teamId,
      createdAt: now,
      updatedAt: now,
      createdBy: 'You',
      recurringConfig: input.recurringConfig,
    };
    
    console.log('✨ Created team task with', milestones.length, 'milestones');
    return teamTask;
  }
  
  // ==================== PHASE 1.2: EDIT HISTORY & DELETION ====================
  
  /**
   * Update a team task with edit history tracking
   */
  async updateTeamTask(taskId: string, updates: Partial<CreateTeamTaskInput>, userId: string): Promise<any> {
    await this.delay(100);
    
    // In a real implementation, fetch the current task first
    // For now, just track the changes
    const changes: TaskEditHistory['changes'] = [];
    
    Object.entries(updates).forEach(([field, newValue]) => {
      if (newValue !== undefined) {
        changes.push({
          field,
          oldValue: null, // Would fetch from current task
          newValue,
        });
      }
    });
    
    // Create edit history entry
    const historyEntry: TaskEditHistory = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      editedBy: userId,
      editedByName: 'You',
      timestamp: new Date().toISOString(),
      changes,
    };
    
    this.editHistory.push(historyEntry);
    this.saveEditHistory();
    
    console.log('📝 Task updated with', changes.length, 'changes');
    
    // Return updated task (in real implementation, would update and return)
    return {
      id: taskId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Delete a team task (soft or hard delete)
   */
  async deleteTeamTask(input: DeleteTaskInput): Promise<void> {
    await this.delay(75);
    
    if (input.archiveInstead) {
      // Soft delete - archive the task
      await this.archiveTeamTask(input.taskId, input.deleteReason, 'user-1');
    } else {
      // Hard delete - remove completely
      console.log('🗑️ Hard deleting task:', input.taskId);
      
      // Remove from any storage
      // In real implementation, would cascade delete milestones/steps if requested
      if (input.cascadeDelete) {
        console.log('🗑️ Cascade deleting child milestones and steps');
      }
    }
  }
  
  /**
   * Archive a team task (soft delete)
   */
  async archiveTeamTask(taskId: string, reason?: string, userId?: string): Promise<any> {
    await this.delay(50);
    
    const archivedTask = {
      taskId,
      archivedAt: new Date().toISOString(),
      archivedBy: userId || 'unknown',
      archivedByName: 'You',
      reason,
      originalData: {}, // Would store full task data here
    };
    
    this.archivedTasks.push(archivedTask);
    this.saveArchivedTasks();
    
    console.log('📦 Archived task:', taskId, reason ? `(Reason: ${reason})` : '');
    
    return archivedTask;
  }
  
  /**
   * Get edit history for a task
   */
  async getTaskEditHistory(taskId: string): Promise<TaskEditHistory[]> {
    await this.delay(30);
    
    const history = this.editHistory.filter(h => h.taskId === taskId);
    
    // Sort by timestamp (most recent first)
    return history.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
  
  /**
   * Restore an archived task
   */
  async restoreArchivedTask(taskId: string): Promise<any> {
    await this.delay(75);
    
    const archivedIndex = this.archivedTasks.findIndex(t => t.taskId === taskId);
    
    if (archivedIndex === -1) {
      throw new Error(`Archived task with id ${taskId} not found`);
    }
    
    const archived = this.archivedTasks[archivedIndex];
    
    // Remove from archived
    this.archivedTasks.splice(archivedIndex, 1);
    this.saveArchivedTasks();
    
    console.log('♻️ Restored archived task:', taskId);
    
    // Return the restored task data
    return archived.originalData;
  }
}