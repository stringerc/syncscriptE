/**
 * Schema Migration Utilities
 * 
 * Convert existing mock data and types to the canonical backend schema.
 * This ensures consistency across the application.
 */

import {
  Task,
  Goal,
  Event,
  User,
  TeamMember,
  ChatMessage,
  EnergyLedgerEntry,
  IntegrationConnection,
  ImportCandidate,
  TaskStatus,
  TaskPriority,
  GoalStatus,
  EnergySourceType,
  IntegrationProvider,
  IntegrationSyncMode,
  INTEGRATION_SYNC_MODES,
} from './backend-schema';

// ============================================================================
// TASK MIGRATIONS
// ============================================================================

/**
 * Convert old task format to canonical schema
 */
export function migrateTask(oldTask: any): Task {
  return {
    id: oldTask.id || `task-${Date.now()}`,
    userId: oldTask.userId || oldTask.assignedTo || 'current-user',
    title: oldTask.title || oldTask.name || '',
    description: oldTask.description || oldTask.desc || undefined,
    status: normalizeTaskStatus(oldTask.status),
    priority: normalizeTaskPriority(oldTask.priority),
    dueAt: oldTask.dueDate || oldTask.dueAt ? new Date(oldTask.dueDate || oldTask.dueAt) : undefined,
    locationText: oldTask.location || oldTask.locationText || undefined,
    energyTag: oldTask.energyTag || oldTask.energyLevel || undefined,
    isSmart: oldTask.isSmart || false,
    resourcesCountFiles: oldTask.attachments?.filter((a: any) => a.type === 'file').length || 0,
    resourcesCountLinks: oldTask.attachments?.filter((a: any) => a.type === 'link').length || 0,
  };
}

function normalizeTaskStatus(status: any): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'todo': 'todo',
    'pending': 'todo',
    'not_started': 'todo',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'active': 'in_progress',
    'completed': 'completed',
    'done': 'completed',
    'blocked': 'blocked',
    'on_hold': 'blocked',
  };
  return statusMap[status?.toLowerCase()] || 'todo';
}

function normalizeTaskPriority(priority: any): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    'low': 'low',
    'p3': 'low',
    'medium': 'medium',
    'p2': 'medium',
    'high': 'high',
    'p1': 'high',
    'urgent': 'high',
  };
  return priorityMap[priority?.toLowerCase()] || 'medium';
}

// ============================================================================
// GOAL MIGRATIONS
// ============================================================================

/**
 * Convert old goal format to canonical schema
 */
export function migrateGoal(oldGoal: any): Goal {
  return {
    id: oldGoal.id || `goal-${Date.now()}`,
    userId: oldGoal.userId || oldGoal.owner || 'current-user',
    title: oldGoal.title || oldGoal.name || '',
    description: oldGoal.description || oldGoal.desc || undefined,
    status: normalizeGoalStatus(oldGoal.status),
    isSmart: oldGoal.isSmart || false,
    resourcesCountFiles: oldGoal.attachments?.filter((a: any) => a.type === 'file').length || 0,
    resourcesCountLinks: oldGoal.attachments?.filter((a: any) => a.type === 'link').length || 0,
  };
}

function normalizeGoalStatus(status: any): GoalStatus {
  const statusMap: Record<string, GoalStatus> = {
    'not_started': 'not_started',
    'pending': 'not_started',
    'todo': 'not_started',
    'in_progress': 'in_progress',
    'in-progress': 'in_progress',
    'active': 'in_progress',
    'completed': 'completed',
    'done': 'completed',
    'achieved': 'completed',
    'on_hold': 'on_hold',
    'blocked': 'on_hold',
  };
  return statusMap[status?.toLowerCase()] || 'not_started';
}

// ============================================================================
// EVENT MIGRATIONS
// ============================================================================

/**
 * Convert old event format to canonical schema
 */
export function migrateEvent(oldEvent: any): Event {
  return {
    id: oldEvent.id || `event-${Date.now()}`,
    calendarId: oldEvent.calendarId || 'default',
    title: oldEvent.title || oldEvent.name || '',
    startAt: oldEvent.startTime || oldEvent.startAt ? new Date(oldEvent.startTime || oldEvent.startAt) : new Date(),
    endAt: oldEvent.endTime || oldEvent.endAt ? new Date(oldEvent.endTime || oldEvent.endAt) : new Date(),
    location: oldEvent.location || undefined,
    description: oldEvent.description || undefined,
    adminUserId: oldEvent.createdBy || oldEvent.adminUserId || 'current-user',
    tags: oldEvent.tags || oldEvent.labels || [],
  };
}

// ============================================================================
// USER MIGRATIONS
// ============================================================================

/**
 * Convert old user/member format to canonical schema
 */
export function migrateUser(oldUser: any): User {
  return {
    id: oldUser.id || oldUser.userId || `user-${Date.now()}`,
    email: oldUser.email || `${oldUser.id}@syncscript.com`,
    displayName: oldUser.name || oldUser.displayName || 'Unknown User',
    handle: oldUser.handle || oldUser.username || generateHandle(oldUser.name || oldUser.displayName),
    avatarUrl: oldUser.avatar || oldUser.avatarUrl || oldUser.image || generateAvatarUrl(oldUser.name),
    status: normalizeUserStatus(oldUser.status),
    customStatusText: oldUser.customStatusText || oldUser.statusMessage || undefined,
    preferences: {
      themeMode: oldUser.preferences?.themeMode || 'dark',
      themeColor: oldUser.preferences?.themeColor || 'teal',
      fontScale: oldUser.preferences?.fontScale || 'medium',
      energyDisplayMode: oldUser.preferences?.energyDisplayMode || 'points',
      notificationsEnabled: oldUser.preferences?.notificationsEnabled ?? true,
    },
    tutorialState: oldUser.tutorialState || {
      dashboardSeen: false,
      tasksSeen: false,
      calendarSeen: false,
      energySeen: false,
      teamSeen: false,
      analyticsSeen: false,
      gamingSeen: false,
      integrationsSeen: false,
    },
  };
}

function normalizeUserStatus(status: any) {
  const statusMap: Record<string, 'online' | 'away' | 'busy' | 'offline'> = {
    'online': 'online',
    'active': 'online',
    'away': 'away',
    'idle': 'away',
    'busy': 'busy',
    'dnd': 'busy',
    'offline': 'offline',
    'invisible': 'offline',
  };
  return statusMap[status?.toLowerCase()] || 'online';
}

function generateHandle(name?: string): string {
  if (!name) return `user${Date.now()}`;
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function generateAvatarUrl(name?: string): string {
  const seed = name || 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// ============================================================================
// ENERGY MIGRATIONS
// ============================================================================

/**
 * Convert energy action to ledger entry
 */
export function createEnergyLedgerEntry(
  userId: string,
  sourceType: EnergySourceType,
  pointsDelta: number,
  sourceId?: string
): EnergyLedgerEntry {
  const colorCategoryMap: Record<EnergySourceType, any> = {
    'task': 'tasks',
    'goal': 'goals',
    'milestone': 'milestones',
    'achievement': 'achievements',
    'health': 'health',
    'decay': undefined,
  };

  return {
    id: `energy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    dateTime: new Date(),
    sourceType,
    sourceId,
    pointsDelta,
    colorCategory: colorCategoryMap[sourceType],
  };
}

// ============================================================================
// INTEGRATION MIGRATIONS
// ============================================================================

/**
 * Convert old integration connection to canonical schema
 */
export function migrateIntegrationConnection(oldConnection: any): IntegrationConnection {
  const provider = normalizeProvider(oldConnection.provider || oldConnection.name || oldConnection.id);
  
  return {
    id: oldConnection.id || `integration-${Date.now()}`,
    userId: oldConnection.userId || 'current-user',
    provider,
    authState: normalizeAuthState(oldConnection.status || oldConnection.authState),
    syncMode: INTEGRATION_SYNC_MODES[provider],
    lastSyncAt: oldConnection.lastSync || oldConnection.lastSyncAt ? new Date(oldConnection.lastSync || oldConnection.lastSyncAt) : undefined,
  };
}

function normalizeProvider(provider: string): IntegrationProvider {
  const providerMap: Record<string, IntegrationProvider> = {
    'google-calendar': 'google_calendar',
    'google_calendar': 'google_calendar',
    'googlecalendar': 'google_calendar',
    'gmail': 'gmail',
    'notion': 'notion',
    'trello': 'trello',
    'github': 'github',
    'slack': 'slack',
    'zoom': 'zoom',
    'todoist': 'todoist',
    'asana': 'asana',
    'jira': 'jira',
    'linear': 'linear',
    'apple-calendar': 'apple_calendar',
    'apple_calendar': 'apple_calendar',
    'applecalendar': 'apple_calendar',
    'outlook': 'outlook',
  };
  return providerMap[provider?.toLowerCase()] || 'gmail';
}

function normalizeAuthState(state: any) {
  const stateMap: Record<string, 'connected' | 'expired' | 'disconnected'> = {
    'connected': 'connected',
    'active': 'connected',
    'authorized': 'connected',
    'expired': 'expired',
    'needs_reauth': 'expired',
    'disconnected': 'disconnected',
    'inactive': 'disconnected',
  };
  return stateMap[state?.toLowerCase()] || 'connected';
}

/**
 * Create import candidate from external data
 */
export function createImportCandidate(
  userId: string,
  provider: IntegrationProvider,
  kind: 'task' | 'event' | 'message' | 'health',
  externalData: any
): ImportCandidate {
  const syncMode = INTEGRATION_SYNC_MODES[provider];
  const requiresUserAction = syncMode === 'push' || syncMode === 'hybrid';

  return {
    id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    provider,
    kind,
    externalId: externalData.id || externalData.externalId || `ext-${Date.now()}`,
    title: externalData.title || externalData.name || externalData.summary || 'Untitled',
    previewJson: externalData,
    detectedAt: new Date(),
    requiresUserAction,
  };
}

// ============================================================================
// BATCH MIGRATIONS
// ============================================================================

/**
 * Migrate all tasks in an array
 */
export function migrateTasks(tasks: any[]): Task[] {
  return tasks.map(migrateTask);
}

/**
 * Migrate all goals in an array
 */
export function migrateGoals(goals: any[]): Goal[] {
  return goals.map(migrateGoal);
}

/**
 * Migrate all events in an array
 */
export function migrateEvents(events: any[]): Event[] {
  return events.map(migrateEvent);
}

/**
 * Migrate all users in an array
 */
export function migrateUsers(users: any[]): User[] {
  return users.map(migrateUser);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate task against schema
 */
export function validateTask(task: Task): boolean {
  return !!(
    task.id &&
    task.userId &&
    task.title &&
    task.status &&
    task.priority &&
    typeof task.isSmart === 'boolean' &&
    typeof task.resourcesCountFiles === 'number' &&
    typeof task.resourcesCountLinks === 'number'
  );
}

/**
 * Validate goal against schema
 */
export function validateGoal(goal: Goal): boolean {
  return !!(
    goal.id &&
    goal.userId &&
    goal.title &&
    goal.status &&
    typeof goal.isSmart === 'boolean' &&
    typeof goal.resourcesCountFiles === 'number' &&
    typeof goal.resourcesCountLinks === 'number'
  );
}

/**
 * Validate event against schema
 */
export function validateEvent(event: Event): boolean {
  return !!(
    event.id &&
    event.calendarId &&
    event.title &&
    event.startAt &&
    event.endAt &&
    event.adminUserId &&
    Array.isArray(event.tags)
  );
}

/**
 * Validate user against schema
 */
export function validateUser(user: User): boolean {
  return !!(
    user.id &&
    user.email &&
    user.displayName &&
    user.handle &&
    user.avatarUrl &&
    user.status &&
    user.preferences &&
    user.tutorialState
  );
}
