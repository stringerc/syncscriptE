/**
 * AI Context Configuration
 * 
 * Forward-thinking context-aware AI assistant that adapts to user's current page/task.
 * Based on research from:
 * - Microsoft Copilot's contextual intelligence patterns
 * - Google Assistant's ambient computing principles
 * - Nielsen Norman Group's progressive disclosure research
 * - Modern conversational UI best practices
 */

import { 
  LayoutDashboard, Calendar, CheckSquare, Target, Zap, 
  Users, BarChart3, Trophy, Puzzle, Settings, Brain,
  Plus, TrendingUp, Search, FileText, MessageSquare,
  Activity, Clock, Sparkles, ListChecks, AlertCircle, Bell
} from 'lucide-react';

export interface PageContext {
  route: string;
  displayName: string;
  icon: any;
  description: string;
  quickActions: QuickAction[];
  conversationStarters: string[];
  smartInsights: string[];
  aiCapabilities: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: any;
  description: string;
  command: string; // What command to run or preset
  type: 'create' | 'analyze' | 'optimize' | 'navigate' | 'query' | 'open-insights';
}

/**
 * Page-specific context configurations
 * Each page has tailored AI assistance
 */
export const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/dashboard': {
    route: '/dashboard',
    displayName: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your daily overview and productivity snapshot',
    quickActions: [
      {
        id: 'overview',
        label: 'Daily Overview',
        icon: Activity,
        description: 'Get a summary of today\'s priorities',
        command: 'Give me an overview of my day',
        type: 'query',
      },
      {
        id: 'priorities',
        label: 'Top Priorities',
        icon: Target,
        description: 'What should I focus on?',
        command: 'What are my top 3 priorities today?',
        type: 'analyze',
      },
      {
        id: 'schedule-gaps',
        label: 'Find Time Gaps',
        icon: Clock,
        description: 'Identify free time in schedule',
        command: '/schedule gaps',
        type: 'analyze',
      },
      {
        id: 'energy-check',
        label: 'Energy Check',
        icon: Zap,
        description: 'Current energy status',
        command: '/energy current',
        type: 'query',
      },
    ],
    conversationStarters: [
      'What should I focus on today?',
      'Show me my upcoming deadlines',
      'How is my energy trending?',
      'What meetings do I have today?',
    ],
    smartInsights: [
      'Your calendar shows 4 meetings today',
      'You have 3 high-priority tasks due this week',
      'Peak energy hours: 9-11 AM',
    ],
    aiCapabilities: [
      'Daily priority analysis',
      'Schedule optimization',
      'Energy-based task recommendations',
      'Deadline tracking',
    ],
  },

  '/calendar': {
    route: '/calendar',
    displayName: 'Calendar',
    icon: Calendar,
    description: 'Smart scheduling and event management',
    quickActions: [
      {
        id: 'create-event',
        label: 'Create Event',
        icon: Plus,
        description: 'Quick event creation',
        command: '/event ',
        type: 'create',
      },
      {
        id: 'find-time',
        label: 'Find Time',
        icon: Search,
        description: 'Find available time slots',
        command: 'Find time for a 1-hour meeting this week',
        type: 'query',
      },
      {
        id: 'optimize-schedule',
        label: 'Optimize Schedule',
        icon: TrendingUp,
        description: 'AI-powered schedule optimization',
        command: '/schedule optimize',
        type: 'optimize',
      },
      {
        id: 'conflicts',
        label: 'Check Conflicts',
        icon: AlertCircle,
        description: 'Detect scheduling conflicts',
        command: '/schedule conflicts',
        type: 'analyze',
      },
    ],
    conversationStarters: [
      'Find time for a 30-minute call tomorrow',
      'Optimize my schedule for today',
      'Show me all my meetings this week',
      'When is my next free hour?',
    ],
    smartInsights: [
      'You have 2 back-to-back meetings starting at 2 PM',
      'No breaks scheduled between 9 AM - 1 PM',
      'Calendar is 67% full this week',
    ],
    aiCapabilities: [
      'Natural language event creation',
      'Smart scheduling suggestions',
      'Conflict detection',
      'Energy-aware scheduling',
    ],
  },

  '/tasks': {
    route: '/tasks',
    displayName: 'Tasks & Goals',
    icon: CheckSquare,
    description: 'Task management and goal tracking',
    quickActions: [
      {
        id: 'view-ai-suggestions',
        label: 'View AI Suggestions',
        icon: Sparkles,
        description: 'Open AI Task & Goal Suggestions panel',
        command: 'open-ai-insights-panel',
        type: 'open-insights',
      },
      {
        id: 'create-task',
        label: 'Create Task',
        icon: Plus,
        description: 'Quick task creation',
        command: '/task ',
        type: 'create',
      },
      {
        id: 'prioritize',
        label: 'Prioritize Tasks',
        icon: ListChecks,
        description: 'AI-powered prioritization',
        command: 'Prioritize my tasks based on urgency and energy',
        type: 'analyze',
      },
      {
        id: 'goal-progress',
        label: 'Goal Progress',
        icon: Target,
        description: 'Check goal progress',
        command: 'How are my goals progressing?',
        type: 'query',
      },
    ],
    conversationStarters: [
      'Show me AI task suggestions',
      'What tasks should I work on first?',
      'Create a task for client presentation',
      'How are my goals doing this month?',
    ],
    smartInsights: [
      '3 new AI task suggestions available in AI Insights',
      '5 tasks due this week',
      '2 goals are behind schedule',
    ],
    aiCapabilities: [
      'Smart task prioritization',
      'Natural language task creation',
      'Goal progress tracking',
      'Energy-based task matching',
    ],
  },

  '/energy': {
    route: '/energy',
    displayName: 'Energy & Focus',
    icon: Zap,
    description: 'Energy tracking and optimization',
    quickActions: [
      {
        id: 'log-energy',
        label: 'Log Energy',
        icon: Activity,
        description: 'Log current energy level',
        command: '/energy log',
        type: 'create',
      },
      {
        id: 'energy-forecast',
        label: 'Forecast',
        icon: TrendingUp,
        description: 'Energy forecast for today',
        command: '/energy forecast',
        type: 'query',
      },
      {
        id: 'optimize',
        label: 'Optimize Day',
        icon: Sparkles,
        description: 'Match tasks to energy levels',
        command: '/energy optimize',
        type: 'optimize',
      },
      {
        id: 'break-suggestion',
        label: 'Suggest Break',
        icon: Clock,
        description: 'When should I take a break?',
        command: 'When should I take my next break?',
        type: 'analyze',
      },
    ],
    conversationStarters: [
      'What\'s my energy forecast for today?',
      'When are my peak energy hours?',
      'Suggest tasks for my current energy level',
      'Log my energy as 75%',
    ],
    smartInsights: [
      'Current energy: 68%',
      'Peak energy expected at 10 AM',
      'Recommend 15-minute break at 2:30 PM',
    ],
    aiCapabilities: [
      'Energy pattern analysis',
      'Peak performance time detection',
      'Break time recommendations',
      'Energy-task matching',
    ],
  },

  '/resonance-engine': {
    route: '/resonance-engine',
    displayName: 'Resonance',
    icon: Activity,
    description: 'Resonance scoring and optimization',
    quickActions: [
      {
        id: 'resonance-score',
        label: 'Check Score',
        icon: Target,
        description: 'Current resonance score',
        command: '/resonance score',
        type: 'query',
      },
      {
        id: 'improve-resonance',
        label: 'Improve Score',
        icon: TrendingUp,
        description: 'Get improvement suggestions',
        command: 'How can I improve my resonance score?',
        type: 'analyze',
      },
      {
        id: 'tune-day',
        label: 'Tune My Day',
        icon: Sparkles,
        description: 'Optimize daily resonance',
        command: '/resonance tune',
        type: 'optimize',
      },
      {
        id: 'insights',
        label: 'Insights',
        icon: Brain,
        description: 'Resonance insights',
        command: '/resonance insights',
        type: 'analyze',
      },
    ],
    conversationStarters: [
      'What\'s my resonance score?',
      'How can I tune my day better?',
      'Show me dissonant tasks',
      'Optimize my schedule for resonance',
    ],
    smartInsights: [
      'Overall resonance: 82/100',
      '3 tasks creating dissonance',
      'Morning resonance is optimal',
    ],
    aiCapabilities: [
      'Resonance score calculation',
      'Dissonance detection',
      'Schedule tuning recommendations',
      'Pattern analysis',
    ],
  },

  '/team': {
    route: '/team',
    displayName: 'Team',
    icon: Users,
    description: 'Team collaboration and coordination',
    quickActions: [
      {
        id: 'team-overview',
        label: 'Team Status',
        icon: Users,
        description: 'Team activity overview',
        command: 'Show me team activity today',
        type: 'query',
      },
      {
        id: 'schedule-meeting',
        label: 'Schedule Meeting',
        icon: Calendar,
        description: 'Find time for team meeting',
        command: 'Find time for a team meeting this week',
        type: 'query',
      },
      {
        id: 'collaboration',
        label: 'Collaboration',
        icon: MessageSquare,
        description: 'Collaboration opportunities',
        command: 'Show collaboration opportunities',
        type: 'analyze',
      },
      {
        id: 'workload',
        label: 'Workload Balance',
        icon: BarChart3,
        description: 'Team workload analysis',
        command: '/team workload',
        type: 'analyze',
      },
    ],
    conversationStarters: [
      'Who is available for a quick sync?',
      'Show me team deadlines this week',
      'What projects need my review?',
      'Find time for a 30-min team meeting',
    ],
    smartInsights: [
      '3 team members online now',
      '2 shared projects due this week',
      'Team capacity at 78%',
    ],
    aiCapabilities: [
      'Team availability checking',
      'Workload balancing',
      'Collaboration suggestions',
      'Meeting scheduling',
    ],
  },

  '/scripts-templates': {
    route: '/scripts-templates',
    displayName: 'Scripts',
    icon: FileText,
    description: 'Scripts & templates marketplace',
    quickActions: [
      {
        id: 'browse',
        label: 'Browse Scripts',
        icon: Search,
        description: 'Find relevant scripts',
        command: 'Show me popular scripts',
        type: 'query',
      },
      {
        id: 'recommend',
        label: 'Recommendations',
        icon: Sparkles,
        description: 'Get personalized recommendations',
        command: 'Recommend scripts for my workflow',
        type: 'analyze',
      },
      {
        id: 'create',
        label: 'Create Script',
        icon: Plus,
        description: 'Create a new script',
        command: '/script create',
        type: 'create',
      },
      {
        id: 'my-scripts',
        label: 'My Scripts',
        icon: FileText,
        description: 'View your scripts',
        command: '/script mine',
        type: 'query',
      },
    ],
    conversationStarters: [
      'Recommend scripts for project management',
      'What are the most popular scripts?',
      'Help me create a morning routine script',
      'Show scripts similar to my workflow',
    ],
    smartInsights: [
      '15 scripts match your workflow',
      '"Morning Productivity" script trending',
      'You have 3 saved scripts',
    ],
    aiCapabilities: [
      'Script recommendations',
      'Workflow analysis',
      'Script creation assistance',
      'Usage pattern matching',
    ],
  },

  '/analytics': {
    route: '/analytics',
    displayName: 'Analytics',
    icon: BarChart3,
    description: 'Insights and analytics',
    quickActions: [
      {
        id: 'weekly-summary',
        label: 'Weekly Summary',
        icon: BarChart3,
        description: 'Week performance summary',
        command: 'Give me my weekly summary',
        type: 'query',
      },
      {
        id: 'trends',
        label: 'Trends',
        icon: TrendingUp,
        description: 'Productivity trends',
        command: 'Show my productivity trends',
        type: 'analyze',
      },
      {
        id: 'compare',
        label: 'Compare Periods',
        icon: BarChart3,
        description: 'Compare time periods',
        command: 'Compare this week vs last week',
        type: 'analyze',
      },
      {
        id: 'insights',
        label: 'Key Insights',
        icon: Brain,
        description: 'AI-powered insights',
        command: '/analytics insights',
        type: 'analyze',
      },
    ],
    conversationStarters: [
      'How productive was I this week?',
      'Show me my completion rate trend',
      'What are my most common bottlenecks?',
      'Compare my energy levels week over week',
    ],
    smartInsights: [
      'Productivity up 12% this week',
      'Average task completion time: 2.3 hours',
      'Peak productivity: Tuesday mornings',
    ],
    aiCapabilities: [
      'Trend analysis',
      'Pattern recognition',
      'Performance comparisons',
      'Predictive insights',
    ],
  },

  '/gaming': {
    route: '/gaming',
    displayName: 'Gamification',
    icon: Trophy,
    description: 'Achievements and progress',
    quickActions: [
      {
        id: 'progress',
        label: 'My Progress',
        icon: Trophy,
        description: 'Current level and progress',
        command: 'Show my level and progress',
        type: 'query',
      },
      {
        id: 'achievements',
        label: 'Achievements',
        icon: Target,
        description: 'Recent achievements',
        command: 'What achievements did I unlock?',
        type: 'query',
      },
      {
        id: 'streaks',
        label: 'Streaks',
        icon: Zap,
        description: 'Current streaks',
        command: '/streak status',
        type: 'query',
      },
      {
        id: 'leaderboard',
        label: 'Leaderboard',
        icon: BarChart3,
        description: 'Team rankings',
        command: 'Show team leaderboard',
        type: 'query',
      },
    ],
    conversationStarters: [
      'How many points until next level?',
      'What badges can I earn this week?',
      'Show my achievement progress',
      'Compare my progress with team',
    ],
    smartInsights: [
      'Current level: 12',
      '234 points to next level',
      '5-day completion streak active',
    ],
    aiCapabilities: [
      'Progress tracking',
      'Achievement recommendations',
      'Streak monitoring',
      'Competitive analysis',
    ],
  },

  '/settings': {
    route: '/settings',
    displayName: 'Settings',
    icon: Settings,
    description: 'Preferences and configuration',
    quickActions: [
      {
        id: 'preferences',
        label: 'Preferences',
        icon: Settings,
        description: 'Adjust your preferences',
        command: 'Show my preference options',
        type: 'query',
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: Puzzle,
        description: 'Manage integrations',
        command: '/integrations status',
        type: 'query',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        description: 'Notification settings',
        command: 'Manage my notifications',
        type: 'query',
      },
      {
        id: 'help',
        label: 'Get Help',
        icon: MessageSquare,
        description: 'How can I help?',
        command: 'How do I use AI Assistant?',
        type: 'query',
      },
    ],
    conversationStarters: [
      'How do I change my notification settings?',
      'What integrations are available?',
      'Help me customize my dashboard',
      'Show me keyboard shortcuts',
    ],
    smartInsights: [
      'You have 3 active integrations',
      'Notifications: All enabled',
      'Last backup: 2 hours ago',
    ],
    aiCapabilities: [
      'Settings guidance',
      'Integration help',
      'Preference recommendations',
      'Troubleshooting assistance',
    ],
  },
};

/**
 * Get context for current page
 */
export function getPageContext(pathname: string): PageContext {
  // Exact match first
  if (PAGE_CONTEXTS[pathname]) {
    return PAGE_CONTEXTS[pathname];
  }
  
  // Fallback to base path (e.g., /calendar/event -> /calendar)
  const basePath = '/' + pathname.split('/')[1];
  if (PAGE_CONTEXTS[basePath]) {
    return PAGE_CONTEXTS[basePath];
  }
  
  // Default fallback
  return PAGE_CONTEXTS['/dashboard'];
}

/**
 * Get smart notification status
 * Returns true if AI has insights for the current context
 */
export function hasContextualInsights(pathname: string, userData?: any): boolean {
  const context = getPageContext(pathname);
  
  // Logic to determine if there are actionable insights
  // In production, this would check actual user data
  if (pathname === '/calendar' && userData?.upcomingEvents > 5) return true;
  if (pathname === '/tasks' && userData?.overdueTasks > 0) return true;
  if (pathname === '/energy' && userData?.energyLevel < 40) return true;
  
  // For demo, show notification on certain pages
  return ['/calendar', '/tasks', '/energy', '/resonance-engine'].includes(pathname);
}

/**
 * Generate context-aware welcome message
 */
export function generateWelcomeMessage(pathname: string): string {
  const context = getPageContext(pathname);
  const timeOfDay = new Date().getHours();
  const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
  
  return `${greeting}! I'm your AI Assistant, currently tuned to your **${context.displayName}** page.\n\nI can help you with:\n${context.aiCapabilities.slice(0, 3).map(cap => `• ${cap}`).join('\n')}\n\nWhat would you like to do?`;
}
