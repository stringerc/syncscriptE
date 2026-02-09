import { AIInsightsContent } from '../components/AIInsightsSection';

export type PageKey = 
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'ai-assistant'
  | 'energy'
  | 'resonance'
  | 'team'
  | 'analytics'
  | 'gamification'
  | 'integrations'
  | 'enterprise'
  | 'scripts'
  | 'features'
  | 'settings'
  | 'projects';

export interface PageInsightsConfig {
  title: string;
  insights: {
    title: string;
    value: string;
    icon?: 'brain' | 'target' | 'zap' | 'clock' | 'trending';
    description?: string;
  }[];
}

export const PAGE_INSIGHTS_CONFIG: Record<PageKey, PageInsightsConfig> = {
  // Tab 1: Dashboard (Home)
  dashboard: {
    title: 'System Resonance Overview',
    insights: [
      {
        title: 'Overall System Resonance',
        value: '0.82',
        icon: 'brain',
        description: 'Strong alignment across all domains',
      },
      {
        title: 'Biggest Win Today',
        value: 'Deep Work Block',
        icon: 'trending',
        description: '2-4 PM perfectly aligned with peak energy',
      },
      {
        title: 'Biggest Issue Today',
        value: 'Meeting Clash',
        icon: 'clock',
        description: '10 AM meeting during optimal focus time',
      },
      {
        title: 'Optimization #1',
        value: 'Move Code Review',
        icon: 'target',
        description: 'Shift from 9 AM → 2 PM (+0.15 resonance)',
      },
      {
        title: 'Optimization #2',
        value: 'Add Break Buffer',
        icon: 'zap',
        description: '15min break after 10 AM meeting',
      },
      {
        title: 'Optimization #3',
        value: 'Batch Email Time',
        icon: 'clock',
        description: 'Consolidate to 8-9 AM low-energy window',
      },
      {
        title: '📊 Multi-Domain Heatmap',
        value: 'Graph 1',
        icon: 'brain',
        description: 'Why: Shows where domains align/misalign by time | Value: Identifies optimal windows and conflicts at a glance',
      },
      {
        title: '📈 System Amplitude Timeline',
        value: 'Graph 2',
        icon: 'trending',
        description: 'Why: Tracks quality potential over time | Value: Shows if Resonance improvements translate to outcomes',
      },
      {
        title: '🎯 Phase Alignment Radar',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Quick visual of which domains need attention | Value: Prioritizes where to focus next',
      },
    ],
  },

  // Tab 2: Tasks
  tasks: {
    title: 'Task Resonance Optimization',
    insights: [
      {
        title: 'Task Resonance',
        value: '0.78',
        icon: 'target',
        description: 'Good task alignment and amplification',
      },
      {
        title: 'Highest-Impact Move',
        value: 'Shift Code Review',
        icon: 'brain',
        description: '9 AM → 2 PM (+0.15 resonance)',
      },
      {
        title: 'Suggestion #1',
        value: 'Deep Work: 2-4 PM',
        icon: 'clock',
        description: 'Align complex tasks with peak energy',
      },
      {
        title: 'Suggestion #2',
        value: 'Email: 8-9 AM',
        icon: 'zap',
        description: 'Admin during low-energy morning',
      },
      {
        title: 'Suggestion #3',
        value: 'Planning: 9-10 AM',
        icon: 'target',
        description: 'Creative work during rising energy',
      },
      {
        title: '⏰ Task-Time Resonance Curve',
        value: 'Graph 1',
        icon: 'clock',
        description: 'Why: Identifies optimal timing per task type | Value: Actionable timing guidance',
      },
      {
        title: '✅ Task Quality vs Resonance',
        value: 'Graph 2',
        icon: 'trending',
        description: 'Why: Validates that Resonance predicts outcomes | Value: Builds trust and shows correlation strength',
      },
      {
        title: '🔗 Task Interference Pattern',
        value: 'Graph 3',
        icon: 'brain',
        description: 'Why: Visualizes which tasks pair well/conflict | Value: Helps cluster compatible tasks',
      },
    ],
  },

  // Tab 3: Calendar
  calendar: {
    title: 'Calendar Resonance Optimization',
    insights: [
      {
        title: 'Calendar Resonance',
        value: '0.65',
        icon: 'clock',
        description: 'Moderate event alignment quality',
      },
      {
        title: 'Most Destructive Event',
        value: 'Team Sync @ 10 AM',
        icon: 'brain',
        description: 'Causes -0.25 resonance drop',
      },
      {
        title: 'Suggestion #1',
        value: 'Move Team Sync → 11 AM',
        icon: 'target',
        description: 'Expected: +0.18 resonance',
      },
      {
        title: 'Suggestion #2',
        value: 'Shorten 1:1s to 30min',
        icon: 'zap',
        description: 'Expected: +0.12 resonance',
      },
      {
        title: 'Suggestion #3',
        value: 'Meeting-Free: 2-4 PM',
        icon: 'trending',
        description: 'Protected time: +0.20 resonance',
      },
      {
        title: '📊 Calendar Density vs Resonance',
        value: 'Graph 1',
        icon: 'clock',
        description: 'Why: Finds the right event density for peak Resonance | Value: Prevents over-scheduling at wrong times',
      },
      {
        title: '🔄 Event Type Resonance Matrix',
        value: 'Graph 2',
        icon: 'brain',
        description: 'Why: Shows which event types pair well | Value: Enables better meeting/break/work pairings',
      },
      {
        title: '🎯 Schedule Optimization Impact',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Shows potential improvement from changes | Value: Clear ROI for rescheduling decisions',
      },
    ],
  },

  // Tab 4: Energy & Focus
  energy: {
    title: 'Energy Resonance & Amplitude',
    insights: [
      {
        title: 'Energy Resonance',
        value: '0.85',
        icon: 'zap',
        description: 'Excellent amplitude alignment with work',
      },
      {
        title: 'Peak Energy Window',
        value: '2-4 PM Daily',
        icon: 'trending',
        description: 'Highest energy and focus alignment',
      },
      {
        title: 'Suggestion #1',
        value: 'Schedule Deep Work',
        icon: 'target',
        description: 'Reserve 2-4 PM for complex tasks',
      },
      {
        title: 'Suggestion #2',
        value: 'Morning Ramp-Up',
        icon: 'clock',
        description: '8-10 AM: warming up with lighter tasks',
      },
      {
        title: 'Suggestion #3',
        value: 'Post-Lunch Meetings',
        icon: 'brain',
        description: '1-2 PM: meetings during energy dip',
      },
      {
        title: '🔥 Phase Alignment Heatmap',
        value: 'Graph 1: Time × Day',
        icon: 'clock',
        description: 'Why: Identifies the best windows for deep work | Value: Actionable scheduling guidance',
      },
      {
        title: '📊 Quality Score by Resonance',
        value: 'Graph 2',
        icon: 'trending',
        description: 'Why: Confirms high-Resonance work produces better outcomes | Value: Validates the approach',
      },
      {
        title: '⚡ Amplitude & Resonance Link',
        value: 'Graph 3',
        icon: 'zap',
        description: 'Why: Shows if Resonance drives amplitude | Value: Reinforces why Resonance matters',
      },
    ],
  },

  // Tab 5: Enterprise (Financial & Budget)
  enterprise: {
    title: 'Financial Resonance Optimization',
    insights: [
      {
        title: 'Financial Resonance',
        value: '0.72',
        icon: 'trending',
        description: 'Good spending/income timing alignment',
      },
      {
        title: 'Most Impactful Misalignment',
        value: 'Subscription Renewals',
        icon: 'clock',
        description: 'Clash with low-revenue periods',
      },
      {
        title: 'Suggestion #1',
        value: 'Align Renewals',
        icon: 'target',
        description: 'Move to high-cash-flow months',
      },
      {
        title: 'Suggestion #2',
        value: 'Batch Discretionary Spend',
        icon: 'brain',
        description: 'Schedule during income peaks',
      },
      {
        title: 'Suggestion #3',
        value: 'Review Allocation',
        icon: 'zap',
        description: 'Shift 10% from low-ROI to high-ROI',
      },
      {
        title: '💰 Income-Expense Resonance',
        value: 'Graph 1',
        icon: 'trending',
        description: 'Why: Shows cash flow timing alignment | Value: Identifies cash flow issues',
      },
      {
        title: '📊 Budget Category Matrix',
        value: 'Graph 2',
        icon: 'brain',
        description: 'Why: Shows which categories amplify vs cancel value | Value: Guides spending allocation',
      },
      {
        title: '✅ Decision Quality vs Resonance',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Confirms high-Resonance spending yields better ROI | Value: Justifies timing-based decisions',
      },
    ],
  },

  // Tab 6: Team & Collaboration
  team: {
    title: 'Team Resonance Optimization',
    insights: [
      {
        title: 'Team Resonance',
        value: '0.73',
        icon: 'target',
        description: 'Moderate cross-member alignment',
      },
      {
        title: 'Members Out of Phase',
        value: 'Sarah & Mike',
        icon: 'brain',
        description: '2 of 8 with scheduling conflicts',
      },
      {
        title: 'Suggestion #1',
        value: 'Optimal Meeting: 11 AM',
        icon: 'clock',
        description: 'Best overlap for all members',
      },
      {
        title: 'Suggestion #2',
        value: 'Pair You + Emma',
        icon: 'zap',
        description: 'High resonance (0.92) pairing',
      },
      {
        title: 'Suggestion #3',
        value: 'Reduce Sarah-Mike Work',
        icon: 'trending',
        description: 'Low resonance (0.65) reduces efficiency',
      },
      {
        title: '👥 Team Schedule Alignment',
        value: 'Graph 1',
        icon: 'clock',
        description: 'Why: Shows optimal collaboration windows | Value: Identifies the best times for team work',
      },
      {
        title: '🔗 Cross-Person Resonance',
        value: 'Graph 2',
        icon: 'brain',
        description: 'Why: Shows which members create constructive interference | Value: Guides team pairing',
      },
      {
        title: '✅ Collaboration Quality',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Links team Resonance to outcomes | Value: Demonstrates the impact of alignment',
      },
    ],
  },

  // Tab 7: Analytics
  analytics: {
    title: 'Resonance Analytics & Patterns',
    insights: [
      {
        title: 'Analytics Resonance',
        value: '0.88',
        icon: 'trending',
        description: 'High system-wide optimization',
      },
      {
        title: 'Most Impactful Pattern',
        value: 'Morning Deep Work',
        icon: 'brain',
        description: '10-12 AM: +0.20 resonance',
      },
      {
        title: 'Suggestion #1',
        value: 'Replicate Tuesday',
        icon: 'target',
        description: 'Tuesday shows highest weekly resonance',
      },
      {
        title: 'Suggestion #2',
        value: 'Avoid Friday Overload',
        icon: 'clock',
        description: 'Fridays: -0.15 from over-scheduling',
      },
      {
        title: 'Suggestion #3',
        value: 'Energy × Tasks Focus',
        icon: 'zap',
        description: 'This pair drives +0.32 impact',
      },
      {
        title: '📈 Multi-Domain Timeline',
        value: 'Graph 1',
        icon: 'trending',
        description: 'Why: Shows Resonance evolution across domains | Value: Tracks progress and trends',
      },
      {
        title: '🔍 Resonance Contribution',
        value: 'Graph 2',
        icon: 'brain',
        description: 'Why: Shows which domain pairs drive system Resonance | Value: Prioritizes optimization efforts',
      },
      {
        title: '📊 Quality Improvement Link',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Confirms Resonance improvements correlate with quality gains | Value: Validates with data',
      },
    ],
  },

  // Tab 8: AI Assistant
  'ai-assistant': {
    title: 'AI Resonance & Learning',
    insights: [
      {
        title: 'AI Resonance',
        value: '0.87',
        icon: 'brain',
        description: 'Suggestions strongly align with patterns',
      },
      {
        title: 'Acceptance Rate',
        value: '76%',
        icon: 'target',
        description: 'Avg impact: +0.12 resonance/suggestion',
      },
      {
        title: 'Suggestion #1',
        value: 'Enable Proactive Scheduling',
        icon: 'zap',
        description: 'AI suggests optimal task times',
      },
      {
        title: 'Suggestion #2',
        value: 'Turn On Smart Breaks',
        icon: 'clock',
        description: 'AI prompts breaks before crashes',
      },
      {
        title: 'Suggestion #3',
        value: 'Activate Meeting Guard',
        icon: 'trending',
        description: 'AI blocks requests during peaks',
      },
      {
        title: '📈 AI Learning Curve',
        value: 'Graph 1',
        icon: 'trending',
        description: 'Why: Shows improvement over time | Value: Builds trust in AI capabilities',
      },
      {
        title: '✅ AI Suggestion Acceptance',
        value: 'Graph 2',
        icon: 'target',
        description: 'Why: Shows alignment with user preferences | Value: Tracks AI effectiveness',
      },
      {
        title: '📊 AI Suggestion Impact',
        value: 'Graph 3',
        icon: 'brain',
        description: 'Why: Shows range of improvements from suggestions | Value: Sets expectations',
      },
    ],
  },

  // Tab 9: Gamification
  gamification: {
    title: 'Gamification Resonance',
    insights: [
      {
        title: 'Gamification Resonance',
        value: '0.80',
        icon: 'zap',
        description: 'Rewards effectively amplify behavior',
      },
      {
        title: 'Current Streak',
        value: '12 Days',
        icon: 'trending',
        description: 'Impact: +0.08 resonance',
      },
      {
        title: 'Suggestion #1',
        value: 'Weekly Resonance Goal',
        icon: 'target',
        description: 'Target: 0.80+ avg for bonus',
      },
      {
        title: 'Suggestion #2',
        value: 'Milestone Notifications',
        icon: 'brain',
        description: 'Real-time feedback: +15% motivation',
      },
      {
        title: 'Suggestion #3',
        value: 'Join Team Leaderboard',
        icon: 'clock',
        description: 'Social comparison: +0.10 resonance',
      },
      {
        title: '🏆 Achievement Frequency',
        value: 'Graph 1',
        icon: 'trending',
        description: 'Why: Shows high Resonance unlocks more achievements | Value: Creates feedback loop motivation',
      },
      {
        title: '🔥 Streak Impact',
        value: 'Graph 2',
        icon: 'zap',
        description: 'Why: Shows how consistency amplifies outcomes | Value: Encourages streaks',
      },
      {
        title: '🎁 Reward Effectiveness',
        value: 'Graph 3',
        icon: 'brain',
        description: 'Why: Shows how rewards affect behavior over time | Value: Optimizes reward timing',
      },
    ],
  },

  // Tab 10: Scripts & Templates
  scripts: {
    title: 'Script Resonance Optimization',
    insights: [
      {
        title: 'Scripts Resonance',
        value: '0.76',
        icon: 'brain',
        description: 'Automation amplifies outcomes',
      },
      {
        title: 'Destructive Interference',
        value: '"Daily Digest" Script',
        icon: 'clock',
        description: 'Timing conflicts with focus blocks',
      },
      {
        title: 'Suggestion #1',
        value: 'Reschedule Digest',
        icon: 'target',
        description: '2 PM → 5 PM (+0.15 resonance)',
      },
      {
        title: 'Suggestion #2',
        value: 'Combine Morning Scripts',
        icon: 'zap',
        description: 'Batch 3 scripts into 8 AM routine',
      },
      {
        title: 'Suggestion #3',
        value: 'Use Focus Block Template',
        icon: 'trending',
        description: 'Highest resonance (0.90 avg)',
      },
      {
        title: '🤖 Script Usage vs Impact',
        value: 'Graph 1',
        icon: 'brain',
        description: 'Why: Identifies high-value automation opportunities | Value: Prioritizes script optimization',
      },
      {
        title: '⚙️ Automation Efficiency',
        value: 'Graph 2',
        icon: 'zap',
        description: 'Why: Finds the optimal automation level | Value: Prevents over-automation',
      },
      {
        title: '📋 Template Resonance',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Shows which templates create best Resonance | Value: Guides template selection',
      },
    ],
  },

  // Tab 11: Settings & Profile
  settings: {
    title: 'Settings Resonance Optimization',
    insights: [
      {
        title: 'Settings Resonance',
        value: '0.83',
        icon: 'target',
        description: 'Configuration affects outcomes well',
      },
      {
        title: 'Highest Impact Setting',
        value: 'Peak Hours Window',
        icon: 'brain',
        description: '→ 2-4 PM yields +0.15 resonance',
      },
      {
        title: 'Suggestion #1',
        value: 'Update Peak Hours',
        icon: 'clock',
        description: 'Set to 2-4 PM (your actual peak)',
      },
      {
        title: 'Suggestion #2',
        value: 'Increase Focus Block',
        icon: 'zap',
        description: '→ 90min (matches flow duration)',
      },
      {
        title: 'Suggestion #3',
        value: 'Set Break Duration',
        icon: 'trending',
        description: '→ 15min (optimal recovery)',
      },
      {
        title: '🔧 Parameter Sensitivity',
        value: 'Graph 1',
        icon: 'brain',
        description: 'Why: Shows how settings affect Resonance | Value: Guides configuration decisions',
      },
      {
        title: '📈 Learning Curve',
        value: 'Graph 2',
        icon: 'trending',
        description: 'Why: Shows system improvement through learning | Value: Demonstrates adaptive progress',
      },
      {
        title: '📊 Setting Impact Distribution',
        value: 'Graph 3',
        icon: 'target',
        description: 'Why: Prioritizes which settings to optimize | Value: Focuses effort where it matters',
      },
    ],
  },

  // Tab 12: Projects
  projects: {
    title: 'Project Resonance Optimization',
    insights: [
      {
        title: 'Projects Resonance',
        value: '0.79',
        icon: 'target',
        description: 'Structure amplifies outcomes well',
      },
      {
        title: 'Projects Needing Help',
        value: '2 of 8 Projects',
        icon: 'brain',
        description: 'Website Redesign & API Integration',
      },
      {
        title: 'Suggestion #1',
        value: 'Resequence Website',
        icon: 'clock',
        description: 'Design before dev: +0.18 boost',
      },
      {
        title: 'Suggestion #2',
        value: 'Split API Testing',
        icon: 'zap',
        description: 'Break into 2 smaller sprints',
      },
      {
        title: 'Suggestion #3',
        value: 'Maintain Mobile Pattern',
        icon: 'trending',
        description: 'Keep high-resonance (0.88 avg)',
      },
      {
        title: '✅ Project Completion Rate',
        value: 'Graph 1',
        icon: 'trending',
        description: 'Why: Confirms high-Resonance projects complete more often | Value: Validates the approach',
      },
      {
        title: '📊 Project Timeline Resonance',
        value: 'Graph 2',
        icon: 'clock',
        description: 'Why: Shows Resonance patterns across project phases | Value: Identifies phases needing attention',
      },
      {
        title: '🔗 Project Task Resonance',
        value: 'Graph 3',
        icon: 'brain',
        description: 'Why: Shows relationships within/between projects | Value: Guides structure optimization',
      },
    ],
  },

  // Minimal content for other tabs
  integrations: {
    title: 'Integration Resonance',
    insights: [
      {
        title: 'Sync Status',
        value: '100%',
        icon: 'trending',
        description: 'All 8 integrations connected',
      },
      {
        title: 'Data Flow',
        value: '1.2k Items',
        icon: 'brain',
        description: 'Synced successfully today',
      },
    ],
  },

  resonance: {
    title: 'Resonance Engine',
    insights: [
      {
        title: 'Engine Status',
        value: 'Active',
        icon: 'zap',
        description: 'Real-time optimization running',
      },
    ],
  },

  features: {
    title: 'All Features',
    insights: [
      {
        title: 'Features Active',
        value: '24/28',
        icon: 'target',
        description: 'Most features enabled',
      },
    ],
  },
};

export function getPageInsights(pathname: string): PageInsightsConfig {
  const pathToKey: Record<string, PageKey> = {
    '/dashboard': 'dashboard',
    '/tasks': 'tasks',
    '/calendar': 'calendar',
    '/ai': 'ai-assistant',
    '/energy': 'energy',
    '/resonance': 'resonance',
    '/team': 'team',
    '/analytics': 'analytics',
    '/gamification': 'gamification',
    '/integrations': 'integrations',
    '/enterprise': 'enterprise',
    '/scripts': 'scripts',
    '/features': 'features',
    '/settings': 'settings',
    '/projects': 'projects',
  };

  const key = pathToKey[pathname] || 'dashboard';
  return PAGE_INSIGHTS_CONFIG[key];
}
