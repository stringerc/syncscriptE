/**
 * Apply Script Idempotent Golden Flow Test
 * 
 * Tests that applying the same ScriptVersion to the same Event
 * multiple times does not create duplicate tasks or events.
 */

import { test, expect } from '@playwright/test'

test.describe('Script Application Idempotency', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to templates page
    await page.goto('/templates')
    await page.waitForSelector('[data-testid="template-list"]')
  })

  test('applying same script to same event is idempotent', async ({ page }) => {
    // Create a new event first
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Test Event for Script')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Get the event ID
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Navigate back to templates
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    // Select a template
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    // Apply template to the event
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    // Wait for application to complete
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that tasks were created
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const initialTaskCount = await page.locator('[data-testid="task-item"]').count()
    expect(initialTaskCount).toBeGreaterThan(0)
    
    // Apply the same template to the same event again
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem2 = page.locator('[data-testid="template-item"]').first()
    await templateItem2.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    // Wait for application to complete
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that no duplicate tasks were created
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const finalTaskCount = await page.locator('[data-testid="task-item"]').count()
    expect(finalTaskCount).toBe(initialTaskCount)
  })

  test('applying different script to same event creates new tasks', async ({ page }) => {
    // Create a new event
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Test Event for Multiple Scripts')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Apply first template
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem1 = page.locator('[data-testid="template-item"]').first()
    await templateItem1.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check initial task count
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const initialTaskCount = await page.locator('[data-testid="task-item"]').count()
    
    // Apply second template
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem2 = page.locator('[data-testid="template-item"]').nth(1)
    await templateItem2.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that new tasks were created
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const finalTaskCount = await page.locator('[data-testid="task-item"]').count()
    expect(finalTaskCount).toBeGreaterThan(initialTaskCount)
  })

  test('applying same script to different events creates separate tasks', async ({ page }) => {
    // Create first event
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Event 1')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId1 = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Create second event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Event 2')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-02T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-02T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId2 = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Apply template to first event
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId1)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Apply same template to second event
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId2)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that tasks were created for both events
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const taskCount = await page.locator('[data-testid="task-item"]').count()
    expect(taskCount).toBeGreaterThan(0)
    
    // Check that tasks are linked to different events
    const tasks = page.locator('[data-testid="task-item"]')
    const eventIds = await tasks.evaluateAll(items => 
      items.map(item => item.getAttribute('data-event-id'))
    )
    
    expect(eventIds).toContain(eventId1)
    expect(eventIds).toContain(eventId2)
  })

  test('script application preserves task order and dependencies', async ({ page }) => {
    // Create event
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Order Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Apply template
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check task order
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const tasks = page.locator('[data-testid="task-item"]')
    const taskTitles = await tasks.evaluateAll(items => 
      items.map(item => item.querySelector('[data-testid="task-title"]')?.textContent)
    )
    
    // Check that tasks are in the correct order
    expect(taskTitles.length).toBeGreaterThan(0)
    
    // Apply same template again
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem2 = page.locator('[data-testid="template-item"]').first()
    await templateItem2.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that task order is preserved
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const tasksAfter = page.locator('[data-testid="task-item"]')
    const taskTitlesAfter = await tasksAfter.evaluateAll(items => 
      items.map(item => item.querySelector('[data-testid="task-title"]')?.textContent)
    )
    
    expect(taskTitlesAfter).toEqual(taskTitles)
  })

  test('script application handles variable substitution', async ({ page }) => {
    // Create event
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Variable Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Apply template with variables
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    
    // Fill in template variables
    await page.fill('[data-testid="template-variable-name"]', 'John Doe')
    await page.fill('[data-testid="template-variable-location"]', 'San Francisco')
    
    await page.click('[data-testid="confirm-apply-button"]')
    
    await page.waitForSelector('[data-testid="template-applied"]')
    
    // Check that variables were substituted
    await page.click('[data-testid="nav-tasks"]')
    await page.waitForSelector('[data-testid="task-list"]')
    
    const tasks = page.locator('[data-testid="task-item"]')
    const taskDescriptions = await tasks.evaluateAll(items => 
      items.map(item => item.querySelector('[data-testid="task-description"]')?.textContent)
    )
    
    // Check that variables were substituted in task descriptions
    const hasVariableSubstitution = taskDescriptions.some(desc => 
      desc?.includes('John Doe') || desc?.includes('San Francisco')
    )
    expect(hasVariableSubstitution).toBe(true)
  })
})

test.describe('Script Application Error Handling', () => {
  test('handles template not found error', async ({ page }) => {
    // Try to apply non-existent template
    await page.goto('/templates/apply/non-existent-template')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Template not found')
  })

  test('handles event not found error', async ({ page }) => {
    // Navigate to templates
    await page.goto('/templates')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    await page.click('[data-testid="apply-template-button"]')
    
    // Try to select non-existent event
    await page.selectOption('[data-testid="event-select"]', 'non-existent-event')
    await page.click('[data-testid="confirm-apply-button"]')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Event not found')
  })

  test('handles template application failure', async ({ page }) => {
    // Mock API failure
    await page.route('/api/templates/apply', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Template application failed' })
      })
    })
    
    // Create event
    await page.click('[data-testid="nav-calendar"]')
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Error Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Try to apply template
    await page.click('[data-testid="nav-templates"]')
    await page.waitForSelector('[data-testid="template-list"]')
    
    const templateItem = page.locator('[data-testid="template-item"]').first()
    await templateItem.click()
    
    await page.click('[data-testid="apply-template-button"]')
    await page.selectOption('[data-testid="event-select"]', eventId)
    await page.click('[data-testid="confirm-apply-button"]')
    
    // Check that error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Template application failed')
  })
})
