#!/usr/bin/env bash
#
# Retry oci compute instance launch for VM.Standard.A1.Flex when Oracle returns "Out of capacity".
# Run on your Mac with ~/.oci/config valid (see deploy/oracle/QUICKSTART.md).
#
# Note: OCI often returns HTTP 500 + "code": "InternalError" with "message": "Out of host capacity."
# — that is still capacity exhaustion, not a subnet/shape misconfiguration. The script treats it as retryable.
#
# Availability domains: tries each AD in AVAILABILITY_DOMAINS **in order, one after another** each cycle
# (not parallel). If all fail capacity, sleeps RETRY_INTERVAL_SEC and repeats.
#
# SAFETY:
#   - Uses only variables in instance-launch.env — review before running.
#   - Prefer a PAYG account with budget alerts if you keep retrying for days.
#   - Ctrl+C stops the loop; it does not delete partially created resources (usually none on failure).
#   - Optional TELEGRAM_* sends your bot token to api.telegram.org — keep instance-launch.env private.
#   - With TELEGRAM_* set, optional hourly DM (local clock hour): total failed attempts + cycle (TELEGRAM_HOURLY_STATUS=0 to disable).
#
# Usage:
#   cp deploy/oracle/instance-launch.env.example deploy/oracle/instance-launch.env
#   nano deploy/oracle/instance-launch.env
#   bash deploy/oracle/scripts/retry-launch-a1.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORACLE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVF="${ORACLE_DIR}/instance-launch.env"

if [[ ! -f "$ENVF" ]]; then
  echo "Missing $ENVF — copy instance-launch.env.example and fill OCIDs, ADs, image, subnet." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENVF"
set +a

for v in COMPARTMENT_OCID SUBNET_OCID IMAGE_OCID AVAILABILITY_DOMAINS DISPLAY_NAME SSH_PUBLIC_KEY_FILE SHAPE_CONFIG_JSON; do
  if [[ -z "${!v:-}" || "${!v}" == *REPLACE* ]]; then
    echo "Set $v in instance-launch.env (no placeholders)." >&2
    exit 1
  fi
done

if [[ ! -f "$SSH_PUBLIC_KEY_FILE" ]]; then
  echo "SSH_PUBLIC_KEY_FILE not found: $SSH_PUBLIC_KEY_FILE" >&2
  exit 1
fi

command -v oci >/dev/null 2>&1 || { echo "Install: brew install oci-cli" >&2; exit 1; }

# Single running loop (mkdir lock; stale after kill -9: rmdir …lock.d).
# ORACLE_A1_RETRY_SKIP_LOCK=1 — no lock (testing). ORACLE_A1_RETRY_LOCK_INHERITED=1 — daemon reserved LOCKDIR; we only trap cleanup.
LOCK="${ORACLE_A1_RETRY_LOCK:-/tmp/oracle-a1-retry.lock}"
LOCKDIR="${ORACLE_A1_RETRY_LOCK_DIR:-${LOCK}.d}"
if [[ -z "${ORACLE_A1_RETRY_SKIP_LOCK:-}" ]]; then
  if [[ -n "${ORACLE_A1_RETRY_LOCK_INHERITED:-}" ]]; then
    if [[ ! -d "$LOCKDIR" ]]; then
      echo "Lock dir missing ($LOCKDIR) — start via start-a1-retry-daemon.sh or create lock first." >&2
      exit 1
    fi
  elif ! mkdir "$LOCKDIR" 2>/dev/null; then
    echo "Another retry-launch-a1.sh may be running (lock: $LOCKDIR). Stop: pkill -f retry-launch-a1.sh  or  rmdir $LOCKDIR" >&2
    exit 1
  fi
  trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT INT TERM
fi

# Optional: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in instance-launch.env
notify_telegram() {
  local text="$1"
  [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || return 0
  command -v curl >/dev/null 2>&1 || { echo "Telegram: install curl or unset TELEGRAM_*" >&2; return 0; }
  local url="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
  if ! curl -fsS -m 45 -X POST "$url" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${text}" >/dev/null; then
    echo "Telegram send failed $(date -Iseconds) — check bot token, chat id, network; failures appended to /tmp/oracle-a1-telegram-failures.log" >&2
    echo "$(date -Iseconds) sendMessage failed (message length ${#text})" >>/tmp/oracle-a1-telegram-failures.log
  fi
}

extract_instance_ocid() {
  local json="$1" id=""
  if command -v jq >/dev/null 2>&1; then
    id="$(echo "$json" | jq -r '.data.id // empty' 2>/dev/null || true)"
    [[ -n "$id" && "$id" != null ]] && { echo "$id"; return 0; }
  fi
  echo "$json" | grep -oE 'ocid1\.instance\.[^"[:space:]]+' | head -1
}

# True if failure is host/capacity related (including InternalError + Out of host capacity).
is_capacity_like_error() {
  local out="$1"
  echo "$out" | grep -qiE 'out of (host )?capacity|insufficient.*capacity|OutOfCapacity|no capacity' && return 0
  return 1
}

# One-line summary for logs (avoids dumping raw JSON tails that look like "mystery 500").
log_oci_launch_failure() {
  local out="$1"
  local msg code http
  msg="$(echo "$out" | sed -n 's/.*"message"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  code="$(echo "$out" | sed -n 's/.*"code"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  http="$(echo "$out" | sed -n 's/.*"status"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1)"
  if [[ -n "$msg" ]]; then
    echo "    OCI launch failed: code=${code:-?} status=${http:-?} — $msg"
  else
    echo "$out" | tail -8
  fi
}

RETRY_INTERVAL_SEC="${RETRY_INTERVAL_SEC:-300}"
MAX_CYCLES="${MAX_CYCLES:-0}"

read -r -a AD_ARRAY <<<"$AVAILABILITY_DOMAINS"
if [[ ${#AD_ARRAY[@]} -eq 0 ]]; then
  echo "AVAILABILITY_DOMAINS must list at least one availability domain." >&2
  exit 1
fi

FAILED_ATTEMPT_COUNT=0
# Local-time hour bucket (YYYYMMDD + hour). Empty until first send — do NOT seed with $(date +%Y%m%d%H):
# if we did, starting the daemon *during* hour 11 would skip all heartbeats until hour 12.
LAST_HOURLY_SENT_KEY=""

maybe_telegram_hourly_status() {
  [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || return 0
  [[ "${TELEGRAM_HOURLY_STATUS:-1}" != "0" ]] || return 0
  local hk
  hk="$(date +%Y%m%d%H)"
  if [[ -n "$LAST_HOURLY_SENT_KEY" && "$hk" == "$LAST_HOURLY_SENT_KEY" ]]; then
    return 0
  fi
  LAST_HOURLY_SENT_KEY="$hk"
  local msg now
  now="$(date -Iseconds 2>/dev/null || date)"
  msg=$'OCI A1 retry — hourly heartbeat\n'"Time: ${now}"$'\n'"Local hour key: ${hk}"$'\n'"Total failed launch attempts: ${FAILED_ATTEMPT_COUNT}"$'\n'"Current cycle: ${cycle}"$'\n'"ADs per cycle: ${#AD_ARRAY[@]}"$'\n'"Still running."
  notify_telegram "$msg"
  echo "Telegram hourly status sent (hour key ${hk}, ${now})."
}

cycle=0
while true; do
  cycle=$((cycle + 1))
  if [[ "$MAX_CYCLES" -gt 0 && "$cycle" -gt "$MAX_CYCLES" ]]; then
    echo "Stopped after $MAX_CYCLES cycles (MAX_CYCLES)."
    exit 1
  fi

  echo "=== Cycle $cycle $(date -Iseconds) ==="
  maybe_telegram_hourly_status

  for ad in "${AD_ARRAY[@]}"; do
    echo "--> Trying AD: $ad"
    set +e
    OUT="$(oci compute instance launch \
      --compartment-id "$COMPARTMENT_OCID" \
      --availability-domain "$ad" \
      --display-name "${DISPLAY_NAME}-${cycle}" \
      --image-id "$IMAGE_OCID" \
      --subnet-id "$SUBNET_OCID" \
      --shape "VM.Standard.A1.Flex" \
      --shape-config "$SHAPE_CONFIG_JSON" \
      --assign-public-ip true \
      --ssh-authorized-keys-file "$SSH_PUBLIC_KEY_FILE" \
      2>&1)"
    RC=$?
    set -e

    if [[ "$RC" -eq 0 ]]; then
      echo "$OUT"
      echo "SUCCESS — instance creating. Watch Console → Compute → Instances for public IP."
      IID="$(extract_instance_ocid "$OUT")"
      MSG=$'OCI A1 launch succeeded\n'"Display: ${DISPLAY_NAME}-${cycle}"$'\n'"AD: ${ad}"$'\n'"Instance: ${IID:-(parse JSON in output above)}"$'\n'"Open Oracle Console → Compute → Instances for public IP."
      notify_telegram "$MSG"
      exit 0
    fi

    FAILED_ATTEMPT_COUNT=$((FAILED_ATTEMPT_COUNT + 1))
    log_oci_launch_failure "$OUT"
    maybe_telegram_hourly_status
    if is_capacity_like_error "$OUT"; then
      echo "    (capacity — retryable) try next AD..."
      continue
    fi

    echo "Non-capacity error — fix IMAGE_OCID, subnet, permissions, or shape-config; exiting." >&2
    echo "$OUT" >&2
    exit 1
  done

  echo "All ADs failed capacity this cycle. Sleeping ${RETRY_INTERVAL_SEC}s..."
  sleep "$RETRY_INTERVAL_SEC"
  maybe_telegram_hourly_status
done
