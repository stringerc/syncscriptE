# Research & studies — index (knowledge without hoarding disk)

**Purpose:** Remember **conclusions + how you got there** in **small, git-friendly artifacts**. This file is the **catalog**; bulky raw logs and datasets live **off-repo** or in **cold archives** with a pointer here.

**Related playbook:** **`MEMORY.md`** → section **“Knowledge vs disk — memory without hoarding bytes.”**

**Other IDEs (Windsurf, VS Code, Antigravity, …):** they do not read `.cursor/rules` — paste **`RULES_SNIPPET_FOR_OTHER_IDES.txt`** into each product’s user AI settings. **`TOOLS.md`** § IDE-embedded AI lists this.

---

## What to keep vs skip

| Keep (lightweight) | Usually skip hoarding |
|--------------------|------------------------|
| Written summary in git-backed docs (`MEMORY.md`, `memory/YYYY-MM-DD.md`, files under `integrations/research/`) | Raw multi‑GB logs unless legally required |
| **Results:** what you measured, version, date, command, link to commit | Every intermediate scratch file |
| **Repro:** exact script + pinned versions (`package.json`, lockfile) | Duplicate copies of the same repo |
| **One** canonical dataset path or export | Ten exports of the same study |

**IDE rule:** **Cursor snapshots / huge IDE state are not a memory system** — they are local editor history. Curated notes + git are the durable backup for your mind.

**Rule of thumb:** If the insight matters, it should survive **without** living on the internal SSD forever as raw bulk.

---

## Scanning an external folder (wild-goose-proof)

When you have notes elsewhere (no shared keywords with this repo), use the **read-only** scanner:

```bash
# Full pass on a path you choose (overview + extension counts + large files + recent + broad rg)
bash scripts/research-corpus-scan.sh /path/to/your/notes all

# Or one slice at a time: overview | extensions | large | recent | broad
bash scripts/research-corpus-scan.sh ~/Documents/Research overview
```

From the repo root, **`npm run research:scan`** runs the same script against **this repository** (default `ROOT` = repo root). Point `ROOT` at another directory to map material before you summarize it into `./studies/` and a catalog row above.

**Requires:** optional **`rg` (ripgrep)** for `broad` mode; without it, the script falls back to a shallow `grep` sample.

---

## Catalog (add a row per study)

| Title | Date | Outcome (one line) | Artifact / archive path | Key command or commit |
|-------|------|--------------------|---------------------------|------------------------|
| Companion protocol policy + `openchrome` | 2026-04-11 | Allowlisted `syncscript-companion://` actions, trust/audit notes, Chrome-specific open with path guard + `events.jsonl` | `./studies/2026-04-11-companion-protocol-policy.md` · `src/config/public-links.ts` | `npm run verify:protocol-guard` in `desktop-shell` |
| Nexus agent capabilities manifest | 2026-04-11 | Single TS manifest + docs; landing blurb wired via `NexusCapabilityBlurb` | `./nexus-agent-capabilities.md` · `src/config/nexus-tool-manifest.ts` | Align OpenClaw tools with manifest IDs |
| Unified platform verification | 2026-04-11 | Cross-surface QA matrix (web, Companion, iOS, Watch) | `./VERIFY_UNIFIED_PLATFORM.md` | Manual + Playwright + protocol guard |
| Account email verify / change (Supabase) | 2026-04-12 | Settings → Account: verified badge, resend, `updateUser` email change; Edge profile PUT ignores client email; JWT email on GET | `./studies/2026-04-12-account-email-supabase.md` | Supabase **Confirm email** · **Secure email change** · redirect URLs |
| Nexus Halo-inspired persona v1 | 2026-04-11 | Single `Nexus_HaloInspired_v1` spec wired to guest, user, OpenClaw; optional `standard` / `halo_inspired` via settings + env; trace field `personaMode` | `./studies/2026-04-11-nexus-halo-persona-golden.md` · `integrations/nexus-persona/` | `NEXUS_PERSONA_MODE` · Settings → Nexus assistant |
| Mac disk — Cursor `snapshots/` reclaim | 2026-04-12 | ~117 GiB tree removed; `df` free **~2.7 → ~129 GiB** on `/` after APFS settle; new `snapshots` ~few GiB | `./studies/2026-04-12-mac-disk-cursor-snapshots.md` | `rm -rf ~/Library/Application Support/Cursor/snapshots` (quit Cursor first next time) |
| Regenerable pass — Xcode + npm + Docker prune | 2026-04-12 | **DerivedData ~1.2 GiB** cleared; **syncscript** `npm ci` restore; **Docker** `system prune` + `builder prune` reclaimed **~2.65 GiB** (Docker-reported); **`CI=true npm run build`** OK (skips Puppeteer prerender) | `./studies/2026-04-12-regenerable-docker-xcode-npm.md` | `docker system prune -f` · `docker builder prune -f` · `CI=true npm run build` |
| UX/UI reference canon (Figma → code + world-class sources) | 2026-04-16 | Cursor **11** + research doc; tokens in code, not screenshots; WCAG + 03/04 | `./UX_UI_REFERENCE_CANON.md` · `.cursor/rules/11-ux-ui-excellence.mdc` | Figma Community UI kits filter URL in canon; update when adopting a new kit |
| Semantic CSS design tokens | 2026-04-16 | `--surface`, `--space-*`, `--elev-*`, `--z-*`, motion in `globals.css` | `./DESIGN_TOKENS_SYNCSCRIPT.md` | v0.dev output → normalize to these tokens |
| Antigravity vs Cursor agents | 2026-04-16 | When to use computer-use IDE vs repo agent; complementary workflow | `./ANTIGRAVITY_VS_CURSOR.md` | Share git + MEMORY between tools |
| OpenClaw + ClawHub + browser stack | 2026-04-17 | Canonical layers; **npm `openclaw@2026.4.15`** vs dev `2026.3.13`; ecosystem map (MCP, Engram, evals); Mission Control vs in-app; operator runbook (clawhub, browser plugin, Nexus bridge sketch); honest AGI framing | `./OPENCLAW_CLAWHUB_BROWSER_STACK.md` | `npm i -g openclaw@latest` · `openclaw doctor` · `npm i -g clawhub` |
| SyncScript × OpenClaw excellence (safe skills) | 2026-04-17 | Tiered safety (bundled → inspect → fork); ClawHub search/inspect/explore workflow; category checklist; local gateway cleanup; **Oracle SSH runbook**; measurable “best” vs hype; **Cursor rule 12** loads docs locally | `./SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md` · `.cursor/rules/12-openclaw-clawhub-cursor-local.mdc` | `pkill -f openclaw.*gateway` · `clawhub inspect` |
| Agent skills + MCP discovery catalog | 2026-04-17 | Extended URLs (MCP registries, awesome forks, meta-indexes); Mythos context; **`npm run skill:source-audit`** | `./AGENT_SKILL_MCP_SOURCES_CATALOG.md` · `scripts/skill-source-audit.sh` | `SKILL_AUDIT_INSPECT_SLUGS=slug1,slug2` |
| OpenClaw/skills implementation inventory | 2026-04-17 | What is **actually** in git (docs, rules, audit script) vs **not** installed from ClawHub; weekly GHA audit | `./INVENTORY_OPENCLAW_SYNCSCRIPT_IMPLEMENTATION.md` | `npm run skill:source-audit` |
| Skill audit automation policy | 2026-04-17 | Weekly audit OK; **no** auto-install / auto-merge into app | `./SKILL_AUDIT_AUTOMATION_POLICY.md` | `.github/workflows/skill-source-audit-weekly.yml` |
| No auto-ship skills (policy) | 2026-04-17 | Encodes **no** bulk ClawHub / **no** auto-merge / **no** unvetted bridge replacement | `./WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md` | With `SKILL_AUDIT_AUTOMATION_POLICY.md` |
| Skill discovery matrix + triage | 2026-04-17 | Query matrix vs in-repo stack; human playbook; issue template | `./SKILL_DISCOVERY_QUERY_MATRIX.md` · `./SKILL_TRIAGE_PLAYBOOK.md` · `.github/ISSUE_TEMPLATE/skill_evaluation.md` | `npm run skill:source-audit` · `npm run skill:source-audit:ci` |
| Nexus observability + quality bar | 2026-04-17 | Same-origin **`NEXUS_*_CHAT_PATH`** constants; **`emitNexusTrace`** includes **`toolTraceEntries`** / **`toolRepairNudged`**; Vercel log sampling + SLO ideas | `./NEXUS_OBSERVABILITY_AND_QUALITY.md` · `src/config/nexus-vercel-ai-routes.ts` | `npm test` (includes `nexus-client-route-consistency`) |

**Per-study doc** (short markdown): **setup → method → result → follow-ups** — even if raw logs are deleted later.

---

## Tiered storage (pair with disk cleanup)

| Tier | Where | Use |
|------|-------|-----|
| **Hot** | Internal SSD | Active repo, tools, work touched weekly |
| **Warm** | External SSD / second volume | Finished study folders, old VMs, big datasets you might re-open |
| **Cold** | ZIP/tar + **`ARCHIVE-README.template.md`** filled in | Long-term archive; **compress** cold text-heavy bundles; delete regenerable dev fat (`node_modules`, builds) separately |

**Cursor `~/Library/.../Cursor/snapshots`** (~100+ GiB possible) is **checkpoint bulk**, not irreplaceable research — capture conclusions here, then trim snapshots when you accept losing local undo history (see **`MEMORY.md`** disk section).

---

## Large binaries

- Prefer **Git LFS**, or store blobs **outside git** and record **path + checksum + how to obtain** in the study doc.

---

## Refresh

Reconcile this index when you **archive a project**, **trim IDE data**, or **finish** a study worth remembering.
