import { useEffect } from 'react';
import { analytics } from '@/services/analytics';

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    const monitorPerformance = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          analytics.trackPerformance('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            analytics.trackPerformance('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          analytics.trackPerformance('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Time to First Byte (TTFB)
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const ttfb = entry.responseStart - entry.requestStart;
            analytics.trackPerformance('ttfb', ttfb);
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      }

      // Monitor page load time
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        analytics.trackPerformance('page_load_time', loadTime);
      });

      // Monitor memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        analytics.trackPerformance('memory_used', memory.usedJSHeapSize);
        analytics.trackPerformance('memory_total', memory.totalJSHeapSize);
      }
    };

    monitorPerformance();
  }, []);
};

export default usePerformanceMonitoring;
