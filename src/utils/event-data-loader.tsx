/**
 * Event Data Loader
 * 
 * Centralized data loading with automatic Phase 5 migration
 * Use this to load event/task data throughout the app
 */

import { Event, Task, Script } from './event-task-types';
import { sampleEvents, sampleTasks, sampleScripts } from './sample-event-data';
import {
  hierarchicalConferenceEvents,
  hierarchicalConferenceTasks,
  conferenceScript,
  archivedEvent,
  archivedTasks,
} from './sample-event-data-phase5';
import {
  migrateEventsToPhase5,
  migrateTasksToPhase5,
  migrateScriptsToPhase5,
  getMigrationStatus,
} from './phase5-migration-helper';

/**
 * Load all events with Phase 5 migration applied
 * Combines flat events and hierarchical examples
 */
export function loadAllEvents(): Event[] {
  // Migrate existing flat events
  const migratedFlatEvents = migrateEventsToPhase5(sampleEvents);
  
  // Hierarchical events already have Phase 5 fields
  const hierarchicalEvents = hierarchicalConferenceEvents;
  
  // Archived event example
  const archivedEvents = [archivedEvent];
  
  // Combine all events
  return [
    ...migratedFlatEvents,
    ...hierarchicalEvents,
    ...archivedEvents,
  ];
}

/**
 * Load all tasks with Phase 5 migration applied
 * Combines flat tasks and hierarchical examples
 */
export function loadAllTasks(): Task[] {
  // Flat tasks from sample data are already updated with Phase 5 fields
  const flatTasks = sampleTasks;
  
  // Hierarchical tasks
  const hierarchicalTasks = hierarchicalConferenceTasks;
  
  // Archived tasks
  const archivedTaskList = archivedTasks;
  
  // Combine all tasks
  return [
    ...flatTasks,
    ...hierarchicalTasks,
    ...archivedTaskList,
  ];
}

/**
 * Load all scripts with Phase 5 migration applied
 */
export function loadAllScripts(): Script[] {
  // Migrate existing scripts
  const migratedScripts = migrateScriptsToPhase5(sampleScripts);
  
  // Hierarchical script example
  const hierarchicalScripts = [conferenceScript];
  
  // Combine all scripts
  return [
    ...migratedScripts,
    ...hierarchicalScripts,
  ];
}

/**
 * Load only active (non-archived) events
 */
export function loadActiveEvents(): Event[] {
  const allEvents = loadAllEvents();
  return allEvents.filter(event => !event.archived);
}

/**
 * Load only active (non-archived) tasks
 */
export function loadActiveTasks(): Task[] {
  const allTasks = loadAllTasks();
  return allTasks.filter(task => !task.archived);
}

/**
 * Load only archived events
 */
export function loadArchivedEvents(): Event[] {
  const allEvents = loadAllEvents();
  return allEvents.filter(event => event.archived);
}

/**
 * Load only archived tasks
 */
export function loadArchivedTasks(): Task[] {
  const allTasks = loadAllTasks();
  return allTasks.filter(task => task.archived);
}

/**
 * Load only primary events (top-level in hierarchy)
 */
export function loadPrimaryEvents(): Event[] {
  const allEvents = loadAllEvents();
  return allEvents.filter(event => event.isPrimaryEvent);
}

/**
 * Load child events for a specific primary event
 */
export function loadChildEvents(primaryEventId: string): Event[] {
  const allEvents = loadAllEvents();
  return allEvents.filter(event => event.primaryEventId === primaryEventId && !event.isPrimaryEvent);
}

/**
 * Load tasks for a specific event (including all nested tasks)
 */
export function loadTasksForEvent(eventId: string): Task[] {
  const allTasks = loadAllTasks();
  return allTasks.filter(task => task.parentEventId === eventId || task.primaryEventId === eventId);
}

/**
 * Load standalone tasks (not associated with any event)
 */
export function loadStandaloneTasks(): Task[] {
  const allTasks = loadAllTasks();
  return allTasks.filter(task => !task.parentEventId && !task.primaryEventId);
}

/**
 * Get migration status report
 */
export function getDataMigrationStatus() {
  return getMigrationStatus(
    sampleEvents,
    sampleTasks,
    sampleScripts
  );
}

/**
 * Get data statistics
 */
export function getDataStatistics(): {
  totalEvents: number;
  activeEvents: number;
  archivedEvents: number;
  primaryEvents: number;
  childEvents: number;
  totalTasks: number;
  activeTasks: number;
  archivedTasks: number;
  standaloneTasks: number;
  eventTasks: number;
  totalScripts: number;
  hierarchicalScripts: number;
} {
  const allEvents = loadAllEvents();
  const allTasks = loadAllTasks();
  const allScripts = loadAllScripts();
  
  return {
    totalEvents: allEvents.length,
    activeEvents: allEvents.filter(e => !e.archived).length,
    archivedEvents: allEvents.filter(e => e.archived).length,
    primaryEvents: allEvents.filter(e => e.isPrimaryEvent).length,
    childEvents: allEvents.filter(e => !e.isPrimaryEvent).length,
    totalTasks: allTasks.length,
    activeTasks: allTasks.filter(t => !t.archived).length,
    archivedTasks: allTasks.filter(t => t.archived).length,
    standaloneTasks: allTasks.filter(t => !t.parentEventId && !t.primaryEventId).length,
    eventTasks: allTasks.filter(t => t.parentEventId || t.primaryEventId).length,
    totalScripts: allScripts.length,
    hierarchicalScripts: allScripts.filter(s => s.includesChildEvents).length,
  };
}

/**
 * EXAMPLE USAGE:
 * 
 * // In a component:
 * const allEvents = loadAllEvents();           // All events (flat + hierarchical + archived)
 * const activeEvents = loadActiveEvents();     // Only non-archived events
 * const primaryEvents = loadPrimaryEvents();   // Only top-level events
 * const activeTasks = loadActiveTasks();       // Only non-archived tasks
 * const standalone = loadStandaloneTasks();    // Tasks not linked to events
 * 
 * // Get statistics:
 * const stats = getDataStatistics();
 * console.log(`Total events: ${stats.totalEvents}, Primary: ${stats.primaryEvents}`);
 */
