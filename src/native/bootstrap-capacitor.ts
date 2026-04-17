import { projectId, supabaseUrl } from '../utils/supabase/info';

/** POST APNs/FCM token to Edge (`/push/register`) when the user session exists (Supabase JWT in localStorage). */
async function registerPushTokenOnEdge(deviceToken: string): Promise<void> {
  if (!deviceToken || typeof localStorage === 'undefined') return;
  try {
    const key = `sb-${projectId}-auth-token`;
    const raw = localStorage.getItem(key);
    let access: string | null = null;
    if (raw) {
      const j = JSON.parse(raw) as { access_token?: string };
      access = j?.access_token || null;
    }
    if (!access) return;
    const { Capacitor } = await import('@capacitor/core');
    const platform = typeof Capacitor?.getPlatform === 'function' ? Capacitor.getPlatform() : 'web';
    const url = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/make-server-57781ad9/push/register`;
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deviceToken, platform }),
    });
  } catch {
    // Non-fatal: user may sign in after push registration.
  }
}

function resolveIncomingRoute(url: string): string | null {
  const raw = String(url || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw, window.location.origin);
    const encodedPath = parsed.searchParams.get('path');
    if (encodedPath) {
      try {
        const decoded = decodeURIComponent(encodedPath);
        if (decoded.startsWith('/')) return decoded;
      } catch {
        // fall back to default parser below
      }
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function navigateToIncomingRoute(url: string): void {
  const target = resolveIncomingRoute(url);
  if (!target) return;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export async function bootstrapCapacitorRuntime(): Promise<void> {
  const hasCapacitorRuntime = typeof window !== 'undefined' && Boolean((window as any).Capacitor);
  if (!hasCapacitorRuntime) return;

  try {
    const { App } = await import('@capacitor/app');
    App.addListener('appUrlOpen', (event) => {
      navigateToIncomingRoute(String(event?.url || ''));
    });
  } catch {
    // Ignore native bootstrap failures in web contexts.
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.requestPermissions();
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      const v = String(token?.value || '');
      localStorage.setItem('syncscript_native_push_token', v);
      await registerPushTokenOnEdge(v);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const deepLink = String(event?.notification?.data?.deepLink || '');
      if (!deepLink) return;
      navigateToIncomingRoute(deepLink);
    });
  } catch {
    // Ignore push init failures in unsupported contexts.
  }
}
