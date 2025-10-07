/**
 * Navigation Registry
 * 
 * Central registry for all navigation items in the application.
 * Supports feature flags, role-based visibility, and badges.
 */

export interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  badge?: {
    count: number;
    variant?: 'default' | 'destructive' | 'secondary' | 'outline';
  };
  featureFlag?: string;
  role?: string[];
  comingSoon?: boolean;
  description?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

/**
 * Navigation Registry
 * 
 * Organized by functional groups:
 * - Core: Essential daily features
 * - Plan: Planning and project management
 * - People: Social and collaboration features
 * - Me: Personal settings and progress
 */
export const navigationRegistry: NavSection[] = [
  {
    id: 'core',
    title: 'Core',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        description: 'Overview of your tasks, events, and progress'
      },
      {
        id: 'tasks',
        name: 'Tasks',
        href: '/tasks',
        icon: 'CheckSquare',
        badge: {
          count: 0, // This would be populated from real data
          variant: 'default'
        },
        description: 'Manage your tasks and to-dos'
      },
      {
        id: 'calendar',
        name: 'Calendar',
        href: '/calendar',
        icon: 'Calendar',
        description: 'View and manage your events'
      }
    ]
  },
  {
    id: 'plan',
    title: 'Plan',
    items: [
      {
        id: 'projects',
        name: 'Projects',
        href: '/projects',
        icon: 'Folder',
        featureFlag: 'shareScript',
        description: 'Organize tasks and events into projects'
      },
      {
        id: 'templates',
        name: 'Templates',
        href: '/templates',
        icon: 'BookTemplate',
        featureFlag: 'templates',
        description: 'Reusable task and event templates'
      },
      {
        id: 'ai-assistant',
        name: 'AI Assistant',
        href: '/ai-assistant',
        icon: 'Brain',
        featureFlag: 'askAI',
        description: 'Get AI-powered suggestions and help'
      }
    ]
  },
  {
    id: 'people',
    title: 'People',
    items: [
      {
        id: 'friends',
        name: 'Friends',
        href: '/friends',
        icon: 'Users',
        featureFlag: 'friends',
        description: 'Connect with friends and collaborate'
      }
    ]
  },
  {
    id: 'me',
    title: 'Me',
    collapsible: true,
    defaultCollapsed: false,
    items: [
      {
        id: 'progress',
        name: 'Progress',
        href: '/gamification',
        icon: 'Trophy',
        description: 'Track your achievements and progress'
      },
      {
        id: 'notifications',
        name: 'Notifications',
        href: '/notifications',
        icon: 'Bell',
        badge: {
          count: 0, // This would be populated from real data
          variant: 'destructive'
        },
        featureFlag: 'notifications',
        description: 'Manage your notifications'
      },
      {
        id: 'profile',
        name: 'Profile',
        href: '/profile',
        icon: 'User',
        description: 'Manage your profile and preferences'
      },
      {
        id: 'settings',
        name: 'Settings',
        href: '/settings',
        icon: 'Settings',
        description: 'Configure your SyncScript experience'
      }
    ]
  }
];

/**
 * Get navigation items filtered by feature flags and user role
 */
export function getFilteredNavigation(
  flags: Record<string, boolean> = {},
  userRole: string = 'user'
): NavSection[] {
  return navigationRegistry
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Filter by feature flags
        if (item.featureFlag && !flags[item.featureFlag]) {
          return false;
        }
        
        // Filter by role (if specified)
        if (item.role && !item.role.includes(userRole)) {
          return false;
        }
        
        return true;
      })
    }))
    .filter(section => section.items.length > 0);
}

/**
 * Get a specific navigation item by ID
 */
export function getNavItem(itemId: string): NavItem | undefined {
  for (const section of navigationRegistry) {
    const item = section.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return undefined;
}

/**
 * Get navigation items for a specific section
 */
export function getNavSection(sectionId: string): NavSection | undefined {
  return navigationRegistry.find(section => section.id === sectionId);
}
