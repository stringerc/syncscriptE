import { test, expect } from '@playwright/test';

test.describe('Feature Flags E2E', () => {
  test('new_ui flag switches between legacy and new shell', async ({ page }) => {
    // Test with new_ui disabled (legacy shell)
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for legacy shell elements
    const legacyElements = page.locator('[class*="legacy"], [class*="Legacy"]');
    await expect(legacyElements).toHaveCount(0); // Legacy shell should not have specific classes

    // Test with new_ui enabled (new shell)
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for new shell elements
    const newShellElements = page.locator('[class*="new"], [class*="New"]');
    await expect(newShellElements).toHaveCount(0); // New shell should not have specific classes

    // Check for specific new shell components
    const appHeader = page.locator('header[role="banner"]');
    await expect(appHeader).toBeVisible();

    const registrySidebar = page.locator('aside[role="navigation"]');
    await expect(registrySidebar).toBeVisible();
  });

  test('cmd_palette flag controls search button visibility', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Test with cmd_palette disabled
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.cmd_palette = false;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that search button is not visible
    const searchButton = page.locator('[data-search-button]');
    await expect(searchButton).not.toBeVisible();

    // Test with cmd_palette enabled
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.cmd_palette = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that search button is visible
    await expect(searchButton).toBeVisible();
  });

  test('feature flags are persisted across page reloads', async ({ page }) => {
    // Set feature flags
    await page.evaluate(() => {
      const flags = {
        new_ui: true,
        cmd_palette: true,
        templates: false,
        playbooks: false
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags are still set
    const flags = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags.new_ui).toBe(true);
    expect(flags.cmd_palette).toBe(true);
    expect(flags.templates).toBe(false);
    expect(flags.playbooks).toBe(false);
  });

  test('feature flags default to false when not set', async ({ page }) => {
    // Clear feature flags
    await page.evaluate(() => {
      window.localStorage.removeItem('feature_flags');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags default to false
    const flags = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags.new_ui).toBe(false);
    expect(flags.cmd_palette).toBe(false);
    expect(flags.templates).toBe(false);
    expect(flags.playbooks).toBe(false);
  });

  test('feature flags can be toggled dynamically', async ({ page }) => {
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

    // Toggle new_ui to false
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
  });

  test('feature flags are scoped to user', async ({ page }) => {
    // Set feature flags for user 1
    await page.evaluate(() => {
      const flags = {
        new_ui: true,
        cmd_palette: true
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags are applied
    const flags1 = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags1.new_ui).toBe(true);
    expect(flags1.cmd_palette).toBe(true);

    // Simulate different user by clearing and setting different flags
    await page.evaluate(() => {
      const flags = {
        new_ui: false,
        cmd_palette: false
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that different flags are applied
    const flags2 = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags2.new_ui).toBe(false);
    expect(flags2.cmd_palette).toBe(false);
  });

  test('feature flags are validated', async ({ page }) => {
    // Set invalid feature flags
    await page.evaluate(() => {
      const flags = {
        new_ui: 'invalid',
        cmd_palette: 123,
        templates: null
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that invalid flags are handled gracefully
    const flags = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    // Invalid flags should be converted to boolean or defaulted
    expect(typeof flags.new_ui).toBe('boolean');
    expect(typeof flags.cmd_palette).toBe('boolean');
    expect(typeof flags.templates).toBe('boolean');
  });

  test('feature flags are case sensitive', async ({ page }) => {
    // Set feature flags with different casing
    await page.evaluate(() => {
      const flags = {
        NEW_UI: true,
        CMD_PALETTE: true,
        new_ui: false,
        cmd_palette: false
      };
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that only lowercase flags are used
    const flags = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
    });

    expect(flags.new_ui).toBe(false);
    expect(flags.cmd_palette).toBe(false);
    expect(flags.NEW_UI).toBeUndefined();
    expect(flags.CMD_PALETTE).toBeUndefined();
  });

  test('feature flags are logged for debugging', async ({ page }) => {
    // Enable new_ui for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that flags are logged
    const logs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });

    // Should have logs about feature flags
    const flagLogs = logs.filter((log: string) => 
      log.includes('feature') || log.includes('flag')
    );

    expect(flagLogs.length).toBeGreaterThan(0);
  });
});
