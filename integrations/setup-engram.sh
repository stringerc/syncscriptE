#!/usr/bin/env bash
# Clone Engram (if needed), apply SyncScript overrides (same as CI), print next steps.
# Usage:
#   ./integrations/setup-engram.sh           # clone + apply overrides only
#   ENGRAM_UP=1 ./integrations/setup-engram.sh   # also: docker compose up -d db redis, wait, app
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${ROOT}/.." && pwd)"
TARGET="${ROOT}/engram_translator"
REPO="${ENGRAM_REPO_URL:-https://github.com/kwstx/engram_translator.git}"
OV="${ROOT}/engram-overrides"

apply_overrides() {
  echo "[setup-engram] Applying overrides from ${OV}"
  cp -f "${OV}/app-main.py" "${TARGET}/app/main.py"
  cp -f "${OV}/dot-env.ci" "${TARGET}/.env"
  cp -f "${OV}/docker-compose.override.yml" "${TARGET}/docker-compose.override.yml"
  # Upstream .dockerignore had `*.txt`, which excluded requirements.txt and broke the image build.
  cp -f "${OV}/dot-dockerignore" "${TARGET}/.dockerignore"
  cp -f "${OV}/requirements.txt" "${TARGET}/requirements.txt"
  # SQLAlchemy 2.x: reserved Declarative attribute name `metadata` on ToolExecutionMetadata
  cp -f "${OV}/app/db/models.py" "${TARGET}/app/db/models.py"
  cp -f "${OV}/app/services/registry_service.py" "${TARGET}/app/services/registry_service.py"
  cp -f "${OV}/app/services/discovery.py" "${TARGET}/app/services/discovery.py"
  cp -f "${OV}/app/api/v1/registry.py" "${TARGET}/app/api/v1/registry.py"
  cp -f "${OV}/app/api/v1/endpoints.py" "${TARGET}/app/api/v1/endpoints.py"
  cp -f "${OV}/app/core/exceptions.py" "${TARGET}/app/core/exceptions.py"
  mkdir -p "${TARGET}/alembic/versions"
  cp -f "${OV}/alembic/versions/75c7e2369caa_initial_baseline.py" "${TARGET}/alembic/versions/75c7e2369caa_initial_baseline.py"
  cp -f "${OV}/alembic/versions/b2c3d4e5f6a7_agent_registry_model_parity.py" "${TARGET}/alembic/versions/b2c3d4e5f6a7_agent_registry_model_parity.py"
}

if [[ ! -d "${TARGET}/.git" ]]; then
  echo "[setup-engram] Cloning ${REPO} -> ${TARGET}"
  git clone --depth 1 "${REPO}" "${TARGET}"
else
  echo "[setup-engram] Using existing clone at ${TARGET}"
fi

apply_overrides

if [[ "${ENGRAM_UP:-}" == "1" ]]; then
  echo "[setup-engram] Starting Docker stack (db, redis, app)..."
  (cd "${TARGET}" && docker compose up -d --build db redis)
  echo "[setup-engram] Waiting for Postgres..."
  for i in $(seq 1 45); do
    if (cd "${TARGET}" && docker compose exec -T db pg_isready -U admin 2>/dev/null); then
      echo "[setup-engram] Postgres ready."
      break
    fi
    sleep 2
    if [[ "$i" -eq 45 ]]; then
      echo "[setup-engram] ERROR: Postgres not ready. Run: cd ${TARGET} && docker compose logs db"
      exit 1
    fi
  done
  (cd "${TARGET}" && docker compose up -d --build app)
  echo "[setup-engram] Waiting for API on :8000..."
  for i in $(seq 1 60); do
    if curl -sf http://127.0.0.1:8000/ >/dev/null; then
      echo "[setup-engram] API is up."
      break
    fi
    sleep 2
    if [[ "$i" -eq 60 ]]; then
      echo "[setup-engram] ERROR: API not responding. Run: cd ${TARGET} && docker compose logs app"
      exit 1
    fi
  done
  echo "[setup-engram] Running verify script..."
  (cd "${REPO_ROOT}" && bash ./integrations/verify-engram-docs.sh http://127.0.0.1:8000)
fi

echo ""
echo "Done. Next:"
echo "  cd ${TARGET}"
echo "  docker compose up --build -d db redis   # if not already running"
echo "  sleep 15 && docker compose up --build -d app"
echo "  cd ${REPO_ROOT} && npm run verify:engram"
echo "  open http://localhost:8000/docs"
echo ""
echo "Or one shot (requires Docker running): npm run setup:engram:up"
echo "See also: integrations/ENGRAM_OPENCLAW.md"
