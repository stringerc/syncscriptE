#!/usr/bin/env bash
# Run on Oracle Ampere A1 (Ubuntu 22.04/24.04) with sudo.
# Installs Docker + enables keepalive timer once repo exists at /opt/syncscript.
#
#   sudo bash bootstrap-ampere.sh
#
# Then from your laptop: rsync the repo to ubuntu@INSTANCE_IP:/opt/syncscript/
# and run this again OR:
#   sudo cp /opt/syncscript/deploy/oracle/scripts/keepalive-light-load.sh /usr/local/bin/syncscript-keepalive.sh
#   sudo chmod +x /usr/local/bin/syncscript-keepalive.sh
#   sudo cp /opt/syncscript/deploy/oracle/systemd/syncscript-keepalive.* /etc/systemd/system/
#   sudo systemctl daemon-reload && sudo systemctl enable --now syncscript-keepalive.timer
#
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git openssl netcat-openbsd

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable docker
systemctl start docker

mkdir -p /opt/syncscript
REPO="/opt/syncscript"
KEEP="$REPO/deploy/oracle/scripts/keepalive-light-load.sh"

if [[ -f "$KEEP" ]]; then
  install -m 755 "$KEEP" /usr/local/bin/syncscript-keepalive.sh
  cp "$REPO/deploy/oracle/systemd/syncscript-keepalive.service" /etc/systemd/system/
  cp "$REPO/deploy/oracle/systemd/syncscript-keepalive.timer" /etc/systemd/system/
  sed -i 's|ExecStart=.*|ExecStart=/usr/local/bin/syncscript-keepalive.sh|' /etc/systemd/system/syncscript-keepalive.service
  systemctl daemon-reload
  systemctl enable --now syncscript-keepalive.timer
  echo "Keepalive timer enabled."
else
  echo "Repo not yet at $REPO — rsync syncscript there, then re-run or install keepalive manually (see header comments)."
fi

echo "Docker OK. Next: /opt/syncscript → deploy/kokoro-tts-ec2 + Cloudflare named tunnel (deploy/oracle/README.md)."
