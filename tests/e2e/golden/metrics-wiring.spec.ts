import { test, expect } from '@playwright/test';

test.describe('Metrics Wiring E2E', () => {
  test('telemetry events are sent to server', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if telemetry events were sent
    const telemetryEvents = await page.evaluate(() => {
      return window.telemetryEvents || [];
    });

    // Should have shell rendered event
    const shellEvents = telemetryEvents.filter((event: any) => 
      event.event === 'ui.new_shell.rendered'
    );

    expect(shellEvents.length).toBeGreaterThan(0);
  });

  test('metrics endpoint is accessible', async ({ page }) => {
    // Try to access metrics endpoint
    const response = await page.request.get('/api/metrics');
    
    // Should return 200 or 403 (depending on IP allowlist)
    expect([200, 403]).toContain(response.status());
  });

  test('metrics contain expected counters', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if metrics are being collected
    const metrics = await page.evaluate(() => {
      return window.metrics || {};
    });

    // Should have some metrics collected
    expect(Object.keys(metrics).length).toBeGreaterThan(0);
  });

  test('PII is scrubbed from metrics', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if PII is scrubbed
    const telemetryEvents = await page.evaluate(() => {
      return window.telemetryEvents || [];
    });

    // Check that no PII is present in telemetry events
    const hasPII = telemetryEvents.some((event: any) => {
      if (event.properties) {
        return Object.values(event.properties).some((value: any) => 
          typeof value === 'string' && 
          (value.includes('@') || value.includes('user_id') || value.includes('email'))
        );
      }
      return false;
    });

    expect(hasPII).toBe(false);
  });

  test('metrics are debounced correctly', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Rapidly trigger multiple events
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        if (window.telemetryService) {
          window.telemetryService.recordEvent('test.event', { count: i });
        }
      });
    }

    // Wait for debounce
    await page.waitForTimeout(1000);

    // Check that events were debounced
    const telemetryEvents = await page.evaluate(() => {
      return window.telemetryEvents || [];
    });

    const testEvents = telemetryEvents.filter((event: any) => 
      event.event === 'test.event'
    );

    // Should have fewer events than triggered due to debouncing
    expect(testEvents.length).toBeLessThan(10);
  });

  test('metrics are flushed periodically', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Reload page to apply feature flag
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Trigger an event
    await page.evaluate(() => {
      if (window.telemetryService) {
        window.telemetryService.recordEvent('test.flush', { timestamp: Date.now() });
      }
    });

    // Wait for flush interval
    await page.waitForTimeout(6000);

    // Check that event was flushed
    const telemetryEvents = await page.evaluate(() => {
      return window.telemetryEvents || [];
    });

    const flushEvents = telemetryEvents.filter((event: any) => 
      event.event === 'test.flush'
    );

    expect(flushEvents.length).toBeGreaterThan(0);
  });
});
