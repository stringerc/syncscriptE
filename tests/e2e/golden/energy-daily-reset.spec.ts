/**
 * Energy Daily Reset Golden Flow Test
 * 
 * Tests the complete energy daily reset flow:
 * 1. User starts with 0 energy at day start
 * 2. User completes tasks and earns EP
 * 3. Energy increases based on EP conversion
 * 4. At midnight, energy resets to 0 and EP is converted to energy
 * 5. Energy levels and achievements persist across days
 */

import { test, expect } from '@playwright/test'

test.describe('Energy Daily Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="energy-display"]')
  })

  test('energy starts at 0 at day start', async ({ page }) => {
    // Check that energy display shows 0/10
    const energyDisplay = page.locator('[data-testid="energy-display"]')
    await expect(energyDisplay).toContainText('0/10')
    
    // Check that EP counter shows 0
    const epDisplay = page.locator('[data-testid="ep-display"]')
    await expect(epDisplay).toContainText('0 EP')
  })

  test('energy increases when completing tasks', async ({ page }) => {
    // Navigate to tasks page
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    // Create a new task
    await page.click('[data-testid="create-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Test Task for Energy')
    await page.selectOption('[data-testid="task-priority-select"]', 'MEDIUM')
    await page.fill('[data-testid="task-energy-required-input"]', '5')
    await page.click('[data-testid="save-task-button"]')
    
    // Complete the task
    const taskItem = page.locator('[data-testid="task-item"]').first()
    await taskItem.click('[data-testid="complete-task-button"]')
    
    // Wait for energy update
    await page.waitForSelector('[data-testid="energy-updated"]')
    
    // Check that energy increased
    const energyDisplay = page.locator('[data-testid="energy-display"]')
    await expect(energyDisplay).toContainText('5/10')
    
    // Check that EP increased
    const epDisplay = page.locator('[data-testid="ep-display"]')
    await expect(epDisplay).toContainText('5 EP')
  })

  test('energy resets at midnight', async ({ page }) => {
    // Mock midnight time
    await page.addInitScript(() => {
      // Mock Date to be midnight
      const mockDate = new Date()
      mockDate.setHours(0, 0, 0, 0)
      Date.now = () => mockDate.getTime()
    })
    
    // Trigger energy reset (this would normally be done by cron job)
    await page.evaluate(() => {
      // Simulate energy reset API call
      return fetch('/api/energy/reset', { method: 'POST' })
    })
    
    // Wait for energy reset
    await page.waitForSelector('[data-testid="energy-reset"]')
    
    // Check that energy is back to 0
    const energyDisplay = page.locator('[data-testid="energy-display"]')
    await expect(energyDisplay).toContainText('0/10')
    
    // Check that EP counter is reset
    const epDisplay = page.locator('[data-testid="ep-display"]')
    await expect(epDisplay).toContainText('0 EP')
  })

  test('achievements persist across days', async ({ page }) => {
    // Navigate to gamification page
    await page.click('[data-testid="nav-gamification"]')
    await page.waitForSelector('[data-testid="achievements-list"]')
    
    // Check that achievements are still visible
    const achievements = page.locator('[data-testid="achievement-item"]')
    await expect(achievements).toHaveCount(0) // No achievements yet
    
    // Complete a task to earn an achievement
    await page.click('[data-testid="nav-tasks"]')
    await page.click('[data-testid="create-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'First Task')
    await page.click('[data-testid="save-task-button"]')
    
    const taskItem = page.locator('[data-testid="task-item"]').first()
    await taskItem.click('[data-testid="complete-task-button"]')
    
    // Go back to gamification page
    await page.click('[data-testid="nav-gamification"]')
    await page.waitForSelector('[data-testid="achievements-list"]')
    
    // Check that achievement was earned
    const achievementsAfter = page.locator('[data-testid="achievement-item"]')
    await expect(achievementsAfter).toHaveCount(1)
    
    // Mock midnight and energy reset
    await page.addInitScript(() => {
      const mockDate = new Date()
      mockDate.setHours(0, 0, 0, 0)
      Date.now = () => mockDate.getTime()
    })
    
    await page.evaluate(() => {
      return fetch('/api/energy/reset', { method: 'POST' })
    })
    
    // Check that achievement still exists after reset
    await page.reload()
    await page.waitForSelector('[data-testid="achievements-list"]')
    
    const achievementsAfterReset = page.locator('[data-testid="achievement-item"]')
    await expect(achievementsAfterReset).toHaveCount(1)
  })

  test('energy conversion uses diminishing returns', async ({ page }) => {
    // Create multiple tasks to test diminishing returns
    await page.click('[data-testid="nav-tasks"]')
    
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="create-task-button"]')
      await page.fill('[data-testid="task-title-input"]', `Task ${i + 1}`)
      await page.fill('[data-testid="task-energy-required-input"]', '5')
      await page.click('[data-testid="save-task-button"]')
      
      const taskItem = page.locator('[data-testid="task-item"]').first()
      await taskItem.click('[data-testid="complete-task-button"]')
      
      await page.waitForSelector('[data-testid="energy-updated"]')
    }
    
    // Check that energy display shows diminishing returns
    const energyDisplay = page.locator('[data-testid="energy-display"]')
    const energyText = await energyDisplay.textContent()
    const energyValue = parseInt(energyText?.split('/')[0] || '0')
    
    // With 50 EP, energy should be 50
    // With 50+ EP, energy should be 50 + (excess * 0.5)
    // So 50 EP = 50 energy, 100 EP = 75 energy
    expect(energyValue).toBeGreaterThan(50)
    expect(energyValue).toBeLessThan(100)
  })

  test('energy reset respects user timezone', async ({ page }) => {
    // Set user timezone to Pacific
    await page.click('[data-testid="nav-settings"]')
    await page.selectOption('[data-testid="timezone-select"]', 'America/Los_Angeles')
    await page.click('[data-testid="save-settings-button"]')
    
    // Mock time to be 11:59 PM Pacific
    await page.addInitScript(() => {
      const mockDate = new Date()
      mockDate.setHours(23, 59, 0, 0) // 11:59 PM
      Date.now = () => mockDate.getTime()
    })
    
    // Complete a task
    await page.click('[data-testid="nav-tasks"]')
    await page.click('[data-testid="create-task-button"]')
    await page.fill('[data-testid="task-title-input"]', 'Timezone Test Task')
    await page.click('[data-testid="save-task-button"]')
    
    const taskItem = page.locator('[data-testid="task-item"]').first()
    await taskItem.click('[data-testid="complete-task-button"]')
    
    // Check that energy increased
    const energyDisplay = page.locator('[data-testid="energy-display"]')
    await expect(energyDisplay).toContainText('5/10')
    
    // Mock time to be 12:01 AM Pacific (midnight)
    await page.addInitScript(() => {
      const mockDate = new Date()
      mockDate.setHours(0, 1, 0, 0) // 12:01 AM
      Date.now = () => mockDate.getTime()
    })
    
    // Trigger energy reset
    await page.evaluate(() => {
      return fetch('/api/energy/reset', { method: 'POST' })
    })
    
    // Check that energy reset
    await page.waitForSelector('[data-testid="energy-reset"]')
    const energyDisplayAfter = page.locator('[data-testid="energy-display"]')
    await expect(energyDisplayAfter).toContainText('0/10')
  })
})

test.describe('Energy Daily Reset Error Handling', () => {
  test('handles energy reset failure gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/energy/reset', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Energy reset failed' })
      })
    })
    
    // Try to trigger energy reset
    const response = await page.evaluate(() => {
      return fetch('/api/energy/reset', { method: 'POST' })
    })
    
    expect(response.status).toBe(500)
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Energy reset failed')
  })

  test('retries energy reset on network failure', async ({ page }) => {
    let attemptCount = 0
    
    // Mock network failure then success
    await page.route('/api/energy/reset', route => {
      attemptCount++
      if (attemptCount === 1) {
        route.abort()
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })
    
    // Trigger energy reset
    await page.evaluate(() => {
      return fetch('/api/energy/reset', { method: 'POST' })
    })
    
    // Check that retry was attempted
    expect(attemptCount).toBeGreaterThan(1)
  })
})
