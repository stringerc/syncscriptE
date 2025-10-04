/**
 * Planning Core - Public API
 * 
 * This package contains the core planning domain logic:
 * - Tasks
 * - Events
 * - Scheduling
 * - Calendar integration
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'

// Task domain
export interface Task extends BaseEntity {
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  eventId?: string
  userId: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date
  eventId?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date
  completed?: boolean
}

// Event domain
export interface Event extends BaseEntity {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  isAllDay: boolean
  userId: string
  preparationTasks?: Task[]
}

export interface CreateEventRequest {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  isAllDay?: boolean
}

export interface UpdateEventRequest {
  title?: string
  description?: string
  startTime?: Date
  endTime?: Date
  location?: string
  isAllDay?: boolean
}

// Scheduling domain
export interface ScheduleConflict {
  type: 'time' | 'resource' | 'energy'
  message: string
  conflictingItems: string[]
}

export interface ScheduleRequest {
  tasks: Task[]
  events: Event[]
  constraints: {
    maxEnergyPerDay?: number
    workHours?: { start: string; end: string }
    timezone: string
  }
}

export interface ScheduleResult {
  conflicts: ScheduleConflict[]
  suggestions: string[]
  optimized: boolean
}

// Calendar integration
export interface CalendarProvider {
  id: string
  name: string
  type: 'google' | 'outlook' | 'apple'
  connected: boolean
  lastSync?: Date
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  description?: string
  provider: string
  externalId: string
}

// Domain services (interfaces only - implementations in server)
export interface TaskService {
  createTask(userId: string, request: CreateTaskRequest): Promise<Task>
  updateTask(userId: string, taskId: string, request: UpdateTaskRequest): Promise<Task>
  deleteTask(userId: string, taskId: string): Promise<void>
  getTasks(userId: string, filters?: { completed?: boolean; eventId?: string }): Promise<Task[]>
  completeTask(userId: string, taskId: string): Promise<Task>
}

export interface EventService {
  createEvent(userId: string, request: CreateEventRequest): Promise<Event>
  updateEvent(userId: string, eventId: string, request: UpdateEventRequest): Promise<Event>
  deleteEvent(userId: string, eventId: string): Promise<void>
  getEvents(userId: string, filters?: { startDate?: Date; endDate?: Date }): Promise<Event[]>
}

export interface SchedulingService {
  checkConflicts(schedule: ScheduleRequest): Promise<ScheduleResult>
  optimizeSchedule(schedule: ScheduleRequest): Promise<ScheduleResult>
  suggestTimeSlots(constraints: ScheduleRequest['constraints']): Promise<Date[]>
}

export interface CalendarService {
  getProviders(userId: string): Promise<CalendarProvider[]>
  connectProvider(userId: string, providerId: string): Promise<CalendarProvider>
  disconnectProvider(userId: string, providerId: string): Promise<void>
  syncEvents(userId: string, providerId: string): Promise<CalendarEvent[]>
}

// Domain errors
export class TaskNotFoundError extends DomainError {
  constructor(taskId: string) {
    super(`Task with id ${taskId} not found`, 'TASK_NOT_FOUND', { taskId })
  }
}

export class EventNotFoundError extends DomainError {
  constructor(eventId: string) {
    super(`Event with id ${eventId} not found`, 'EVENT_NOT_FOUND', { eventId })
  }
}

export class SchedulingConflictError extends DomainError {
  constructor(conflicts: ScheduleConflict[]) {
    super('Scheduling conflicts detected', 'SCHEDULING_CONFLICT', { conflicts })
  }
}
