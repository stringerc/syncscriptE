import { test, expect } from '@playwright/test';

test('calendar panels + conflict dialog + telemetry', async ({ page, request }) => {
  // Enable new_ui for this session
  await page.addInitScript(() => sessionStorage.setItem('flags:new_ui', '1'));

  // Go to calendar
  await page.goto('http://localhost:3000/calendar?new_ui=true', { waitUntil: 'networkidle' });

  // Wait for the page to load and panels to render
  await page.waitForSelector('[data-testid="calendar-panels"]', { timeout: 10000 });

  // Open Conflict Resolver (keyboard only to validate a11y)
  // First, find the conflict resolver button
  const conflictButton = page.getByRole('button', { name: /resolve.*conflict/i });
  await expect(conflictButton).toBeVisible();
  
  // Focus and activate with keyboard
  await conflictButton.focus();
  await page.keyboard.press('Enter');
  
  // Verify dialog opens
  await expect(page.getByRole('dialog', { name: /conflict resolver/i })).toBeVisible();

  // Close with Esc and verify focus returns
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  // Verify focus returned to trigger button
  await expect(conflictButton).toBeFocused();

  // Hit metrics to ensure events were emitted
  const res = await request.get('http://localhost:3002/metrics');
  const body = await res.text();
  
  // Check for panel rendering telemetry
  expect(body).toMatch(/ui_panel_rendered_total{.*screen="calendar"/);
  
  // Check for dialog telemetry
  expect(body).toMatch(/ui_dialog_opened_total{.*kind="conflict-resolver"/);
  expect(body).toMatch(/ui_dialog_closed_total{.*kind="conflict-resolver"/);
});
