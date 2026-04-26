/**
 * Follow HTTPS redirects on allowlisted map short-link hosts and parse lat/lng from the final URL.
 * Keep parse rules aligned with src/utils/map-url-embed.mjs (parseLatLngFromMapUrl).
 */

function parseLatLngFromMapUrl(urlString: string): { lat: number; lng: number } | null {
  if (!urlString) return null;
  try {
    const u = new URL(urlString, 'https://www.google.com');
    const mlat = u.searchParams.get('mlat');
    const mlon = u.searchParams.get('mlon');
    if (mlat && mlon) {
      const lat = parseFloat(mlat);
      const lng = parseFloat(mlon);
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }

    const at = urlString.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|\/|$)/);
    if (at) {
      const lat = parseFloat(at[1]);
      const lng = parseFloat(at[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }

    const q = u.searchParams.get('q');
    if (q) {
      const decoded = decodeURIComponent(q.replace(/\+/g, ' '));
      const coordMatch = decoded.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return { lat, lng };
        }
      }
    }

    const ll = u.searchParams.get('ll');
    if (ll) {
      const [a, b] = ll.split(',').map((s) => parseFloat(s.trim()));
      if (!Number.isNaN(a) && !Number.isNaN(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        return { lat: a, lng: b };
      }
    }

    const d3 = urlString.match(/!3d(-?\d+\.?\d*)/);
    const d4 = urlString.match(/!4d(-?\d+\.?\d*)/);
    if (d3 && d4) {
      const lat = parseFloat(d3[1]);
      const lng = parseFloat(d4[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
  } catch {
    return null;
  }
  return null;
}

const SAFE_MAP_REDIRECT_HOSTS = new Set(
  [
    'maps.app.goo.gl',
    'goo.gl',
    'www.goo.gl',
    'maps.google.com',
    'www.google.com',
    'google.com',
    'www.openstreetmap.org',
    'openstreetmap.org',
  ].map((h) => h.toLowerCase()),
);

function isSafeMapRedirectHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (SAFE_MAP_REDIRECT_HOSTS.has(h)) return true;
  if (h.endsWith('.app.goo.gl')) return true;
  if (h.endsWith('.google.com') || h.endsWith('.googleusercontent.com')) return true;
  return false;
}

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Only these entry hosts may start a resolve (reduces SSRF surface). */
export function isAllowedMapResolveEntry(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:') return false;
    return isSafeMapRedirectHost(u.hostname);
  } catch {
    return false;
  }
}

export async function resolveMapUrlToLatLng(inputUrl: string): Promise<{
  lat: number;
  lng: number;
  finalUrl: string;
} | null> {
  let url = inputUrl.trim();
  if (!isAllowedMapResolveEntry(url)) return null;

  for (let hop = 0; hop < 10; hop += 1) {
    const direct = parseLatLngFromMapUrl(url);
    if (direct) return { lat: direct.lat, lng: direct.lng, finalUrl: url };

    let nextUrl: URL;
    try {
      nextUrl = new URL(url);
    } catch {
      return null;
    }
    if (!isHttpsUrl(nextUrl.href) || !isSafeMapRedirectHost(nextUrl.hostname)) return null;

    const res = await fetch(nextUrl.href, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'SyncScriptMapResolve/1.0',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return null;
      const resolved = new URL(loc, nextUrl.href).href;
      if (!isHttpsUrl(resolved)) return null;
      let nextHost: string;
      try {
        nextHost = new URL(resolved).hostname;
      } catch {
        return null;
      }
      if (!isSafeMapRedirectHost(nextHost)) return null;
      url = resolved;
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      const finalU = res.url && res.url !== 'about:blank' ? res.url : url;
      if (!isHttpsUrl(finalU)) return null;
      const parsed = parseLatLngFromMapUrl(finalU);
      if (parsed) return { lat: parsed.lat, lng: parsed.lng, finalUrl: finalU };
      return null;
    }

    return null;
  }

  return null;
}
