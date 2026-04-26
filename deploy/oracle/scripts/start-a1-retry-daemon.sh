#!/usr/bin/env bash
# One-shot: write ~/.oci/config, verify API access, start A1 retry loop in background with logging.
#
# Prerequisites:
#   deploy/oracle/env.local — real OCI_USER_OCID, OCI_TENANCY_OCID, OCI_FINGERPRINT, OCI_KEY_FILE (no REPLACE_*)
#   deploy/oracle/instance-launch.env — complete (subnet, ADs, image, Telegram optional)
#
# Usage (repo root):
#   bash deploy/oracle/scripts/start-a1-retry-daemon.sh
#
# Log: /tmp/oracle-a1-retry.log  |  Stop: pkill -f retry-launch-a1.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$REPO_ROOT"

ORACLE_DIR="$REPO_ROOT/deploy/oracle"
LOG="${ORACLE_A1_RETRY_LOG:-/tmp/oracle-a1-retry.log}"

if pgrep -f "retry-launch-a1[.]sh" >/dev/null 2>&1; then
  echo "A retry loop may already be running (retry-launch-a1.sh). Check: pgrep -af retry-launch" >&2
  echo "Stop with: pkill -f retry-launch-a1.sh" >&2
  exit 1
fi
LOCK="${ORACLE_A1_RETRY_LOCK:-/tmp/oracle-a1-retry.lock}"
LOCKDIR="${ORACLE_A1_RETRY_LOCK_DIR:-${LOCK}.d}"
if [[ -z "${ORACLE_A1_RETRY_SKIP_LOCK:-}" ]]; then
  if ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "Lock dir exists ($LOCKDIR) — retry running or stale. Stop: pkill -f retry-launch-a1.sh  or  rmdir $LOCKDIR" >&2
    exit 1
  fi
  # Child inherits cleanup via trap in retry-launch-a1.sh; if nohup fails, release:
  trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT
fi

bash "$ORACLE_DIR/scripts/generate-oci-config.sh"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! oci os ns get >/dev/null; then
  echo "oci os ns get failed — fix ~/.oci/config and API key permissions (chmod 600 on PEM)." >&2
  exit 1
fi

echo "Starting A1 retry in background → $LOG"
nohup env ORACLE_A1_RETRY_LOCK_INHERITED=1 \
  ORACLE_A1_RETRY_LOCK="$LOCK" \
  ORACLE_A1_RETRY_LOCK_DIR="$LOCKDIR" \
  npm run oracle:retry-a1-launch >>"$LOG" 2>&1 &
echo $! > /tmp/oracle-a1-retry.pid
trap - EXIT
echo "PID $(cat /tmp/oracle-a1-retry.pid) — tail -f $LOG"
