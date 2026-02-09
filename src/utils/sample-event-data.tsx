/**
 * Sample Event and Task Data
 * 
 * Mock data for demonstrating the event/task/script system
 * Uses dynamic dates relative to today for realistic demo experience
 */

import { Event, Task, Script, TeamMember, Resource, LinkNote } from './event-task-types';
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

// Sample team members
export const sampleTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    avatar: CURRENT_USER.avatar,
    role: 'admin',
    progress: 75,
    animation: 'pulse',
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@syncscript.ai',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    role: 'member',
    progress: 90,
    animation: 'glow',
  },
  {
    id: 'user-3',
    name: 'Marcus Johnson',
    email: 'marcus.j@syncscript.ai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    role: 'member',
    progress: 60,
    animation: 'heartbeat',
  },
  {
    id: 'user-4',
    name: 'Emily Rodriguez',
    email: 'emily.r@syncscript.ai',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    role: 'viewer',
    progress: 45,
    animation: 'wiggle',
  },
];

// Sample resources
export const sampleResources: Resource[] = [
  {
    id: 'res-1',
    name: 'Q4 Strategy Presentation.pdf',
    type: 'document',
    url: '#',
    uploadedBy: 'Sarah Chen',
    uploadedAt: getRelativeDate(-5),
    size: 2457600,
  },
  {
    id: 'res-2',
    name: 'Product Roadmap.png',
    type: 'image',
    url: '#',
    uploadedBy: CURRENT_USER.name,
    uploadedAt: getRelativeDate(-4),
    size: 1048576,
    thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  },
];

// Sample links and notes
export const sampleLinksNotes: LinkNote[] = [
  {
    id: 'link-1',
    type: 'link',
    title: 'Figma Design File',
    content: 'https://figma.com/design/example',
    createdBy: 'Sarah Chen',
    createdAt: getRelativeDate(-5),
  },
  {
    id: 'note-1',
    type: 'note',
    title: 'Key Discussion Points',
    content: '1. Review Q3 metrics\n2. Set Q4 goals\n3. Team capacity planning\n4. Budget allocation',
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-4),
  },
];

// Sample tasks with subtasks
export const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Prepare presentation slides',
    description: 'Create comprehensive slides for Q4 planning meeting',
    completed: true,
    dueDate: getRelativeDate(1),
    parentEventId: 'event-1',
    prepForEventId: 'event-1',
    prepForEventName: 'Q4 Planning Meeting',
    
    // PHASE 5: Enhanced hierarchy and lifecycle
    primaryEventId: 'event-1', // This event is its own primary
    archived: false,
    archiveWithParentEvent: true, // Default: auto-archive when parent completes
    
    subtasks: [
      {
        id: 'subtask-1-1',
        title: 'Research Q3 performance data',
        completed: true,
        subtasks: [],
        resources: [],
        linksNotes: [],
        assignedTo: [],
        createdBy: CURRENT_USER.name,
        createdAt: getRelativeDate(-3),
        updatedAt: getRelativeDate(-2),
        archived: false,
        archiveWithParentEvent: true,
      },
      {
        id: 'subtask-1-2',
        title: 'Create data visualizations',
        completed: true,
        subtasks: [],
        resources: [],
        linksNotes: [],
        assignedTo: [],
        createdBy: CURRENT_USER.name,
        createdAt: getRelativeDate(-3),
        updatedAt: getRelativeDate(-2),
        archived: false,
        archiveWithParentEvent: true,
      },
    ],
    resources: [sampleResources[0]],
    linksNotes: [sampleLinksNotes[0]],
    assignedTo: [sampleTeamMembers[0], sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(-1),
    aiGenerated: true,
    aiConfidence: 92,
  },
  {
    id: 'task-2',
    title: 'Set up meeting room and equipment',
    description: 'Reserve conference room and test A/V equipment',
    completed: true,
    dueDate: getRelativeDate(1),
    parentEventId: 'event-1',
    prepForEventId: 'event-1',
    prepForEventName: 'Q4 Planning Meeting',
    
    // PHASE 5: Enhanced hierarchy and lifecycle
    primaryEventId: 'event-1',
    archived: false,
    archiveWithParentEvent: true,
    
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(1),
  },
  {
    id: 'task-3',
    title: 'Send agenda to participants',
    description: 'Email detailed agenda 24h before meeting',
    completed: false,
    dueDate: getRelativeDate(0),
    parentEventId: 'event-1',
    prepForEventId: 'event-1',
    prepForEventName: 'Q4 Planning Meeting',
    
    // PHASE 5: Enhanced hierarchy and lifecycle
    primaryEventId: 'event-1',
    archived: false,
    archiveWithParentEvent: true,
    
    subtasks: [],
    resources: [],
    linksNotes: [sampleLinksNotes[1]],
    assignedTo: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(-1),
    aiGenerated: true,
    aiConfidence: 88,
  },
  {
    id: 'task-4',
    title: 'Gather department reports',
    description: 'Collect latest reports from all department heads',
    completed: false,
    dueDate: getRelativeDate(0),
    parentEventId: 'event-1',
    prepForEventId: 'event-1',
    prepForEventName: 'Q4 Planning Meeting',
    
    // PHASE 5: Enhanced hierarchy and lifecycle
    primaryEventId: 'event-1',
    archived: false,
    archiveWithParentEvent: true,
    
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-3),
    updatedAt: getRelativeDate(-2),
  },
];

// Sample events
export const sampleEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Q4 Planning Meeting',
    description: 'Strategic planning session for Q4 objectives and team alignment',
    startTime: getRelativeDate(1),
    endTime: getRelativeDate(1, 12),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: sampleTasks,
    hasScript: true,
    scriptId: 'script-1',
    resources: [sampleResources[1]],
    linksNotes: [sampleLinksNotes[0]],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-7),
    updatedAt: getRelativeDate(-1),
    lastEditedBy: 'Sarah Chen',
    allowTeamEdits: true,
    color: '#8b5cf6',
    category: 'Planning',
    eventType: 'meeting',
    location: 'Conference Room A',
    rsvpEnabled: true,
    rsvpCounts: { yes: 8, no: 1, maybe: 2 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-2',
    title: 'Client Demo - TechCorp',
    description: 'Product demonstration for TechCorp stakeholders',
    startTime: getRelativeDate(2, 14),
    endTime: getRelativeDate(2, 15, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [
      {
        id: 'task-5',
        title: 'Prepare demo environment',
        completed: false,
        subtasks: [],
        resources: [],
        linksNotes: [],
        assignedTo: [sampleTeamMembers[2]],
        createdBy: CURRENT_USER.name,
        createdAt: getRelativeDate(-2),
        updatedAt: getRelativeDate(-1),
        parentEventId: 'event-2',
        prepForEventId: 'event-2',
        prepForEventName: 'Client Demo - TechCorp',
      },
      {
        id: 'task-6',
        title: 'Create demo script',
        completed: true,
        subtasks: [],
        resources: [],
        linksNotes: [],
        assignedTo: [sampleTeamMembers[0]],
        createdBy: CURRENT_USER.name,
        createdAt: getRelativeDate(-2),
        updatedAt: getRelativeDate(-1),
        parentEventId: 'event-2',
        prepForEventId: 'event-2',
        prepForEventName: 'Client Demo - TechCorp',
      },
    ],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: true,
    color: '#3b82f6',
    category: 'Client Meeting',
    eventType: 'meeting',
    location: 'Virtual - Zoom',
    rsvpEnabled: true,
    rsvpCounts: { yes: 4, no: 0, maybe: 1 },
    userRsvpStatus: 'maybe',
  },
  {
    id: 'event-3',
    title: 'Team Standup',
    description: 'Daily sync and blockers discussion',
    startTime: getRelativeDate(1),
    endTime: getRelativeDate(1, 9, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: sampleTeamMembers,
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: false,
    color: '#10b981',
    category: 'Team Sync',
    eventType: 'meeting',
    location: 'Office - Dev Room',
    rsvpEnabled: true,
    rsvpCounts: { yes: 12, no: 0, maybe: 0 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-4',
    title: 'MVP Launch Deadline',
    description: 'Final deadline for MVP release',
    startTime: getRelativeDate(6, 23, 59),
    endTime: getRelativeDate(6, 23, 59),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-30),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: false,
    color: '#ef4444',
    category: 'Milestone',
    eventType: 'deadline',
    rsvpEnabled: false,
  },
  {
    id: 'event-5',
    title: 'Team Coffee Chat',
    description: 'Casual catch-up and bonding time',
    startTime: getRelativeDate(4, 15),
    endTime: getRelativeDate(4, 15, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[3]],
    createdBy: 'Sarah Chen',
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: true,
    color: '#f59e0b',
    category: 'Social',
    eventType: 'social',
    location: 'Office Cafe',
    rsvpEnabled: true,
    rsvpCounts: { yes: 6, no: 1, maybe: 2 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-6',
    title: 'Design Review Session',
    description: 'Review new dashboard designs and provide feedback',
    startTime: getRelativeDate(3, 14, 30),
    endTime: getRelativeDate(3, 15, 15),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1]],
    createdBy: 'Sarah Chen',
    createdAt: getRelativeDate(-4),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#8b5cf6',
    category: 'Design',
    eventType: 'meeting',
    location: 'Design Studio',
    rsvpEnabled: true,
    rsvpCounts: { yes: 5, no: 0, maybe: 1 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-7',
    title: 'Focus: Deep Work on Code Refactoring',
    description: 'Dedicated time for refactoring the calendar intelligence module',
    startTime: getRelativeDate(1, 14),
    endTime: getRelativeDate(1, 16, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-4),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: false,
    color: '#8b5cf6',
    category: 'Engineering',
    eventType: 'deadline',
    location: 'Home Office',
    rsvpEnabled: false,
  },
  {
    id: 'event-8',
    title: 'Quick Sync with PM',
    description: 'Brief status update on current sprint',
    startTime: getRelativeDate(1, 12),
    endTime: getRelativeDate(1, 12, 15),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#3b82f6',
    category: 'Team Sync',
    eventType: 'meeting',
    location: 'Virtual - Slack Huddle',
    rsvpEnabled: false,
  },
  // Additional events to show calendar widget features
  {
    id: 'event-9',
    title: 'Morning Workout',
    description: 'Gym session',
    startTime: getRelativeDate(-4, 7),
    endTime: getRelativeDate(-4, 8),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-5),
    updatedAt: getRelativeDate(-5),
    allowTeamEdits: false,
    color: '#10b981',
    category: 'Personal',
    eventType: 'social',
    location: 'Fitness Center',
    rsvpEnabled: false,
  },
  {
    id: 'event-10',
    title: 'Sprint Planning',
    description: 'Plan next two-week sprint',
    startTime: getRelativeDate(7, 10),
    endTime: getRelativeDate(7, 12),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: sampleTeamMembers,
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#8b5cf6',
    category: 'Planning',
    eventType: 'meeting',
    location: 'Conference Room A',
    rsvpEnabled: true,
    rsvpCounts: { yes: 10, no: 0, maybe: 2 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-11',
    title: 'Code Review Session',
    description: 'Review PRs from the week',
    startTime: getRelativeDate(3, 16),
    endTime: getRelativeDate(3, 17),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#3b82f6',
    category: 'Engineering',
    eventType: 'meeting',
    location: 'Virtual - Zoom',
    rsvpEnabled: false,
  },
  {
    id: 'event-12',
    title: 'Budget Review Meeting',
    description: 'Q4 budget allocation discussion',
    startTime: getRelativeDate(8, 14),
    endTime: getRelativeDate(8, 15, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#ef4444',
    category: 'Finance',
    eventType: 'meeting',
    location: 'Executive Room',
    rsvpEnabled: true,
    rsvpCounts: { yes: 5, no: 0, maybe: 1 },
    userRsvpStatus: 'yes',
  },
  {
    id: 'event-13',
    title: 'Lunch with Sarah',
    description: 'Catch up over lunch',
    startTime: getRelativeDate(2, 12, 30),
    endTime: getRelativeDate(2, 13, 30),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[1]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: false,
    color: '#f59e0b',
    category: 'Social',
    eventType: 'social',
    location: 'Downtown Cafe',
    rsvpEnabled: false,
  },
  {
    id: 'event-14',
    title: 'Product Launch Preparation',
    description: 'Final prep before product launch',
    startTime: getRelativeDate(9, 9),
    endTime: getRelativeDate(9, 11),
    completed: false, // PHASE 3: Will be auto-completed when endTime passes
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: sampleTeamMembers,
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(0),
    updatedAt: getRelativeDate(0),
    allowTeamEdits: true,
    color: '#8b5cf6',
    category: 'Product',
    eventType: 'deadline',
    location: 'Main Office',
    rsvpEnabled: true,
    rsvpCounts: { yes: 15, no: 0, maybe: 3 },
    userRsvpStatus: 'yes',
  },
  // DEMO EVENTS - Visual Differentiation Showcase (using relative dates for today)
  {
    id: 'event-demo-meeting',
    title: 'Team Standup',
    description: 'Daily sync with the team',
    startTime: getRelativeDate(0, 9, 0), // Today at 9:00 AM
    endTime: getRelativeDate(0, 9, 30), // Today at 9:30 AM
    completed: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: true,
    color: '#8b5cf6',
    category: 'Team Sync',
    eventType: 'meeting', // Will show as EVENT (purple, solid border)
    location: 'Conference Room B',
    rsvpEnabled: true,
    rsvpCounts: { yes: 3, no: 0, maybe: 0 },
    userRsvpStatus: 'yes',
    // PHASE 5 fields
    isPrimaryEvent: true,
    primaryEventId: undefined,
    parentEventId: undefined,
    childEventIds: [],
    depth: 0,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
  },
  {
    id: 'event-demo-task',
    title: 'Review Designs',
    description: 'Review new dashboard designs with team',
    startTime: getRelativeDate(0, 14, 0), // Today at 2:00 PM
    endTime: getRelativeDate(0, 15, 0), // Today at 3:00 PM
    completed: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]], // Solo work
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: false,
    color: '#10b981',
    category: 'Work', // Contains "work" keyword → TASK
    eventType: 'deadline', // Deadlines are tasks
    location: 'Home Office',
    rsvpEnabled: false,
    createdFromTaskId: 'task-converted-123', // Created from task → TASK
    // PHASE 5 fields
    isPrimaryEvent: true,
    primaryEventId: undefined,
    parentEventId: undefined,
    childEventIds: [],
    depth: 0,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    // PHASE 5E: Horizontal positioning (demonstrate conflict resolution)
    xPosition: 0, // Left column (Q1)
    width: 50, // Half width
  },
  {
    id: 'event-demo-goal',
    title: 'Q1 Revenue Milestone Reached',
    description: 'Celebrate reaching our Q1 revenue target of $500K',
    startTime: getRelativeDate(0, 14, 0), // Today at 2:00 PM
    endTime: getRelativeDate(0, 14, 30), // Today at 2:30 PM
    completed: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-10),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: true,
    color: '#eab308',
    category: 'Milestone', // Contains "milestone" → GOAL
    eventType: 'social',
    location: 'Office - Main Floor',
    rsvpEnabled: true,
    rsvpCounts: { yes: 15, no: 0, maybe: 2 },
    userRsvpStatus: 'yes',
    // PHASE 5 fields
    isPrimaryEvent: true,
    primaryEventId: undefined,
    parentEventId: undefined,
    childEventIds: [],
    depth: 0,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    // PHASE 5E: Horizontal positioning (demonstrate conflict resolution)
    xPosition: 50, // Right column (Q3) - avoids overlap with Review Designs
    width: 50, // Half width
  },
  {
    id: 'event-demo-task-2',
    title: 'Write Documentation',
    description: 'Update API documentation for new endpoints',
    startTime: getRelativeDate(0, 15, 0), // Today at 3:00 PM
    endTime: getRelativeDate(0, 16, 30), // Today at 4:30 PM
    completed: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: false,
    color: '#10b981',
    category: 'Task', // Explicit "task" category → TASK
    eventType: 'deadline',
    location: 'Home Office',
    rsvpEnabled: false,
    // PHASE 5 fields
    isPrimaryEvent: true,
    primaryEventId: undefined,
    parentEventId: undefined,
    childEventIds: ['milestone-doc-1', 'milestone-doc-2', 'milestone-doc-3'],
    depth: 0,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    // PHASE 5E: Horizontal positioning (full width - no conflicts at this time)
    xPosition: 0, // Full width
    width: 100, // Full width
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MILESTONES FOR "WRITE DOCUMENTATION" EVENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'milestone-doc-1',
    title: 'Research API Changes',
    description: 'Review all API endpoint changes from last sprint',
    startTime: getRelativeDate(0, 15, 0), // 3:00 PM
    endTime: getRelativeDate(0, 15, 20), // 3:20 PM
    completed: true,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: false,
    color: '#14b8a6',
    category: 'Task',
    eventType: 'task',
    location: 'Home Office',
    rsvpEnabled: false,
    // Hierarchy: This is a MILESTONE
    isPrimaryEvent: false,
    hierarchyType: 'milestone',
    primaryEventId: 'event-demo-task-2',
    parentEventId: 'event-demo-task-2',
    childEventIds: [],
    depth: 1,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    xPosition: 0,
    width: 100,
  },
  {
    id: 'milestone-doc-2',
    title: 'Write Endpoint Descriptions',
    description: 'Document all new endpoints with examples',
    startTime: getRelativeDate(0, 15, 20), // 3:20 PM
    endTime: getRelativeDate(0, 16, 0), // 4:00 PM
    completed: true,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: false,
    color: '#14b8a6',
    category: 'Task',
    eventType: 'task',
    location: 'Home Office',
    rsvpEnabled: false,
    // Hierarchy: This is a MILESTONE
    isPrimaryEvent: false,
    hierarchyType: 'milestone',
    primaryEventId: 'event-demo-task-2',
    parentEventId: 'event-demo-task-2',
    childEventIds: [],
    depth: 1,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    xPosition: 0,
    width: 100,
  },
  {
    id: 'milestone-doc-3',
    title: 'Review & Publish',
    description: 'Final review and publish to documentation site',
    startTime: getRelativeDate(0, 16, 0), // 4:00 PM
    endTime: getRelativeDate(0, 16, 30), // 4:30 PM
    completed: false,
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    allowTeamEdits: false,
    color: '#14b8a6',
    category: 'Task',
    eventType: 'task',
    location: 'Home Office',
    rsvpEnabled: false,
    // Hierarchy: This is a MILESTONE
    isPrimaryEvent: false,
    hierarchyType: 'milestone',
    primaryEventId: 'event-demo-task-2',
    parentEventId: 'event-demo-task-2',
    childEventIds: [],
    depth: 1,
    archived: false,
    autoArchiveChildren: true,
    inheritPermissions: true,
    xPosition: 0,
    width: 100,
  },
];

// Sample scripts
export const sampleScripts: Script[] = [
  {
    id: 'script-1',
    name: 'Quarterly Planning Meeting Template',
    description: 'Complete workflow for quarterly planning sessions with all preparation tasks',
    originalEventId: 'event-1',
    templateEvent: sampleEvents[0],
    createdBy: CURRENT_USER.name,
    createdAt: getRelativeDate(-1),
    updatedAt: getRelativeDate(-1),
    isTeamScript: true,
    teamMembers: [sampleTeamMembers[0], sampleTeamMembers[1]],
    timesUsed: 3,
    rating: 4.8,
    tags: ['planning', 'strategy', 'quarterly'],
    category: 'Meetings',
    allResources: [sampleResources[0], sampleResources[1]],
    allLinksNotes: sampleLinksNotes,
  },
];

/**
 * Helper function to create a new empty event
 */
export function createEmptyEvent(): Partial<Event> {
  return {
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    completed: false,
    
    // PHASE 5: Hierarchy defaults
    isPrimaryEvent: true, // New events are primary by default
    depth: 0,
    childEventIds: [],
    
    // PHASE 5: Lifecycle defaults
    archived: false,
    autoArchiveChildren: true, // Auto-archive children when this completes
    
    // PHASE 5: Permission defaults
    primaryEventCreator: CURRENT_USER.name,
    inheritPermissions: false, // Top-level doesn't inherit
    
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]], // Current user
    createdBy: CURRENT_USER.name,
    createdAt: new Date(),
    updatedAt: new Date(),
    allowTeamEdits: true,
  };
}

/**
 * Helper function to create a new empty task
 */
export function createEmptyTask(parentEventId?: string, prepForEventName?: string): Partial<Task> {
  return {
    title: '',
    description: '',
    completed: false,
    
    // PHASE 5: Lifecycle defaults
    archived: false,
    archiveWithParentEvent: true, // Default: archive when parent completes
    
    subtasks: [],
    resources: [],
    linksNotes: [],
    assignedTo: [],
    createdBy: CURRENT_USER.name,
    createdAt: new Date(),
    updatedAt: new Date(),
    parentEventId,
    prepForEventId: parentEventId,
    prepForEventName,
    primaryEventId: parentEventId, // Same as parent for simple cases
  };
}

/**
 * PHASE 5: Helper function to create a child event
 */
export function createChildEvent(parentEvent: Event): Partial<Event> {
  return {
    title: '',
    description: '',
    startTime: parentEvent.startTime,
    endTime: parentEvent.endTime,
    completed: false,
    
    // PHASE 5: Hierarchy - this is a CHILD event
    isPrimaryEvent: false,
    primaryEventId: parentEvent.isPrimaryEvent ? parentEvent.id : parentEvent.primaryEventId,
    parentEventId: parentEvent.id,
    depth: parentEvent.depth + 1,
    childEventIds: [],
    
    // PHASE 5: Lifecycle
    archived: false,
    autoArchiveChildren: true,
    
    // PHASE 5: Permissions - inherit from parent
    primaryEventCreator: parentEvent.primaryEventCreator || parentEvent.createdBy,
    inheritPermissions: true, // Child events inherit by default
    
    tasks: [],
    hasScript: false,
    resources: [],
    linksNotes: [],
    teamMembers: [sampleTeamMembers[0]],
    createdBy: CURRENT_USER.name,
    createdAt: new Date(),
    updatedAt: new Date(),
    allowTeamEdits: parentEvent.allowTeamEdits,
    color: parentEvent.color,
    category: parentEvent.category,
  };
}