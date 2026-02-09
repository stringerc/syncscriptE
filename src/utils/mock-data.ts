/**
 * DATA FACTORY
 * Generates mock data that follows the exact backend data model
 * Mock data maps 1:1 to real data structure
 */

import {
  User,
  Task,
  Goal,
  Event,
  Team,
  Integration,
  EnergyEntry,
  DailyEnergySnapshot,
  Script,
  Achievement,
  UserAchievement,
  Notification,
  UserPreferences,
  ResonanceProfile,
  ActivityLog,
  TaskAttachment,
  EventParticipant,
} from '../types/data-model';

// ============================================================================
// ID GENERATORS
// ============================================================================

let idCounter = 1000;

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${idCounter++}`;
}

// ============================================================================
// USERS
// ============================================================================

export const MOCK_USERS: User[] = [
  {
    id: 'user_001',
    name: 'Jordan Smith',
    email: 'jordan.smith@syncscript.ai',
    avatar: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTQ5MzEyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    bio: 'Product Manager | SyncScript enthusiast',
    timezone: 'America/Los_Angeles',
    working_hours: { start: '09:00', end: '17:30' },
    status: 'online',
    custom_status: '🎵 In the zone',
    created_at: new Date('2024-01-15'),
    updated_at: new Date(),
  },
  {
    id: 'user_002',
    name: 'Sarah Chen',
    email: 'sarah.chen@syncscript.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    bio: 'Designer & Creative',
    timezone: 'America/New_York',
    working_hours: { start: '08:00', end: '16:00' },
    status: 'online',
    created_at: new Date('2024-02-01'),
    updated_at: new Date(),
  },
  {
    id: 'user_003',
    name: 'Marcus Johnson',
    email: 'marcus.j@syncscript.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    bio: 'Engineering Lead',
    timezone: 'America/Chicago',
    working_hours: { start: '10:00', end: '18:00' },
    status: 'away',
    custom_status: '☕ Coffee break',
    created_at: new Date('2024-01-20'),
    updated_at: new Date(),
  },
  {
    id: 'user_004',
    name: 'Elena Rodriguez',
    email: 'elena.r@syncscript.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    bio: 'Marketing Specialist',
    timezone: 'America/Los_Angeles',
    working_hours: { start: '09:00', end: '17:00' },
    status: 'busy',
    custom_status: '📞 In meeting',
    created_at: new Date('2024-03-01'),
    updated_at: new Date(),
  },
  {
    id: 'user_005',
    name: 'David Kim',
    email: 'david.kim@syncscript.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    bio: 'Developer',
    timezone: 'America/Los_Angeles',
    working_hours: { start: '11:00', end: '19:00' },
    status: 'online',
    created_at: new Date('2024-02-15'),
    updated_at: new Date(),
  },
];

export const CURRENT_USER = MOCK_USERS[0];

// ============================================================================
// TASKS
// ============================================================================

export function createMockTask(overrides?: Partial<Task>): Task {
  const now = new Date();
  return {
    id: generateId('task'),
    title: 'Sample Task',
    description: 'Task description',
    owner_id: CURRENT_USER.id,
    assigned_to: [CURRENT_USER.id],
    status: 'todo',
    priority: 'medium',
    energy_cost: 3,
    is_smart: false,
    tags: [],
    attachments: [],
    milestones: [],
    subtasks: [],
    created_at: now,
    updated_at: now,
    created_by: CURRENT_USER.id,
    ...overrides,
  };
}

export const MOCK_TASKS: Task[] = [
  createMockTask({
    id: 'task_001',
    title: 'Review Q4 Marketing Strategy',
    description: 'Analyze performance metrics and plan for next quarter',
    status: 'in_progress',
    priority: 'high',
    energy_cost: 4,
    tags: ['marketing', 'strategy'],
    due_date: new Date('2025-12-28'),
    assigned_to: [CURRENT_USER.id, 'user_004'],
  }),
  createMockTask({
    id: 'task_002',
    title: 'Update Design System Documentation',
    description: 'Document new components and usage guidelines',
    status: 'todo',
    priority: 'medium',
    energy_cost: 3,
    tags: ['design', 'documentation'],
    due_date: new Date('2025-12-30'),
    assigned_to: ['user_002'],
  }),
  createMockTask({
    id: 'task_003',
    title: 'Fix Authentication Bug',
    description: 'Users reporting intermittent login issues',
    status: 'in_progress',
    priority: 'urgent',
    energy_cost: 5,
    tags: ['bug', 'urgent'],
    due_date: new Date('2025-12-23'),
    assigned_to: ['user_005'],
  }),
];

// ============================================================================
// GOALS
// ============================================================================

export function createMockGoal(overrides?: Partial<Goal>): Goal {
  const now = new Date();
  return {
    id: generateId('goal'),
    title: 'Sample Goal',
    description: 'Goal description',
    owner_id: CURRENT_USER.id,
    assigned_to: [CURRENT_USER.id],
    status: 'in_progress',
    is_smart: false,
    tags: [],
    progress: 0,
    attachments: [],
    milestones: [],
    linked_task_ids: [],
    created_at: now,
    updated_at: now,
    created_by: CURRENT_USER.id,
    ...overrides,
  };
}

export const MOCK_GOALS: Goal[] = [
  createMockGoal({
    id: 'goal_001',
    title: 'Launch New Product Feature',
    description: 'Complete development and rollout of collaborative workspace feature',
    status: 'in_progress',
    progress: 65,
    tags: ['product', 'milestone'],
    target_date: new Date('2026-01-31'),
    assigned_to: [CURRENT_USER.id, 'user_002', 'user_005'],
    milestones: [
      {
        id: 'milestone_001',
        title: 'Complete Design Phase',
        completed: true,
        completed_at: new Date('2025-11-15'),
        order: 1,
      },
      {
        id: 'milestone_002',
        title: 'Backend Implementation',
        completed: true,
        completed_at: new Date('2025-12-01'),
        order: 2,
      },
      {
        id: 'milestone_003',
        title: 'Frontend Development',
        completed: false,
        order: 3,
      },
    ],
  }),
  createMockGoal({
    id: 'goal_002',
    title: 'Improve Team Productivity by 20%',
    description: 'Implement and measure productivity improvements across the team',
    status: 'in_progress',
    progress: 45,
    tags: ['productivity', 'team'],
    target_date: new Date('2026-03-31'),
    assigned_to: [CURRENT_USER.id, 'user_003'],
  }),
];

// ============================================================================
// EVENTS
// ============================================================================

export function createMockEvent(overrides?: Partial<Event>): Event {
  const now = new Date();
  return {
    id: generateId('event'),
    title: 'Sample Event',
    start_time: now,
    end_time: new Date(now.getTime() + 60 * 60 * 1000),
    admin_id: CURRENT_USER.id,
    participants: [],
    is_smart: false,
    source: 'manual',
    tasks: [],
    attachments: [],
    created_at: now,
    updated_at: now,
    created_by: CURRENT_USER.id,
    ...overrides,
  };
}

export const MOCK_EVENTS: Event[] = [
  createMockEvent({
    id: 'event_001',
    title: 'Q4 Planning Session',
    description: 'Strategic planning for Q4 objectives',
    start_time: new Date('2025-12-23T09:00:00'),
    end_time: new Date('2025-12-23T10:30:00'),
    participants: [
      { user_id: CURRENT_USER.id, role: 'admin', rsvp_status: 'yes', joined_at: new Date() },
      { user_id: 'user_002', role: 'editor', rsvp_status: 'yes', joined_at: new Date() },
      { user_id: 'user_003', role: 'editor', rsvp_status: 'maybe', joined_at: new Date() },
    ],
    meeting_url: 'https://zoom.us/j/123456789',
  }),
  createMockEvent({
    id: 'event_002',
    title: 'Design Review',
    start_time: new Date('2025-12-24T14:00:00'),
    end_time: new Date('2025-12-24T15:00:00'),
    participants: [
      { user_id: 'user_002', role: 'admin', rsvp_status: 'yes', joined_at: new Date() },
      { user_id: CURRENT_USER.id, role: 'viewer', rsvp_status: 'yes', joined_at: new Date() },
    ],
  }),
];

// ============================================================================
// TEAMS
// ============================================================================

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_001',
    name: 'Product Team',
    description: 'Cross-functional product development team',
    admin_id: CURRENT_USER.id,
    members: [
      { user_id: CURRENT_USER.id, role: 'admin', joined_at: new Date('2024-01-15') },
      { user_id: 'user_002', role: 'member', joined_at: new Date('2024-02-01') },
      { user_id: 'user_005', role: 'member', joined_at: new Date('2024-02-15') },
    ],
    settings: {
      visibility: 'private',
      join_approval_required: true,
    },
    created_at: new Date('2024-01-15'),
    updated_at: new Date(),
  },
  {
    id: 'team_002',
    name: 'Engineering',
    description: 'Software development team',
    admin_id: 'user_003',
    members: [
      { user_id: 'user_003', role: 'admin', joined_at: new Date('2024-01-20') },
      { user_id: 'user_005', role: 'member', joined_at: new Date('2024-02-15') },
      { user_id: CURRENT_USER.id, role: 'member', joined_at: new Date('2024-03-01') },
    ],
    settings: {
      visibility: 'private',
      join_approval_required: true,
    },
    created_at: new Date('2024-01-20'),
    updated_at: new Date(),
  },
];

// ============================================================================
// INTEGRATIONS
// ============================================================================

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'int_001',
    user_id: CURRENT_USER.id,
    type: 'github',
    mode: 'push',
    connected: true,
    last_sync: new Date('2025-12-22T10:30:00'),
    sync_frequency: 30,
    has_updates: true,
    update_count: 3,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2025-12-22T10:30:00'),
  },
  {
    id: 'int_002',
    user_id: CURRENT_USER.id,
    type: 'google-calendar',
    mode: 'hybrid',
    connected: true,
    last_sync: new Date('2025-12-22T09:00:00'),
    sync_frequency: 15,
    has_updates: false,
    update_count: 0,
    created_at: new Date('2024-03-15'),
    updated_at: new Date('2025-12-22T09:00:00'),
  },
  {
    id: 'int_003',
    user_id: CURRENT_USER.id,
    type: 'notion',
    mode: 'hybrid',
    connected: true,
    last_sync: new Date('2025-12-22T08:45:00'),
    sync_frequency: 60,
    has_updates: true,
    update_count: 5,
    created_at: new Date('2024-04-01'),
    updated_at: new Date('2025-12-22T08:45:00'),
  },
];

// ============================================================================
// ENERGY ENTRIES
// ============================================================================

export function createMockEnergyEntry(overrides?: Partial<EnergyEntry>): EnergyEntry {
  return {
    id: generateId('energy'),
    user_id: CURRENT_USER.id,
    date: new Date().toISOString().split('T')[0],
    source_type: 'tasks',
    amount: 10,
    description: 'Energy entry',
    created_at: new Date(),
    ...overrides,
  };
}

export const MOCK_ENERGY_ENTRIES: EnergyEntry[] = [
  createMockEnergyEntry({
    id: 'energy_001',
    date: '2025-12-22',
    source_type: 'tasks',
    source_id: 'task_001',
    amount: 15,
    description: 'Completed high-priority task',
  }),
  createMockEnergyEntry({
    id: 'energy_002',
    date: '2025-12-22',
    source_type: 'goals',
    source_id: 'goal_001',
    amount: 20,
    description: 'Progress on goal milestone',
  }),
];

export const MOCK_ENERGY_SNAPSHOTS: DailyEnergySnapshot[] = [
  {
    id: 'snapshot_001',
    user_id: CURRENT_USER.id,
    date: '2025-12-21',
    total_energy: 120,
    breakdown: { tasks: 40, goals: 35, milestones: 20, achievements: 15, health: 10 },
    completions_count: 12,
    created_at: new Date('2025-12-21T23:59:59'),
  },
  {
    id: 'snapshot_002',
    user_id: CURRENT_USER.id,
    date: '2025-12-20',
    total_energy: 105,
    breakdown: { tasks: 35, goals: 30, milestones: 15, achievements: 15, health: 10 },
    completions_count: 10,
    created_at: new Date('2025-12-20T23:59:59'),
  },
];

// ============================================================================
// USER PREFERENCES
// ============================================================================

export const MOCK_USER_PREFERENCES: UserPreferences = {
  id: 'pref_001',
  user_id: CURRENT_USER.id,
  theme: 'dark',
  energy_display_mode: 'points',
  notifications_enabled: true,
  email_digest_enabled: true,
  sound_effects_enabled: true,
  resonance_mode_enabled: true,
  phase_alignment_enabled: true,
  language: 'en',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  created_at: new Date('2024-01-15'),
  updated_at: new Date(),
};

// ============================================================================
// RESONANCE PROFILE
// ============================================================================

export const MOCK_RESONANCE_PROFILE: ResonanceProfile = {
  id: 'res_001',
  user_id: CURRENT_USER.id,
  phase_anchor_time: '09:00',
  circadian_type: 'balanced',
  optimization_mode: 'balanced',
  learned_patterns: [
    { hour: 9, avg_performance: 0.85, sample_count: 45 },
    { hour: 10, avg_performance: 0.92, sample_count: 50 },
    { hour: 11, avg_performance: 0.88, sample_count: 48 },
    { hour: 14, avg_performance: 0.65, sample_count: 40 },
    { hour: 15, avg_performance: 0.78, sample_count: 42 },
  ],
  updated_at: new Date(),
};

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_001',
    title: 'Early Bird',
    description: 'Complete 10 tasks before 9 AM',
    icon: '🌅',
    category: 'productivity',
    points: 50,
    requirement: { type: 'early_tasks', target: 10 },
    created_at: new Date('2024-01-01'),
  },
  {
    id: 'ach_002',
    title: 'Streak Master',
    description: 'Maintain a 7-day completion streak',
    icon: '🔥',
    category: 'consistency',
    points: 100,
    requirement: { type: 'streak_days', target: 7 },
    created_at: new Date('2024-01-01'),
  },
];

export const MOCK_USER_ACHIEVEMENTS: UserAchievement[] = [
  {
    id: 'uach_001',
    user_id: CURRENT_USER.id,
    achievement_id: 'ach_001',
    unlocked_at: new Date('2025-12-15'),
    progress: 100,
  },
];

// ============================================================================
// EXPORT ALL
// ============================================================================

export const MOCK_DATA = {
  users: MOCK_USERS,
  currentUser: CURRENT_USER,
  tasks: MOCK_TASKS,
  goals: MOCK_GOALS,
  events: MOCK_EVENTS,
  teams: MOCK_TEAMS,
  integrations: MOCK_INTEGRATIONS,
  energyEntries: MOCK_ENERGY_ENTRIES,
  energySnapshots: MOCK_ENERGY_SNAPSHOTS,
  preferences: MOCK_USER_PREFERENCES,
  resonanceProfile: MOCK_RESONANCE_PROFILE,
  achievements: MOCK_ACHIEVEMENTS,
  userAchievements: MOCK_USER_ACHIEVEMENTS,
};