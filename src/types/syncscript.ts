export interface User {
  id: string;
  email: string;
  name?: string;
  timezone?: string;
  energyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  energyRequired?: number;
  budgetImpact?: number;
  aiGenerated: boolean;
  extractedFrom?: string;
  scheduledAt?: string;
  completedAt?: string;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Event {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  calendarEventId?: string;
  calendarProvider?: string;
  aiGenerated: boolean;
  budgetImpact?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  read?: boolean;
  actionUrl?: string;
  metadata?: any;
  createdAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  points: number;
  unlockedAt: string;
}

export interface Streak {
  id: string;
  userId: string;
  type: string;
  count: number;
  lastDate: string;
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFERRED = 'DEFERRED'
}

export enum NotificationType {
  TASK_REMINDER = 'TASK_REMINDER',
  BUDGET_ALERT = 'BUDGET_ALERT',
  ENERGY_ADAPTATION = 'ENERGY_ADAPTATION',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  SCHEDULE_CONFLICT = 'SCHEDULE_CONFLICT',
  WEATHER_ALERT = 'WEATHER_ALERT',
  GENERAL = 'GENERAL'
}
