#!/usr/bin/env bash
# Update Vercel KOKORO_TTS_URL to a new Kokoro base (no trailing slash, no /v1 path).
# Requires: vercel CLI logged in (or VERCEL_TOKEN), run from machine with linked syncscript project.
#
# Usage:
#   ./update-vercel-kokoro-url.sh https://kokoro.example.com
#   ./update-vercel-kokoro-url.sh https://kokoro.example.com --all-environments
set -euo pipefail
ALL=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all-environments) ALL=true; shift ;;
    *) break ;;
  esac
done
URL="${1:?Usage: $0 [--all-environments] https://kokoro.example.com}"
URL="${URL%/}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"
if $ALL; then
  ENVS=(production preview development)
else
  ENVS=(production)
fi
for e in "${ENVS[@]}"; do
  # --force overwrites in place (avoids rm/add races; stdin is only the value once per invocation)
  printf '%s' "$URL" | vercel env add KOKORO_TTS_URL "$e" --force
  echo "Set KOKORO_TTS_URL=$URL ($e)"
done
echo "Done. Redeploy Vercel if serverless functions do not pick up env immediately (e.g. vercel deploy --prod --yes)."
