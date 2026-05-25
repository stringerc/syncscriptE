#!/usr/bin/env bash
# dream-state-audit.sh — Nightly file audit with content-aware relevance
#
# This is the REAL Dream State: practical file coherence checking that
# understands what files MEAN, not just how old they are.
#
# Three-tier classification:
#   SAFE_TO_REMOVE  — regenerable artifacts (node_modules, build dirs, caches)
#   COMPACT         — still relevant but could be compressed (research, old drafts)
#   PROTECTED        — never touch (court filings, evidence, active projects)
#
# Protected directories are NEVER touched, regardless of age.
# Compaction compresses files into .tar.gz archives with a manifest for retrieval.

set -euo pipefail

HOME_DIR="${1:-$HOME}"
REPORT_FILE="$HOME_DIR/.dream-state-report.json"
COMPACT_DIR="$HOME_DIR/.dream-state-archives"
PROTECTED_MARKERS=".dream-protected"  # marker file that says "never touch this tree"

mkdir -p "$COMPACT_DIR"

# ── Protected directories — NEVER delete, compress, or flag as stale ──
# These are defined by: (1) explicit list below, (2) presence of .dream-protected marker,
# (3) any directory containing court case patterns

PROTECTED_DIRS=(
  "$HOME_DIR/Custody"
  "$HOME_DIR/syncscript"
  "$HOME_DIR/lawbot"
  "$HOME_DIR/universal-agent-rules"
)

is_protected() {
  local path="$1"
  # Check explicit protected list
  for p in "${PROTECTED_DIRS[@]}"; do
    if [[ "$path" == "$p"/* ]] || [[ "$path" == "$p" ]]; then
      return 0
    fi
  done
  # Check for .dream-protected marker in any parent
  local dir="$path"
  if [[ -f "$path" ]]; then dir=$(dirname "$path"); fi
  while [[ "$dir" != "/" && "$dir" != "$HOME_DIR" ]]; do
    if [[ -f "$dir/$PROTECTED_MARKERS" ]]; then
      return 0
    fi
    dir=$(dirname "$dir")
  done
  # Check for court-case patterns in the path
  if echo "$path" | grep -qiE 'custody|court|filing|evidence|legal|case_|_v_|docket'; then
    return 0
  fi
  return 1
}

# ── Content relevance check ──
# Scans markdown/text files for patterns that indicate ongoing relevance
is_content_relevant() {
  local file="$1"
  # Only check text files
  local mime
  mime=$(file -b --mime-type "$file" 2>/dev/null || echo "unknown")
  if ! echo "$mime" | grep -qiE 'text|json|markdown|pdf'; then
    return 1  # non-text files: relevance = age only
  fi
  # Check for active-case indicators
  if grep -qiE 'pending|active|ongoing|open case|hearing|trial|motion|unread|TODO|BLOCKED|in.progress' "$file" 2>/dev/null; then
    return 0
  fi
  # Check for recent date references (2025 or 2026 = likely still relevant)
  if grep -qiE '20(25|26)-[0-9]{2}-[0-9]{2}' "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# ── Compaction — compress old but relevant files ──
compact_directory() {
  local source_dir="$1"
  local label="$2"
  local archive_name="${label}_$(date +%Y%m%d).tar.gz"
  local archive_path="$COMPACT_DIR/$archive_name"
  local manifest_path="$COMPACT_DIR/${archive_name}.manifest.txt"

  if [[ -f "$archive_path" ]]; then
    echo "  [COMPACT] Already archived: $archive_name"
    return
  fi

  # Create the compressed archive
  tar -czf "$archive_path" -C "$(dirname "$source_dir")" "$(basename "$source_dir")" 2>/dev/null || {
    echo "  [COMPACT FAILED] $source_dir"
    return
  }

  # Create a retrieval manifest — list of files with sizes so you know what's inside
  echo "Archive: $archive_name" > "$manifest_path"
  echo "Created: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$manifest_path"
  echo "Source: $source_dir" >> "$manifest_path"
  echo "Original size: $(du -sh "$source_dir" 2>/dev/null | cut -f1 || echo 'unknown')" >> "$manifest_path"
  echo "Compressed size: $(du -sh "$archive_path" 2>/dev/null | cut -f1 || echo 'unknown')" >> "$manifest_path"
  echo "" >> "$manifest_path"
  echo "Contents:" >> "$manifest_path"
  tar -tzf "$archive_path" 2>/dev/null | head -100 >> "$manifest_path"

  echo "  [COMPACT] $source_dir -> $archive_path ($label)"
}

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Dream State audit starting..."
echo ""
echo "=== PROTECTED DIRECTORY CHECK ==="
for p in "${PROTECTED_DIRS[@]}"; do
  if [[ -d "$p" ]]; then
    echo "  [PROTECTED] $p"
  else
    echo "  [PROTECTED MISSING] $p"
  fi
done
# Also scan for .dream-protected markers
for marker in $(find "$HOME_DIR" -maxdepth 3 -name "$PROTECTED_MARKERS" 2>/dev/null); do
  echo "  [PROTECTED] $(dirname "$marker") (marked by $PROTECTED_MARKERS)"
done

echo ""
echo "=== SAFE TO REMOVE (regenerable, no content value) ==="

# 1. Stale node_modules — only in non-protected directories
for nm in $(find "$HOME_DIR" -maxdepth 4 -name "node_modules" -type d -not -path "*/Custody/*" -not -path "*/syncscript/*" -not -path "*/lawbot/*" 2>/dev/null | head -30); do
  if is_protected "$nm"; then continue; fi
  project_dir=$(dirname "$nm")
  last_modified=$(stat -f "%m" "$project_dir" 2>/dev/null || echo 0)
  now=$(date +%s)
  age_days=$(( (now - last_modified) / 86400 ))
  if [ "$age_days" -gt 30 ]; then
    size=$(du -sh "$nm" 2>/dev/null | cut -f1 || echo "0B")
    echo "  [REMOVE node_modules] $nm — ${size} (unused ${age_days}d)"
  fi
done

# 2. Stale build artifacts — same protection logic
for artifact in $(find "$HOME_DIR" -maxdepth 4 \( -name "dist" -o -name "build" -o -name ".next" \) -type d 2>/dev/null | head -20); do
  if is_protected "$artifact"; then continue; fi
  last_modified=$(stat -f "%m" "$artifact" 2>/dev/null || echo 0)
  now=$(date +%s)
  age_days=$(( (now - last_modified) / 86400 ))
  if [ "$age_days" -gt 7 ]; then
    size=$(du -sh "$artifact" 2>/dev/null | cut -f1 || echo "0B")
    echo "  [REMOVE build] $artifact — ${size} (stale ${age_days}d)"
  fi
done

# 3. Cache directories
for cache in $(find "$HOME_DIR" -maxdepth 3 \( -name ".cache" -o -name ".terraform" -o -name "__pycache__" \) -type d 2>/dev/null | head -10); do
  if is_protected "$cache"; then continue; fi
  size=$(du -sh "$cache" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [REMOVE cache] $cache — ${size}"
done

echo ""
echo "=== COMPACT CANDIDATES (relevant but could be compressed) ==="

# 4. Old research/draft directories with content — compact, don't delete
for research_dir in $(find "$HOME_DIR" -maxdepth 3 \( -name "research" -o -name "drafts*" -o -name "studies" -o -name "archive" \) -type d 2>/dev/null | head -15); do
  if is_protected "$research_dir"; then continue; fi
  last_modified=$(stat -f "%m" "$research_dir" 2>/dev/null || echo 0)
  now=$(date +%s)
  age_days=$(( (now - last_modified) / 86400 ))
  if [ "$age_days" -gt 60 ]; then
    # Check if content is still relevant
    has_active_content=false
    for f in $(find "$research_dir" -name "*.md" -o -name "*.txt" | head -10); do
      if is_content_relevant "$f"; then
        has_active_content=true
        echo "  [RELEVANT] $f — contains active markers, keeping"
        break
      fi
    done
    size=$(du -sh "$research_dir" 2>/dev/null | cut -f1 || echo "0B")
    if $has_active_content; then
      echo "  [COMPACT RELEVANT] $research_dir — ${size} (active content, suggest compressed archive)"
    else
      echo "  [COMPACT STALE] $research_dir — ${size} (unused ${age_days}d, safe to compress)"
    fi
  fi
done

# 5. Downloads — check for relevance before flagging
DL_RELEVANT=0
DL_STALE=0
if [ -d "$HOME_DIR/Downloads" ]; then
  while IFS= read -r file; do
    if is_protected "$file"; then
      DL_RELEVANT=$((DL_RELEVANT + 1))
    elif is_content_relevant "$file"; then
      DL_RELEVANT=$((DL_RELEVANT + 1))
    else
      DL_STALE=$((DL_STALE + 1))
    fi
  done < <(find "$HOME_DIR/Downloads" -maxdepth 1 -type f -mtime +30 2>/dev/null | head -100)
  DL_SIZE=$(du -sh "$HOME_DIR/Downloads" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [DOWNLOADS] ${DL_STALE} stale, ${DL_RELEVANT} still relevant — ${DL_SIZE} total"
fi

echo ""
echo "=== DISK & SYSTEM ==="

FREE_GB=$(df -g / | tail -1 | awk '{print $4}')
echo "  [DISK] ${FREE_GB} GB free on /"
if [ "$FREE_GB" -lt 15 ]; then
  echo "  [WARNING] Disk space below 15GB — run compact_directory on stale items"
fi

DD_SIZE="0B"
if [ -d "$HOME_DIR/Library/Developer/Xcode/DerivedData" ]; then
  DD_SIZE=$(du -sh "$HOME_DIR/Library/Developer/Xcode/DerivedData" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [XCODE] DerivedData: ${DD_SIZE} — safe to remove"
fi

CURSOR_SIZE="0B"
if [ -d "$HOME_DIR/Library/Application Support/Cursor/snapshots" ]; then
  CURSOR_SIZE=$(du -sh "$HOME_DIR/Library/Application Support/Cursor/snapshots" 2>/dev/null | cut -f1 || echo "0B")
  echo "  [CURSOR] Snapshots: ${CURSOR_SIZE} — safe to remove after quitting Cursor"
fi

echo ""
echo "=== MEMORY.md COHERENCE ==="
if [ -f "$HOME_DIR/syncscript/MEMORY.md" ]; then
  stale_refs=0
  for ref in $(grep -oE 'src/[a-zA-Z0-9_/.-]+\.(tsx?|css|mjs)' "$HOME_DIR/syncscript/MEMORY.md" 2>/dev/null | sort -u | head -20); do
    if [ ! -f "$HOME_DIR/syncscript/$ref" ]; then
      echo "  [STALE REF] syncscript/$ref — file does not exist"
      stale_refs=$((stale_refs + 1))
    fi
  done
  if [ "$stale_refs" -eq 0 ]; then
    echo "  [MEMORY] All file references valid"
  fi
fi

echo ""
echo "=== COURT CASE STATUS ==="
if [ -d "$HOME_DIR/Custody" ]; then
  # Count files by type, respecting the protected status
  filings=$(find "$HOME_DIR/Custody" -maxdepth 2 -name "*.pdf" -o -name "*.txt" 2>/dev/null | wc -l | tr -d ' ')
  drafts=$(find "$HOME_DIR/Custody" -maxdepth 2 -name "draft*" -type d 2>/dev/null | wc -l | tr -d ' ')
  evidence=$(find "$HOME_DIR/Custody" -maxdepth 2 -name "evidence*" -type d 2>/dev/null | wc -l | tr -d ' ')
  echo "  [PROTECTED] Custody directory — ${filings} filings, ${drafts} draft dirs, ${evidence} evidence dirs"
  echo "  [PROTECTED] This directory is NEVER touched by cleanup"
fi

echo ""
echo "=== RETRIEVAL INSTRUCTIONS ==="
echo "  To retrieve a compacted archive:"
echo "    tar -xzf ~/.dream-state-archives/<name>.tar.gz -C /target/directory"
echo "  To list contents without extracting:"
echo "    cat ~/.dream-state-archives/<name>.tar.gz.manifest.txt"
echo ""
echo "=== Dream State Audit Complete ==="
echo "Disk: ${FREE_GB}GB free | Downloads stale: ${DL_STALE} relevant: ${DL_RELEVANT}"
