/**
 * Real-User Monitoring of Core Web Vitals.
 *
 * Emits LCP, INP, CLS, FCP, TTFB to PostHog as one event per metric so we
 * can build per-route / per-device cohorts in the PostHog dashboard. Same
 * lazy-boot pattern as Sentry/PostHog — no-op when PostHog isn't configured.
 *
 * Why this matters: previously perf was felt-not-measured. Now every real
 * user contributes to a real CWV distribution and Lighthouse scores stop
 * being the only signal. PostHog's funnel features can also segment by CWV
 * (e.g., "do users with LCP > 4s convert at lower rates?").
 *
 * Each event is fire-and-forget through the same `track()` helper; PostHog
 * batches + flushes natively.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { track } from './analytics';

let booted = false;

/** Best-effort device classification — useful for funnel cohorts. */
function deviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function emit(metric: Metric): void {
  // Per-metric event names are easier to filter in PostHog UI than a single
  // `web_vital` event with a `name` property.
  track(`cwv_${metric.name.toLowerCase()}`, {
    value: Math.round(metric.value * 100) / 100,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    delta: Math.round(metric.delta * 100) / 100,
    nav_type: metric.navigationType,
    page_path: typeof location !== 'undefined' ? location.pathname : null,
    device: deviceCategory(),
  });
}

/**
 * Boot the CWV listeners. Idempotent — calling twice is a no-op.
 * Called from main.tsx after first paint, lazy-imported.
 */
export function bootWebVitals(): void {
  if (booted) return;
  if (typeof window === 'undefined') return;
  booted = true;
  try {
    // Each `on*` registers ONE callback that fires whenever the metric is
    // finalized (LCP after the largest contentful paint stops growing, INP
    // after page lifetime, etc.). Each call resolves at most once per page
    // load by the web-vitals library, so we don't manually dedupe.
    onLCP(emit);
    onINP(emit);
    onCLS(emit);
    onFCP(emit);
    onTTFB(emit);
  } catch (e) {
    console.warn('[web-vitals] boot failed:', e);
  }
}
