#!/usr/bin/env bash
#
# Installs the tunnel-URL watchdog as a systemd timer (every 60s).
# Run once on the Oracle VM. Idempotent — re-running just refreshes the unit.
#
# Usage (on Oracle):
#   sudo /opt/nexus-agent-runner/install-watchdog.sh
#
# After install:
#   sudo systemctl status nexus-agent-runner-watchdog.timer
#   sudo journalctl -u nexus-agent-runner-watchdog.service -n 50
#   sudo /opt/nexus-agent-runner/watchdog-tunnel-url.sh   # run once by hand

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Re-running with sudo…" >&2
  exec sudo bash "$0" "$@"
fi

INSTALL_DIR="/opt/nexus-agent-runner"
WATCHDOG="${INSTALL_DIR}/watchdog-tunnel-url.sh"

if [[ ! -x "$WATCHDOG" ]]; then
  echo "Watchdog not executable at $WATCHDOG — chmod +x it first" >&2
  exit 1
fi

mkdir -p /var/lib/nexus-agent-runner

cat >/etc/systemd/system/nexus-agent-runner-watchdog.service <<EOF
[Unit]
Description=Publish current cloudflared quick-tunnel URL for Nexus Agent Runner
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
# Allow Docker socket access via group; service runs as root so we don't need
# to fight Docker permissions on Oracle Ubuntu.
ExecStart=$WATCHDOG
StandardOutput=journal
StandardError=journal
EOF

cat >/etc/systemd/system/nexus-agent-runner-watchdog.timer <<EOF
[Unit]
Description=Run nexus-agent-runner-watchdog every minute
After=docker.service

[Timer]
# Fire ~10 seconds after boot, then every 60 seconds. Persistent=true means a
# missed tick (e.g. system was off) fires once on resume.
OnBootSec=10
OnUnitActiveSec=60
AccuracySec=5
Persistent=true
Unit=nexus-agent-runner-watchdog.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nexus-agent-runner-watchdog.timer >/dev/null
systemctl restart nexus-agent-runner-watchdog.timer

echo "✅ Watchdog installed."
echo
systemctl status nexus-agent-runner-watchdog.timer --no-pager | head -10
echo
echo "Triggering one immediate run for verification…"
systemctl start nexus-agent-runner-watchdog.service || true
sleep 2
journalctl -u nexus-agent-runner-watchdog.service -n 20 --no-pager
