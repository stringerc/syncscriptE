/**
 * Coming Soon Features Visibility Tests
 * 
 * Tests that "coming soon" features are properly displayed
 * and that their routes are accessible but show appropriate
 * coming soon messages.
 */

import { test, expect } from '@playwright/test'

test.describe('Coming Soon Features Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="navigation"]')
  })

  test('notifications page shows coming soon', async ({ page }) => {
    // Navigate to notifications page
    await page.click('[data-testid="nav-notifications"]')
    
    // Check that coming soon message is displayed
    await page.waitForSelector('[data-testid="coming-soon-message"]')
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).toContainText('Coming Soon')
    await expect(comingSoonMessage).toContainText('Notifications')
    
    // Check that feature description is shown
    const featureDescription = page.locator('[data-testid="feature-description"]')
    await expect(featureDescription).toContainText('Multi-channel notification system')
  })

  test('outlook calendar page shows coming soon', async ({ page }) => {
    // Navigate to outlook calendar page
    await page.goto('/outlook-calendar')
    
    // Check that coming soon message is displayed
    await page.waitForSelector('[data-testid="coming-soon-message"]')
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).toContainText('Coming Soon')
    await expect(comingSoonMessage).toContainText('Outlook Calendar')
    
    // Check that feature description is shown
    const featureDescription = page.locator('[data-testid="feature-description"]')
    await expect(featureDescription).toContainText('Microsoft Graph API integration')
  })

  test('apple calendar page shows coming soon', async ({ page }) => {
    // Navigate to apple calendar page
    await page.goto('/apple-calendar')
    
    // Check that coming soon message is displayed
    await page.waitForSelector('[data-testid="coming-soon-message"]')
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).toContainText('Coming Soon')
    await expect(comingSoonMessage).toContainText('Apple Calendar')
    
    // Check that feature description is shown
    const featureDescription = page.locator('[data-testid="feature-description"]')
    await expect(featureDescription).toContainText('CalDAV protocol support')
  })

  test('energy analysis page shows coming soon', async ({ page }) => {
    // Navigate to energy analysis page
    await page.goto('/energy-analysis')
    
    // Check that coming soon message is displayed
    await page.waitForSelector('[data-testid="coming-soon-message"]')
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).toContainText('Coming Soon')
    await expect(comingSoonMessage).toContainText('Energy Analysis')
    
    // Check that feature description is shown
    const featureDescription = page.locator('[data-testid="feature-description"]')
    await expect(featureDescription).toContainText('Historical energy analysis and insights')
  })

  test('financial analytics page shows coming soon', async ({ page }) => {
    // Navigate to financial page
    await page.goto('/financial')
    
    // Check that coming soon message is displayed
    await page.waitForSelector('[data-testid="coming-soon-message"]')
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).toContainText('Coming Soon')
    await expect(comingSoonMessage).toContainText('Financial Analytics')
    
    // Check that feature description is shown
    const featureDescription = page.locator('[data-testid="feature-description"]')
    await expect(featureDescription).toContainText('Advanced budgeting analytics')
  })

  test('focus lock feature shows coming soon', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks')
    
    // Check that focus lock button shows coming soon
    const focusLockButton = page.locator('[data-testid="focus-lock-button"]')
    await expect(focusLockButton).toContainText('Coming Soon')
    
    // Click the button to see coming soon message
    await focusLockButton.click()
    
    // Check that coming soon modal is displayed
    await page.waitForSelector('[data-testid="coming-soon-modal"]')
    const comingSoonModal = page.locator('[data-testid="coming-soon-modal"]')
    await expect(comingSoonModal).toContainText('Focus Lock')
    await expect(comingSoonModal).toContainText('Website blocking and focus time tracking')
  })

  test('priority hierarchy feature shows coming soon', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks')
    
    // Check that priority hierarchy button shows coming soon
    const priorityHierarchyButton = page.locator('[data-testid="priority-hierarchy-button"]')
    await expect(priorityHierarchyButton).toContainText('Coming Soon')
    
    // Click the button to see coming soon message
    await priorityHierarchyButton.click()
    
    // Check that coming soon modal is displayed
    await page.waitForSelector('[data-testid="coming-soon-modal"]')
    const comingSoonModal = page.locator('[data-testid="coming-soon-modal"]')
    await expect(comingSoonModal).toContainText('Priority Hierarchy')
    await expect(comingSoonModal).toContainText('Critical path calculation')
  })

  test('morning brief feature shows coming soon', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that morning brief button shows coming soon
    const morningBriefButton = page.locator('[data-testid="morning-brief-button"]')
    await expect(morningBriefButton).toContainText('Coming Soon')
    
    // Click the button to see coming soon message
    await morningBriefButton.click()
    
    // Check that coming soon modal is displayed
    await page.waitForSelector('[data-testid="coming-soon-modal"]')
    const comingSoonModal = page.locator('[data-testid="coming-soon-modal"]')
    await expect(comingSoonModal).toContainText('Morning Brief')
    await expect(comingSoonModal).toContainText('Automated morning briefings')
  })

  test('evening journal feature shows coming soon', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that evening journal button shows coming soon
    const eveningJournalButton = page.locator('[data-testid="evening-journal-button"]')
    await expect(eveningJournalButton).toContainText('Coming Soon')
    
    // Click the button to see coming soon message
    await eveningJournalButton.click()
    
    // Check that coming soon modal is displayed
    await page.waitForSelector('[data-testid="coming-soon-modal"]')
    const comingSoonModal = page.locator('[data-testid="coming-soon-modal"]')
    await expect(comingSoonModal).toContainText('Evening Journal')
    await expect(comingSoonModal).toContainText('Daily reflection and planning')
  })

  test('coming soon features are marked in navigation', async ({ page }) => {
    // Check that coming soon features are marked in sidebar
    const sidebar = page.locator('[data-testid="sidebar"]')
    
    // Check that notifications is marked as coming soon
    const notificationsNav = sidebar.locator('[data-testid="nav-notifications"]')
    await expect(notificationsNav).toContainText('Coming Soon')
    
    // Check that financial is marked as coming soon
    const financialNav = sidebar.locator('[data-testid="nav-financial"]')
    await expect(financialNav).toContainText('Coming Soon')
  })

  test('coming soon features show appropriate icons', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that coming soon features have appropriate icons
    const morningBriefButton = page.locator('[data-testid="morning-brief-button"]')
    await expect(morningBriefButton).toHaveAttribute('data-icon', 'sunrise')
    
    const eveningJournalButton = page.locator('[data-testid="evening-journal-button"]')
    await expect(eveningJournalButton).toHaveAttribute('data-icon', 'moon')
    
    const focusLockButton = page.locator('[data-testid="focus-lock-button"]')
    await expect(focusLockButton).toHaveAttribute('data-icon', 'lock')
  })

  test('coming soon features have consistent styling', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Check that coming soon buttons have consistent styling
    const comingSoonButtons = page.locator('[data-testid*="coming-soon"]')
    const buttonCount = await comingSoonButtons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = comingSoonButtons.nth(i)
      
      // Check that button has coming soon styling
      await expect(button).toHaveClass(/coming-soon/)
      
      // Check that button has disabled state
      await expect(button).toHaveAttribute('disabled')
      
      // Check that button has tooltip
      await expect(button).toHaveAttribute('title')
    }
  })

  test('coming soon features show progress indicators', async ({ page }) => {
    // Navigate to a coming soon page
    await page.goto('/notifications')
    
    // Check that progress indicator is shown
    const progressIndicator = page.locator('[data-testid="progress-indicator"]')
    await expect(progressIndicator).toBeVisible()
    
    // Check that progress percentage is shown
    const progressPercentage = page.locator('[data-testid="progress-percentage"]')
    await expect(progressPercentage).toContainText('%')
    
    // Check that estimated completion date is shown
    const estimatedDate = page.locator('[data-testid="estimated-completion"]')
    await expect(estimatedDate).toContainText('2024')
  })

  test('coming soon features allow signup for notifications', async ({ page }) => {
    // Navigate to a coming soon page
    await page.goto('/notifications')
    
    // Check that signup form is available
    const signupForm = page.locator('[data-testid="coming-soon-signup"]')
    await expect(signupForm).toBeVisible()
    
    // Fill out signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="notify-me-button"]')
    
    // Check that signup confirmation is shown
    await page.waitForSelector('[data-testid="signup-confirmation"]')
    const confirmation = page.locator('[data-testid="signup-confirmation"]')
    await expect(confirmation).toContainText('We\'ll notify you when this feature is ready')
  })
})

test.describe('Coming Soon Feature Flags', () => {
  test('coming soon features respect feature flags', async ({ page }) => {
    // Mock feature flags to enable a coming soon feature
    await page.addInitScript(() => {
      window.featureFlags = {
        notifications: true,
        outlookCalendar: false,
        appleCalendar: false,
        energyAnalysis: false,
        financial: false,
        focusLock: false,
        priorityHierarchy: false,
        brief: false,
        endDay: false
      }
    })
    
    // Navigate to notifications page
    await page.goto('/notifications')
    
    // Check that feature is now available (not coming soon)
    await page.waitForSelector('[data-testid="notifications-page"]')
    const notificationsPage = page.locator('[data-testid="notifications-page"]')
    await expect(notificationsPage).toBeVisible()
    
    // Check that coming soon message is not shown
    const comingSoonMessage = page.locator('[data-testid="coming-soon-message"]')
    await expect(comingSoonMessage).not.toBeVisible()
  })

  test('coming soon features can be toggled via feature flags', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/settings')
    
    // Check that coming soon features are listed in feature flags
    const featureFlagsSection = page.locator('[data-testid="feature-flags-section"]')
    await expect(featureFlagsSection).toBeVisible()
    
    // Check that coming soon features are marked as disabled
    const comingSoonFlags = page.locator('[data-testid="feature-flag-coming-soon"]')
    const flagCount = await comingSoonFlags.count()
    expect(flagCount).toBeGreaterThan(0)
    
    // Check that coming soon flags show coming soon status
    for (let i = 0; i < flagCount; i++) {
      const flag = comingSoonFlags.nth(i)
      await expect(flag).toContainText('Coming Soon')
      await expect(flag).toHaveAttribute('disabled')
    }
  })
})

test.describe('Coming Soon Feature Documentation', () => {
  test('coming soon features link to documentation', async ({ page }) => {
    // Navigate to a coming soon page
    await page.goto('/notifications')
    
    // Check that documentation link is available
    const documentationLink = page.locator('[data-testid="documentation-link"]')
    await expect(documentationLink).toBeVisible()
    
    // Click documentation link
    await documentationLink.click()
    
    // Check that documentation page opens
    await page.waitForSelector('[data-testid="documentation-page"]')
    const documentationPage = page.locator('[data-testid="documentation-page"]')
    await expect(documentationPage).toBeVisible()
    
    // Check that documentation contains feature details
    const featureDetails = page.locator('[data-testid="feature-details"]')
    await expect(featureDetails).toContainText('Notifications')
    await expect(featureDetails).toContainText('Multi-channel notification system')
  })

  test('coming soon features show roadmap information', async ({ page }) => {
    // Navigate to a coming soon page
    await page.goto('/notifications')
    
    // Check that roadmap link is available
    const roadmapLink = page.locator('[data-testid="roadmap-link"]')
    await expect(roadmapLink).toBeVisible()
    
    // Click roadmap link
    await roadmapLink.click()
    
    // Check that roadmap page opens
    await page.waitForSelector('[data-testid="roadmap-page"]')
    const roadmapPage = page.locator('[data-testid="roadmap-page"]')
    await expect(roadmapPage).toBeVisible()
    
    // Check that roadmap contains feature timeline
    const featureTimeline = page.locator('[data-testid="feature-timeline"]')
    await expect(featureTimeline).toContainText('Notifications')
    await expect(featureTimeline).toContainText('Q2 2024')
  })
})
