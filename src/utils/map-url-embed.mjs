/**
 * Extract a maps URL from assistant text and parse lat/lng for an embed (no API key).
 * Short links (goo.gl / maps.app.goo.gl) usually do not encode coordinates in the string — embed is skipped.
 */

export function extractFirstMapUrl(text) {
  if (!text) return null;
  const patterns = [
    /https:\/\/maps\.app\.goo\.gl\/[^\s)\]>'"]+/gi,
    /https:\/\/(www\.)?google\.com\/maps[^\s)\]>'"]*/gi,
    /https:\/\/maps\.google\.com\/[^\s)\]>'"]+/gi,
    /https:\/\/goo\.gl\/maps\/[^\s)\]>'"]+/gi,
    /https:\/\/www\.openstreetmap\.org\/[^\s)\]>'"]+/gi,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[0]) return m[0].replace(/[.,;]+$/, '');
  }
  return null;
}

/** Returns WGS84 coords when the URL encodes them; otherwise null. */
/** True when URL may resolve to coordinates via GET /api/map/resolve-map-url (short links). */
export function shouldTryServerMapResolve(urlString) {
  if (!urlString) return false;
  if (parseLatLngFromMapUrl(urlString)) return false;
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'maps.app.goo.gl' || h.endsWith('.app.goo.gl')) return true;
    if (h === 'goo.gl' || h === 'www.goo.gl') return true;
    return false;
  } catch {
    return false;
  }
}

export function parseLatLngFromMapUrl(urlString) {
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
