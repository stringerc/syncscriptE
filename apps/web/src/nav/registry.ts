/**
 * Navigation Registry
 * 
 * Centralized navigation configuration for SyncScript.
 * This file defines the main navigation structure and documents
 * the planned relocation of provider-specific pages to Settings → Integrations.
 * 
 * NOTE: This is documentation only. Do not move code yet.
 */

export interface NavItem {
  name: string
  href: string
  icon: string
  comingSoon?: boolean
  featureFlag?: string
  children?: NavItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Main Navigation Structure
 * 
 * Core navigation follows the established pattern:
 * - Core: Dashboard, Tasks, Calendar
 * - Plan: Projects, Playbooks (Templates/Scripts)
 * - People: People/Friends
 * - Me: Progress, Notifications, Profile, Settings
 */
export const navigationSections: NavSection[] = [
  {
    title: "Core",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard"
      },
      {
        name: "Tasks",
        href: "/tasks",
        icon: "CheckSquare"
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "Calendar"
      }
    ]
  },
  {
    title: "Plan",
    items: [
      {
        name: "Projects",
        href: "/projects",
        icon: "FolderOpen",
        featureFlag: "shareScript"
      },
      {
        name: "Templates",
        href: "/templates",
        icon: "FileText",
        featureFlag: "templates"
      }
    ]
  },
  {
    title: "People",
    items: [
      {
        name: "Friends",
        href: "/friends",
        icon: "Users",
        featureFlag: "friends"
      }
    ]
  },
  {
    title: "Me",
    items: [
      {
        name: "Progress",
        href: "/gamification",
        icon: "TrendingUp"
      },
      {
        name: "Notifications",
        href: "/notifications",
        icon: "Bell",
        comingSoon: true,
        featureFlag: "notifications"
      },
      {
        name: "Profile",
        href: "/profile",
        icon: "User"
      },
      {
        name: "Settings",
        href: "/settings",
        icon: "Settings"
      }
    ]
  }
]

/**
 * Settings Navigation Structure
 * 
 * Provider-specific calendar pages will be moved to Settings → Integrations.
 * This documents the planned structure without implementing the move yet.
 */
export const settingsNavigation: NavSection[] = [
  {
    title: "Account",
    items: [
      {
        name: "Profile",
        href: "/settings/profile",
        icon: "User"
      },
      {
        name: "Preferences",
        href: "/settings/preferences",
        icon: "Settings"
      }
    ]
  },
  {
    title: "Integrations",
    items: [
      {
        name: "Google Calendar",
        href: "/settings/integrations/google-calendar",
        icon: "Calendar",
        featureFlag: "googleCalendar"
      },
      {
        name: "Outlook Calendar",
        href: "/settings/integrations/outlook-calendar",
        icon: "Calendar",
        comingSoon: true,
        featureFlag: "outlookCalendar"
      },
      {
        name: "Apple Calendar",
        href: "/settings/integrations/apple-calendar",
        icon: "Calendar",
        comingSoon: true,
        featureFlag: "appleCalendar"
      }
    ]
  },
  {
    title: "Features",
    items: [
      {
        name: "Feature Flags",
        href: "/settings/features",
        icon: "Flag"
      }
    ]
  }
]

/**
 * Planned Navigation Changes
 * 
 * The following pages will be moved from their current locations
 * to Settings → Integrations:
 * 
 * Current Location → New Location
 * - /google-calendar → /settings/integrations/google-calendar
 * - /outlook-calendar → /settings/integrations/outlook-calendar
 * - /apple-calendar → /settings/integrations/apple-calendar
 * - /multi-calendar → /settings/integrations/calendar-overview
 * 
 * This change will:
 * 1. Consolidate all integration settings in one place
 * 2. Reduce main navigation clutter
 * 3. Follow common UX patterns for settings organization
 * 4. Make it easier to add new calendar providers
 * 
 * Implementation will be done in a separate PR to avoid breaking changes.
 */

/**
 * Feature Flag Dependencies
 * 
 * Navigation items that depend on feature flags:
 * - Projects: shareScript
 * - Templates: templates
 * - Friends: friends
 * - Notifications: notifications
 * - Google Calendar: googleCalendar
 * - Outlook Calendar: outlookCalendar
 * - Apple Calendar: appleCalendar
 */
export const featureFlagDependencies: Record<string, string[]> = {
  shareScript: ["/projects"],
  templates: ["/templates"],
  friends: ["/friends"],
  notifications: ["/notifications"],
  googleCalendar: ["/settings/integrations/google-calendar"],
  outlookCalendar: ["/settings/integrations/outlook-calendar"],
  appleCalendar: ["/settings/integrations/apple-calendar"]
}

/**
 * Coming Soon Features
 * 
 * Features marked as coming soon:
 * - Notifications: Multi-channel notification system
 * - Outlook Calendar: Microsoft Graph API integration
 * - Apple Calendar: CalDAV protocol support
 * - Financial Analytics: Advanced budgeting analytics
 * - Energy Analysis: Historical energy analysis
 * - Focus Lock: Website blocking and focus time tracking
 * - Priority Hierarchy: Critical path calculation
 * - Morning Brief: Automated morning briefings
 * - Evening Journal: Daily reflection and planning
 */
export const comingSoonFeatures: string[] = [
  "notifications",
  "outlookCalendar",
  "appleCalendar",
  "financial",
  "energyAnalysis",
  "focusLock",
  "priorityHierarchy",
  "brief",
  "endDay"
]

/**
 * Navigation Helper Functions
 */
export function getNavigationForUser(featureFlags: Record<string, boolean>): NavSection[] {
  return navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.featureFlag && !featureFlags[item.featureFlag]) {
        return false
      }
      return true
    })
  }))
}

export function getSettingsNavigationForUser(featureFlags: Record<string, boolean>): NavSection[] {
  return settingsNavigation.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.featureFlag && !featureFlags[item.featureFlag]) {
        return false
      }
      return true
    })
  }))
}

export function isComingSoon(featureKey: string): boolean {
  return comingSoonFeatures.includes(featureKey)
}

export function getFeatureFlagForRoute(route: string): string | null {
  for (const [flag, routes] of Object.entries(featureFlagDependencies)) {
    if (routes.includes(route)) {
      return flag
    }
  }
  return null
}
