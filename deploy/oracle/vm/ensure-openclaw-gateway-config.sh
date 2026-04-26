#!/usr/bin/env bash
# Run as the same user that runs openclaw-gateway (typically ubuntu), after `npm install -g openclaw`.
# Ensures ~/.openclaw/openclaw.json includes gateway.mode=local so `openclaw gateway run`
# does not require --allow-unconfigured (OpenClaw 2026.4.x exits CONFIG otherwise).
set -euo pipefail

if ! command -v openclaw >/dev/null 2>&1; then
  echo "ensure-openclaw-gateway-config: openclaw not on PATH" >&2
  exit 1
fi

install -d -m 700 "${HOME}/.openclaw"
openclaw config set gateway.mode local
