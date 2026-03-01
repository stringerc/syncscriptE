// Navigation configuration for the SyncScript Dashboard
// Update these URLs to point to your actual destinations

export const navigationLinks = {
  // Main routes
  landing: '/',
  
  // Sidebar Navigation
  sidebar: {
    dashboard: '/dashboard',
    tasks: '/tasks',
    calendar: '/calendar',
    ai: '/ai',
    energy: '/energy',
    resonance: '/resonance-engine',
    team: '/team',
    analytics: '/analytics',
    gaming: '/gaming',
    integrations: '/integrations',
    email: '/email',
    enterprise: '/enterprise',
    scripts: '/scripts-templates',
    teamScripts: '/team-scripts',
    allFeatures: '/all-features',
    settings: '/settings',
  },

  // Header Actions
  header: {
    search: '/search',
    conversationExtraction: '/conversation-extraction',
    notifications: '/notifications',
    aiInsights: '/ai-insights',
    profile: '/profile',
  },

  // AI & Focus Section
  aiFocus: {
    budgetAllocation: '/tasks/budget-allocation',
    projectProposal: '/tasks/project-proposal',
    voiceToTask: '/voice-to-task',
    weatherAlert1: '/weather/rain-alert',
    weatherAlert2: '/weather/traffic-alert',
  },

  // Today's Orchestration
  today: {
    task: (taskId: string) => `/tasks/${taskId}`,
    financialAlert: '/financial/alerts',
    calendar: '/calendar',
  },

  // Resource Hub
  resources: {
    financialHealth: '/financial/health',
    viewStats: '/gamification/stats',
    leaderboard: '/gamification/leaderboard',
    notification: (notificationId: string) => `/notifications/${notificationId}`,
    achievement: (achievementId: string) => `/achievements/${achievementId}`,
  },

  // External Links (use full URLs)
  external: {
    support: 'https://support.syncscript.com',
    documentation: 'https://docs.syncscript.com',
    pricing: 'https://syncscript.com/pricing',
    signup: 'https://syncscript.com/signup',
    login: 'https://syncscript.com/login',
  },
};

// Navigation helper functions
// NOTE: These are kept for backward compatibility with external links
// For internal navigation, components should use React Router's useNavigate hook
export const navigate = (path: string, external = false) => {
  if (external) {
    window.open(path, '_blank', 'noopener,noreferrer');
  } else {
    // For internal navigation, this will be replaced by React Router
    // This fallback is for non-router contexts
    window.location.href = path;
  }
};

export const navigateToExternal = (url: string, newTab = true) => {
  if (newTab) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = url;
  }
};