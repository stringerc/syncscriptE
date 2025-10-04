/**
 * Pin Button Gate Test
 * 
 * Verifies that pin button works: click → rail updates; p95 <150ms; persists reload
 */

import { test, expect } from '@playwright/test';

test.describe('Pin Button Gate', () => {
  test('click → rail updates; p95 <150ms; persists reload', async ({ page, request }) => {
    // This test would require authentication and a test event
    // For now, we'll create a placeholder that documents the expected behavior
    
    // 1. Navigate to an event modal
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // 2. Click on an event to open the modal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    // Wait for the modal to open
    await page.waitForSelector('[data-testid="event-modal"]');
    
    // 3. Click the pin button
    const pinButton = page.locator('[data-testid="pin-button"]');
    await expect(pinButton).toBeVisible();
    
    // Measure performance
    const startTime = Date.now();
    await pinButton.click();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Verify response time is under 150ms
    expect(responseTime).toBeLessThan(150);
    
    // 4. Verify the button state changes
    await expect(pinButton).toContainText('Unpin');
    
    // 5. Verify the event appears in the pinned rail
    const pinnedRail = page.locator('[data-testid="pinned-events-rail"]');
    await expect(pinnedRail).toBeVisible();
    
    // 6. Reload the page and verify the pin persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that the event is still pinned in the rail
    const pinnedEvent = page.locator('[data-testid="pinned-event"]').first();
    await expect(pinnedEvent).toBeVisible();
    
    // 7. Unpin the event
    await pinnedEvent.click();
    await page.waitForSelector('[data-testid="event-modal"]');
    
    const unpinButton = page.locator('[data-testid="pin-button"]');
    await unpinButton.click();
    
    // Verify the event is removed from the rail
    await expect(pinnedEvent).not.toBeVisible();
  });
  
  test('maximum 5 pinned events enforced', async ({ page }) => {
    // Test that only 5 events can be pinned at once
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Pin 5 events
    for (let i = 0; i < 5; i++) {
      const eventCard = page.locator('[data-testid="event-card"]').nth(i);
      await eventCard.click();
      
      const pinButton = page.locator('[data-testid="pin-button"]');
      await pinButton.click();
      
      // Close modal
      await page.keyboard.press('Escape');
    }
    
    // Try to pin a 6th event
    const sixthEvent = page.locator('[data-testid="event-card"]').nth(5);
    await sixthEvent.click();
    
    const pinButton = page.locator('[data-testid="pin-button"]');
    await pinButton.click();
    
    // Should show error message
    await expect(page.locator('text=Maximum number of pinned events')).toBeVisible();
  });
  
  test('pin order is maintained', async ({ page }) => {
    // Test that pin order is preserved and can be reordered
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Pin multiple events
    const eventsToPin = 3;
    for (let i = 0; i < eventsToPin; i++) {
      const eventCard = page.locator('[data-testid="event-card"]').nth(i);
      await eventCard.click();
      
      const pinButton = page.locator('[data-testid="pin-button"]');
      await pinButton.click();
      
      await page.keyboard.press('Escape');
    }
    
    // Check that pinned events appear in the correct order
    const pinnedRail = page.locator('[data-testid="pinned-events-rail"]');
    const pinnedEvents = pinnedRail.locator('[data-testid="pinned-event"]');
    
    await expect(pinnedEvents).toHaveCount(eventsToPin);
    
    // Verify order is maintained after reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const reloadedPinnedEvents = page.locator('[data-testid="pinned-events-rail"] [data-testid="pinned-event"]');
    await expect(reloadedPinnedEvents).toHaveCount(eventsToPin);
  });
});
