#!/usr/bin/env bash
# Run ON THE ORACLE VM (Ubuntu) after Kokoro + systemd services are up.
# Starts Cloudflare *quick* tunnels (ephemeral *.trycloudflare.com) for:
#   - Kokoro: docker compose profile quick-tunnel (see deploy/kokoro-tts-ec2/docker-compose.yml)
#   - Hermes mock :18880 and OpenClaw :18789: separate cloudflared containers (host network).
#
# Production should use named tunnels + CLOUDFLARE_TUNNEL_TOKEN instead; quick tunnels break on restart.
set -euo pipefail

KOKORO_DIR="${KOKORO_DIR:-/opt/syncscript/deploy/kokoro-tts-ec2}"

echo "=== Kokoro quick tunnel (docker compose) ==="
cd "$KOKORO_DIR"
sudo docker compose --profile quick-tunnel up -d
sleep 5
sudo docker logs kokoro-cloudflared-quick 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true

sudo docker rm -f cf-hermes-quick cf-openclaw-quick 2>/dev/null || true
echo "=== Hermes :18880 ==="
sudo docker run -d --name cf-hermes-quick --restart unless-stopped --network host \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://127.0.0.1:18880
sleep 4
sudo docker logs cf-hermes-quick 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true

echo "=== OpenClaw :18789 ==="
sudo docker run -d --name cf-openclaw-quick --restart unless-stopped --network host \
  cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://127.0.0.1:18789
sleep 4
sudo docker logs cf-openclaw-quick 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true

echo "Then set Vercel KOKORO_TTS_URL, Supabase OPENCLAW_BASE_URL / OPENCLAW_TOKEN / HERMES_BASE_URL (see deploy/oracle/README.md)."
