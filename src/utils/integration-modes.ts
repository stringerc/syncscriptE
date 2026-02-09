/**
 * Integration Modes Configuration
 * 
 * Defines how each integration receives updates:
 * - Push: Webhooks notify on changes (red dot auto-appears)
 * - Pull: Manual refresh only (no red dot)
 * - Hybrid: Push notification signals change, then pull for details (red dot auto-appears)
 */

export type IntegrationMode = 'push' | 'pull' | 'hybrid';

export interface IntegrationConfig {
  id: string;
  name: string;
  mode: IntegrationMode;
  description: string;
  modeExplanation: string;
  redDotEnabled: boolean; // Auto red-dot for push/hybrid, manual for pull
  capabilities: string[];
}

export const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  'google-calendar': {
    id: 'google-calendar',
    name: 'Google Calendar',
    mode: 'hybrid',
    description: 'Sync your Google Calendar events and schedules',
    modeExplanation: 'Push notification signals changes, then Sync pulls deltas via sync token.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['events', 'notifications', 'sync'],
  },
  
  'gmail': {
    id: 'gmail',
    name: 'Gmail',
    mode: 'hybrid',
    description: 'Import emails and manage tasks from your inbox',
    modeExplanation: 'Push via Pub/Sub watch signals mailbox changes; app pulls details using historyId/messages.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['emails', 'tasks', 'notifications'],
  },
  
  'notion': {
    id: 'notion',
    name: 'Notion',
    mode: 'hybrid', // Push + pull
    description: 'Sync databases, pages, and tasks from Notion',
    modeExplanation: 'Webhook signals change; follow-up API call fetches updated content.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['databases', 'pages', 'tasks', 'webhooks'],
  },
  
  'trello': {
    id: 'trello',
    name: 'Trello',
    mode: 'push',
    description: 'Import boards, lists, and cards from Trello',
    modeExplanation: 'Webhooks notify on model changes.',
    redDotEnabled: true, // Push = auto red dot
    capabilities: ['boards', 'cards', 'webhooks'],
  },
  
  'github': {
    id: 'github',
    name: 'GitHub',
    mode: 'hybrid',
    description: 'Track issues, pull requests, and commits',
    modeExplanation: 'Webhook/event triggers signal changes, then fetch details via API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['issues', 'prs', 'commits', 'webhooks'],
  },
  
  'slack': {
    id: 'slack',
    name: 'Slack',
    mode: 'hybrid',
    description: 'Sync messages and create tasks from Slack',
    modeExplanation: 'Event API signals changes, then fetch details via Web API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['messages', 'channels', 'events'],
  },
  
  'zoom': {
    id: 'zoom',
    name: 'Zoom',
    mode: 'hybrid',
    description: 'Sync meetings and calendar events',
    modeExplanation: 'Webhook events signal changes, then fetch meeting details via API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['meetings', 'recordings', 'webhooks'],
  },
  
  'todoist': {
    id: 'todoist',
    name: 'Todoist',
    mode: 'pull',
    description: 'Import tasks and projects from Todoist',
    modeExplanation: 'Manual sync - click to fetch latest tasks and projects.',
    redDotEnabled: false, // Pull = no auto red dot
    capabilities: ['tasks', 'projects'],
  },
  
  'asana': {
    id: 'asana',
    name: 'Asana',
    mode: 'hybrid',
    description: 'Sync tasks and projects from Asana',
    modeExplanation: 'Webhooks signal changes, then fetch task details via API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['tasks', 'projects', 'webhooks'],
  },
  
  'jira': {
    id: 'jira',
    name: 'Jira',
    mode: 'hybrid',
    description: 'Track issues and sprints from Jira',
    modeExplanation: 'Webhooks notify on issue changes, then fetch details via REST API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['issues', 'sprints', 'webhooks'],
  },
  
  'linear': {
    id: 'linear',
    name: 'Linear',
    mode: 'hybrid',
    description: 'Sync issues and projects from Linear',
    modeExplanation: 'Webhooks signal changes, then fetch via GraphQL API.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['issues', 'projects', 'webhooks'],
  },
  
  'apple-calendar': {
    id: 'apple-calendar',
    name: 'Apple Calendar',
    mode: 'pull',
    description: 'Import events from iCloud Calendar',
    modeExplanation: 'Manual sync - click to fetch latest calendar events.',
    redDotEnabled: false, // Pull = no auto red dot
    capabilities: ['events'],
  },
  
  'outlook': {
    id: 'outlook',
    name: 'Outlook Calendar',
    mode: 'hybrid',
    description: 'Sync Outlook calendar and email',
    modeExplanation: 'Webhook subscriptions signal changes, then delta queries fetch updates.',
    redDotEnabled: true, // Hybrid = auto red dot
    capabilities: ['calendar', 'email', 'webhooks'],
  },
};

/**
 * Get integration configuration by ID
 */
export function getIntegrationConfig(id: string): IntegrationConfig | undefined {
  return INTEGRATION_CONFIGS[id];
}

/**
 * Check if integration supports auto red-dot indicators
 */
export function supportsAutoNotifications(id: string): boolean {
  const config = getIntegrationConfig(id);
  return config?.redDotEnabled ?? false;
}

/**
 * Get all integrations by mode
 */
export function getIntegrationsByMode(mode: IntegrationMode): IntegrationConfig[] {
  return Object.values(INTEGRATION_CONFIGS).filter(config => config.mode === mode);
}

/**
 * Get mode badge color for UI display
 */
export function getModeBadgeColor(mode: IntegrationMode): string {
  switch (mode) {
    case 'push':
      return 'bg-green-600/20 text-green-400 border-green-600/30';
    case 'hybrid':
      return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    case 'pull':
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    default:
      return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
  }
}

/**
 * Get mode icon for UI display
 */
export function getModeIcon(mode: IntegrationMode): string {
  switch (mode) {
    case 'push':
      return '🔔'; // Real-time notifications
    case 'hybrid':
      return '🔄'; // Push + Pull
    case 'pull':
      return '⏬'; // Manual sync
    default:
      return '❓';
  }
}

/**
 * Mock function to check for new imports (simulates push/hybrid notifications)
 */
export function hasNewImports(integrationId: string): boolean {
  const config = getIntegrationConfig(integrationId);
  
  // Only push/hybrid integrations can have auto notifications
  if (!config?.redDotEnabled) {
    return false;
  }
  
  // Mock: randomly show red dot for push/hybrid integrations
  // In real app, this would check actual webhook/notification state
  return Math.random() > 0.6; // 40% chance of having new imports
}

/**
 * Settings copy for integration modes
 */
export function getIntegrationSettingsCopy(id: string): string {
  const config = getIntegrationConfig(id);
  if (!config) return '';
  
  return `**${config.name}** (${config.mode.toUpperCase()})\n\n${config.modeExplanation}`;
}
