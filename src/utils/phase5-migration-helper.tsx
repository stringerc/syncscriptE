/**
 * PHASE 5: Migration Helper
 * 
 * Utilities to add Phase 5 fields to existing events and tasks
 * This ensures backward compatibility with existing data
 */

import { Event, Task, Script } from './event-task-types';
import { CURRENT_USER } from './user-constants';

/**
 * Add Phase 5 hierarchy and lifecycle fields to an event
 * Provides sensible defaults for existing events
 */
export function migrateEventToPhase5(event: Partial<Event>): Event {
  return {
    ...event,
    
    // PHASE 5: Hierarchy fields (defaults for existing events)
    isPrimaryEvent: event.isPrimaryEvent ?? true, // Assume existing events are primary
    primaryEventId: event.primaryEventId ?? (event.parentEventId ? undefined : event.id),
    parentEventId: event.parentEventId ?? undefined,
    childEventIds: event.childEventIds ?? [],
    depth: event.depth ?? 0, // Assume top-level
    
    // PHASE 5: Lifecycle fields
    archived: event.archived ?? false, // Not archived by default
    archivedAt: event.archivedAt ?? undefined,
    autoArchiveChildren: event.autoArchiveChildren ?? true, // Enable cascade archival
    
    // PHASE 5: Permission fields
    primaryEventCreator: event.primaryEventCreator ?? event.createdBy ?? CURRENT_USER.name,
    inheritPermissions: event.inheritPermissions ?? false, // Top-level doesn't inherit
    permissionOverrides: event.permissionOverrides ?? [],
  } as Event;
}

/**
 * Add Phase 5 lifecycle fields to a task
 * Provides sensible defaults for existing tasks
 */
export function migrateTaskToPhase5(task: Partial<Task>): Task {
  return {
    ...task,
    
    // PHASE 5: Hierarchy enhancement
    primaryEventId: task.primaryEventId ?? task.parentEventId, // Use parent as primary if not set
    
    // PHASE 5: Lifecycle fields
    archived: task.archived ?? false, // Not archived by default
    archivedReason: task.archivedReason ?? undefined,
    archivedAt: task.archivedAt ?? undefined,
    archiveWithParentEvent: task.archiveWithParentEvent ?? true, // Auto-archive by default
  } as Task;
}

/**
 * Add Phase 5 hierarchy fields to a script
 * Provides sensible defaults for existing scripts
 */
export function migrateScriptToPhase5(script: Partial<Script>): Script {
  return {
    ...script,
    
    // PHASE 5: Primary event reference
    primaryEventId: script.primaryEventId ?? script.originalEventId ?? '',
    originalEventId: script.originalEventId ?? script.primaryEventId ?? '',
    
    // PHASE 5: Hierarchy support
    includesChildEvents: script.includesChildEvents ?? false,
    childEventTemplates: script.childEventTemplates ?? [],
    eventHierarchyDepth: script.eventHierarchyDepth ?? 0,
    totalEvents: script.totalEvents ?? 1,
    totalTasks: script.totalTasks ?? (script.templateEvent?.tasks?.length ?? 0),
    
    // PHASE 5: Enhanced permissions
    originalCreator: script.originalCreator ?? script.createdBy ?? CURRENT_USER.name,
    scriptCreator: script.scriptCreator ?? script.createdBy ?? CURRENT_USER.name,
    allowCustomization: script.allowCustomization ?? true,
    
    // PHASE 5: Marketplace support
    isPublic: script.isPublic ?? false,
    price: script.price ?? undefined,
  } as Script;
}

/**
 * Migrate an array of events to Phase 5
 */
export function migrateEventsToPhase5(events: Partial<Event>[]): Event[] {
  return events.map(migrateEventToPhase5);
}

/**
 * Migrate an array of tasks to Phase 5
 */
export function migrateTasksToPhase5(tasks: Partial<Task>[]): Task[] {
  return tasks.map(migrateTaskToPhase5);
}

/**
 * Migrate an array of scripts to Phase 5
 */
export function migrateScriptsToPhase5(scripts: Partial<Script>[]): Script[] {
  return scripts.map(migrateScriptToPhase5);
}

/**
 * Check if an event has Phase 5 fields
 */
export function hasPhase5EventFields(event: Partial<Event>): boolean {
  return (
    event.isPrimaryEvent !== undefined &&
    event.depth !== undefined &&
    event.archived !== undefined &&
    event.autoArchiveChildren !== undefined
  );
}

/**
 * Check if a task has Phase 5 fields
 */
export function hasPhase5TaskFields(task: Partial<Task>): boolean {
  return (
    task.archived !== undefined &&
    task.archiveWithParentEvent !== undefined
  );
}

/**
 * Get migration status summary
 */
export function getMigrationStatus(
  events: Partial<Event>[],
  tasks: Partial<Task>[],
  scripts: Partial<Script>[]
): {
  eventsNeedMigration: number;
  tasksNeedMigration: number;
  scriptsNeedMigration: number;
  totalItems: number;
  migrationNeeded: boolean;
} {
  const eventsNeedMigration = events.filter(e => !hasPhase5EventFields(e)).length;
  const tasksNeedMigration = tasks.filter(t => !hasPhase5TaskFields(t)).length;
  const scriptsNeedMigration = scripts.length; // All scripts get updated fields
  
  return {
    eventsNeedMigration,
    tasksNeedMigration,
    scriptsNeedMigration,
    totalItems: events.length + tasks.length + scripts.length,
    migrationNeeded: eventsNeedMigration > 0 || tasksNeedMigration > 0 || scriptsNeedMigration > 0,
  };
}

/**
 * EXAMPLE USAGE:
 * 
 * // Migrate single event
 * const upgradedEvent = migrateEventToPhase5(oldEvent);
 * 
 * // Migrate array of events
 * const upgradedEvents = migrateEventsToPhase5(oldEvents);
 * 
 * // Check migration status
 * const status = getMigrationStatus(events, tasks, scripts);
 * console.log(`Need to migrate ${status.eventsNeedMigration} events`);
 */
