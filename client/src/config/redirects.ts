/**
 * Redirect Configuration
 * 
 * This file defines redirects for pages that are being moved
 * as part of the navigation consolidation effort.
 * 
 * Provider pages are being moved from root level to Settings → Integrations
 * to reduce navigation clutter and follow common UX patterns.
 */

export interface RedirectRule {
  from: string
  to: string
  permanent?: boolean
  reason: string
}

/**
 * Planned Redirects for Navigation Consolidation
 * 
 * These redirects will be implemented when the provider pages
 * are moved to Settings → Integrations.
 */
export const plannedRedirects: RedirectRule[] = [
  {
    from: '/google-calendar',
    to: '/settings/integrations/google-calendar',
    permanent: true,
    reason: 'Move Google Calendar to Settings → Integrations'
  },
  {
    from: '/outlook-calendar', 
    to: '/settings/integrations/outlook-calendar',
    permanent: true,
    reason: 'Move Outlook Calendar to Settings → Integrations'
  },
  {
    from: '/apple-calendar',
    to: '/settings/integrations/apple-calendar', 
    permanent: true,
    reason: 'Move Apple Calendar to Settings → Integrations'
  },
  {
    from: '/multi-calendar',
    to: '/settings/integrations/calendar-overview',
    permanent: true,
    reason: 'Move Multi Calendar to Settings → Integrations'
  }
]

/**
 * Current Redirects (if any)
 * 
 * These are redirects that are currently active.
 */
export const currentRedirects: RedirectRule[] = [
  // No current redirects - this is where they would be defined
]

/**
 * Redirect Helper Functions
 */
export function getRedirectForPath(path: string): RedirectRule | null {
  return currentRedirects.find(redirect => redirect.from === path) || null
}

export function getAllRedirects(): RedirectRule[] {
  return [...currentRedirects, ...plannedRedirects]
}

export function getRedirectsByReason(reason: string): RedirectRule[] {
  return getAllRedirects().filter(redirect => redirect.reason.includes(reason))
}

/**
 * Implementation Notes
 * 
 * When implementing these redirects:
 * 
 * 1. Update the routing configuration to handle the redirects
 * 2. Add proper HTTP status codes (301 for permanent, 302 for temporary)
 * 3. Update any internal links to use the new paths
 * 4. Add redirect tests to ensure they work correctly
 * 5. Update documentation and help text
 * 
 * Example implementation in React Router:
 * 
 * ```tsx
 * <Route path="/google-calendar" element={<Navigate to="/settings/integrations/google-calendar" replace />} />
 * ```
 * 
 * Example implementation in Express:
 * 
 * ```ts
 * app.get('/google-calendar', (req, res) => {
 *   res.redirect(301, '/settings/integrations/google-calendar')
 * })
 * ```
 */
