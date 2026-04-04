#!/usr/bin/env bash
# Hermes mock on :18880 → Cloudflare Quick Tunnel → Supabase HERMES_BASE_URL → Edge verify.
#
# Prereqs: cloudflared, node, supabase CLI logged in
# Usage:
#   bash scripts/bringup-hermes-tunnel-supabase.sh
#
# Ephemeral: restarting cloudflared changes the hostname — re-run or:
#   supabase secrets set HERMES_BASE_URL='https://NEW.trycloudflare.com' --project-ref kwhnrlzibgfedtxpkbgb
#   npm run deploy:edge:make-server
#
# Keep this terminal session: mock + cloudflared run until you Ctrl+C or kill PIDs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PROJECT_REF="${SUPABASE_PROJECT_REF:-kwhnrlzibgfedtxpkbgb}"
PORT="${HERMES_MOCK_PORT:-18880}"
CF_LOG="${TMPDIR:-/tmp}/hermes-cloudflared-$$.log"

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[bringup] Port $PORT already in use — assuming Hermes mock is running."
else
  echo "[bringup] Starting Hermes mock on :$PORT …"
  node "$ROOT/integrations/hermes-mock-server.mjs" &
  MOCK_PID=$!
  for _ in $(seq 1 30); do
    if curl -sf "http://127.0.0.1:$PORT/health" >/dev/null; then break; fi
    sleep 1
  done
fi

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
  echo "[bringup] ERROR: no trycloudflare URL. tail $CF_LOG"; tail -25 "$CF_LOG" || true
  kill "$CF_PID" 2>/dev/null || true
  exit 1
fi

echo "[bringup] Tunnel: $URL"
supabase secrets set HERMES_BASE_URL="$URL" --project-ref "$PROJECT_REF"
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

echo "[bringup] Done. cloudflared PID=$CF_PID (kill when finished). Log: $CF_LOG"
