#!/usr/bin/env bash
# Bring up Engram + Hermes mock + OpenClaw (whatever is missing), then register both with Engram.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

need_hermes=0
need_openclaw=0
need_engram=0

curl -sf -o /dev/null http://127.0.0.1:8000/ || need_engram=1
curl -sf -o /dev/null http://127.0.0.1:18880/health || need_hermes=1
curl -sf -o /dev/null http://127.0.0.1:18789/healthz || need_openclaw=1

if [ "$need_engram" = "1" ]; then
  echo "[lab] Starting Engram (Docker)..."
  npm run setup:engram:up
else
  echo "[lab] Engram already up on :8000"
fi

if [ "$need_hermes" = "1" ]; then
  echo "[lab] Starting Hermes mock on :18880..."
  node ./integrations/hermes-mock-server.mjs &
  for _ in $(seq 1 30); do
    curl -sf -o /dev/null http://127.0.0.1:18880/health && break
    sleep 1
  done
else
  echo "[lab] Hermes mock already up on :18880"
fi

if [ "$need_openclaw" = "1" ]; then
  echo "[lab] Starting OpenClaw gateway on :18789..."
  env NVIDIA_API_KEY="${NVIDIA_API_KEY:-placeholder}" openclaw gateway run --port 18789 --force --bind loopback &
  for _ in $(seq 1 45); do
    curl -sf -o /dev/null http://127.0.0.1:18789/healthz && break
    sleep 1
  done
else
  echo "[lab] OpenClaw gateway already up on :18789"
fi

echo "[lab] Registering agents with Engram..."
npm run engram:register-agents

echo ""
echo "=== Verification ==="
curl -sf -o /dev/null -w "Engram GET / -> %{http_code}\n" http://127.0.0.1:8000/
curl -sf -o /dev/null -w "Hermes GET /health -> %{http_code}\n" http://127.0.0.1:18880/health
curl -sf -o /dev/null -w "OpenClaw GET /healthz -> %{http_code}\n" http://127.0.0.1:18789/healthz
echo "Discover: curl -sS 'http://127.0.0.1:8000/api/v1/discover?protocol=MCP'"
echo "Swagger:  open http://localhost:8000/docs"
