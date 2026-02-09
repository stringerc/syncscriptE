/**
 * SyncScript Global System Rules
 * 
 * This file enforces global interaction patterns, breakpoints, and standards
 * across the entire prototype. All components should follow these rules.
 */

// =============================================================================
// BREAKPOINT CONSTANTS
// =============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Breakpoint Rules:
 * - xl and above: Full layout (sidebar + header + content)
 * - md to lg: Compact sidebar or drawer
 * - Below md: Mobile layout with bottom nav
 * 
 * Vertical scroll rules:
 * - Only main content areas should scroll
 * - Never allow double scroll (body + inner)
 * - Use overflow-hidden on body, overflow-auto on content containers
 */

// =============================================================================
// COMING SOON STATES
// =============================================================================

/**
 * Features that are marked as "Coming Soon"
 * These will show the coming soon overlay when accessed
 */
export const COMING_SOON_FEATURES = {
  // AI Insights rail (right side panel)
  aiInsightsRail: {
    title: 'AI Insights Panel',
    description: 'Get real-time AI-powered insights and recommendations as you work. Per-tab contextual insights launching soon.',
    expectedDate: 'Q1 2025',
  },
  
  // Specific features that are coming soon
  voiceInput: {
    title: 'Voice Input',
    description: 'Create tasks and notes using voice commands.',
    expectedDate: 'Q1 2025',
  },
  
  smartEventCreation: {
    title: 'Smart Event Creation',
    description: 'AI-powered event scheduling with automatic conflict detection.',
    expectedDate: 'Q1 2025',
  },
  
  teamChat: {
    title: 'Team Chat',
    description: 'Real-time collaboration and messaging with your team.',
    expectedDate: 'Q2 2025',
  },
  
  advancedAnalytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into your productivity patterns and trends.',
    expectedDate: 'Q1 2025',
  },
  
  // Enterprise Tools
  enterprise: {
    title: 'Enterprise Tools & Admin Console',
    description: 'Powerful organization-wide management and analytics designed for team leaders and admins. Monitor team productivity, manage user permissions, track adoption metrics, and ensure compliance.',
    expectedDate: 'Q2 2025',
  },
  
  // Scripts & Templates Marketplace
  scriptsTemplates: {
    title: 'Scripts & Templates Marketplace',
    description: 'Discover and use automation scripts and workflow templates created by the SyncScript community. Save time with pre-built solutions for common tasks.',
    expectedDate: 'Q1 2025',
  },
} as const;

export type ComingSoonFeatureKey = keyof typeof COMING_SOON_FEATURES;

// =============================================================================
// INTERACTION RULES
// =============================================================================

/**
 * Standard interaction patterns
 */
export const INTERACTION_PATTERNS = {
  // Modal/Dialog standards
  modal: {
    closeOnEscape: true,
    closeOnBackdropClick: true,
    preventBodyScroll: true,
    backdropOpacity: 0.75,
  },
  
  // Drawer/Sheet standards
  drawer: {
    closeOnEscape: true,
    preventBodyScroll: true,
    defaultSide: 'right' as const,
    mobileFullScreen: true,
  },
  
  // Toast/Notification standards
  toast: {
    duration: 5000, // 5 seconds
    position: 'bottom-right' as const,
  },
  
  // Coming Soon overlay standards
  comingSoon: {
    overlayOpacity: 0.5, // 50% opacity on underlying content
    backdropBlur: true,
    showNotifyButton: true,
  },
} as const;

// =============================================================================
// ANIMATION STANDARDS
// =============================================================================

export const ANIMATION_DURATIONS = {
  fast: 150, // ms
  normal: 200,
  slow: 300,
  verySlow: 500,
} as const;

export const ANIMATION_EASINGS = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// =============================================================================
// SCROLL MANAGEMENT
// =============================================================================

/**
 * Prevent body scroll when modals/drawers are open
 */
export function preventBodyScroll() {
  document.body.style.overflow = 'hidden';
}

/**
 * Restore body scroll when modals/drawers close
 */
export function restoreBodyScroll() {
  document.body.style.overflow = '';
}

/**
 * Check if an element is scrollable
 */
export function isScrollable(element: HTMLElement): boolean {
  const hasScrollableContent = element.scrollHeight > element.clientHeight;
  const overflowYStyle = window.getComputedStyle(element).overflowY;
  const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;
  return hasScrollableContent && !isOverflowHidden;
}

// =============================================================================
// RESPONSIVE HELPERS
// =============================================================================

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): keyof typeof BREAKPOINTS | 'xs' {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Check if current viewport matches a breakpoint
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Sidebar layout rules based on breakpoint
 */
export function getSidebarLayout(): 'full' | 'compact' | 'drawer' {
  const bp = getCurrentBreakpoint();
  
  if (bp === 'xl' || bp === '2xl') return 'full';
  if (bp === 'lg') return 'compact';
  return 'drawer';
}

// =============================================================================
// NO DEAD CLICKS VALIDATION
// =============================================================================

/**
 * Validate that all clickable elements have proper handlers
 * Use in development to catch dead clicks
 */
export function validateClickableElement(
  element: HTMLElement,
  handler?: () => void
): void {
  if (process.env.NODE_ENV === 'development') {
    const isClickable = 
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.getAttribute('role') === 'button' ||
      element.style.cursor === 'pointer';
    
    if (isClickable && !handler) {
      console.warn(
        '[Dead Click Warning]',
        'Clickable element has no handler:',
        element
      );
    }
  }
}

// =============================================================================
// ROUTE VALIDATION
// =============================================================================

/**
 * Validate that a route exists in navigationLinks
 * Throws error in development if route is not defined
 */
export function validateRoute(route: string): boolean {
  const allRoutes = Object.values(navigationLinks.sidebar);
  const headerRoutes = Object.values(navigationLinks.header);
  
  const validRoutes = [
    navigationLinks.landing,
    ...allRoutes,
    ...headerRoutes,
    // Dynamic routes
    '/tasks/', // Prefix for task detail
    '/notifications/', // Prefix for notification detail
    '/achievements/', // Prefix for achievement detail
  ];
  
  const isValid = validRoutes.some(validRoute => 
    route === validRoute || route.startsWith(validRoute)
  );
  
  if (!isValid && process.env.NODE_ENV === 'development') {
    console.error(
      '[Invalid Route]',
      `Route "${route}" is not defined in navigationLinks.`,
      'Add it to utils/navigation.ts or use an existing route.'
    );
  }
  
  return isValid;
}

// Import navigationLinks for validation
import { navigationLinks } from './navigation';

// =============================================================================
// Z-INDEX SYSTEM
// =============================================================================

/**
 * Standard z-index layers
 * Use these constants to avoid z-index conflicts
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  comingSoonOverlay: 30, // Lower than modals so modals can appear over coming soon overlays
} as const;

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

/**
 * Ensure keyboard navigation works properly
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce content changes to screen readers
 */
export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}