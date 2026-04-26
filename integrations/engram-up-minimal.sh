#!/usr/bin/env bash
# Bring up only db + redis + app (skip Prometheus, Grafana, frontend playground).
# Faster on macOS Docker Desktop and avoids npm builds for the playground image.
#
# If `docker compose` hangs for many minutes: Docker Desktop’s API is often wedged.
# Fix: restart Docker Desktop (whale menu → Restart), wait until `docker info` works, then re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${ROOT}/.." && pwd)"
TARGET="${ROOT}/engram_translator"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export BUILDKIT_PROGRESS=plain

if [[ ! -d "${TARGET}/.git" ]]; then
  echo "[engram-up-minimal] Run: npm run setup:engram   (clone + overrides) first."
  exit 1
fi

echo "[engram-up-minimal] Waiting for Docker daemon (docker info)..."
docker_ok=0
for i in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then
    docker_ok=1
    break
  fi
  sleep 2
done
if [[ "$docker_ok" -ne 1 ]]; then
  echo "[engram-up-minimal] ERROR: Docker daemon not responding. Open Docker Desktop, wait until it is idle, then:"
  echo "  docker run --rm hello-world"
  echo "  npm run setup:engram:minimal"
  echo "[engram-up-minimal] Last docker error:"
  docker info 2>&1 | tail -3 || true
  exit 1
fi

echo "[engram-up-minimal] Applying overrides..."
( cd "${REPO_ROOT}" && bash ./integrations/setup-engram.sh </dev/null )

echo "[engram-up-minimal] Starting db, redis, app only..."
( cd "${TARGET}" && docker compose up -d --build db redis app )

echo "[engram-up-minimal] Waiting for Postgres..."
for i in $(seq 1 60); do
  if ( cd "${TARGET}" && docker compose exec -T db pg_isready -U admin 2>/dev/null ); then
    echo "[engram-up-minimal] Postgres ready."
    break
  fi
  sleep 2
  if [[ "$i" -eq 60 ]]; then
    echo "[engram-up-minimal] ERROR: Postgres not ready. docker compose logs db"
    exit 1
  fi
done

echo "[engram-up-minimal] Waiting for HTTP 200 on http://127.0.0.1:8000/ ..."
for i in $(seq 1 90); do
  if curl -sf --max-time 3 http://127.0.0.1:8000/ >/dev/null; then
    echo "[engram-up-minimal] API OK."
    curl -sf -o /dev/null -w "GET / -> %{http_code}\n" http://127.0.0.1:8000/
    exit 0
  fi
  sleep 2
done

echo "[engram-up-minimal] ERROR: API not responding. Try: cd ${TARGET} && docker compose logs app --tail 80"
exit 1
