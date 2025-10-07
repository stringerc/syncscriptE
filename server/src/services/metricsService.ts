import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { logger } from '../utils/logger';
import { scrubMetricLabels, validateMetricLabels } from '../middleware/metricsAuthMiddleware';

// Enable default metrics collection
collectDefaultMetrics();

// Cron Lock Metrics
export const cronLockAcquireSuccess = new Counter({
  name: 'cron_lock_acquire_success',
  help: 'Number of successful cron lock acquisitions',
  labelNames: ['job']
});

export const cronLockAcquireFail = new Counter({
  name: 'cron_lock_acquire_fail',
  help: 'Number of failed cron lock acquisitions',
  labelNames: ['job', 'reason']
});

export const cronLockHeldSeconds = new Gauge({
  name: 'cron_lock_held_seconds',
  help: 'Duration in seconds that a cron lock was held',
  labelNames: ['job']
});

// Energy Reset Metrics
export const energyResetRunCount = new Counter({
  name: 'energy_reset_run_count',
  help: 'Number of energy reset job runs'
});

export const energyResetErrorCount = new Counter({
  name: 'energy_reset_error_count',
  help: 'Number of energy reset job errors'
});

// Outbox Metrics
export const outboxPending = new Gauge({
  name: 'outbox_pending',
  help: 'Number of pending outbox events'
});

export const outboxDeadLetter = new Gauge({
  name: 'outbox_dead_letter',
  help: 'Number of events in dead letter queue'
});

// Idempotency Metrics
export const idempotencyHitCount = new Counter({
  name: 'idempotency_hit_count',
  help: 'Number of idempotency cache hits',
  labelNames: ['route']
});

// Calendar Metrics
export const calendarDupWriteCount = new Counter({
  name: 'calendar_dup_write_count',
  help: 'Number of duplicate calendar writes detected'
});

// Export Metrics
export const exportSuccessCount = new Counter({
  name: 'export_success_count',
  help: 'Number of successful exports',
  labelNames: ['scope', 'format']
});

export const exportErrorCount = new Counter({
  name: 'export_error_count',
  help: 'Number of failed exports',
  labelNames: ['scope', 'format']
});

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['route', 'code', 'method'],
  buckets: [1, 5, 15, 50, 100, 200, 300, 500, 1000, 2000, 5000]
});

// Feature Usage Metrics (for web telemetry)
export const featureUsed = new Counter({
  name: 'feature_used',
  help: 'Number of times a feature was used',
  labelNames: ['feature']
});

// APL (Auto-Plan & Place) Metrics
export const aplSuggestDuration = new Histogram({
  name: 'apl_suggest_duration_ms',
  help: 'APL suggest operation duration in milliseconds',
  labelNames: ['source'],
  buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500, 1000, 2000]
});

export const aplConfirmSuccessCount = new Counter({
  name: 'apl_confirm_success_total',
  help: 'Number of successful APL hold confirmations',
  labelNames: ['provider']
});

export const aplConfirmErrorCount = new Counter({
  name: 'apl_confirm_error_total',
  help: 'Number of failed APL hold confirmations',
  labelNames: ['provider']
});

export const aplSuggestedCount = new Counter({
  name: 'apl_suggested_total',
  help: 'Number of APL holds suggested'
});

export const aplSuggestErrorCount = new Counter({
  name: 'apl_suggest_error_total',
  help: 'Number of APL suggest operation errors'
});

export const aplDismissedCount = new Counter({
  name: 'apl_dismissed_total',
  help: 'Number of APL holds dismissed'
});

// Metrics collection functions
export class MetricsService {
  private static instance: MetricsService;
  private isInitialized = false;

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    logger.info('Initializing metrics service');
    this.isInitialized = true;
  }

  // Cron Lock Metrics
  recordCronLockAcquireSuccess(job: string): void {
    const labels = scrubMetricLabels({ job });
    cronLockAcquireSuccess.inc(labels);
  }

  recordCronLockAcquireFail(job: string, reason: string): void {
    const labels = scrubMetricLabels({ job, reason });
    cronLockAcquireFail.inc(labels);
  }

  recordCronLockHeldDuration(job: string, durationSeconds: number): void {
    const labels = scrubMetricLabels({ job });
    cronLockHeldSeconds.set(labels, durationSeconds);
  }

  // Energy Reset Metrics
  recordEnergyResetRun(): void {
    energyResetRunCount.inc();
  }

  recordEnergyResetError(): void {
    energyResetErrorCount.inc();
  }

  // Outbox Metrics
  updateOutboxPending(count: number): void {
    outboxPending.set(count);
  }

  updateOutboxDeadLetter(count: number): void {
    outboxDeadLetter.set(count);
  }

  // Idempotency Metrics
  recordIdempotencyHit(route: string): void {
    const labels = scrubMetricLabels({ route });
    idempotencyHitCount.inc(labels);
  }

  // Calendar Metrics
  recordCalendarDupWrite(): void {
    calendarDupWriteCount.inc();
  }

  // Export Metrics
  recordExportSuccess(scope: string, format: string): void {
    const labels = scrubMetricLabels({ scope, format });
    exportSuccessCount.inc(labels);
  }

  recordExportError(scope: string, format: string): void {
    const labels = scrubMetricLabels({ scope, format });
    exportErrorCount.inc(labels);
  }

  // HTTP Request Metrics
  recordHttpRequest(route: string, method: string, statusCode: number, durationMs: number): void {
    const labels = scrubMetricLabels({ route, code: statusCode.toString(), method });
    httpRequestDuration.observe(labels, durationMs);
  }

  // Feature Usage Metrics
  recordFeatureUsed(feature: string): void {
    const labels = scrubMetricLabels({ feature });
    featureUsed.inc(labels);
  }

  // APL (Auto-Plan & Place) Metrics
  recordAplSuggestDuration(source: string, durationMs: number): void {
    const labels = scrubMetricLabels({ source });
    aplSuggestDuration.observe(labels, durationMs);
  }

  recordAplConfirmSuccess(provider: string): void {
    const labels = scrubMetricLabels({ provider });
    aplConfirmSuccessCount.inc(labels);
  }

  recordAplConfirmError(provider: string): void {
    const labels = scrubMetricLabels({ provider });
    aplConfirmErrorCount.inc(labels);
  }

  recordAplSuggested(): void {
    aplSuggestedCount.inc();
  }

  recordAplSuggestError(): void {
    aplSuggestErrorCount.inc();
  }

  recordAplDismissed(): void {
    aplDismissedCount.inc();
  }

  // Get metrics as Prometheus format
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Get metrics registry for custom endpoints
  getRegister() {
    return register;
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
