import { test, expect } from '@playwright/test';

test.describe('Landing — Nexus capability blurb', () => {
  test('shows capability section with test id', async ({ page }) => {
    await page.goto('/');
    const section = page.getByTestId('nexus-capabilities-landing');
    await expect(section).toBeVisible({ timeout: 30_000 });
    await expect(section.getByRole('heading', { name: /What you can ask inside SyncScript/i })).toBeVisible();
  });
});
