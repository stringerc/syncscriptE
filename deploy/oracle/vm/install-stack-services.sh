#!/usr/bin/env bash
# Run ON THE ORACLE VM (Ubuntu aarch64) with sudo after rsync + bootstrap-ampere.sh:
#   sudo bash /opt/syncscript/deploy/oracle/vm/install-stack-services.sh
#
# Installs Node.js 22 from NodeSource, global `openclaw`, enables openclaw-gateway + hermes-mock systemd units.
# Kokoro: from /opt/syncscript/deploy/kokoro-tts-ec2 — `docker compose up -d --build` (kokoro only; add CLOUDFLARE_TUNNEL_TOKEN + profile named-tunnel for public HTTPS).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo" >&2
  exit 1
fi

NODE_MAJOR=22
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p process.versions.node 2>/dev/null | cut -d. -f1)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

command -v node && node --version
command -v npm && npm --version

npm install -g openclaw
command -v openclaw && openclaw --version 2>/dev/null || true

# gateway.mode=local is required for OpenClaw 2026.4+ without --allow-unconfigured
sudo -u ubuntu bash /opt/syncscript/deploy/oracle/vm/ensure-openclaw-gateway-config.sh

install -m 644 /opt/syncscript/deploy/oracle/systemd/openclaw-gateway.service /etc/systemd/system/
install -m 644 /opt/syncscript/deploy/oracle/systemd/hermes-executor.service /etc/systemd/system/
install -m 644 /opt/syncscript/deploy/oracle/systemd/hermes-mock.service /etc/systemd/system/

systemctl daemon-reload
systemctl disable --now hermes-mock.service 2>/dev/null || true
systemctl enable --now openclaw-gateway.service
systemctl enable --now hermes-executor.service

echo "OK — openclaw-gateway + hermes-executor started. Check: systemctl status openclaw-gateway hermes-executor"
echo "(hermes-mock.service kept on disk for local dev: npm run hermes:mock)"
echo "Next: cd /opt/syncscript/deploy/kokoro-tts-ec2 && cp env.example .env && (set CLOUDFLARE_TUNNEL_TOKEN) && docker compose --profile named-tunnel up -d --build"
