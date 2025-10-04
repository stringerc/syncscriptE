/**
 * Central Event Registry
 * 
 * This file defines all events that can be emitted and consumed
 * across bounded contexts in SyncScript. Events are the primary
 * mechanism for loose coupling between contexts.
 * 
 * Each event includes:
 * - Event type (string identifier)
 * - Event data schema (TypeScript interface)
 * - Context that emits the event
 * - Contexts that can consume the event
 * - Event version for backward compatibility
 */

// ============================================================================
// USER & AUTHENTICATION EVENTS
// ============================================================================

export interface UserCreatedEvent {
  type: 'user.created'
  version: '1.0'
  data: {
    userId: string
    email: string
    name: string
    timezone: string
    createdAt: string
  }
  metadata: {
    emittedBy: 'identity-access'
    timestamp: string
    idempotencyKey: string
  }
}

export interface UserUpdatedEvent {
  type: 'user.updated'
  version: '1.0'
  data: {
    userId: string
    changes: {
      name?: string
      timezone?: string
      avatar?: string
      currentLocation?: string
      homeLocation?: string
      workLocation?: string
      showHolidays?: boolean
    }
    updatedAt: string
  }
  metadata: {
    emittedBy: 'identity-access'
    timestamp: string
    idempotencyKey: string
  }
}

export interface UserDeletedEvent {
  type: 'user.deleted'
  version: '1.0'
  data: {
    userId: string
    deletedAt: string
  }
  metadata: {
    emittedBy: 'identity-access'
    timestamp: string
    idempotencyKey: string
  }
}

export interface FeatureFlagChangedEvent {
  type: 'feature_flag.changed'
  version: '1.0'
  data: {
    userId: string
    flags: Record<string, boolean>
    changedAt: string
  }
  metadata: {
    emittedBy: 'identity-access'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// TASK & EVENT EVENTS
// ============================================================================

export interface TaskCreatedEvent {
  type: 'task.created'
  version: '1.0'
  data: {
    taskId: string
    userId: string
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
    eventId?: string
    energyRequired?: number
    createdAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface TaskUpdatedEvent {
  type: 'task.updated'
  version: '1.0'
  data: {
    taskId: string
    userId: string
    changes: {
      title?: string
      description?: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
      status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
      dueDate?: string
      estimatedDuration?: number
      actualDuration?: number
      energyRequired?: number
      budgetImpact?: number
      location?: string
      type?: string
      tags?: string
      eventId?: string
    }
    updatedAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface TaskCompletedEvent {
  type: 'task.completed'
  version: '1.0'
  data: {
    taskId: string
    userId: string
    title: string
    completedAt: string
    actualDuration?: number
    energyRequired?: number
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface TaskDeletedEvent {
  type: 'task.deleted'
  version: '1.0'
  data: {
    taskId: string
    userId: string
    deletedAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface EventCreatedEvent {
  type: 'event.created'
  version: '1.0'
  data: {
    eventId: string
    userId: string
    title: string
    startTime: string
    endTime: string
    location?: string
    isAllDay: boolean
    createdAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface EventUpdatedEvent {
  type: 'event.updated'
  version: '1.0'
  data: {
    eventId: string
    userId: string
    changes: {
      title?: string
      description?: string
      startTime?: string
      endTime?: string
      location?: string
      isAllDay?: boolean
      budgetImpact?: number
    }
    updatedAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

export interface EventDeletedEvent {
  type: 'event.deleted'
  version: '1.0'
  data: {
    eventId: string
    userId: string
    deletedAt: string
  }
  metadata: {
    emittedBy: 'planning-core'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// SCRIPT & TEMPLATE EVENTS
// ============================================================================

export interface ScriptAppliedEvent {
  type: 'script.applied'
  version: '1.0'
  data: {
    scriptId: string
    userId: string
    eventId: string
    scriptVersion: number
    appliedAt: string
    generatedTasks: string[]
    generatedEvents: string[]
  }
  metadata: {
    emittedBy: 'scripts'
    timestamp: string
    idempotencyKey: string
  }
}

export interface TemplateUsedEvent {
  type: 'template.used'
  version: '1.0'
  data: {
    templateId: string
    userId: string
    eventId: string
    usedAt: string
  }
  metadata: {
    emittedBy: 'scripts'
    timestamp: string
    idempotencyKey: string
  }
}

export interface ScriptCreatedEvent {
  type: 'script.created'
  version: '1.0'
  data: {
    scriptId: string
    userId: string
    title: string
    category?: string
    isPublic: boolean
    createdAt: string
  }
  metadata: {
    emittedBy: 'scripts'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// CALENDAR SYNC EVENTS
// ============================================================================

export interface CalendarSyncedEvent {
  type: 'calendar.synced'
  version: '1.0'
  data: {
    userId: string
    provider: 'google' | 'outlook' | 'apple'
    accountId: string
    syncedAt: string
    eventsAdded: number
    eventsUpdated: number
    eventsDeleted: number
  }
  metadata: {
    emittedBy: 'scheduling-sync'
    timestamp: string
    idempotencyKey: string
  }
}

export interface CalendarConflictDetectedEvent {
  type: 'calendar.conflict_detected'
  version: '1.0'
  data: {
    userId: string
    eventId: string
    conflictingEventId: string
    conflictType: 'time_overlap' | 'location_conflict' | 'resource_conflict'
    detectedAt: string
  }
  metadata: {
    emittedBy: 'scheduling-sync'
    timestamp: string
    idempotencyKey: string
  }
}

export interface CalendarIntegrationAddedEvent {
  type: 'calendar.integration_added'
  version: '1.0'
  data: {
    userId: string
    provider: 'google' | 'outlook' | 'apple'
    accountId: string
    email?: string
    addedAt: string
  }
  metadata: {
    emittedBy: 'scheduling-sync'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// BUDGET & FINANCIAL EVENTS
// ============================================================================

export interface BudgetCreatedEvent {
  type: 'budget.created'
  version: '1.0'
  data: {
    budgetId: string
    userId: string
    name: string
    totalBudget: number
    period: 'WEEKLY' | 'MONTHLY' | 'ANNUAL'
    createdAt: string
  }
  metadata: {
    emittedBy: 'budgeting'
    timestamp: string
    idempotencyKey: string
  }
}

export interface BudgetUpdatedEvent {
  type: 'budget.updated'
  version: '1.0'
  data: {
    budgetId: string
    userId: string
    changes: {
      name?: string
      totalBudget?: number
      period?: 'WEEKLY' | 'MONTHLY' | 'ANNUAL'
      rolloverEnabled?: boolean
    }
    updatedAt: string
  }
  metadata: {
    emittedBy: 'budgeting'
    timestamp: string
    idempotencyKey: string
  }
}

export interface BudgetAlertTriggeredEvent {
  type: 'budget.alert_triggered'
  version: '1.0'
  data: {
    budgetId: string
    userId: string
    alertType: 'OVERSPEND' | 'APPROACHING_LIMIT' | 'LOW_BALANCE' | 'UNUSUAL_SPENDING' | 'BILL_DUE'
    threshold: number
    currentAmount: number
    categoryName?: string
    triggeredAt: string
  }
  metadata: {
    emittedBy: 'budgeting'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// ENERGY & GAMIFICATION EVENTS
// ============================================================================

export interface EnergyEarnedEvent {
  type: 'energy.earned'
  version: '1.0'
  data: {
    userId: string
    amount: number
    source: 'task_completion' | 'challenge_completion' | 'achievement' | 'event_completion'
    domain?: 'body' | 'mind' | 'social' | 'order' | 'finance' | 'outdoors' | 'rest'
    description?: string
    earnedAt: string
  }
  metadata: {
    emittedBy: 'gamification'
    timestamp: string
    idempotencyKey: string
  }
}

export interface AchievementUnlockedEvent {
  type: 'achievement.unlocked'
  version: '1.0'
  data: {
    userId: string
    achievementId: string
    title: string
    description: string
    points: number
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    category?: string
    domain?: 'body' | 'mind' | 'social' | 'order' | 'finance' | 'outdoors' | 'rest'
    unlockedAt: string
  }
  metadata: {
    emittedBy: 'gamification'
    timestamp: string
    idempotencyKey: string
  }
}

export interface ChallengeCompletedEvent {
  type: 'challenge.completed'
  version: '1.0'
  data: {
    userId: string
    challengeId: string
    title: string
    domain: 'body' | 'mind' | 'social' | 'order' | 'finance' | 'outdoors' | 'rest'
    epReward: number
    completedAt: string
  }
  metadata: {
    emittedBy: 'gamification'
    timestamp: string
    idempotencyKey: string
  }
}

export interface EnergyResetEvent {
  type: 'energy.reset'
  version: '1.0'
  data: {
    userId: string
    finalEP: number
    finalEnergy: number
    resetAt: string
  }
  metadata: {
    emittedBy: 'gamification'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// COLLABORATION EVENTS
// ============================================================================

export interface FriendshipRequestedEvent {
  type: 'friendship.requested'
  version: '1.0'
  data: {
    requesterId: string
    addresseeId: string
    message?: string
    requestedAt: string
  }
  metadata: {
    emittedBy: 'collaboration'
    timestamp: string
    idempotencyKey: string
  }
}

export interface FriendshipAcceptedEvent {
  type: 'friendship.accepted'
  version: '1.0'
  data: {
    requesterId: string
    addresseeId: string
    acceptedAt: string
  }
  metadata: {
    emittedBy: 'collaboration'
    timestamp: string
    idempotencyKey: string
  }
}

export interface PrivacyChangedEvent {
  type: 'privacy.changed'
  version: '1.0'
  data: {
    userId: string
    changes: {
      hideMyEmblems?: boolean
      hideLastActive?: boolean
    }
    changedAt: string
  }
  metadata: {
    emittedBy: 'collaboration'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// EXPORT EVENTS
// ============================================================================

export interface ExportStartedEvent {
  type: 'export.started'
  version: '1.0'
  data: {
    exportJobId: string
    userId: string
    exportType: 'pdf' | 'docx' | 'pptx' | 'csv' | 'xlsx' | 'ics' | 'html' | 'json'
    scope: {
      type: 'project' | 'event' | 'script' | 'task'
      id: string
      range?: string
    }
    audiencePreset: 'owner' | 'team' | 'vendor' | 'attendee' | 'personal'
    startedAt: string
  }
  metadata: {
    emittedBy: 'exports'
    timestamp: string
    idempotencyKey: string
  }
}

export interface ExportCompletedEvent {
  type: 'export.completed'
  version: '1.0'
  data: {
    exportJobId: string
    userId: string
    downloadUrl: string
    shareUrl?: string
    sharePasscode?: string
    expiresAt?: string
    actualSize: number
    completedAt: string
  }
  metadata: {
    emittedBy: 'exports'
    timestamp: string
    idempotencyKey: string
  }
}

export interface ExportFailedEvent {
  type: 'export.failed'
  version: '1.0'
  data: {
    exportJobId: string
    userId: string
    error: string
    failedAt: string
  }
  metadata: {
    emittedBy: 'exports'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// SEARCH & AI EVENTS
// ============================================================================

export interface SearchPerformedEvent {
  type: 'search.performed'
  version: '1.0'
  data: {
    userId: string
    query: string
    results: number
    searchTime: number
    performedAt: string
  }
  metadata: {
    emittedBy: 'search-ai'
    timestamp: string
    idempotencyKey: string
  }
}

export interface AISuggestionShownEvent {
  type: 'ai.suggestion_shown'
  version: '1.0'
  data: {
    userId: string
    suggestionType: 'task' | 'event' | 'template' | 'budget'
    context: string
    shownAt: string
  }
  metadata: {
    emittedBy: 'search-ai'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// NOTIFICATION EVENTS
// ============================================================================

export interface NotificationSentEvent {
  type: 'notification.sent'
  version: '1.0'
  data: {
    notificationId: string
    userId: string
    type: string
    title: string
    message: string
    channels: string[]
    sentAt: string
  }
  metadata: {
    emittedBy: 'shared-kernel'
    timestamp: string
    idempotencyKey: string
  }
}

export interface ResourceAddedEvent {
  type: 'resource.added'
  version: '1.0'
  data: {
    resourceId: string
    userId: string
    resourceSetId: string
    kind: 'url' | 'image' | 'file' | 'note'
    title?: string
    addedAt: string
  }
  metadata: {
    emittedBy: 'shared-kernel'
    timestamp: string
    idempotencyKey: string
  }
}

// ============================================================================
// EVENT UNION TYPE
// ============================================================================

export type SyncScriptEvent =
  // User & Authentication
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | FeatureFlagChangedEvent
  
  // Task & Event
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskCompletedEvent
  | TaskDeletedEvent
  | EventCreatedEvent
  | EventUpdatedEvent
  | EventDeletedEvent
  
  // Script & Template
  | ScriptAppliedEvent
  | TemplateUsedEvent
  | ScriptCreatedEvent
  
  // Calendar Sync
  | CalendarSyncedEvent
  | CalendarConflictDetectedEvent
  | CalendarIntegrationAddedEvent
  
  // Budget & Financial
  | BudgetCreatedEvent
  | BudgetUpdatedEvent
  | BudgetAlertTriggeredEvent
  
  // Energy & Gamification
  | EnergyEarnedEvent
  | AchievementUnlockedEvent
  | ChallengeCompletedEvent
  | EnergyResetEvent
  
  // Collaboration
  | FriendshipRequestedEvent
  | FriendshipAcceptedEvent
  | PrivacyChangedEvent
  
  // Export
  | ExportStartedEvent
  | ExportCompletedEvent
  | ExportFailedEvent
  
  // Search & AI
  | SearchPerformedEvent
  | AISuggestionShownEvent
  
  // Notification
  | NotificationSentEvent
  | ResourceAddedEvent

// ============================================================================
// EVENT REGISTRY
// ============================================================================

export const EVENT_REGISTRY = {
  // User & Authentication
  'user.created': {
    version: '1.0',
    emittedBy: 'identity-access',
    consumedBy: ['planning-core', 'gamification', 'collaboration', 'shared-kernel']
  },
  'user.updated': {
    version: '1.0',
    emittedBy: 'identity-access',
    consumedBy: ['planning-core', 'gamification', 'collaboration', 'shared-kernel']
  },
  'user.deleted': {
    version: '1.0',
    emittedBy: 'identity-access',
    consumedBy: ['planning-core', 'scripts', 'scheduling-sync', 'budgeting', 'gamification', 'collaboration', 'exports', 'search-ai', 'shared-kernel']
  },
  'feature_flag.changed': {
    version: '1.0',
    emittedBy: 'identity-access',
    consumedBy: ['planning-core', 'scripts', 'scheduling-sync', 'budgeting', 'gamification', 'collaboration', 'exports', 'search-ai', 'shared-kernel']
  },
  
  // Task & Event
  'task.created': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['gamification', 'budgeting', 'shared-kernel']
  },
  'task.updated': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['gamification', 'budgeting', 'shared-kernel']
  },
  'task.completed': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['gamification', 'budgeting', 'shared-kernel']
  },
  'task.deleted': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['gamification', 'budgeting', 'shared-kernel']
  },
  'event.created': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['scripts', 'scheduling-sync', 'budgeting', 'shared-kernel']
  },
  'event.updated': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['scripts', 'scheduling-sync', 'budgeting', 'shared-kernel']
  },
  'event.deleted': {
    version: '1.0',
    emittedBy: 'planning-core',
    consumedBy: ['scripts', 'scheduling-sync', 'budgeting', 'shared-kernel']
  },
  
  // Script & Template
  'script.applied': {
    version: '1.0',
    emittedBy: 'scripts',
    consumedBy: ['planning-core', 'shared-kernel']
  },
  'template.used': {
    version: '1.0',
    emittedBy: 'scripts',
    consumedBy: ['shared-kernel']
  },
  'script.created': {
    version: '1.0',
    emittedBy: 'scripts',
    consumedBy: ['shared-kernel']
  },
  
  // Calendar Sync
  'calendar.synced': {
    version: '1.0',
    emittedBy: 'scheduling-sync',
    consumedBy: ['planning-core', 'shared-kernel']
  },
  'calendar.conflict_detected': {
    version: '1.0',
    emittedBy: 'scheduling-sync',
    consumedBy: ['planning-core', 'shared-kernel']
  },
  'calendar.integration_added': {
    version: '1.0',
    emittedBy: 'scheduling-sync',
    consumedBy: ['shared-kernel']
  },
  
  // Budget & Financial
  'budget.created': {
    version: '1.0',
    emittedBy: 'budgeting',
    consumedBy: ['shared-kernel']
  },
  'budget.updated': {
    version: '1.0',
    emittedBy: 'budgeting',
    consumedBy: ['shared-kernel']
  },
  'budget.alert_triggered': {
    version: '1.0',
    emittedBy: 'budgeting',
    consumedBy: ['shared-kernel']
  },
  
  // Energy & Gamification
  'energy.earned': {
    version: '1.0',
    emittedBy: 'gamification',
    consumedBy: ['shared-kernel']
  },
  'achievement.unlocked': {
    version: '1.0',
    emittedBy: 'gamification',
    consumedBy: ['shared-kernel']
  },
  'challenge.completed': {
    version: '1.0',
    emittedBy: 'gamification',
    consumedBy: ['shared-kernel']
  },
  'energy.reset': {
    version: '1.0',
    emittedBy: 'gamification',
    consumedBy: ['shared-kernel']
  },
  
  // Collaboration
  'friendship.requested': {
    version: '1.0',
    emittedBy: 'collaboration',
    consumedBy: ['shared-kernel']
  },
  'friendship.accepted': {
    version: '1.0',
    emittedBy: 'collaboration',
    consumedBy: ['shared-kernel']
  },
  'privacy.changed': {
    version: '1.0',
    emittedBy: 'collaboration',
    consumedBy: ['shared-kernel']
  },
  
  // Export
  'export.started': {
    version: '1.0',
    emittedBy: 'exports',
    consumedBy: ['shared-kernel']
  },
  'export.completed': {
    version: '1.0',
    emittedBy: 'exports',
    consumedBy: ['shared-kernel']
  },
  'export.failed': {
    version: '1.0',
    emittedBy: 'exports',
    consumedBy: ['shared-kernel']
  },
  
  // Search & AI
  'search.performed': {
    version: '1.0',
    emittedBy: 'search-ai',
    consumedBy: ['shared-kernel']
  },
  'ai.suggestion_shown': {
    version: '1.0',
    emittedBy: 'search-ai',
    consumedBy: ['shared-kernel']
  },
  
  // Notification
  'notification.sent': {
    version: '1.0',
    emittedBy: 'shared-kernel',
    consumedBy: []
  },
  'resource.added': {
    version: '1.0',
    emittedBy: 'shared-kernel',
    consumedBy: []
  }
} as const

// ============================================================================
// EVENT UTILITIES
// ============================================================================

export function createEvent<T extends SyncScriptEvent>(
  type: T['type'],
  data: T['data'],
  metadata: Omit<T['metadata'], 'timestamp' | 'idempotencyKey'>
): T {
  const timestamp = new Date().toISOString()
  const idempotencyKey = `${metadata.emittedBy}_${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
  
  return {
    type,
    version: EVENT_REGISTRY[type].version as T['version'],
    data,
    metadata: {
      ...metadata,
      timestamp,
      idempotencyKey
    }
  } as T
}

export function isValidEvent(event: any): event is SyncScriptEvent {
  return (
    event &&
    typeof event.type === 'string' &&
    typeof event.version === 'string' &&
    typeof event.data === 'object' &&
    typeof event.metadata === 'object' &&
    event.metadata.emittedBy &&
    event.metadata.timestamp &&
    event.metadata.idempotencyKey
  )
}

export function getEventConsumers(eventType: string): string[] {
  return EVENT_REGISTRY[eventType as keyof typeof EVENT_REGISTRY]?.consumedBy || []
}

export function getEventEmitter(eventType: string): string {
  return EVENT_REGISTRY[eventType as keyof typeof EVENT_REGISTRY]?.emittedBy || ''
}
