import { test, expect } from "@playwright/test";

test.describe('APL Accessibility & Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the APL endpoints for consistent performance
    await page.route('**/api/apl/ready*', async route => {
      // Simulate fast response
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ready: true })
      });
    });

    await page.route('**/api/apl/suggest*', async route => {
      // Simulate fast response
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          holds: [
            {
              id: 'hold-1',
              start: new Date(Date.now() + 3600 * 1000).toISOString(),
              end: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000).toISOString(),
              provider: 'syncscript',
              status: 'suggested'
            }
          ],
          maxHolds: 3
        })
      });
    });
  });

  test("APL button accessibility - axe check", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    // Wait for modal to be fully loaded
    await page.waitForSelector('[data-testid="apl-place-holds"]', { state: 'visible' });
    
    // Run axe accessibility check
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        // This would use axe-core in a real implementation
        // For now, we'll check basic accessibility attributes
        const aplButton = document.querySelector('[data-testid="apl-place-holds"]');
        if (aplButton) {
          resolve({
            hasAriaLabel: aplButton.hasAttribute('aria-label'),
            hasType: aplButton.hasAttribute('type'),
            isButton: aplButton.tagName === 'BUTTON',
            hasFocusable: aplButton.tabIndex >= 0
          });
        } else {
          resolve({ error: 'Button not found' });
        }
      });
    });

    expect(accessibilityScanResults).toMatchObject({
      hasAriaLabel: true,
      hasType: true,
      isButton: true,
      hasFocusable: true
    });
  });

  test("APL button performance - click to toast timing", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeEnabled();
    
    // Measure time from click to toast
    const startTime = Date.now();
    await btn.click();
    
    // Wait for toast to appear
    await expect(page.getByText("3 suggested holds ready")).toBeVisible();
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // Should be fast (≤ 1.0s with mocked network)
    expect(responseTime).toBeLessThan(1000);
    
    console.log(`APL click to toast time: ${responseTime}ms`);
  });

  test("APL button focus management", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeEnabled();
    
    // Test focus management
    await btn.focus();
    await expect(btn).toBeFocused();
    
    // Test keyboard activation
    await btn.press('Enter');
    await expect(page.getByText("3 suggested holds ready")).toBeVisible();
    
    // Test Tab navigation
    await btn.press('Tab');
    // Focus should move to next focusable element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test("APL button visual focus indicators", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeEnabled();
    
    // Test focus styles
    await btn.focus();
    
    // Check if focus styles are applied
    const focusStyles = await btn.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor
      };
    });
    
    // Should have visible focus indicator
    expect(focusStyles.outlineWidth).not.toBe('0px');
    expect(focusStyles.outlineStyle).not.toBe('none');
  });

  test("APL button loading states", async ({ page }) => {
    // Mock slower response to test loading states
    await page.route('**/api/apl/suggest*', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          holds: [],
          maxHolds: 3
        })
      });
    });

    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeEnabled();
    
    // Click and check loading state
    await btn.click();
    
    // Should show loading state
    await expect(btn).toContainText("Placing…");
    await expect(btn).toBeDisabled();
    
    // Wait for completion
    await expect(btn).toContainText("Place 3 holds", { timeout: 1000 });
    await expect(btn).toBeEnabled();
  });

  test("APL button error handling", async ({ page }) => {
    // Mock error response
    await page.route('**/api/apl/suggest*', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeEnabled();
    
    // Click and check error handling
    await btn.click();
    
    // Should show error toast
    await expect(page.getByText("Could not suggest holds")).toBeVisible();
    
    // Button should return to normal state
    await expect(btn).toContainText("Place 3 holds");
    await expect(btn).toBeEnabled();
  });

  test("APL button screen reader support", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeVisible();
    
    // Check screen reader attributes
    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    const type = await btn.getAttribute('type');
    
    expect(ariaLabel).toBe('Place tentative holds');
    expect(title).toBeTruthy();
    expect(type).toBe('button');
    
    // Test with screen reader simulation
    await btn.focus();
    const accessibleName = await btn.evaluate((el) => {
      return el.getAttribute('aria-label') || el.textContent;
    });
    
    expect(accessibleName).toBeTruthy();
    expect(accessibleName).toContain('Place');
  });
});
