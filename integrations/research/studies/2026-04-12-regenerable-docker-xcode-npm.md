# 2026-04-12 — Regenerable cleanup (Docker / Xcode / npm)

**Policy:** No Photos/Movies touched. Only **regenerable** or **standard dev hygiene** paths.

## Xcode-only (executed)

- **Cleared** `~/Library/Developer/Xcode/DerivedData/*` — was **~1.2 GiB** before; **0 B** after.
- **`xcrun simctl delete unavailable`** — removes simulators marked unavailable (safe routine trim).

**Restore:** Next Xcode build recreates DerivedData. Simulators: re-add runtimes in Xcode → Settings → Platforms if needed.

## Docker-only (executed 2026-04-12)

Docker Desktop was started; then:

```bash
docker system prune -f
docker builder prune -f
```

**Docker reported:** `Total reclaimed space: 2.645GB` (stopped containers, unused networks, build cache objects).

**After `docker system df`:** still **~7.23 GiB reclaimable** from **unused images** (optional next step: `docker image prune -a` only if you accept re-pulling images).

**Note:** Prune removed **some exited containers** (e.g. old Supabase edge / engram-related). Bring stacks back with **`docker compose up`** in each project when needed.

**`du ~/Library/Containers/com.docker.docker`:** ~**18 GiB** before and after this prune round (Docker’s reported reclaim is the authoritative freed space for layers/cache; APFS folder `du` can lag or round).

## SyncScript regenerable-only (executed)

**Removed** then **`npm ci`** restored:

| Path | Action |
|------|--------|
| Repo root `node_modules`, `build` | `rm -rf` → `npm ci` |
| `nature-cortana-platform/desktop-shell/node_modules` | → `npm ci` in that dir |
| `mission-control/node_modules` | → `npm ci` |
| `dashboard/node_modules` | → `npm ci` |
| `client/node_modules`, `server/node_modules`, `sentinel/node_modules`, `evidence-runner/node_modules`, `landing/correct-landing/node_modules`, `.tmp-playwright/node_modules` | removed; root `npm ci` per repo layout |

**Not removed:** `nature-cortana-platform/desktop-shell/assets` (large, not regenerable from npm alone).

**Verify:** `npm run build` or your usual smoke from repo root when convenient.

## Approximate disk effect

- **Persistent:** **~1.2 GiB** from DerivedData until Xcode fills it again.
- **npm:** **Net** on `~/syncscript` may be similar to before reinstall; main benefit is **deduped/clean** `node_modules` trees, not always large net GiB.
- **Docker:** **~2.65 GiB** reclaimed via standard prune (see above); **~7+ GiB** may remain reclaimable from **unused images** if you run a stricter image prune later.
