# TTS reliability (SLO-oriented)

This doc ties together **application fallbacks**, **observability**, **synthetic checks**, **DNS-level failover**, and **pre-warm**. The app already chains: Vercel proxy → direct Kokoro (primary + optional `KOKORO_TTS_FALLBACK_URL`) → (non-Cortana) browser TTS.

## 1. RUM (real user monitoring)

- **Client**: `src/utils/tts-rum-beacon.ts` sends coarse beacons (`outcome`, `path`, `durationMs`, `voicePreset`, page path) to `POST /api/ai/tts` with `kind: "tts_rum"` — **no transcript**.
- **Server**: `api/ai/tts.ts` logs one JSON line per beacon (`src: "tts_rum"`). Point your log drain / APM at Vercel logs, or set **`TTS_RUM_WEBHOOK_URL`** to POST the same JSON to Slack, Datadog, PagerDuty, etc.
- **Product analytics**: If the user accepted cookies, the same event is duplicated to Plausible/GA via `analytics.trackEvent` (category `Reliability`, action `tts_outcome`).

## 2. Synthetic probes

- **Built-in**: `GET /api/ai/tts?probe=1` from Vercel hits each configured Kokoro `/health` and returns `kokoroUpstreamReachable` / `kokoroFallbackReachable`.
- **Scheduled (GitHub Actions)**: `.github/workflows/tts-slo-probe.yml` — curls `…/api/ai/tts?probe=1` on a schedule (independent of Vercel; works on **Hobby**, which cannot run sub-daily Vercel crons).
- **Optional (Vercel Pro+)**: Add a cron in `vercel.json` pointing at `/api/cron/tts-slo` (e.g. `*/15 * * * *`). **Hobby** accounts are limited to daily cron schedules; use GitHub or an external uptime checker for frequent probes.
- **Manual / operator**: `GET https://www.syncscript.app/api/cron/tts-slo` with `Authorization: Bearer $CRON_SECRET` (dynamic segment `tts-slo` → `handleTtsSlo`). Uses `APP_URL` / `VERCEL_URL` to self-probe.

Wire alerts when `kokoroConfigured` is true but `kokoroUpstreamReachable` is false (and fallback, if configured, is also down).

## 3. Pre-warm (cold ONNX / tunnel)

- **Cron**: Set **`TTS_CRON_PREWARM=1`** on Vercel so `tts-slo` also `POST`s a tiny synthesis (`text: "warm"`) through `/api/ai/tts`, warming the serverless → Kokoro path. Disable if you want zero extra synthesis cost.
- **Origin VM**: On the Kokoro host, a systemd timer curling `GET /health` or a minimal `/v1/audio/speech` keeps the process hot (documented per your `deploy/kokoro-tts-ec2/` runbooks).

## 4. Auto-failover DNS (not in this repo)

DNS failover is **infrastructure**: e.g. Cloudflare load balancing with health checks, AWS Route 53 health-checked records, or Fastly/OCI equivalent — point **two hostnames** at primary vs backup Kokoro, then set **`KOKORO_TTS_URL`** / **`KOKORO_TTS_FALLBACK_URL`** to those stable names. The SPA + `GET /api/ai/tts` already expose both origins for **client-side** direct fallback; DNS health checks protect **server-side** and tunnel endpoints.

## 5. Deploy

After changing `api/ai/tts` or client TTS code, run **`npm run deploy:vercel:prod`** so the API and SPA stay in sync.

## Env reference

| Variable | Purpose |
|----------|---------|
| `KOKORO_TTS_URL` | Primary Kokoro base |
| `KOKORO_TTS_FALLBACK_URL` | Backup Kokoro base (e.g. Oracle) |
| `TTS_RUM_WEBHOOK_URL` | Optional: receive JSON RUM payloads |
| `TTS_CRON_PREWARM` | `1` = cron runs tiny POST after probe |
| `APP_URL` | Canonical `https://www.syncscript.app` for cron self-probes |
| `CRON_SECRET` | Bearer for `/api/cron/*` |
