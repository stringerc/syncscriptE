#!/usr/bin/env bash
# Hermes mock (optional) → public URL → Supabase HERMES_BASE_URL → Edge deploy + probe.
#
# Prereqs: cloudflared (quick or named modes), node, supabase CLI logged in
#
# Modes:
#   1) Quick Tunnel (default): ephemeral *.trycloudflare.com
#        npm run bringup:hermes:tunnel
#   2) Stable URL only — executor already reachable (EC2, named tunnel elsewhere, etc.):
#        HERMES_BASE_URL_TARGET=https://hermes.example.com npm run bringup:hermes:tunnel
#      Skips mock and cloudflared; only sets secret, deploys Edge, probes.
#   3) Named Cloudflare tunnel on this machine (stable hostname in ~/.cloudflared/config.yml):
#        HERMES_NAMED_TUNNEL=my-tunnel HERMES_PUBLIC_BASE_URL=https://hermes.example.com npm run bringup:hermes:tunnel
#      Starts mock if :PORT is free, runs `cloudflared tunnel run`, waits for public /health, then secret + deploy.
#
# Ephemeral quick tunnel: new hostname after cloudflared restart — re-run or use mode 2/3.
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PROJECT_REF="${SUPABASE_PROJECT_REF:-kwhnrlzibgfedtxpkbgb}"
PORT="${HERMES_MOCK_PORT:-18880}"
CF_LOG="${TMPDIR:-/tmp}/hermes-cloudflared-$$.log"
MOCK_PID=""
CF_PID=""

strip_slash() {
  echo "${1%/}"
}

ensure_mock() {
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[bringup] Port $PORT already in use — assuming Hermes mock (or your executor) is running."
    return 0
  fi
  echo "[bringup] Starting Hermes mock on :$PORT …"
  node "$ROOT/integrations/hermes-mock-server.mjs" &
  MOCK_PID=$!
  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:$PORT/health" >/dev/null; then return 0; fi
    sleep 1
  done
  echo "[bringup] ERROR: mock did not become healthy on :$PORT"
  exit 1
}

finish_with_url() {
  local url
  url="$(strip_slash "$1")"
  echo "[bringup] HERMES_BASE_URL → $url"
  supabase secrets set HERMES_BASE_URL="$url" --project-ref "$PROJECT_REF"
  npm run deploy:edge:make-server

  ANON="${VITE_SUPABASE_ANON_KEY:-}"
  if [[ -z "$ANON" && -f "$ROOT/.env" ]]; then
    ANON=$(grep -E '^VITE_SUPABASE_ANON_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"' | tr -d "'") || true
  fi
  if [[ -n "$ANON" ]]; then
    echo "[bringup] Probing Edge /hermes/health …"
    curl -sS -H "Authorization: Bearer $ANON" -H "apikey: $ANON" \
      "https://${PROJECT_REF}.supabase.co/functions/v1/make-server-57781ad9/hermes/health" | head -c 400
    echo ""
  fi
  echo "[bringup] Done."
}

# --- Mode 2: stable URL only (no local tunnel) ---
if [[ -n "${HERMES_BASE_URL_TARGET:-}" ]]; then
  finish_with_url "$HERMES_BASE_URL_TARGET"
  exit 0
fi

# Modes 1 & 3 need a local service on PORT for the tunnel to target
ensure_mock

# --- Mode 3: named Cloudflare tunnel ---
if [[ -n "${HERMES_NAMED_TUNNEL:-}" ]]; then
  if [[ -z "${HERMES_PUBLIC_BASE_URL:-}" ]]; then
    echo "[bringup] ERROR: HERMES_NAMED_TUNNEL set but HERMES_PUBLIC_BASE_URL is empty (hostname you configured in Cloudflare)."
    exit 1
  fi
  PUB="$(strip_slash "$HERMES_PUBLIC_BASE_URL")"
  echo "[bringup] Named tunnel: cloudflared tunnel run $HERMES_NAMED_TUNNEL (see ~/.cloudflared/config.yml)"
  cloudflared tunnel --no-autoupdate run "$HERMES_NAMED_TUNNEL" >"$CF_LOG" 2>&1 &
  CF_PID=$!
  for _ in $(seq 1 120); do
    if curl -sf "$PUB/health" >/dev/null 2>&1 || curl -sf "$PUB/healthz" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  if ! curl -sf "$PUB/health" >/dev/null 2>&1 && ! curl -sf "$PUB/healthz" >/dev/null 2>&1; then
    echo "[bringup] ERROR: public URL not healthy: $PUB/health — tail $CF_LOG"
    tail -40 "$CF_LOG" || true
    kill "$CF_PID" 2>/dev/null || true
    exit 1
  fi
  echo "[bringup] Public executor: $PUB"
  finish_with_url "$PUB"
  echo "[bringup] cloudflared PID=$CF_PID (kill when finished). Log: $CF_LOG"
  exit 0
fi

# --- Mode 1: Quick Tunnel (default) ---
echo "[bringup] Starting Cloudflare Quick Tunnel → http://127.0.0.1:$PORT …"
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$CF_LOG" 2>&1 &
CF_PID=$!
URL=""
for _ in $(seq 1 90); do
  URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -1 || true)
  if [[ -n "${URL:-}" ]]; then break; fi
  sleep 2
done
if [[ -z "${URL:-}" ]]; then
  echo "[bringup] ERROR: no trycloudflare URL. tail $CF_LOG"
  tail -25 "$CF_LOG" || true
  kill "$CF_PID" 2>/dev/null || true
  exit 1
fi
echo "[bringup] Tunnel: $URL"
finish_with_url "$URL"
echo "[bringup] cloudflared PID=$CF_PID (kill when finished). Log: $CF_LOG"
