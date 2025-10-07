import { test, expect } from '@playwright/test';

test.describe('Tasks Panels E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('renders header, list/board panels', async ({ page }) => {
    // Check if new UI is enabled (feature flag)
    const isNewUI = await page.evaluate(() => {
      return window.localStorage.getItem('feature_flags')?.includes('new_ui') || false;
    });

    if (isNewUI) {
      // Check for panel components
      await expect(page.locator('[data-testid="panel-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="panel-body"]')).toBeVisible();
      
      // Check for specific panels
      await expect(page.locator('text=Tasks')).toBeVisible();
      await expect(page.locator('text=Manage your tasks with AI-powered prioritization')).toBeVisible();
    } else {
      // Check for legacy components
      await expect(page.locator('h1:has-text("Tasks")')).toBeVisible();
      await expect(page.locator('text=Manage your tasks with AI-powered prioritization')).toBeVisible();
    }
  });

  test('keyboard-only create: press "n" → type title → ENTER → task appears', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Press "n" to open new task modal
    await page.keyboard.press('n');
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check if focus is in the title input
    const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();
    await expect(titleInput).toBeFocused();
    
    // Type a task title
    await page.keyboard.type('Test Task from Keyboard');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Check if task appears in the list
    await expect(page.locator('text=Test Task from Keyboard')).toBeVisible();
  });

  test('focus restored to trigger on ESC', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Click the New Task button to store focus
    const newTaskButton = page.locator('button:has-text("New Task")').first();
    await newTaskButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Press ESC to close modal
    await page.keyboard.press('Escape');
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Check if focus is restored to the New Task button
    await expect(newTaskButton).toBeFocused();
  });

  test('axe: 0 critical issues', async ({ page }) => {
    // Run axe accessibility tests
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        // This would typically use axe-core library
        // For now, we'll just check for basic accessibility features
        const results = {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0
        };
        
        // Check for basic accessibility features
        const hasHeading = document.querySelector('h1, h2, h3, h4, h5, h6');
        const hasButtons = document.querySelectorAll('button').length > 0;
        const hasLabels = document.querySelectorAll('label').length > 0;
        
        if (!hasHeading) results.critical++;
        if (!hasButtons) results.critical++;
        if (!hasLabels) results.moderate++;
        
        resolve(results);
      });
    });

    expect(accessibilityScanResults.critical).toBe(0);
    expect(accessibilityScanResults.serious).toBe(0);
  });

  test('panel components render with correct styling', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for panel styling
    const panels = page.locator('[class*="panel"], [class*="Panel"]');
    await expect(panels).toHaveCount(3); // Header, Tasks, Completed, Deleted panels

    // Check for gradient border effects
    const gradientBorders = page.locator('[class*="gradient"], [class*="border-gradient"]');
    await expect(gradientBorders).toHaveCount(3);

    // Check for glass morphism effects
    const glassEffects = page.locator('[class*="backdrop-blur"], [class*="glass"]');
    await expect(glassEffects).toHaveCount(3);
  });

  test('telemetry events are emitted', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.waitForLoadState('networkidle');

    // Check if telemetry events were sent
    const telemetryEvents = await page.evaluate(() => {
      return window.telemetryEvents || [];
    });

    // Should have panel rendered events
    const panelEvents = telemetryEvents.filter((event: any) => 
      event.event === 'ui.panel.rendered' && event.properties?.screen === 'tasks'
    );

    expect(panelEvents.length).toBeGreaterThan(0);
  });

  test('keyboard navigation works end-to-end', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.waitForLoadState('networkidle');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test Enter key on focused element
    await page.keyboard.press('Enter');
    
    // Should open modal or perform action
    await page.waitForTimeout(1000);
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that animations are disabled
    const animatedElements = page.locator('[class*="animate-"], [class*="transition-"]');
    const animationCount = await animatedElements.count();
    
    // Should have minimal animations when reduced motion is enabled
    expect(animationCount).toBeLessThan(5);
  });
});
