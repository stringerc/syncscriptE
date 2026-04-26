# 2026-04-12 — Mac disk reclaim (Cursor `snapshots/`)

## Setup
- Machine: Apple Silicon Mac, APFS system volume.
- Prior state: **`~/Library/Application Support/Cursor/snapshots`** ~**117 GiB**; **`df`** ~**2.7 GiB** free; risk of failed writes.

## Method
1. Document policy in **`MEMORY.md`** + playbook in **`integrations/research/INDEX.md`** (knowledge vs bytes).
2. Remove bulk: **`rm -rf "$HOME/Library/Application Support/Cursor/snapshots"`** (2026-04-12).
3. Reboot; Cursor recreated a **new** `snapshots` tree (working checkpoints, not the old 117 GiB pile).

## Result
- **`du`** before delete: ~117 GiB in `snapshots`; **`…/Cursor`** ~141 GiB total.
- After delete + later session: **`df`** **~129 GiB** avail on `/`; **`…/Cursor`** ~**24–30 GiB** depending on session; new **`snapshots`** ~**3–6 GiB** (grows with use).
- **Tradeoff:** Local Cursor checkpoint history stored in that folder path was cleared; durable record = **git + `MEMORY.md` + this file + `integrations/research/INDEX.md`**.

## Follow-ups
- Re-run **`df -h /`** and **`du -sh …/Cursor/snapshots`** monthly or when disk is low.
- Next reclaim targets (when needed): **`~/Library/Developer`** (~15 GiB), other IDEs’ Application Support, Docker, npm caches — not **`state.vscdb`** without a plan.
