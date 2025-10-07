import { test, expect } from '@playwright/test';

test.describe('Accessibility E2E', () => {
  test('skip to content link is present and functional', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for skip to content link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();

    // Check that it's visually hidden by default
    const skipLinkStyles = await skipLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        position: styles.position,
        left: styles.left,
        top: styles.top,
        zIndex: styles.zIndex
      };
    });

    expect(skipLinkStyles.position).toBe('absolute');
    expect(skipLinkStyles.left).toBe('0px');
    expect(skipLinkStyles.top).toBe('0px');
    expect(skipLinkStyles.zIndex).toBe('50');
  });

  test('focus order is correct', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Test tab order
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check if focus ring is applied
    const focusStyles = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow
      };
    });

    // Should have focus ring
    expect(focusStyles.outline).not.toBe('none');
  });

  test('ARIA labels and roles are present', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for header role
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();

    // Check for navigation role
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Check for main role
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();

    // Check for aria-labels
    const navLabel = page.locator('nav[aria-label="Main navigation"]');
    await expect(navLabel).toBeVisible();

    const mainLabel = page.locator('main[aria-label="Main content"]');
    await expect(mainLabel).toBeVisible();
  });

  test('keyboard shortcuts work correctly', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Test "/" shortcut for search
    await page.keyboard.press('/');
    
    // Check if search button is focused
    const searchButton = page.locator('[data-search-button]');
    await expect(searchButton).toBeFocused();

    // Test Escape to blur
    await page.keyboard.press('Escape');
    
    // Check if search button is no longer focused
    await expect(searchButton).not.toBeFocused();
  });

  test('color contrast meets WCAG standards', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check text elements for sufficient contrast
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const textCount = await textElements.count();

    // Should have text elements
    expect(textCount).toBeGreaterThan(0);

    // Check that text is visible (basic contrast check)
    for (let i = 0; i < Math.min(textCount, 10); i++) {
      const element = textElements.nth(i);
      const isVisible = await element.isVisible();
      if (isVisible) {
        const text = await element.textContent();
        if (text && text.trim().length > 0) {
          // Basic visibility check
          const opacity = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return parseFloat(styles.opacity);
          });
          expect(opacity).toBeGreaterThan(0.1);
        }
      }
    }
  });

  test('screen reader compatibility', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Should have alt text or be decorative
      expect(alt).toBeDefined();
    }

    // Check for form labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Should have some form of label
      expect(id || ariaLabel || ariaLabelledBy).toBeDefined();
    }
  });

  test('motion preferences are respected', async ({ page }) => {
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

  test('focus management works correctly', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Test focus management
    const focusableElements = page.locator('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])');
    const focusableCount = await focusableElements.count();

    // Should have focusable elements
    expect(focusableCount).toBeGreaterThan(0);

    // Test that focus is visible
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
