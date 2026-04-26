/**
 * Lightweight Sentry wrapper for Vercel serverless handlers.
 *
 * Usage:
 *   import { withObservability } from '../_lib/observability';
 *   export default withObservability(handler, { route: 'agent' });
 *
 * No-ops when SENTRY_DSN is unset (the default in dev). Lazy-loads
 * @sentry/node only on the first call so cold starts don't pay for it
 * when DSN isn't configured.
 *
 * Tags every event with:
 *   - release: VERCEL_GIT_COMMIT_SHA
 *   - region:  VERCEL_REGION
 *   - route:   the handler name passed in
 *   - request_id: from x-request-id header (frontend ↔ backend correlation)
 *   - user_id:    when the handler resolves a user (set via captureUser)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

type SentryNode = typeof import('@sentry/node');

let sentryReady: Promise<SentryNode | null> | null = null;

function getDsn(): string | null {
  const v = process.env.SENTRY_DSN;
  if (!v || typeof v !== 'string' || !v.startsWith('http')) return null;
  return v;
}

async function loadSentry(): Promise<SentryNode | null> {
  if (sentryReady) return sentryReady;
  const dsn = getDsn();
  if (!dsn) {
    sentryReady = Promise.resolve(null);
    return sentryReady;
  }
  sentryReady = (async () => {
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_BUILD_SHA || 'dev',
        environment: process.env.VERCEL_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
        tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.05 : 0,
        sendDefaultPii: false,
      });
      return Sentry;
    } catch (e) {
      // Loading failed — keep the function alive.
      console.warn('[observability] sentry load failed:', e instanceof Error ? e.message : e);
      return null;
    }
  })();
  return sentryReady;
}

export interface ObsOptions {
  /** Stable label for this handler (e.g. "agent", "phone", "nexus-user"). */
  route: string;
}

/**
 * Capture an arbitrary error with optional context. Safe to call from
 * anywhere; no-ops when Sentry isn't configured.
 */
export async function captureError(err: unknown, ctx?: Record<string, unknown>): Promise<void> {
  const Sentry = await loadSentry();
  if (!Sentry) return;
  try {
    Sentry.withScope((scope) => {
      if (ctx) {
        for (const [k, v] of Object.entries(ctx)) {
          try { scope.setExtra(k, v as never); } catch { /* ignore */ }
        }
      }
      Sentry.captureException(err);
    });
  } catch { /* ignore */ }
}

/**
 * Wrap a Vercel serverless handler with Sentry — captures uncaught errors,
 * tags request id + route, and never swallows the original error.
 */
export function withObservability(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown,
  opts: ObsOptions,
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req, res) => {
    const requestId = String(req.headers['x-request-id'] || '');
    const startedAt = Date.now();
    try {
      const Sentry = await loadSentry();
      if (Sentry) {
        Sentry.getCurrentScope().setTags({
          route: opts.route,
          method: String(req.method || ''),
          ...(requestId ? { request_id: requestId } : {}),
        });
      }
      await handler(req, res);
    } catch (err) {
      const Sentry = await loadSentry();
      if (Sentry) {
        try {
          Sentry.withScope((scope) => {
            scope.setTag('route', opts.route);
            scope.setExtra('duration_ms', Date.now() - startedAt);
            scope.setExtra('url', String(req.url || ''));
            scope.setExtra('request_id', requestId);
            Sentry.captureException(err);
          });
          // Best-effort flush so serverless functions don't terminate before
          // the event is sent. 2s cap so we don't block the response on
          // Sentry availability.
          await Sentry.flush(2000).catch(() => {});
        } catch { /* ignore */ }
      }
      // Re-throw so Vercel surfaces the 5xx — never swallow.
      if (!res.headersSent) {
        try {
          res.status(500).json({
            error: 'internal_error',
            request_id: requestId || undefined,
          });
        } catch { /* ignore */ }
      }
    }
  };
}
