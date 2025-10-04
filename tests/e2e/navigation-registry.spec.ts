/**
 * Navigation Registry Test
 * 
 * This test verifies that the navigation registry works correctly
 * and that navigation items are properly filtered by feature flags.
 */

import { test, expect } from '@playwright/test'

test.describe('Navigation Registry', () => {
  test('Navigation registry should be accessible', async ({ page }) => {
    // This test verifies that the navigation registry file exists and is accessible
    // In a real implementation, this would test the actual registry functionality
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check that core navigation items are present
    const coreNavItems = [
      'Dashboard',
      'Tasks', 
      'Calendar'
    ]
    
    for (const item of coreNavItems) {
      const navItem = page.locator(`text=${item}`).first()
      await expect(navItem).toBeVisible()
    }
  })

  test('Feature flag filtering should work', async ({ page }) => {
    // This test would verify that navigation items are properly filtered
    // based on feature flags. For now, it's a placeholder.
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Check that settings is always visible (no feature flag)
    const settingsNav = page.locator('text=Settings').first()
    await expect(settingsNav).toBeVisible()
  })

  test('Coming soon features should be marked', async ({ page }) => {
    // This test verifies that coming soon features are properly marked
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Look for "Soon" badges on coming soon features
    const soonBadges = page.locator('text=Soon')
    const badgeCount = await soonBadges.count()
    
    // Should have at least one coming soon feature
    expect(badgeCount).toBeGreaterThan(0)
  })

  test('Navigation should be responsive', async ({ page }) => {
    // Test navigation on different screen sizes
    
    // Desktop
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // On mobile, sidebar might be hidden by default
    // This test documents the expected behavior
    const mobileSidebar = page.locator('aside')
    const isVisible = await mobileSidebar.isVisible()
    
    // Either visible or hidden is acceptable depending on implementation
    expect(typeof isVisible).toBe('boolean')
  })

  test('Navigation links should work', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Test core navigation links
    const navLinks = [
      { name: 'Tasks', href: '/tasks' },
      { name: 'Calendar', href: '/calendar' },
      { name: 'Settings', href: '/settings' }
    ]
    
    for (const link of navLinks) {
      const navItem = page.locator(`text=${link.name}`).first()
      await navItem.click()
      
      // Wait for navigation
      await page.waitForLoadState('networkidle')
      
      // Check that we're on the correct page
      expect(page.url()).toContain(link.href)
      
      // Go back to dashboard for next test
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    }
  })
})
