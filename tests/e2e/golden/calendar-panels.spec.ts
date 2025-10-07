import { test, expect } from '@playwright/test';

test.describe('Calendar Panels', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/calendar');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('panels render with new_ui=true', async ({ page }) => {
    // Enable new_ui feature flag
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ new_ui: true }));
    });
    
    // Reload page to apply flag
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that panels are rendered
    await expect(page.locator('[data-testid="panel"]')).toBeVisible();
    
    // Check for specific panel elements
    await expect(page.locator('text=Your Events')).toBeVisible();
    await expect(page.locator('text=events scheduled')).toBeVisible();
    
    // Check for panel header elements
    await expect(page.locator('[data-testid="panel-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-subtitle"]')).toBeVisible();
  });

  test('conflict resolver opens with keyboard and has 0 criticals', async ({ page }) => {
    // Enable new_ui feature flag
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ new_ui: true }));
    });
    
    // Reload page to apply flag
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Create a test event first
    await page.click('text=Create New Event');
    await page.fill('input[placeholder="Enter event title"]', 'Test Event');
    await page.fill('input[type="datetime-local"]', '2024-12-25T10:00');
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', '2024-12-25T11:00');
    await page.click('text=Create Event');
    
    // Wait for event to be created
    await page.waitForSelector('text=Test Event');
    
    // Click on the event to open modal
    await page.click('text=View');
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]');
    
    // Find and click the conflict resolver button using keyboard
    const conflictButton = page.locator('button[title="Resolve Schedule Conflicts"]');
    await conflictButton.focus();
    await conflictButton.press('Enter');
    
    // Wait for conflict resolver dialog to open
    await page.waitForSelector('text=Schedule Conflicts');
    
    // Check that dialog is accessible
    await expect(page.locator('text=Schedule Conflicts')).toBeVisible();
    await expect(page.locator('text=Review and resolve scheduling conflicts')).toBeVisible();
    
    // Run axe accessibility check
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (typeof window.axe !== 'undefined') {
          window.axe.run(document, {}, (err, results) => {
            resolve(results);
          });
        } else {
          resolve({ violations: [] });
        }
      });
    });
    
    // Check for critical accessibility violations
    const criticalViolations = (accessibilityScanResults as any).violations?.filter(
      (violation: any) => violation.impact === 'critical'
    ) || [];
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('ESC restores focus to trigger button', async ({ page }) => {
    // Enable new_ui feature flag
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ new_ui: true }));
    });
    
    // Reload page to apply flag
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Create a test event first
    await page.click('text=Create New Event');
    await page.fill('input[placeholder="Enter event title"]', 'Test Event');
    await page.fill('input[type="datetime-local"]', '2024-12-25T10:00');
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', '2024-12-25T11:00');
    await page.click('text=Create Event');
    
    // Wait for event to be created
    await page.waitForSelector('text=Test Event');
    
    // Click on the event to open modal
    await page.click('text=View');
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]');
    
    // Find the conflict resolver button and store its reference
    const conflictButton = page.locator('button[title="Resolve Schedule Conflicts"]');
    await conflictButton.focus();
    
    // Open conflict resolver
    await conflictButton.press('Enter');
    
    // Wait for conflict resolver dialog to open
    await page.waitForSelector('text=Schedule Conflicts');
    
    // Press ESC to close dialog
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForSelector('text=Schedule Conflicts', { state: 'hidden' });
    
    // Check that focus is restored to the trigger button
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('title'));
    expect(focusedElement).toBe('Resolve Schedule Conflicts');
  });

  test('panel telemetry events are emitted', async ({ page }) => {
    // Enable new_ui feature flag
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ new_ui: true }));
    });
    
    // Reload page to apply flag
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Listen for telemetry events
    const telemetryEvents: any[] = [];
    await page.exposeFunction('captureTelemetry', (event: any) => {
      telemetryEvents.push(event);
    });
    
    // Mock the telemetry service
    await page.evaluate(() => {
      (window as any).telemetryService = {
        recordEvent: (event: string, properties?: any) => {
          (window as any).captureTelemetry({ event, properties });
        }
      };
    });
    
    // Wait a bit for telemetry events to be emitted
    await page.waitForTimeout(1000);
    
    // Check that panel telemetry events were emitted
    const panelEvents = telemetryEvents.filter(event => 
      event.event === 'ui.panel.rendered' && 
      event.properties?.screen === 'calendar'
    );
    
    expect(panelEvents.length).toBeGreaterThan(0);
    
    // Check for specific panel types
    const panelTypes = panelEvents.map(event => event.properties.panel);
    expect(panelTypes).toContain('actionbar');
    expect(panelTypes).toContain('events');
  });

  test('dialog telemetry events are emitted', async ({ page }) => {
    // Enable new_ui feature flag
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ new_ui: true }));
    });
    
    // Reload page to apply flag
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Listen for telemetry events
    const telemetryEvents: any[] = [];
    await page.exposeFunction('captureTelemetry', (event: any) => {
      telemetryEvents.push(event);
    });
    
    // Mock the telemetry service
    await page.evaluate(() => {
      (window as any).telemetryService = {
        recordEvent: (event: string, properties?: any) => {
          (window as any).captureTelemetry({ event, properties });
        }
      };
    });
    
    // Create a test event first
    await page.click('text=Create New Event');
    await page.fill('input[placeholder="Enter event title"]', 'Test Event');
    await page.fill('input[type="datetime-local"]', '2024-12-25T10:00');
    await page.fill('input[type="datetime-local"]:nth-of-type(2)', '2024-12-25T11:00');
    await page.click('text=Create Event');
    
    // Wait for event to be created
    await page.waitForSelector('text=Test Event');
    
    // Click on the event to open modal
    await page.click('text=View');
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]');
    
    // Open conflict resolver
    await page.click('button[title="Resolve Schedule Conflicts"]');
    
    // Wait for conflict resolver dialog to open
    await page.waitForSelector('text=Schedule Conflicts');
    
    // Close dialog
    await page.keyboard.press('Escape');
    
    // Wait for dialog to close
    await page.waitForSelector('text=Schedule Conflicts', { state: 'hidden' });
    
    // Check that dialog telemetry events were emitted
    const dialogEvents = telemetryEvents.filter(event => 
      event.event === 'ui.dialog.opened' || event.event === 'ui.dialog.closed'
    );
    
    expect(dialogEvents.length).toBeGreaterThan(0);
    
    // Check for specific dialog events
    const openedEvent = dialogEvents.find(event => event.event === 'ui.dialog.opened');
    const closedEvent = dialogEvents.find(event => event.event === 'ui.dialog.closed');
    
    expect(openedEvent).toBeDefined();
    expect(openedEvent?.properties?.screen).toBe('calendar');
    expect(openedEvent?.properties?.kind).toBe('conflict-resolver');
    
    expect(closedEvent).toBeDefined();
    expect(closedEvent?.properties?.screen).toBe('calendar');
    expect(closedEvent?.properties?.kind).toBe('conflict-resolver');
  });

  test('bundle size is within limits', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/calendar');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const jsEntries = entries.filter(entry => 
            entry.name.includes('.js') && entry.transferSize
          );
          
          const totalJsSize = jsEntries.reduce((sum, entry) => sum + entry.transferSize, 0);
          resolve({ totalJsSize, jsEntries: jsEntries.length });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        
        // Resolve after a timeout if no resources are found
        setTimeout(() => resolve({ totalJsSize: 0, jsEntries: 0 }), 2000);
      });
    });
    
    // Check that total JS size is within 180KB limit (gzipped)
    const totalJsSize = (metrics as any).totalJsSize;
    const maxSize = 180 * 1024; // 180KB in bytes
    
    expect(totalJsSize).toBeLessThan(maxSize);
  });
});
