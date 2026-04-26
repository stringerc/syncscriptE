#!/usr/bin/env bash
# One-shot: Telegram with accurate Still running (pgrep retry-launch-a1.sh) + log attempt count.
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

if pgrep -f "retry-launch-a1[.]sh" >/dev/null 2>&1; then
  RUNNING="yes"
else
  RUNNING="no"
fi

FAILED=0
[[ -f "$LOG" ]] && FAILED=$(grep -c '^--> Trying AD:' "$LOG" 2>/dev/null || true)

HK="$(date +%Y%m%d%H)"
MSG=$'OCI A1 retry — status check\n'"Local hour: ${HK}"$'\n'"Total failed launch attempts (from log): ${FAILED}"$'\n'"Still running: ${RUNNING}"

curl -fsS -m 45 -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=${MSG}" >/dev/null

echo "OK — sent (still running: ${RUNNING})"
