#!/usr/bin/env bash
# Sync repo to Oracle VM /opt/syncscript (run from repo root on Mac).
# Excludes heavy paths not needed for Kokoro/OpenClaw/Hermes on the server.
set -euo pipefail
INSTANCE_IP="${INSTANCE_IP:?set INSTANCE_IP}"
SSH_KEY="${SSH_KEY:?set SSH_KEY to private key path}"
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"
exec /usr/bin/rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  --exclude node_modules --exclude .git --exclude dist --exclude build \
  --exclude nature-cortana-platform \
  --exclude '.cursor' \
  ./ "ubuntu@${INSTANCE_IP}:/opt/syncscript/"
