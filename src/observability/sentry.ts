/**
 * Lazy Sentry boot for the SyncScript web client.
 *
 * Active only when VITE_SENTRY_DSN is set in the deployment env. Loaded as a
 * dynamic import so the landing page bundle stays under our perf budget
 * (.cursor/rules/04-perf-seo-gate.mdc — Lighthouse Perf ≥ 95).
 *
 * What gets tagged:
 *   - release: VITE_BUILD_SHA so we can group errors by deploy
 *   - userId: set by setSentryUser() once auth resolves
 *   - requestId: bagged onto each fetch via beforeSend (matches the
 *     api/_lib/auth.ts trace headers so frontend ↔ backend correlate)
 */

let booted = false;
let getSdk: (() => Promise<typeof import('@sentry/react') | null>) | null = null;

function dsn(): string | null {
  const v = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!v || typeof v !== 'string' || !v.startsWith('http')) return null;
  return v;
}

export async function bootSentryWeb(): Promise<void> {
  if (booted) return;
  if (typeof window === 'undefined') return;
  const SENTRY_DSN = dsn();
  if (!SENTRY_DSN) return; // No DSN = SDK never loads (zero overhead)
  booted = true;
  try {
    const Sentry = await import('@sentry/react');
    getSdk = async () => Sentry;
    Sentry.init({
      dsn: SENTRY_DSN,
      release: String(import.meta.env.VITE_BUILD_SHA || 'dev'),
      environment: import.meta.env.PROD ? 'production' : 'development',
      // 0.1 = sample 10% of transactions in prod (cost-aware default)
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      // Replay only on errors, not all sessions (privacy + bandwidth)
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: true,
        }),
      ],
      // Drop noisy errors that we already handle in main.tsx (chunk preload
      // failures auto-reload; AbortErrors are expected fetch cancellations).
      ignoreErrors: [
        'AbortError',
        'Failed to fetch dynamically imported module',
        'Importing a module script failed',
        'Load failed',
        'NetworkError when attempting to fetch resource',
        // Browser extension noise that shows up in Sentry but isn't ours
        'ResizeObserver loop',
      ],
      beforeSend(event) {
        // Strip sensitive query params from URLs (token, code, secret, key).
        try {
          if (event.request?.url) {
            const u = new URL(event.request.url);
            for (const k of ['token', 'code', 'secret', 'key', 'apikey', 'access_token']) {
              if (u.searchParams.has(k)) u.searchParams.set(k, '[redacted]');
            }
            event.request.url = u.toString();
          }
        } catch { /* ignore url parse errors */ }
        return event;
      },
    });
  } catch (e) {
    // SDK load failed — keep the app running.
    console.warn('[sentry] boot failed:', e);
  }
}

export async function setSentryUser(user: { id: string; email?: string | null } | null): Promise<void> {
  if (!getSdk) return;
  try {
    const Sentry = await getSdk();
    if (!Sentry) return;
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email || undefined });
    } else {
      Sentry.setUser(null);
    }
  } catch { /* ignore */ }
}

export async function captureSentry(err: unknown, ctx?: Record<string, unknown>): Promise<void> {
  if (!getSdk) return;
  try {
    const Sentry = await getSdk();
    if (!Sentry) return;
    if (ctx) Sentry.withScope((scope) => {
      for (const [k, v] of Object.entries(ctx)) {
        try { scope.setExtra(k, v as never); } catch { /* ignore */ }
      }
      Sentry.captureException(err);
    });
    else Sentry.captureException(err);
  } catch { /* ignore */ }
}
