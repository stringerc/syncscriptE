// Analytics service for tracking user interactions and feature usage
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 100;

  constructor() {
    // Start periodic flushing
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  // Track a custom event
  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now()
    };

    this.queue.push(analyticsEvent);

    // Flush if queue is getting too large
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }

    console.log('📊 Analytics:', event, properties);
  }

  // Track page views
  trackPageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      action,
      ...properties
    });
  }

  // Track user actions
  trackUserAction(action: string, properties?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...properties
    });
  }

  // Track conversion events
  trackConversion(event: string, value?: number, properties?: Record<string, any>) {
    this.track('conversion', {
      event,
      value,
      ...properties
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
    this.track('performance', {
      metric,
      value,
      ...properties
    });
  }

  // Track errors
  trackError(error: string, properties?: Record<string, any>) {
    this.track('error', {
      error,
      ...properties
    });
  }

  // Sanitize properties to remove PII
  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) return {};

    const sanitized = { ...properties };
    
    // Remove or hash sensitive data
    const sensitiveKeys = ['email', 'password', 'token', 'key', 'secret'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Flush events to server
  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events if sending failed
      this.queue.unshift(...events);
    }
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Get current queue size
  getQueueSize(): number {
    return this.queue.length;
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export types
export type { AnalyticsEvent };
