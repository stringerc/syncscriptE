# SyncScript Project Memory (Quick Reference)

### Quick context for new chats (keep ≤15 lines; edit only when workflow changes)

- **Stack:** Vite/React dashboard, Vercel **`api/*`**, Supabase Edge; production deploy flows vary by change type (see dated entries below).
- **Start here:** **`SESSION_START.md`** → this file (quick section first) → **`AGENTS.md`**, **`SOUL.md`**, **`USER.md`** (repo; full personal context may be **`~/USER.md`**).
- **Cursor:** Always-on **topic index** (not full MEMORY) → **`.cursor/rules/07-syncscript-app-knowledge.mdc`**. Full detail stays **here** in git; Cursor has no separate “vector ingest” for arbitrary MD—**curated rules + this file** is the supported pattern.
- **Rules:** **`.cursor/rules/`** — never violate **`02-protected-files-never-touch.mdc`** (Nexus/energy/auth surfaces).
- **Ship:** Small diffs; **`npm test`** when touching Nexus tools/voice/contracts; build for risky UI.
- **Nexus voice:** Signed-in App AI voice uses **`/api/ai/nexus-user`** + tools (not OpenClaw for that path). Canvas, map embed, **`update_document`** — details in **§ Nexus Voice** below.
- **Orchestration:** OpenClaw / Hermes / Engram = runtime tools — not a substitute for repo + MEMORY.
- **Deploy vs repo:** `npm run verify:prod-build` compares **local `git` HEAD** to **`<!-- syncscript-build:sha -->` in live `/` HTML**. If it fails with “no marker,” production is **not** serving a build from current `vite build` (wrong Vercel project/branch, or deploy not run). **`npm test` green does not imply prod matches git** — run the verify script or GitHub Action **`Verify production HTML build fingerprint`** after deploy.
- **UX/UI bar:** **`.cursor/rules/11-ux-ui-excellence.mdc`** (always-on behaviors) + **`integrations/research/UX_UI_REFERENCE_CANON.md`** (Figma Community workflow + world-class links). **Semantic tokens** in **`src/styles/globals.css`** — **`integrations/research/DESIGN_TOKENS_SYNCSCRIPT.md`**. **Antigravity vs Cursor:** **`integrations/research/ANTIGRAVITY_VS_CURSOR.md`**. Kits inspire **tokens and patterns** — code + **03/04** gates remain source of truth.

**Last updated:** 2026-04-16 — Nexus voice follow-ups: **CSP `frame-src`** for OSM, **`GET /api/map/resolve-map-url`** for Google short links, **`update_document`** nudges + edit-intent reminder (see **§ Nexus Voice — tools-backed canvas & maps**).

**2026-04-16 — Nexus Voice — CSP + map resolve + update_document nudges:** **`vercel.json`** `Content-Security-Policy` **`frame-src`** includes **`https://www.openstreetmap.org`** (fixes blank OSM iframe). **`api/map/resolve-map-url`** + **`api/_lib/resolve-map-short-link.ts`**: HTTPS-only, allowlisted hosts, manual redirect follow → lat/lng; **`VoiceConversationEngine`** calls resolve when **`shouldTryServerMapResolve`** (goo.gl / maps.app.goo.gl). **`userSoundsLikeDocumentEditIntent`** → extra system reminder in **`nexus-user`** when multi-turn + edit-like last user message; **`nexus-tool-loop`** nudges **`update_document`** after **`create_document`** when user text sounds like an edit. Tests: **`nexus-map-csp-and-resolve-contract.test.mjs`**, **`map-url-embed`** (`shouldTryServerMapResolve`), **`nexus-document-intent.test.ts`** (tsx). **Prod:** deploy Vercel so CSP + API route apply; manual smoke still **`deploy/SMOKE_TEST_NEXUS_VOICE_DOC_MAP.md`**.

**2026-04-11 — Nexus Voice — tools-backed canvas & maps:** Signed-in **App AI voice** uses **`postNexusUserVoiceTurn`** → **`/api/ai/nexus-user`** with **`enableTools: true`** (Nexus tools, not OpenClaw). **Artifact rail** (`NexusVoiceArtifactRail`): task/doc/calendar/place chips; **DocumentCanvas** via portal + **`voiceCanvasRenderKey`**; **`NexusVoiceTaskPeek`** after **`create_task`/`add_note`**; **map:** `src/utils/map-url-embed.mjs` + **`NexusVoiceMapEmbed`** (OSM iframe when **`parseLatLngFromMapUrl`** succeeds; **`@lat,lng`** smoke URL; short links usually no coords). Backend: **`update_document`** in **`api/_lib/nexus-tools.ts`** + **`nexus-actions-executor.ts`**; chat + voice apply **`toolTrace`** to remount canvas. **Tests:** `tests/map-url-embed.test.mjs`, `tests/nexus-update-document-contract.test.mjs` (in **`npm test`**). **Smoke runbook:** **`deploy/SMOKE_TEST_NEXUS_VOICE_DOC_MAP.md`**. **Commit:** **`b01e68e`** on **`main`** (`origin` pushed). **Follow-ups:** host **CSP `frame-src`** for `openstreetmap.org` if iframe blank; optional short-link resolve; ensure model calls **`update_document`** for edits (prompt mitigates). Raw log: **`memory/2026-04-11.md`**.

**2026-04-11 — Linked calendar holds (Google + Outlook) — merged UI + PATCH:** Edge **`GET /calendar/sync-groups`**, **`PATCH /calendar/sync-group/:id`** (body: **`targets`**, optional title/time), **`deleteOutlookCalendarEvent`** in **`integration-actions.tsx`**. Dashboard **`CalendarEventsPage`**: **`mergeLocalEventsWithSyncGroups`** dedupes by **`syncGroupId`**; fingerprint fallback only when **unambiguous** (single KV group with that title+time); second-level fingerprints; **`handleSaveEvent`** **`PATCH`**es providers when title/start/end change; **`CalendarEventCard`** / **`BaseCard`** badges; **`EventModal`** + **`LinkedCalendarEventModal`**. **Edge deploy:** `npm run deploy:edge:make-server` → project **`kwhnrlzibgfedtxpkbgb`** (2026-04-11).

**2026-04-13 — Nexus Voice (dashboard) TTS parity with landing:** when `voice === cortana`, **`useVoiceStream`** runs the **same pipeline as `NexusVoiceCallContext`**: `sanitizeForTTS` → `buildSpeechChunks` → per-sentence **PROSODY_MAP** speeds (0.98 / 0.99 / 1.0) → **voice fallbacks** (cortana → natural → nexus → professional) on `/api/ai/tts` + optional direct Kokoro → **Web Audio progressive playback** with **~72ms inter-chunk tail trim** (not one giant blob). STT: **debounced `isFinal`** for continuous dictation; callback **refs** for stale handlers. **QA:** **guest mode** smoke-tests App AI / Voice without a full account.

**2026-04-15 — Cortana: no robotic fallback:** **`GET /api/ai/tts`** exposes **`kokoroFallbackDirectOrigin`** ( **`KOKORO_TTS_FALLBACK_URL`** — e.g. Oracle Kokoro). Chunked **`fetchKokoroBufferForNexusSegment`** + **`useVoiceStream`** try **primary then fallback** direct hosts. **Transient** proxy retries + **450ms cold replay** of chunked pipeline. **`cortana`** preset: **never** **`speechSynthesis`** — **`onError`** + idle if all neural paths fail (browser TTS remains only for non-Cortana presets).

**2026-04-15 — TTS SLO layers:** Client **`kind:tts_rum`** beacons → **`api/ai/tts`** logs + optional **`TTS_RUM_WEBHOOK_URL`**. **`handleTtsSlo`** at **`/api/cron/tts-slo`** (probe + optional **`TTS_CRON_PREWARM`**). **Vercel Hobby** cannot schedule sub-daily crons — use **`.github/workflows/tts-slo-probe.yml`** for frequent synthetics; Pro can add a **`vercel.json`** cron. Runbook **`deploy/tts-reliability-slo.md`**. Prod deploy **`npm run deploy:vercel:prod`** (2026-04-15).

**2026-04-16 — SAM.gov Automated Caller (external product plan):** Separate from SyncScript; optional webhooks/voice integration. **Spec v3:** adds **automation tiers (A–D)**, matrix by subsystem, policy-as-code (`scoring_rule_sets`, `automation_policies`), self-healing (DLQ, SES bounce breaker, LLM caps), optional schema §24, webhook **event catalog** §25 — **`integrations/research/sam-gov-automated-caller-plan.md`**. Codename **`sam-gov-automated-caller`**.

**2026-04-16 — Nexus Concierge Playbooks (in-product spec):** Trust-first **Scripts tab / playbook** architecture for **bounded third-party** actions (venue call, RFQ email, confirmation ingest) — **tiers T0–T4**, Postgres schema (`playbook_definitions`, `playbook_runs`, `third_party_calls`, `email_expectations`, `confirmation_evidence`), **DAG JSON**, gates, Twilio **subaccount** isolation, inbound **email parse** + confidence, failure modes, **P0–P4** rollout, **Appendix C** implementation checklist. **`integrations/research/nexus-concierge-playbooks.md`**. Codename **`nexus-concierge-playbooks`**. Contract test **`tests/nexus-concierge-playbook-contract.test.mjs`**. **Runtime** (worker, migrations, Nexus `enqueue_playbook`) ships per checklist — spec is complete; code lands in phased PRs. **Live DB smoke:** `npm run test:concierge:integration` with **`CONCIERGE_INTEGRATION=1`**, **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`** (optional **`CONCIERGE_TEST_USER_ID`**, optional **`CONCIERGE_TWILIO_ACCOUNT_CHECK=1`** + **`TWILIO_*`** — GET Account only, no outbound call). Script: **`tests/concierge-playbook-integration.mjs`**. **Twilio trial / voice numbers:** same as rest of phone stack — **Vercel env** + **§ Nexus phone** table below (never commit secrets).

**Earlier:** 2026-04-12 — **Docker prune** (~**2.65 GiB**); **INDEX** + study; **`CI=true npm run build`** OK; Xcode **DerivedData**; **`npm ci`**; favicon = `public/favicon.svg`.

**Tracing work:** Curate **this file** for durable ops + decisions; raw session logs go in **`memory/YYYY-MM-DD.md`** (see `AGENTS.md`). After deploy or infra changes (Vercel env, tunnels, Edge), update the relevant section here so the next session does not re-debug from scratch.

## Work completion — finish what we start
When we take on a feature, integration, or production fix, **drive it to completion in one coherent effort** (same session / same PR-sized slice when possible): code + **migrations** if needed + **Supabase Edge deploy** when Edge changes + **Vercel** when `api/*` or env changes + **contract / smoke / verify scripts** that prove the path + **this `MEMORY.md`** (and a daily note if useful). **Avoid** landing half-wired routes, stale dashboard URLs, or “we’ll set env later” for **production-critical** flows unless the user explicitly cuts scope.

If **blocked** (missing secret, third-party dashboard, hardware), **stop with a written unblocker**: exact env name, exact URL to click, exact command — and add it to **`MEMORY.md`** or **`memory/YYYY-MM-DD.md`** so nobody rebuilds the same half-finished work from scratch.

## Mac disk space — reclaim protocol (finished; refresh sizes periodically)
**Why this lives here:** The machine hit **disk-full** conditions (failed copies, corruption risk). **Policy:** keep **roughly ≥10–15% free** on the system volume when possible; **free space before** heavy installs, sync, or DB work. **Compression** is for **cold archives** (ZIP to external disk); it is **not** a substitute for deleting **regenerable** dev artifacts or huge **IDE snapshot** data.

### Checklist (System + dev + IDE)
1. **Apple:** **System Settings → General → Storage** — review largest categories, Recommendations, Large Files / Developers.
2. **Regenerable dev fat (safe in principle):** stale **`node_modules`** (reinstall with `npm ci` / `pnpm install`), **`dist/` / `build/` / `.next/`**, **Docker** images/volumes you do not need (`docker system prune` only after understanding what goes away), **language package caches** (npm/pip/Homebrew).
3. **Xcode / tooling:** **`~/Library/Developer`** — DerivedData and simulators if you are not actively using those builds.
4. **IDEs are separate:** **Cursor**, **Windsurf**, **VS Code**, **Antigravity** each use their own **`~/Library/Application Support/<App>`** — cleaning one does **not** clean the others. Same *class* of cleanup (caches, old workspaces); paths differ by product/version.
5. **Do not** treat “compress my source tree” as the main lever — editors and agents need normal folders; **move cold projects off-disk** or **archive** (ZIP) what you will not open for months.

### Tradeoffs (honest)
| Target | Typical action | Tradeoff |
|--------|----------------|----------|
| **`node_modules` / build dirs** | Delete; reinstall / rebuild | Time to restore |
| **Browser / system caches** | Clear via Settings or browser | Re-downloads |
| **Cursor `snapshots/`** (local checkpoints) | Reduce retention or remove after **quit Cursor** | **Loses** local snapshot/history stored there — confirm you accept that |
| **`User/globalStorage/state.vscdb`** | Do **not** delete casually | Settings / state risk — prefer official cleanup or vacuum guidance |

### Snapshot — this Mac (agent `du` / `df`, refresh after cleanups)
**2026-04-12 — `~/Library/Application Support/Cursor/snapshots` bulk deleted once** (~**117 GiB** `du` before). After reboot, APFS **`df`** settled to **~129 GiB free** on `/` (was ~2.7 GiB before reclaim). Cursor **recreated** a fresh `snapshots` tree (few GiB, grows with use) — **not** the old 117 GiB pile.

| Location | ~Size (measured 2026-04-12 session) | Note |
|----------|--------------------------------------|------|
| **`/` (system volume)** | **~129 GiB free** (`df`) | Meets **≥10–15%** headroom target on 460 GiB class volume |
| **`~/Library` total** | **~80 GiB** (`du`, may hit TCC on some subfolders) | Use **System Settings → Storage** for Apple’s full breakdown |
| **`~/Library/Application Support/Cursor`** | **~30 GiB** | Was ~141 GiB before big `snapshots/` delete |
| → **`…/Cursor/snapshots`** | **~5.6 GiB** (regrown after reboot) | Trim again later if needed (quit Cursor first); see **`integrations/research/studies/2026-04-12-mac-disk-cursor-snapshots.md`** |
| → **`…/Cursor/User`** | **~22 GiB** | Workspaces, extensions, `globalStorage` (`state.vscdb`, etc.) |
| **`~/Library/Developer`** | **~15 GiB** | Xcode / simulators — next reclaim candidate |
| **`~/Library/Caches` / `Containers`** | *use Storage UI* | `du` from agents may get **Operation not permitted** on Apple sandboxes |
| **`~/syncscript/node_modules`** | **~1.2 GiB** | Regenerable (`npm ci`) |
| **`~/syncscript/build`** | **~14 MiB** | Regenerable |

### Re-scan commands (read-only)
```bash
df -h /
du -sh "$HOME/Library/Application Support/Cursor"/* 2>/dev/null | sort -hr | head -20
```

### Reclaiming **`~/Library/Application Support/Cursor/snapshots`** (careful)
**Done once (2026-04-12):** folder removed with `rm -rf` while Cursor was running — succeeded; prefer **quit Cursor first** next time to avoid rare file-lock issues.

1. **Quit Cursor** fully (not only window) before manual deletes.
2. Prefer **in-app** controls if the current Cursor version exposes snapshot / local history retention (check **Settings**).
3. If removing manually: consider **rename** to `snapshots.bak`, reopen Cursor, verify behavior, then delete the backup — or **move** `snapshots` to an **external drive** before delete if you want a safety copy.

**Related:** Global user rules were also written to **`aicontext.personalContext`** in `state.vscdb` — do not delete that DB to “save space” without understanding you may reset IDE state.

## Knowledge vs disk — memory without hoarding bytes
**Goal:** Keep **science and conclusions** durable while **freeing space** — **knowledge is not the same as bytes.** Export insight into **small files + git**; use **tiered storage** and **retention** for bulk; do not rely on **IDE snapshots** as long-term memory.

### What you need to “never forget”
**Knowledge = conclusions + how you got there**, in **small, durable artifacts:**

| Keep (lightweight) | Usually skip hoarding |
|--------------------|------------------------|
| Written summary in git-backed docs (`MEMORY.md`, `memory/YYYY-MM-DD.md`, **`integrations/research/`**) | Raw multi‑GB logs unless legally required |
| **Results:** what you measured, version, date, command, link to commit | Every intermediate scratch file |
| **Repro:** exact script + pinned versions (`package.json`, lockfile) | Duplicate copies of the same repo |
| **One** canonical dataset path or export | Many duplicate exports of the same study |

**IDE reality:** **Cursor snapshots / huge IDE state are not a memory system** — they are **local editor/checkpoint history**. Curated notes + git are the backup for your mind.

**Rule of thumb:** If the insight is important, it should survive **without** that data living on the internal SSD forever as raw bulk.

**Canonical catalog:** **`integrations/research/INDEX.md`** (git-tracked — **`docs/`** is gitignored in this repo, so research lives under **`integrations/research/`**). Cold ZIP/tar bundles: use **`integrations/research/ARCHIVE-README.template.md`** inside or beside the archive.

### Free space and keep the science (tiered storage)
| Tier | Where | Use |
|------|-------|-----|
| **Hot** | Internal SSD | Active projects, tools, work touched weekly |
| **Warm** | External SSD or second volume | Finished studies, old VMs, big datasets you might re-open |
| **Cold** | Archived ZIP/tar + README from template | Long-term; **compress** text-heavy cold bundles; still **delete regenerable** fat (`node_modules`, builds, Docker cruft) — compression does not replace that |

**This Mac:** **`~/Library/Application Support/Cursor/snapshots`** was **~117 GiB** — **not** “irreplaceable research”; it is **local checkpoint bulk**. Preserve conclusions in **`integrations/research/INDEX.md`** / **`MEMORY.md`**; trim snapshots only when you accept losing that **local undo** stack (see **§ Mac disk space** above).

### “Never run out of space” (realistic)
You cannot guarantee **infinite** local space; you can make exhaustion **unlikely**:

- **Floor:** aim for **~10–15%+ free** on the system volume; below that, writes and performance get risky.
- **Monitor:** monthly **`df -h`**, macOS **Storage**, optional low-disk alerts.
- **Policy:** When **IDE data**, **simulators**, or **Docker** grow — **cap by process** (retention, prune, move cold data off-disk), not one yearly panic cleanup.
- **Backups:** Time Machine or another backup to **external** disk; archived research in **named, dated** folders/repos so restore is **meaningful**.

### Scalable memory system (personal scale = enterprise pattern)
- **One index:** **`integrations/research/INDEX.md`** — title, date, outcome, path/archive, key command.
- **Per study:** short markdown — **setup → method → result → follow-ups** (even if raw logs go away).
- **Git** for code/text you care about; **large binaries** → Git LFS or **outside git** with a **pointer** in the study doc.

### What large orgs do (same idea, smaller scale)
**Retention**, **tiered storage**, **documentation**, **backups** — not “compress everything and hope.” **Small curated memory**, **cold archives** for bulk, **aggressive cleanup** of regenerable and redundant **IDE cache/snapshots**.

**Bottom line:** Treat **disk as expensive** and **knowledge as exported** into small files and git. Use **external/cold** archives for bulk; **trim IDE snapshots and caches** for space; **index** what matters so nothing important depends on “it’s still somewhere on the laptop.”

## OpenClaw + Cursor — how to work effectively
**In SyncScript (the app):** **OpenClaw** is the **autonomous agent harness / gateway** (default **`openclaw gateway`** on **`:18789`** loopback; EC2 in prod). The product reaches it through **Supabase Edge** **`openclaw-bridge`** and the dashboard — not by “Cursor magic.” Facts and wiring: **`integrations/ENGRAM_OPENCLAW.md`**, **`supabase/functions/make-server-57781ad9/openclaw-bridge.tsx`**, **`OPENCLAW_BASE_URL`** / EC2 **`3.148.233.23:18789`** in this file below.

**In Cursor (the IDE + coding agent):** treat integrations as **explicit tool surfaces**, not vibes:
- **Composio + MCP** — Strong pattern for connecting **OpenClaw-style harnesses** to **many external tools** via **Model Context Protocol** (unified tool router, OAuth/API handling). Composio documents **Cursor ↔ OpenClaw** toolkit wiring (search: *Composio Cursor OpenClaw* — e.g. [cursor + openclaw on Composio](https://composio.dev/toolkits/cursor/framework/openclaw), [Composio MCP with OpenClaw](https://composio.dev/content/how-to-use-composio-mcp-with-openclaw)). Use when the goal is **broad third-party actions** from an agent with MCP.
- **Cursor-native MCP** — Cursor settings + project **`mcps/`** tool descriptors (e.g. GitHub). Prefer **MCP** for provider-backed actions when available; don’t assume a shell CLI exists for the same capability.
- **Skills / playbooks** — Repeatable procedures: **Cursor skills** (`SKILL.md`), repo **`integrations/agent-playbooks/README.md`**, **`.cursor/commands/*.md`**. Community index: [awesome-openclaw-skills — coding agents & IDEs](https://github.com/VoltAgent/awesome-openclaw-skills/blob/main/categories/coding-agents-and-ides.md).

**Hermes / Engram (this repo’s split-brain stack):** follow **`.cursor/commands/verify-hermes-engram.md`** and **`integrations/agent-playbooks/`** — not a generic `hermes` shell command. **Cursor ↔ Hermes orchestration + multi-AI boundaries:** **`.cursor/rules/09-multi-agent-orchestration.mdc`** (always on in this workspace). **Global Cursor “one brain” (all folders):** paste **`~/.cursor/RULES_FOR_AI_GLOBAL_PASTE.txt`** into **Cursor → Settings → Rules for AI**; optional symlink **`~/.cursor/rules-global/00-universal-cursor-brain.mdc`** per repo via **`scripts/link-global-cursor-brain.sh`** (gitignored symlink). **IDEs (Antigravity, etc.):** listed in **`TOOLS.md`** — not CLIs; separate configs from SyncScript.

## Tools on this machine — agents use the repo’s map first
1. **Read repo `TOOLS.md`** (workspace root) — **curated paths + MCP / slash-command wiring** for this Mac (`openclaw`, `claude`, `gemini`, `aider`, `cursor-agent`, Hermes/Engram playbooks). **Keep it current** when installs move. Rule: **`.cursor/rules/08-local-agent-cli-paths.mdc`**.
2. **Verify** with **`command -v`** / **`which`** after reading `TOOLS.md`; respect **`$PATH`**.
3. **MCP ≠ CLI** — e.g. GitHub may be **MCP in Cursor**, not `gh` in terminal.
4. **Secrets** — never paste into **`MEMORY.md`**; env / Keychain / Vercel / Supabase only.

## Apple platforms — test hardware and Xcode (SyncScript unified stack)
- **Physical Apple Watch:** Series 3 is **legacy** (capped at old watchOS); **do not** use it as the primary device for App Store–style builds. Use **Apple Watch Simulator** (deployment target aligned with Xcode) and/or a **Series 6+ / SE (2nd gen)** for on-wrist verification.
- **Checklist docs:** [`src/native/IOS_WATCH_SHIPPING.md`](src/native/IOS_WATCH_SHIPPING.md), [`src/native/WATCH_OS_PLATFORM.md`](src/native/WATCH_OS_PLATFORM.md), [`integrations/research/VERIFY_UNIFIED_PLATFORM.md`](integrations/research/VERIFY_UNIFIED_PLATFORM.md).
- **Desktop Companion protocol policy:** [`integrations/research/studies/2026-04-11-companion-protocol-policy.md`](integrations/research/studies/2026-04-11-companion-protocol-policy.md) — path guard smoke: `npm run verify:protocol-guard` inside `nature-cortana-platform/desktop-shell`.
- **Cross-stack script (repo root):** `npm run verify:unified-platform` — Companion path guard + library + push-route contract tests. **`npm run verify:platform:full`** adds Playwright landing capabilities. **`npm run verify:ios:build`** builds the Capacitor iOS app (App Intents Swift). **AASA** in `public/.well-known/apple-app-site-association` uses **`K85GR7XGDP.com.syncscript.app`** (matches Xcode `DEVELOPMENT_TEAM` + bundle id).
- **Edge deploy:** `npm run deploy:edge:make-server` deploys `make-server-57781ad9` (includes `/push/register`, library search, etc.).

## Autonomous billing, invoices, and crons (verified pattern)
- **Overdue + reminders + recurring + collection queue:** Supabase Edge `POST /make-server-57781ad9/internal/cron/billing-tick` (header `x-nexus-internal-secret: NEXUS_PHONE_EDGE_SECRET`) scans KV `invoices:v1:*` via `getKeyValueByPrefix`, marks `overdue`, sends tiered Resend reminders (3/7/14 days after due), dispatches recurring invoices from `recurring_invoices:v1:${userId}`, and enqueues Twilio collection calls on `nexus_scheduled_phone_calls` when `to_phone` + `collection_call_consent` and reminders threshold met.
- **Vercel:** `GET/POST /api/cron/invoice-overdue` and `billing-tick` call that Edge URL; `phone-dispatch` drains the phone queue; `market-benchmarks` calls `internal/bench/aggregate`. All expect `Authorization: Bearer CRON_SECRET` where configured.
- **Invoice records:** Persist `_userId` on each row (Nexus `send_invoice` + phone `phone-upsert`). Stripe `checkout.session.completed` now **writes back** the correct KV key via `getKeyValueByPrefix` + `kv.set`.
- **TwiML:** `handler=invoice-collection` plays a short disclosure message and hangs up (debtor-facing); scheduled jobs use `briefingType: invoice-collection` with `invoiceId` + `amount` query params.
- **Firma.dev:** Vercel **`api/firma/[action].ts`** (Hobby: one function) — `POST /api/firma/create-signing-request` and `POST /api/firma/webhook`. Firma API requires **PDF** base64 (`pdf-lib` server-side), **`/signing-requests/create-and-send`**. Webhook forwards to Edge `internal/firma-webhook` (public Supabase URL + anon fallbacks if `SUPABASE_URL` missing on Vercel). Nexus tool `send_document_for_signature`. Env: `FIRMA_API_KEY`, `FIRMA_WEBHOOK_SECRET`, `NEXUS_PHONE_EDGE_SECRET`. **Cursor MCP:** `https://docs.firma.dev/mcp`.
- **Plaid:** Edge app mounted at `/make-server-57781ad9/financial` (was previously unused). UI: `PlaidConnectCard` on Financials → Invoices.
- **Benchmarks:** Opt-in flag `benchmark_opt_in:${userId}` via invoice settings; public aggregate `GET /benchmarks/summary`; weekly cron aggregates opt-in users only.
- **Email proposal stub:** `internal/email-proposal-tick` chained from `process-emails` cron (extend with Gmail ingestion later).
- **Biometrics:** `useBiometricSummary` is a **separate** hook (does not modify `energy-system.ts` / `useEnergyPrediction.ts`).

## Dashboard navigation — do not regress (stuck on `/tasks`)
- **Symptom:** Sidebar (or links) appear to do nothing; user stays on Tasks after refresh or when leaving `/tasks`.
- **Root cause we fixed:** A **second** `<Routes>` mounted under `<Route path="/*" element={<DashboardRoutes/>} />` can break or strand **client-side navigation** in React Router 6/7 relative to the splat parent.
- **Second root cause (2026):** **`DashboardHeader` / `ResourceHubSection` navigated to `/dashboard/tasks`, `/dashboard/calendar`, etc.** Those URLs were only handled inside unused **`DashboardApp.tsx`** (legacy redirects). **`App.tsx` had no matching routes**, so the shell catch‑all sent signed‑in users to **`/dashboard`** — navigation looked broken. **Fix:** canonical paths via **`navigationLinks.sidebar`** in header/resource hub + explicit **`path="dashboard/tasks"` … `Navigate`** aliases in **`App.tsx`**.
- **BFCache:** **`BfcacheRouterSync`** in **`RouterStability.tsx`** reapplies the current URL on **`pageshow`** when **`event.persisted`** so the router reconciles after back/forward cache restore.
- **Tasks page + dead sidebar clicks — verified root cause (2026):** **`document.elementFromPoint`** at the **Dashboard** rail icon center on **`/tasks`** returned **`main#content` / Projects OS `h1`**, not the **`Link`**, while **`elementsFromPoint`** listed the **`A[data-nav=sidebar-dashboard]`** *below* **`main`** in the stack. **Computed styles:** **`#app-sidebar-rail`** had **`z-index: auto`** (Tailwind **`z-[350]`** missing from built CSS) and the main column had **`margin-left: 0`** (responsive **`!md:ml-14` / `!lg:ml-[100px]`** not emitted). So **`#main-content`** painted full width from **x=0** and **stacked above** the rail in hit order — **only obvious on dense `/tasks`**. **Fix (source of truth):** **`src/index.css`** — **`#app-sidebar-rail { z-index: 350; isolation: isolate; }`**, **`[data-syncscript-dashboard-main]`** margin-left **0 / 3.5rem / 100px** at **md/lg**, **`[data-syncscript-guest-banner]`** left offset to match rail. **`DashboardLayout`** main shell **`data-syncscript-dashboard-main`**; **`GuestModeBanner`** **`data-syncscript-guest-banner`**. Still remove **`!z-[110]`**-style dialog overrides; modals stay **`z-[400]`** (above rail). **`TasksGoalsPage`** opacity-only motion + **`overflow-x-hidden`** remain good hygiene.
- **Correct pattern (current `App.tsx`):** **`DashboardShell`** = `DashboardProviders` + **`<Outlet />`**, with **all** dashboard `Route` entries as **siblings’ children** of that pathless layout route — **one** top-level `<Routes>` tree only.
- **Guard:** `npm run guard:dashboard-route-shell` (also enforces removal of `DashboardRoutes()`).
- **Contract tests:** `tests/dashboard-route-outlet-regression.test.mjs` (in `npm test`) — shell + sidebar paths vs `App.tsx` routes.
- **E2E:** `npm run test:e2e:dashboard-nav` — **`CI=true`** build (skips flaky local prerender) + Playwright: dev-guest session, `/tasks` → sidebar **Dashboard** / **Calendar**, `/dashboard` → **Tasks**. Actions scoped to **`#app-sidebar-rail`**; uses real **`.click()`** once shell CSS is correct. **`e2e/*.diag.spec.ts`** ignored by Playwright (local hit-test probes). **CI:** `.github/workflows/ci.yml` job **`dashboard-nav-e2e`** runs this on push/PR to `main`.
- **Deploy:** Production is Vercel (`vercel deploy --prod`); custom domain **`www.syncscript.app`** aliases the latest production deployment after build completes.
- **Sidebar:** Primary nav uses **`react-router` `Link`** on a **`fixed`** rail; **`z-index` / `isolation`** from **`index.css` `#app-sidebar-rail`** (do not rely on Tailwind arbitrary **`z-[350]`** alone for the shell). Stable hook **`id="app-sidebar-rail"`**. Extension-heavy browsers can still interfere — compare with extensions disabled on `*.syncscript.app` if clicks fail.
- **Console noise:** Logs from **`uw.js` / `LogAggregator` / `chrome-extension://…`** are **browser extensions** (e.g. video/site helpers), not SyncScript — they are unrelated to router state; **`runtime.lastError` … bfcache** is extension lifecycle, not app logic.

## Agent ergonomics — patterns from Anthropic Claude Code (public repo)
**Source of truth reviewed:** `claude-code-main.zip` (GitHub **`anthropics/claude-code`**) — **plugins, examples, and workflow markdown**, not the proprietary CLI binary. Official docs: [Claude Code overview](https://code.claude.com/docs/en/overview), [plugins](https://docs.claude.com/en/docs/claude-code/plugins), [hooks](https://docs.anthropic.com/en/docs/claude-code/hooks).

**Disambiguation:** **Claude** (models) and **Claude Code** (agentic coding product) are not the same thing. This section copies **product design patterns** that are portable to any serious agent setup—including **Cursor + this repo**—not claims about model rankings.

### What that codebase does well (engineering, not hype)
1. **Composable plugins** — `plugin.json` + optional `commands/`, `agents/`, `skills/`, `hooks/`, `.mcp.json`; teams ship one concern per plugin (`plugins/README.md`).
2. **Guardrails as data** — e.g. `examples/settings/settings-strict.json`: tool **allow/deny/ask**, **sandbox** network knobs, `allowManagedHooksOnly`, managed permission rules only.
3. **Lifecycle hooks** — `PreToolUse` can **block** bad tool input (exit `2` = stop and show stderr to the agent); `SessionStart` injects context; other plugins use `Stop` for controlled loops (`examples/hooks/bash_command_validator_example.py` + hookify / ralph-wiggum / security-guidance in `plugins/README.md`).
4. **Slash commands as markdown + scope** — `.claude/commands/*.md` use YAML frontmatter (**`allowed-tools`**, **`description`**) and shell injection (`!` \`command\`) so one invocation = bounded git/PR work (e.g. `commit-push-pr.md`).
5. **Parallel specialized reviewers** — `code-review` and `pr-review-toolkit` split work (CLAUDE.md compliance, bugs, tests, types, simplification) instead of one vague “review the PR.”
6. **Security posture** — `SECURITY.md` points to **HackerOne VDP**; `security-guidance` plugin hooks file edits for risky patterns.

### Map Claude Code → SyncScript (Cursor + repo)
| Claude Code idea | What we already have | Strongest upgrade path |
|------------------|----------------------|-------------------------|
| Project memory file (`CLAUDE.md`) | **`MEMORY.md`**, **`AGENTS.md`**, **`USER.md`**, **`SOUL.md`**, `memory/YYYY-MM-DD.md` | Keep **one curated** `MEMORY.md`; daily files = raw, this file = decisions + ops |
| Cursor-style **rules** | **`.cursor/rules/*.mdc`** (SSR, protected files, perf/SEO, desktop-shell reload) | Add rules only when a mistake **repeats**; avoid duplicate prose across rules vs MEMORY |
| **Skills** (`SKILL.md` trees) | Cursor **skills** (global `~/.cursor/skills-cursor/`, Codex `~/.codex/skills`) | Put **repeatable procedures** (OpenAI docs, Canvas, etc.) in skills; link from AGENTS.md |
| **Slash command** playbooks | **`integrations/agent-playbooks/`** + `deploy/kokoro-tts-ec2/*`, `integrations/HERMES*.md` | Extend with more one-pagers as needed — same spirit as `.claude/commands` |
| **PreToolUse** hooks | **`npm run release:gate`**, **`guard:*`**, **`verify:*`**, **`.github/workflows/*.yml`** | Treat CI + release gates as **non-bypassable** hooks; extend **contract tests** when adding bridges (Hermes/Engram pattern) |
| **Strict sandbox / permissions** | Cursor sandbox, user rules, “ask before outbound” | Mirror **strict** mindset: minimal network in automation; secrets only in env / Supabase / Vercel — **never** in MEMORY |
| **Multi-agent review** | Single CI pipeline | Split optional jobs: contract vs smoke vs build (already trending in `package.json`) — add **focused** workflows before one giant job |

### High-leverage habits to steal (top tier practices, stated calmly)
- **One workflow = one outcome + bounded tools** — reduces rambling and scope creep (see `commit-push-pr.md`: single message, only git/gh tools).
- **Verifiers over opinions** — `agent-sdk-verifier-*` plugins = structural checks; our analog is **`tests/*-contract.test.mjs`** and live **`verify:*`** scripts. Prefer adding a **failing test** over a long chat reminder.
- **Block vs warn** — hooks use exit codes intentionally; align repo policy: **CI fails** on contract break; optional warnings for non-gating lint.
- **Security reminders at edit time** — we do not run Claude Code hooks inside Cursor, but we **can** run **`guard:*` / `release:gate`** before merge; keep **protected-file rules** in `.cursor` for Nexus/Energy/auth surfaces.

### Optional follow-ups (parity / polish)
- **Playbooks already live** under **`integrations/agent-playbooks/`** (deploy, Kokoro, Hermes/Engram, release gate) — no separate **`docs/agent-playbooks/`** needed (**`docs/`** is gitignored).
- When opening large PRs, manually use dimensions from **`plugins/pr-review-toolkit`** / **`plugins/code-review`** READMEs (comments, silent failures, types, tests) as a **human or second agent** review list.

**Retention:** A full extract of the zip was reviewed under `.tmp-claude-code-extract/` and removed after notes were taken—do not commit that tree.

**Python line-level audit (every `.py` file in that zip):** `integrations/CLAUDE_CODE_PYTHON_AUDIT.md` — inventory, exit-code vs JSON protocols, per-file control flow, PEP 8 spacing notes, regex literals, and SyncScript mapping. There are only **11** Python files; the rest of Claude Code is not Python.

**Non-Python assets (workflows, slash commands, settings, hookify examples):** `integrations/CLAUDE_CODE_NONPYTHON_INVENTORY.md` — what exists upstream, what we **did not** copy (copyright / secrets), and how we integrated patterns.

**Integrated playbooks (git, Edge deploy, Kokoro recovery, Hermes/Engram verify, release gate, guardrail mapping):** `integrations/agent-playbooks/README.md`. Cursor slash-style shortcuts: `.cursor/commands/deploy-edge-supabase.md`, `kokoro-tts-recovery.md`, `verify-hermes-engram.md`. Rule: `.cursor/rules/06-agent-workflow-playbooks.mdc`.

---

## Cursor chat history vs this file
- **Past SyncScript work in Cursor** is stored as **JSONL transcripts** under the machine-local path  
  `~/.cursor/projects/Users-Apple-syncscript/agent-transcripts/` (one folder per chat UUID; **not committed to git**).
- **This `MEMORY.md` is the curated, repo-backed handoff.** Transcripts are useful for **search** (e.g. “Kokoro”, “nexus-guest”, “vercelignore”) but can be **stale**—always confirm against **current code**, **`vercel.json`**, and **`.cursor/rules`**.

### Themes that show up repeatedly in those transcripts (SyncScript)
| Topic | Notes |
|--------|--------|
| **Nexus “brain”** | Versioned JSON under `api/ai/_lib/nexus-brain/` (manifest, pricing, product facts); wired into guest/user routes. |
| **Nexus tools live verify** | `npm run verify:nexus-tools-live` — Step 1: real `callChatCompletion`+tools; Step 2: `runNexusToolLoop` + GET `/tasks`. JWT sources: env vars, or **Supabase CLI** (logged in): `supabase projects api-keys --project-ref kwhnrlzibgfedtxpkbgb -o json` includes **legacy `service_role`** (never paste into git/MEMORY). Vercel has `SUPABASE_ANON_KEY` only; Edge secrets store digests, not plaintext. Local `.env`: `SUPABASE_SERVICE_ROLE_KEY` for bootstrap. CI: `.github/workflows/nexus-tools-live.yml` maps `ENGRAM_LIVE_USER_JWT` → `NEXUS_LIVE_TEST_JWT`. |
| **Landing voice pipeline** | `NexusVoiceCallContext` → `POST /api/ai/nexus-guest` (stream) → `POST /api/ai/tts` (Kokoro); preset **`cortana`** aligned with desktop companion. |
| **TTS / Vercel** | `KOKORO_TTS_URL`, `GET /api/ai/tts` health, optional **`?probe=1`**; shared **`src/utils/tts-proxy-session.ts`** so **`useVoiceStream`** (e.g. task template chunks) does not spam the proxy after **`NO_TTS_URL`**. **Stable prod (EC2 + named Cloudflare tunnel, not laptop):** **`deploy/kokoro-tts-ec2/NAMED_TUNNEL_SETUP_RUNBOOK.md`**. **Apply + verify:** `bash scripts/apply-vercel-kokoro-tts.sh 'https://YOUR_KOKORO_ORIGIN'` or `./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh '…URL…'` then **`npm run verify:kokoro:env`** / **`npm run verify:kokoro:env:post`**. |
| **Vercel deploy constraints** | Hobby **≤12 serverless functions** — Firma merged into **`api/firma/[action].ts`**, Discord interactions merged into **`api/phone/[endpoint].ts`** + rewrite **`/api/discord/interactions`**; **`npm run guard:vercel-functions`** after `vercel build`. **`.vercelignore`** still trims some `api/ai/*` for upload size—do not re-add `api/discord/` (was blocking Discord deploy). **`phone-dispatch` cron** is **daily** on Hobby (`vercel.json`); Pro can restore **`*/5 * * * *`**. |
| **Infra** | Same themes as **`## AWS EC2 3.148.233.23`** below — Kokoro reachability is **not** the same problem as OpenClaw routing. **Oracle alternative (Always Free Ampere + keepalive):** **`deploy/oracle/README.md`**. |

## 24/7 TTS — why EC2 + named Cloudflare Tunnel (not your laptop)
**Facts (from repo + how the internet works):**
- **`api/ai/tts`** on Vercel calls **`KOKORO_TTS_URL`** over HTTPS (`/health`, `/v1/audio/speech`). Browsers may also call that same origin for direct Kokoro (`kokoroDirectOrigin`). So production needs a **reachable, stable HTTPS origin**.
- **Cloudflare Quick Tunnel** (`*.trycloudflare.com`) assigns a hostname that is **tied to a running `cloudflared` process**. When that process stops (sleep, travel, OS update, closed lid), the name often becomes **useless** (`ERR_NAME_NOT_RESOLVED`). That is **not** a bug in SyncScript; it is how account-less quick tunnels behave.
- **Your laptop** is a **single point of failure** for availability, power, network, and DNS for that tunnel. It cannot meet a **24/7** requirement by definition.

**Recommended production shape (already documented in `deploy/kokoro-tts-ec2/README.md`):**
- Run **Kokoro in Docker on EC2** (same class of host you already use for OpenClaw at `3.148.233.23`).
- Use a **named Cloudflare Tunnel** + **DNS on a zone you control** (e.g. `kokoro.<yourdomain>`). The public hostname stays **stable** across connector restarts; you rotate **`TUNNEL_TOKEN`**, not random subdomains.
- Keep **8880 bound to loopback** on the instance; **do not** expose raw `:8880` on a public security group. TLS and abuse filtering stay at **Cloudflare**; Vercel only needs **`KOKORO_TTS_URL=https://kokoro…`** and a **production redeploy** after env changes.

**Optional second line of defense:** set **`KOKORO_TTS_FALLBACK_URL`** to a **different** Kokoro base (second region or backup host), not to `syncscript.app` itself.

**Legacy note:** `SYNCSCRIPT_ARCHITECTURE.md` §31 still describes an older **quick-tunnel + tunnel-manager** story on EC2. The **current** packaged path is **`deploy/kokoro-tts-ec2/`** (FastAPI `server.py`, Compose, **named-tunnel** profile).

## Read this first (agents & humans)
- **This file is the primary handoff** for where things stand, infra, and how to unblock (especially **TTS / Kokoro**). Check here **before** assuming a bug or redeploying blindly.
- **If Nexus voice “worked before” and no app code changed:** the failure is almost always **ops** — an **expired Cloudflare Quick Tunnel hostname** or Kokoro/EC2 not running. Console `ERR_NAME_NOT_RESOLVED` to `*.trycloudflare.com` = that hostname no longer exists in DNS.
- **Stable production path (recommended):** Kokoro on **the same EC2 as OpenClaw** (`3.148.233.23`) — **named Cloudflare tunnel** to `:8880` — see **`## AWS EC2 3.148.233.23`** below and `deploy/kokoro-tts-ec2/README.md`. Laptop Quick Tunnels are **dev/smoke only** and must **not** be confused with the EC2 tunnel URL in Vercel.
- **Fast recovery when stuck on Quick Tunnel:** start Kokoro + `cloudflared`, copy the **new** `https://….trycloudflare.com`, update **`KOKORO_TTS_URL`** on Vercel (all envs you use), then redeploy or wait for serverless env refresh. Optional: `deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://YOUR_ORIGIN'`.

### Kokoro “same problem as last time” — what MEMORY already said (do not skip)
This is the **same class of failure** every time: **`KOKORO_TTS_URL` on Vercel points at a hostname that no longer resolves** (Quick Tunnel rotated/stopped) or EC2/tunnel is down. **App code is rarely the fix.**

| Step | Action |
|------|--------|
| 1 | `GET https://www.syncscript.app/api/ai/tts?probe=1` — want **`kokoroUpstreamReachable: true`**. If **`false`** / **`detail: fetch failed`**, the URL is dead from Vercel’s perspective. |
| 2 | **Prefer durable infra:** EC2 + **named** Cloudflare tunnel + stable HTTPS host — `deploy/kokoro-tts-ec2/README.md`, **`VERCEL_EC2_RECOVERY_RUNBOOK.md`**. |
| 3 | Update Vercel: `./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://YOUR_HOST'` then **`vercel deploy --prod --yes`**. |
| 4 | **Live confirmation (repo scripts, 2026-04):** `npm run smoke:prod` (routes OK; TTS line is informational). **`npm run verify:prod:live`** — full path including POST synthesis (fails until Kokoro is up). **`STRICT_TTS=1 npm run verify:prod:live`** — fail fast if probe bad. **`npm run verify:prod:live:strict`** — alias for strict. |

**Record the stable Kokoro base** in **`## AWS EC2`** placeholder once you have a named host (not a random `*.trycloudflare.com` you pasted once).

## What Is This Project?
**SyncScript** - AI-powered productivity app that works with your energy/circadian rhythms.  
- **Live at**: syncscript.app (Vercel)
- **Repo**: stringerc/syncscriptE (main)
- **Stack**: React + Vite + Tailwind + Supabase + Stripe + Twilio
- **User**: Christopher Stringer (stringer.c.a@gmail.com)

## Current State (Feb 18)
- All 8 critical improvements completed (PaywallGate, AI Assistant, Low Energy Mode, Calendar drag, Resonance Engine, Gamification animations, Team chat avatars, Visibility audit)
- Phone/Voice backend fully wired (Twilio API routes at `api/phone/`, env vars set in Vercel)
- Revenue optimization system built (UrgencyTimer, RevenueCalculator, RevenueOptimizer, useRevenueAnalytics)
- Universal AI service abstraction (`api/lib/ai-service.ts`) with 6-provider failover chain
- **Landing page**: Fully polished with section snap-scroll, 3D particle orb, Nexus voice chat, scroll-driven orb animations
- **Features page**: Enriched with interactive feature explorer (4 tabs + CSS mockups), before/after section, animated stat counters, real integration names
- **Pricing page**: Added feature comparison table, ROI calculator, expanded trust guarantees
- **FAQ page**: Added popular questions grid, enhanced contact section with response times, richer resources
- **Nexus Voice AI**: Streaming AI (Groq) + Kokoro TTS on AWS EC2, progressive audio playback, client-side grammar safety
- **3D Particle Orb**: Scroll-driven keyframe animation across all marketing pages, brightness capped at 0.5 for readability
- **Favicon:** **`public/favicon.svg`** + `index.html` `<link rel="icon">` / `apple-touch-icon` (SVG). **Optional later:** multi-size PNG/ICO for legacy — not required for modern browsers.

## Key Infrastructure
| Service | Details |
|---------|---------|
| Vercel | Project prj_PSiUt4XDI8UY9UY4wBD1sNxtcw1T, team_EqmoD0pLBFreM5tLmfqEulAl |
| Supabase | Project kwhnrlzibgfedtxpkbgb, Edge Function make-server-57781ad9 (includes Engram bridge at `/make-server-57781ad9/engram/*`; deploy with `--use-api`). **`ENGRAM_BASE_URL`:** set via `supabase secrets set` to a **public HTTPS origin** (e.g. Cloudflare Quick Tunnel from `npm run tunnel:engram-local` while local Engram listens on `:8000`). Quick Tunnel hostnames are **ephemeral** — update the secret if you restart the tunnel. |
| Twilio | Phone +18885134589, env vars in Vercel |
| Stripe | Products: Pro, Team, Resonance, Enterprise, Soulmates |
| OpenClaw | Gateway **:18789**. Supabase `openclaw-bridge` default upstream: `http://3.148.233.23:18789` when **`OPENCLAW_BASE_URL`** unset (`supabase/functions/.../openclaw-bridge.tsx`). **Oracle VM:** loopback **`127.0.0.1:18789`** — production must use **Supabase secrets** **`OPENCLAW_BASE_URL`** (HTTPS tunnel) + **`OPENCLAW_TOKEN`** matching the gateway config, not the raw instance IP. Local dev: `127.0.0.1:18789`. |
| Mission Control | mission-control/ dir, Hono :5201, Vite :5200 |

**Nexus “individual user” verify profile (agents / CI):** Run **`npm run bootstrap:nexus-verify-user`** once (needs **`SUPABASE_SERVICE_ROLE_KEY`** in `.env`). That **creates or resets** a dedicated Supabase Auth user and upserts **`NEXUS_LIVE_TEST_EMAIL`**, **`NEXUS_LIVE_TEST_PASSWORD`**, **`NEXUS_VERIFY_USER_ID`**, **`NEXUS_LIVE_TEST_SKIP_SERVICE_BOOTSTRAP=1`**. Then **`npm run verify:nexus-tools-live`** signs in with that profile (log line *Signing in with NEXUS_LIVE_TEST_EMAIL…*) and confirms **`create_task`** + **`GET /tasks`** for **that** user — not an ephemeral service-role bootstrap user. Default email is set in `scripts/bootstrap-nexus-individual-verify-user.mjs` (override with **`NEXUS_VERIFY_PROFILE_EMAIL`**). **Do not commit** `.env`; passwords are local only.

## AWS EC2 `3.148.233.23` — OpenClaw + Kokoro (same host)
**Source of truth in repo:** `SYNCSCRIPT_MASTERGUIDE.md` (Cloud TTS / systemd), `SYNCSCRIPT_ARCHITECTURE.md`, `deploy/kokoro-tts-ec2/README.md`.

| Role | Port / access | Notes |
|------|----------------|--------|
| **OpenClaw gateway** | **18789** | Edge bridge can reach `http://3.148.233.23:18789` (see `OPENCLAW_BASE_URL`). |
| **Kokoro TTS** | **8880** on **loopback** (`127.0.0.1:8880` in compose/README) | **Not** meant to be called as `http://3.148.233.23:8880` from the open internet — exposed via **Cloudflare Tunnel** on the instance (`cf-tunnel-tts` / `kokoro-tts` systemd per **MASTERGUIDE**). |
| **Vercel `KOKORO_TTS_URL`** | HTTPS **tunnel origin** only | Must be the **public hostname** Cloudflare presents to the internet (ideally a **named** tunnel / stable DNS). That is what `api/ai/tts` and `GET …/api/ai/tts?probe=1` use. |

**OpenClaw vs Kokoro (not the same thing):** **OpenClaw** is the **gateway on `:18789`** (continuity / agent routing). **Kokoro** is **only** the TTS HTTP API on **`127.0.0.1:8880`**, reached via **Cloudflare Tunnel**, not via OpenClaw. They often **share the same EC2** (`3.148.233.23`) but are **different services and ports**. OpenClaw does **not** “host” or replace Kokoro — there is no OpenClaw setting that substitutes for `KOKORO_TTS_URL`.

**How 24/7 TTS was supposed to work (repo, not this laptop):**
- **Packaged path (current):** `deploy/kokoro-tts-ec2/` — Docker Kokoro on EC2 + **`docker compose --profile named-tunnel`** + **`CLOUDFLARE_TUNNEL_TOKEN`** + a **stable public hostname** in Cloudflare (DNS on your zone, e.g. `kokoro.yourdomain.com`). See **`deploy/kokoro-tts-ec2/README.md`**, **`VERCEL_EC2_RECOVERY_RUNBOOK.md`**.
- **Legacy docs** (`SYNCSCRIPT_ARCHITECTURE.md`, `SYNCSCRIPT_MASTERGUIDE.md`): `~/kokoro-tts/tunnel-manager.sh` + **`cf-tunnel-tts.service`** on EC2 — Quick Tunnel on the **server** with optional Vercel auto-sync. That pattern is **brittle** (random `*.trycloudflare.com` still changes when the process restarts). Prefer the **named tunnel** profile in `docker-compose.yml` so the **hostname stays fixed**; you rotate **tunnel token**, not the public URL.
- **Laptop Quick Tunnel** (`cloudflared tunnel --url http://127.0.0.1:8880` on a Mac): fine for **smoke tests** only. If Vercel points here, TTS dies when the **Mac sleeps** or `cloudflared` stops — that is **not** the 24/7 design.

**Checklist — move production off the laptop onto durable EC2 + named tunnel:**
1. **Cloudflare** → Zero Trust → **Tunnels** → create or select a **named** tunnel → **Public hostname**: HTTPS → service **`http://localhost:8880`** (connector will run on EC2 alongside Kokoro). Copy the **public origin** (e.g. `https://kokoro.example.com`) — it should **not** change when `cloudflared` restarts.
2. **EC2** (`3.148.233.23` or new instance): Docker + copy `deploy/kokoro-tts-ec2/` → `/opt/kokoro-tts-ec2`, `.env` with **`CLOUDFLARE_TUNNEL_TOKEN`**, then `docker compose --profile named-tunnel up -d --build`.
3. On EC2: `curl -sS http://127.0.0.1:8880/health` → OK; from your machine: `curl -sS 'https://YOUR_PUBLIC_HOST/health'` → OK.
4. **Vercel:** `./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://YOUR_PUBLIC_HOST' --all-environments` then **`vercel deploy --prod --yes`** (or git deploy that triggers a build).
5. Verify: `npm run verify:tts:production:post` and `GET https://www.syncscript.app/api/ai/tts?probe=1` → **`kokoroUpstreamReachable: true`**. Broader prod check: **`npm run verify:prod:live`** or **`npm run verify:prod:live:strict`** (includes Firma + Discord smoke + TTS POST).

**SSH / access (from MASTERGUIDE):** `ssh -i ~/.ssh/syncscript-ec2.pem ubuntu@3.148.233.23` — then `sudo systemctl status kokoro-tts` / `cf-tunnel-tts` **if** those units exist, or `docker compose ps` under `/opt/kokoro-tts-ec2`. **2026-04 agent note:** this workspace had **no** `syncscript-ec2.pem` and SSH to **`3.148.233.23:22` timed out** — fix **key on disk**, **security group** (your IP → :22), or use **Cloudflare / AWS console** to confirm tunnel + instance state without SSH.

**Record the stable Kokoro base (named tunnel only; no trailing slash) once provisioned:** `https://________________`

## Oracle Cloud OCI — Ampere VM (SyncScript host)
**Runbook:** **`deploy/oracle/README.md`**. **Instance:** `syncscript-a1-retry-2`, **public** **`157.151.235.143`**, shape **VM.Standard.A1.Flex** **4 OCPU / 24 GB**. **Repo on VM:** **`/opt/syncscript`** (rsync from Mac; large dirs like **`nature-cortana-platform/`** excluded to save time).

| Service | Port / check | Notes |
|--------|----------------|--------|
| **Kokoro (Docker)** | **`127.0.0.1:8880`** → `GET /health` **200** | **`deploy/kokoro-tts-ec2`**: `docker compose up -d --build`. **Public HTTPS** needs **named Cloudflare tunnel** (`--profile named-tunnel`, **`CLOUDFLARE_TUNNEL_TOKEN`** in `.env`) per **`NAMED_TUNNEL_SETUP_RUNBOOK.md`**. |
| **OpenClaw** | **`127.0.0.1:18789`** TCP | **systemd** `openclaw-gateway`: **`openclaw gateway run --port 18789 --bind loopback`**. **2026.4.x** rejects `--bind 127.0.0.1` (use **`loopback`**). **`gateway.mode=local`** in **`~/.openclaw/openclaw.json`** is required ( **`deploy/oracle/vm/ensure-openclaw-gateway-config.sh`** runs **`openclaw config set gateway.mode local`**). Expose via **Cloudflare** → **`http://127.0.0.1:18789`**; set **`OPENCLAW_BASE_URL`** to the **HTTPS** origin. |
| **Hermes executor** | **`127.0.0.1:18880`** → `GET /health` **200** | **systemd** `hermes-executor` — **`integrations/hermes-executor-server.mjs`** (real **`PUT /tasks`**, **`POST /calendar/hold`** with **`provider`**: auto / google / outlook via Edge; JWT forwarded from **`hermes-bridge`**). Tunnel + **`HERMES_BASE_URL`**. **`npm run hermes:mock`** remains for local stubs. |
| **Keepalive** | timer | **`syncscript-keepalive.timer`** (Docker + local probes; WARN/FAIL until all listeners are up). |

**Networking:** VCN **security list** must allow **TCP 22** from **your** IP (or SSH fails even with the right key). **SSH:** `ubuntu@157.151.235.143` — private key must match **instance metadata** (mismatched key file → `Permission denied`).

**Still manual for production parity with Vercel/Supabase:** Cloudflare hostnames for Kokoro / OpenClaw / Hermes; **`./deploy/kokoro-tts-ec2/scripts/update-vercel-kokoro-url.sh 'https://…'`** + **`vercel deploy --prod --yes`**; Supabase secrets for **`OPENCLAW_BASE_URL`** / **`HERMES_BASE_URL`**. **Optional:** Engram on **:8000** per README §10.

### syncscript.app ↔ Oracle stack — verification (fact-based, 2026-04-15)

**Current integration (wired + probed):** **Vercel** **`KOKORO_TTS_URL`**, **Supabase secrets** **`OPENCLAW_BASE_URL`**, **`OPENCLAW_TOKEN`**, **`HERMES_BASE_URL`** point at **Oracle VM** services via **Cloudflare Quick Tunnels** (ephemeral **`*.trycloudflare.com`**). **Edge** **`openclaw-bridge`** health uses OpenClaw **`GET /healthz`** (not **`/api/health`** — OpenClaw **2026.4.x**).

| Check | Command | Expected |
|--------|---------|----------|
| **Kokoro → Vercel** | **`node scripts/verify-kokoro-env.mjs`** | Exit **0**, **`kokoroUpstreamReachable: true`** |
| **Hermes → Edge** | **`ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:hermes:edge-live`** | **`hermesStatus: 'connected'`** |
| **OpenClaw → Edge** | **`ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:openclaw:edge-live`** | **`openclawStatus: 'connected'`** |

**VM automation:** **`deploy/oracle/scripts/start-quick-tunnels-on-vm.sh`** restarts Kokoro compose **quick-tunnel** profile + Docker **cloudflared** for **:18880** (Hermes) and **:18789** (OpenClaw). After any tunnel restart, URLs change — re-run **`update-vercel-kokoro-url.sh`**, update Supabase secrets, **`vercel deploy --prod --yes`**, **`npm run deploy:edge:make-server`**.

**Next hardening (recommended):** **`CLOUDFLARE_TUNNEL_TOKEN`** in **`deploy/kokoro-tts-ec2/.env`** + **`docker compose --profile named-tunnel up -d`**, plus **separate named tunnels** (or one tunnel with multiple hostnames) for Hermes/OpenClaw so hostnames stay stable.

## Deployment map (what runs where)
**Scope:** This file + repo are the durable record. Cursor agents only see the workspace unless you attach other paths.

| Artifact | How it reaches production | Verified in repo |
|----------|---------------------------|------------------|
| **React / Vite app** | **Vercel** builds from `vercel.json` (`npm run build`, output `build/`). Git integration: `"git": { "deploymentEnabled": true }` — pushes to the linked branch trigger Vercel; **not** the same as GitHub Actions “deploy”. | `vercel.json` |
| **GitHub CI** | `.github/workflows/ci.yml` — on push/PR to `main`: `npm ci`, `tsc --noEmit`, `npm run build` with placeholder Supabase env. **CI validates; it does not replace Vercel’s deploy.** | `.github/workflows/ci.yml` |
| **Vercel CLI** | Optional manual: `vercel` / `vercel --prod` from project root (see `src/DEPLOY_TO_VERCEL.md`). | `src/DEPLOY_TO_VERCEL.md` |
| **Supabase Edge Functions** | From a machine with CLI (after `supabase login`): `supabase functions deploy make-server-57781ad9 --project-ref kwhnrlzibgfedtxpkbgb --use-api` — **`--use-api`** avoids Docker-based bundling (default `--use-docker` can hang indefinitely if Docker is idle). This is **separate** from the Vercel frontend. | `supabase/functions/`, `supabase/.temp/project-ref` |
| **api/*.ts** | Vercel serverless (`vercel.json` `functions` + `api/**`). | `vercel.json`, `api/` |

**Agent/session note:** A session can run `supabase functions deploy` or `vercel` **if** the environment has network, CLI, and your login — same as your terminal. There is no separate “hidden” deploy channel; production web updates when **Vercel** runs a build (git hook or CLI), and Edge updates when **Supabase CLI** deploy runs.

**Expanded checklist (no secrets):** **`integrations/DEPLOYMENT.md`** (tracked) → links **`integrations/agent-playbooks/`** and `vercel.json`.

## Nexus phone (Twilio) — “application error” + post-call UX (2026-03-30)
**Symptom:** During a voice call, Twilio plays *“We’re sorry, an application error has occurred”* (or similar) instead of Nexus. **Cause (fact):** Twilio’s Voice URL must return **HTTP 200** and **valid TwiML XML**. If the webhook returns **403/400 JSON** (e.g. failed signature check) or a **non-TwiML error body**, Twilio surfaces the generic application error — not our spoken fallback.

**Fix in repo:** `api/phone/_route-twiml.ts` — invalid signature in production now returns **200 + TwiML** (spoken apology + hangup) instead of `403` JSON; unknown `handler` returns TwiML instead of `400` JSON. **Also:** `truncateForTwilioSay` caps `<Say>` text (`MAX_TWIML_SAY_CHARS` ~3500) so pathological model output cannot break the Voice response.

**Tasks on calls:** Canonical tool loop persists via Edge `POST …/phone/nexus-execute` (KV `tasks:v1:userId`) — same store as `GET/POST …/tasks` in app. **Secrets:** `NEXUS_PHONE_EDGE_SECRET` must match Vercel + Supabase Edge.

**Post-call summary in app:** When tool results include `create_task` / `add_note` / `propose_calendar_hold`, server appends human lines to `/tmp`-backed storage keyed by **Twilio CallSid** (`appendPendingNexusCallLines`). After the call, `PhoneCallPanel` calls **`GET /api/phone/calls?action=pending-nexus&id=CALL_SID`** (`fetchPendingNexusCallSummary`) and shows those lines in the **“Call ended”** toast (with duration). Same ephemeral pattern as calendar `pending-events` (works when Twilio and polling hit the same Vercel region/instance).

**Verify:** `npm test` (includes `tests/nexus-phone-tools-contract.test.mjs`); place a test call and confirm toast lists actions (e.g. `Added task: …`).

## Key Env Vars (Vercel Production)
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, PHONE_API_SECRET, VITE_PHONE_API_URL, VITE_PHONE_API_KEY, APP_URL, DEEPSEEK_API_KEY, CRON_SECRET

**TTS / Nexus voice (critical):**
- **Architecture (from this file + repo):** Marketing copy says **Kokoro on AWS EC2** — production should use **`deploy/kokoro-tts-ec2`** (Docker on EC2, **named** Cloudflare tunnel → stable hostname). If **`KOKORO_TTS_URL`** on Vercel is still a **Quick Tunnel** (`*.trycloudflare.com` random subdomain), that is **not** stable; it will break whenever that tunnel process stops or restarts (no code deploy required for it to fail).
- **`KOKORO_TTS_URL`** — Vercel `api/ai/tts` proxies to Kokoro at `{origin}/v1/audio/speech`. **`GET /api/ai/tts`** returns **`kokoroDirectOrigin`** (same primary URL) so the browser can call Kokoro **directly** if the proxy fails — no OpenAI, no extra keys.
- **Cloudflare Quick Tunnel hostnames expire** when the tunnel restarts; if you see `UNREACHABLE` / 503 / **`ERR_NAME_NOT_RESOLVED`**, set **`KOKORO_TTS_URL`** to the **current** tunnel origin (no trailing slash) and redeploy; the SPA picks up the new origin via `GET` without a separate `VITE_*` rebuild.
- **`KOKORO_TTS_FALLBACK_URL`** — Optional second Kokoro base URL (same API shape; server proxy only).
- Optional dev: **`VITE_KOKORO_TTS_URL`** + **`VITE_ALLOW_CLIENT_DIRECT_KOKORO=true`** for local direct calls without relying on `GET`.

## User Preferences
- "Scripts" not "workflows"
- Complete thorough responses (one message, not fragments)
- No raw API errors in UI
- Dark theme, teal/purple accents
- Supabase native OAuth (not Make.com) for login
- "Most advanced" direction for features

## Guest mode — navigation “dead” (recurring)
**Symptom:** Guest session loads, but sidebar tabs or mobile bottom nav feel unclickable / navigation does nothing.

**Root causes (stacking / hit-testing, not React Router):**
1. **GuestModeBanner** is `position: fixed` full-width (`left-0 right-0`) at `z-50`, while the **Sidebar** had no z-index. The banner sat **above** the entire left rail and swallowed pointer events on the sidebar.
2. **CookieConsentBanner** used `z-50` while **MobileNav** used `z-40`. After guest boot (storage cleared), the cookie bar often appears and **blocks the bottom tab bar**.

**Fix (layout):** Banner uses `md:left-14 lg:left-[100px]` so it only spans the main column (matches sidebar widths). Sidebar gets `relative z-30` so it stays above the main `z-10` column if anything overlaps. Cookie banner uses `z-30` so mobile nav (`z-40`) stays on top.

**Files:** `GuestModeBanner.tsx`, `Sidebar.tsx`, `CookieConsentBanner.tsx`.

## Nexus landing voice (intro vs replies)
**Intro (fast):** By default the first line uses a **bundled MP3** (`/audio/nexus-greeting.mp3`, env **`VITE_NEXUS_STATIC_MP3_GREETING`** — default on; set to `false` to force Kokoro for the greeting too). No Kokoro call for that line.

**Replies:** `fetchTTSBuffer` calls **`POST /api/ai/tts`**, then **`fetchDirectKokoroBuffer`** using **`kokoroDirectOrigin`** from **`GET /api/ai/tts`** (or dev `VITE_KOKORO_TTS_URL`). **No** browser `speechSynthesis` in Nexus (contract tests enforce this).

**Ops checklist when voice dies after intro:** `GET https://www.syncscript.app/api/ai/tts` — confirm `kokoroConfigured` and a non-null **`kokoroDirectOrigin`**. **`GET https://www.syncscript.app/api/ai/tts?probe=1`** — Vercel HTTP-fetches Kokoro **`GET {kokoroDirectOrigin}/health`** (see `deploy/kokoro-tts-ec2/server.py`). You want **`kokoroUpstreamReachable: true`**. If **`false`**, the tunnel/EC2 endpoint is down or the hostname no longer resolves — update **`KOKORO_TTS_URL`** to a **live** origin (`deploy/kokoro-tts-ec2/README.md` for stable EC2 + named tunnel).

**Important — not a code/deploy conflict:** `kokoroConfigured: true` only means **`KOKORO_TTS_URL` is set on Vercel**, not that the host resolves or Kokoro is up. If `POST /api/ai/tts` returns **503** (`UNREACHABLE` / `KOKORO_ERROR`), the browser direct path uses the **same** URL from `kokoroDirectOrigin` — it will also fail until the tunnel URL is **current** (Quick Tunnel hostnames die when the tunnel restarts). **Fix ops:** start Kokoro + `cloudflared`, copy the new `https://….trycloudflare.com`, set **`KOKORO_TTS_URL`** on Vercel (no trailing slash), save; optional **`vercel deploy --prod`** so the edge is fresh. Hard-refresh the site (cache-busted JS) after a frontend deploy.

**No OpenAI TTS** — replies are Kokoro-only; there is nothing in `MEMORY.md` that overrides that in code.

## Detailed History
See `memory/2026-02-16-full-session-history.md` for comprehensive session extract.
