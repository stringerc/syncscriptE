#!/usr/bin/env bash
# Update Vercel Production KOKORO_TTS_URL to a new Kokoro base (no trailing slash, no /v1 path).
# Requires: vercel CLI logged in (or VERCEL_TOKEN), run from machine with linked syncscript project.
set -euo pipefail
URL="${1:?Usage: $0 https://kokoro.example.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"
vercel env rm KOKORO_TTS_URL production --yes 2>/dev/null || true
printf '%s' "$URL" | vercel env add KOKORO_TTS_URL production
echo "Set KOKORO_TTS_URL=$URL (production). Redeploy Vercel if functions do not pick up env immediately."
