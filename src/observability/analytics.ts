/**
 * Lazy PostHog boot + typed event tracker for SyncScript.
 *
 * Active only when VITE_POSTHOG_KEY is set in the deployment env. Loaded as a
 * dynamic import after first paint so the landing page bundle stays under our
 * perf budget.
 *
 * Critical events (the five we wire end-to-end this session — see roadmap):
 *   - nexus_voice_session_started   — user opens immersive voice
 *   - voice_first_reply_ms          — measured from prompt-end to first audio
 *   - task_created                  — { source: voice | chat | manual | n8n | agent }
 *   - attachment_dropped            — { mode: reference | modify, mime, bytes }
 *   - pricing_page_view             — funnel start
 *   - checkout_clicked              — funnel mid
 *   - checkout_completed            — funnel end (Stripe webhook calls this server-side too)
 *
 * `track()` is a no-op when PostHog is not booted, so call sites are safe
 * even on landing pages where we never load the SDK.
 */

type EventProps = Record<string, string | number | boolean | null | undefined>;

let booted = false;
let getSdk: (() => Promise<typeof import('posthog-js') | null>) | null = null;
const queue: Array<{ event: string; props?: EventProps }> = [];

function key(): string | null {
  const v = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!v || typeof v !== 'string' || v.length < 8) return null;
  return v;
}

function host(): string {
  return (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';
}

export async function bootAnalytics(): Promise<void> {
  if (booted) return;
  if (typeof window === 'undefined') return;
  const POSTHOG_KEY = key();
  if (!POSTHOG_KEY) return; // No key = SDK never loads (zero overhead)
  booted = true;
  try {
    const ph = await import('posthog-js');
    getSdk = async () => ph;
    ph.default.init(POSTHOG_KEY, {
      api_host: host(),
      person_profiles: 'identified_only', // No anon tracking → cheaper + privacy-friendly
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // We send explicit events; reduces noise + bandwidth
      session_recording: { maskAllInputs: true },
      loaded: () => {
        // Replay any queued events from before SDK was ready
        for (const q of queue) {
          ph.default.capture(q.event, q.props || {});
        }
        queue.length = 0;
      },
    });
  } catch (e) {
    console.warn('[analytics] boot failed:', e);
  }
}

export async function identifyAnalyticsUser(user: { id: string; email?: string | null } | null): Promise<void> {
  if (!getSdk) return;
  try {
    const ph = await getSdk();
    if (!ph) return;
    if (user) {
      ph.default.identify(user.id, user.email ? { email: user.email } : undefined);
    } else {
      ph.default.reset();
    }
  } catch { /* ignore */ }
}

/**
 * Track an analytics event. Safe to call before SDK boot — events queue and
 * flush on `loaded`. Safe to call when no key is configured — silent no-op.
 */
export function track(event: string, props?: EventProps): void {
  if (typeof window === 'undefined') return;
  if (!booted) {
    queue.push({ event, props });
    return;
  }
  if (!getSdk) return;
  getSdk().then((ph) => {
    if (!ph) return;
    ph.default.capture(event, props || {});
  }).catch(() => { /* ignore */ });
}

// Pre-typed convenience wrappers for the five critical events to reduce
// stringly-typed mistakes at call sites.
export const Events = {
  nexusVoiceSessionStarted: (props?: { transport?: 'webrtc' | 'http' }) =>
    track('nexus_voice_session_started', props),
  voiceFirstReplyMs: (props: { ms: number }) =>
    track('voice_first_reply_ms', props),
  taskCreated: (props: { source: 'voice' | 'chat' | 'manual' | 'n8n' | 'agent' | 'phone' | 'email' }) =>
    track('task_created', props),
  attachmentDropped: (props: { mode: 'reference' | 'modify'; mime?: string; bytes?: number }) =>
    track('attachment_dropped', props),
  pricingPageView: () => track('pricing_page_view'),
  checkoutClicked: (props: { plan: string; price_cents?: number }) =>
    track('checkout_clicked', props),
  checkoutCompleted: (props: { plan: string; price_cents?: number; stripe_session_id?: string }) =>
    track('checkout_completed', props),
};
