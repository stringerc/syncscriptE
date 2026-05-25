#!/usr/bin/env bash
# dream-state-audit.sh — Nightly file audit + staleness detection
# Run via LaunchAgent or cron. Reports reclaimable space and stale projects.
# This is the REAL Dream State: practical file coherence checking.

set -euo pipefail

HOME_DIR="${1:-$HOME}"
REPORT_FILE="$HOME_DIR/.dream-state-report.json"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Dream State audit starting..."

# Initialize report
cat > "$REPORT_FILE" << 'REPORTHEAD'
{
  "auditedAt": "TIMESTAMP",
  "reclaimable": {
    "nodeModules": [],
    "buildArtifacts": [],
    "staleProjects": [],
    "largeFiles": [],
    "downloadsOlderThan30Days": []
  },
  "staleMemoryRefs": [],
  "summary": { "totalReclaimableGB": 0, "staleProjectCount": 0, "staleRefsCount": 0 }
}
REPORTHEAD

sed -i '' "s/TIMESTAMP/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" "$REPORT_FILE"

TOTAL_RECLAIMABLE=0
STALE_COUNT=0

# 1. Find stale node_modules (projects not touched in 30+ days)
NODE_MODULES_ITEMS=""
for nm in $(find "$HOME_DIR" -maxdepth 4 -name "node_modules" -type d 2>/dev/null | head -30); do
  project_dir=$(dirname "$nm")
  last_modified=$(stat -f "%m" "$project_dir" 2>/dev/null || echo 0)
  now=$(date +%s)
  age_days=$(( (now - last_modified) / 86400 ))
  if [ "$age_days" -gt 30 ]; then
    size=$(du -sh "$nm" 2>/dev/null | cut -f1 || echo "0B")
    echo "  [STALE node_modules] $nm — ${size} (unused ${age_days}d)"
    STALE_COUNT=$((STALE_COUNT + 1))
  fi
done

# 2. Find stale build artifacts (dist/, build/, .next/ older than 7 days)
for artifact in $(find "$HOME_DIR" -maxdepth 4 \( -name "dist" -o -name "build" -o -name ".next" \) -type d 2>/dev/null | head -20); do
  last_modified=$(stat -f "%m" "$artifact" 2>/dev/null || echo 0)
  now=$(date +%s)
  age_days=$(( (now - last_modified) / 86400 ))
  if [ "$age_days" -gt 7 ]; then
    size=$(du -sh "$artifact" 2>/dev/null | cut -f1 || echo "0B")
    echo "  [STALE build] $artifact — ${size} (unused ${age_days}d)"
  fi
done

# 3. Check Downloads for files older than 30 days
DL_COUNT=0
if [ -d "$HOME_DIR/Downloads" ]; then
  DL_COUNT=$(find "$HOME_DIR/Downloads" -maxdepth 1 -type f -mtime +30 2>/dev/null | wc -l | tr -d ' ')
  if [ "$DL_COUNT" -gt 0 ]; then
    DL_SIZE=$(du -sh "$HOME_DIR/Downloads" 2>/dev/null | cut -f1 || echo "0B")
    echo "  [DOWNLOADS] $DL_COUNT files older than 30 days — ${DL_SIZE} total"
  fi
fi

# 4. Check disk free space
FREE_GB=$(df -g / | tail -1 | awk '{print $4}')
echo "  [DISK] ${FREE_GB} GB free on /"

if [ "$FREE_GB" -lt 15 ]; then
  echo "  [WARNING] Disk space below 15GB — cleanup recommended"
fi

# 5. Check Xcode DerivedData
DD_SIZE="0B"
if [ -d "$HOME_DIR/Library/Developer/Xcode/DerivedData" ]; then
  DD_SIZE=$(du -sh "$HOME_DIR/Library/Developer/Xcode/DerivedData" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [XCODE] DerivedData: ${DD_SIZE}"
fi

# 6. Check Cursor snapshots
CURSOR_SIZE="0B"
if [ -d "$HOME_DIR/Library/Application Support/Cursor/snapshots" ]; then
  CURSOR_SIZE=$(du -sh "$HOME_DIR/Library/Application Support/Cursor/snapshots" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [CURSOR] Snapshots: ${CURSOR_SIZE}"
fi

# 7. Verify key project directories exist
for project in syncscript lawbot; do
  if [ -d "$HOME_DIR/$project" ]; then
    echo "  [PROJECT] $HOME_DIR/$project — exists"
  else
    echo "  [PROJECT] $HOME_DIR/$project — MISSING"
  fi
done

# 8. Check MEMORY.md references (verify paths mentioned still exist)
if [ -f "$HOME_DIR/syncscript/MEMORY.md" ]; then
  echo "  [MEMORY] syncscript/MEMORY.md exists — checking file references..."
  # Extract file paths from MEMORY.md and verify they exist
  for ref in $(grep -oE 'src/[a-zA-Z0-9_/.-]+\.(tsx?|css|mjs)' "$HOME_DIR/syncscript/MEMORY.md" 2>/dev/null | sort -u | head -20); do
    if [ ! -f "$HOME_DIR/syncscript/$ref" ]; then
      echo "  [STALE REF] syncscript/$ref — file does not exist"
    fi
  done
fi

echo ""
echo "=== Dream State Audit Complete ==="
echo "Disk: ${FREE_GB}GB free | Stale items: ${STALE_COUNT} | Downloads >30d: ${DL_COUNT}"
