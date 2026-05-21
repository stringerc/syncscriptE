# SyncScript Business Plan

**Version:** 2026-05-18 (canonical git mirror)  
**In-app source of truth:** Dashboard → **Enterprise** → **Plan** tab → Save / **Copy markdown**  
**Live product:** [https://www.syncscript.app](https://www.syncscript.app)  
**Stack:** Vite/React SPA · Vercel `api/*` · Supabase Edge `make-server-57781ad9` · Stripe billing  

**How to use this document:** Sections **Problem** through **Asks** map 1:1 to the Enterprise Plan UI. Paste each block into the app or run `syncscript_put_business_plan` via MCP (scoped PAT). Deep product inventory: `integrations/research/SYNCSCRIPT_FULL_FEATURE_CATALOG.md`. Positioning canon: `MEMORY.md` § *Product positioning — AI integration vs replacement*.

---

## Executive summary

SyncScript is a **work operating system** for individuals and teams who already use multiple AIs (Claude, ChatGPT, Cursor, phone assistants) but lack a **single place** where those capabilities connect to **tasks, calendar, energy, and voice** with auditability and tenant-scoped data.

**Differentiation (defensible spine):** **Energy-aware scheduling** and **readiness-aligned orchestration**—reordering work by human capacity (circadian / focus state), not only by due dates—plus **Nexus**, a bounded agent layer (chat, voice, phone) that executes **product tools** (create task, calendar hold, document canvas, maps) with traces and contract tests.

**What we are not:** A generic “replace Claude” chatbot. Models are **swappable infrastructure** (`api/_lib/ai-service.ts`: Groq, NVIDIA, Anthropic, OpenAI, …). Value is **when** to apply heavy AI vs light work inside **your** week.

**Business model:** Freemium → **Starter ($19/mo)** → **Professional ($49/mo)** → **Enterprise ($99/mo)** per `src/config/pricing.ts`, with Stripe Checkout and Customer Portal wired (2026-04-26 audit). Enterprise adds governance surfaces (Plan tab, agents, mission control hooks) and compliance-oriented packaging.

**2026 priority:** Narrow the story to the **spine** (Dashboard + Tasks + Calendar + Energy/Resonance + Nexus), prove **retention on scheduling outcomes**, and close **pricing/entitlement consistency** (marketing vs enforced caps). Expand breadth (gaming, financials, etc.) only where it strengthens the spine or clear revenue lines.

---

## Problem

### 1.1 The structural pain

Knowledge workers and founders run their week across **disconnected systems**:

| Layer | Typical tools | Failure mode |
|--------|----------------|--------------|
| Tasks | Notion, Asana, Todoist, Apple Reminders | Priorities ignore **energy** and **context**; AI suggestions live in a side panel |
| Calendar | Google, Outlook, Apple | Meetings consume peak focus; **no bidirectional link** to task completion or agent actions |
| AI | ChatGPT, Claude, Cursor, Gemini | **Stateless** relative to your calendar; no **tool loop** into your real task DB |
| Voice / phone | Siri, raw Twilio bots | Cannot **complete** the same actions as the web app without custom glue |

**Result:** People pay for many subscriptions, re-enter context constantly, and burn **high-focus windows** on low-leverage work—or push deep work into evenings when capacity is gone.

### 1.2 Why incumbents under-serve this slice

- **Horizontal assistants** (ChatGPT, Claude.ai, Copilot) optimize for **general Q&A**, not **tenant-shaped** task+calendar+energy state.
- **Traditional PM tools** add “AI features” as **summaries** and **drafts**, not **parity** across voice, chat, and web with **traced tool execution**.
- **Big Tech suites** (Google Workspace, Microsoft 365) bundle assistants that **default** users into their ecosystem; energy-aware **cross-tool** orchestration is not a first-class product primitive.

### 1.3 Who feels this most acutely

**Primary persona (ICP v1):** Solo founders, senior ICs, and “founder-mode” operators who:

- Run **5–15** meaningful work blocks per day across meetings and maker time  
- Already pay for **≥2** AI tools + a calendar + a task system  
- Will adopt a new surface if it **saves one honest hour per week** on scheduling + follow-through  

**Secondary (v2):** Small teams (2–10) needing shared tasks, activity visibility, and PAT-scoped IDE agents without shipping another internal portal.

---

## Solution

### 2.1 Product thesis

SyncScript **integrates** best-in-class models into **one work OS**:

1. **Capture** — tasks, goals, capture inbox, documents (library), email-adjacent workflows  
2. **Schedule** — calendar (multi-day, holds, Google/Outlook sync groups where connected)  
3. **Align** — energy meter, resonance engine, AI Focus / Today columns on dashboard  
4. **Execute** — **Nexus** (in-app chat + immersive voice + phone path) with **tools**, not prose-only answers  
5. **Extend** — MCP + PAT (`sspat_*`) so **Cursor** and external agents read/write the same Edge APIs as the app  

**Operator framing (from MEMORY):** “Use the best model available **with** SyncScript,” not “be the only model.”

### 2.2 Core capabilities (shipped vs planned)

| Capability | Status | Evidence |
|------------|--------|----------|
| Dashboard (AI Focus, Today, Resource hub) | **Shipped** | `DashboardPage.tsx`, feature catalog §2 |
| Tasks / Projects OS | **Shipped** | `TasksGoalsPage.tsx` |
| Calendar + linked holds | **Shipped** | `CalendarEventsPage.tsx`, Edge calendar routes |
| Energy + Resonance Engine | **Shipped** | `resonance-calculus.ts`, `/energy`, `/resonance-engine` |
| Nexus chat + tools | **Shipped** | `/api/ai/nexus-user`, `nexus-tools.ts`, `npm test` contracts |
| Nexus voice (tools, canvas, maps) | **Shipped** | `VoiceConversationEngine`, smoke runbooks in `deploy/` |
| Stripe billing + portal | **Shipped** | `stripe-routes.tsx`, `BillingSettings`, pricing page |
| Enterprise Plan tab + export | **Shipped** | `EnterpriseBusinessPlanTab.tsx`, Edge `/business-plan` |
| Activity spine + friend feed | **Shipped** | `social-productivity-routes.tsx`, migrations 2026-04-27 |
| Cursor MCP (tasks, calendar, plan, library) | **Shipped** | `integrations/cursor-syncscript-mcp/` |
| Trust / changelog / API docs | **Shipped** | `/trust`, `/changelog`, `/docs/api`, `openapi.json` |
| MiroFish-style scenario swarms | **Plan only** | `MIROFISH_SYNCSCRIPT_FULL_CAPABILITY_PROGRAM.md` |
| Full enterprise SSO/SOC2 | **Packaged / partial** | Enterprise tier claims; Vanta/SOC2 = operator backlog |

### 2.3 Nexus — the execution layer

Nexus is the **bounded agent** inside SyncScript:

- **Same tools** on web chat, voice, and phone where technically feasible (MEMORY parity rule)  
- **Tool traces** for observability (`emitNexusTrace`, research: `NEXUS_OBSERVABILITY_AND_QUALITY.md`)  
- **Multi-provider** routing on Vercel (platform keys + BYOK paths per API docs)  
- **Not** unbounded shell on production user data without scopes (contrast with raw OpenClaw on gateway hosts)

### 2.4 Energy-aware scheduling (the moat)

**Mechanism:** User energy state + circadian-style curves (`getCircadianCurve`, `calculateResonanceScore` in `src/utils/resonance-calculus.ts`) inform **ordering** and **messaging** (landing demo: reorder tasks by high/medium/low energy bands in `LandingPageElite.tsx`).

**Why it matters:** Competing assistants answer “what should I do?” without a **persistent model of capacity** tied to **your** task graph and calendar. SyncScript’s bet is **timing** and **sequencing** as first-class product state.

**Honest limit:** Resonance models are **heuristic wellness UX**, not medical devices—marketing and compliance copy must stay in that lane.

### 2.5 Go-to-market wedge (12 months)

| Phase | Motion | Success signal |
|-------|--------|----------------|
| **W0–W8** | Founder-led design partners (10–20) on **Pro** tier; weekly “week snapshot” via MCP | ≥60% weekly return on dashboard |
| **W8–W20** | Content: “energy-first scheduling” + Nexus voice demos; SEO on `/` prerender | Organic signup → activation (first task + calendar) |
| **W20–W40** | Team tier pilots; PAT for Cursor shops | ≥1 team paid / month |
| **W40+** | Enterprise Plan + scenario lab (MiroFish P2+) if governance gates pass | Enterprise pipeline, not feature count |

---

## Market

### 3.1 Macro context (third-party estimates)

Analyst reports cluster **productivity / business productivity software** in roughly:

| Metric | Range (reports vary) | Notes |
|--------|----------------------|--------|
| 2025 market size | ~$76B–$83B | e.g. Research and Markets, TBRC 2026 reports |
| 2026 market size | ~$87B–$96B | mid-teens % YoY cited in several syndicated reports |
| 2030 projection | ~$144B–$178B | CAGR ~13–16% |

**Trends cited across reports:** AI & predictive analytics as fastest-growing sub-segments; cloud deployment majority; workforce analytics and “employee experience” budgets rising.

**Sources (verify before investor deck):** Research and Markets *Productivity Management Software Market Report 2026*; TBRC *Business Productivity Software Global Market Report 2026*; Grand View Research productivity management software outlook.

### 3.2 TAM → SAM → SOM (reasoned)

| Level | Definition | Order of magnitude |
|-------|------------|---------------------|
| **TAM** | Global productivity + work-management software (above) | ~$90B (2026 mid) |
| **SAM** | English-first knowledge workers using **web calendar + tasks + paid AI** | ~$15B–$25B (subset: PM + assistant + scheduling tools addressable spend) |
| **SOM (3 yr)** | SyncScript reachable: solo pros + small teams, US/EU, productivity-forward | **$2M–$15M ARR** scenario band if PMF; not a forecast |

**SAM narrowing logic:** We do not compete for entire ERP/HR suites. We compete for **wallet share** against Notion AI, Motion, Reclaim, Sunsama, Akiflow, and “ChatGPT plus calendar plugin” stacks—buyers already paying **$15–$60/mo** for productivity.

### 3.3 Competitive landscape

| Competitor class | Examples | Their strength | SyncScript counter |
|------------------|----------|----------------|-------------------|
| AI calendars | Reclaim, Motion | Auto-scheduling | **Energy + task graph + Nexus execution** (voice/tools) |
| All-in-one workspaces | Notion, ClickUp | Docs + tasks | **Deeper calendar+voice parity** and **agent tool loop** |
| Assistants | ChatGPT, Claude | Model quality | **Integration OS**—we win on **workflow completeness**, not raw IQ |
| IDE agents | Cursor | Code | **MCP bridge** to live week state (`syncscript_week_snapshot`) |
| Suite assistants | Microsoft 365 Copilot | Distribution | **Neutrality** across model vendors + founder-speed UX |

**Strategic choice:** Win **depth on the spine**, not tab count. Full catalog breadth (`SYNCSCRIPT_FULL_FEATURE_CATALOG.md`) is a **platform option**, not the marketing story.

### 3.4 Pricing architecture (in-repo facts)

From `src/config/pricing.ts`:

| Plan | Monthly | Annual (per mo) | Position |
|------|---------|-----------------|----------|
| Free | $0 | — | Activation funnel |
| Starter | $19 | $15 | Individuals |
| Professional | $49 | $39 | Power users + voice + API |
| Enterprise | $99 | $79 | Teams, SSO claims, SLA packaging |

**Internal reconciliation required:** Free tier marketing lists “10 tasks/day” on `/pricing` while `LITE_TIER_LIMITS` in `entitlement-contract.ts` standardizes **5/day** (2026-04-26 audit). Business and engineering must **align** before scaling paid acquisition.

---

## Traction

### 4.1 Product & engineering maturity (verifiable)

| Milestone | Status |
|-----------|--------|
| Production deploy | **Live** at syncscript.app; build fingerprint `npm run verify:prod-build` |
| Contract tests | **`npm test`** gates Nexus tools, Edge mounts, MCP contracts |
| Signed-in E2E | Playwright prod smoke for Nexus, productivity Edge (`test:e2e:*`) |
| Billing | Stripe Checkout + portal paths wired |
| Security posture | `/trust`, `security.txt`, OpenAPI, past-due banner |
| IDE bridge | `cursor-syncscript-mcp` + PAT scopes documented |

### 4.2 Metrics to instrument (baseline TBD — fill from analytics)

**North-star (proposed):** **Weekly Active Schedulers** — users who (a) complete ≥1 task or calendar action and (b) view energy/dashboard ≥1× per week.

| Funnel stage | Metric | Tooling |
|--------------|--------|---------|
| Acquisition | Landing → signup | PostHog / Plausible (if configured) |
| Activation | First task + calendar connect | `user_onboarding_progress`, server events |
| Habit | WAU / WAS | Activity spine `user_activity_events` |
| Revenue | Free → paid conversion | Stripe + `SubscriptionContext` |
| Expansion | Pro → Enterprise | Sales-led + in-app upgrade clicks |

**Honesty:** This plan does **not** assert current MRR, user counts, or growth rates—populate from operator dashboards before investor meetings.

### 4.3 Design partner program (next 90 days)

1. Recruit **10** ICP users with written weekly feedback  
2. Require **MCP week snapshot** + one Nexus voice workflow per week  
3. Track **time-to-first-calendar-hold** and **self-reported minutes saved**  
4. Publish **3** anonymized case studies (energy reorder + voice task creation)

### 4.4 Risks to traction narrative

| Risk | Mitigation |
|------|------------|
| Feature surface > core PMF | Freeze non-spine tabs in marketing; roadmap scorecard |
| Voice latency / 504 on long tool loops | `maxDuration`, fast paths, streaming backlog |
| Entitlement drift (free limits) | Single source `entitlement-contract.ts` + pricing copy audit |
| AI vendor churn | Multi-provider adapter; no single-model brand dependency |

---

## Team

### 5.1 Current stage

**Founder-led** product engineering with AI-assisted development (Cursor, agents, Edge/Vercel ops). Institutional hires are **planned**, not assumed in base financials.

### 5.2 Roles to hire (priority order)

| Priority | Role | Mandate |
|----------|------|---------|
| P0 | **Founding PM / GTM** | ICP interviews, pricing experiments, case studies |
| P1 | **Senior full-stack** | Spine reliability, billing enforcement, performance |
| P2 | **ML/Applied scientist (part-time)** | Resonance validation, ethical bounds, A/B on scheduling |
| P3 | **Enterprise AE (contract)** | SSO pilots, security questionnaire, ProcureDesk motion |

### 5.3 Advisors (target profile)

- **B2B SaaS GTM** (PLG → sales-assisted)  
- **Healthcare-adjacent wellness** compliance if resonance claims expand  
- **Voice AI / telephony** (Nexus phone, Twilio cost discipline)

*Fill names, bios, and cap table in the in-app Plan tab—do not commit personal data to git without consent.*

---

## Financials

### 6.1 Revenue model

**Primary:** Subscription (Stripe), monthly/annual per tier.  
**Secondary (future):** Usage-based AI overage, Enterprise custom SOW, marketplace take rate on scripts/templates.  
**Non-goal (2026):** Ads, selling user data, training foundation models on tenant data without contract.

### 6.2 Unit economics (illustrative)

Assume **Professional** as core paid tier ($49/mo list):

| Line item | Assumption |
|-----------|------------|
| ARPU (blended) | $35–$45/mo after annual/discount |
| Gross margin target | 75–85% at scale (Vercel + Supabase + LLM variable) |
| LLM COGS per active Pro | $3–$12/mo (depends on Nexus voice + tool depth) |
| CAC (founder-led) | Low cash; time cost dominant |
| CAC (paid) | Target **<3 mo** payback on Pro when paid marketing starts |

### 6.3 Three-year scenario sketch (not guidance)

| Year | Paid subs (illustrative) | Blended ARPU/mo | ARR band |
|------|--------------------------|-----------------|----------|
| Y1 | 200–800 | $40 | $0.1M–$0.4M |
| Y2 | 2k–6k | $42 | $1M–$3M |
| Y3 | 8k–20k | $45 | $4M–$11M |

**Sensitivity drivers:** Conversion free→Pro, churn, voice/LLM COGS, enterprise mix.

### 6.4 Cost structure (operating)

| Category | Drivers |
|----------|---------|
| Infra | Vercel, Supabase, Edge functions, TTS (Kokoro/tunnel ops in MEMORY) |
| AI APIs | Platform keys on `nexus-user`; monitor per-user caps |
| People | Founders → first 4 FTE = dominant opex |
| Compliance | SOC2/Vanta when Enterprise pipeline warrants |

### 6.5 Use of funds (if raising)

| Allocation | % | Purpose |
|------------|---|---------|
| Engineering | 50% | Spine, Nexus reliability, mobile parity |
| GTM / brand | 25% | Content, design partners, first AE |
| Infra + AI COGS reserve | 15% | Rate limits, voice SLO |
| Legal / compliance | 10% | SOC2, DPAs, insurance |

---

## Asks

### 7.1 From investors (if applicable)

- **$1.5M–$3M seed** (illustrative) at 18–24 months runway to prove **WAS** retention and **$1M ARR path** clarity  
- **Strategic angels** with calendar/task distribution (Notion ecosystem, devtool influencers)  
- **Introductions** to 5 design-partner teams (10–50 employees) with scheduling pain

### 7.2 From partners

- **Google / Microsoft** calendar API quota and verification support  
- **Stripe** Atlas-style billing guidance for annual SKUs (env: `STRIPE_PRICE_*_YEAR`)  
- **Model providers** (NVIDIA, Groq, Anthropic) startup credits for Nexus COGS control

### 7.3 From the founding team (internal)

1. **Align** free-tier limits and marketing copy (**5 vs 10 tasks**)  
2. **Ship** weekly metrics dashboard off `user_activity_events`  
3. **Run** 10 design-partner interviews; update this plan’s Traction section with real quotes  
4. **Save** this document in-app (Enterprise → Plan → Save) so MCP and Cursor stay synced  
5. **Defer** MiroFish simulation until P0–P2 exit criteria in capability program are green

---

## Appendix A — Strategic principles (Fortune-500 discipline, startup speed)

1. **One spine, one story** — Dashboard · Tasks · Calendar · Energy · Nexus  
2. **Measure before scale** — Every launch tied to a metric in §4.2  
3. **Agent safety** — Scoped tools, PATs, traces; no silent prod automation without gates  
4. **Finish what we ship** — `MEMORY.md` § *Work completion*; verify scripts per surface  
5. **Honest AI** — Multi-provider; no fake autonomy; wellness claims bounded  

## Appendix B — Key documents

| Document | Path |
|----------|------|
| Feature catalog | `integrations/research/SYNCSCRIPT_FULL_FEATURE_CATALOG.md` |
| Positioning | `MEMORY.md` § Product positioning |
| MCP operating model | `MEMORY.md` § MCP operating model |
| Nexus smoke | `deploy/SMOKE_TEST_NEXUS_VOICE_DOC_MAP.md` |
| MiroFish program (future) | `integrations/research/MIROFISH_SYNCSCRIPT_FULL_CAPABILITY_PROGRAM.md` |
| Cursor rule | `.cursor/rules/14-enterprise-business-plan-cursor.mdc` |

## Appendix C — Sync to app

```bash
# After editing this file:
# 1. Open syncscript.app → Enterprise → Plan
# 2. Paste sections → Save
# Or use MCP: syncscript_put_business_plan (business_plan:write scope)
```

---

*Confidential — SyncScript. Update when pricing, traction, or strategy materially changes.*
