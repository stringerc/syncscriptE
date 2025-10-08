// Performance Optimization Service
// Provides lazy loading, code splitting, and performance monitoring

import { lazy } from 'react';

// Lazy load heavy components
export const AITaskSuggestions = lazy(() => import('@/components/ai/AITaskSuggestions'));
export const AdvancedAnalytics = lazy(() => import('@/components/analytics/AdvancedAnalytics'));
export const EnergyInsightsDashboard = lazy(() => import('@/components/energy/EnergyInsightsDashboard'));
export const NotificationCenter = lazy(() => import('@/components/notifications/NotificationCenter'));
export const GlobalSearch = lazy(() => import('@/components/search/GlobalSearch'));

// Export LoadingSpinner from the UI components
export { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(name: string): void {
    this.metrics.set(name, performance.now());
  }

  endTiming(name: string): number {
    const startTime = this.metrics.get(name);
    if (!startTime) {
      console.warn(`No start time found for ${name}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    
    // Track Core Web Vitals
    if (name.includes('component')) {
      this.trackWebVital(name, duration);
    }
    
    return duration;
  }

  private trackWebVital(name: string, duration: number): void {
    // Track component render times
    if (duration > 100) {
      console.warn(`🐌 Slow component render: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    // Track bundle size impact
    if (name.includes('lazy')) {
      console.log(`📦 Lazy loaded: ${name}`);
    }
  }

  // Bundle size monitoring
  trackBundleSize(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      
      const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      console.log(`📦 Total JS bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
      
      if (totalSize > 500 * 1024) { // 500KB threshold
        console.warn(`⚠️ Large bundle size detected: ${(totalSize / 1024).toFixed(2)}KB`);
      }
    }
  }

  // Memory usage monitoring
  trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      
      // Only log in development, reduce frequency
      if (import.meta.env.MODE === 'development') {
        console.log(`🧠 Memory usage: ${usedMB}MB / ${totalMB}MB`);
        
        if (memory.usedJSHeapSize > 200 * 1024 * 1024) { // Increased threshold to 200MB
          console.warn(`⚠️ High memory usage: ${usedMB}MB`);
        }
      }
    }
  }
}

// Image optimization
export function optimizeImage(src: string, width?: number, height?: number): string {
  // In production, this would use a CDN or image optimization service
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', '80'); // Quality
  params.set('f', 'webp'); // Format
  
  return `${src}?${params.toString()}`;
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  // This would need to be implemented in a React component file
  // For now, return a simple implementation
  return {
    visibleItems: items,
    totalHeight: items.length * itemHeight,
    offsetY: 0,
    setScrollTop: () => {}
  };
}

// Service Worker for caching
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.MODE === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('ℹ️ Service Worker not available in development mode');
        });
    });
  }
}

// Preload critical resources
export function preloadCriticalResources(): void {
  // Only preload in production to avoid development warnings
  if (import.meta.env.MODE === 'production') {
    // Preload critical fonts (fonts are loaded via CSS, no need to preload here)
    // const fontLink = document.createElement('link');
    // fontLink.rel = 'preload';
    // fontLink.href = '/fonts/inter.woff2';
    // fontLink.as = 'font';
    // fontLink.type = 'font/woff2';
    // fontLink.crossOrigin = 'anonymous';
    // document.head.appendChild(fontLink);
    
    // Preload critical images
    const imageLink = document.createElement('link');
    imageLink.rel = 'preload';
    imageLink.href = '/syncscript-logo.png';
    imageLink.as = 'image';
    document.head.appendChild(imageLink);
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  const monitor = PerformanceMonitor.getInstance();
  
  // Track bundle size on load
  window.addEventListener('load', () => {
    monitor.trackBundleSize();
    monitor.trackMemoryUsage();
  });
  
  // Track memory usage periodically (much less frequent to avoid memory leaks)
  const memoryInterval = import.meta.env.MODE === 'development' ? 300000 : 300000; // 5 minutes in both dev and prod
  setInterval(() => {
    monitor.trackMemoryUsage();
  }, memoryInterval);
  
  // Register service worker
  registerServiceWorker();
  
  // Preload critical resources
  preloadCriticalResources();
  
  console.log('🚀 Performance monitoring initialized');
}

export default PerformanceMonitor;
