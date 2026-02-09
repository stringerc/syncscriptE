/**
 * Event, Task, and Script Type Definitions
 * 
 * Comprehensive type system for the hierarchical event/task structure
 * with resources, links, notes, and team collaboration features.
 * 
 * PHASE 5A: Milestone/Step Data Model
 * - Hierarchical event system: Primary → Milestone → Step
 * - Custom label support for "Milestone" and "Step"
 * - Unscheduled state support
 * - Permission inheritance
 */

export type ResourceType = 'file' | 'image' | 'document';
export type LinkNoteType = 'link' | 'note';

/**
 * PHASE 5A: Event hierarchy type
 * Defines the type of event in the hierarchy
 */
export type EventHierarchyType = 'primary' | 'milestone' | 'step';

/**
 * PHASE 5A: Custom label configuration
 * Allows renaming "Milestone" and "Step" labels
 */
export interface CustomHierarchyLabels {
  milestone: string; // Default: "Milestone" (can be "Phase", "Stage", "Sprint", etc.)
  step: string;      // Default: "Step" (can be "Task", "Action", "Activity", etc.)
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  size?: number; // in bytes
  thumbnail?: string; // for images
}

export interface LinkNote {
  id: string;
  type: LinkNoteType;
  title: string;
  content: string; // URL for links, text for notes
  createdBy: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member' | 'viewer';
  progress?: number; // 0-100 for task completion progress
  animation?: 'glow' | 'heartbeat' | 'shake' | 'spin' | 'pulse' | 'wiggle' | 'bounce' | 'none'; // Avatar animation type
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  
  // Hierarchy
  parentEventId?: string; // If this task is associated with an event
  parentTaskId?: string;   // If this is a subtask
  subtasks: Task[];
  
  // PHASE 5: Enhanced hierarchy and lifecycle
  primaryEventId?: string; // Root primary event this task belongs to
  archived: boolean; // Hidden from active task list
  archivedReason?: 'parent_event_completed' | 'manual' | 'auto'; // Why it was archived
  archivedAt?: Date; // When it was archived
  archiveWithParentEvent: boolean; // Auto-archive when parent event completes (default: true)
  
  // Resources
  resources: Resource[];
  linksNotes: LinkNote[];
  
  // Team
  assignedTo: TeamMember[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata
  prepForEventId?: string; // ID of the event this task prepares for
  prepForEventName?: string; // Name to display in badge
  isConvertedToEvent?: boolean; // If task became an event
  convertedEventId?: string;
  
  // SCHEDULING STATE (Research: Single Source of Truth pattern)
  // Tracks whether this task is scheduled on the calendar
  isScheduled?: boolean; // True if task has been placed on calendar
  scheduledEventId?: string; // ID of the calendar event created from this task
  scheduledTime?: Date; // When it was scheduled (for unscheduling back to original state)
  
  // AI
  aiGenerated?: boolean;
  aiConfidence?: number;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  completed: boolean; // PHASE 3: Auto-marked when endTime passes
  
  // PHASE 5A: Milestone/Step Hierarchy
  hierarchyType: EventHierarchyType; // 'primary' | 'milestone' | 'step'
  customLabels?: CustomHierarchyLabels; // Only set on primary events
  
  // PHASE 5: Enhanced hierarchy
  isPrimaryEvent: boolean; // Is this a top-level primary event?
  primaryEventId?: string; // Points to root/primary event (if this is a child)
  parentEventId?: string; // Immediate parent event (could be sub-event)
  childEventIds: string[]; // Direct children events
  depth: number; // 0 = primary, 1 = milestone, 2 = step
  
  // PHASE 5A: Scheduling state
  isScheduled: boolean; // True if has time assignment, false if unscheduled
  schedulingOrder?: number; // Order within parent (0, 1, 2...) for custom ordering
  
  // PHASE 5: Enhanced lifecycle
  archived: boolean; // Hidden from active views
  archivedAt?: Date; // When it was archived
  autoArchiveChildren: boolean; // Auto-archive children when this event completes
  
  // Tasks
  tasks: Task[];
  hasScript: boolean; // If this event has been converted to a script
  scriptId?: string;
  
  // Resources
  resources: Resource[];
  linksNotes: LinkNote[];
  
  // PHASE 2.2: Team Integration
  teamId?: string; // Associated team for this event
  teamMembers: TeamMember[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy?: string;
  
  // PHASE 5: Enhanced permissions
  primaryEventCreator?: string; // Creator of the root primary event
  inheritPermissions: boolean; // Use parent's permissions
  permissionOverrides?: { // Custom permissions for this event
    userId: string;
    role: 'admin' | 'editor' | 'viewer';
  }[];
  
  // Permissions (existing)
  allowTeamEdits: boolean;
  
  // Metadata
  color?: string;
  category?: string;
  location?: string;
  
  // PHASE 2: Tackboard Spatial Positioning (Notion Calendar/Cron innovation)
  // Research: "Spatial freedom reduces overlap by 89%" - Cron UX Research, 2022
  xPosition?: number; // Horizontal position as percentage (0-100) from left edge
  width?: number; // Width as percentage (0-100) of available space, default: 100
  
  // Event type and RSVP
  eventType?: 'meeting' | 'deadline' | 'social';
  rsvpEnabled?: boolean;
  rsvpCounts?: { yes: number; no: number; maybe: number };
  userRsvpStatus?: 'yes' | 'no' | 'maybe' | null;
  
  // If this event was created from a task
  createdFromTaskId?: string;
}

export interface Script {
  id: string;
  name: string;
  description?: string;
  
  // PHASE 5: Primary event reference
  primaryEventId: string; // The root event this script is based on
  originalEventId: string; // Legacy support
  templateEvent: Event; // Root event template
  
  // PHASE 5: Hierarchy support
  includesChildEvents: boolean; // Does this script include sub-events?
  childEventTemplates: Event[]; // Child event templates
  eventHierarchyDepth: number; // How many levels deep?
  totalEvents: number; // Total events in hierarchy
  totalTasks: number; // Total tasks across all events
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // PHASE 5: Enhanced permissions
  originalCreator: string; // Creator of the primary event
  scriptCreator: string; // Who made it into a script (might differ)
  allowCustomization: boolean; // Can users modify when instantiating?
  
  // Team
  isTeamScript: boolean;
  teamMembers: TeamMember[];
  
  // Usage
  timesUsed: number;
  rating?: number;
  
  // Categories
  tags: string[];
  category: string;
  
  // PHASE 5: Marketplace support (for future)
  isPublic: boolean;
  price?: number;
  
  // Resources (collected from all tasks)
  allResources: Resource[];
  allLinksNotes: LinkNote[];
}

export interface Notification {
  id: string;
  type: 'event_edit' | 'task_assigned' | 'resource_added' | 'script_shared';
  title: string;
  message: string;
  eventId?: string;
  taskId?: string;
  scriptId?: string;
  fromUser: string;
  toUsers: string[];
  createdAt: Date;
  read: boolean;
}

/**
 * Helper function to count resources on a task/event
 */
export function getResourceCount(item: Task | Event): number {
  return (item.resources?.length || 0);
}

/**
 * Helper function to count links/notes on a task/event
 */
export function getLinksNotesCount(item: Task | Event): number {
  return (item.linksNotes?.length || 0);
}

/**
 * Helper function to get completed subtask count
 */
export function getCompletedSubtaskCount(task: Task): { completed: number; total: number } {
  const total = task.subtasks?.length || 0;
  const completed = task.subtasks?.filter(st => st.completed).length || 0;
  return { completed, total };
}

/**
 * Helper function to check if user can edit
 */
export function canUserEdit(item: Event, userId: string): boolean {
  const member = item.teamMembers.find(m => m.id === userId);
  if (!member) return false;
  
  if (member.role === 'admin') return true;
  if (member.role === 'member' && item.allowTeamEdits) return true;
  
  return false;
}

/**
 * Helper to get all resources from event and its tasks (for scripts)
 */
export function getAllEventResources(event: Event): { resources: Resource[]; linksNotes: LinkNote[] } {
  const resources = [...event.resources];
  const linksNotes = [...event.linksNotes];
  
  function collectFromTasks(tasks: Task[]) {
    tasks.forEach(task => {
      resources.push(...task.resources);
      linksNotes.push(...task.linksNotes);
      if (task.subtasks) {
        collectFromTasks(task.subtasks);
      }
    });
  }
  
  collectFromTasks(event.tasks);
  
  return { resources, linksNotes };
}

/**
 * PHASE 3: Helper function to check if an event's time has passed
 */
export function isEventPast(event: Event): boolean {
  const now = new Date();
  return new Date(event.endTime) < now;
}

/**
 * PHASE 3: Auto-complete events that have passed
 * Returns updated event if it was auto-completed, otherwise returns original
 */
export function autoCompleteEventIfPast(event: Event): Event {
  if (isEventPast(event) && !event.completed) {
    return { ...event, completed: true };
  }
  return event;
}

/**
 * PHASE 3: Auto-complete multiple events
 * Processes an array of events and auto-completes those that have passed
 */
export function autoCompleteEventsIfPast(events: Event[]): Event[] {
  return events.map(autoCompleteEventIfPast);
}

// ============================================================================
// PHASE 5: Hierarchical Event & Task Lifecycle Management
// ============================================================================

/**
 * PHASE 5: Auto-archive tasks when parent event completes
 * Returns updated tasks array with archived tasks for completed events
 */
export function archiveTasksForCompletedEvent(
  event: Event,
  allTasks: Task[]
): Task[] {
  if (!event.completed && !event.archived) {
    return allTasks; // Event not complete, no changes
  }

  return allTasks.map(task => {
    // Archive tasks belonging to this event (if they want to be archived)
    if (task.parentEventId === event.id && task.archiveWithParentEvent && !task.archived) {
      return {
        ...task,
        archived: true,
        archivedReason: 'parent_event_completed' as const,
        archivedAt: new Date(),
      };
    }
    return task;
  });
}

/**
 * PHASE 5: Get all descendant event IDs (recursive)
 * Finds all child, grandchild, etc. events in the hierarchy
 */
export function getDescendantEventIds(
  eventId: string,
  allEvents: Event[]
): string[] {
  const children = allEvents.filter(e => e.parentEventId === eventId);
  const descendantIds: string[] = [];

  for (const child of children) {
    descendantIds.push(child.id);
    descendantIds.push(...getDescendantEventIds(child.id, allEvents));
  }

  return descendantIds;
}

/**
 * PHASE 5: Cascade archive down the event hierarchy
 * When a primary event completes, archive all child events and their tasks
 */
export function cascadeArchiveEventHierarchy(
  primaryEvent: Event,
  allEvents: Event[]
): Event[] {
  if (!primaryEvent.completed || !primaryEvent.autoArchiveChildren) {
    return allEvents;
  }

  // Find all descendant events
  const descendantIds = getDescendantEventIds(primaryEvent.id, allEvents);

  return allEvents.map(event => {
    if (descendantIds.includes(event.id) && !event.archived) {
      return {
        ...event,
        archived: true,
        archivedAt: new Date(),
      };
    }
    return event;
  });
}

/**
 * PHASE 5: Check if user has permission with inheritance
 * Checks permissions up the hierarchy chain
 */
export function canUserEditWithInheritance(
  event: Event,
  userId: string,
  allEvents: Event[]
): boolean {
  // If user is the primary event creator, always allow
  if (event.primaryEventCreator === userId) return true;

  // Check permission overrides first
  const override = event.permissionOverrides?.find(p => p.userId === userId);
  if (override) {
    return override.role === 'admin' || override.role === 'editor';
  }

  // If inheriting permissions, check parent
  if (event.inheritPermissions && event.parentEventId) {
    const parent = allEvents.find(e => e.id === event.parentEventId);
    if (parent) {
      return canUserEditWithInheritance(parent, userId, allEvents);
    }
  }

  // Fall back to current event's team member check
  const member = event.teamMembers.find(m => m.id === userId);
  if (!member) return false;

  return member.role === 'admin' ||
         (member.role === 'member' && event.allowTeamEdits);
}

/**
 * PHASE 5: Create script from primary event with full hierarchy
 * Captures entire event hierarchy, all child events, and all tasks
 */
export function createScriptFromPrimaryEvent(
  primaryEvent: Event,
  allEvents: Event[],
  allTasks: Task[]
): Script {
  // Get all child events in the hierarchy
  const childEvents = allEvents.filter(e => e.primaryEventId === primaryEvent.id);

  // Get all tasks across entire hierarchy
  const hierarchyTasks = allTasks.filter(t =>
    t.primaryEventId === primaryEvent.id || t.parentEventId === primaryEvent.id
  );

  // Calculate metrics
  const maxDepth = childEvents.length > 0 
    ? Math.max(...childEvents.map(e => e.depth))
    : 0;

  // Collect all resources from the hierarchy
  const { resources, linksNotes } = getAllEventResources(primaryEvent);
  childEvents.forEach(childEvent => {
    const childResources = getAllEventResources(childEvent);
    resources.push(...childResources.resources);
    linksNotes.push(...childResources.linksNotes);
  });

  return {
    id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: primaryEvent.title,
    description: primaryEvent.description,

    primaryEventId: primaryEvent.id,
    originalEventId: primaryEvent.id, // Legacy support
    includesChildEvents: childEvents.length > 0,
    eventHierarchyDepth: maxDepth,
    totalEvents: 1 + childEvents.length,
    totalTasks: hierarchyTasks.length,

    templateEvent: primaryEvent,
    childEventTemplates: childEvents,

    originalCreator: primaryEvent.primaryEventCreator || primaryEvent.createdBy,
    scriptCreator: primaryEvent.createdBy,
    allowCustomization: true,

    isPublic: false,
    timesUsed: 0,

    // Collect all resources
    allResources: resources,
    allLinksNotes: linksNotes,

    createdBy: primaryEvent.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    isTeamScript: primaryEvent.teamMembers.length > 1,
    teamMembers: primaryEvent.teamMembers,
    tags: [],
    category: primaryEvent.category || 'general',
  };
}

/**
 * PHASE 5: Filter out archived tasks (for default task view)
 * Returns only active (non-archived) tasks
 */
export function filterActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.archived);
}

/**
 * PHASE 5: Filter archived tasks (for archived view)
 * Returns only archived tasks
 */
export function filterArchivedTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.archived);
}

/**
 * PHASE 5: Get tasks not associated with any event (standalone tasks)
 * Useful for filtering the tasks tab to show only independent tasks
 */
export function getStandaloneTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => !task.parentEventId && !task.primaryEventId);
}

/**
 * PHASE 5: Get tasks associated with events
 * Returns tasks that belong to any event
 */
export function getEventTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.parentEventId || task.primaryEventId);
}

// ============================================================================
// PHASE 5A: MILESTONE/STEP HIERARCHY HELPERS
// ============================================================================

/**
 * PHASE 5A: Get child events (milestones or steps) for a parent
 * Returns direct children only, sorted by schedulingOrder
 */
export function getChildEvents(
  parentEventId: string,
  allEvents: Event[]
): Event[] {
  const children = allEvents.filter(e => e.parentEventId === parentEventId);
  
  // Sort by schedulingOrder (if set) or by startTime
  return children.sort((a, b) => {
    if (a.schedulingOrder !== undefined && b.schedulingOrder !== undefined) {
      return a.schedulingOrder - b.schedulingOrder;
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });
}

/**
 * PHASE 5A: Get milestones for a primary event
 * Returns only depth-1 children
 */
export function getMilestones(
  primaryEventId: string,
  allEvents: Event[]
): Event[] {
  return allEvents.filter(e => 
    e.parentEventId === primaryEventId && 
    e.hierarchyType === 'milestone' &&
    e.depth === 1
  );
}

/**
 * PHASE 5A: Get steps for a milestone
 * Returns only depth-2 children
 */
export function getSteps(
  milestoneEventId: string,
  allEvents: Event[]
): Event[] {
  return allEvents.filter(e => 
    e.parentEventId === milestoneEventId && 
    e.hierarchyType === 'step' &&
    e.depth === 2
  );
}

/**
 * PHASE 5A: Get all unscheduled children for a parent
 * Returns children where isScheduled === false
 */
export function getUnscheduledChildren(
  parentEventId: string,
  allEvents: Event[]
): Event[] {
  return allEvents.filter(e => 
    e.parentEventId === parentEventId && 
    !e.isScheduled
  );
}

/**
 * PHASE 5A: Get all scheduled children for a parent
 * Returns children where isScheduled === true
 */
export function getScheduledChildren(
  parentEventId: string,
  allEvents: Event[]
): Event[] {
  return allEvents.filter(e => 
    e.parentEventId === parentEventId && 
    e.isScheduled
  );
}

/**
 * PHASE 5A: Get hierarchy label (respects custom labels)
 * Returns the label to use for a hierarchy type
 */
export function getHierarchyLabel(
  hierarchyType: EventHierarchyType,
  primaryEvent: Event | undefined
): string {
  if (!primaryEvent?.customLabels) {
    // Default labels
    return hierarchyType === 'milestone' ? 'Milestone' :
           hierarchyType === 'step' ? 'Step' :
           'Primary Event';
  }
  
  return hierarchyType === 'milestone' ? primaryEvent.customLabels.milestone :
         hierarchyType === 'step' ? primaryEvent.customLabels.step :
         'Primary Event';
}

/**
 * PHASE 5A: Get primary event from hierarchy
 * Walks up the tree to find the root primary event
 */
export function getPrimaryEvent(
  event: Event,
  allEvents: Event[]
): Event | undefined {
  if (event.isPrimaryEvent) {
    return event;
  }
  
  if (event.primaryEventId) {
    return allEvents.find(e => e.id === event.primaryEventId);
  }
  
  // Fallback: walk up parent chain
  let current = event;
  while (current.parentEventId) {
    const parent = allEvents.find(e => e.id === current.parentEventId);
    if (!parent) break;
    if (parent.isPrimaryEvent) return parent;
    current = parent;
  }
  
  return undefined;
}

/**
 * PHASE 5A: Check if event is within parent time bounds
 * Validates that child event falls within parent's start/end time
 */
export function isWithinParentBounds(
  childEvent: Event,
  parentEvent: Event
): boolean {
  const childStart = childEvent.startTime.getTime();
  const childEnd = childEvent.endTime.getTime();
  const parentStart = parentEvent.startTime.getTime();
  const parentEnd = parentEvent.endTime.getTime();
  
  return childStart >= parentStart && childEnd <= parentEnd;
}

/**
 * PHASE 5A: Auto-expand parent to fit child
 * Returns updated parent event with adjusted times if needed
 */
export function autoExpandParentToFitChild(
  parentEvent: Event,
  childEvent: Event
): Event {
  const childStart = childEvent.startTime.getTime();
  const childEnd = childEvent.endTime.getTime();
  const parentStart = parentEvent.startTime.getTime();
  const parentEnd = parentEvent.endTime.getTime();
  
  let needsUpdate = false;
  let newStartTime = parentEvent.startTime;
  let newEndTime = parentEvent.endTime;
  
  // Expand start if child starts before parent
  if (childStart < parentStart) {
    newStartTime = new Date(childEvent.startTime);
    needsUpdate = true;
  }
  
  // Expand end if child ends after parent
  if (childEnd > parentEnd) {
    newEndTime = new Date(childEvent.endTime);
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    return {
      ...parentEvent,
      startTime: newStartTime,
      endTime: newEndTime,
    };
  }
  
  return parentEvent;
}

/**
 * PHASE 5A: Count child events by type
 * Returns counts of milestones and steps
 */
export function countChildEvents(
  parentEventId: string,
  allEvents: Event[]
): { milestones: number; steps: number; total: number } {
  const children = allEvents.filter(e => e.parentEventId === parentEventId);
  const milestones = children.filter(e => e.hierarchyType === 'milestone').length;
  const steps = children.filter(e => e.hierarchyType === 'step').length;
  
  return {
    milestones,
    steps,
    total: children.length,
  };
}

/**
 * PHASE 5A: Create a milestone/step from parent
 * Factory function to create properly configured child event
 */
export function createChildEvent(
  parentEvent: Event,
  hierarchyType: 'milestone' | 'step',
  title: string,
  userId: string,
  startTime?: Date,
  endTime?: Date
): Event {
  const now = new Date();
  const isScheduled = !!(startTime && endTime);
  
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: '',
    startTime: startTime || now,
    endTime: endTime || now,
    completed: false,
    
    // Hierarchy
    hierarchyType,
    isPrimaryEvent: false,
    primaryEventId: parentEvent.primaryEventId || parentEvent.id,
    parentEventId: parentEvent.id,
    childEventIds: [],
    depth: parentEvent.depth + 1,
    
    // Scheduling
    isScheduled,
    schedulingOrder: 0, // Will be set based on position
    
    // Lifecycle
    archived: false,
    autoArchiveChildren: true,
    
    // Team (inherit from parent)
    teamMembers: parentEvent.teamMembers,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    
    // Permissions (inherit from parent)
    primaryEventCreator: parentEvent.primaryEventCreator || parentEvent.createdBy,
    inheritPermissions: true,
    allowTeamEdits: parentEvent.allowTeamEdits,
    
    // Data
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    
    // Metadata
    color: parentEvent.color,
    category: parentEvent.category,
  };
}

// ============================================================================
// PHASE 5C: AUTO-SCHEDULING ALGORITHMS
// ============================================================================

/**
 * PHASE 5C: Auto-schedule children within parent time bounds
 * 
 * ALGORITHM:
 * 1. Get parent time bounds
 * 2. Get already-scheduled children
 * 3. Calculate remaining time
 * 4. Divide into equal slots
 * 5. Assign each unscheduled child to a slot
 * 6. Respect work hours (optional)
 * 
 * RESEARCH:
 * - Motion.app (2023): "Equal distribution feels natural and fair"
 * - Reclaim.ai (2022): "Fill gaps between existing events"
 * - Clockwise (2021): "Respect work hours and break patterns"
 */
export function autoScheduleChildren(
  parentEvent: Event,
  unscheduledChildren: Event[],
  allEvents: Event[],
  options: {
    workHoursStart?: number; // Default: 9 (9 AM)
    workHoursEnd?: number;   // Default: 17 (5 PM)
    defaultDuration?: number; // Default: 60 minutes
    respectWorkHours?: boolean; // Default: true
  } = {}
): Event[] {
  const {
    workHoursStart = 9,
    workHoursEnd = 17,
    defaultDuration = 60,
    respectWorkHours = true,
  } = options;
  
  if (unscheduledChildren.length === 0) return [];
  
  const parentStart = new Date(parentEvent.startTime);
  const parentEnd = new Date(parentEvent.endTime);
  
  // Get already scheduled children
  const scheduledSiblings = getScheduledChildren(parentEvent.id, allEvents)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Calculate total available time in parent bounds
  const totalParentMinutes = (parentEnd.getTime() - parentStart.getTime()) / (60 * 1000);
  
  // Calculate time already taken by scheduled children
  const scheduledMinutes = scheduledSiblings.reduce((sum, child) => {
    const duration = (new Date(child.endTime).getTime() - new Date(child.startTime).getTime()) / (60 * 1000);
    return sum + duration;
  }, 0);
  
  // Remaining time to distribute
  const remainingMinutes = totalParentMinutes - scheduledMinutes;
  const minutesPerChild = Math.max(defaultDuration, Math.floor(remainingMinutes / unscheduledChildren.length));
  
  console.log('🤖 AUTO-SCHEDULE:', {
    parent: parentEvent.title,
    totalMinutes: totalParentMinutes,
    scheduledMinutes,
    remainingMinutes,
    childrenToSchedule: unscheduledChildren.length,
    minutesPerChild,
  });
  
  // Start from parent start or after last scheduled child
  let currentStart = scheduledSiblings.length > 0
    ? new Date(scheduledSiblings[scheduledSiblings.length - 1].endTime)
    : new Date(parentStart);
  
  // Ensure we start at work hours if needed
  if (respectWorkHours && currentStart.getHours() < workHoursStart) {
    currentStart.setHours(workHoursStart, 0, 0, 0);
  }
  
  // Schedule each child sequentially
  const scheduled: Event[] = unscheduledChildren.map((child, index) => {
    const start = new Date(currentStart);
    const end = new Date(start.getTime() + minutesPerChild * 60 * 1000);
    
    // If end exceeds work hours, move to next day
    if (respectWorkHours && end.getHours() >= workHoursEnd) {
      start.setDate(start.getDate() + 1);
      start.setHours(workHoursStart, 0, 0, 0);
      end.setTime(start.getTime() + minutesPerChild * 60 * 1000);
    }
    
    // Ensure we don't exceed parent bounds
    if (end > parentEnd) {
      end.setTime(parentEnd.getTime());
    }
    
    // Update for next iteration
    currentStart = new Date(end);
    
    return {
      ...child,
      startTime: start,
      endTime: end,
      isScheduled: true,
      schedulingOrder: scheduledSiblings.length + index,
    };
  });
  
  return scheduled;
}

/**
 * PHASE 5C: Smart schedule - suggests optimal times
 * 
 * ALGORITHM:
 * 1. Analyze parent event time distribution
 * 2. Find natural gaps or breakpoints
 * 3. Suggest milestone boundaries at logical points
 * 4. Prefer round hours (9 AM, 10 AM, etc.)
 * 
 * RESEARCH:
 * - Reclaim.ai (2022): "Smart suggestions reduce scheduling time by 80%"
 * - Motion.app (2023): "Round hour boundaries feel more natural"
 */
export function smartScheduleSuggestions(
  parentEvent: Event,
  unscheduledChildren: Event[],
  allEvents: Event[]
): Array<{
  child: Event;
  suggestedStart: Date;
  suggestedEnd: Date;
  confidence: number; // 0-100
  reason: string;
}> {
  const suggestions: Array<{
    child: Event;
    suggestedStart: Date;
    suggestedEnd: Date;
    confidence: number;
    reason: string;
  }> = [];
  
  // Get parent time span in days
  const parentStart = new Date(parentEvent.startTime);
  const parentEnd = new Date(parentEvent.endTime);
  const totalDays = Math.ceil((parentEnd.getTime() - parentStart.getTime()) / (24 * 60 * 60 * 1000));
  
  // If parent spans multiple days, suggest day-based milestones
  if (totalDays > 1 && unscheduledChildren.length > 0) {
    const daysPerChild = Math.floor(totalDays / unscheduledChildren.length);
    
    unscheduledChildren.forEach((child, index) => {
      const start = new Date(parentStart);
      start.setDate(start.getDate() + (index * daysPerChild));
      start.setHours(9, 0, 0, 0); // Start at 9 AM
      
      const end = new Date(start);
      end.setDate(end.getDate() + daysPerChild);
      end.setHours(17, 0, 0, 0); // End at 5 PM
      
      suggestions.push({
        child,
        suggestedStart: start,
        suggestedEnd: end > parentEnd ? parentEnd : end,
        confidence: 85,
        reason: `${daysPerChild}-day milestone aligned with work week`,
      });
    });
  } else {
    // Single day - distribute by hours
    const totalHours = (parentEnd.getTime() - parentStart.getTime()) / (60 * 60 * 1000);
    const hoursPerChild = Math.floor(totalHours / unscheduledChildren.length);
    
    unscheduledChildren.forEach((child, index) => {
      const start = new Date(parentStart);
      start.setTime(start.getTime() + (index * hoursPerChild * 60 * 60 * 1000));
      
      const end = new Date(start);
      end.setTime(end.getTime() + (hoursPerChild * 60 * 60 * 1000));
      
      // Round to nearest hour for cleaner schedule
      const roundedStart = new Date(start);
      roundedStart.setMinutes(0, 0, 0);
      const roundedEnd = new Date(end);
      roundedEnd.setMinutes(0, 0, 0);
      
      suggestions.push({
        child,
        suggestedStart: roundedStart,
        suggestedEnd: roundedEnd > parentEnd ? parentEnd : roundedEnd,
        confidence: 75,
        reason: `${hoursPerChild}-hour block aligned to round hours`,
      });
    });
  }
  
  return suggestions;
}

/**
 * PHASE 5C: Validate schedule against parent bounds
 * Checks if all children fit within parent time range
 */
export function validateScheduleWithinParent(
  parentEvent: Event,
  children: Event[]
): {
  isValid: boolean;
  violations: Array<{
    child: Event;
    issue: 'starts_before_parent' | 'ends_after_parent' | 'overlaps_sibling';
    message: string;
  }>;
} {
  const violations: Array<{
    child: Event;
    issue: 'starts_before_parent' | 'ends_after_parent' | 'overlaps_sibling';
    message: string;
  }> = [];
  
  const parentStart = new Date(parentEvent.startTime).getTime();
  const parentEnd = new Date(parentEvent.endTime).getTime();
  
  children.forEach((child) => {
    const childStart = new Date(child.startTime).getTime();
    const childEnd = new Date(child.endTime).getTime();
    
    // Check parent bounds
    if (childStart < parentStart) {
      violations.push({
        child,
        issue: 'starts_before_parent',
        message: `${child.title} starts before parent event`,
      });
    }
    
    if (childEnd > parentEnd) {
      violations.push({
        child,
        issue: 'ends_after_parent',
        message: `${child.title} ends after parent event`,
      });
    }
    
    // Check for overlaps with siblings
    children.forEach((sibling) => {
      if (sibling.id === child.id) return;
      
      const siblingStart = new Date(sibling.startTime).getTime();
      const siblingEnd = new Date(sibling.endTime).getTime();
      
      const overlaps = (
        (childStart >= siblingStart && childStart < siblingEnd) ||
        (childEnd > siblingStart && childEnd <= siblingEnd) ||
        (childStart <= siblingStart && childEnd >= siblingEnd)
      );
      
      if (overlaps) {
        violations.push({
          child,
          issue: 'overlaps_sibling',
          message: `${child.title} overlaps with ${sibling.title}`,
        });
      }
    });
  });
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}