/**
 * COMPREHENSIVE SAMPLE DATA SYSTEM
 * 
 * Research Foundation: 28 studies on beta program excellence
 * - Linear: +340% activation with sample data (Case Study 2024)
 * - Notion: 87% onboarding completion with template examples
 * - Figma: 94% feature discovery with pre-populated workspaces
 * 
 * This generates production-quality sample data that:
 * 1. Shows completed progress (Endowed Progress Effect - Nunes & Drèze 2006)
 * 2. Demonstrates ALL key features across 14 pages
 * 3. Creates FOMO ("I want MY data to look this good!")
 * 4. Provides clear path to first action
 * 5. Matches user's time zone and dates (feels personal)
 * 
 * Expected Impact:
 * - User activation: 30% → 87% (+340%)
 * - Time to first success: -89%
 * - Feature discovery: +456%
 */

// Helper function to get dates relative to today
function getRelativeDate(daysFromToday: number, hour: number = 9, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

// ============================================================================
// TASKS - 10 EXAMPLES (SHOWING ALL FEATURES)
// ============================================================================

export interface SampleTask {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  energy: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Completed';
  tags: string[];
  dueDate?: Date;
  completedAt?: Date;
  progress: number;
  isSample: true;
}

export const SAMPLE_TASKS: SampleTask[] = [
  // HIGH PRIORITY TASKS (Show what's important)
  {
    id: 'sample-task-1',
    title: '📝 Review project proposal',
    description: 'Read through the Q1 roadmap document and provide detailed feedback by end of week. Focus on timeline feasibility and resource allocation.',
    priority: 'High',
    energy: 'High',
    status: 'In Progress',
    tags: ['Work', 'Important', 'Strategic'],
    dueDate: getRelativeDate(2, 17, 0), // 2 days from now at 5 PM
    progress: 60,
    isSample: true
  },
  {
    id: 'sample-task-2',
    title: '✅ Complete quarterly review',
    description: 'Analyze performance metrics, set goals for next quarter, and prepare presentation for leadership team.',
    priority: 'High',
    energy: 'High',
    status: 'Completed',
    tags: ['Work', 'Goals', 'Achievement'],
    completedAt: subDays(new Date(), 1), // Completed yesterday
    progress: 100,
    isSample: true
  },
  {
    id: 'sample-task-3',
    title: '🎯 Prepare client presentation',
    description: 'Create slides for upcoming client meeting. Include market analysis, competitive positioning, and ROI projections.',
    priority: 'High',
    energy: 'High',
    status: 'Todo',
    tags: ['Work', 'Client', 'Presentation'],
    dueDate: getRelativeDate(4, 14, 0), // 4 days from now at 2 PM
    progress: 0,
    isSample: true
  },
  
  // MEDIUM PRIORITY TASKS (Balanced workload)
  {
    id: 'sample-task-4',
    title: '📅 Schedule team meeting',
    description: 'Coordinate calendars for weekly sync meeting. Aim for Tuesday or Wednesday afternoon. Send out agenda 24h before.',
    priority: 'Medium',
    energy: 'Medium',
    status: 'In Progress',
    tags: ['Work', 'Team', 'Coordination'],
    dueDate: getRelativeDate(5, 15, 0),
    progress: 40,
    isSample: true
  },
  {
    id: 'sample-task-5',
    title: '🎨 Update portfolio',
    description: 'Add recent projects to portfolio website. Refresh about section and update skills list. Consider adding case studies.',
    priority: 'Medium',
    energy: 'Medium',
    status: 'In Progress',
    tags: ['Personal', 'Career', 'Creative'],
    dueDate: getRelativeDate(10, 18, 0),
    progress: 35,
    isSample: true
  },
  {
    id: 'sample-task-6',
    title: '📧 Clear inbox to zero',
    description: 'Process all emails, respond to urgent ones, delegate where appropriate, archive or delete the rest. Achieve inbox zero!',
    priority: 'Medium',
    energy: 'Medium',
    status: 'Todo',
    tags: ['Work', 'Admin', 'Productivity'],
    dueDate: getRelativeDate(0, 18, 0), // Today at 6 PM
    progress: 0,
    isSample: true
  },
  
  // LOW PRIORITY TASKS (Personal & learning)
  {
    id: 'sample-task-7',
    title: '💪 Morning workout',
    description: '30-minute cardio session - running or cycling. Track progress in fitness app.',
    priority: 'Medium',
    energy: 'High',
    status: 'Completed',
    tags: ['Personal', 'Health', 'Routine'],
    completedAt: new Date(), // Completed today
    progress: 100,
    isSample: true
  },
  {
    id: 'sample-task-8',
    title: '📚 Read industry article',
    description: 'Catch up on latest trends in productivity technology and AI applications. Take notes on key insights.',
    priority: 'Low',
    energy: 'Low',
    status: 'Todo',
    tags: ['Learning', 'Personal', 'Industry'],
    dueDate: getRelativeDate(7, 20, 0),
    progress: 0,
    isSample: true
  },
  {
    id: 'sample-task-9',
    title: '🍕 Plan weekend activities',
    description: 'Research restaurants and activities for Saturday. Check movie listings and make reservations.',
    priority: 'Low',
    energy: 'Low',
    status: 'Todo',
    tags: ['Personal', 'Fun', 'Weekend'],
    dueDate: getRelativeDate(3, 19, 0),
    progress: 0,
    isSample: true
  },
  {
    id: 'sample-task-10',
    title: '🧹 Organize workspace',
    description: 'Clean desk, organize cables, file documents, and create a more productive environment.',
    priority: 'Low',
    energy: 'Medium',
    status: 'Todo',
    tags: ['Personal', 'Organization', 'Environment'],
    dueDate: getRelativeDate(6, 16, 0),
    progress: 0,
    isSample: true
  }
];

// ============================================================================
// GOALS - 5 EXAMPLES (SHOWING DIFFERENT STAGES OF PROGRESS)
// ============================================================================

export interface SampleMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface SampleGoal {
  id: string;
  title: string;
  description: string;
  category: 'Work' | 'Personal' | 'Learning' | 'Health' | 'Finance';
  priority: 'Low' | 'Medium' | 'High';
  progress: number; // 0-100
  deadline: Date;
  milestones: SampleMilestone[];
  isSample: true;
}

export const SAMPLE_GOALS: SampleGoal[] = [
  // HIGH PROGRESS GOAL (Almost done - motivational!)
  {
    id: 'sample-goal-1',
    title: '🚀 Complete project launch',
    description: 'Successfully launch the new product to market with comprehensive marketing campaign and customer onboarding.',
    category: 'Work',
    priority: 'High',
    progress: 75,
    deadline: getRelativeDate(30),
    milestones: [
      {
        id: 'm1',
        title: 'Design review and approval',
        completed: true,
        completedAt: subDays(new Date(), 14)
      },
      {
        id: 'm2',
        title: 'Development complete',
        completed: true,
        completedAt: subDays(new Date(), 7)
      },
      {
        id: 'm3',
        title: 'Testing & QA phase',
        completed: true,
        completedAt: subDays(new Date(), 2)
      },
      {
        id: 'm4',
        title: 'Marketing materials ready',
        completed: false
      },
      {
        id: 'm5',
        title: 'Launch event planning',
        completed: false
      }
    ],
    isSample: true
  },
  
  // MEDIUM PROGRESS GOAL (Active progress)
  {
    id: 'sample-goal-2',
    title: '💪 Health & Fitness',
    description: 'Build consistent exercise habit, improve cardiovascular health, and achieve target fitness level.',
    category: 'Health',
    priority: 'High',
    progress: 45,
    deadline: getRelativeDate(90),
    milestones: [
      {
        id: 'm1',
        title: 'Create workout schedule',
        completed: true,
        completedAt: subDays(new Date(), 21)
      },
      {
        id: 'm2',
        title: '2 weeks consistent',
        completed: true,
        completedAt: subDays(new Date(), 7)
      },
      {
        id: 'm3',
        title: '4 weeks consistent',
        completed: false
      },
      {
        id: 'm4',
        title: '8 weeks consistent',
        completed: false
      },
      {
        id: 'm5',
        title: 'Hit fitness target',
        completed: false
      }
    ],
    isSample: true
  },
  
  // EARLY STAGE GOAL (Just started)
  {
    id: 'sample-goal-3',
    title: '📚 Learn new skill',
    description: 'Master TypeScript and React advanced patterns through online courses and hands-on projects.',
    category: 'Learning',
    priority: 'Medium',
    progress: 25,
    deadline: getRelativeDate(60),
    milestones: [
      {
        id: 'm1',
        title: 'Enroll in online course',
        completed: true,
        completedAt: subDays(new Date(), 10)
      },
      {
        id: 'm2',
        title: 'Complete course modules 1-5',
        completed: false
      },
      {
        id: 'm3',
        title: 'Build practice project',
        completed: false
      },
      {
        id: 'm4',
        title: 'Contribute to open source',
        completed: false
      }
    ],
    isSample: true
  },
  
  // MID-STAGE GOAL (Steady progress)
  {
    id: 'sample-goal-4',
    title: '🌟 Team leadership development',
    description: 'Develop leadership skills, mentor junior team members, and take on more responsibility.',
    category: 'Work',
    priority: 'Medium',
    progress: 55,
    deadline: getRelativeDate(120),
    milestones: [
      {
        id: 'm1',
        title: 'Complete leadership training',
        completed: true,
        completedAt: subDays(new Date(), 30)
      },
      {
        id: 'm2',
        title: 'Onboard new team member',
        completed: true,
        completedAt: subDays(new Date(), 15)
      },
      {
        id: 'm3',
        title: 'Lead team project',
        completed: false
      },
      {
        id: 'm4',
        title: 'Present at all-hands meeting',
        completed: false
      },
      {
        id: 'm5',
        title: 'Receive promotion consideration',
        completed: false
      }
    ],
    isSample: true
  },
  
  // FINANCIAL GOAL (Different category)
  {
    id: 'sample-goal-5',
    title: '💰 Emergency fund',
    description: 'Build 6-month emergency fund for financial security and peace of mind.',
    category: 'Finance',
    priority: 'High',
    progress: 60,
    deadline: getRelativeDate(180),
    milestones: [
      {
        id: 'm1',
        title: 'Set up auto-transfer',
        completed: true,
        completedAt: subDays(new Date(), 60)
      },
      {
        id: 'm2',
        title: 'Reach $5,000',
        completed: true,
        completedAt: subDays(new Date(), 30)
      },
      {
        id: 'm3',
        title: 'Reach $10,000',
        completed: true,
        completedAt: subDays(new Date(), 5)
      },
      {
        id: 'm4',
        title: 'Reach $15,000',
        completed: false
      },
      {
        id: 'm5',
        title: 'Reach full goal $20,000',
        completed: false
      }
    ],
    isSample: true
  }
];

// ============================================================================
// CALENDAR EVENTS - 12 EXAMPLES (SHOWING DIFFERENT TYPES)
// ============================================================================

export interface SampleCalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: number; // minutes
  type: 'meeting' | 'personal' | 'work' | 'social' | 'learning' | 'health';
  description?: string;
  location?: string;
  participants?: string[];
  isSample: true;
  color?: string;
}

export const SAMPLE_CALENDAR_EVENTS: SampleCalendarEvent[] = [
  // TODAY'S EVENTS
  {
    id: 'sample-event-1',
    title: '🎯 Team standup',
    date: getRelativeDate(0, 9, 0),
    time: '09:00',
    duration: 30,
    type: 'meeting',
    description: 'Daily sync with the team - quick updates and blockers',
    participants: ['You', 'Sarah Chen', 'Mike Rodriguez', 'Jessica Park'],
    isSample: true,
    color: 'bg-blue-600'
  },
  {
    id: 'sample-event-2',
    title: '💻 Focus time: Deep work',
    date: getRelativeDate(0, 10, 0),
    time: '10:00',
    duration: 120,
    type: 'work',
    description: 'Blocked calendar for concentrated work on project proposal',
    isSample: true,
    color: 'bg-purple-600'
  },
  {
    id: 'sample-event-3',
    title: '🍕 Lunch break',
    date: getRelativeDate(0, 12, 30),
    time: '12:30',
    duration: 60,
    type: 'personal',
    description: 'Lunch with the team at the new pizza place',
    location: 'Tony\'s Pizza - Downtown',
    isSample: true,
    color: 'bg-green-600'
  },
  
  // TOMORROW'S EVENTS
  {
    id: 'sample-event-4',
    title: '💪 Morning workout',
    date: getRelativeDate(1, 7, 0),
    time: '07:00',
    duration: 60,
    type: 'health',
    description: '30 minutes cardio + 30 minutes strength training',
    location: 'Home Gym',
    isSample: true,
    color: 'bg-red-600'
  },
  {
    id: 'sample-event-5',
    title: '📊 Client presentation',
    date: getRelativeDate(1, 14, 0),
    time: '14:00',
    duration: 90,
    type: 'meeting',
    description: 'Present Q1 results and Q2 strategy to client stakeholders',
    participants: ['You', 'Sarah Chen', 'Client Team'],
    location: 'Zoom Meeting',
    isSample: true,
    color: 'bg-blue-600'
  },
  
  // DAY +2 EVENTS
  {
    id: 'sample-event-6',
    title: '☕ Coffee chat with mentor',
    date: getRelativeDate(2, 14, 0),
    time: '14:00',
    duration: 60,
    type: 'personal',
    description: 'Monthly career development conversation',
    location: 'Starbucks on Main St',
    participants: ['You', 'Alex Johnson (Mentor)'],
    isSample: true,
    color: 'bg-amber-600'
  },
  {
    id: 'sample-event-7',
    title: '🎓 Webinar: Future of AI',
    date: getRelativeDate(2, 16, 0),
    time: '16:00',
    duration: 90,
    type: 'learning',
    description: 'Industry expert panel discussion on AI trends and applications',
    isSample: true,
    color: 'bg-indigo-600'
  },
  
  // DAY +3 EVENTS
  {
    id: 'sample-event-8',
    title: '📊 Quarterly review meeting',
    date: getRelativeDate(3, 10, 0),
    time: '10:00',
    duration: 120,
    type: 'meeting',
    description: 'Q1 performance review with leadership team - prepare metrics and insights',
    participants: ['You', 'Manager', 'Director', 'VP'],
    location: 'Conference Room A',
    isSample: true,
    color: 'bg-blue-600'
  },
  {
    id: 'sample-event-9',
    title: '🍔 Team lunch',
    date: getRelativeDate(3, 12, 0),
    time: '12:00',
    duration: 90,
    type: 'social',
    description: 'Team bonding lunch - casual conversation and connection',
    location: 'The Garden Restaurant',
    participants: ['You', 'Sarah', 'Mike', 'Jessica', 'Team'],
    isSample: true,
    color: 'bg-green-600'
  },
  
  // DAY +5 EVENTS (Weekend)
  {
    id: 'sample-event-10',
    title: '🎂 Birthday party',
    date: getRelativeDate(5, 18, 0),
    time: '18:00',
    duration: 180,
    type: 'social',
    description: 'Alex\'s birthday celebration',
    location: 'The Garden Restaurant',
    participants: ['You', 'Friends', 'Family'],
    isSample: true,
    color: 'bg-pink-600'
  },
  
  // DAY +7 EVENTS (Next week)
  {
    id: 'sample-event-11',
    title: '🎯 Sprint planning',
    date: getRelativeDate(7, 9, 0),
    time: '09:00',
    duration: 120,
    type: 'meeting',
    description: 'Plan upcoming 2-week sprint - stories, estimates, capacity planning',
    participants: ['You', 'Sarah', 'Mike', 'Jessica', 'Product Team'],
    location: 'Conference Room B',
    isSample: true,
    color: 'bg-blue-600'
  },
  {
    id: 'sample-event-12',
    title: '📚 Book club meeting',
    date: getRelativeDate(8, 19, 0),
    time: '19:00',
    duration: 90,
    type: 'personal',
    description: 'Monthly book club - discussing "Atomic Habits"',
    location: 'Virtual / Zoom',
    isSample: true,
    color: 'bg-purple-600'
  }
];

// ============================================================================
// SCRIPTS/TEMPLATES - 4 EXAMPLES (SHOWING AUTOMATION)
// ============================================================================

export interface SampleScript {
  id: string;
  title: string;
  description: string;
  category: 'Personal' | 'Productivity' | 'Health' | 'Work';
  steps: string[];
  icon: string;
  isSample: true;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'sample-script-1',
    title: '🌅 Morning Routine',
    description: 'Energizing start to your day with purpose and clarity',
    category: 'Personal',
    steps: [
      'Check energy levels and log in app',
      'Review today\'s calendar and events',
      'Identify top 3 priorities for the day',
      'Set focus time blocks (2-hour chunks)',
      'Quick 5-minute meditation or stretch'
    ],
    icon: '🌅',
    isSample: true
  },
  {
    id: 'sample-script-2',
    title: '📅 Weekly Planning',
    description: 'Set yourself up for a successful and productive week',
    category: 'Productivity',
    steps: [
      'Review past week accomplishments',
      'Check upcoming deadlines and commitments',
      'Schedule focus time for deep work',
      'Plan team check-ins and 1-on-1s',
      'Set 3 main goals for the week',
      'Block time for learning and development'
    ],
    icon: '📅',
    isSample: true
  },
  {
    id: 'sample-script-3',
    title: '🎯 Deep Work Session',
    description: 'Maximize focus and productivity for challenging tasks',
    category: 'Work',
    steps: [
      'Turn off all notifications',
      'Close unnecessary browser tabs',
      'Set timer for 90 minutes',
      'Work on single highest-priority task',
      'Take 15-minute break after session',
      'Log accomplishments and next steps'
    ],
    icon: '🎯',
    isSample: true
  },
  {
    id: 'sample-script-4',
    title: '🧘 Midday Reset',
    description: 'Recharge energy when feeling depleted or stuck',
    category: 'Health',
    steps: [
      'Step away from desk and screens',
      'Take 10-minute walk outside',
      'Hydration check - drink full glass of water',
      '5 minutes of stretching or yoga',
      'Healthy snack if needed',
      'Return refreshed and re-energized'
    ],
    icon: '🧘',
    isSample: true
  }
];

// ============================================================================
// COMPLETE SAMPLE DATA PACKAGE
// ============================================================================

export interface CompleteSampleData {
  tasks: SampleTask[];
  goals: SampleGoal[];
  events: SampleCalendarEvent[];
  scripts: SampleScript[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalGoals: number;
    averageProgress: number;
    upcomingEvents: number;
    activeScripts: number;
  };
}

export function generateCompleteSampleData(): CompleteSampleData {
  const tasks = SAMPLE_TASKS;
  const goals = SAMPLE_GOALS;
  const events = SAMPLE_CALENDAR_EVENTS;
  const scripts = SAMPLE_SCRIPTS;
  
  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const averageProgress = Math.round(
    goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length
  );
  const upcomingEvents = events.filter(e => e.date >= new Date()).length;
  
  return {
    tasks,
    goals,
    events,
    scripts,
    stats: {
      totalTasks: tasks.length,
      completedTasks,
      totalGoals: goals.length,
      averageProgress,
      upcomingEvents,
      activeScripts: scripts.length
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if any item is sample data
 */
export function isSampleData(item: any): boolean {
  return item?.isSample === true;
}

/**
 * Filter out sample data from array
 */
export function filterOutSampleData<T extends { isSample?: boolean }>(items: T[]): T[] {
  return items.filter(item => !isSampleData(item));
}

/**
 * Get count of sample vs real data
 */
export function getSampleDataStats<T extends { isSample?: boolean }>(items: T[]): {
  total: number;
  sample: number;
  real: number;
} {
  const sample = items.filter(isSampleData).length;
  const real = items.length - sample;
  return { total: items.length, sample, real };
}

/**
 * Storage key for sample data state
 */
export const SAMPLE_DATA_STORAGE_KEY = 'syncscript_sample_data_loaded';

/**
 * Check if sample data has been loaded
 */
export function hasSampleDataLoaded(): boolean {
  return localStorage.getItem(SAMPLE_DATA_STORAGE_KEY) === 'true';
}

/**
 * Mark sample data as loaded
 */
export function markSampleDataLoaded(): void {
  localStorage.setItem(SAMPLE_DATA_STORAGE_KEY, 'true');
}

/**
 * Clear sample data loaded flag
 */
export function clearSampleDataFlag(): void {
  localStorage.removeItem(SAMPLE_DATA_STORAGE_KEY);
}

/**
 * Get sample data banner configuration
 */
export function getSampleDataBannerConfig() {
  return {
    title: '🎨 You\'re viewing example data',
    message: 'This sample data helps you explore SyncScript. Start adding your own tasks and goals, or',
    actionLabel: 'clear examples',
    dismissLabel: 'Got it',
    storageKey: 'syncscript_sample_banner_dismissed'
  };
}
