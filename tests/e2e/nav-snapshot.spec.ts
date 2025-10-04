/**
 * Navigation Snapshot Test
 * 
 * This test ensures that all navigation items mount without 500 errors
 * and have proper heading landmarks for accessibility.
 * 
 * It serves as a regression test for navigation changes and helps
 * catch routing issues early.
 */

import { test, expect } from '@playwright/test'

// Navigation items from the registry
const navigationItems = [
  // Core navigation
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Calendar', href: '/calendar' },
  
  // Plan navigation
  { name: 'Projects', href: '/projects' },
  { name: 'Templates', href: '/templates' },
  
  // People navigation
  { name: 'Friends', href: '/friends' },
  
  // Me navigation
  { name: 'Progress', href: '/gamification' },
  { name: 'Notifications', href: '/notifications' },
  { name: 'Profile', href: '/profile' },
  { name: 'Settings', href: '/settings' },
  
  // Settings sub-navigation
  { name: 'Profile Settings', href: '/settings/profile' },
  { name: 'Preferences', href: '/settings/preferences' },
  { name: 'Google Calendar Integration', href: '/settings/integrations/google-calendar' },
  { name: 'Outlook Calendar Integration', href: '/settings/integrations/outlook-calendar' },
  { name: 'Apple Calendar Integration', href: '/settings/integrations/apple-calendar' },
  { name: 'Feature Flags', href: '/settings/features' }
]

// Provider pages that will be moved to settings (documentation only)
const providerPages = [
  { name: 'Google Calendar', href: '/google-calendar' },
  { name: 'Outlook Calendar', href: '/outlook-calendar' },
  { name: 'Apple Calendar', href: '/apple-calendar' },
  { name: 'Multi Calendar', href: '/multi-calendar' }
]

test.describe('Navigation Snapshot Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - you may need to adjust this based on your auth setup
    await page.goto('/login')
    
    // Fill in login form (adjust selectors as needed)
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'testpassword')
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('All navigation items should mount without 500 errors', async ({ page }) => {
    const results: Array<{ name: string; href: string; status: 'success' | 'error'; error?: string }> = []
    
    for (const item of navigationItems) {
      try {
        console.log(`Testing navigation item: ${item.name} (${item.href})`)
        
        // Navigate to the page
        await page.goto(item.href)
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle')
        
        // Check for 500 errors
        const response = await page.waitForResponse(response => 
          response.url().includes(item.href) && response.status() === 200
        ).catch(() => null)
        
        if (response) {
          results.push({ name: item.name, href: item.href, status: 'success' })
        } else {
          // Check if there's a 500 error
          const errorElement = await page.locator('text=500').first()
          if (await errorElement.isVisible()) {
            results.push({ 
              name: item.name, 
              href: item.href, 
              status: 'error', 
              error: '500 Internal Server Error' 
            })
          } else {
            results.push({ name: item.name, href: item.href, status: 'success' })
          }
        }
        
      } catch (error) {
        results.push({ 
          name: item.name, 
          href: item.href, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    // Report results
    const errors = results.filter(r => r.status === 'error')
    const successes = results.filter(r => r.status === 'success')
    
    console.log(`Navigation test results: ${successes.length} success, ${errors.length} errors`)
    
    if (errors.length > 0) {
      console.error('Navigation errors:')
      errors.forEach(error => {
        console.error(`  - ${error.name} (${error.href}): ${error.error}`)
      })
    }
    
    // Assert that all navigation items work
    expect(errors).toHaveLength(0)
  })

  test('All navigation items should have proper heading landmarks', async ({ page }) => {
    const results: Array<{ name: string; href: string; hasHeading: boolean; headingText?: string }> = []
    
    for (const item of navigationItems) {
      try {
        console.log(`Testing heading landmark: ${item.name} (${item.href})`)
        
        await page.goto(item.href)
        await page.waitForLoadState('networkidle')
        
        // Look for heading elements (h1, h2, h3, etc.)
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
        
        if (headings.length > 0) {
          const firstHeading = await headings[0].textContent()
          results.push({ 
            name: item.name, 
            href: item.href, 
            hasHeading: true, 
            headingText: firstHeading?.trim() 
          })
        } else {
          results.push({ 
            name: item.name, 
            href: item.href, 
            hasHeading: false 
          })
        }
        
      } catch (error) {
        results.push({ 
          name: item.name, 
          href: item.href, 
          hasHeading: false 
        })
      }
    }
    
    // Report results
    const missingHeadings = results.filter(r => !r.hasHeading)
    const withHeadings = results.filter(r => r.hasHeading)
    
    console.log(`Heading test results: ${withHeadings.length} with headings, ${missingHeadings.length} missing`)
    
    if (missingHeadings.length > 0) {
      console.error('Pages missing heading landmarks:')
      missingHeadings.forEach(item => {
        console.error(`  - ${item.name} (${item.href})`)
      })
    }
    
    // Assert that all pages have heading landmarks
    expect(missingHeadings).toHaveLength(0)
  })

  test('Provider pages should still be accessible (before migration)', async ({ page }) => {
    // This test documents that provider pages are still accessible
    // before they are moved to settings
    const results: Array<{ name: string; href: string; accessible: boolean; error?: string }> = []
    
    for (const item of providerPages) {
      try {
        console.log(`Testing provider page: ${item.name} (${item.href})`)
        
        await page.goto(item.href)
        await page.waitForLoadState('networkidle')
        
        // Check if page loads (may be 404 or redirect, that's ok)
        const currentUrl = page.url()
        const hasError = await page.locator('text=404').isVisible()
        
        results.push({ 
          name: item.name, 
          href: item.href, 
          accessible: !hasError && currentUrl.includes(item.href)
        })
        
      } catch (error) {
        results.push({ 
          name: item.name, 
          href: item.href, 
          accessible: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    // Report results
    const accessible = results.filter(r => r.accessible)
    const inaccessible = results.filter(r => !r.accessible)
    
    console.log(`Provider page test results: ${accessible.length} accessible, ${inaccessible.length} inaccessible`)
    
    if (inaccessible.length > 0) {
      console.warn('Provider pages that are not accessible:')
      inaccessible.forEach(item => {
        console.warn(`  - ${item.name} (${item.href}): ${item.error || 'Not accessible'}`)
      })
    }
    
    // Note: We don't assert here because these pages may legitimately be 404
    // This is just documentation of current state
  })

  test('Navigation should be consistent across page loads', async ({ page }) => {
    // Test that navigation items appear consistently
    const navigationSelectors = [
      '[data-testid="nav-dashboard"]',
      '[data-testid="nav-tasks"]',
      '[data-testid="nav-calendar"]',
      '[data-testid="nav-settings"]'
    ]
    
    const results: Array<{ selector: string; visible: boolean; text?: string }> = []
    
    for (const selector of navigationSelectors) {
      try {
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')
        
        const element = page.locator(selector)
        const isVisible = await element.isVisible()
        const text = isVisible ? await element.textContent() : undefined
        
        results.push({ selector, visible: isVisible, text: text?.trim() })
        
      } catch (error) {
        results.push({ selector, visible: false })
      }
    }
    
    // Report results
    const visible = results.filter(r => r.visible)
    const hidden = results.filter(r => !r.visible)
    
    console.log(`Navigation consistency: ${visible.length} visible, ${hidden.length} hidden`)
    
    if (hidden.length > 0) {
      console.warn('Navigation items not visible:')
      hidden.forEach(item => {
        console.warn(`  - ${item.selector}`)
      })
    }
    
    // Assert that core navigation is visible
    expect(visible.length).toBeGreaterThan(0)
  })
})
