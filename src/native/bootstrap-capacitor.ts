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

    PushNotifications.addListener('registration', (token) => {
      localStorage.setItem('syncscript_native_push_token', String(token?.value || ''));
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
