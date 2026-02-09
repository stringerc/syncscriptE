/**
 * PHASE 5: Sample Event Data with Hierarchical Structure
 * 
 * Extended sample data demonstrating the new hierarchical event architecture
 * This file contains additional events with parent-child relationships
 * Uses dynamic dates relative to today for realistic demo experience
 */

import { Event, Task, Script } from './event-task-types';
import { sampleTeamMembers, sampleResources, sampleLinksNotes } from './sample-event-data';
import { CURRENT_USER } from './user-constants';

/**
 * Helper: Get date relative to today
 * This ensures demo data is always relevant and realistic
 * 
 * @param daysOffset - Days from today (negative for past, positive for future)
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
function getRelativeDate(daysOffset: number, hour: number = 9, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// ============================================================================
// PHASE 5 EXAMPLE: Tech Conference (Hierarchical Event Structure)
// Conference is 10-12 days in the future
// ============================================================================

// Tasks for primary event
export const conferenceMainTasks: Task[] = [
  {
    id: 'conf-task-1',
    title: 'Book conference venue',
    description: 'Reserve main conference hall for 3 days',
    completed: true,
    dueDate: getRelativeDate(10, 17, 0),
    parentEventId: 'event-conference-primary',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(10, 17, 0),
    archived: false,
    archiveWithParentEvent: true,
  },
  {
    id: 'conf-task-2',
    title: 'Send conference invitations',
    description: 'Email all registered attendees with conference details',
    completed: false,
    dueDate: getRelativeDate(11, 12, 0),
    parentEventId: 'event-conference-primary',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-10),
    updatedAt: getRelativeDate(10, 12, 0),
    archived: false,
    archiveWithParentEvent: true,
  },
];

// Tasks for Day 1 Keynote (sub-event)
export const day1KeynoteTasks: Task[] = [
  {
    id: 'keynote-task-1',
    title: 'Prepare keynote slides',
    description: 'Create presentation deck for opening keynote',
    completed: false,
    dueDate: getRelativeDate(14, 9, 0),
    parentEventId: 'event-conference-day1-keynote',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[0], sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-14),
    updatedAt: getRelativeDate(10, 9, 0),
    archived: false,
    archiveWithParentEvent: true,
    aiGenerated: true,
    aiConfidence: 90,
  },
  {
    id: 'keynote-task-2',
    title: 'Test AV equipment',
    description: 'Verify microphones, projectors, and screen setup',
    completed: false,
    dueDate: getRelativeDate(14, 8, 0),
    parentEventId: 'event-conference-day1-keynote',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(10, 8, 0),
    updatedAt: getRelativeDate(10, 8, 0),
    archived: false,
    archiveWithParentEvent: true,
  },
];

// Tasks for Day 2 Workshop (sub-event)
export const day2WorkshopTasks: Task[] = [
  {
    id: 'workshop-task-1',
    title: 'Print workshop materials',
    description: 'Print handouts and workbooks for all attendees',
    completed: false,
    dueDate: getRelativeDate(14, 17, 0),
    parentEventId: 'event-conference-day2-workshop',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(10, 8, 0),
    updatedAt: getRelativeDate(10, 8, 0),
    archived: false,
    archiveWithParentEvent: true,
  },
  {
    id: 'workshop-task-2',
    title: 'Set up breakout rooms',
    description: 'Arrange seating and equipment for 4 breakout sessions',
    completed: false,
    dueDate: getRelativeDate(15, 8, 0),
    parentEventId: 'event-conference-day2-workshop',
    primaryEventId: 'event-conference-primary',
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(10, 8, 0),
    updatedAt: getRelativeDate(10, 8, 0),
    archived: false,
    archiveWithParentEvent: true,
  },
];

// PRIMARY EVENT (depth 0)
export const techConferencePrimary: Event = {
  id: 'event-conference-primary',
  title: 'Tech Conference 2026',
  description: 'Annual technology conference with keynotes, workshops, and networking',
  startTime: getRelativeDate(10, 8, 0),
  endTime: getRelativeDate(12, 18, 0),
  completed: false,
  
  // PHASE 5: Hierarchy
  isPrimaryEvent: true, // This is a PRIMARY event
  depth: 0, // Root level
  childEventIds: ['event-conference-day1-keynote', 'event-conference-day2-workshop', 'event-conference-day3-networking'],
  
  // PHASE 5: Lifecycle
  archived: false,
  autoArchiveChildren: true, // When this completes, archive all children
  
  // PHASE 5: Permissions
  primaryEventCreator: CURRENT_USER.name, // Creator has full control
  inheritPermissions: false, // Top-level doesn't inherit
  
  tasks: conferenceMainTasks,
  hasScript: true,
  scriptId: 'script-conference',
  resources: [sampleResources[0]],
  linksNotes: [sampleLinksNotes[0]],
  teamMembers: sampleTeamMembers,
  createdBy: CURRENT_USER.name,
  createdAt: getRelativeDate(-5),
  updatedAt: getRelativeDate(10, 12, 0),
  lastEditedBy: 'Sarah Chen',
  allowTeamEdits: true,
  color: '#8b5cf6',
  category: 'Conference',
  eventType: 'meeting',
  location: 'Convention Center',
  rsvpEnabled: true,
  rsvpCounts: { yes: 250, no: 15, maybe: 35 },
  userRsvpStatus: 'yes',
};

// SUB-EVENT 1: Day 1 Keynote (depth 1)
export const day1Keynote: Event = {
  id: 'event-conference-day1-keynote',
  title: 'Day 1: Opening Keynote',
  description: 'Keynote presentation on future of AI and automation',
  startTime: getRelativeDate(10, 9, 0),
  endTime: getRelativeDate(10, 10, 30),
  completed: false,
  
  // PHASE 5: Hierarchy
  isPrimaryEvent: false, // This is a CHILD event
  primaryEventId: 'event-conference-primary', // Points to parent primary event
  parentEventId: 'event-conference-primary', // Immediate parent
  depth: 1, // One level down from primary
  childEventIds: [], // No children
  
  // PHASE 5: Lifecycle
  archived: false,
  autoArchiveChildren: true,
  
  // PHASE 5: Permissions
  primaryEventCreator: CURRENT_USER.name, // Same as primary event
  inheritPermissions: true, // Inherits from primary event
  permissionOverrides: [ // Sarah has editor role for this specific event
    {
      userId: 'user-2',
      role: 'editor',
    },
  ],
  
  tasks: day1KeynoteTasks,
  hasScript: false,
  resources: [],
  linksNotes: [],
  teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1]],
  createdBy: CURRENT_USER.name,
  createdAt: getRelativeDate(-10),
  updatedAt: getRelativeDate(10, 12, 0),
  allowTeamEdits: true,
  color: '#8b5cf6',
  category: 'Conference',
  eventType: 'meeting',
  location: 'Main Hall',
  rsvpEnabled: true,
  rsvpCounts: { yes: 230, no: 5, maybe: 15 },
  userRsvpStatus: 'yes',
};

// SUB-EVENT 2: Day 2 Workshop (depth 1)
export const day2Workshop: Event = {
  id: 'event-conference-day2-workshop',
  title: 'Day 2: Hands-on Workshop',
  description: 'Interactive workshop on building scalable applications',
  startTime: getRelativeDate(11, 14, 0),
  endTime: getRelativeDate(11, 17, 0),
  completed: false,
  
  // PHASE 5: Hierarchy
  isPrimaryEvent: false,
  primaryEventId: 'event-conference-primary',
  parentEventId: 'event-conference-primary',
  depth: 1,
  childEventIds: [],
  
  // PHASE 5: Lifecycle
  archived: false,
  autoArchiveChildren: true,
  
  // PHASE 5: Permissions
  primaryEventCreator: CURRENT_USER.name,
  inheritPermissions: true,
  permissionOverrides: [
    {
      userId: 'user-3',
      role: 'editor',
    },
  ],
  
  tasks: day2WorkshopTasks,
  hasScript: false,
  resources: [],
  linksNotes: [],
  teamMembers: [sampleTeamMembers[0], sampleTeamMembers[2]],
  createdBy: CURRENT_USER.name,
  createdAt: getRelativeDate(-10),
  updatedAt: getRelativeDate(10, 12, 0),
  allowTeamEdits: true,
  color: '#3b82f6',
  category: 'Conference',
  eventType: 'meeting',
  location: 'Workshop Room A',
  rsvpEnabled: true,
  rsvpCounts: { yes: 80, no: 5, maybe: 10 },
  userRsvpStatus: 'yes',
};

// SUB-EVENT 3: Day 3 Networking (depth 1)
export const day3Networking: Event = {
  id: 'event-conference-day3-networking',
  title: 'Day 3: Networking Reception',
  description: 'Evening networking event with refreshments and live music',
  startTime: getRelativeDate(12, 17, 0),
  endTime: getRelativeDate(12, 20, 0),
  completed: false,
  
  // PHASE 5: Hierarchy
  isPrimaryEvent: false,
  primaryEventId: 'event-conference-primary',
  parentEventId: 'event-conference-primary',
  depth: 1,
  childEventIds: [],
  
  // PHASE 5: Lifecycle
  archived: false,
  autoArchiveChildren: true,
  
  // PHASE 5: Permissions
  primaryEventCreator: CURRENT_USER.name,
  inheritPermissions: true,
  
  tasks: [],
  hasScript: false,
  resources: [],
  linksNotes: [],
  teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[3]],
  createdBy: CURRENT_USER.name,
  createdAt: getRelativeDate(-10),
  updatedAt: getRelativeDate(10, 12, 0),
  allowTeamEdits: true,
  color: '#f59e0b',
  category: 'Conference',
  eventType: 'social',
  location: 'Rooftop Terrace',
  rsvpEnabled: true,
  rsvpCounts: { yes: 200, no: 20, maybe: 30 },
  userRsvpStatus: 'yes',
};

// All hierarchical events combined
export const hierarchicalConferenceEvents: Event[] = [
  techConferencePrimary,
  day1Keynote,
  day2Workshop,
  day3Networking,
];

// All hierarchical tasks combined
export const hierarchicalConferenceTasks: Task[] = [
  ...conferenceMainTasks,
  ...day1KeynoteTasks,
  ...day2WorkshopTasks,
];

// Script created from the primary event
export const conferenceScript: Script = {
  id: 'script-conference',
  name: 'Tech Conference Template',
  description: 'Complete 3-day conference template with keynotes, workshops, and networking events',
  
  // PHASE 5: Primary event reference
  primaryEventId: 'event-conference-primary',
  originalEventId: 'event-conference-primary',
  templateEvent: techConferencePrimary,
  
  // PHASE 5: Hierarchy support
  includesChildEvents: true,
  childEventTemplates: [day1Keynote, day2Workshop, day3Networking],
  eventHierarchyDepth: 1,
  totalEvents: 4, // 1 primary + 3 children
  totalTasks: 7, // All tasks across hierarchy
  
  // PHASE 5: Enhanced permissions
  originalCreator: CURRENT_USER.name,
  scriptCreator: CURRENT_USER.name,
  allowCustomization: true,
  
  // PHASE 5: Marketplace support
  isPublic: true,
  price: 49.99,
  
  createdBy: CURRENT_USER.name,
  createdAt: getRelativeDate(10, 12, 0),
  updatedAt: getRelativeDate(10, 12, 0),
  isTeamScript: true,
  teamMembers: sampleTeamMembers,
  timesUsed: 12,
  rating: 4.9,
  tags: ['conference', 'multi-day', 'workshop', 'networking'],
  category: 'Events',
  allResources: [sampleResources[0]],
  allLinksNotes: [sampleLinksNotes[0]],
};

// ============================================================================
// PHASE 5: Archived Event Example (Event that has passed and been archived)
// ============================================================================

export const archivedEvent: Event = {
  id: 'event-archived-example',
  title: 'Q3 2025 Planning (ARCHIVED)',
  description: 'This event has been completed and archived',
  startTime: new Date('2025-09-15T10:00:00'),
  endTime: new Date('2025-09-15T12:00:00'),
  completed: true, // Event completed
  
  // PHASE 5: Hierarchy
  isPrimaryEvent: true,
  depth: 0,
  childEventIds: [],
  
  // PHASE 5: Lifecycle - THIS EVENT IS ARCHIVED
  archived: true,
  archivedAt: new Date('2025-09-15T12:00:00'),
  autoArchiveChildren: true,
  
  // PHASE 5: Permissions
  primaryEventCreator: CURRENT_USER.name,
  inheritPermissions: false,
  
  tasks: [],
  hasScript: false,
  resources: [],
  linksNotes: [],
  teamMembers: [sampleTeamMembers[0]],
  createdBy: CURRENT_USER.name,
  createdAt: new Date('2025-09-01'),
  updatedAt: new Date('2025-09-15'),
  allowTeamEdits: true,
  color: '#6b7280',
  category: 'Planning',
  eventType: 'meeting',
  location: 'Conference Room A',
  rsvpEnabled: false,
};

export const archivedTasks: Task[] = [
  {
    id: 'archived-task-1',
    title: 'Review Q3 metrics (ARCHIVED)',
    description: 'This task was archived when parent event completed',
    completed: false,
    dueDate: new Date('2025-09-15T09:00:00'),
    parentEventId: 'event-archived-example',
    primaryEventId: 'event-archived-example',
    
    // PHASE 5: This task was auto-archived
    archived: true,
    archivedReason: 'parent_event_completed',
    archivedAt: new Date('2025-09-15T12:00:00'),
    archiveWithParentEvent: true,
    
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2025-09-15'),
  },
];