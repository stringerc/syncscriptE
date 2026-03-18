const APP_SCHEME_BASE = 'syncscript://open';

function toPath(value: string, origin?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  if (raw.startsWith('/')) return raw;
  try {
    const parsed = origin ? new URL(raw, origin) : new URL(raw);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return raw.startsWith('?') ? `/${raw}` : `/${raw.replace(/^\/+/, '')}`;
  }
}

export function buildAppSchemeLink(value: string, origin?: string): string {
  const path = toPath(value, origin);
  return `${APP_SCHEME_BASE}?path=${encodeURIComponent(path)}`;
}

export function toPhoneLaunchLinks(value: string, origin?: string): { webUrl: string; appUrl: string } {
  const path = toPath(value, origin);
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://www.syncscript.app');
  return {
    webUrl: `${base}${path}`,
    appUrl: buildAppSchemeLink(path, base),
  };
}

export function openPhoneRouteWithFallback(value: string, options?: { origin?: string; fallbackDelayMs?: number }): void {
  const { webUrl, appUrl } = toPhoneLaunchLinks(value, options?.origin);
  const fallbackDelayMs = Math.max(400, Number(options?.fallbackDelayMs || 1100));
  const startedAt = Date.now();

  const onVisibility = () => {
    if (document.hidden) window.clearTimeout(fallbackTimer);
  };

  const fallbackTimer = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    // If app didn't open quickly, stay safe and continue on web.
    if (!document.hidden && Date.now() - startedAt >= fallbackDelayMs - 100) {
      window.location.href = webUrl;
    }
  }, fallbackDelayMs);

  document.addEventListener('visibilitychange', onVisibility);
  window.location.href = appUrl;
}
