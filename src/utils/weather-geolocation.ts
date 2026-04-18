/**
 * Single source for dashboard weather lat/lon so the header widget and AI Focus
 * stay aligned. Caches successful fixes in sessionStorage and dedupes concurrent requests.
 */

const CACHE_KEY = 'syncscript_weather_geo_v1';
const MAX_CACHE_AGE_MS = 30 * 60 * 1000;

/** Public fallback when geolocation stalls, is denied, or times out (OpenWeather still returns usable data). */
export const WEATHER_COORDS_FALLBACK = { lat: 37.7749, lon: -122.4194 };

const GEO_DEADLINE_MS = 5000;

interface CachedEntry {
  lat: number;
  lon: number;
  savedAt: number;
}

function readCache(): { lat: number; lon: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as CachedEntry;
    if (
      typeof p.lat !== 'number' ||
      typeof p.lon !== 'number' ||
      typeof p.savedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - p.savedAt > MAX_CACHE_AGE_MS) return null;
    return { lat: p.lat, lon: p.lon };
  } catch {
    return null;
  }
}

function writeCache(lat: number, lon: number): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ lat, lon, savedAt: Date.now() } satisfies CachedEntry),
    );
  } catch {
    /* quota / private mode */
  }
}

let inFlight: Promise<{ lat: number; lon: number }> | null = null;

function resolveCoordsFromGeo(cached: { lat: number; lon: number } | null): Promise<{ lat: number; lon: number }> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve(cached ?? WEATHER_COORDS_FALLBACK);
  }

  const geoPromise = new Promise<{ lat: number; lon: number }>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        writeCache(lat, lon);
        resolve({ lat, lon });
      },
      () => {
        resolve(cached ?? WEATHER_COORDS_FALLBACK);
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 120000,
      },
    );
  });

  const deadline = new Promise<{ lat: number; lon: number }>((resolve) => {
    setTimeout(() => resolve(cached ?? WEATHER_COORDS_FALLBACK), GEO_DEADLINE_MS);
  });

  return Promise.race([geoPromise, deadline]);
}

/**
 * Resolves best-effort coordinates for weather APIs. Reuses one in-flight
 * geolocation request per page load; falls back to recent cache, then SF.
 *
 * **Hard deadline:** if the browser never resolves geolocation (rare but observed in the wild),
 * we still resolve within ~5s so dashboard weather never spins forever.
 */
export function getWeatherCoords(): Promise<{ lat: number; lon: number }> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const cached = readCache();
    try {
      return await resolveCoordsFromGeo(cached);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
