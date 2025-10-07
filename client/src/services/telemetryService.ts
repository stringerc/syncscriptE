/**
 * Client-side Telemetry Service
 * 
 * Handles UI event tracking with debouncing and PII scrubbing.
 * Sends events to server telemetry endpoint for metrics collection.
 */

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class TelemetryService {
  private eventQueue: TelemetryEvent[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 1000; // 1 second
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Auto-flush events periodically
    setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Record a telemetry event
   * Automatically debounces repetitive events
   */
  record(event: string, properties?: Record<string, any>): void {
    // Scrub PII from properties
    const scrubbedProperties = this.scrubPII(properties || {});

    const telemetryEvent: TelemetryEvent = {
      event,
      properties: scrubbedProperties,
      timestamp: Date.now()
    };

    // Debounce repetitive events
    if (this.shouldDebounce(event)) {
      this.debounceEvent(event, telemetryEvent);
    } else {
      this.addToQueue(telemetryEvent);
    }
  }

  /**
   * Record UI shell events
   */
  recordShellRendered(variant: 'new' | 'legacy'): void {
    this.record('ui.new_shell.rendered', { variant });
  }

  recordNavClick(item: string): void {
    this.record('ui.nav.click', { item });
  }

  recordSearchOpened(): void {
    this.record('ui.search.opened');
  }

  /**
   * Scrub PII from event properties
   */
  private scrubPII(properties: Record<string, any>): Record<string, any> {
    const scrubbed: Record<string, any> = {};
    const piiPatterns = [
      /email/i,
      /user_id/i,
      /id$/i,
      /name$/i,
      /token/i,
      /key$/i,
      /password/i,
      /secret/i
    ];

    for (const [key, value] of Object.entries(properties)) {
      const isPII = piiPatterns.some(pattern => pattern.test(key));
      scrubbed[key] = isPII ? '[REDACTED]' : value;
    }

    return scrubbed;
  }

  /**
   * Check if an event should be debounced
   */
  private shouldDebounce(event: string): boolean {
    const debounceableEvents = [
      'ui.nav.hover',
      'ui.search.typing',
      'ui.scroll'
    ];
    return debounceableEvents.some(pattern => event.includes(pattern));
  }

  /**
   * Debounce an event
   */
  private debounceEvent(event: string, telemetryEvent: TelemetryEvent): void {
    const existingTimer = this.debounceTimers.get(event);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.addToQueue(telemetryEvent);
      this.debounceTimers.delete(event);
    }, this.DEBOUNCE_DELAY);

    this.debounceTimers.set(event, timer);
  }

  /**
   * Add event to queue
   */
  private addToQueue(event: TelemetryEvent): void {
    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.warn('Failed to send telemetry events:', error);
      // Re-queue events for retry (with limit to prevent memory issues)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  /**
   * Force flush all pending events
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService();
