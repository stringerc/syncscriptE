#!/usr/bin/env bash
#
# Tunnel-URL watchdog for the Nexus Agent Runner on Oracle.
#
# What it does:
#   - Reads the current ephemeral *.trycloudflare.com URL from the
#     `cf-agent-runner-quick` Docker container's logs.
#   - Compares it to the URL last published to public.runner_endpoints
#     in Supabase.
#   - If different (i.e. cloudflared restarted and got a new URL), upserts
#     the new URL into the row using the service-role key.
#   - Vercel reads from that row at request time, so the URL is always
#     current with no manual env updates.
#
# Idempotent. Safe to run on a 1-minute systemd timer or cron.
# Logs to stderr; exit 0 always (don't spam systemd with failures during
# transient docker/network blips).
#
# Required env (loaded from /opt/nexus-agent-runner/.env):
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
#
# Run manually:
#   sudo /opt/nexus-agent-runner/watchdog-tunnel-url.sh

set -uo pipefail

ENV_FILE="${NEXUS_AGENT_RUNNER_ENV_FILE:-/opt/nexus-agent-runner/.env}"
STATE_DIR="/var/lib/nexus-agent-runner"
STATE_FILE="${STATE_DIR}/last-tunnel-url"
CONTAINER="${CONTAINER_NAME:-cf-agent-runner-quick}"

log() { printf '[watchdog %s] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }

# ── 1. Load env ────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  log "env file not found: $ENV_FILE"
  exit 0
fi
set -a; . "$ENV_FILE"; set +a

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  log "missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 0
fi

# ── 2. Read current tunnel URL from cloudflared logs ───────────────────
# The first INF line on container start logs the URL. We scan ALL log lines
# since container start (not just tail) so a long-running container's URL
# is still discoverable. URL stays the same until cloudflared restarts.
TUNNEL_URL=$(docker logs "$CONTAINER" 2>&1 \
  | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' \
  | tail -1)

if [[ -z "$TUNNEL_URL" ]]; then
  log "no tunnel URL in $CONTAINER logs (container running? '$(docker ps --filter name=$CONTAINER --format '{{.Status}}')')"
  exit 0
fi

# ── 3. Compare to last-known ───────────────────────────────────────────
mkdir -p "$STATE_DIR"
LAST=""
[[ -f "$STATE_FILE" ]] && LAST="$(cat "$STATE_FILE" 2>/dev/null || true)"
if [[ "$TUNNEL_URL" == "$LAST" ]]; then
  # Unchanged — nothing to do. Optionally still upsert the row's updated_at
  # so observability dashboards see the watchdog is alive. Skip in normal mode.
  exit 0
fi

log "tunnel URL changed: '${LAST:-<none>}' -> '$TUNNEL_URL' — upserting to Supabase"

# ── 4. Upsert the new URL via PostgREST ───────────────────────────────
# Idempotent UPSERT via on_conflict=name. service-role key bypasses RLS.
HTTP_CODE=$(curl -sS -o /tmp/.runner_endpoints_resp \
  -w '%{http_code}' \
  -X POST \
  "${SUPABASE_URL%/}/rest/v1/runner_endpoints?on_conflict=name" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H 'Content-Type: application/json' \
  -H 'Prefer: resolution=merge-duplicates' \
  --data "{\"name\":\"agent_runner\",\"url\":\"${TUNNEL_URL}\",\"notes\":\"oracle-watchdog $(hostname) $(date -u +%FT%TZ)\"}" || echo 000)

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  log "Supabase upsert OK (HTTP $HTTP_CODE)"
  echo "$TUNNEL_URL" > "$STATE_FILE"
else
  log "Supabase upsert FAILED (HTTP $HTTP_CODE): $(cat /tmp/.runner_endpoints_resp 2>/dev/null | head -c 300)"
  # Don't write state file — we'll retry next tick.
fi

rm -f /tmp/.runner_endpoints_resp
exit 0
