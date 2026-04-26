#!/usr/bin/env bash
# Register OpenClaw + Hermes mock with Engram (POST /api/v1/register).
# Prereqs:
#   - Engram API up (e.g. http://127.0.0.1:8000)
#   - OpenClaw gateway on host (default 18789):  openclaw gateway run
#   - Hermes mock: npm run hermes:mock  (default 18880)
#
# Engram runs in Docker: endpoint_url uses host.docker.internal so the container reaches the host.
set -euo pipefail

ENGRAM_BASE="${ENGRAM_BASE:-http://127.0.0.1:8000}"
OPENCLAW_ENDPOINT="${OPENCLAW_ENDPOINT:-http://host.docker.internal:18789}"
HERMES_ENDPOINT="${HERMES_ENDPOINT:-http://host.docker.internal:18880}"

OPENCLAW_AGENT_ID="${OPENCLAW_AGENT_ID:-a0000001-0000-4000-8000-000000000001}"
HERMES_AGENT_ID="${HERMES_AGENT_ID:-a0000002-0000-4000-8000-000000000002}"

register() {
  local id="$1" url="$2" caps="$3" tags="$4"
  curl -sS -X POST "${ENGRAM_BASE}/api/v1/register" \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"${id}\",\"supported_protocols\":[\"MCP\"],\"capabilities\":${caps},\"semantic_tags\":${tags},\"endpoint_url\":\"${url}\"}"
  echo ""
}

echo "Registering OpenClaw -> ${OPENCLAW_ENDPOINT}"
register "$OPENCLAW_AGENT_ID" "$OPENCLAW_ENDPOINT" '["chat","gateway"]' '["syncscript","openclaw"]'

echo "Registering Hermes mock -> ${HERMES_ENDPOINT}"
register "$HERMES_AGENT_ID" "$HERMES_ENDPOINT" '["demo","mock"]' '["hermes","mock"]'

echo "Done. List MCP agents: curl -sS \"${ENGRAM_BASE}/api/v1/discover?protocol=MCP\""
