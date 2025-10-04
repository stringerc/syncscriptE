/**
 * Calendar Write Idempotent Golden Flow Test
 * 
 * Tests that calendar write operations are idempotent:
 * 1. Creating the same event multiple times does not create duplicates
 * 2. Updating the same event multiple times with the same data is safe
 * 3. Retry/backoff scenarios do not create duplicate events
 * 4. Conflict resolution works correctly
 */

import { test, expect } from '@playwright/test'

test.describe('Calendar Write Idempotency', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/calendar')
    await page.waitForSelector('[data-testid="calendar-view"]')
  })

  test('creating same event multiple times is idempotent', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Idempotent Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event should not be duplicated')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Test Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for event to be created
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Get the event ID
    const eventId = await page.evaluate(() => {
      return window.location.pathname.split('/').pop()
    })
    
    // Try to create the same event again
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Idempotent Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event should not be duplicated')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Test Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Check that no duplicate was created
    await page.waitForSelector('[data-testid="event-already-exists"]')
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that only one event exists
    const events = page.locator('[data-testid="calendar-event"]')
    const eventCount = await events.count()
    expect(eventCount).toBe(1)
    
    // Check that the event has the correct title
    const eventTitle = await events.first().textContent()
    expect(eventTitle).toContain('Idempotent Test Event')
  })

  test('updating same event multiple times with same data is safe', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Update Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event will be updated multiple times')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for event to be created
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Update the event multiple times with the same data
    for (let i = 0; i < 3; i++) {
      await page.fill('[data-testid="event-title-input"]', 'Update Test Event')
      await page.fill('[data-testid="event-description-input"]', 'This event will be updated multiple times')
      await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
      await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
      await page.click('[data-testid="save-event-button"]')
      
      // Wait for update to complete
      await page.waitForSelector('[data-testid="event-updated"]')
    }
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that only one event exists
    const events = page.locator('[data-testid="calendar-event"]')
    const eventCount = await events.count()
    expect(eventCount).toBe(1)
    
    // Check that the event has the correct title
    const eventTitle = await events.first().textContent()
    expect(eventTitle).toContain('Update Test Event')
  })

  test('retry scenarios do not create duplicate events', async ({ page }) => {
    // Mock network failure then success
    let attemptCount = 0
    await page.route('/api/events', route => {
      attemptCount++
      if (attemptCount === 1) {
        route.abort()
      } else {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-event-id',
              title: 'Retry Test Event',
              description: 'This event was created after a retry',
              startTime: '2024-01-01T10:00:00Z',
              endTime: '2024-01-01T12:00:00Z',
              location: 'Test Location'
            }
          })
        })
      }
    })
    
    // Try to create an event (will fail first time, succeed second time)
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Retry Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event was created after a retry')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="event-location-input"]', 'Test Location')
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for retry to succeed
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Check that retry was attempted
    expect(attemptCount).toBeGreaterThan(1)
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that only one event exists
    const events = page.locator('[data-testid="calendar-event"]')
    const eventCount = await events.count()
    expect(eventCount).toBe(1)
    
    // Check that the event has the correct title
    const eventTitle = await events.first().textContent()
    expect(eventTitle).toContain('Retry Test Event')
  })

  test('conflict resolution works correctly', async ({ page }) => {
    // Create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Conflict Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event will have conflicts')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for event to be created
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Try to create a conflicting event (same time slot)
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Conflicting Event')
    await page.fill('[data-testid="event-description-input"]', 'This event conflicts with the first one')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:30:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T11:30:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Check that conflict is detected
    await page.waitForSelector('[data-testid="conflict-detected"]')
    
    // Check that conflict resolution options are shown
    const conflictMessage = page.locator('[data-testid="conflict-message"]')
    await expect(conflictMessage).toContainText('Time conflict detected')
    
    // Choose to reschedule the conflicting event
    await page.click('[data-testid="reschedule-conflict-button"]')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T13:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T15:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for event to be created
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that both events exist
    const events = page.locator('[data-testid="calendar-event"]')
    const eventCount = await events.count()
    expect(eventCount).toBe(2)
    
    // Check that events are in different time slots
    const eventTitles = await events.evaluateAll(items => 
      items.map(item => item.textContent)
    )
    
    expect(eventTitles.some(title => title?.includes('Conflict Test Event'))).toBe(true)
    expect(eventTitles.some(title => title?.includes('Conflicting Event'))).toBe(true)
  })

  test('idempotency keys prevent duplicate operations', async ({ page }) => {
    // Create an event with idempotency key
    const idempotencyKey = `test-event-${Date.now()}`
    
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Idempotency Key Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event uses idempotency keys')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="idempotency-key-input"]', idempotencyKey)
    await page.click('[data-testid="save-event-button"]')
    
    // Wait for event to be created
    await page.waitForSelector('[data-testid="event-created"]')
    
    // Try to create the same event with the same idempotency key
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Idempotency Key Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This event uses idempotency keys')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.fill('[data-testid="idempotency-key-input"]', idempotencyKey)
    await page.click('[data-testid="save-event-button"]')
    
    // Check that duplicate is prevented
    await page.waitForSelector('[data-testid="event-already-exists"]')
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that only one event exists
    const events = page.locator('[data-testid="calendar-event"]')
    const eventCount = await events.count()
    expect(eventCount).toBe(1)
  })

  test('bulk operations are idempotent', async ({ page }) => {
    // Create multiple events in bulk
    const events = [
      {
        title: 'Bulk Event 1',
        description: 'First bulk event',
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00'
      },
      {
        title: 'Bulk Event 2',
        description: 'Second bulk event',
        startTime: '2024-01-01T11:00:00',
        endTime: '2024-01-01T12:00:00'
      },
      {
        title: 'Bulk Event 3',
        description: 'Third bulk event',
        startTime: '2024-01-01T12:00:00',
        endTime: '2024-01-01T13:00:00'
      }
    ]
    
    // Create events in bulk
    await page.click('[data-testid="bulk-create-events-button"]')
    
    for (const event of events) {
      await page.fill('[data-testid="bulk-event-title-input"]', event.title)
      await page.fill('[data-testid="bulk-event-description-input"]', event.description)
      await page.fill('[data-testid="bulk-event-start-time-input"]', event.startTime)
      await page.fill('[data-testid="bulk-event-end-time-input"]', event.endTime)
      await page.click('[data-testid="add-bulk-event-button"]')
    }
    
    await page.click('[data-testid="save-bulk-events-button"]')
    
    // Wait for bulk creation to complete
    await page.waitForSelector('[data-testid="bulk-events-created"]')
    
    // Try to create the same events again
    await page.click('[data-testid="bulk-create-events-button"]')
    
    for (const event of events) {
      await page.fill('[data-testid="bulk-event-title-input"]', event.title)
      await page.fill('[data-testid="bulk-event-description-input"]', event.description)
      await page.fill('[data-testid="bulk-event-start-time-input"]', event.startTime)
      await page.fill('[data-testid="bulk-event-end-time-input"]', event.endTime)
      await page.click('[data-testid="add-bulk-event-button"]')
    }
    
    await page.click('[data-testid="save-bulk-events-button"]')
    
    // Check that duplicates are prevented
    await page.waitForSelector('[data-testid="bulk-events-already-exist"]')
    
    // Navigate to calendar view
    await page.click('[data-testid="nav-calendar"]')
    await page.waitForSelector('[data-testid="calendar-view"]')
    
    // Check that only the original events exist
    const calendarEvents = page.locator('[data-testid="calendar-event"]')
    const eventCount = await calendarEvents.count()
    expect(eventCount).toBe(3)
    
    // Check that all events have the correct titles
    const eventTitles = await calendarEvents.evaluateAll(items => 
      items.map(item => item.textContent)
    )
    
    expect(eventTitles.some(title => title?.includes('Bulk Event 1'))).toBe(true)
    expect(eventTitles.some(title => title?.includes('Bulk Event 2'))).toBe(true)
    expect(eventTitles.some(title => title?.includes('Bulk Event 3'))).toBe(true)
  })
})

test.describe('Calendar Write Error Handling', () => {
  test('handles network timeout gracefully', async ({ page }) => {
    // Mock network timeout
    await page.route('/api/events', route => {
      route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Request timeout' })
      })
    })
    
    // Try to create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Timeout Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Check that timeout error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Request timeout')
  })

  test('handles server error gracefully', async ({ page }) => {
    // Mock server error
    await page.route('/api/events', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Try to create an event
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Server Error Test Event')
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T12:00:00')
    await page.click('[data-testid="save-event-button"]')
    
    // Check that server error is displayed
    await page.waitForSelector('[data-testid="error-message"]')
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toContainText('Internal server error')
  })

  test('handles validation error gracefully', async ({ page }) => {
    // Try to create an event with invalid data
    await page.click('[data-testid="create-event-button"]')
    await page.fill('[data-testid="event-title-input"]', '') // Empty title
    await page.fill('[data-testid="event-start-time-input"]', '2024-01-01T10:00:00')
    await page.fill('[data-testid="event-end-time-input"]', '2024-01-01T09:00:00') // End before start
    await page.click('[data-testid="save-event-button"]')
    
    // Check that validation errors are displayed
    await page.waitForSelector('[data-testid="validation-error"]')
    const validationErrors = page.locator('[data-testid="validation-error"]')
    await expect(validationErrors).toContainText('Title is required')
    await expect(validationErrors).toContainText('End time must be after start time')
  })
})
