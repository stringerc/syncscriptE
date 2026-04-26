/**
 * In-product help widget.
 *
 * No-ops by default. Activates when one of the supported providers is
 * configured via env. Same lazy-boot pattern Sentry + PostHog use, so
 * unconfigured deploys ship with zero overhead.
 *
 * Supported providers:
 *
 *   - **Crisp Chat** (free tier covers small projects)
 *     env: VITE_HELP_WIDGET_PROVIDER=crisp
 *          VITE_CRISP_WEBSITE_ID=<32-char id>
 *
 *   - **Intercom** (paid; production-grade messenger)
 *     env: VITE_HELP_WIDGET_PROVIDER=intercom
 *          VITE_INTERCOM_APP_ID=<workspace id>
 *
 *   - **Custom** (HelpScout / Plain / Linear Help / etc.) — for these,
 *     paste the provider's snippet directly into index.html and don't
 *     enable this component.
 *
 * Privacy: when the user is identified (auth resolves), we pass id + email
 * so support reps see who's writing in. Without that, the widget runs
 * anonymous. We never pass anything else.
 */
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Provider = 'crisp' | 'intercom' | 'none';

function readProvider(): Provider {
  const p = (import.meta.env.VITE_HELP_WIDGET_PROVIDER as string | undefined)?.toLowerCase();
  if (p === 'crisp' && import.meta.env.VITE_CRISP_WEBSITE_ID) return 'crisp';
  if (p === 'intercom' && import.meta.env.VITE_INTERCOM_APP_ID) return 'intercom';
  return 'none';
}

let booted = false;

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
    Intercom?: ((...args: unknown[]) => void) & { booted?: boolean };
    intercomSettings?: Record<string, unknown>;
  }
}

function bootCrisp(websiteId: string): void {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = websiteId;
  const s = document.createElement('script');
  s.src = 'https://client.crisp.chat/l.js';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

function bootIntercom(appId: string): void {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  // Intercom's recommended async snippet, condensed.
  window.intercomSettings = { app_id: appId };
  const w = window as unknown as { attachEvent?: (e: string, fn: () => void) => void };
  const i: ((...args: unknown[]) => void) & { booted?: boolean; q?: unknown[][] } = (...args: unknown[]) => {
    (i.q ||= []).push(args);
  };
  i.q = [];
  i.booted = true;
  window.Intercom = i;
  const load = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://widget.intercom.io/widget/${appId}`;
    document.head.appendChild(s);
  };
  if (document.readyState === 'complete') load();
  else if (w.attachEvent) w.attachEvent('onload', load);
  else window.addEventListener('load', load, false);
  window.Intercom('boot', { app_id: appId });
}

function identify(provider: Provider, user: { id: string; email?: string | null } | null): void {
  if (provider === 'crisp' && Array.isArray(window.$crisp)) {
    if (user?.email) window.$crisp.push(['set', 'user:email', [user.email]]);
    if (user?.id) window.$crisp.push(['set', 'session:data', [[['user_id', user.id]]]]);
  } else if (provider === 'intercom' && typeof window.Intercom === 'function') {
    window.Intercom('update', {
      user_id: user?.id || undefined,
      email: user?.email || undefined,
    });
  }
}

export function HelpWidget(): null {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = readProvider();
    if (provider === 'none') return;

    // Defer boot until idle so it can't block first paint.
    const start = () => {
      if (provider === 'crisp') {
        bootCrisp(import.meta.env.VITE_CRISP_WEBSITE_ID as string);
      } else if (provider === 'intercom') {
        bootIntercom(import.meta.env.VITE_INTERCOM_APP_ID as string);
      }
    };
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(start);
    } else {
      setTimeout(start, 1500);
    }
  }, []);

  // Re-identify whenever auth user changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = readProvider();
    if (provider === 'none') return;
    identify(provider, user ? { id: user.id, email: user.email } : null);
  }, [user?.id, user?.email]);

  return null;
}
