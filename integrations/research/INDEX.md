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
| Idle CPU / marketing orb profiling | 2026-04-26 | Chrome Performance recipe (4× CPU, 10s `/` + `/dashboard`); code pointers for rAF, timers, PWA precache | `./PERF_IDLE_CPU_PROFILING.md` | DevTools Performance · `document.hidden` guards |
| RUM SLOs (PostHog + Sentry) | 2026-04-26 | p75 LCP/INP + error-rate targets; monthly review; complements Lighthouse (synthetic) | `./RUM_SLO_SYNCSCRIPT.md` | PostHog web vitals · Sentry release health |
| Companion protocol policy + `openchrome` | 2026-04-11 | **Retired 2026-05-13** with failed desktop companion experiment; retained as historical protocol notes only | `./studies/2026-04-11-companion-protocol-policy.md` · `src/config/public-links.ts` | Do not run; desktop shell removed |
| Nexus agent capabilities manifest | 2026-04-11 | Single TS manifest + docs; landing blurb wired via `NexusCapabilityBlurb` | `./nexus-agent-capabilities.md` · `src/config/nexus-tool-manifest.ts` | Align OpenClaw tools with manifest IDs |
| Unified platform verification | 2026-04-11 | Cross-surface QA matrix (web, iOS, Watch); desktop Companion removed 2026-05-13 | `./VERIFY_UNIFIED_PLATFORM.md` | Manual + Playwright |
| Account email verify / change (Supabase) | 2026-04-12 | Settings → Account: verified badge, resend, `updateUser` email change; Edge profile PUT ignores client email; JWT email on GET | `./studies/2026-04-12-account-email-supabase.md` | Supabase **Confirm email** · **Secure email change** · redirect URLs |
| Nexus Halo-inspired persona v1 | 2026-04-11 | Single `Nexus_HaloInspired_v1` spec wired to guest, user, OpenClaw; optional `standard` / `halo_inspired` via settings + env; trace field `personaMode` | `./studies/2026-04-11-nexus-halo-persona-golden.md` · `integrations/nexus-persona/` | `NEXUS_PERSONA_MODE` · Settings → Nexus assistant |
| Mac disk — Cursor `snapshots/` reclaim | 2026-04-12 | ~117 GiB tree removed; `df` free **~2.7 → ~129 GiB** on `/` after APFS settle; new `snapshots` ~few GiB | `./studies/2026-04-12-mac-disk-cursor-snapshots.md` | `rm -rf ~/Library/Application Support/Cursor/snapshots` (quit Cursor first next time) |
| Regenerable pass — Xcode + npm + Docker prune | 2026-04-12 | **DerivedData ~1.2 GiB** cleared; **syncscript** `npm ci` restore; **Docker** `system prune` + `builder prune` reclaimed **~2.65 GiB** (Docker-reported); **`CI=true npm run build`** OK (skips Puppeteer prerender) | `./studies/2026-04-12-regenerable-docker-xcode-npm.md` | `docker system prune -f` · `docker builder prune -f` · `CI=true npm run build` |
| UX/UI reference canon (Figma → code + world-class sources) | 2026-04-16 | Cursor **11** + research doc; tokens in code, not screenshots; WCAG + 03/04 | `./UX_UI_REFERENCE_CANON.md` · `.cursor/rules/11-ux-ui-excellence.mdc` | Figma Community UI kits filter URL in canon; update when adopting a new kit |
| Semantic CSS design tokens | 2026-04-16 | `--surface`, `--space-*`, `--elev-*`, `--z-*`, motion in `globals.css` | `./DESIGN_TOKENS_SYNCSCRIPT.md` | v0.dev output → normalize to these tokens |
| Antigravity vs Cursor agents | 2026-04-16 | When to use computer-use IDE vs repo agent; complementary workflow | `./ANTIGRAVITY_VS_CURSOR.md` | Share git + MEMORY between tools |
| Ascension Loop (eval-driven agent) | 2026-05-18 | Master prompt + rubric + compounding state; Cursor rule **17**, `@ascension-loop`, Antigravity paste | `./ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md` · `AGENT_ASCENSION_STATE.template.md` · `.cursor/rules/17-ascension-loop-eval-agent.mdc` | `@ascension-loop` · `npm run doc:ascension-loop` · `scripts/ascension-compound-tail.txt` |
| Antigravity Claude gibberish fix | 2026-05-18 | Thinking-off env + new chat + sanity OK before Ascension; L1 fallback | `./ANTIGRAVITY_CLAUDE_READABLE_CHAT_FIX.md` | `npm run apply:antigravity-claude-settings` · `npm run verify:antigravity-claude-compat` · `scripts/antigravity-sanity-chat.txt` |
| Gemini 3.1 in Claude Code (Option C proxy) | 2026-05-18 | OpenRouter Gemini; **fails with tools** — use Option D/E for agent panel | `./GEMINI_CLAUDE_CODE_PROXY.md` | `npm run apply:free-claude-code-option-d-hybrid` · `npm run verify:claude-proxy-full` |
| Antigravity rate limit (`Provider rate limit reached`) | 2026-05-18 | **Option E** — NIM all tiers, no `:free` | `./ANTIGRAVITY_PROXY_RATE_LIMIT.md` | **`npm run heal:claude-proxy-rate-limit`** |
| SyncScript enterprise business plan (2026) | 2026-05-18 | Fact-based plan: problem→asks, TAM/SAM, competition, financial scenarios; mirrors Enterprise Plan tab | [`../BUSINESS_PLAN.md`](../BUSINESS_PLAN.md) · `./SYNCSCRIPT_BUSINESS_PLAN_CANON.md` | Enterprise → Plan → Save · rule **14** |
| Claude proxy Option D (production hybrid) | 2026-05-18 | NIM Opus + OR Sonnet/Haiku; agent-tools verify | `scripts/templates/free-claude-code-option-d-hybrid.env.fragment` | `npm run apply:free-claude-code-option-d-hybrid` · `npm run verify:claude-proxy-agent-tools` |
| Daily Claude model catalog audit | 2026-05-18 | End-of-day drift check vs OpenRouter + NIM; optional `--apply` + launchd 21:00 | `scripts/templates/claude-model-tier-preferences.json` | `npm run research:daily-claude-model-audit` · `npm run install:daily-claude-model-audit-launchd` |
| OpenClaw + ClawHub + browser stack | 2026-04-17 | Canonical layers; **npm `openclaw@2026.4.15`** vs dev `2026.3.13`; ecosystem map (MCP, Engram, evals); Mission Control vs in-app; operator runbook (clawhub, browser plugin, Nexus bridge sketch); honest AGI framing | `./OPENCLAW_CLAWHUB_BROWSER_STACK.md` | `npm i -g openclaw@latest` · `openclaw doctor` · `npm i -g clawhub` |
| SyncScript × OpenClaw excellence (safe skills) | 2026-04-17 | Tiered safety (bundled → inspect → fork); ClawHub search/inspect/explore workflow; category checklist; local gateway cleanup; **Oracle SSH runbook**; measurable “best” vs hype; **Cursor rule 12** loads docs locally | `./SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md` · `.cursor/rules/12-openclaw-clawhub-cursor-local.mdc` | `pkill -f openclaw.*gateway` · `clawhub inspect` |
| Agent skills + MCP discovery catalog | 2026-04-17 | Extended URLs (MCP registries, awesome forks, meta-indexes); Mythos context; **`npm run skill:source-audit`** | `./AGENT_SKILL_MCP_SOURCES_CATALOG.md` · `scripts/skill-source-audit.sh` | `SKILL_AUDIT_INSPECT_SLUGS=slug1,slug2` |
| OpenClaw/skills implementation inventory | 2026-04-17 | What is **actually** in git (docs, rules, audit script) vs **not** installed from ClawHub; weekly GHA audit | `./INVENTORY_OPENCLAW_SYNCSCRIPT_IMPLEMENTATION.md` | `npm run skill:source-audit` |
| Skill audit automation policy | 2026-04-17 | Weekly audit OK; **no** auto-install / auto-merge into app | `./SKILL_AUDIT_AUTOMATION_POLICY.md` | `.github/workflows/skill-source-audit-weekly.yml` |
| No auto-ship skills (policy) | 2026-04-17 | Encodes **no** bulk ClawHub / **no** auto-merge / **no** unvetted bridge replacement | `./WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md` | With `SKILL_AUDIT_AUTOMATION_POLICY.md` |
| Skill discovery matrix + triage | 2026-04-17 | Query matrix vs in-repo stack; human playbook; issue template | `./SKILL_DISCOVERY_QUERY_MATRIX.md` · `./SKILL_TRIAGE_PLAYBOOK.md` · `.github/ISSUE_TEMPLATE/skill_evaluation.md` | `npm run skill:source-audit` · `npm run skill:source-audit:ci` |
| Nexus observability + quality bar | 2026-04-17 | Same-origin **`NEXUS_*_CHAT_PATH`** constants; **`emitNexusTrace`** includes **`toolTraceEntries`** / **`toolRepairNudged`**; Vercel log sampling + SLO ideas | `./NEXUS_OBSERVABILITY_AND_QUALITY.md` · `src/config/nexus-vercel-ai-routes.ts` | `npm test` (includes `nexus-client-route-consistency`) |
| SyncScript full feature catalog | 2026-04-26 | Repo-grounded inventory by **sidebar rail**, Settings tabs, marketing/auth, `/app/*` shell, APIs, crons, Edge domains | `./SYNCSCRIPT_FULL_FEATURE_CATALOG.md` | Skim after large route or nav changes |
| Nexus LLM compat + executor bridge | 2026-04-26 | Central OpenAI-compat sanitization (Kimi `is_error`, o/GPT-5 token + sampling); `GET llm-stack` + optional `executor-bridge` probe/invoke; Hermes-shaped gateway secret | `./NEXUS_LLM_COMPAT_AND_EXECUTOR_BRIDGE.md` | `npm test` (policy + agent contract) |
| Startup cloud credits (AWS / Google / Microsoft) | 2026-04-26 | Apply-yourself playbook: official links, Bedrock/Vertex/Azure model verification in-console, SyncScript blurbs; no auto-submit | `./STARTUP_CLOUD_CREDITS_PLAYBOOK.md` | Human clicks Apply; refresh tiers yearly |
| Activity spine + social visibility + Cursor PAT | 2026-04-27 | Event types, RLS, PAT scopes, friend feed RPC, business plan export; heatmap from real data | `./SYNCSCRIPT_ACTIVITY_AND_SOCIAL_SPINE.md` | `supabase db push` · Edge `/activity/*` · `integrations/cursor-syncscript-mcp/` |
| Cursor + SyncScript social productivity roadmap | 2026-04-30 | Canonical phased roadmap (Mermaid, phases, risks); heatmap + HTTP pointers corrected; completion table | `./CURSOR_SYNCSCRIPT_SOCIAL_PRODUCTIVITY_ROADMAP.md` | With spine doc + `MEMORY.md` § Product — social |
| Cursor MCP → tasks/calendar consent flow | 2026-05-03 | Tool approval in Cursor = primary write consent; optional **`/capture/inbox`** queue for suggest-then-commit (Edge + dashboard strip + MCP); Nexus vs MCP sources; stdio smoke lists + calls capture inbox | `./CURSOR_CALENDAR_TASK_CAPTURE_FLOW.md` | `npm run verify:cursor-syncscript-mcp` · Settings `#cursor-mcp-bridge` |
| MCP parity + library + week snapshot | 2026-04-26 | Task create field parity; **`syncscript_week_snapshot`**; user **library** PAT (`library:read`/`write`) + **`POST /resources/upload-json`** (1 MiB); goals/workstream/friend-feed gaps explicit | `./MCP_PARITY_AND_ROADMAP.md` | `npm run verify:cursor-syncscript-mcp` · rotate PAT · Edge deploy |
| MiroFish / OASIS ↔ SyncScript **full capability program** (canonical) | 2026-05-09 | **Single plan to execution:** domains A–H, product surface binding, P0–P8 gates, metrics, non-goals; “revolutionary” = **calibration + governance + work spine** (auditable) | `./MIROFISH_SYNCSCRIPT_FULL_CAPABILITY_PROGRAM.md` | Supersedes re-planning; pair `./MIROFISH_SYNCSCRIPT_STRATEGIC_PLAN.md` |
| MiroFish / OASIS swarm simulation ↔ SyncScript (strategic plan) | 2026-05-09 | Fact README + OASIS link; sidecar vs monolith; closed-loop + energy governance; AGPL/cost risks; **no implementation** | `./MIROFISH_SYNCSCRIPT_STRATEGIC_PLAN.md` | Re-read repo **LICENSE** if forking; token caps before any pilot |
| Agent Skill preflight (before `npx skills add`) | 2026-05-09 | LICENSE + SKILL.md + scripts review; throwaway trial; no secrets; **02/03/04/11** still gate product | `./AGENT_SKILL_PREFLIGHT_CHECKLIST.md` | With **16** + **12** |
| Viral “five Claude skills” video ↔ Cursor + SyncScript | 2026-05-09 | Maps influencer list to **verified** repos + Anthropic docs; **rule 16** + project skill; no blind `npx skills add` | `./CLAUDE_VIDEO_FIVE_SKILLS_CURSOR_MAP.md` · **`.cursor/rules/16-agent-output-discipline-and-context.mdc`** · **`.cursor/skills/syncscript-context-discipline/SKILL.md`** | With **12** inspect-before-install · **03/11** for product copy |
| Obsidian.md ↔ MEMORY + Resonance Homeostasis | 2026-05-09 | Vendor PKM pillars fact-crosswalked to **git + INDEX + MEMORY** + RH habits; homepage vs `/sync` pricing nuance; honest gaps | `./OBSIDIAN_MD_MEMORY_CROSSWALK.md` · **`MEMORY.md`** § Obsidian.md (official site facts) | Rule **07** routing row · with **`./RESONANCE_DOCS_CURSOR_BRIDGE.md`** |
| Resonance docs (Drive) ↔ Cursor + `resonance-calculus.ts` | 2026-05-08 | Operational map: coherence / timing / tails + homeostasis-style CI hooks; links to owner Google Docs; **not** medical advice | `./RESONANCE_DOCS_CURSOR_BRIDGE.md` · **`.cursor/rules/15-claw-resonance-cursor-workflow.mdc`** | Skim rule **15** each session; app code: `src/utils/resonance-calculus.ts` |
| Cursor MCP + Composio + Google | 2026-05-08 | Where to click: Cursor MCP settings + Composio Google integration; OAuth stays out of git | `./CURSOR_MCP_COMPOSIO_GOOGLE_SETUP.md` | With **`CURSOR_IDE_EXCELLENCE_SYNCSCRIPT.md`** § MCP |
| Claude Code + free-claude-code proxy (lanes, NIM→OpenRouter) | 2026-05-09 | **Option B** apply + **separation audit**; rate-limit split Sonnet/Haiku; Antigravity ≠ Cursor ≠ Vercel unless shared OpenRouter key | `./CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md` · `scripts/apply-free-claude-code-option-b-env.sh` · `scripts/audit-claude-ide-separation.sh` · **`npm run apply:free-claude-code-option-b`** · **`npm run audit:claude-ide-separation`** | Restart proxy + Antigravity after apply |

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
