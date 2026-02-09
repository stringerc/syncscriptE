// Enhanced goals data with Phase 1 & Phase 2 & Phase 3 features:
// PHASE 1:
// - Creator/Admin/Collaborator/Viewer roles (unified 4-tier system)
// - Key Results (measurable outcomes)
// - Enhanced milestones
// - Privacy settings
// - Activity feed
// - Confidence scores
// PHASE 2:
// - Goal alignment (parent/child relationships)
// - Check-in system with progress updates
// - Risk tracking & blockers
// - Success metrics
// - Permission-based UI controls
// PHASE 3:
// - AI-powered goal health indicators
// - Predictive analytics & success likelihood
// - Smart recommendations & proactive alerts
// - Context-aware quick actions
// - Pattern recognition & insights

export const enhancedGoalsData = [
  {
    id: '1',
    title: 'Launch Personal Finance Dashboard',
    description: 'Create a comprehensive personal finance management tool with budgeting, expense tracking, and investment monitoring features',
    category: 'Professional',
    progress: 68,
    deadline: '15 days left',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    currentUserRole: 'creator', // Jordan Smith is the creator
    isPrivate: false,
    confidenceScore: 8,
    tasks: { completed: 12, total: 18 },
    // PHASE 2: Goal Alignment
    parentGoal: null, // This is a top-level goal
    childGoals: ['1a', '1b'], // Sub-goals that contribute to this
    alignedWith: 'Grow SyncScript to 10K users', // Strategic alignment
    // PHASE 2: Check-ins
    checkIns: [
      {
        id: 'ci1',
        date: '2 days ago',
        progress: 68,
        mood: 'positive', // positive, neutral, concerned
        summary: 'Great progress on user acquisition. Hit 680 users milestone.',
        blockers: [],
        wins: ['Crossed 650 user mark', 'App store rating improved to 4.2'],
        nextSteps: ['Focus on performance optimization', 'Launch marketing campaign'],
        author: 'Jordan Smith'
      },
      {
        id: 'ci2',
        date: '1 week ago',
        progress: 62,
        mood: 'neutral',
        summary: 'Steady progress. Design system completed ahead of schedule.',
        blockers: ['Page load time still above target'],
        wins: ['Completed design system', 'Started development phase'],
        nextSteps: ['Optimize database queries', 'Implement lazy loading'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 5 days',
    // PHASE 2: Risks & Blockers
    risks: [
      {
        id: 'r1',
        title: 'Page load performance',
        description: 'Current load time of 3.2s is above target of 2s',
        severity: 'medium', // low, medium, high, critical
        status: 'active', // active, mitigating, resolved
        owner: 'Marcus Johnson',
        mitigationPlan: 'Implementing code splitting and lazy loading',
        createdAt: '1 week ago',
        updatedAt: '2 days ago'
      },
    ],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Acquire 1,000 active users', 
        currentValue: 680, 
        targetValue: 1000, 
        unit: 'users',
        progress: 68,
        owner: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
        dueDate: 'Mar 15',
        confidence: 8
      },
      { 
        id: 'kr2', 
        description: 'Achieve 4.5+ app store rating', 
        currentValue: 4.2, 
        targetValue: 4.5, 
        unit: 'stars',
        progress: 70,
        owner: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
        dueDate: 'Mar 20',
        confidence: 7
      },
      { 
        id: 'kr3', 
        description: 'Reduce page load time below 2 seconds', 
        currentValue: 3.2, 
        targetValue: 2.0, 
        unit: 'seconds',
        progress: 40,
        owner: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' },
        dueDate: 'Mar 10',
        confidence: 6
      },
    ],
    milestones: [
      { 
        id: 'm1',
        name: 'Research & Planning', 
        completed: true, 
        completedBy: 'Sarah Chen', 
        completedAt: '2 weeks ago', 
        targetDate: 'Feb 1',
        celebrationNote: 'Great start to the project!',
        assignedTo: [
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
          { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' }
        ],
        steps: [
          { id: 's1-1', title: 'Market research and competitor analysis', completed: true, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
          { id: 's1-2', title: 'Define user personas', completed: true, assignedTo: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' } },
          { id: 's1-3', title: 'Create product roadmap', completed: true, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
        ]
      },
      { 
        id: 'm2',
        name: 'Design System', 
        completed: true, 
        completedBy: 'David Kim', 
        completedAt: '1 week ago', 
        targetDate: 'Feb 15',
        celebrationNote: 'Beautiful design system created!',
        assignedTo: [
          { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' }
        ],
        steps: [
          { id: 's2-1', title: 'Design color palette and typography', completed: true, assignedTo: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' } },
          { id: 's2-2', title: 'Create component library', completed: true, assignedTo: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' } },
          { id: 's2-3', title: 'Build style guide documentation', completed: true, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
        ]
      },
      { 
        id: 'm3',
        name: 'Development', 
        completed: false, 
        current: true,
        targetDate: 'Mar 1',
        assignedTo: [
          { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' },
          { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' }
        ],
        steps: [
          { id: 's3-1', title: 'Set up development environment', completed: true, assignedTo: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' } },
          { id: 's3-2', title: 'Build core dashboard features', completed: true, assignedTo: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' } },
          { id: 's3-3', title: 'Implement data visualization charts', completed: false, assignedTo: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' } },
          { id: 's3-4', title: 'Integrate payment processing', completed: false, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
          { id: 's3-5', title: 'Add user authentication flow', completed: false, assignedTo: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' } },
        ]
      },
      { 
        id: 'm4',
        name: 'Testing & Launch', 
        completed: false,
        targetDate: 'Mar 15',
        assignedTo: [
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
          { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' }
        ],
        steps: [
          { id: 's4-1', title: 'Conduct user acceptance testing', completed: false, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
          { id: 's4-2', title: 'Fix critical bugs', completed: false, assignedTo: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' } },
          { id: 's4-3', title: 'Performance optimization', completed: false, assignedTo: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' } },
          { id: 's4-4', title: 'Deploy to production', completed: false, assignedTo: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' } },
        ]
      },
    ],
    collaborators: [
      { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'creator' },
      { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'admin' },
      { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK', progress: 80, animationType: 'bounce', status: 'online', role: 'admin' },
      { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ', progress: 68, animationType: 'heartbeat', status: 'online', role: 'collaborator' },
    ],
    activity: [
      { user: 'Sarah Chen', action: 'updated Key Result', detail: 'Active users increased from 650 to 680', time: '2 hours ago' },
      { user: 'David Kim', action: 'completed milestone', detail: 'Design System', time: '1 week ago' },
      { user: 'Jordan Smith', action: 'updated confidence', detail: 'Confidence score increased from 7 to 8', time: '3 days ago' },
      { user: 'Marcus Johnson', action: 'started milestone', detail: 'Development phase kicked off', time: '1 week ago' },
    ],
  },
  {
    id: '2',
    title: 'Read 24 Books This Year',
    description: 'Develop a consistent reading habit to expand knowledge and improve focus',
    category: 'Personal',
    progress: 45,
    deadline: '6 months left',
    status: 'on-track',
    timeHorizon: 'This Year',
    currentUserRole: 'admin', // PHASE 2: Admin role - can manage but not delete
    isPrivate: true,
    confidenceScore: 9,
    tasks: { completed: 11, total: 24 },
    currentBook: 'Atomic Habits by James Clear',
    // PHASE 2: Goal Alignment
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Personal Growth & Learning',
    // PHASE 2: Check-ins
    checkIns: [
      {
        id: 'ci1',
        date: '1 week ago',
        progress: 45,
        mood: 'positive',
        summary: 'Finished 11th book of the year! On track for Q2 goal.',
        blockers: [],
        wins: ['Completed "Deep Work" by Cal Newport', 'Maintained 30min daily reading habit'],
        nextSteps: ['Start next book', 'Update book list'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 2 weeks',
    // PHASE 2: Risks & Blockers
    risks: [],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Complete 24 books', 
        currentValue: 11, 
        targetValue: 24, 
        unit: 'books',
        progress: 46,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Dec 31',
        confidence: 9
      },
      { 
        id: 'kr2', 
        description: 'Read 30 minutes daily', 
        currentValue: 25, 
        targetValue: 30, 
        unit: 'min/day',
        progress: 83,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Ongoing',
        confidence: 9
      },
    ],
    milestones: [
      { id: 'm1', name: '6 Books (Q1)', completed: true, completedBy: 'Jordan Smith', completedAt: '1 month ago', targetDate: 'Mar 31', celebrationNote: 'Great Q1 progress!', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm2', name: '12 Books (Q2)', completed: false, current: true, targetDate: 'Jun 30', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm3', name: '18 Books (Q3)', completed: false, targetDate: 'Sep 30', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm4', name: '24 Books (Q4)', completed: false, targetDate: 'Dec 31', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
    ],
    collaborators: [
      { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'owner' },
    ],
    activity: [
      { user: 'Jordan Smith', action: 'completed book', detail: 'Finished "Deep Work" by Cal Newport', time: '3 days ago' },
      { user: 'Jordan Smith', action: 'started book', detail: 'Started "Atomic Habits" by James Clear', time: '3 days ago' },
    ],
  },
  {
    id: '2.5',
    title: 'Stay Within $1,000 Weekly Budget',
    description: 'Maintain healthy spending habits with weekly budget tracking (50/30/20 rule: needs/wants/savings)',
    category: 'Financial',
    progress: 60,
    deadline: 'Ongoing - Weekly Review',
    status: 'at-risk',
    timeHorizon: 'This Month',
    currentUserRole: 'collaborator', // PHASE 2: Collaborator role - can update progress
    isPrivate: false,
    confidenceScore: 6,
    currentSpend: '$750',
    weeklyLimit: '$1,000',
    overBudget: '$167',
    // PHASE 2: Goal Alignment
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Financial Independence & Security',
    // PHASE 2: Check-ins
    checkIns: [
      {
        id: 'ci1',
        date: '1 day ago',
        progress: 60,
        mood: 'concerned',
        summary: 'Spending trending 25% over budget this week. Need to adjust discretionary expenses.',
        blockers: ['Unexpected car repair ($200)', 'Social events this week'],
        wins: ['Tracked all expenses', 'Identified spending patterns'],
        nextSteps: ['Limit dining out rest of week', 'Review recurring subscriptions', 'Set up automated alerts'],
        author: 'Jordan Smith'
      },
      {
        id: 'ci2',
        date: '1 week ago',
        progress: 75,
        mood: 'positive',
        summary: 'Great week! Came in $50 under budget.',
        blockers: [],
        wins: ['Meal prepped for the week', 'Avoided impulse purchases', 'Used 50/30/20 rule successfully'],
        nextSteps: ['Continue meal planning', 'Maintain expense tracking habit'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 6 days (Weekly Review)',
    // PHASE 2: Risks & Blockers
    risks: [
      {
        id: 'r1',
        title: 'Discretionary spending trending high',
        description: 'Dining out and entertainment expenses 40% above target',
        severity: 'medium',
        status: 'active',
        owner: 'Jordan Smith',
        mitigationPlan: 'Set $150 weekly limit for discretionary spending with daily tracking',
        createdAt: '2 days ago',
        updatedAt: '1 day ago'
      },
    ],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Stay under $1,000 weekly spending', 
        currentValue: 750, 
        targetValue: 1000, 
        unit: 'dollars/week',
        progress: 75, // 75% spent
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Weekly',
        confidence: 6
      },
      { 
        id: 'kr2', 
        description: 'Allocate 50% to needs ($500)', 
        currentValue: 525, 
        targetValue: 500, 
        unit: 'dollars',
        progress: 105, // Over target
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Weekly',
        confidence: 5
      },
      { 
        id: 'kr3', 
        description: 'Allocate 30% to wants ($300)', 
        currentValue: 350, 
        targetValue: 300, 
        unit: 'dollars',
        progress: 117, // Over target - at risk
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Weekly',
        confidence: 4
      },
      { 
        id: 'kr4', 
        description: 'Save 20% weekly ($200)', 
        currentValue: 125, 
        targetValue: 200, 
        unit: 'dollars',
        progress: 63, // Under target
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Weekly',
        confidence: 6
      },
    ],
    milestones: [
      { id: 'm1', name: '4 Weeks Under Budget', completed: true, completedBy: 'Jordan Smith', completedAt: '2 weeks ago', targetDate: 'Week 4', celebrationNote: 'First month success!', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm2', name: '8 Weeks Under Budget', completed: false, current: true, targetDate: 'Week 8', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm3', name: '12 Weeks Under Budget', completed: false, targetDate: 'Week 12', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm4', name: '6 Months Consistent', completed: false, targetDate: 'Week 24', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
    ],
    collaborators: [
      { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'owner' },
      { name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', fallback: 'ER', progress: 78, animationType: 'wiggle', status: 'away', role: 'accountability-partner' },
    ],
    activity: [
      { user: 'Jordan Smith', action: 'logged expense', detail: 'Car repair: $200 (Unexpected)', time: '1 day ago' },
      { user: 'Jordan Smith', action: 'reviewed spending', detail: 'Weekly budget check - trending over', time: '1 day ago' },
      { user: 'Jordan Smith', action: 'updated budget', detail: 'Reduced discretionary spending target', time: '2 days ago' },
    ],
  },
  {
    id: '3',
    title: 'Save $10,000 Emergency Fund',
    description: 'Build financial security with a fully-funded emergency fund',
    category: 'Financial',
    progress: 72,
    deadline: 'On track for Q3',
    status: 'ahead',
    timeHorizon: 'This Year',
    currentUserRole: 'creator', // PHASE 2: Creator role - full control
    isPrivate: false,
    confidenceScore: 9,
    currentAmount: '$7,200',
    targetAmount: '$10,000',
    // PHASE 2: Goal Alignment
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Financial Independence & Security',
    // PHASE 2: Check-ins
    checkIns: [
      {
        id: 'ci1',
        date: '5 days ago',
        progress: 72,
        mood: 'positive',
        summary: 'Added $500 this month. Ahead of schedule!',
        blockers: [],
        wins: ['Hit $7,200 milestone', 'Maintained consistent monthly savings'],
        nextSteps: ['Continue $500/month deposits', 'Review investment options'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 3 weeks',
    // PHASE 2: Risks & Blockers
    risks: [],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Reach $10,000 savings', 
        currentValue: 7200, 
        targetValue: 10000, 
        unit: 'dollars',
        progress: 72,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Sep 30',
        confidence: 9
      },
      { 
        id: 'kr2', 
        description: 'Save $500 monthly', 
        currentValue: 500, 
        targetValue: 500, 
        unit: 'dollars/month',
        progress: 100,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Ongoing',
        confidence: 10
        },
    ],
    milestones: [
      { id: 'm1', name: '$2,500 Saved', completed: true, completedBy: 'Jordan Smith', completedAt: '4 months ago', targetDate: 'Jan 31', celebrationNote: 'First milestone achieved!', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm2', name: '$5,000 Saved', completed: true, completedBy: 'Jordan Smith', completedAt: '2 months ago', targetDate: 'Apr 30', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm3', name: '$7,500 Saved', completed: false, current: true, targetDate: 'Jul 31', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm4', name: '$10,000 Saved', completed: false, targetDate: 'Sep 30', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
    ],
    collaborators: [
      { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'owner' },
      { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ', progress: 68, animationType: 'heartbeat', status: 'online', role: 'contributor' },
      { name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', fallback: 'ER', progress: 78, animationType: 'wiggle', status: 'away', role: 'contributor' },
    ],
    activity: [
      { user: 'Jordan Smith', action: 'added funds', detail: '$500 deposited to emergency fund', time: '5 days ago' },
      { user: 'Jordan Smith', action: 'reached milestone', detail: '$7,000 mark crossed', time: '1 week ago' },
    ],
  },
  {
    id: '4',
    title: 'Exercise 5x Per Week',
    description: 'Build a sustainable fitness habit with consistent weekly workouts',
    category: 'Health',
    progress: 85,
    deadline: 'Ongoing',
    status: 'on-track',
    timeHorizon: 'This Year',
    currentUserRole: 'viewer', // PHASE 2: Viewer role - read-only access
    isPrivate: false,
    confidenceScore: 8,
    streak: 23,
    thisWeek: 4,
    location: 'Gold\'s Gym',
    // PHASE 2: Goal Alignment
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Health & Wellness',
    // PHASE 2: Check-ins
    checkIns: [
      {
        id: 'ci1',
        date: '1 day ago',
        progress: 85,
        mood: 'positive',
        summary: '23-day streak! Feeling strong and energized.',
        blockers: [],
        wins: ['Completed 4 workouts this week', 'Hit 23-day streak milestone'],
        nextSteps: ['Complete 5th workout this week', 'Try new HIIT routine'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 1 week',
    // PHASE 2: Risks & Blockers
    risks: [],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Work out 260 times this year', 
        currentValue: 145, 
        targetValue: 260, 
        unit: 'workouts',
        progress: 56,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Dec 31',
        confidence: 8
      },
      { 
        id: 'kr2', 
        description: 'Maintain 23+ day streak', 
        currentValue: 23, 
        targetValue: 30, 
        unit: 'days',
        progress: 77,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Ongoing',
        confidence: 8
      },
    ],
    milestones: [
      { id: 'm1', name: '50 Workouts', completed: true, completedBy: 'Jordan Smith', completedAt: '2 months ago', targetDate: 'Mar 31', celebrationNote: 'Consistency building!', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm2', name: '100 Workouts', completed: true, completedBy: 'Jordan Smith', completedAt: '3 weeks ago', targetDate: 'Jun 30', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm3', name: '150 Workouts', completed: false, current: true, targetDate: 'Aug 31', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
      { id: 'm4', name: '260 Workouts', completed: false, targetDate: 'Dec 31', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }] },
    ],
    collaborators: [
      { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'owner' },
      { name: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', fallback: 'ER', progress: 78, animationType: 'wiggle', status: 'away', role: 'contributor' },
      { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'contributor' },
    ],
    activity: [
      { user: 'Jordan Smith', action: 'completed workout', detail: '45-min strength training session', time: '4 hours ago' },
      { user: 'Jordan Smith', action: 'streak milestone', detail: '23-day streak achieved!', time: '1 day ago' },
    ],
  },

  // ==================== PRODUCT TEAM GOALS ====================
  {
    id: 'team-goal-001',
    title: 'Launch MVP by End of Q1',
    description: 'Complete and launch minimum viable product with core features for Product Team',
    category: 'Professional',
    progress: 65,
    deadline: '23 days left',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    currentUserRole: 'creator',
    isPrivate: false,
    confidenceScore: 8,
    tasks: { completed: 18, total: 28 },
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Product Strategy 2026',
    checkIns: [
      {
        id: 'ci1',
        date: '3 days ago',
        progress: 65,
        mood: 'positive',
        summary: 'Development sprint going well. API integration complete, user testing starting next week.',
        blockers: [],
        wins: ['API integration finished', 'Design system approved'],
        nextSteps: ['Begin user testing', 'Finalize MVP feature list'],
        author: 'Jordan Smith'
      },
    ],
    nextCheckIn: 'In 4 days',
    risks: [],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Complete 28 MVP tasks', 
        currentValue: 18, 
        targetValue: 28, 
        unit: 'tasks',
        progress: 64,
        owner: { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
        dueDate: 'Jan 31',
        confidence: 8
      },
      { 
        id: 'kr2', 
        description: 'Recruit 50 beta testers', 
        currentValue: 32, 
        targetValue: 50, 
        unit: 'users',
        progress: 64,
        owner: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
        dueDate: 'Jan 25',
        confidence: 7
      },
      { 
        id: 'kr3', 
        description: 'Achieve 90% test coverage', 
        currentValue: 78, 
        targetValue: 90, 
        unit: 'percent',
        progress: 87,
        owner: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
        dueDate: 'Jan 28',
        confidence: 9
      },
    ],
    milestones: [
      { 
        id: 'm1',
        name: 'Planning & Design', 
        completed: true, 
        completedBy: 'Sarah Chen', 
        completedAt: '3 weeks ago', 
        targetDate: 'Dec 20',
        celebrationNote: 'Great foundation laid!',
        assignedTo: [
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
          { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }
        ],
      },
      { 
        id: 'm2',
        name: 'Core Development', 
        completed: true, 
        completedBy: 'David Kim', 
        completedAt: '1 week ago', 
        targetDate: 'Jan 10',
        celebrationNote: 'Development on track!',
        assignedTo: [
          { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
          { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }
        ],
      },
      { 
        id: 'm3',
        name: 'User Testing', 
        completed: false, 
        current: true,
        targetDate: 'Jan 20',
        assignedTo: [
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
          { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }
        ],
      },
      { 
        id: 'm4',
        name: 'Launch Prep', 
        completed: false,
        targetDate: 'Jan 31',
        assignedTo: [
          { name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' },
          { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
          { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' }
        ],
      },
    ],
    collaborators: [
      { id: 'user_001', name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'creator' },
      { id: 'user_002', name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'admin' },
      { id: 'user_005', name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK', progress: 80, animationType: 'bounce', status: 'online', role: 'collaborator' },
    ],
    activity: [
      { user: 'David Kim', action: 'completed milestone', detail: 'Core Development finished', time: '1 week ago' },
      { user: 'Sarah Chen', action: 'updated Key Result', detail: 'Beta testers: 32/50', time: '2 days ago' },
      { user: 'Jordan Smith', action: 'check-in posted', detail: 'Sprint status update', time: '3 days ago' },
    ],
  },

  {
    id: 'team-goal-002',
    title: 'Achieve 4.5+ Product Rating',
    description: 'Deliver exceptional user experience to achieve high product rating from early adopters',
    category: 'Professional',
    progress: 42,
    deadline: '45 days left',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    currentUserRole: 'collaborator',
    isPrivate: false,
    confidenceScore: 7,
    tasks: { completed: 8, total: 15 },
    parentGoal: null,
    childGoals: [],
    alignedWith: 'Product Excellence',
    checkIns: [
      {
        id: 'ci1',
        date: '1 week ago',
        progress: 42,
        mood: 'neutral',
        summary: 'Good feedback from initial users. Need to address performance concerns.',
        blockers: ['Page load time issues'],
        wins: ['Positive feedback on design', 'Easy onboarding praised'],
        nextSteps: ['Optimize performance', 'Add requested features'],
        author: 'Sarah Chen'
      },
    ],
    nextCheckIn: 'In 1 week',
    risks: [
      {
        id: 'r1',
        title: 'Performance optimization needed',
        description: 'Current performance may impact ratings',
        severity: 'medium',
        status: 'active',
        owner: 'David Kim',
        mitigationPlan: 'Sprint focused on performance improvements',
        createdAt: '1 week ago',
        updatedAt: '3 days ago'
      },
    ],
    keyResults: [
      { 
        id: 'kr1', 
        description: 'Achieve 4.5+ average rating', 
        currentValue: 3.8, 
        targetValue: 4.5, 
        unit: 'stars',
        progress: 42,
        owner: { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' },
        dueDate: 'Feb 15',
        confidence: 7
      },
      { 
        id: 'kr2', 
        description: 'Reduce bounce rate below 20%', 
        currentValue: 35, 
        targetValue: 20, 
        unit: 'percent',
        progress: 43,
        owner: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
        dueDate: 'Feb 10',
        confidence: 6
      },
    ],
    milestones: [
      { id: 'm1', name: 'UX Research', completed: true, completedBy: 'Sarah Chen', completedAt: '2 weeks ago', targetDate: 'Jan 5', assignedTo: [{ name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' }] },
      { id: 'm2', name: 'Performance Optimization', completed: false, current: true, targetDate: 'Jan 25', assignedTo: [{ name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' }] },
      { id: 'm3', name: 'Feature Polish', completed: false, targetDate: 'Feb 5', assignedTo: [{ name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS' }, { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' }] },
      { id: 'm4', name: 'Rating Campaign', completed: false, targetDate: 'Feb 15', assignedTo: [{ name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC' }] },
    ],
    collaborators: [
      { id: 'user_002', name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'creator' },
      { id: 'user_001', name: 'Jordan Smith', image: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=100', fallback: 'JS', progress: 85, animationType: 'glow', status: 'online', role: 'admin' },
      { id: 'user_005', name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK', progress: 80, animationType: 'bounce', status: 'online', role: 'collaborator' },
    ],
    activity: [
      { user: 'Sarah Chen', action: 'added risk', detail: 'Performance optimization needed', time: '1 week ago' },
      { user: 'David Kim', action: 'started milestone', detail: 'Performance Optimization', time: '5 days ago' },
    ],
  },
];

// Sub-goals (child goals) that contribute to parent goals
export const subGoalsData = [
  {
    id: '1a',
    title: 'Build User Onboarding Flow',
    description: 'Create smooth onboarding experience for new users',
    category: 'Professional',
    progress: 75,
    deadline: '5 days left',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    currentUserRole: 'admin', // PHASE 2: Admin role - can manage but not delete
    isPrivate: false,
    confidenceScore: 8,
    parentGoal: '1', // Parent: Launch Personal Finance Dashboard
    alignedWith: 'Launch Personal Finance Dashboard',
    tasks: { completed: 6, total: 8 },
    keyResults: [
      {
        id: 'kr1',
        description: 'Complete onboarding screens',
        currentValue: 5,
        targetValue: 6,
        unit: 'screens',
        progress: 83,
        owner: { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK' },
        dueDate: 'Mar 5',
        confidence: 9
      },
    ],
    collaborators: [
      { name: 'David Kim', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', fallback: 'DK', progress: 80, animationType: 'bounce', status: 'online', role: 'owner' },
      { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'champion' },
    ],
  },
  {
    id: '1b',
    title: 'Implement Security Features',
    description: 'Add authentication and data encryption',
    category: 'Professional',
    progress: 60,
    deadline: '10 days left',
    status: 'on-track',
    timeHorizon: 'This Quarter',
    currentUserRole: 'champion',
    isPrivate: false,
    confidenceScore: 7,
    parentGoal: '1', // Parent: Launch Personal Finance Dashboard
    alignedWith: 'Launch Personal Finance Dashboard',
    tasks: { completed: 3, total: 5 },
    keyResults: [
      {
        id: 'kr1',
        description: 'Implement OAuth 2.0',
        currentValue: 80,
        targetValue: 100,
        unit: 'percent',
        progress: 80,
        owner: { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ' },
        dueDate: 'Mar 8',
        confidence: 7
      },
    ],
    collaborators: [
      { name: 'Marcus Johnson', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', fallback: 'MJ', progress: 68, animationType: 'heartbeat', status: 'online', role: 'owner' },
      { name: 'Sarah Chen', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', fallback: 'SC', progress: 72, animationType: 'pulse', status: 'online', role: 'champion' },
    ],
  },
];