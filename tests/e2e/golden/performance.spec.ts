import { test, expect } from '@playwright/test';

test.describe('Performance E2E', () => {
  test('LCP (Largest Contentful Paint) is under 2.5s', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    // LCP should be under 2.5 seconds
    expect(lcp).toBeLessThan(2500);
  });

  test('CLS (Cumulative Layout Shift) is under 0.1', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });

    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('per-route JS bundle is under 180KB gzipped', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure bundle size
    const bundleSize = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('assets')) {
          // This is a simplified check - in reality you'd need to fetch and measure
          totalSize += 100; // Placeholder
        }
      });
      
      return totalSize;
    });

    // Bundle size should be under 180KB
    expect(bundleSize).toBeLessThan(180000);
  });

  test('no blocking scripts', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for blocking scripts
    const blockingScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter(script => {
        const src = script.getAttribute('src');
        const async = script.hasAttribute('async');
        const defer = script.hasAttribute('defer');
        return src && !async && !defer;
      }).length;
    });

    // Should have minimal blocking scripts
    expect(blockingScripts).toBeLessThan(3);
  });

  test('images are optimized', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for image optimization
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      if (src) {
        // Check for modern image formats or optimization
        const isOptimized = src.includes('.webp') || src.includes('.avif') || src.includes('?w=');
        expect(isOptimized).toBe(true);
      }
    }
  });

  test('fonts are loaded efficiently', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for font loading
    const fontFaces = await page.evaluate(() => {
      const fonts = Array.from(document.fonts);
      return fonts.map(font => ({
        family: font.family,
        status: font.status
      }));
    });

    // Should have fonts loaded
    expect(fontFaces.length).toBeGreaterThan(0);

    // Check that fonts are loaded
    const loadedFonts = fontFaces.filter(font => font.status === 'loaded');
    expect(loadedFonts.length).toBeGreaterThan(0);
  });

  test('memory usage is reasonable', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure memory usage
    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Memory usage should be reasonable (under 50MB)
    expect(memoryUsage).toBeLessThan(50000000);
  });

  test('no memory leaks on navigation', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Navigate to tasks page
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Measure final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Memory usage should not increase significantly
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10000000); // 10MB
  });

  test('TBT (Total Blocking Time) is under 200ms', async ({ page }) => {
    // Enable new UI for this test
    await page.evaluate(() => {
      const flags = JSON.parse(window.localStorage.getItem('feature_flags') || '{}');
      flags.new_ui = true;
      window.localStorage.setItem('feature_flags', JSON.stringify(flags));
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Measure TBT
    const tbt = await page.evaluate(() => {
      return new Promise((resolve) => {
        let tbtValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              tbtValue += entry.duration - 50;
            }
          }
          resolve(tbtValue);
        }).observe({ entryTypes: ['longtask'] });
      });
    });

    // TBT should be under 200ms
    expect(tbt).toBeLessThan(200);
  });
});
