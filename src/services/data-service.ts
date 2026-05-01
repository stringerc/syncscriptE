/**
 * DATA SERVICE
 *
 * **Tasks:** `TaskService` delegates to `taskRepository` (same Supabase Edge `make-server-57781ad9`
 * `/tasks` routes as the dashboard). Use this for scripts/tests that should not import React context.
 *
 * **Goals / events / users / …:** still legacy `BaseService` stubs unless wired later.
 */

import {
  Task,
  Goal,
  Event,
  User,
  Team,
  Integration,
  EnergyEntry,
  DailyEnergySnapshot,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateGoalRequest,
  CreateEventRequest,
  TaskFilters,
  GoalFilters,
  EventFilters,
  PaginatedResponse,
  PaginationParams,
} from '../types/data-model';
import { taskRepository } from './index';

// ============================================================================
// BASE SERVICE
// ============================================================================

class BaseService {
  protected baseUrl = '/api'; // In production, this would be your API URL

  protected async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // In production:
    // const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    // if (!response.ok) throw new Error(response.statusText);
    // return response.json();

    // Mock implementation:
    console.log(`[API] ${options?.method || 'GET'} ${endpoint}`, options?.body);
    throw new Error('Using mock data - API not implemented');
  }
}

// ============================================================================
// TASK SERVICE
// ============================================================================

type CreateTaskPayload = Parameters<typeof taskRepository.createTask>[0];

function toCreateTaskPayload(data: CreateTaskRequest): CreateTaskPayload {
  const due =
    data.due_date === undefined
      ? undefined
      : typeof data.due_date === 'string'
        ? data.due_date
        : (data.due_date as Date).toISOString?.() ?? String(data.due_date);
  return {
    title: data.title,
    description: data.description,
    priority: data.priority as CreateTaskPayload['priority'],
    tags: data.tags,
    dueDate: due,
  } as CreateTaskPayload;
}

type UpdateTaskPayload = Parameters<typeof taskRepository.updateTask>[1];

function toUpdateTaskPayload(data: UpdateTaskRequest): UpdateTaskPayload {
  return {
    title: data.title,
    description: data.description,
    status: data.status as UpdateTaskPayload['status'],
    priority: data.priority as UpdateTaskPayload['priority'],
    tags: data.tags,
    dueDate:
      data.due_date === undefined
        ? undefined
        : typeof data.due_date === 'string'
          ? data.due_date
          : (data.due_date as Date).toISOString?.() ?? String(data.due_date),
  } as UpdateTaskPayload;
}

export class TaskService {
  async list(
    filters?: TaskFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Task>> {
    const tasks = await taskRepository.getTasks(filters as Parameters<typeof taskRepository.getTasks>[0]);
    const safe = (tasks || []) as Task[];
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.max(1, pagination?.limit ?? safe.length || 50);
    const start = (page - 1) * limit;
    const slice = safe.slice(start, start + limit);
    const total = safe.length;
    return {
      data: slice,
      total,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async get(id: string): Promise<Task> {
    const t = await taskRepository.getTaskById(id);
    if (!t) throw new Error(`Task not found: ${id}`);
    return t;
  }

  async create(data: CreateTaskRequest): Promise<Task> {
    return taskRepository.createTask(toCreateTaskPayload(data));
  }

  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    return taskRepository.updateTask(id, toUpdateTaskPayload(data));
  }

  async delete(id: string): Promise<void> {
    await taskRepository.deleteTask(id);
  }

  /** Same semantics as dashboard toggle — Edge `POST /tasks/:id/toggle` (records `task_completed` activity when completing). */
  async complete(id: string): Promise<Task> {
    return taskRepository.toggleTaskCompletion(id);
  }

  async addAttachment(_taskId: string, _file: File): Promise<Task> {
    throw new Error(
      'Task attachments are not exposed on Edge task routes — use Settings → Files / library flows.',
    );
  }
}

// ============================================================================
// GOAL SERVICE
// ============================================================================

export class GoalService extends BaseService {
  async list(
    filters?: GoalFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Goal>> {
    return this.fetch('/goals');
  }

  async get(id: string): Promise<Goal> {
    return this.fetch(`/goals/${id}`);
  }

  async create(data: CreateGoalRequest): Promise<Goal> {
    return this.fetch('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<Goal>): Promise<Goal> {
    return this.fetch(`/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    return this.fetch(`/goals/${id}`, { method: 'DELETE' });
  }

  async updateProgress(id: string, progress: number): Promise<Goal> {
    return this.fetch(`/goals/${id}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  }
}

// ============================================================================
// EVENT SERVICE
// ============================================================================

export class EventService extends BaseService {
  async list(
    filters?: EventFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Event>> {
    return this.fetch('/events');
  }

  async get(id: string): Promise<Event> {
    return this.fetch(`/events/${id}`);
  }

  async create(data: CreateEventRequest): Promise<Event> {
    return this.fetch('/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    return this.fetch(`/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    return this.fetch(`/events/${id}`, { method: 'DELETE' });
  }

  async inviteParticipant(
    eventId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer'
  ): Promise<Event> {
    return this.fetch(`/events/${eventId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  async updateParticipantRole(
    eventId: string,
    userId: string,
    role: 'admin' | 'editor' | 'viewer'
  ): Promise<Event> {
    return this.fetch(`/events/${eventId}/participants/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  }

  async removeParticipant(
    eventId: string,
    userId: string
  ): Promise<Event> {
    return this.fetch(`/events/${eventId}/participants/${userId}`, {
      method: 'DELETE',
    });
  }
}

// ============================================================================
// USER SERVICE
// ============================================================================

export class UserService extends BaseService {
  async getCurrentUser(): Promise<User> {
    return this.fetch('/users/me');
  }

  async get(id: string): Promise<User> {
    return this.fetch(`/users/${id}`);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.fetch(`/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async updateStatus(status: string, customStatus?: string): Promise<User> {
    return this.fetch('/users/me/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, custom_status: customStatus }),
    });
  }
}

// ============================================================================
// TEAM SERVICE
// ============================================================================

export class TeamService extends BaseService {
  async list(): Promise<Team[]> {
    return this.fetch('/teams');
  }

  async get(id: string): Promise<Team> {
    return this.fetch(`/teams/${id}`);
  }

  async create(data: {
    name: string;
    description?: string;
  }): Promise<Team> {
    return this.fetch('/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async addMember(
    teamId: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<Team> {
    return this.fetch(`/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    });
  }

  async removeMember(teamId: string, userId: string): Promise<Team> {
    return this.fetch(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }
}

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

export class IntegrationService extends BaseService {
  async list(): Promise<Integration[]> {
    return this.fetch('/integrations');
  }

  async connect(
    type: string,
    credentials: Record<string, any>
  ): Promise<Integration> {
    return this.fetch('/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, credentials }),
    });
  }

  async disconnect(id: string): Promise<void> {
    return this.fetch(`/integrations/${id}`, { method: 'DELETE' });
  }

  async sync(id: string): Promise<Integration> {
    return this.fetch(`/integrations/${id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getUpdates(id: string): Promise<any[]> {
    return this.fetch(`/integrations/${id}/updates`);
  }
}

// ============================================================================
// ENERGY SERVICE
// ============================================================================

export class EnergyService extends BaseService {
  async getDaily(date: string): Promise<EnergyEntry[]> {
    return this.fetch(`/energy/daily?date=${date}`);
  }

  async getHistory(days: number = 30): Promise<DailyEnergySnapshot[]> {
    return this.fetch(`/energy/history?days=${days}`);
  }

  async addEntry(data: {
    source_type: string;
    source_id?: string;
    amount: number;
    description: string;
  }): Promise<EnergyEntry> {
    return this.fetch('/energy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async getSnapshot(date: string): Promise<DailyEnergySnapshot> {
    return this.fetch(`/energy/snapshot?date=${date}`);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCES
// ============================================================================

export const taskService = new TaskService();
export const goalService = new GoalService();
export const eventService = new EventService();
export const userService = new UserService();
export const teamService = new TeamService();
export const integrationService = new IntegrationService();
export const energyService = new EnergyService();

// ============================================================================
// CONVENIENCE API OBJECT
// ============================================================================

export const api = {
  tasks: taskService,
  goals: goalService,
  events: eventService,
  users: userService,
  teams: teamService,
  integrations: integrationService,
  energy: energyService,
};
