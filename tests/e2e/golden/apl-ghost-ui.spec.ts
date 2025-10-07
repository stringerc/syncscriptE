import { test, expect } from "@playwright/test";

test.describe('APL Ghost UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the APL endpoints
    await page.route('**/api/apl/ready*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ready: true })
      });
    });

    await page.route('**/api/apl/suggest*', async route => {
      const request = route.request();
      const idempotencyKey = request.headers()['x-idempotency-key'];
      
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

  test("APL ghost action renders and functions correctly", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal for a seeded event
    // This assumes there's a way to open the modal - adjust based on your app's structure
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    // Check that the APL button is visible
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeVisible();
    
    // Button should be disabled initially (until ready check completes)
    await expect(btn).toBeDisabled();
    
    // Wait for ready check to complete and button to become enabled
    await expect(btn).toBeEnabled({ timeout: 5000 });
    
    // Test the button click (this will call the stub endpoint)
    await btn.click();
    
    // Check for success toast
    await expect(page.getByText("3 suggested holds ready")).toBeVisible();
    
    // Verify the button shows loading state during request
    await expect(btn).toContainText("Placing…");
    
    // Wait for request to complete
    await expect(btn).toContainText("Place 3 holds", { timeout: 5000 });
  });

  test("APL button respects feature flag", async ({ page }) => {
    // Navigate without the feature flag enabled
    await page.goto("http://localhost:3000/calendar");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    // APL button should not be visible when feature flag is off
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).not.toBeVisible();
  });

  test("APL button handles API errors gracefully", async ({ page }) => {
    // Mock API error
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
    
    // Click button
    await btn.click();
    
    // Should show error toast
    await expect(page.getByText("Could not suggest holds")).toBeVisible();
  });

  test("APL button accessibility", async ({ page }) => {
    await page.goto("http://localhost:3000/calendar?new_ui=true");
    
    // Open the EventModal
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await eventCard.click();
    
    const btn = page.getByTestId("apl-place-holds");
    await expect(btn).toBeVisible();
    
    // Check accessibility attributes
    await expect(btn).toHaveAttribute('aria-label', 'Place tentative holds');
    await expect(btn).toHaveAttribute('type', 'button');
    
    // Test keyboard navigation
    await btn.focus();
    await expect(btn).toBeFocused();
    
    // Test Enter key activation
    await btn.press('Enter');
    await expect(page.getByText("3 suggested holds ready")).toBeVisible();
  });
});
