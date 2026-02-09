/**
 * BACKEND-READY DATA MODEL
 * Clean, coherent, and maps 1:1 to database schema
 * No UI fluff - pure data structures
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';
export type EventRole = 'admin' | 'editor' | 'viewer';
export type IntegrationMode = 'push' | 'hybrid' | 'pull';
export type IntegrationType = 
  | 'github' 
  | 'google-calendar' 
  | 'gmail' 
  | 'notion' 
  | 'slack' 
  | 'trello' 
  | 'zoom' 
  | 'facebook-events' 
  | 'ical' 
  | 'health';
export type EnergySourceType = 'tasks' | 'goals' | 'milestones' | 'achievements' | 'health';
export type AttachmentType = 'file' | 'link';

// ============================================================================
// USER
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  timezone: string;
  working_hours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  status: UserStatus;
  custom_status?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TASK
// ============================================================================

export interface TaskAttachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  size?: number; // bytes, for files
  mime_type?: string; // for files
  created_at: Date;
}

export interface TaskMilestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: Date;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  assigned_to: string[]; // user IDs
  status: TaskStatus;
  priority: TaskPriority;
  energy_cost: number; // 1-5 scale
  is_smart: boolean; // created by AI
  tags: string[];
  due_date?: Date;
  attachments: TaskAttachment[];
  milestones: TaskMilestone[];
  subtasks: Subtask[];
  parent_task_id?: string; // for subtasks
  goal_id?: string; // linked goal
  event_id?: string; // prep for event
  team_id?: string; // team task
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  created_by: string; // user ID
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: Date;
  order: number;
}

// ============================================================================
// GOAL
// ============================================================================

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  completed: boolean;
  completed_at?: Date;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  assigned_to: string[]; // user IDs
  status: GoalStatus;
  is_smart: boolean; // created by AI
  tags: string[];
  target_date?: Date;
  progress: number; // 0-100
  attachments: TaskAttachment[]; // reuse TaskAttachment
  milestones: GoalMilestone[];
  linked_task_ids: string[]; // tasks contributing to this goal
  team_id?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  created_by: string; // user ID
}

// ============================================================================
// EVENT
// ============================================================================

export interface EventParticipant {
  user_id: string;
  role: EventRole;
  rsvp_status?: 'yes' | 'no' | 'maybe';
  joined_at: Date;
}

export interface EventTask {
  id: string;
  title: string;
  completed: boolean;
  assigned_to: string[]; // user IDs
  completed_at?: Date;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  admin_id: string; // user ID
  participants: EventParticipant[];
  is_smart: boolean; // created by Smart Event AI
  source: 'manual' | IntegrationType; // where it came from
  location?: string;
  meeting_url?: string;
  tasks: EventTask[]; // prep tasks
  attachments: TaskAttachment[];
  script_id?: string; // saved as script
  team_id?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string; // user ID
}

// ============================================================================
// ENERGY
// ============================================================================

export interface EnergyEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  source_type: EnergySourceType;
  source_id?: string; // ID of task/goal/etc that generated this
  amount: number; // can be negative for decay
  description: string;
  created_at: Date;
}

export interface DailyEnergySnapshot {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  total_energy: number;
  breakdown: {
    tasks: number;
    goals: number;
    milestones: number;
    achievements: number;
    health: number;
  };
  completions_count: number;
  created_at: Date;
}

// ============================================================================
// INTEGRATION
// ============================================================================

export interface Integration {
  id: string;
  user_id: string;
  type: IntegrationType;
  mode: IntegrationMode;
  connected: boolean;
  credentials?: Record<string, any>; // encrypted in real backend
  settings?: Record<string, any>; // integration-specific settings
  last_sync?: Date;
  sync_frequency?: number; // minutes
  has_updates: boolean;
  update_count: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TEAM
// ============================================================================

export interface TeamMember {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  admin_id: string; // primary admin
  members: TeamMember[];
  avatar?: string;
  settings?: {
    visibility: 'public' | 'private';
    join_approval_required: boolean;
  };
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// SCRIPT (reusable event template)
// ============================================================================

export interface Script {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  author_id: string;
  is_public: boolean;
  template_data: {
    duration_minutes: number;
    tasks: Omit<EventTask, 'id' | 'completed' | 'completed_at'>[];
    suggested_participants_count?: number;
    recommended_time_of_day?: string;
  };
  usage_count: number;
  rating?: number; // 0-5
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// ACHIEVEMENT (gamification)
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  requirement: {
    type: string; // "task_count", "streak_days", etc.
    target: number;
  };
  created_at: Date;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
  progress?: number; // for partial progress
}

// ============================================================================
// NOTIFICATION
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_due' | 'event_invite' | 'team_invite' | 'achievement' | 'energy_low' | 'mention';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  read_at?: Date;
  data?: Record<string, any>; // context-specific data
  created_at: Date;
}

// ============================================================================
// PREFERENCES
// ============================================================================

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  energy_display_mode: 'points' | 'aura';
  notifications_enabled: boolean;
  email_digest_enabled: boolean;
  sound_effects_enabled: boolean;
  resonance_mode_enabled: boolean;
  phase_alignment_enabled: boolean;
  language: string;
  date_format: string;
  time_format: '12h' | '24h';
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// RESONANCE DATA (ARA system)
// ============================================================================

export interface ResonanceProfile {
  id: string;
  user_id: string;
  phase_anchor_time: string; // "09:00"
  circadian_type: 'early_bird' | 'balanced' | 'night_owl';
  optimization_mode: 'conservative' | 'balanced' | 'aggressive';
  learned_patterns: {
    hour: number; // 0-23
    avg_performance: number; // 0-1
    sample_count: number;
  }[];
  updated_at: Date;
}

// ============================================================================
// ACTIVITY LOG (audit trail)
// ============================================================================

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string; // "task.completed", "goal.created", etc.
  entity_type: string; // "task", "goal", "event"
  entity_id: string;
  details?: Record<string, any>;
  created_at: Date;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type ID = string;

export interface Timestamps {
  created_at: Date;
  updated_at: Date;
}

export interface SoftDelete extends Timestamps {
  deleted_at?: Date;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Filters (for queries)
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  owner_id?: string;
  assigned_to?: string;
  team_id?: string;
  tags?: string[];
  due_before?: Date;
  due_after?: Date;
}

export interface GoalFilters {
  status?: GoalStatus[];
  owner_id?: string;
  team_id?: string;
  tags?: string[];
  target_before?: Date;
  target_after?: Date;
}

export interface EventFilters {
  start_after?: Date;
  start_before?: Date;
  source?: string;
  team_id?: string;
  participant_id?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_to?: string[];
  priority?: TaskPriority;
  energy_cost?: number;
  tags?: string[];
  due_date?: Date;
  goal_id?: string;
  event_id?: string;
  team_id?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  energy_cost?: number;
  tags?: string[];
  due_date?: Date;
  assigned_to?: string[];
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  assigned_to?: string[];
  tags?: string[];
  target_date?: Date;
  team_id?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  participants?: { user_id: string; role: EventRole }[];
  location?: string;
  meeting_url?: string;
  team_id?: string;
}

// ============================================================================
// EXPORT GROUPED TYPES
// ============================================================================

export type { 
  // Already exported inline above
};

/**
 * Type guards for runtime type checking
 */
export function isTask(entity: any): entity is Task {
  return entity && typeof entity.energy_cost === 'number' && 'status' in entity;
}

export function isGoal(entity: any): entity is Goal {
  return entity && 'progress' in entity && typeof entity.progress === 'number';
}

export function isEvent(entity: any): entity is Event {
  return entity && 'start_time' in entity && 'end_time' in entity;
}

/**
 * Default values for creating new entities
 */
export const DEFAULT_USER: Partial<User> = {
  status: 'online',
  timezone: 'America/Los_Angeles',
  working_hours: { start: '09:00', end: '17:00' },
};

export const DEFAULT_TASK: Partial<Task> = {
  status: 'todo',
  priority: 'medium',
  energy_cost: 3,
  is_smart: false,
  tags: [],
  assigned_to: [],
  attachments: [],
  milestones: [],
  subtasks: [],
};

export const DEFAULT_GOAL: Partial<Goal> = {
  status: 'not_started',
  is_smart: false,
  progress: 0,
  tags: [],
  assigned_to: [],
  attachments: [],
  milestones: [],
  linked_task_ids: [],
};

export const DEFAULT_EVENT: Partial<Event> = {
  is_smart: false,
  source: 'manual',
  participants: [],
  tasks: [],
  attachments: [],
};
