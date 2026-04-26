#!/usr/bin/env bash
# Run on the Oracle VM (cron or systemd timer) to:
#   1) Probe local services so failures are visible / can trigger alerts.
#   2) Keep light periodic activity (some operators use this pattern alongside real traffic;
#      Oracle may reclaim *idle* resources — see current Always Free docs; do not rely on this alone).
#
# Env (optional):
#   KOKORO_HEALTH_URL=http://127.0.0.1:8880/health
#   OPENCLAW_PORT=18789
#   HERMES_HEALTH_URL=http://127.0.0.1:18880/health
#   ENGRAM_URL=http://127.0.0.1:8000/health
#
set -euo pipefail
KOKORO_HEALTH_URL="${KOKORO_HEALTH_URL:-http://127.0.0.1:8880/health}"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"
HERMES_HEALTH_URL="${HERMES_HEALTH_URL:-http://127.0.0.1:18880/health}"
ENGRAM_URL="${ENGRAM_URL:-}"

log() { echo "[$(date -Iseconds)] $*"; }

fail=0

if curl -fsS --max-time 5 "$KOKORO_HEALTH_URL" >/dev/null 2>&1; then
  log "kokoro: ok"
else
  log "kokoro: FAIL $KOKORO_HEALTH_URL"
  fail=1
fi

if command -v nc >/dev/null 2>&1 && nc -z -w 2 127.0.0.1 "$OPENCLAW_PORT" 2>/dev/null; then
  log "openclaw: tcp :${OPENCLAW_PORT} ok"
else
  log "openclaw: FAIL tcp :${OPENCLAW_PORT}"
  fail=1
fi

if curl -fsS --max-time 5 "$HERMES_HEALTH_URL" >/dev/null 2>&1; then
  log "hermes: ok"
else
  log "hermes: WARN $HERMES_HEALTH_URL (optional)"
fi

if [[ -n "$ENGRAM_URL" ]]; then
  if curl -fsS --max-time 5 "$ENGRAM_URL" >/dev/null 2>&1; then
    log "engram: ok"
  else
    log "engram: WARN $ENGRAM_URL"
  fi
fi

# Tiny CPU wake (harmless on Ampere; keeps the box from being completely idle if nothing else runs)
openssl speed -multi 1 -seconds 1 rsa2048 >/dev/null 2>&1 || true

exit "$fail"
