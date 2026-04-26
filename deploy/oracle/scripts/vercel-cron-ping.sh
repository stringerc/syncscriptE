#!/usr/bin/env bash
# Free operational pings: run from Oracle VM cron (or any host) to trigger Vercel /api/cron/* routes.
# Uses CRON_SECRET the same way Vercel Cron does (Bearer token).
#
# Setup on the VM:
#   sudo install -m 755 deploy/oracle/scripts/vercel-cron-ping.sh /usr/local/bin/vercel-cron-ping
#   sudo nano /etc/syncscript/cron.env   # CRON_SECRET=...  APP_BASE_URL=https://www.syncscript.app
#   chmod 600 /etc/syncscript/cron.env
#
# Crontab example (every 15 minutes — phone-dispatch + light coverage):
#   */15 * * * * . /etc/syncscript/cron.env; /usr/local/bin/vercel-cron-ping phone-dispatch >>/var/log/syncscript-cron.log 2>&1
#
# Daily jobs can stay on Vercel only; use this for sub-daily triggers without Vercel Pro.

set -euo pipefail

APP_BASE_URL="${APP_BASE_URL:-https://www.syncscript.app}"
APP_BASE_URL="${APP_BASE_URL%/}"

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "vercel-cron-ping: set CRON_SECRET (same value as Vercel env)" >&2
  exit 1
fi

JOB="${1:-}"
if [[ -z "$JOB" ]]; then
  echo "Usage: $0 <job>" >&2
  echo "  job = phone-dispatch | tts-slo | wake-up | guest-cleanup | process-emails | invoice-overdue | market-benchmarks" >&2
  exit 1
fi

URL="${APP_BASE_URL}/api/cron/${JOB}"
code=$(curl -sS -o /tmp/vercel-cron-ping.json -w '%{http_code}' \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Accept: application/json" \
  "$URL")

echo "GET $URL -> HTTP $code"
cat /tmp/vercel-cron-ping.json
echo ""

if [[ "$code" != "200" ]]; then
  exit 1
fi
