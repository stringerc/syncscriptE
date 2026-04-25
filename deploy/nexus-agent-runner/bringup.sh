#!/usr/bin/env bash
#
# Nexus Agent Runner — one-shot bring-up on Oracle Cloud (or any Linux box).
# Idempotent: re-running this pulls the latest image, replaces the container,
# and prints a health probe. Safe to schedule via cron for auto-update.
#
# Usage:
#   1. SSH to the Oracle VM:           ssh ubuntu@<oracle-ip>
#   2. Drop the env file once:         sudo mkdir -p /opt/nexus-agent-runner
#                                      sudo nano /opt/nexus-agent-runner/.env   # paste from env.example, fill values
#   3. First-time install + run:       curl -fsSL https://raw.githubusercontent.com/stringerc/syncscriptE/main/deploy/nexus-agent-runner/bringup.sh | bash
#   4. Future updates:                 sudo /opt/nexus-agent-runner/bringup.sh
#
# Or copy this file once and run it locally on the VM. The script self-installs
# to /opt/nexus-agent-runner/bringup.sh on first run.

set -euo pipefail

IMAGE="ghcr.io/stringerc/syncscript-nexus-agent-runner:latest"
NAME="nexus-agent-runner"
PORT="${AGENT_RUNNER_PORT:-18790}"
INSTALL_DIR="/opt/nexus-agent-runner"
ENV_FILE="${INSTALL_DIR}/.env"

log()  { printf '\033[1;36m[bringup]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[bringup]\033[0m %s\n' "$*" >&2; }
fail() { printf '\033[1;31m[bringup]\033[0m %s\n' "$*" >&2; exit 1; }

# ── 1. Sanity ────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || fail "docker not found — install Docker first (https://docs.docker.com/engine/install/ubuntu/)"

# Allow rootless docker too: only use sudo if we're not in the docker group.
SUDO=""
if ! docker info >/dev/null 2>&1; then
  if groups | grep -q docker; then
    fail "docker daemon not reachable; check 'sudo systemctl status docker'"
  fi
  SUDO="sudo"
  $SUDO docker info >/dev/null 2>&1 || fail "docker daemon not reachable even with sudo"
fi

# ── 2. Self-install the script to /opt so future updates are one-line ─
$SUDO mkdir -p "$INSTALL_DIR"
SOURCE_URL="https://raw.githubusercontent.com/stringerc/syncscriptE/main/deploy/nexus-agent-runner/bringup.sh"
if [[ -f "$0" && "$0" != "bash" && "$0" != "/bin/bash" ]] && { [[ ! -f "$INSTALL_DIR/bringup.sh" ]] || ! cmp -s "$0" "$INSTALL_DIR/bringup.sh"; }; then
  log "installing bringup.sh from local file to $INSTALL_DIR/bringup.sh"
  $SUDO cp "$0" "$INSTALL_DIR/bringup.sh"
  $SUDO chmod +x "$INSTALL_DIR/bringup.sh"
elif [[ ! -f "$0" || "$0" == "bash" || "$0" == "/bin/bash" ]] && [[ ! -f "$INSTALL_DIR/bringup.sh" ]]; then
  log "downloading bringup.sh from $SOURCE_URL to $INSTALL_DIR/bringup.sh"
  $SUDO curl -fsSL "$SOURCE_URL" -o "$INSTALL_DIR/bringup.sh"
  $SUDO chmod +x "$INSTALL_DIR/bringup.sh"
fi

# ── 3. Verify env file ───────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  fail "env file not found at $ENV_FILE — copy env.example and fill values, then re-run"
fi

REQUIRED=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NVIDIA_API_KEY NEXUS_PHONE_EDGE_SECRET AGENT_RUNNER_TOKEN)
MISSING=()
for var in "${REQUIRED[@]}"; do
  if ! grep -qE "^${var}=.+" "$ENV_FILE"; then
    MISSING+=("$var")
  fi
done
if (( ${#MISSING[@]} > 0 )); then
  fail "$ENV_FILE missing required keys: ${MISSING[*]}"
fi

# ── 4. Pull the latest image (auto-built by GitHub Actions on push to main) ─
log "pulling $IMAGE"
$SUDO docker pull "$IMAGE"

# ── 5. Replace the running container ─────────────────────────────────
if $SUDO docker ps -a --format '{{.Names}}' | grep -q "^${NAME}\$"; then
  log "stopping existing container"
  $SUDO docker stop "$NAME" >/dev/null || true
  $SUDO docker rm "$NAME" >/dev/null || true
fi

log "starting container on :${PORT}"
$SUDO docker run -d \
  --name "$NAME" \
  --restart=unless-stopped \
  --shm-size=2g \
  -p "${PORT}:18790" \
  --env-file "$ENV_FILE" \
  --health-cmd "wget -q -O- http://localhost:18790/v1/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-start-period=15s \
  --health-retries=3 \
  "$IMAGE" >/dev/null

# ── 6. Health check ──────────────────────────────────────────────────
log "waiting for health probe…"
for i in $(seq 1 20); do
  sleep 1.5
  if curl -fsS "http://127.0.0.1:${PORT}/v1/health" >/dev/null 2>&1; then
    log "health OK after $((i + 1))s"
    curl -s "http://127.0.0.1:${PORT}/v1/health" | sed 's/^/  /'
    echo
    log "container is up. logs: docker logs -f $NAME"
    log "next: ensure Cloudflare Tunnel ingress maps nexus-agent-runner.syncscript.app → http://localhost:${PORT}"
    log "and that Vercel envs AGENT_RUNNER_BASE_URL + AGENT_RUNNER_TOKEN are set."
    exit 0
  fi
done

warn "health probe didn't respond in 30s — last 40 log lines:"
$SUDO docker logs --tail 40 "$NAME" >&2 || true
fail "agent runner failed to come up cleanly"
