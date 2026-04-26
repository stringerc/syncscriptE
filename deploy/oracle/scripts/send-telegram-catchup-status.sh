#!/usr/bin/env bash
# One-shot: send hourly-heartbeat-style Telegram with counts from /tmp/oracle-a1-retry.log + instance-launch.env
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORACLE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVF="${ORACLE_DIR}/instance-launch.env"
LOG="${ORACLE_A1_RETRY_LOG:-/tmp/oracle-a1-retry.log}"

set -a
# shellcheck disable=SC1090
source "$ENVF"
set +a

[[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || { echo "Set TELEGRAM_* in instance-launch.env" >&2; exit 1; }

read -r -a AD_ARRAY <<<"${AVAILABILITY_DOMAINS:-}"
NADS=${#AD_ARRAY[@]}

FAILED=0
if [[ -f "$LOG" ]]; then
  FAILED=$(grep -c '^--> Trying AD:' "$LOG" 2>/dev/null || true)
fi
LAST_CY="?"
if [[ -f "$LOG" ]]; then
  LAST_CY="$(grep -oE '^=== Cycle [0-9]+' "$LOG" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "?")"
fi

HK="$(date +%Y%m%d%H)"
if pgrep -f "retry-launch-a1[.]sh" >/dev/null 2>&1; then
  RUNNING="yes"
else
  RUNNING="no — restart: bash deploy/oracle/scripts/start-a1-retry-daemon.sh"
fi
MSG=$'OCI A1 retry — hourly heartbeat (catch-up from log)\n'"Local hour: ${HK}"$'\n'"Total failed launch attempts: ${FAILED}"$'\n'"Current cycle (last in log): ${LAST_CY}"$'\n'"ADs per cycle: ${NADS}"$'\n'"Still running: ${RUNNING}"

curl -fsS -m 45 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${MSG}" >/dev/null

echo "OK — sent (failed attempts from log: ${FAILED})"
