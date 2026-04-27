# SyncScript Project Memory (Quick Reference)

> **Memory hygiene (added 2026-04-25 night):** Active dated entries are kept in this file for the **current quarter** (Q2 2026 = Apr–Jun) plus evergreen ops sections (Twilio TwiML 200 fix, Kokoro tunnel debugging, env var catalog). When this file passes ~1000 lines, walk dated sections oldest-first and ask "is this still the canonical answer for someone hitting this symptom today?" If no, condense to a one-liner and link to the daily log under `memory/YYYY-MM-DD.md` (gitignored, local-only — that's the raw record). The 2026-03-30 Twilio entry is the canonical example of "old date, still active": it stays because the underlying TwiML rule is still load-bearing.

### Quick context for new chats (keep concise; edit when workflows change — stale bullets confuse agents)

- **Stack:** Vite/React dashboard, Vercel **`api/*`**, Supabase Edge; production deploy flows vary by change type (see dated entries below).
- **Start here:** **`SESSION_START.md`** → this file (quick section first) → **`AGENTS.md`**, **`SOUL.md`**, **`USER.md`** (repo; full personal context may be **`~/USER.md`**).
- **Cursor:** Always-on **topic index** (not full MEMORY) → **`.cursor/rules/07-syncscript-app-knowledge.mdc`**. Full detail stays **here** in git; Cursor has no separate “vector ingest” for arbitrary MD—**curated rules + this file** is the supported pattern.
- **Rules:** **`.cursor/rules/`** — never violate **`02-protected-files-never-touch.mdc`** (Nexus/energy/auth surfaces).
- **Ship:** Small diffs; **`npm test`** when touching Nexus tools/voice/contracts; **`CI=true npm run build`** for risky UI. **After a meaningful prod deploy:** run **`npm run verify:prod-build`** until **MATCH**, or Actions **Verify production HTML build fingerprint** / **Production dashboard smoke** — **`npm test` green does not prove prod matches git.**
- **Dashboard weather spinner (infinite):** The AI Focus **Weather & Route** strip used **`useWeatherRoute`** → **`getWeatherCoords()`** → `navigator.geolocation.getCurrentPosition`. If the browser **never** invokes success/error (stall), **`fetchWeather` never ran** and **`loading` stayed true** → **`animate-spin` forever**. **Fix (2026-04-17):** **`getWeatherCoords`** now **`Promise.race`**s geolocation against a **~5s deadline** and always resolves (cache or **`WEATHER_COORDS_FALLBACK`**); **`fetchWeather`** uses **`try/finally`** so **`setLoading(false)`** always runs; mount effect falls back to **`WEATHER_COORDS_FALLBACK`** on any throw. Files: **`src/utils/weather-geolocation.ts`**, **`src/hooks/useWeatherRoute.ts`**.
- **App AI voice overlay stacking:** Immersive voice UI rendered inside the dashboard tree could sit **under** fixed chrome; **`AppAIPage`** now **`createPortal(..., document.body)`** with **`z-[530]`** so the full-screen orb layer paints above the shell.
- **Hermes “Agent runs” dock:** **`src/components/agent/AgentRunDock.tsx`** is **`return null`** and is **not mounted** in **`App.tsx`** — if you still see “Hermes smoke” / agent steps, it is likely an **old deploy**, **another surface**, or **browser extension**; repo has no other match for that copy.
- **Nexus voice / App AI:** Signed-in chat + voice use **`NEXUS_USER_CHAT_PATH`** (**`src/config/nexus-vercel-ai-routes.ts`**) → same-origin **`/api/ai/nexus-user`** + tools (not OpenClaw). Do not hard-code **`www.syncscript.app`** for Nexus routes — breaks local/preview. **`emitNexusTrace`** logs **`toolTraceEntries`** + **`toolRepairNudged`** on success — see **`integrations/research/NEXUS_OBSERVABILITY_AND_QUALITY.md`**. Canvas, map embed, **`update_document`** — **§ Nexus Voice** below.
- **Nexus voice client auth (Bearer):** **`src/utils/nexus-voice-user-client.ts`** (`postNexusUserVoiceTurn`) sends **`Authorization`** from **`supabase.auth.getSession()`** first (refreshed JWT), falling back to React **`accessToken`**; on **401**, **`refreshSession()`** + **`getSession()`** and **one retry** — avoids **`nexus-user`** 401 when context lags **`TOKEN_REFRESHED`**.
- **Nexus voice — delegation UX (one Nexus voice):** **`NexusVoiceSatelliteOrbit`** + **`voiceSatellites`** / **`satelliteClearTimerRef`** in **`VoiceConversationEngine`**: loading → resolved **delegation hints** from **`toolTraceToDelegationHints`** (specialists as **attribution**, not extra speakers); transcript line **`via …`** matches in-app chat chips; immersive orb + under-orb **“Nexus is thinking…”** while tools run.
- **Nexus voice orb — `compact` prop (2026-04-19):** **`NexusVoiceMinimalCircle`** must **destructure `compact`** from props. Callers (**`VoiceConversationEngine`**) pass **`compact` / `compact={false}`**; the component used **`compact`** in **`orbShellStyle(..., compact)`** without binding it → **`ReferenceError: compact is not defined`** on opening App AI voice. Fix: **`compact = false`** in props + type **`compact?: boolean`**.
- **Nexus `/api/ai/nexus-user` 500:** **`POST /api/ai/nexus-user`** returns **`500`** when **`isAIConfigured()`** is false (no **`GROQ_API_KEY` / `NVIDIA_API_KEY` / …** on Vercel — see **`api/_lib/ai-service.ts`** `PROVIDERS`) or when the LLM/tool loop **throws** (provider outage, bad response). **Response JSON** now includes **`errorCode`** (`ai_unconfigured` | `llm_failed`) and often **`detail`** (safe substring of the server error) + **`requestId`**. **Client:** **`nexus-voice-user-client`** merges **`detail`** into **`error`**; **`VoiceConversationEngine`** no longer **throws** on 4xx/5xx — shows **toast** + offline fallback TTS. **Smoke (no JWT):** **`npm run verify:prod:nexus-user-smoke`**. **Signed-in probe:** `NEXUS_SMOKE_BEARER=<jwt> node scripts/smoke-nexus-user-prod.mjs`.
- **Nexus signed-in E2E (prod):** Bootstrap **`npm run bootstrap:nexus-verify-user`** → push secrets **`npm run secrets:github:nexus-e2e`** → Playwright **`npm run test:e2e:nexus-signed-in-smoke`** / **`test:e2e:nexus-app-ai-parity-deep`** / **`npm run test:e2e:nexus-task`** (chat **`create_task`**) / **`npm run test:e2e:nexus-voice-classic-task`** (**Call Nexus** classic → text input → same **`postNexusUserVoiceTurn`** / **`create_task`**) / **voice shell UI** **`npm run test:e2e:nexus-voice-immersive-prod`** → Actions **“E2E Nexus signed-in (prod)”** + **“E2E Nexus voice immersive (prod)”**. Full steps — **§ Nexus “individual user” verify profile**.
- **Nexus voice — task/calendar modals:** **`create_task`** / **`add_note`** → **`TaskDetailModal`**. **`propose_calendar_hold`** (voice): **`addEvent`** + **`postCalendarHold`** (Edge **`POST /calendar/hold`**) when signed in → **`sync_group_id`** + provider instances on success; **`EventModal`** + **`LinkedCalendarEventModal`** (**`onManageLinkedCalendars`**, **`stackAboveVoiceShell`**). If no calendar connected (**`NO_CALENDAR`**), local event still saves; Nexus may prompt to link **Google / Outlook** (Settings → Integrations). **Phone:** task-shaped hold unchanged. **Nexus product rule:** users should be able to do **anything the web app allows** via Nexus on **voice**, **in-app chat**, or **phone** where technically feasible; gaps = backlog + this MEMORY.
- **Nexus voice latency / 504:** Voice uses **`postNexusUserVoiceTurn`** → single **`fetch`**; STT can show text while the UI waits for **full** JSON. **`vercel.json`** sets **`api/**/*.ts`** **`maxDuration: 300`** (was 60) so **`nexus-user`** multi-round **`runNexusToolLoop`** + cold start is less likely to hit **504 Gateway Timeout** (requires **Vercel Pro**-tier max duration; Hobby caps lower — check dashboard). **`runNexusToolLoop`** still allows several LLM rounds + tools + nudges. **Profile:** `localStorage.setItem('SYNCSCRIPT_VOICE_LATENCY','1')` reload → **`voice-latency-debug.ts`** + **`voiceLatencyLogNexusCorrelation`**. **Immersive orb:** **“Nexus is thinking…”** while **`isProcessingAI`**; **`clearInterimTranscript`** on turn start. **UI:** **`VoiceConversationEngine`** treats **502/503/504** with offline fallback + toast (not a thrown error). Dated detail: **2026-04-11** entry below.
- **Orchestration:** OpenClaw / Hermes / Engram = runtime tools — not a substitute for repo + MEMORY.
- **Deploy vs repo:** `npm run verify:prod-build` compares **local `git` HEAD** to **`<!-- syncscript-build:sha -->` in live `/` HTML**. If it fails with “no marker,” production is **not** serving a build from current `vite build` (wrong Vercel project/branch, or deploy not run).
- **UX/UI bar:** **`.cursor/rules/11-ux-ui-excellence.mdc`** (always-on behaviors) + **`integrations/research/UX_UI_REFERENCE_CANON.md`** (Figma Community workflow + world-class links). **Semantic tokens** in **`src/styles/globals.css`** — **`integrations/research/DESIGN_TOKENS_SYNCSCRIPT.md`**. **Antigravity vs Cursor:** **`integrations/research/ANTIGRAVITY_VS_CURSOR.md`**. Kits inspire **tokens and patterns** — code + **03/04** gates remain source of truth.
- **Design handoff (“design something”):** When the user asks to **design** UI or visuals, follow **`.cursor/rules/13-design-handoff-n8n-figma-cursor.mdc`** and **§ Design handoff pipeline** below — **n8n** orchestrates webhooks/HTTP (Gemini, Imagen, NVIDIA, etc.); **Figma** is visual truth (not magic image→code); **Cursor** implements with **tokens** + **11/03/04**. Not a single unattended end-to-end pipe without human or plugin steps.
- **OpenClaw / ClawHub / skill audits (read-only):** **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`**. Weekly CI runs **`skill:source-audit:ci`** (artifact **`reports/skill-audit/`** in the zip) — **triage one slug per run** with **`clawhub inspect`**, file **`integrations/research/skill-evaluations/`**, optional **`gh issue create`** (labels **`triage`** + **`skills`** — **`npm run gh:labels`** once per repo). Full local audit: **`npm run skill:source-audit`**. **No auto-install** — **`integrations/research/WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md`**. **Cursor IDE tips:** **`integrations/research/CURSOR_IDE_EXCELLENCE_SYNCSCRIPT.md`**.
- **Landing UX/perf ritual:** Monthly **Lighthouse** on live `/` — **`.github/workflows/lighthouse-monthly.yml`** (`npm run lighthouse:ci` locally; artifact **`.lighthouseci/`**). Broader live smoke: **Production dashboard smoke** (Playwright prod + fingerprint).
- **Idle CPU / hidden tab (2026-04-26):** If marketing or dashboard still feels hot, use **Chrome DevTools → Performance**, **CPU 4× slowdown**, record **~10s** on **`/`** and **`/dashboard`**, and inspect **Main** for long **`requestAnimationFrame`** / **`Timer fired`** stacks. Playbook + file pointers: **`integrations/research/PERF_IDLE_CPU_PROFILING.md`**. **Shipped guards:** **`ScrollAmbience`** (visibility + ~30fps cap; unused today), calendar **`CurrentTimeLine`** / **`WeekView`** intervals skip work when **`document.hidden`**, **`NexusVoiceCallContext`** typewriter skips ticks when hidden + call duration from **wall clock** (not interval deltas). **PWA:** **`vite.config.ts`** **`workbox.globIgnores`** may exclude heavy optional chunks (e.g. Three vendor) from **precache** — install size, not steady FPS. **`ContinuityContext`** heartbeat stays **protected** — profile before any change proposal.
- **Dashboard visual-quality gate (2026-04-26):** **`npm run test:e2e:visual-quality`** — Playwright build + preview: three-column **geometry** (`#ai-suggestions`, `#energy-meter`, `#roygbiv-ring`), small **`toHaveScreenshot`** baselines (`/`, guest login shell, guest `/dashboard` chat closed), **Axe** on `[data-section=hero]` + guest `#main-content`; **Firefox** runs layout spec only. Refresh PNGs: **`npm run test:e2e:visual-snapshots:update`**. Post-deploy: **`npm run verify:post-deploy:checklist`** (prod HTML marker vs local git + OG/JSON-LD + **`/.well-known/security.txt`**). CI: **`.github/workflows/ci.yml`** job **`visual-quality-e2e`**. RUM SLO notes: **`integrations/research/RUM_SLO_SYNCSCRIPT.md`**.
- **This quick section:** Treat as a **control panel** — update **the same day** when deploy flow, voice stack, or test entrypoints change; stale bullets hurt agents more than a missing research note.
- **Router (2026-04-11):** Do **not** nest `<Route path="*">` under a **pathless** layout (e.g. `DashboardShell`) — in React Router 7 it can match **`/login`** before the explicit auth route, and `DashboardCatchAll` then **`Navigate`s to `/`** for logged-out users (“Sign in” bounces to landing). Keep the splat as a **root** `<Routes>` child **after** `/login` / `/signup`.

**Last updated:** 2026-04-19 — **Design handoff pipeline** (n8n / Figma / Cursor) saved — **`.cursor/rules/13-design-handoff-n8n-figma-cursor.mdc`** + **§ Design handoff pipeline** below. **Nexus voice orb:** **`NexusVoiceSpeakingDust`**, smaller **`NexusVoiceMinimalCircle`** + **`NexusVoiceSatelliteOrbit`** when shipped to prod. Earlier **`NexusVoiceMinimalCircle`** **`compact`** prop bound (voice click fix). **2026-04-11 — Nexus E2E ops:** **`npm run secrets:github:nexus-e2e`**, **`npm run deploy:vercel:prod`**, **`gh workflow run "E2E Nexus signed-in (prod)"`**; numbered runbook under **§ Nexus “individual user”**. **2026-04-17** — Dashboard weather **geo deadline** + **`useWeatherRoute` finally**; App AI voice **portal + z-index**; immersive voice **short intro** via **`generateImmersiveVoiceIntro`** (**`src/utils/voice-context-builder.ts`**). **2026-04-11** addendum: Nexus voice **~60s latency** (**`postNexusUserVoiceTurn`**, **`maxDuration`**, tool loop). Earlier: **`emitNexusTrace`** **`toolTraceEntries`** + **`toolRepairNudged`**; **`integrations/research/NEXUS_OBSERVABILITY_AND_QUALITY.md`**; **`api/cron/[job].ts`** **`concierge-playbook-tick`**. ROI ops: **`verify:prod-build`**, Lighthouse, **`gh:labels`**. Example eval: **`integrations/research/skill-evaluations/2026-04-17-playwright-mcp.md`**. **2026-04-16** Nexus: **CSP `frame-src`**, **`/api/map/resolve-map-url`**, **`update_document`** nudges (see **§ Nexus Voice**).

**2026-04-26 (idle CPU pass):** **`ScrollAmbience`** rAF stops when hidden + ~30fps cap; **`CurrentTimeLine`** / **`WeekView`** / **`useCurrentTimePosition`** skip timer work when **`document.hidden`**; **`NexusVoiceCallContext`** typewriter skips hidden ticks; call duration from **wall clock**; PWA **`globIgnores`** adds **`vendor-three-*.js`** (verified absent from **`build/sw.js`** precache list). Playbook: **`integrations/research/PERF_IDLE_CPU_PROFILING.md`**.

**2026-04-26 (prod ops — same day):** **`supabase db push`** applied **`user_onboarding_progress`** migration to **`kwhnrlzibgfedtxpkbgb`**. **`npm run deploy:edge:make-server`** shipped Stripe interval + annual SKU resolver. **`npm run deploy:vercel:prod`** completed; **`npm run verify:prod-build`** → **MATCH** (`www.syncscript.app` vs local git). Spot-check in browser: **`/trust`**, **`/changelog`**, **`/docs/api`**, **`/openapi.json`**, **`/.well-known/security.txt`**.

**2026-04-26 (evening) — git tree + Edge completeness:** `main` had **months of uncommitted Tier 0–1 work** plus **local-only noise** (Aider, Playwright screenshots, **`nature-cortana-platform/`**, root `PHASE_*` / `EX*` planning MD). Landed commits **`920c0af`** (full product + dashboard `md` three-column + API + integrations + tests), **`a654c7d`** (Edge **`hermes-bridge.tsx` / `engram-bridge.tsx`** and related routes were **missing from git** while `index.tsx` imported them — fixed), **`deb745e`** / **`0372dce`** (gitignore + SESSION). **`git status`** clean; **`npm run verify:prod-build`** **MATCH** after **`npm run deploy:vercel:prod`**.

**2026-04-26 (resume) — post-crash verification:** Fixed **`ApiDocsPage`** RapiDoc CDN URL (was a broken placeholder). **`security.txt`** + **`openapi.json`** contact lines use real **`security@`** addresses. **`TrustPage` / `ChangelogPage`** import **`Link`** from **`react-router`** (matches **`App.tsx`**). **`hasLoggedEnergy`**: **`AuthContext`** merges from **`user_onboarding_progress`** after profile fetch + listens for **`syncscript:onboarding-progress-synced`** (dispatched from **`checklist-tracking`** after successful upsert) — no **`EnergyContext`** edit (protected). **Agent runner live:** default is now **strict** (fetch failure exits 1); set repo Variable **`AGENT_RUNNER_LIVE_RELAXED=1`** during bring-up (or legacy **`AGENT_RUNNER_LIVE_VERIFY=0`**). **Chromatic:** token present no longer runs broken **`chromaui/action`** without Storybook. **CI:** Lighthouse runs against **`vite preview`** after build; App AI E2E can be hard-required with **`REQUIRE_APP_AI_E2E=1`** when secrets exist. **Full-repo `tsc`:** not green yet (legacy **`sonner@2.0.3`** imports, etc.) — CI emits a **notice** instead of blocking until cleaned up; **`npm run build`** + ESLint still gate. Fixed **`card-enhancements/*.tsx`** accidental **`className=\"...\"`** escapes; moved MIT text from **`src/LICENSE/main.tsx`** → **`src/LICENSE/MIT.txt`**; **`src/tsconfig`** excludes **`LICENSE/**`** + **`vite.config.ts`**. Contract test updated for Tier-A **`extract_links`** in **`safety.mjs`**. Verified **`npm test`** + **`CI=true npm run build`** + bundle-size script locally.

**2026-04-26 — Tier 0 + Tier 1 strategic audit pass:** Shipped the audit roadmap items that were entirely in our control (no external accounts needed). **Tier 0 A — onboarding correctness:** new server-tracked **`user_onboarding_progress`** table (RLS-scoped, realtime-published) + **`pullOnboardingProgressFromServer`** in **`src/components/onboarding/checklist-tracking.ts`** hydrates on auth-ready via **`ObservabilityIdentifier`**; existing call sites unchanged. SignupPage now navigates to `/onboarding` (matches OAuth flow). **`isFirstTime`** in **`DashboardPage`** is **`useState(() => …)`** so it can't flip mid-render. Deleted unused **`ProductTour.tsx`** + uninstalled `react-joyride`. **Tier 0 B — billing wiring:** **`BillingSettings`** mounted in Settings → Billing tab; **`BillingPlansModal.handleSelectPlan`** routes to Stripe Customer Portal (existing subs) or Checkout (new subs) instead of local-profile-only **`updateProfile`**; PricingPage passes **`interval: 'month' | 'year'`**; **`stripe-routes.tsx`** has **`resolvePriceId`** + env **`STRIPE_PRICE_<plan>_YEAR`** for annual SKUs (falls back to monthly + echoes `actual_interval` when annual not configured). Entitlements reconciled — **`SubscriptionContext`** imports **`LITE_TIER_LIMITS`** from **`utils/entitlement-contract.ts`** (single source = 5/day). **`<PastDueBanner />`** mounted in App for `past_due` / `unpaid` / `incomplete` states. **Tier 0 C — CI gates:** **`npm test`** (105 contract tests) added to **`.github/workflows/ci.yml`** as the new **`contract-tests`** job; bundle-size budget via **`scripts/check-bundle-size.mjs --max-kb=900`**; Lighthouse Perf flipped from `warn` → `error` in **`lighthouserc.cjs`**. **Tier 1 F — `/trust` portal:** **`TrustPage.tsx`** + **`public/.well-known/security.txt`** with subprocessors, encryption, GDPR/CCPA, residency, security disclosure path. **Tier 1 G — `/changelog`:** **`ChangelogPage.tsx`** reads **`public/changelog.json`** (deploy-time-editable, no rebuild required). **Tier 1 H — help widget:** **`HelpWidget.tsx`** boots Crisp / Intercom when **`VITE_HELP_WIDGET_PROVIDER`** + provider id env are set; no-op otherwise. CSP updated for both. **Tier 1 I — `/docs/api`:** **`ApiDocsPage.tsx`** uses RapiDoc CDN viewer pointed at **`public/openapi.json`** (hand-curated for `/api/agent/*` + BYOK + Webhooks + Policy + Live). **Tier 2 N — Chromatic stub:** **`.github/workflows/chromatic.yml`** that auto-skips when `CHROMATIC_PROJECT_TOKEN` secret is absent. **Tier 2 O — CWV pipeline:** **`web-vitals`** dep + **`src/observability/web-vitals.ts`** emits `cwv_lcp/inp/cls/fcp/ttfb` events to PostHog with `device` cohort. **Defense-in-depth:** **`useEmotionDetection`** rAF loop now gated on **`usePageVisibility().isVisible`** so prosody polling stops on hidden tabs (Chrome's 1Hz throttle isn't the same as zero CPU). **Deferred (need user action):** quota WRITER on task creation (Tier 0 B 6th item — backend choke point design); **D Better Uptime** + **E Vanta SOC 2** + **H Crisp/Intercom account** + **L Google Calendar OAuth client** + **M Apple Dev creds for TestFlight** + **K streaming Nexus voice** (touches `02-protected-files`). For Tier 0 B annual SKUs: create annual prices in Stripe, set Vercel env **`STRIPE_PRICE_STARTER_YEAR`** / **`_PROFESSIONAL_YEAR`** / **`_ENTERPRISE_YEAR`** — code path is already wired. New Edge migration needs **`supabase db push`**.

**2026-04-17 — Dashboard weather spinner + App AI voice:** **`getWeatherCoords`** hard deadline + **`fetchWeather` finally** end infinite **`weatherLoading`** spinners; **`AppAIPage`** voice shell **`createPortal` → `document.body`**, **`z-[530]`**; immersive auto-start uses **`useLayoutEffect`**; first-line copy from **`generateImmersiveVoiceIntro`** (short, guest-friendly); no success toast in immersive mode.

**2026-04-11 — Nexus voice + linked Google/Outlook:** Voice **`propose_calendar_hold`** → **`postCalendarHold`** + **`EventModal`** + **`LinkedCalendarEventModal`**; prompts mention calendar linking. **Nexus parity rule** (web app capabilities via voice / chat / phone) recorded in quick section.

**2026-04-11 — Nexus voice + Tasks modal parity:** Replaced **`NexusVoiceTaskPeek`** with **`TaskDetailModal`** + dialog **`overlayClassName`** / **`stackAboveVoiceShell`**; phone **`propose_calendar_hold`** still task-shaped. **`TasksContext`** refreshes on **`propose_calendar_hold`** tool traces. Voice appendix: follow-up question after mutations.

**2026-04-11 — Nexus voice ~minute-long reply (investigation):** User saw interim STT text quickly; Nexus spoken reply felt ~60s late. **Likely contributors:** (1) **`vercel.json`** **`functions.api/**/*.ts.maxDuration`** = **60** — total handler time (cold start + multi-round **`runNexusToolLoop`** in **`api/_lib/nexus-tool-loop.ts`** + provider RTT) can approach this; (2) **non-streaming** client (**`src/utils/nexus-voice-user-client.ts`**) — no bytes until the full tool loop completes; (3) **tools + nudges** (task/update_document repair) add extra LLM rounds. **Not yet a confirmed single root cause** — confirm with traces. **Shipped same pass:** immersive **“Nexus is thinking…”** under orb + **`clearInterimTranscript`**; **`SYNCSCRIPT_VOICE_LATENCY=1`** logs **`voiceLatencyLogNexusCorrelation`** with **`X-Nexus-Request-Id`**. **Next (later):** voice **fast path** / streaming / higher **`maxDuration`** if needed. **Regression discipline:** keep **`MEMORY.md`** + **`deploy/SMOKE_TEST_NEXUS_VOICE_DOC_MAP.md`** + **`npm test`** Nexus contracts in sync when changing `nexus-user` or the tool loop.

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

## Design handoff pipeline (n8n → Figma → Cursor / OpenClaw / NVIDIA)

**Cursor rule:** **`.cursor/rules/13-design-handoff-n8n-figma-cursor.mdc`** (trigger: user asks to **design** something, new **visuals**, **Figma**, or **n8n** design automation).

**Yes, as a workflow — with realistic limits:**

- **n8n** is a solid **orchestrator**: webhooks, HTTP to **Gemini** / **Imagen** / **NVIDIA-hosted** image APIs, then notify humans or post artifacts.
- The weak link is **“Gemini draws an image → Figma turns it into a design”**: **Figma does not natively vectorize** a bitmap into production UI. Typical paths: **place image on a frame and trace/rebuild with components** (manual or semi-automated **plugins**), or third-party **image→layout** tools (quality varies).
- **Figma → Cursor:** usually **Figma MCP** (or export) → **specs, structure, screenshots** → **you or the agent** write **React** to match **`globals.css`** tokens — not a magic paste-code pipe.
- **OpenClaw** can sit **beside** n8n (same HTTP/webhooks); it does **not** remove **Figma API** limits.
- **Strong pattern:** **prompt → image (Gemini/NVIDIA/etc.) → human or plugin pass in Figma → design tokens + components → Cursor implements** using **`integrations/research/DESIGN_TOKENS_SYNCSCRIPT.md`**, **11-ux-ui-excellence**, **03/04** where applicable. Deep checklist: **`integrations/research/UX_UI_REFERENCE_CANON.md`**.

**Nexus voice orb (App AI immersive):** **`NexusVoiceSpeakingDust`** (CSS twinkle while TTS), smaller **`NexusVoiceMinimalCircle`** + **`NexusVoiceSatelliteOrbit`**, optional **cyan + rose** immersive tint when speaking — files under **`src/components/nexus/`** and **`VoiceConversationEngine.tsx`**.

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

## Nexus Agent Mode — runner deploy + verified live (2026-04-25 night, prod commit `058ff5a`)

**Status: ✅ END-TO-END LIVE.** Two real smoke runs completed in production: `example.com` heading extract (2 steps, 8s, 3¢) and Wikipedia "World Wide Web" article (4 steps, 9s, 5¢). Real Playwright Chromium on Oracle ARM A1, real LLM (NVIDIA NIM Llama-3.3-70B free tier), real DB roundtrip per step, real Cloudflare exposure.

### Live infra

| Piece | Value |
|---|---|
| Oracle box | `syncscript-a1-retry-2`, public IP **`157.151.235.143`**, ARM A1 4 OCPU / 24 GB |
| SSH alias on Mac | **`ssh oracle`** (`~/.ssh/config` Host oracle, key `~/.ssh/oracle/id_ed25519` — copied from `~/Downloads/ssh-key-2026-04-14 (2).key`) |
| Container | `nexus-agent-runner` on port **`18790`** (loopback) |
| Image | **`ghcr.io/stringerc/syncscript-nexus-agent-runner:latest`** (multi-arch; auto-built by `.github/workflows/agent-runner-image.yml` on push to `main` touching `deploy/nexus-agent-runner/**`) |
| Public URL | **Cloudflare quick tunnel** docker container `cf-agent-runner-quick` (`cloudflare/cloudflared:latest`, host network, `tunnel --no-autoupdate --url http://127.0.0.1:18790`) |
| Current tunnel | `https://justin-romance-attitude-mutual.trycloudflare.com` — **EPHEMERAL**, changes on tunnel restart |
| Vercel envs (production) | `AGENT_RUNNER_TOKEN` (= `NEXUS_PHONE_EDGE_SECRET`). **`AGENT_RUNNER_BASE_URL` is now a fallback only** — see § Self-publishing tunnel URL below |
| URL stability | `public.runner_endpoints` row + Oracle systemd watchdog auto-publishes current tunnel URL — Vercel reads it at request time. **No manual env updates ever again** |
| GH repo variables | `AGENT_RUNNER_BASE_URL` (mirror), `AGENT_RUNNER_LIVE_VERIFY=1` (strict mode for nightly probe) |
| Default LLM | NVIDIA NIM `meta/llama-3.3-70b-instruct` (text-only, strong FC) — was `llama-3.2-90b-vision` but it returned prose instead of `tool_calls` under tool_choice:auto |

### Ops runbook

- **Runner status:** `ssh oracle "sudo docker ps --filter name=nexus-agent-runner --format 'table {{.Names}}\t{{.Status}}'"`
- **Runner logs:** `ssh oracle "sudo docker logs -f nexus-agent-runner --tail 200"`
- **Pull latest image / restart:** `ssh oracle "sudo /opt/nexus-agent-runner/bringup.sh"` (idempotent)
- **Tunnel logs:** `ssh oracle "sudo docker logs cf-agent-runner-quick --tail 30"`
- **Tunnel URL right now:** `ssh oracle "sudo docker logs cf-agent-runner-quick 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1"`
- **End-to-end smoke:** `vercel env pull /tmp/.env --environment=production --yes && (set -a; . /tmp/.env; set +a) && AGENT_RUNNER_BASE_URL=<tunnel> AGENT_RUNNER_TOKEN=$NEXUS_PHONE_EDGE_SECRET node scripts/smoke-agent-run-e2e.mjs && rm /tmp/.env`
- **Nightly health probe in CI:** GH workflow `agent-runner-live.yml` reads `vars.AGENT_RUNNER_BASE_URL`; soft-fails until `vars.AGENT_RUNNER_LIVE_VERIFY=1`.
- **When the tunnel URL changes** (cloudflared restart): `gh variable set AGENT_RUNNER_BASE_URL -b "<new>"` AND `vercel env rm AGENT_RUNNER_BASE_URL production --yes && printf '%s' "<new>" | vercel env add AGENT_RUNNER_BASE_URL production && CI=true vercel deploy --prod --yes`. **Long-term:** swap to a **named** Cloudflare tunnel for stable DNS — `nexus-agent-runner.syncscript.app` was reserved in the runbook but not yet provisioned.

### Three live-debug fixes shipped this session (all on `main`)

1. **`bringup.sh` self-install crashed when piped** — `$0` is `bash` not a file path under `curl … | bash`. Fix: only `cp` when `$0` is a real file; otherwise download from raw GitHub. Commit `38a6973`.
2. **Playwright `storageState` ENOENT** — Playwright treats `string` as a file path; we store JSON in vault. Fix: `JSON.parse(s)` into object before passing to `newContext`. Commit `ce744f2`.
3. **Safety gate blocked `goto example.com`** — `currentUrl='about:blank'` has empty host; `siteIsBlocked` defaulted empty host → blocked. Fix: empty host → not blocked; for `kind:'goto'`, evaluate `action.url` instead of `currentUrl`. Commit `058ff5a`.

Plus: **default NIM model swapped from vision to text-FC**, `tool_choice: 'required'` with graceful `'auto'` fallback, and a 3-consecutive-non-tool-turn abort that names the model so users know to BYOK upgrade. Commit `2b3a6b5`.

### Live CDP screencast + decisive free-tier path (2026-04-25 late night, prod commit `0de0898`)

User's #1 ask after the audit: "the live view should be the user seeing the cursor moving and typing as if they were doing it" — i.e. the same approach **Browserbase / Anthropic Operator / OpenAI Operator / Manus** use. Implemented via **Chrome DevTools Protocol screencast** broadcast over WebSocket — the architectural standard for agentic browsers.

### Architecture (the same as the top-tier products)

| Layer | Component |
|---|---|
| **Capture** | `Page.startScreencast` via Playwright CDP session — JPEG frames at quality 60, 1024x768, ~12 fps cap (`everyNthFrame` divisor). Frame emission is change-driven, not constant-rate (industry standard). |
| **Broadcast** | `runner/screencast.mjs`: per-run `Broadcaster` with multi-subscriber Set, late-join replay (sends most-recent frame to new subscriber), heartbeat ping every 20s so Cloudflare doesn't idle the WS. |
| **Auth** | `/api/agent/live-token` issues a 5-minute HMAC token (`base64url(JSON_payload).base64url(HMAC_SHA256(payload, AGENT_RUNNER_TOKEN))`). Runner verifies with `crypto.timingSafeEqual` — no Supabase round-trip per WS connection. |
| **Transport** | WebSocket at `wss://<tunnel>/v1/runs/<runId>/live?token=…`. Binary frames (JPEG bytes); text messages reserved for control (`no_active_broadcaster`). |
| **Render** | `AgentLiveCanvas.tsx` — `createImageBitmap(blob)` → `ctx.drawImage(canvas, 0, 0)`. Reconnect with exponential backoff. Status pill (LIVE / connecting / fallback). |
| **Fallback** | When WS fails or run is `done`, render the latest static screenshot from `agent_run_steps.screenshot_b64` (already populated). Graceful degradation. |

### Tightening (applied in same session)

- **Browser-side:** `goto` waits for `networkidle` (4s cap) so SPA fetches settle before extract; `extract_links` filter rejects SVG/icons/UI bundles, scores by area+alt, includes `data-src` / `data-original` / `srcset` lazy attrs; auto-scrolls twice + retries when first pass returns < 5 images.
- **Prompt:** "BUDGET DISCIPLINE — each step ≈ 1¢", explicit recipe ("goto Wikipedia → extract_links once → save N back-to-back → finish — STOP HERE"), Wikipedia recommended over image-search engines (real `<img>` tags at first paint vs JS-rendered icon grids).
- **Auto-finish:** if goal contains a number ("save 3 X"), bail as soon as N successful `add_to_resource_library` / `create_task` / `add_note` calls land — without waiting for the model to remember to call `finish()`. **Biggest single cost-of-ownership win** on free-tier Llama-3.3.

### Verified end-to-end (run `82f922e2`, 2026-04-26 03:23 UTC)

| Metric | Before fixes | After fixes |
|---|---|---|
| Status | failed (max steps) | done |
| Steps | 47 | **12** |
| Cost | 22¢ | **6¢** |
| Bookmarks saved | 0 | **3** (real `upload.wikimedia.org/.../*.jpg` URLs) |
| Live view | 0 screenshots | **3 frames / 231 KB / first frame in 3 s** |
| User experience | "saw nothing" | "Wikipedia loads, agent navigates, frames stream live" |

### How to run smoke tests yourself

```bash
vercel env pull /tmp/.env --environment=production --yes && set -a && . /tmp/.env && set +a
SMOKE_USER_ID=<uid> node scripts/smoke-agent-run-e2e.mjs           # functional test
NODE_PATH=/tmp/node_modules node scripts/smoke-agent-live-screencast.mjs   # live frames test
rm /tmp/.env
```

Both scripts now read tunnel URL from `runner_endpoints` row (Vercel-parity) instead of stale env.

## Agent Mode in-depth audit (2026-04-25 night, prod commit `d4fc8a1`)

User reported: "no live view of agent navigating; agent says it did things but didn't; cost cap reached." Real-run audit ran 6 progressive smoke tests, found and fixed 8 distinct bugs:

| # | Bug | Fix | Commit |
|---|---|---|---|
| 1 | Screenshots NEVER captured (text-only LLM disabled them entirely, but the UI still needed them) | Always capture screenshots; vision flag only controls if they go to LLM prompt | 66af0c9 |
| 2 | Default tier was 'A' (no clicks possible) — every real task failed instantly | Migration `20260426020000`: default 'B' + backfill users still on 10¢ caps; per_run_cost 10→50¢ | 66af0c9 |
| 3 | No way to grab image/link URLs without clicking — agent tried to click each result | New `extract_links` browser action (DOM evaluate) + system prompt "prefer extract_links over click" | 66af0c9 |
| 4 | Same-block infinite loop (5+ same gate-block burned cost cap with no useful action) | Repeat-block tripwire after 3 same-reason blocks; abort with "raise tier in Settings" | 66af0c9 |
| 5 | extract_links not in Tier A allowlist (it's read-only, should be allowed at A) | Added to allowlist in `safety.mjs` | 09b9061 |
| 6 | extract_links result data NEVER reached the LLM ("ok" with no payload → model loops) | Serialize links/images arrays into the `tool` history message (4KB cap) | 33b8582 |
| 7 | Same-action repeat detector didn't reset on successful tool_call → premature abort | Reset counter on any `ssRes.ok !== false` tool_call | 25162b2 |
| 8 | `/phone/nexus-execute` Edge endpoint only handles tasks, not `add_to_resource_library` etc. | Map each Nexus tool to a task with semantic prefix (`[Bookmark]`, `[Doc]`, etc.) | 8ec6356 |
| 9 | No 429 retry on NVIDIA NIM rate limits (mid-run failures with no recovery) | Exponential backoff retry for 429/5xx, honors `Retry-After` header, max 3 retries | 8ec6356 |

**Verified working end-to-end:**
- Run `ef04305f`: agent went to Google Images, extract_links, add_to_resource_library → saved real bookmark `[Bookmark] Dolphin Pictures` with `task_id=task_177717050...` and `ok=true`. Screenshots captured at every step.
- Run `2ee55b89`: agent typed search, pressed Enter, navigated to results — but extract_links got 0 images on Google's modern lazy-loaded image search. Reached max steps without saving.

**Known limitations of free-tier path** (NVIDIA NIM `llama-3.3-70b-instruct`):
1. **Planning quality** — model over-explores rather than executing the cheapest path. "Save 3 dolphin pictures" → it correctly extracts URLs and calls `add_to_resource_library`, but then keeps browsing instead of saving 2 more and finishing. **Mitigation:** BYOK Anthropic Claude Sonnet (`provider=anthropic` in BYOK Settings) handles this in 5-8 steps reliably.
2. **Lazy-loaded pages** — Google image search renders `<img>` tags via JS after initial paint. `extract_links filter=img` sees 0-2 images. **Mitigation:** prompt user to use Bing/DuckDuckGo image search, OR add a `scroll_until_loaded` action (TODO).
3. **No real "library" yet** — `add_to_resource_library` writes a task with `[Bookmark]` prefix to the existing `/phone/nexus-execute` endpoint, since the actual `user_files` library is for uploaded blobs. **Mitigation:** new `/phone/agent-execute` Edge route with a real bookmarks table — not blocking.

**What works right now (confirmed):**
- Live screenshot stream in `AgentRunStream` UI (real-time via Supabase Realtime channel `agent-run:<id>`)
- Tier-B users can click, type, navigate, scroll, extract
- Real saves to user's task list (visible in Tasks tab + as `[Bookmark]` prefix)
- 429 rate limits don't kill runs (auto-backoff)
- Same-action / same-block tripwires prevent burn-down loops

## Self-publishing tunnel URL (2026-04-25 night, prod commit `5b009b0`)

Solved the ephemeral-URL problem **without** requiring a Cloudflare account auth click. Architecture:

1. **`public.runner_endpoints`** table (migration `20260426010000_runner_endpoints.sql`) — service-role-only RLS, `(name, url, notes, updated_at)`, seeded with `name='agent_runner'`.
2. **Oracle watchdog** at `/opt/nexus-agent-runner/watchdog-tunnel-url.sh` runs every 60s via `nexus-agent-runner-watchdog.timer` (systemd). It `docker logs cf-agent-runner-quick`, greps the current `*.trycloudflare.com` URL, and `POST`s to `${SUPABASE_URL}/rest/v1/runner_endpoints?on_conflict=name` (Prefer: merge-duplicates) using the service-role key from `/opt/nexus-agent-runner/.env`. State file `/var/lib/nexus-agent-runner/last-tunnel-url` so it only writes when the URL actually changes.
3. **Vercel `/api/agent/[action]`** has `resolveRunnerBaseUrl(sb)` (60s in-memory warm cache) that reads `runner_endpoints.url` for `name='agent_runner'`. Falls back to `AGENT_RUNNER_BASE_URL` env var if the row is empty or Supabase is unreachable.
4. **Validated by full rotation test (2026-04-25 01:36 UTC):** killed + recreated `cf-agent-runner-quick` → new URL `sources-floating-variable-cardiff.trycloudflare.com` → watchdog detected within 3s of rotation → upserted to Supabase → ran end-to-end smoke against new URL: 2 steps, 7s, 3¢, summary correct. **Zero manual intervention.**

### Inspect / debug

- Watchdog status: `ssh oracle "sudo systemctl status nexus-agent-runner-watchdog.timer"` (next trigger time)
- Watchdog logs: `ssh oracle "sudo journalctl -u nexus-agent-runner-watchdog.service -n 50"`
- Force a tick: `ssh oracle "sudo systemctl start nexus-agent-runner-watchdog.service"`
- Read live row: `select name, url, notes, updated_at from public.runner_endpoints;` (service-role only)

### Owner action

- **Optional upgrade for cosmetics:** Provision a named Cloudflare tunnel (`nexus-agent-runner.syncscript.app`) so the published URL is a stable hostname instead of `*.trycloudflare.com`. Run `ssh oracle "cloudflared tunnel login"` and click the printed URL to authorize the `syncscript.app` zone. After cert lands, run `cloudflared tunnel create nexus-agent-runner && cloudflared tunnel route dns nexus-agent-runner nexus-agent-runner.syncscript.app`, swap the `cf-agent-runner-quick` Docker container for `cf-agent-runner-named`, and update the watchdog's URL extraction (or just point the tunnel at `:18790` and let the row pick up the new hostname). The system already works without this — the named hostname is a polish, not a fix.

## Nexus Agent Mode — runner deploy + voice dock + persistent contexts (2026-04-25 evening)
- **GHCR-built Docker image:** `ghcr.io/stringerc/syncscript-nexus-agent-runner:latest`. Auto-built by `.github/workflows/agent-runner-image.yml` on every push to `main` that touches `deploy/nexus-agent-runner/**`. Multi-arch (linux/amd64 + linux/arm64 — Oracle Always-Free is ARM). Cache via GitHub Actions cache.
- **One-line Oracle bringup:** `curl -fsSL https://raw.githubusercontent.com/stringerc/syncscriptE/main/deploy/nexus-agent-runner/bringup.sh | sudo bash`. Self-installs to `/opt/nexus-agent-runner/bringup.sh`; future updates: `sudo /opt/nexus-agent-runner/bringup.sh`. Validates env, pulls image, replaces container, health-probes `/v1/health` for up to 30s.
- **Live verifier:** `node scripts/verify-agent-runner-live.mjs` (added to `.gitignore` allowlist). Probes `https://nexus-agent-runner.syncscript.app/v1/health`, asserts `{ ok, started_at, active_runs, max_concurrency }`.
- **Vercel env (set):** `AGENT_RUNNER_TOKEN` matches `NEXUS_PHONE_EDGE_SECRET`. **Pending until Cloudflare DNS:** `AGENT_RUNNER_BASE_URL=https://nexus-agent-runner.syncscript.app`. Without that, runs queue cleanly and the runner picks them up via 5s poll — no crash, no hang.
- **Voice docking** — when an `agent_runs` row is in `queued/running/waiting_user/paused`, the voice portal in AppAIPage shrinks to a 240×168 top-left card (spring transition, ChevronUp icon, "Nexus is working: <truncated goal>" banner). Tap (or Enter/Space) opens the AgentRunStream overlay. New: `src/hooks/useActiveAgentRun.ts` + `src/components/nexus/VoiceDockedFrame.tsx`. **No edits to `VoiceConversationEngine.tsx`** — outer container shrinks, inner content scales naturally with `h-full w-full`.
- **Persistent browser contexts** — Playwright `storageState` (cookies + localStorage + IndexedDB) is captured at the end of every agent run and stored encrypted in Supabase Vault under `browser_ctx_<user>_default`. Next run hydrates it before launch → Gmail / GitHub / etc logins survive across runs.
  - Migration: `supabase/migrations/20260425220000_browser_contexts.sql` — table `browser_contexts(user_id PK, hostnames TEXT[], bytes, cookie_count, last_used_at)` with RLS, plus four RPCs:
    - `admin_save_browser_context(user_id, storage_json, hostnames, cookie_count)` — service_role only; rotates vault entry + upserts metadata.
    - `admin_load_browser_context(user_id)` — service_role only; returns the JSON.
    - `clear_browser_context()` — `auth.uid()` derived; user-callable to disconnect all sites.
    - `disconnect_browser_site(p_hostname)` — user-callable; reads vault, filters cookies/origins by hostname (suffix-aware), writes back. Empty result → wipes the row + vault entry.
  - Runner: `runner/browser.mjs` exports `captureStorageState()`; `runner/agent-loop.mjs` calls `admin_load_browser_context` before launch and `admin_save_browser_context` in `finally`. Both wrapped in try/catch — broken vault state can't crash a run.
  - UI: `src/components/settings/ConnectedSitesSection.tsx` — Settings → Agent → Connected sites list. Per-host Disconnect button + Clear all. Hostnames + cookie count + last-used timestamp + storage size.
- **Contract test:** `tests/agent-runner-deploy-contract.test.mjs` — 17 asserts covering GHCR workflow shape, bringup.sh idempotency + env validation, verify script, voice docking hooks/components/wiring, browser_contexts schema + RLS + RPCs + auth grants, runner storageState capture/load wiring, Settings UI integration. **Total suite now 153 + 2 passing** (was 136 + 2).
- **Owner action remaining:** SSH to Oracle, drop `.env` per `deploy/nexus-agent-runner/env.example`, `curl … | sudo bash` (one line), add Cloudflare Tunnel ingress rule, `vercel env add AGENT_RUNNER_BASE_URL production`. After that, agent runs flow end-to-end with persistent logins.

## Nexus Agent Mode (Phase 1 → 5 foundation, 2026-04-25)
- **What it is:** Per-user agent runs that drive a real headless Chromium on our Oracle Always-Free VM. The agent has TWO tool sets: browser actions (goto/click/type/scroll/screenshot/extract_text) and existing SyncScript Nexus tools (`create_task`, `add_to_resource_library`, `create_document`, `add_note`) — same `executeNexusTool` audit trail as voice/chat. Default LLM is **NVIDIA NIM** `meta/llama-3.2-90b-vision-instruct` (free); users can BYOK 8 other providers.
- **DB foundation** — single migration `supabase/migrations/20260425170000_agent_mode_foundation.sql`:
  - `agent_runs` (one per goal, lifecycle queued→running→done/failed/cancelled/waiting_user/paused), `agent_run_steps` (append-only timeline with screenshots), `agent_run_messages` (mid-run user interjections).
  - `automation_policies` (Tier A/B/C/D + caps + trusted/blocked sites + global pause). Defaults: Tier A, 5 runs/day, 50¢/day, blocks `*.gov + chase/bofa/wf`.
  - `byok_keys` metadata + vault-encrypted secret in `vault.secrets` under `byok_<user>_<provider>`. SECURITY DEFINER RPCs `admin_seed_byok_key` / `admin_read_byok_key` are service-role only.
  - `projects` namespace + `project_id` column added to existing `tasks` / `goals` / `workstreams`. RLS `user_id = auth.uid()`.
  - RPCs: `claim_next_agent_runs` (FOR UPDATE SKIP LOCKED, lease 300s), `release_agent_run_claim`, `record_agent_step`, `pending_agent_messages` (read+mark-applied), `complete_agent_run`, `check_agent_run_quota`.
- **Vercel API** — single dispatcher `api/agent/[action].ts` (Hobby cap kept at 12 by folding old `api/ai/nexus-post-call-summary.ts` into `api/phone/[endpoint].ts` + `vercel.json` rewrite):
  - `POST /api/agent/start` — auth, quota check, LLM-config resolve, INSERT `agent_runs`, fan to runner.
  - `GET /api/agent/list` (Tasks panel), `GET /api/agent/run` (detail).
  - `POST /api/agent/cancel`, `interject`, `approve` (decline = cancel).
  - `GET /api/agent/byok-list`, `POST byok-set`, `byok-delete`. Keys encrypted in vault.
  - `GET / POST /api/agent/policy` — Tier A/B/C/D + caps + lists + pause toggle.
- **LLM adapter** — `api/_lib/agent-llm-adapter.ts` + parity in `deploy/nexus-agent-runner/runner/llm.mjs`. **Nine providers, one OpenAI-compatible wire shape**: NVIDIA, OpenRouter, Gemini, OpenAI, Anthropic, Groq, xAI, Mistral, Ollama, custom_openai_compat. Anthropic uses `x-api-key` + `anthropic-version`. `estimateCostCents` per-provider so `daily_cost_cents_cap` actually means something.
- **Oracle runner (the browser engine)** — `deploy/nexus-agent-runner/`. Single Docker container on the same Oracle VM that runs Kokoro fallback. Polls every 5s via `claim_next_agent_runs` (SKIP LOCKED). Per run: Playwright Chromium, agent loop with screenshot→LLM→action, `record_agent_step` per step, `pending_agent_messages` between iterations for mid-run steering, `complete_agent_run` on done. Max concurrency 4 (4-core ARM A1, 24 GB RAM). One-command deploy via `docker run -p 18790:18790 …`; full bringup runbook in `deploy/nexus-agent-runner/README.md`.
- **Safety gate (`deploy/nexus-agent-runner/runner/safety.mjs`)**:
  - Tier A allows only `goto / screenshot / scroll / extract_text / wait / press`.
  - Destructive label match (`submit / pay / delete / confirm / buy / send …`) on click/type → block in B, request approval in C, require trusted-site whitelist in D.
  - Site allow/deny enforced regardless of tier.
- **Frontend (live on prod 3a39980)**:
  - `src/components/nexus/AppAiSidebarPanel.tsx` — tabbed right panel (💬 Chats / ✅ Tasks / 📁 Projects) with collapse arrow. Drops into AppAIPage replacing the old chats sidebar; localStorage persists tab + collapsed state.
  - `src/components/nexus/AgentTasksPanel.tsx` — agent_run rows with status icons, click → opens stream.
  - `src/components/nexus/AgentRunStream.tsx` — full-page overlay: live screenshot (Realtime channel), action timeline, "Steer Nexus mid-run" interject input, Approve/Decline buttons when paused, Stop.
  - `src/components/projects/ProjectFilterDropdown.tsx` — top-right of TasksGoalsPage. All / + New / list. Selection sticky in localStorage so AgentTasksPanel + Project OS share filter.
  - `src/components/settings/AgentSettingsTab.tsx` — Settings → Agent: BYOK keys form (provider dropdown, password input, optional model + endpoint), tier picker + caps + global pause, agent run history.
  - `src/components/settings/FilesLibraryEmbed.tsx` — Settings → Files (existing FilesLibraryPage embedded). `/library` and `/dashboard/library` routes redirect to `/settings?tab=files`. Sidebar Library entry removed.
  - **AppAIPage routing**: Chat composer detects agent intent (`detectAgentIntent` + `userExplicitlyRequestsAgent`) and routes to `/api/agent/start` instead of `/api/ai/nexus-user`. `@agent` prefix forces it.
- **Hooks** — `src/hooks/useAgentRuns.ts` (Realtime subscription per run, all controls), `src/hooks/useProjects.ts` (CRUD + selected project sticky).
- **Tests** — `tests/agent-mode-foundation-contract.test.mjs` (30 asserts covering migration shape, SKIP LOCKED, RLS, dispatcher routes, LLM adapter parity, Oracle runner files, frontend wiring, sidebar/library/settings moves, post-call summary fold). Total suite: **136 + 2 passing**.
- **What's still owner-action to fully light up:**
  1. Bring up Oracle runner — `cd deploy/nexus-agent-runner && docker build … && docker run …` per README. Or skip if you only want the schema + UI surface.
  2. Add Vercel envs: `AGENT_RUNNER_BASE_URL=https://nexus-agent-runner.syncscript.app`, `AGENT_RUNNER_TOKEN=<same as NEXUS_PHONE_EDGE_SECRET or unique>`. Already deploys without these — runs just stay queued until a runner appears.
  3. Optional: `vercel env add NVIDIA_API_KEY` already exists per Vercel dump. Free-tier works the moment the runner is up.
- **Shape/UX choices that came from the design ask:**
  - Tab strip with collapse arrow (▼/▶) replaces old chats sidebar; chats and tasks each have a `+` to start.
  - Voice orb minimization while agent runs is **not yet wired** — punted to a follow-up so we don't touch `VoiceConversationEngine` (active surface) on the same drop. Voice continues to work as before; agent + voice can run in parallel today via the chat composer + sidebar.
  - Project overview tab (single-project deep-dive view) is **not yet built** — punted; project filter today scopes the existing tabs to a single project.
  - Persistent browser context per user (saved Gmail/etc cookies across runs) is **future** — current runs always start fresh. Easy upgrade since Browserbase SDK has parity if/when we swap.

## App AI tab — drag/drop + paste documents (2026-04-25)
- **What it does:** On the App AI tab (`/app/ai`), the user drags any text-extractable document onto the page. A two-half overlay appears: **left = Reference** (Nexus reads the document for context), **right = Modify** (loads into `DocumentCanvas` and Nexus rewrites in place via `update_document`). Multiple files at once, keyboard-accessible "Attach document" button as fallback. Open canvas auto-attaches itself as a modify-target on every send so revisions work without re-pasting.
- **Files (additive — AppAIPage edits stayed minimal to respect rule 02 protected-files spirit):**
  - `src/utils/document-attachment.ts` — pure file-to-attachment parsing, MIME inference, hard caps (`MAX_ATTACHMENT_BYTES = 96 KB`, `MAX_TOTAL = 256 KB`, `MAX_ATTACHMENTS_PER_TURN = 6`, `MAX_FILE_BYTES_BEFORE_READ = 4 MB`), and the `formatAttachmentSystemMessage` serializer.
  - `src/hooks/useAppAiAttachments.tsx` — drag/drop event handlers (correct `dragEnter` depth-counting), file picker, state, error/warn callbacks. Filters by `dataTransfer.types` containing `'Files'` so plain text drags are ignored.
  - `src/components/nexus/AppAiDropzoneOverlay.tsx` — page-level overlay with Reference/Modify halves. Pointer-events-none on the wrapper so the actual drop hits the page root; halves re-enable to detect mode swap.
  - `src/components/nexus/AppAiAttachmentsBar.tsx` — chip rail above composer (role=region, removable, truncation badge, + Add button).
  - `api/_lib/nexus-attachments.ts` — server-side validator + serializer. Re-caps sizes (defense in depth — never trust the client). Format must stay byte-identical to the client utility; the contract test enforces that.
- **API change (backwards-compatible):** `/api/ai/nexus-user` accepts optional `attachments: Array<{name, mimeType, content, mode, truncated?}>`. Sanitized + injected as a system message AFTER the main persona prompt and BEFORE user/assistant turns. Old clients without `attachments` see zero behavior change. `emitNexusTrace` now records `attachmentCount` + `attachmentBytes` (no raw text).
- **Supported file types:** `.txt .md .json .csv .tsv .html .xml .yml .toml .ini .log .sql` + 25+ code extensions. **Rejects with friendly toast:** images (image vision routing not wired here), PDF/DOCX/XLSX (no client-side text extractor today — paste content or save as `.md`), oversized (>4 MB pre-read).
- **Tests:** `tests/app-ai-attachments-contract.test.mjs` — 16 asserts covering size caps, client/server format parity, error catalog, hook a11y/dragEffect, overlay pointer-events behavior, AppAIPage wiring, and trace fields. In `npm test`. Total suite now **106 + 2 passing** (was 90 + 2).
- **Auto-canvas wiring:** when `canvasDoc` is open, every send auto-includes it as a `mode: 'modify'` attachment (deduped against any explicit modify-mode upload of the same name). This closes the long-standing UX gap where users had to re-paste a doc to ask Nexus for revisions.
- **Why two modes (vs one big "attach"):** Anthropic + OpenAI consistently report higher tool-call accuracy when the model knows whether a doc is read-only vs target-of-edit. The system message includes `[REFERENCE]` vs `[MODIFY-TARGET]` tags + an explicit instruction to call `update_document` for modify targets — fewer "Nexus described changes instead of saving them" reports.

## Gap #1 live end-to-end (2026-04-24)
- **Status: PROVEN.** Nexus tool → `event_outbox` → `fanout_event_outbox` → `webhook_deliveries` → pg_cron flush → HTTPS POST with HMAC → webhook.site received + signature verified. One round-trip in a single 1-minute cron tick. See dated entry below for architecture.
- **Key runtime learnings captured during bring-up:**
  1. Vercel prod was missing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (only `SUPABASE_ANON_KEY` was set). Added via `vercel env add`. The concierge worker + any Vercel-side service-role client now initializes.
  2. This Supabase project has **legacy anon JWTs disabled** (error `UNAUTHORIZED_LEGACY_JWT`) AND the modern `sb_publishable_*` keys aren't JWTs (`UNAUTHORIZED_INVALID_JWT_FORMAT`). For `make-server-57781ad9`, the correct pattern is **`verify_jwt = false`** in `supabase/config.toml` — the function handles its own auth (`x-nexus-internal-secret` on `/internal/*`, OAuth signatures on `/stripe/*`, `supabase.auth.getUser(token)` inside per-user routes). Gateway-level JWT pre-check was redundant and incompatible with pg_cron callers.
  3. `pg_net` deprecates request queue rows after response is recorded → the URL disappears from `net.http_request_queue` shortly after `net._http_response` lands. For forensics you need both tables joined quickly.
- **Vault (seeded via `admin_seed_syncscript_vault_secret`, scoped to 3 names):**
  - `syncscript_cron_secret` — Vercel Bearer for `/api/cron/*`
  - `syncscript_nexus_edge_secret` — `x-nexus-internal-secret` for `/make-server-57781ad9/internal/*`
  - `syncscript_supabase_anon_key` — left seeded for future use; currently redundant with `verify_jwt=false` but doesn't hurt.
- **pg_cron jobs live (6 active):** `syncscript.concierge.tick` (1m), `syncscript.phone.dispatch` (2m), `syncscript.process-emails` (5m), `syncscript.tts.slo` (10m), `syncscript.proactive.detect` (15m), `syncscript.webhooks.flush` (1m).
- **Operator runbook (use daily / on incidents):**
  ```bash
  # 1. Full live state in JSON — run from repo root:
  SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | head -1 | cut -d= -f2-) \
    && curl -s -X POST "https://kwhnrlzibgfedtxpkbgb.supabase.co/rest/v1/rpc/admin_autonomy_probe" \
         -H "Content-Type: application/json" -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
         -d '{}' | jq

  # 2. Rotate a secret (pattern — drop-and-recreate in-place; pg_cron picks up on next tick):
  #    only names allowed: syncscript_cron_secret | syncscript_nexus_edge_secret | syncscript_supabase_anon_key
  curl -s -X POST "…/rpc/admin_seed_syncscript_vault_secret" \
       -d '{"p_name":"syncscript_cron_secret","p_value":"<new>","p_description":"rotated"}'

  # 3. Pause/resume a single autonomy loop without redeploy:
  #    (uses cron.alter_job in SQL editor)
  update cron.job set active = false where jobname = 'syncscript.webhooks.flush';

  # 4. Replay DLQ'd deliveries for a subscription:
  update webhook_deliveries set status='pending', next_attempt_at=now(), claimed_at=null
    where status='dlq' and subscription_id='<uuid>';
  ```
- **Smoke script:** `scripts/smoke-outbound-webhooks.mjs` — allocates fresh webhook.site bucket, emits a synthetic event, polls to terminal, verifies HMAC against raw body. Run any time: `node scripts/smoke-outbound-webhooks.mjs`. Exit 0 = pipeline healthy.
- **Edge function setting (in `supabase/config.toml`):**
  ```toml
  [functions.make-server-57781ad9]
  verify_jwt = false
  ```
  Do not remove — internal auth is in-function, and the Supabase platform JWT check was mismatching this project's key regime. Client-side JS sets `Authorization` via the Supabase JS SDK anyway so normal user requests still carry a token for in-handler `supabase.auth.getUser(token)`.

## Event outbox + outbound webhooks (Gap #1) — 2026-04-23
- **What it is:** Per-user webhook subscription layer so n8n / Make / Zapier / custom backends can receive SyncScript events without a code change. Classic outbox-pattern + fanout-with-DLQ.
- **Schema:** `supabase/migrations/20260423160000_event_outbox_and_webhooks.sql`
  - `event_outbox(id, user_id, event_type, event_key, payload, created_at, fanout_at, completed_at)` — unique `(user_id, event_type, event_key) WHERE event_key IS NOT NULL` enforces idempotency.
  - `webhook_subscriptions(id, user_id, label, url, secret, event_types TEXT[], active, consecutive_failures, disabled_reason, …)` — RLS `user_id = auth.uid()` for INSERT/SELECT/UPDATE/DELETE; service_role bypasses.
  - `webhook_deliveries(id, subscription_id, event_id, status, attempt, next_attempt_at, response_status, response_body_excerpt, last_error, claimed_at, …)` — unique `(subscription_id, event_id)` prevents double delivery.
  - RPCs (SECURITY DEFINER, `service_role` only): `fanout_event_outbox(batch_n)`, `claim_due_webhook_deliveries(lease_seconds, limit_n)` (FOR UPDATE SKIP LOCKED), `finalize_webhook_delivery(...)`.
- **Emit path (single source of truth):** `api/_lib/events.ts` → `emitEvent({ userId, eventType, eventKey, payload })`. Fire-and-forget, swallows failures, dedupes on `23505` unique_violation. Event catalog `SYNCSCRIPT_EVENT_TYPES`: task.*, note.created, event.proposed / event.created, document.created / document.updated, invoice.sent / invoice.paid / invoice.overdue, signature.requested, playbook.run.started / step.completed / succeeded / failed, nexus.tool.called, nexus.voice.turn.completed.
- **Wired in:** `api/_lib/nexus-actions-executor.ts` `finish()` choke point now emits `nexus.tool.called` for every tool + typed events for successful mutating tools (`create_task`, `add_note`, `propose_calendar_hold`, `create_document`, `update_document`, `send_invoice`, `send_document_for_signature`, `enqueue_playbook`). Never throws.
- **Dispatcher (Edge):** `supabase/functions/make-server-57781ad9/webhook-dispatcher.tsx`. Routes:
  - `POST /make-server-57781ad9/internal/webhooks/flush` — pg_cron tick.
  - `GET  /make-server-57781ad9/internal/webhooks/status` — pending/dlq counts.
  Both gated by `x-nexus-internal-secret: $NEXUS_PHONE_EDGE_SECRET`. Per-delivery: HMAC-SHA256 signature (`X-SyncScript-Signature: sha256=<hex>`), 8s abort, exponential backoff `60s → 12h`, DLQ at 10 attempts. Subscriptions auto-disable at 20 consecutive DLQ'd deliveries.
- **Heartbeat:** `supabase/migrations/20260423170000_pg_cron_webhooks_flush.sql` adds `syncscript.webhooks.flush` (`* * * * *`) calling the Edge dispatcher via the vault-backed `syncscript_autonomy_post` helper.
- **Webhook payload shape (for docs / n8n templates):**
  ```json
  { "id": "<uuid>", "type": "task.created", "occurred_at": "<iso>", "user_id": "<uuid>", "payload": { ... } }
  ```
  Verify signature: `HMAC-SHA256(subscription.secret, raw_request_body) == req.header('X-SyncScript-Signature').replace('sha256=','')`.
- **Contract test:** `tests/event-outbox-and-webhooks-contract.test.mjs` (in `npm test`) — 11 asserts (schema shape, RLS on each table, SKIP LOCKED, HMAC + backoff + DLQ discipline, event catalog completeness, executor wiring, dispatcher route mounting in both `index.ts` + `index.tsx`).
- **Operator controls:**
  ```sql
  -- Subscribe a user (admin bootstrap until Settings UI ships)
  insert into webhook_subscriptions (user_id, label, url, secret, event_types)
    values ('<uuid>', 'My n8n instance', 'https://n8n.example.com/webhook/xyz',
            encode(gen_random_bytes(32), 'hex'), '{task.created,invoice.paid}');

  -- Delivery health
  select status, count(*) from webhook_deliveries group by status;

  -- Replay stuck DLQ rows
  update webhook_deliveries set status='pending', next_attempt_at=now(), claimed_at=null
   where status='dlq' and subscription_id='<uuid>';
  ```
- **Next:** Settings → Integrations → Webhooks UI (create / rotate secret / delivery log / one-click-replay); then the five `INTEGRATION_RECIPES` shipped as downloadable n8n template JSON under `public/integrations/recipes/*.n8n.json`.

## Autonomy heartbeat (pg_cron + pg_net) — 2026-04-23
- **Why:** Vercel Hobby cron is daily-only and Hobby caps at ≤12 functions; adding minute-level autonomy via `api/*` is a dead end. Supabase ships `pg_cron` + `pg_net` on every project — free, sub-daily, zero function pressure. Research: Supabase docs (pg_cron max 8 concurrent jobs / 10-min runtime), Vercel Hobby cron docs (daily + hour drift).
- **Migration:** `supabase/migrations/20260423150000_pg_cron_autonomy.sql` — enables `pg_cron` + `pg_net`, ships `public.claim_next_playbook_runs` (FOR UPDATE SKIP LOCKED lease) + `release_playbook_run_claim`, wraps HTTP calls in `public.syncscript_autonomy_post(url, secret_name, auth_scheme, body)` (SECURITY DEFINER, reads `vault.decrypted_secrets`), and schedules five `syncscript.*` cron jobs. Re-runnable: unscheduling step removes any prior `syncscript.*` jobs before re-adding.
- **Vault secrets required BEFORE enabling (Supabase SQL editor):**
  ```sql
  select vault.create_secret('<Vercel CRON_SECRET>', 'syncscript_cron_secret', 'Vercel Bearer CRON_SECRET for /api/cron/*');
  select vault.create_secret('<NEXUS_PHONE_EDGE_SECRET>', 'syncscript_nexus_edge_secret', 'x-nexus-internal-secret for /make-server-57781ad9/internal/*');
  ```
- **Schedules:**
  | jobname | cron | target | secret / auth |
  |---|---|---|---|
  | `syncscript.concierge.tick` | `* * * * *` | `https://www.syncscript.app/api/cron/concierge-playbook-tick` | `syncscript_cron_secret` (Bearer) |
  | `syncscript.phone.dispatch` | `*/2 * * * *` | `/api/cron/phone-dispatch` | same |
  | `syncscript.process-emails` | `*/5 * * * *` | `/api/cron/process-emails` | same |
  | `syncscript.tts.slo` | `*/10 * * * *` | `/api/cron/tts-slo` | same |
  | `syncscript.proactive.detect` | `*/15 * * * *` | Edge `…/make-server-57781ad9/admin/detect/all` | `syncscript_nexus_edge_secret` (`x-nexus-internal-secret`) |
- **Concurrency safety (mandatory before enabling 1-min tick):** `runConciergePlaybookTick` now calls `claim_next_playbook_runs(lease_seconds, limit_n)` first. Falls back to legacy select if RPC isn't deployed yet, so rolling deploys are safe. Claims released in a `finally`; stale claims expire after `CLAIM_LEASE_SECONDS = 120s`.
- **Operator controls (no redeploy):**
  ```sql
  update cron.job set active = false where jobname = 'syncscript.concierge.tick';
  update cron.job set active = true  where jobname = 'syncscript.concierge.tick';
  select * from cron.job_run_details where jobid in (select jobid from cron.job where jobname like 'syncscript.%') order by start_time desc limit 50;
  select cron.unschedule('syncscript.concierge.tick'); -- to remove entirely
  ```
- **Contract test:** `tests/pg-cron-autonomy-schedule.test.mjs` (in `npm test`) — asserts extensions, claim RPC + SKIP LOCKED, vault helper, and all five schedules by exact name + cron expression. Drift will fail `npm test` / release gate.
- **Next layer (not shipped yet):** event outbox + per-user outbound webhook subscriptions → n8n / Make / Zapier at user level (not just global env webhooks). Plan in thread [Nexus orb and autonomy plan](70b2d96e-4b0c-44a2-a3f0-2e5fa42a4a66). Keep n8n self-host (rule 09, Oracle free tier) for external orchestration — SyncScript stays authoritative, n8n only invokes via `executeNexusTool`.

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

**Nexus “individual user” verify profile (agents / CI)**

1. **Bootstrap (once per machine / when JWT expires):** **`npm run bootstrap:nexus-verify-user`** — needs **`SUPABASE_SERVICE_ROLE_KEY`** in `.env`. Writes **`NEXUS_LIVE_TEST_EMAIL`**, **`NEXUS_LIVE_TEST_PASSWORD`**, **`NEXUS_VERIFY_USER_ID`**, **`NEXUS_LIVE_TEST_SKIP_SERVICE_BOOTSTRAP=1`**, session JWT. Default email in **`scripts/bootstrap-nexus-individual-verify-user.mjs`** (override **`NEXUS_VERIFY_PROFILE_EMAIL`**). **Never commit** `.env`.
2. **API smoke:** **`npm run verify:nexus-tools-live`** — **`create_task`** + **`GET /tasks`** for that user.
3. **GitHub Actions secrets (from local `.env`, values not printed):** **`npm run secrets:github:nexus-e2e`** → sets **`NEXUS_LIVE_TEST_EMAIL`**, **`NEXUS_LIVE_TEST_PASSWORD`**, duplicate aliases **`E2E_LOGIN_EMAIL`** / **`E2E_LOGIN_PASSWORD`**. Optional: **`NEXUS_E2E_PUSH_CI_OPT_IN=1`** in `.env` also pushes **`NEXUS_E2E_INCLUDE_PLACES`** / **`NEXUS_E2E_INCLUDE_VOICE`** (defaults **omit** — Actions **skips** flaky places + voice). Script: **`scripts/push-nexus-e2e-secrets-to-github.mjs`**.
4. **Prod UI / artifact rail:** After changing **`NexusVoiceArtifactRail`** (or related voice shell), ship with **`npm run deploy:vercel:prod`** so **`data-testid="nexus-voice-artifact-rail"`** and **`aria-label="Nexus voice tool confirmations"`** are live on **`www.syncscript.app`**.
5. **Playwright (browser, same credentials as bootstrap):**
   - **`npm run test:e2e:nexus-task`** — create task.
   - **`npm run test:e2e:nexus-signed-in-smoke`** — Edge **`GET …/user/profile`** + **`propose_calendar_hold`** in **`toolTrace`** (occasional **`nexus-user`** **500** — retry may pass).
   - **`npm run test:e2e:nexus-app-ai-parity-deep`** — isolated sessions: **`create_task`**, **`propose_calendar_hold`**, **`create_document`**, **`search_places`**, immersive voice (shared helper **`e2e/helpers/nexus-voice-immersive-smoke.ts`**). **Local:** include **`search_places`** unless **`NEXUS_E2E_SKIP_PLACES=1`**. **`search_places`** can return **500** on prod (transient).
   - **`npm run test:e2e:nexus-voice-immersive-prod`** — **voice-only** (first-touch path on **`/app/ai-assistant`**): longer timeouts, **`test.describe.configure({ retries: 2 })`**. Clicks **`data-testid="nexus-app-ai-open-immersive-voice"`** when present (**`AppAIPage`**). Optional env: **`NEXUS_E2E_VOICE_*_MS`** to tune CI runners.
   - **`npm run test:e2e:voice-visual`** — screenshot variant (**`e2e/app-ai-voice-immersive-visual.spec.ts`**). **Headed manual parity** (Nexus **call** vs in-app **voice** + rail) is still **manual** — not fully automated.
6. **CI workflow (full signed-in):** **`.github/workflows/e2e-nexus-signed-in-prod.yml`** — **“E2E Nexus signed-in (prod)”**. **`gh workflow run "E2E Nexus signed-in (prod)"`**. Optional **`skip_prod_fingerprint`** when **`www`** lags **`main`**. **On GitHub Actions only:** **`search_places`** / **voice** inside deep suite are skipped unless repo secrets **`NEXUS_E2E_INCLUDE_PLACES`** / **`NEXUS_E2E_INCLUDE_VOICE`** are **`1`** (set via **`NEXUS_E2E_PUSH_CI_OPT_IN=1`** + **`npm run secrets:github:nexus-e2e`**).
7. **CI workflow (voice-only):** **`.github/workflows/e2e-nexus-voice-immersive-prod.yml`** — **“E2E Nexus voice immersive (prod)”**. Runs **`npm run test:e2e:nexus-voice-immersive-prod`** only — use for **first-touch voice** validation without the long chat suite. Same **`skip_prod_fingerprint`** + login secrets. **`gh workflow run "E2E Nexus voice immersive (prod)"`**.
8. **Shared:** **`playwright.config.ts`** in git (**`chromium`** project). **`verify:prod-build`** **MATCH** before strict Actions (no skip) when you want proof **`www`** equals **`main`**.
9. **Not Playwright:** **`enqueue_playbook` / concierge** — contract + integration scripts only; see **`tests/nexus-concierge-playbook-contract.test.mjs`** and **`npm run test:concierge:integration`** when env allows.

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
