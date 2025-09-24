// Shared types across frontend and backend

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

export interface EnergyLevel {
  id: string;
  userId: string;
  level: number;
  date: string;
  notes?: string;
}

export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  userId: string;
  accountName: string;
  accountType: string;
  balance?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  content: string;
  source: string;
  extractedTasks: string[];
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  aiSchedulingEnabled: boolean;
  aiBudgetAdviceEnabled: boolean;
  aiEnergyAdaptation: boolean;
  dataSharingEnabled: boolean;
  workHoursStart: string;
  workHoursEnd: string;
  breakDuration: number;
}

// Enums
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI Agent types
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface ConversationExtraction {
  tasks: ExtractedTask[];
  events: ExtractedEvent[];
  commitments: string[];
}

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  estimatedDuration?: number;
  energyRequired?: number;
  budgetImpact?: number;
}

export interface ExtractedEvent {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  budgetImpact?: number;
}

// Dashboard types
export interface DashboardData {
  user: User;
  todayTasks: Task[];
  upcomingEvents: Event[];
  energyLevel: number;
  budgetStatus: BudgetStatus;
  achievements: Achievement[];
  streaks: Streak[];
  notifications: Notification[];
}

export interface BudgetStatus {
  totalBalance: number;
  monthlyBudget: number;
  spentThisMonth: number;
  remainingBudget: number;
  upcomingExpenses: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  type: 'overspend' | 'upcoming_expense' | 'low_balance';
  message: string;
  amount?: number;
  severity: 'low' | 'medium' | 'high';
}

// Weather and Location types
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  location: string;
  timestamp: string;
}

export interface LocationData {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  city: string;
  country: string;
}

// Analytics types
export interface ProductivityAnalytics {
  tasksCompleted: number;
  averageCompletionTime: number;
  energyEfficiency: number;
  budgetAdherence: number;
  streakCount: number;
  weeklyTrend: AnalyticsDataPoint[];
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label: string;
}
