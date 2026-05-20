#!/usr/bin/env bash
# Read-only audit: ClawHub search + optional inspect + optional MCP registry sample.
# Does NOT install skills. Requires network for live runs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT/reports/skill-audit}"
LIMIT="${LIMIT:-10}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="$OUT_DIR/audit-$STAMP.txt"

mkdir -p "$OUT_DIR"

if command -v clawhub >/dev/null 2>&1; then
  CLAWHUB=(clawhub)
elif command -v npx >/dev/null 2>&1; then
  CLAWHUB=(npx --yes clawhub@latest)
else
  echo "error: need clawhub in PATH or npx" >&2
  exit 1
fi

# Query list: SKILL_AUDIT_QUERIES overrides; else SKILL_AUDIT_QUERY_FILE (one phrase per line, # comments);
# else default file scripts/skill-audit-queries-syncscript.txt if present; else compact default.
QUERIES_DEFAULT="github browser security postgres voice cursor mcp slack observability deploy"
QUERY_FILE="${SKILL_AUDIT_QUERY_FILE:-}"
if [[ -n "${SKILL_AUDIT_QUERIES:-}" ]]; then
  QUERIES="$SKILL_AUDIT_QUERIES"
elif [[ -n "$QUERY_FILE" && -f "$ROOT/$QUERY_FILE" ]]; then
  QUERIES="$(grep -v '^#' "$ROOT/$QUERY_FILE" | grep -v '^$' | tr '\n' ' ')"
elif [[ -f "$ROOT/scripts/skill-audit-queries-syncscript.txt" ]]; then
  QUERIES="$(grep -v '^#' "$ROOT/scripts/skill-audit-queries-syncscript.txt" | grep -v '^$' | tr '\n' ' ')"
else
  QUERIES="$QUERIES_DEFAULT"
fi

# Comma-separated slugs for inspect --files (Security: line visible)
INSPECT_SLUGS="${SKILL_AUDIT_INSPECT_SLUGS:-skill-creator,openclaw-github-assistant}"

{
  echo "skill-source-audit generated UTC $STAMP"
  echo "repo: $ROOT"
  echo "clawhub: ${CLAWHUB[*]}"
  echo "queries: $QUERIES"
  echo ""

  echo "=== ClawHub search (read-only) ==="
  for q in $QUERIES; do
    echo ""
    echo "--- search: $q (limit $LIMIT) ---"
    "${CLAWHUB[@]}" search "$q" --limit "$LIMIT" 2>&1 || echo "(search failed for $q)"
  done

  echo ""
  echo "=== ClawHub inspect --files (read-only; check Security: line) ==="
  IFS=',' read -ra SLUGS <<< "$INSPECT_SLUGS"
  for s in "${SLUGS[@]}"; do
    s="$(echo "$s" | xargs)"
    [[ -z "$s" ]] && continue
    echo ""
    echo "--- inspect --files: $s ---"
    "${CLAWHUB[@]}" inspect "$s" --files 2>&1 || echo "(inspect failed for $s)"
  done

  echo ""
  echo "=== Official MCP registry (first page sample, HTTPS) ==="
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "${MCP_REGISTRY_URL:-https://registry.modelcontextprotocol.io/v0/servers?limit=5}" 2>&1 \
      | head -c 8000 || echo "(curl registry failed)"
    echo ""
  else
    echo "(curl not found; skip MCP registry sample)"
  fi

  echo ""
  echo "=== Done ==="
  echo "Report: $REPORT"
} | tee "$REPORT"

echo "Wrote $REPORT"
