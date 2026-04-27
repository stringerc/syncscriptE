# SyncScript — full feature catalog (by surface)

**Purpose:** A durable, repo-grounded inventory of **user-visible and operator-facing capabilities**, grouped to match how people navigate the product (desktop sidebar rail first), then **everything else** (marketing, auth, alternate shells, APIs, automation).

**Sources of truth in code:** `src/App.tsx` (routes), `src/components/Sidebar.tsx` / `src/components/MobileNav.tsx` (primary navigation chrome), `src/utils/navigation.ts` (path constants and deep links). **Stack (high level):** Vite + React SPA (`BrowserRouter`), lazy-loaded pages, dashboard provider stack in `DashboardShell`, Vercel serverless under `api/`, Supabase Edge bundle `supabase/functions/make-server-57781ad9/`.

**Caveat:** Some UI is **demo / illustrative** (sample metrics, charts fed by local or mock data). This catalog describes **what the app exposes**, not a warranty that every backend integration is live for every tenant without configuration.

---

## 1. Navigation model (how “tabs” map to routes)

### 1.1 Desktop sidebar rail (`Sidebar.tsx`)

Order and routes (logo click goes to `/`):

| # | Label | Route |
|---|--------|--------|
| 1 | Dashboard | `/dashboard` |
| 2 | Tasks | `/tasks` |
| 3 | Calendar | `/calendar` |
| 4 | Financials | `/financials` |
| 5 | Email | `/email` |
| 6 | AI | `/ai` |
| 7 | Energy | `/energy` |
| 8 | Resonance Engine | `/resonance-engine` |
| 9 | Team | `/team` |
| 10 | Gaming | `/gaming` |
| 11 | Scripts & Templates | `/scripts-templates` |
| 12 | Analytics | `/analytics` |
| 13 | Enterprise | `/enterprise` |
| 14 | All Features Menu | `/all-features` → **redirect** to `/features` (marketing) |
| — | Settings (footer) | `/settings` |

**Calendar shortcut:** If you are already on `/calendar`, clicking Calendar again triggers **jump to today** via `CalendarNavigationContext`.

**Not on the desktop rail (but are real dashboard routes):**

- **Integrations** — `/integrations` (mobile drawer comment: “accessible via Settings” for discoverability; route still exists).
- **Team Scripts** — `/team-scripts`.
- **Gamification v2** — `/gaming-v2` (parallel hub; v1 remains `/gaming`).
- **Onboarding wizard** — `/onboarding`.
- **Alternate “app” chrome** — `/app`, `/app/tasks`, `/app/calendar`, `/app/ai-assistant`, `/app/financial`, `/app/settings`, `/app/profile`, `/app/google-calendar` (see §8).

### 1.2 Mobile navigation (`MobileNav.tsx`)

Bottom bar + drawer. Drawer list is similar to the rail but includes **Library** → `navigationLinks.sidebar.library` (`/library`), which **redirects** to `/settings?tab=files` per `App.tsx`. Integrations are **omitted** from the drawer list (comment in source).

### 1.3 Global dashboard chrome (most authenticated routes)

Wrapped by `DashboardLayout` (see individual pages). Across the app tree (see `App.tsx`):

- **Past-due billing banner** — `PastDueBanner`.
- **Help widget** — `HelpWidget`.
- **Cookie consent** — `CookieConsentBanner`.
- **Floating feedback** — `FloatingFeedbackButton` (Discord invite).
- **Toasts** — `Toaster` (Sonner) + `AppToaster` inside dashboard providers.
- **Marketing orb** — `SharedMarketingOrb`.
- **Nexus voice call provider + overlay** — `NexusVoiceCallProvider`, `NexusVoiceOverlay` (voice/call UX layered on dashboard stack).
- **Task ↔ calendar sync helper** — `TaskCalendarSync`.
- **Keyboard shortcuts overlay** — `KeyboardShortcutsOverlay`.
- **Analytics tracker** — `AnalyticsTracker`.
- **Observability session identifier** — `ObservabilityIdentifier`.
- **User realtime bus** — `UserRealtimeBus`.
- **BFCache router sync** — `BfcacheRouterSync`.
- **Particle transitions** — `ParticleTransitionProvider`.
- **Email queue processor** — `EmailQueueProcessor` (background behavior while dashboard is mounted).

**Header (when using dashboard header):** `DashboardHeader.tsx` includes **weather**, **notifications sheet**, **energy/readiness** cues, **profile menu**, and a **command palette** with fuzzy search. Registered commands include quick opens for **Create Task / Goal / Event / Script** modals and navigation jumps (Tasks, Calendar, Analytics, Financials, Resonance, AI, Team, Integrations, Scripts, Gamification, Settings). Natural-language-ish queries can be classified as “AI questions” for assistant routing.

---

## 2. Dashboard home (`/dashboard`) — `DashboardPage.tsx`

**Layout:** `DashboardLayout` with three main columns: `AIFocusSection`, `TodaySection`, `ResourceHubSection`, plus `DashboardBriefing`.

**First-time / onboarding UX:**

- **Welcome modal** — value prop; branches to **quick start** (dismiss → guided hotspots) or **profile setup** → navigates to `/onboarding`.
- **Sample data generation** — `generateFirstTimeUserData()` for first-time users; persisted “seen” flags in `localStorage` per user scope.
- **Interactive hotspots** — `InteractiveHotspot` + `ONBOARDING_HOTSPOTS` sequence (e.g. energy meter, AI suggestions, scripts tab pointer, ROYGBIV ring).
- **Sample-data banner** — explains demo content when applicable.

**`AIFocusSection` (high level):**

- Energy-adaptive **focus / readiness** presentation (ties into `EnergyContext`, task priority helpers, ROYGBIV-style progress).
- **Weather-aware routing** hooks (`useWeatherRoute`) and **week outlook** / **weather vs event conflict** modals.
- **Top priority tasks** with avatars / participant stacks, **task detail** modal entry points.

**`TodaySection` (high level):**

- **Calendar widget** (`CalendarWidgetV2`), **today schedule** (`TodayScheduleRefined`), **conflict** surfaces (`ConflictCardStack`, unified conflict detection).
- **Quick complete** interactions, **quick add** task flow (`NewTaskDialog` / `QuickActionsDialogs`), optimistic UX patterns.
- Integrates **tasks** + **calendar events** for “what now” orchestration.

**`ResourceHubSection` (high level):**

- **Resonance** mini narrative (badge + wave graph components) linking toward deeper resonance views.
- **Goals** preview with **goal detail** modal, collaborator faces, financial-style resource tiles (savings, alerts, stats) and navigation hooks into Financials / Gaming / Calendar / Tasks via `navigationLinks`.

---

## 3. Tasks (`/tasks`) — `TasksGoalsPage.tsx` (“Projects OS”)

**Top-level framing:** “Projects OS” heading; large surface combining **task management**, **goals**, **projects**, automation, and analytics.

**Primary tab groups (from `TabsTrigger` values):**

- **List** — classic task/list operations (filters, project context, modals — file is very large; treat as core CRUD + assignment patterns).
- **Timeline** — temporal view of work.
- **Analytics** — productivity / throughput style charts and stats.
- **Templates** — reusable task / workflow templates.
- **Automation** — rules / automation lanes (UI for automated flows).
- **Recurring** — recurrence setup and management.

**Secondary / nested tabs:** The file defines additional `TabsList` regions (e.g. another set including list / analytics / timeline / templates) for responsive or sectional layout — same conceptual modules.

**Cross-links:** Deep links from dashboard and AI surfaces; AI page can open **agent run stream** when drilling from Tasks.

---

## 4. Calendar (`/calendar`) — `CalendarEventsPage.tsx`

**Title:** “Calendar & Events”.

**View modes (`Tabs`):** **Day**, **Week**, **Month**, **Timeline**.

**Expected capabilities (from structure + imports):** event CRUD, task linkage, conflict surfacing, AI insights slot via `DashboardLayout` patterns, navigation integration (sidebar double-tap behavior).

---

## 5. Financials (`/financials`) — `FinancialsPage.tsx`

**Surface:** Financial command center (reporting, invoices, revenue/expense motifs — wrapped in `ErrorBoundary` at route).

**Typical feature clusters (conceptual — verify per release):** dashboards for cash flow / KPI style cards, invoice actions, links to billing / Stripe connect flows in Settings, export/share motifs.

---

## 6. Email hub (`/email`) — `EmailHubPage.tsx`

**Title:** In-app email hub with **provider** and **folder** selectors.

**Providers:** Tabs for **All**, **Gmail**, **Outlook**.

**Folders:** **Inbox**, **Sent**.

**Other UX:**

- **Search** (subject/from/snippet) + manual **Search** button.
- **Message list + reading pane** style grid (three-column layout on xl).
- **Auto-complete sent emails as tasks** — `Switch` persisted via settings save API pattern in file.
- Connection / error empty states when providers not linked.

---

## 7. AI assistant (`/ai`) — `AppAIPage.tsx` (with `AiPageChromeProvider`)

**Note:** Route uses **`AppAIPage`**. `App.tsx` still lazy-imports **`AIAssistantPage`**, but the router **does not mount a path** to it today — treat as dead import unless a route is re-added.

**Major capabilities:**

- **Multi-chat sessions** stored in `localStorage` (load/save helpers in file).
- **Text chat** with markdown-ish rendering (`simpleMarkdown`), message actions (copy, feedback thumbs, delete patterns from imports).
- **Attachments** — `useAppAiAttachments`, drag/drop overlay (`AppAiDropzoneOverlay`), server attachment payload builder.
- **Document canvas** — `DocumentCanvas` for structured docs (including “open canvas auto-attaches as modify target” behavior described in code comments).
- **Agent personas** — `PRESET_AGENTS`, persona metadata, **group agent** picker, multi-agent selection.
- **Voice** — lazy `VoiceConversationEngine` (chunk split for perf); **mic** toggles; **immersive orb** vs classic waveform (**Voice** vs **Call Nexus** metaphor in state comments).
- **Phone** icon affordances (Nexus phone integrations exist at API layer — see §10).
- **Agent runs** — start agent run hook; **AgentRunStream** / run id overlay when drilling from Tasks or runs list.
- **Private context** — `useNexusPrivateContext` for scoped memory / context firewall behavior.
- **Mobile chrome** — `useSetAiPageMobileChatsToolbar` / `AiPageChromeContext` patterns for small screens.

---

## 8. Energy (`/energy`) — `EnergyFocusPageV2.tsx`

**Title:** “Energy Ecosystem”.

**Conceptual modules:** logging / visualizing energy, correlating tasks and calendar with readiness, guidance panels, ties into **EnergyContext** and settings for reminders (see Settings → Energy).

---

## 9. Resonance Engine (`/resonance-engine`) — `ResonanceEnginePage.tsx`

**Hero:** “Resonance Engine” — schedule vs circadian / energy alignment story.

**Key UI blocks:**

- **Resonance score** badge with tooltip thresholds (0.85+ excellent, etc.).
- **`ResonanceWaveGraph`** against real tasks + events.
- **Alignment percentage** (“% in-sync throughout your day”).
- Interpretation cards for **above the line / below the line** zones.
- **`ResonanceAIInsights`** injected into dashboard AI insights region.

---

## 10. Team (`/team`) — `TeamCollaborationPage.tsx` → `TeamPage.tsx`

**Tabs:**

- **Collaboration**
- **Teams**
- **Individual**

Uses **`TeamContext`** for membership / collaboration state (see providers in `App.tsx`).

---

## 11. Gaming / gamification

### 11.1 `/gaming` — `GamificationHubPage.tsx`

**Tabs:** Overview, Quests, Leagues, Class, Season, Pets, Achievements, Mastery, Prestige, Titles, Guilds, Friends, Gifts, Events, Leaderboard, Rewards.

### 11.2 `/gaming-v2` — `GamificationHubPageV2.tsx`

Parallel hub with the same tab IDs/labels (abbreviations slightly differ in places, e.g. “Achieve”, “Board”).

**Context:** `GamificationProvider` + `GamificationPreferencesProvider`.

---

## 12. Scripts & Templates (`/scripts-templates`) — `ScriptsTemplatesPage.tsx`

**Concept:** Marketplace / library for **scripts** with rich metadata model (`Script` interface): categories (time management, meetings, email, focus, reporting, onboarding, task management), difficulty, integrations required, ratings/reviews, **adaptation engine** hooks, analytics components (`AutomationUsageTrend`, `TimeSavedEstimate`, `TopCommunityScripts`, `ScriptCategories`, `ScriptSuccessRate`), team script cards via `useTeamScripts` / `TeamScriptCard`, user preferences dialog, enhanced search utilities.

**User flows:** browse/search/filter, star/save, preview/download/copy, run/play motifs, reviews, adaptation parameters.

---

## 13. Analytics (`/analytics`) — `AnalyticsInsightsPage.tsx`

**Tabs:**

- **Overview** — KPI style cards (productivity score, completion %, focus duration, energy level) + deeper charts/sections in file.
- **AI Insights (Beta)** — alternate tab with AI-forward visualizations.

**Global range buttons:** e.g. day/week/month style toggles at top (implementation uses `range` state).

---

## 14. Enterprise (`/enterprise`) — `EnterpriseToolsPage.tsx`

**Tabs / modes (`EnterpriseTab`):** **Mission**, **Agents**, **Office**, **Memory** (internal tab state).

**Components:**

- `EnterpriseMissionCalendar`
- `EnterpriseOfficeSimulation`
- `EnterpriseAgentModal`, `EnterpriseTeamModal`
- Live **action feed** (`EnterpriseAction`) and **agent grid** with statuses.

**Feature flags:** `getEnterpriseFeatureFlags()` gates parts of the experience.

---

## 15. Settings (`/settings`) — `SettingsPage.tsx`

**Tabs (vertical / primary navigation inside page):**

| Tab id | Purpose (summary) |
|--------|-------------------|
| `general` | Theme accent, font size, dark mode, **Nexus persona mode** (`standard` vs `halo_inspired`), language, timezone, date format, optimization mode, phase anchor time, etc. |
| `account` | Profile fields, avatar + **image crop modal**, email draft / guest handling, bio, linked identity controls as implemented. |
| `energy` | Energy reminders integration with `EnergySettings` / sliders. |
| `notifications` | Channel toggles, digest rules (see in-file switches). |
| `resonance` | Resonance mode, overlays, task move behavior, “explain moves”, related toggles (`AppSettings` interface in file). |
| `integrations` | Integration-related controls (connectors may duplicate deeper `/integrations` page in part). |
| `privacy` | Privacy / security UX (exports, danger zone patterns — confirm in-file). |
| `briefing` | Briefing / digest content preferences. |
| `billing` | `BillingSettings` component. |
| `agent` | `AgentSettingsTab` — agent defaults, automation persona hooks. |
| `files` | `FilesLibraryEmbed` — file library (also target of `/library` redirect). |
| `activity` | Split between **`WebhooksTab`**, **`AuditLogTab`**, and related activity surfaces. |

**Also embedded / linked:** `StripeConnectSettings`, `EnergyHistory`, public repo / companion protocol constants from `src/config/public-links.ts` for docs and trust.

**Persistence:** `syncscript_settings` local storage key merging defaults for many toggles.

---

## 16. Integrations (`/integrations`) — `IntegrationsPage.tsx`

**Even though Tabs primitives are imported, the page centers on:**

- **OAuth connector grid** — `OAuthConnector` + `OAUTH_PROVIDERS`.
- **Calendar import** — `CalendarImportDialog` for Google/Outlook calendar ingest triggers.
- **Setup status** — `SetupStatusBanner`.
- **Search + category filters** for integration cards.
- **AI Insights custom block** with charts: usage pie, sync success rate, automated vs manual trend, latency, recommendations (`IntegrationVisualizations`).

---

## 17. Team Scripts (`/team-scripts`) — `TeamScriptsPage.tsx`

**Tabs:** **All**, **My Scripts**, **Favorites**.

Team-scoped script sharing, cards, and hooks into `TeamContext` / `useTeamScripts`.

---

## 18. Onboarding (`/onboarding`) — `OnboardingPage.tsx`

Dedicated wizard reached from dashboard welcome alternate path; collects preferences / setup steps (profile completion flow).

---

## 19. Alternate “App” shell (`/app/*`) — `AppLayout.tsx`

Marketing-adjacent **secondary shell** with its own layout wrapping:

- `/app` — `AppDashboardPage`
- `/app/tasks` — `AppTasksPage`
- `/app/calendar` — `AppCalendarPage`
- `/app/ai-assistant` — `AppAIPage` (same AI page component family as `/ai` but different chrome)
- `/app/financial` — `AppFinancialPage`
- `/app/settings` — `AppSettingsPage`
- `/app/profile` — `AppProfilePage`
- `/app/google-calendar` — reuses `AppCalendarPage`

Useful for **embed-style** or simplified navigation experiments without removing the main dashboard.

---

## 20. Marketing & trust site (no dashboard providers)

Routes from `App.tsx`:

| Path | Page |
|------|------|
| `/` | `LandingPage` |
| `/features`, `/pricing`, `/faq` | `MarketingShell` lazy pages (`FeaturesPage`, `PricingPage`, `FAQPage`) |
| `/contact` | `ContactSalesPage` |
| `/about` | `AboutPage` |
| `/blog`, `/blog/:slug` | `BlogPage`, `BlogPostPage` |
| `/careers` | `CareersPage` |
| `/press` | `PressKitPage` |
| `/docs` | `DocsPage` |
| `/help` | `HelpCenterPage` |
| `/api-reference` | `ApiPage` |
| `/docs/api` | `ApiDocsPage` |
| `/community` | `CommunityPage` |
| `/privacy`, `/terms` | `PrivacyPage`, `TermsPage` |
| `/trust` | `TrustPage` |
| `/changelog` | `ChangelogPage` |
| `/security` | `SecurityPage` |

**`/all-features`:** redirect to `/features`.

---

## 21. Auth & account lifecycle (lightweight routes)

| Path | Purpose |
|------|---------|
| `/login`, `/auth` | `LoginPage` |
| `/signup` | `SignupPage` |
| `/logout` | `LogoutPage` |
| `/forgot-password` | `ForgotPasswordPage` |
| `/auth/callback` | `AuthCallbackPage` (OAuth / Supabase return) |
| `/oauth-callback` | `OAuthCallbackPage` |

**Guest mode:** Supported via `AuthContext` patterns (`isGuest` checks appear across Settings and dashboard flows).

---

## 22. Developer / internal showcase routes

Mounted under the same dashboard shell (some **not** wrapped in `ProtectedRoute` — see `App.tsx`):

- `/permission-testing` — `PermissionTestingDashboard`
- `/design-system` — `DesignSystemShowcase`
- `/showcase/progress` — `ProgressAnimationShowcase`
- `/showcase/profile-menu` — `ProfileMenuExample`
- `/showcase/event-task-system` — `EventTaskSystemDemo`

---

## 23. Legacy redirects (bookmark compatibility)

Examples: `/dashboard/tasks` → `/tasks`, `/dashboard/calendar` → `/calendar`, `/agents` → `/ai`, `/dashboard/library` & `/library` → `/settings?tab=files`, etc. (full set in `App.tsx`).

---

## 24. Vercel serverless API (`api/`)

Representative **first-party HTTP capabilities** (names from tree):

| Area | Files / endpoints | Role |
|------|---------------------|------|
| **Nexus / AI** | `api/ai/_chat.ts`, `nexus-user.ts`, `nexus-guest.ts`, `_suggestions.ts`, `_stt.ts`, `tts.ts`, `insights.ts`; `_lib/nexus-tool-loop.ts`, `nexus-tools.ts`, `nexus-actions-executor.ts`, `nexus-agent-intent.ts`, `nexus-document-intent.ts`, `nexus-attachments.ts`, `nexus-tool-prompts.ts`, `nexus-audit.ts`, `ai-service.ts` | Chat completions, tool loop, attachments, STT/TTS, guest vs user modes, tracing + firewall helpers. |
| **Nexus tools exposed** | `api/_lib/nexus-tools.ts` | Contract-tested names include: `create_task`, `add_note`, `propose_calendar_hold`, `create_document`, `update_document`, `send_invoice`, `send_document_for_signature`, `enqueue_playbook`, `get_playbook_status`, `cancel_playbook_run`, `search_places`. |
| **Agent HTTP** | `api/agent/[action].ts` | Agent run / executor bridge surface. |
| **Concierge / playbooks** | `api/concierge/[action].ts`, `_lib/concierge-playbook-worker.ts` | Scheduled / long-running playbook orchestration support. |
| **Phone / Twilio / Discord** | `api/phone/[endpoint].ts` + `_route-*.ts` helpers | TwiML, call control, post-call summary, Discord routing. |
| **Maps** | `api/map/resolve-map-url.ts`, `_lib/resolve-map-short-link.ts` | Map URL / short link resolution. |
| **Billing / invoices** | `api/firma/[action].ts`, `api/invoice/track.ts`, `_lib/invoice-html.ts` | E-sign / invoice flows (Firma integration), tracking pixel or status endpoints. |
| **Sales** | `api/sales/inquiry.ts` | Contact / sales inquiry ingestion. |
| **Cron (single function)** | `api/cron/[job].ts` | Dispatches jobs by `?job=` (see §25). |
| **Shared libs** | `_lib/auth.ts`, `observability.ts`, `events.ts`, `contract-runtime-store.ts`, `integration-token-vault.ts`, `agent-llm-adapter.ts` | Auth guards, telemetry, persistence helpers. |

---

## 25. Scheduled jobs (`vercel.json` + `api/cron/[job].ts`)

**Configured schedules (paths in `vercel.json`):**

- `/api/cron/wake-up` — Twilio **wake-up call** (`WAKE_UP_PHONE_NUMBER`, Polly voice, gather speech).
- `/api/cron/guest-cleanup` — calls Edge `auth/guest/cleanup`.
- `/api/cron/process-emails` — calls Edge `growth/emails/process` + optional internal `email-proposal-tick`.
- `/api/cron/invoice-overdue` — internal billing tick via Edge `internal/cron/billing-tick`.
- `/api/cron/phone-dispatch` — `dispatchDueScheduledPhoneCalls()`.
- `/api/cron/market-benchmarks` — internal bench aggregate (`internal/bench/aggregate`).

**Also implemented in the same cron handler switch (may or may not have `vercel.json` rows):** `tts-slo` (probes `/api/ai/tts?probe=1`, optional pre-warm), `billing-tick` alias, `concierge-playbook-tick`.

**Auth:** Cron requests expect `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is set.

---

## 26. Supabase Edge (`supabase/functions/make-server-57781ad9/`)

The Edge bundle is large; filenames indicate **domains** (each may contain many HTTP sub-routes):

- **Auth / guest** — `guest-auth-routes.tsx`
- **AI** — `ai-streaming.tsx`, `ai-model-router.tsx`, `ai-cache.tsx`, `ai-context-optimizer.tsx`, `ai-predictive-prefetch.tsx`, `ai-cross-agent-memory.tsx`, `ai-observatory.tsx`, `ai-ab-testing.tsx`
- **Email** — `email-system-routes.tsx`, `email-automation.tsx`, `email-task-routes.tsx`, `email-templates.tsx`, `admin-email-routes.tsx`, `test-email.tsx`
- **Finance** — `financial-routes.tsx`, `stripe-routes.tsx`, `invoice-billing-cron.tsx`, `providers/plaid-adapter.ts`, `providers/financial-provider.ts`
- **Integrations** — `oauth-routes.tsx`, `integration-actions.tsx`
- **Team / scripts / resources** — `scripts-routes.tsx`, `resources-library-routes.tsx`
- **Bridges** — `hermes-bridge.tsx`, `engram-bridge.tsx`, `openclaw-bridge.tsx` (+ security helpers)
- **Voice / feedback / growth** — `feedback-routes.tsx`, `feedback-intelligence.tsx`, `feedback-digest.tsx`, `growth-automation.tsx`, `customer_intelligence.ts`
- **Discord** — `discord-routes.tsx`
- **Push devices** — `push-device-routes.tsx`
- **Restaurant demo API** — `restaurant-api.tsx`
- **Webhooks** — `webhook-dispatcher.tsx`
- **Misc** — `kv_store.tsx`, `performance_metrics.ts`, `proactive_triggers.ts`, `intelligent_auto_responder.ts`, `demo-gate.ts`, `beta.ts`, `nexus-persona-halo-inspired.ts`

**Separate function:** `supabase/functions/discord-interactions/index.ts`, `stripe-webhook/index.ts`.

---

## 27. Client PWA behavior

`src/pwa/register-sw.ts` registers a service worker via `virtual:pwa-register`: **auto-reload on new version**, offline-ready logging, periodic `registration.update()` every 30 minutes.

---

## 28. iOS / native wrapper

`capacitor.config.ts` exists — native shells can wrap the web app; detailed native feature flags live outside this catalog.

---

## 29. Testing & quality gates (operator features)

Examples: `npm test` (Nexus contracts, route consistency), Playwright specs under `e2e/`, guard scripts in `package.json` (`verify:prod-build`, `guard:dashboard-route-shell`, `verify:nexus-tools-live`, etc.). These are **not** user tabs but they protect feature regressions.

---

## 30. Known overlaps & renaming notes

- **`AIAssistantPage`** is lazy-imported in `App.tsx` but **not routed**; **canonical in-dashboard AI** is **`/ai` → `AppAIPage`**.
- **Library** nav item points to a route that **redirects into Settings → Files** tab.
- **Integrations** appear in `navigation.ts` and command palette, but **desktop sidebar omits** them (mobile comment suggests Settings as hub).

---

## 31. How to keep this document current

When adding a route: update **`src/App.tsx`** and this file. When changing sidebar order: update **`Sidebar.tsx`**, **`MobileNav.tsx`**, and §1. When adding a Vercel cron path: update **`vercel.json`** and §25. When adding a Nexus tool: update **`api/_lib/nexus-tools.ts`** and contract test **`tests/nexus-tools-contract.test.mjs`**.

---

*Last updated: 2026-04-26 — generated from static code inspection in-repo.*
