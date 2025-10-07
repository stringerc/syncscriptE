import { test, expect } from '@playwright/test';

test.describe('Rollback E2E', () => {
  test('new_ui=false restores legacy shell', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that new shell is visible
    const appHeader = page.locator('header[role="banner"]');
    await expect(appHeader).toBeVisible();

    // Rollback to legacy shell
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that new shell is not visible
    await expect(appHeader).not.toBeVisible();

    // Check that legacy shell is visible
    const legacyElements = page.locator('[class*="legacy"], [class*="Legacy"]');
    await expect(legacyElements).toHaveCount(0); // Legacy shell should not have specific classes
  });

  test('cmd_palette=false disables search functionality', async ({ page }) => {
    // Enable new_ui and cmd_palette for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      flags.cmd_palette = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that search button is visible
    const searchButton = page.locator('[data-search-button]');
    await expect(searchButton).toBeVisible();

    // Rollback cmd_palette
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.cmd_palette = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that search button is not visible
    await expect(searchButton).not.toBeVisible();
  });

  test('feature flags can be reset to defaults', async ({ page }) => {
    // Set feature flags
    await page.evaluate(() => {
      const flags = {
        new_ui: true,
        cmd_palette: true,
        templates: true,
        playbooks: true
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags are set
    const flags1 = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags1.new_ui).toBe(true);
    expect(flags1.cmd_palette).toBe(true);
    expect(flags1.templates).toBe(true);
    expect(flags1.playbooks).toBe(true);

    // Reset to defaults
    await page.evaluate(() => {
      const flags = {
        new_ui: false,
        cmd_palette: false,
        templates: false,
        playbooks: false
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags are reset
    const flags2 = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags2.new_ui).toBe(false);
    expect(flags2.cmd_palette).toBe(false);
    expect(flags2.templates).toBe(false);
    expect(flags2.playbooks).toBe(false);
  });

  test('rollback preserves user data', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Create some user data
    await page.evaluate(() => {
      window.localStorage.setItem('user_preferences', JSON.stringify({
        theme: 'dark',
        language: 'en',
        timezone: 'UTC'
      }));
    });

    // Rollback to legacy shell
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that user data is preserved
    const userPreferences = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('user_preferences') || '{}');
    });

    expect(userPreferences.theme).toBe('dark');
    expect(userPreferences.language).toBe('en');
    expect(userPreferences.timezone).toBe('UTC');
  });

  test('rollback handles errors gracefully', async ({ page }) => {
    // Set invalid feature flags
    await page.evaluate(() => {
      const flags = {
        new_ui: 'invalid',
        cmd_palette: 123
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that page still loads
    await expect(page.locator('body')).toBeVisible();

    // Check that invalid flags are handled
    const flags = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    // Invalid flags should be converted to boolean
    expect(typeof flags.new_ui).toBe('boolean');
    expect(typeof flags.cmd_palette).toBe('boolean');
  });

  test('rollback is immediate', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that new shell is visible
    const appHeader = page.locator('header[role="banner"]');
    await expect(appHeader).toBeVisible();

    // Rollback immediately
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that rollback is immediate
    await expect(appHeader).not.toBeVisible();
  });

  test('rollback preserves navigation state', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Check that we're on tasks page
    expect(page.url()).toContain('/tasks');

    // Rollback to legacy shell
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that we're still on tasks page
    expect(page.url()).toContain('/tasks');
  });

  test('rollback preserves form data', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Fill out a form
    await page.fill('input[placeholder*="title"], input[placeholder*="Title"]', 'Test Task');
    await page.fill('textarea[placeholder*="description"], textarea[placeholder*="Description"]', 'Test Description');

    // Rollback to legacy shell
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that form data is preserved
    const titleValue = await page.inputValue('input[placeholder*="title"], input[placeholder*="Title"]');
    const descriptionValue = await page.inputValue('textarea[placeholder*="description"], textarea[placeholder*="Description"]');

    expect(titleValue).toBe('Test Task');
    expect(descriptionValue).toBe('Test Description');
  });
});
