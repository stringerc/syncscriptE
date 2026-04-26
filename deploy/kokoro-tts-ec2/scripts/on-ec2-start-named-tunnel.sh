#!/usr/bin/env bash
# Run ON THE EC2 HOST from /opt/kokoro-tts-ec2 (or pass KOKORO_EC2_DIR).
# Starts Kokoro + Cloudflare named tunnel (stable DNS hostname configured in Zero Trust).
#
# Prerequisites:
#   - .env with CLOUDFLARE_TUNNEL_TOKEN (from Zero Trust → Tunnels → your tunnel → Docker)
#   - Public hostname in tunnel UI: HTTPS → http://localhost:8880
#   - Docker + docker compose plugin
#
set -euo pipefail
DIR="${KOKORO_EC2_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$DIR"

if [[ ! -f .env ]]; then
  echo "[kokoro-ec2] ERROR: missing .env — cp env.example .env and set CLOUDFLARE_TUNNEL_TOKEN" >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a
source .env
set +a
if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  echo "[kokoro-ec2] ERROR: CLOUDFLARE_TUNNEL_TOKEN is empty in .env" >&2
  exit 1
fi

echo "[kokoro-ec2] Starting Kokoro + cloudflared (named-tunnel profile) in $DIR ..."
docker compose --profile named-tunnel up -d --build

echo "[kokoro-ec2] Waiting for loopback health (up to ~180s on cold model download)..."
ok=0
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8880/health >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 3
done
if [[ "$ok" -ne 1 ]]; then
  echo "[kokoro-ec2] WARN: http://127.0.0.1:8880/health not ready — check: docker compose logs kokoro"
fi

echo "[kokoro-ec2] Container status:"
docker compose ps

echo ""
echo "[kokoro-ec2] Next steps (on your laptop, with Vercel CLI linked):"
echo "  1) Confirm HTTPS from the internet: curl -sS 'https://YOUR_PUBLIC_HOST/health'"
echo "     (YOUR_PUBLIC_HOST = hostname you set in Cloudflare tunnel → Public hostname)"
echo "  2) ./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://YOUR_PUBLIC_HOST' --all-environments"
echo "  3) vercel deploy --prod --yes"
echo "  4) curl -sS 'https://www.syncscript.app/api/ai/tts?probe=1'"
echo ""
echo "Full runbook: deploy/kokoro-tts-ec2/NAMED_TUNNEL_SETUP_RUNBOOK.md"
