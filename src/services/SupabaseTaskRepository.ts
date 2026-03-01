import { ITaskRepository } from './ITaskRepository';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters, Priority, EnergyLevel, TaskStatus, CreateTeamTaskInput, DeleteTaskInput, TaskEditHistory } from '../types/task';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

export class SupabaseTaskRepository implements ITaskRepository {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || publicAnonKey;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`Task API ${response.status} - ${text}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private filterTasks(tasks: Task[], filters?: TaskFilters): Task[] {
    if (!filters) return tasks;
    return tasks.filter((task) => {
      if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.energyLevel && filters.energyLevel !== 'all' && task.energyLevel !== filters.energyLevel) return false;
      if (filters.status && filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.tag && filters.tag !== 'all' && !(task.tags || []).includes(filters.tag)) return false;
      if (filters.scheduled !== undefined && Boolean(task.scheduledTime) !== filters.scheduled) return false;
      if (filters.completed !== undefined && Boolean(task.completed) !== filters.completed) return false;
      return true;
    });
  }

  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.priority && filters.priority !== 'all') params.set('priority', filters.priority);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.tag && filters.tag !== 'all') params.set('tag', filters.tag);
    if (filters?.completed !== undefined) params.set('completed', String(filters.completed));
    if (filters?.scheduled !== undefined) params.set('scheduled', String(filters.scheduled));
    const query = params.toString();
    const tasks = await this.request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
    return this.filterTasks(tasks || [], filters);
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTaskCompletion(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/toggle`, {
      method: 'POST',
    });
  }

  async getTasksByPriority(priority: Priority): Promise<Task[]> {
    return this.getTasks({ priority } as TaskFilters);
  }

  async getTasksByEnergyLevel(energyLevel: EnergyLevel): Promise<Task[]> {
    return this.getTasks({ energyLevel } as TaskFilters);
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.getTasks({ status } as TaskFilters);
  }

  async getTasksByTag(tag: string): Promise<Task[]> {
    return this.getTasks({ tag } as TaskFilters);
  }

  async getUnscheduledTasks(): Promise<Task[]> {
    return this.getTasks({ scheduled: false, completed: false } as TaskFilters);
  }

  async getScheduledTasks(): Promise<Task[]> {
    return this.getTasks({ scheduled: true } as TaskFilters);
  }

  async getTodaysTasks(): Promise<Task[]> {
    const tasks = await this.getTasks({ completed: false } as TaskFilters);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tasks.filter((task) => {
      if (!task.scheduledTime) return false;
      const date = new Date(task.scheduledTime);
      return date >= today && date < tomorrow;
    });
  }

  async getPrioritizedTasks(): Promise<Task[]> {
    const tasks = await this.getTasks({ completed: false } as TaskFilters);
    return tasks
      .filter((t) => t.priority === 'urgent' || t.priority === 'high')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async getCompletedTasks(): Promise<Task[]> {
    return this.getTasks({ completed: true } as TaskFilters);
  }

  async getUpcomingTasks(): Promise<Task[]> {
    const tasks = await this.getTasks({ completed: false } as TaskFilters);
    const now = Date.now();
    const cutoff = now + 7 * 24 * 60 * 60 * 1000;
    return tasks.filter((t) => {
      const due = new Date(t.dueDate).getTime();
      return Number.isFinite(due) && due >= now && due <= cutoff;
    });
  }

  async scheduleTask(id: string, scheduledTime: string): Promise<Task> {
    return this.updateTask(id, { scheduledTime } as UpdateTaskInput);
  }

  async unscheduleTask(id: string): Promise<Task> {
    return this.updateTask(id, { scheduledTime: undefined } as UpdateTaskInput);
  }

  async duplicateTask(id: string): Promise<Task> {
    const task = await this.getTaskById(id);
    if (!task) throw new Error(`Task with id ${id} not found`);
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, completedAt: _completedAt, ...rest } = task as any;
    return this.createTask({
      ...rest,
      title: `${task.title} (Copy)`,
      completed: false,
      status: 'todo',
      progress: 0,
      scheduledTime: undefined,
    } as CreateTaskInput);
  }

  async createTeamTask(input: CreateTeamTaskInput): Promise<any> {
    return this.createTask({
      title: input.title,
      description: input.description,
      priority: input.priority as any,
      energyLevel: input.energyLevel as any,
      estimatedTime: input.estimatedTime,
      dueDate: input.dueDate,
      tags: input.tags || [],
      subtasks: input.milestones?.map((m, i) => ({
        id: `milestone-${Date.now()}-${i}`,
        title: m.title,
        completed: false,
        completedBy: null,
        completedAt: null,
        steps: (m.steps || []).map((s, j) => ({
          id: `step-${Date.now()}-${i}-${j}`,
          title: s.title,
          completed: false,
        })),
      })),
    } as any);
  }

  async updateTeamTask(taskId: string, updates: Partial<CreateTeamTaskInput>, userId: string): Promise<any> {
    return this.updateTask(taskId, updates as any);
  }

  async deleteTeamTask(input: DeleteTaskInput): Promise<void> {
    return this.deleteTask(input.taskId);
  }

  async archiveTeamTask(taskId: string, reason?: string, userId?: string): Promise<any> {
    const task = await this.updateTask(taskId, { status: 'completed' as any } as any);
    return { ...task, archived: true, reason, userId };
  }

  async getTaskEditHistory(taskId: string): Promise<TaskEditHistory[]> {
    return [];
  }

  async restoreArchivedTask(taskId: string): Promise<any> {
    return this.updateTask(taskId, { status: 'todo' as any, completed: false } as any);
  }
}
