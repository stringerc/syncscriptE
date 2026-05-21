# SyncScript × MiroFish-class simulation — **full capability program** (canonical plan)

**Document type:** End-to-end **capabilities and program** specification — **no implementation** in this file.  
**Intent:** One place to **analyze SyncScript**, define **what could exist**, and **phase** work so future sessions **execute and measure** rather than re-planning from scratch.  
**Companion (facts + short roadmap):** **`MIROFISH_SYNCSCRIPT_STRATEGIC_PLAN.md`**.  
**Date:** 2026-05-09

---

## Table of contents

1. [How to use this document](#1-how-to-use-this-document)  
2. [Glossary](#2-glossary)  
3. [Fact anchor (external stack)](#3-fact-anchor-external-stack)  
4. [SyncScript — full-stack analysis frame](#4-syncscript--full-stack-analysis-frame)  
5. [North star — “revolutionary” in defensible terms](#5-north-star--revolutionary-in-defensible-terms)  
6. [Capability domain A — Work spine (as-is leverage)](#6-capability-domain-a--work-spine-as-is-leverage)  
7. [Capability domain B — Simulation & swarm runtime](#7-capability-domain-b--simulation--swarm-runtime)  
8. [Capability domain C — Knowledge graph & memory plane](#8-capability-domain-c--knowledge-graph--memory-plane)  
9. [Capability domain D — Human control, audit, and replay](#9-capability-domain-d--human-control-audit-and-replay)  
10. [Capability domain E — Product surfaces (binding map)](#10-capability-domain-e--product-surfaces-binding-map)  
11. [Capability domain F — Commercial, tenancy, and quotas](#11-capability-domain-f--commercial-tenancy-and-quotas)  
12. [Capability domain G — Trust, safety, ethics, compliance](#12-capability-domain-g--trust-safety-ethics-compliance)  
13. [Capability domain H — Observability, calibration, and research discipline](#13-capability-domain-h--observability-calibration-and-research-discipline)  
14. [Full phased program (P0–P8) with exit criteria](#14-full-phased-program-p0p8-with-exit-criteria)  
15. [Success metrics catalog](#15-success-metrics-catalog)  
16. [Explicit non-goals](#16-explicit-non-goals)  
17. [Appendix — repo pointers for implementation](#17-appendix--repo-pointers-for-implementation)

---

## 1. How to use this document

| Role | Action |
|------|--------|
| **Founder / PM** | Use §5–§11 for **narrative** and **surface binding**; §14 for **gates** and **order**. |
| **Architect** | Use §4, §7–§9, §17 for **boundaries** (sidecar, events, tenancy). |
| **Operator** | Use §11–§13 + §15 for **SLOs**, **budgets**, and **kill signals**. |
| **Implementer** | **Do not** start code until **P0** exit criteria in §14 are met; then pick a phase and ship **only** that phase’s capability slice. |

**Rule:** Any future doc that “re-plans” swarm simulation should **either** update this file **or** link here as **superseded by** a dated revision — avoid parallel canon.

---

## 2. Glossary

| Term | Meaning in this program |
|------|-------------------------|
| **Seed** | User- or org-supplied **documents, URLs, notes, or structured snippets** that define a scenario’s starting world. |
| **World / environment** | Bounded **rules of interaction** (channels, time steps, action space) in which synthetic agents operate. |
| **Persona** | A synthetic actor with **role, goals, constraints, memory policy, and tool allowlist**. |
| **Swarm** | **N ≥ 2** personas with **scheduled or event-driven** interaction (not necessarily “millions”). |
| **Simulation run** | One **versioned** execution: seed → graph → steps → artifacts. |
| **Report** | **Synthesized** narrative + metrics + citations to **internal run logs** (not to “truth”). |
| **Rehearsal** | Explicit framing: **counterfactual** exploration, not verified prediction. |
| **Calibration** | Comparing **rehearsal outputs** to **later observed reality** under the same tenant controls. |
| **Sidecar** | Separate **deployable** (container / worker fleet) with a **narrow API** to the SyncScript control plane. |
| **Work spine** | Tasks, calendar, energy/readiness, activity events, capture inbox, library, MCP/PAT productivity edge. |

---

## 3. Fact anchor (external stack)

**MiroFish** (public README on [666ghj/MiroFish](https://github.com/666ghj/MiroFish)): seed → **GraphRAG** → persona generation → **OASIS**-powered simulation ([camel-ai/oasis](https://github.com/camel-ai/oasis)) → **ReportAgent** → deep interaction; depends on **LLM** (OpenAI-compatible) and **Zep**; high **token** cost; README warns to start with **small round counts**.

**Unverified viral claims** (e.g. specific **agent counts**, “**Voices**” product, **10-day** build): **out of scope** for this program’s **requirements** until sourced in **versioned** upstream docs or your own benchmarks.

---

## 4. SyncScript — full-stack analysis frame

This is the **lens** for “analyze SyncScript all the way through” without rewriting the **feature catalog**.

| Layer | What exists today (capabilities relevant to simulation) | What a top-tier program **adds** |
|-------|-----------------------------------------------------------|----------------------------------|
| **Client (Vite/React)** | Rich dashboard: tasks, calendar, energy, resonance, AI, enterprise, analytics, Nexus voice shell, command palette. | **Run launcher**, **progress UX**, **diff/replay viewers**, **governance banners** (rehearsal vs fact). |
| **Vercel `api/*`** | Nexus user loop, TTS, maps, webhooks, crons, agent routes, BYOK patterns. | **Thin orchestration**: enqueue run, signed webhooks from sidecar, **artifact ingest** APIs. |
| **Supabase + Edge** | RLS-scoped user data, productivity routes, library, capture inbox, activity, PAT model. | **Run registry** tables, **artifact storage** pointers, **quota enforcement**, **audit log** streams. |
| **Hermes / OpenClaw / Engram** | Long-running tool loops, gateway patterns, playbooks. | **Optional** delegation of **long** sim steps to executor tier; **not** a substitute for **deterministic** run state in DB. |
| **MCP / PAT** | External IDE bridge, week snapshot, library upload. | **Scoped tools** for “attach seed from task”, “fetch run summary”, **never** silent cross-tenant reads. |
| **Research / MEMORY** | Curated ops + INDEX discipline. | **Every** new capability has **INDEX row + repro + cost note**. |

**Deep inventory:** **`SYNCSCRIPT_FULL_FEATURE_CATALOG.md`** — use it when binding §10 to **exact routes and modules**.

---

## 5. North star — “revolutionary” in defensible terms

**Aspirational but auditable thesis:** SyncScript becomes the first **mainstream work OS** (not a lab demo) where **counterfactual cohorts** are **standard equipment** for decisions — **always** tied to **tenant-owned work state**, **always** **budgeted**, **always** **labeled as rehearsal**, and **automatically** **compared to what actually happened** when users opt in.

**What “eons ahead” means here (capability language, not hype):**

1. **Epistemic hygiene as a product primitive** — Every run ships **assumption manifest**, **model list**, **seed fingerprint**, **random seed / branch id**, **cost meter**.  
2. **Closed-loop learning** — Hypotheses link to **tasks / calendar / campaigns**; outcomes feed **calibration** dashboards.  
3. **Governed scale** — Swarms are **quota’d personas** with **role templates** and **tool firewalls**, not unbounded internet mobs.  
4. **Architectural separation** — ** AGPL / cost / blast radius** live in a **sidecar**; SyncScript remains the **system of record for intent and outcomes**.

If history remembers the product, it will be for **discipline under scale**, not for the **largest** agent count on a slide.

---

## 6. Capability domain A — Work spine (as-is leverage)

**Capabilities SyncScript already has or can extend without a sim engine:**

| ID | Capability | User-visible effect |
|----|------------|---------------------|
| A1 | **Attach structured context to work** | Tasks, goals, calendar holds, capture inbox, library files as **scenario anchors**. |
| A2 | **Activity + social spine** | `user_activity_events` (and related) as **outcome telemetry** for calibration. |
| A3 | **Energy / readiness signals** | Schedule **expensive** runs when readiness is high or in **batch windows** (heuristic policy). |
| A4 | **Nexus multi-tool traces** | Pattern for **stepwise** auditable agent behavior (`emitNexusTrace` philosophy) — **reuse** for sim step traces. |
| A5 | **Enterprise / Plan surfaces** | Natural home for **“Scenario lab”** and **governance** toggles. |
| A6 | **MCP week snapshot** | IDE agents pull **the same world** users see — **consistent** seeds for rehearsal. |

**Program note:** Simulation features **must** read/write through these primitives where possible — **no parallel shadow task system**.

---

## 7. Capability domain B — Simulation & swarm runtime

**New capabilities** (typically in **sidecar** + thin **control plane** in SyncScript):

| ID | Capability | Description |
|----|------------|-------------|
| B1 | **Deterministic run identity** | Globally unique `run_id`, **tenant_id**, **version**, **immutable** seed bundle hash. |
| B2 | **Parameterized worlds** | Choose **channel set** (e.g. internal-only “memo”, “forum”, “market tick”), **time resolution**, **max rounds**. |
| B3 | **Persona templates** | Library of **roles** (skeptic, champion, regulator, customer segment, competitor proxy) with **default prompts + constraints**. |
| B4 | **Population control** | **N_min / N_max** per tier; **auto-prune** redundant personas; **stratified sampling** instead of naive scale. |
| B5 | **Step engine** | **Discrete ticks** or **event graph** execution; **checkpoint** after each tick for **replay**. |
| B6 | **Stochastic control** | **Branching** runs (same seed, **multi-sample** Monte Carlo) with **merge** analytics. |
| B7 | **Intervention hooks** | **Operator injects** events mid-run (“policy announcement”, “price change”) — **god-mode** with audit. |
| B8 | **Stop conditions** | Time cap, token cap, **convergence** heuristics, **manual abort**. |
| B9 | **Artifact bundle** | Export **graph snapshot**, **transcript**, **metrics CSV**, **report MD/PDF**, **trace JSON**. |

**OASIS / MiroFish-class reuse (optional):** Fork, vendor, or **clean-room** reimplementation — **license + security review** before **in-process** embedding.

---

## 8. Capability domain C — Knowledge graph & memory plane

| ID | Capability | Description |
|----|------------|-------------|
| C1 | **Seed ingestion pipeline** | PDF/Markdown/URL → **normalized** text + **citation map** + **PII scan** gate. |
| C2 | **Entity / relation extraction** | GraphRAG-style **ontology** per vertical (product, policy, market). |
| C3 | **Graph versioning** | **Per-run** graph revision; **diff** between runs. |
| C4 | **Long-horizon memory policy** | **Zep-like** or **tenant-scoped** vector + KV with **TTL** and **legal hold** flags. |
| C5 | **Grounding rules** | Agents **must** cite **graph edge ids** when asserting “facts” from seed; **unknown** bucket explicit. |
| C6 | **Cross-run memory** | Optional **org-level** “institutional memory” with **strict** opt-in (default off per tenant). |

---

## 9. Capability domain D — Human control, audit, and replay

| ID | Capability | Description |
|----|------------|-------------|
| D1 | **Human gates** | **Approve** before: external send, public publish, bulk user messaging, **> $X** token spend. |
| D2 | **Full replay** | Step through any tick with **same code version** pin (container digest). |
| D3 | **Diff viewer** | Side-by-side **two runs** (seed delta or policy delta). |
| D4 | **Red team templates** | One-click **adversarial** persona packs for **stress** scenarios (internal use). |
| D5 | **Lineage export** | **SOC2-friendly** artifact: who launched, what seed, what models, what outputs. |

---

## 10. Capability domain E — Product surfaces (binding map)

Each row: **when this surface gains capabilities**, **what the user can do** (no UI spec here — **capability** only).

| Surface (see feature catalog) | New user capabilities |
|--------------------------------|------------------------|
| **Dashboard / Today** | “**Rehearse this week**” from **conflicts + weather + top tasks** → spawns run with **pre-filled seed**. |
| **Tasks / Projects OS** | Attach **run** to epic; **promote** simulation action item to **real task** with **trace link**. |
| **Calendar** | **Counterfactual** load scenarios (“+20% meetings”) → **heatmap diff** vs actual calendar metrics. |
| **Energy / Resonance** | **Cost-aware** run scheduling; **readiness** as **input feature** to persona stress (optional). |
| **AI / Nexus** | **Explain run** in natural language; **forbidden**: Nexus **silently** spawning million-agent swarms without **budget** UI. |
| **Enterprise / Plan** | **Scenario lab**: attach runs to **business plan** export; **governance** matrix per org. |
| **Analytics** | **Calibration** charts: rehearsal vs outcomes by **segment**. |
| **Capture inbox** | **Suggest seeds** from captured items (human commit still required). |
| **Library** | Seed packs as **first-class assets** with **ACL** and **versioning**. |
| **Settings / Privacy** | **Kill switch** per tenant; **data residency** choice for sidecar region. |
| **MCP (Cursor)** | Tools: `enqueue_rehearsal_run`, `get_run_status`, `attach_run_to_task` — **PAT-scoped**. |

---

## 11. Capability domain F — Commercial, tenancy, and quotas

| ID | Capability | Description |
|----|------------|-------------|
| F1 | **Entitlement tiers** | Free: **0** or **tiny** runs; Pro: **N** personas / month; Enterprise: **contract** caps + **VPC** sidecar. |
| F2 | **Token accounting** | **Per-tenant** LLM meter; **overage** alerts; **graceful degrade** to smaller N. |
| F3 | **Multi-tenant isolation** | **Hard** boundary: no **graph** or **artifact** reads across tenants; **crypto** separation optional. |
| F4 | **Billing hooks** | Stripe / usage line items for **“simulation credits”** (if product goes market). |
| F5 | **SLA class** | **Best-effort** vs **committed completion window** for run queue. |

---

## 12. Capability domain G — Trust, safety, ethics, compliance

| ID | Capability | Description |
|----|------------|-------------|
| G1 | **Synthetic labeling** | Watermarks on every **export**: “**synthetic cohort** — not human survey data.” |
| G2 | **Real-person firewall** | **Block** simulating **named private individuals** without **documented consent** workflow. |
| G3 | **Disinformation controls** | **No** default public posting from sim agents; **rate limits** on “world news” seeds from unverified URLs. |
| G4 | **Copyright / training** | Default: **no** use of customer seeds for **global model training**; contract option for **private fine-tune** (future). |
| G5 | **AGPL / OSS compliance** | **Legal sign-off** on any **networked** derivative of AGPL stacks; **SBOM** for sidecar images. |
| G6 | **Incident playbooks** | Runaway cost, toxic output, **jailbreak** of persona toolchains → **auto-stop** + operator page. |

---

## 13. Capability domain H — Observability, calibration, and research discipline

| ID | Capability | Description |
|----|------------|-------------|
| H1 | **Run telemetry** | Latency per tick, **tokens** per persona class, **failure taxonomy**. |
| H2 | **Calibration KPIs** | Brier-style **scoring** for **binary** predictions; **MAPE**-like for numeric; **qual** rubrics for narrative. |
| H3 | **Research INDEX integration** | Every methodology change → **INDEX** row + **MEMORY** pointer + **cost table** update. |
| H4 | **Dogfood loop** | Internal **weekly** rehearsal on **roadmap** items → **lessons** filed before customer GA. |
| H5 | **External publication** | Optional **anonymized** benchmark blog posts — **only** after legal review. |

---

## 14. Full phased program (P0–P8) with exit criteria

**Rule:** Do not start **P(n+1)** until **P(n)** exit criteria are **documented as met** (link commit, ADR, or ops log).

| Phase | Objectives | **Capabilities delivered** | Exit criteria (must all pass) |
|-------|------------|-----------------------------|-------------------------------|
| **P0 — Evidence** | License, cost, architecture read | B1 (doc only), G5 desk review | Written **AGPL / OSS** decision; **$/run** estimate from **one** sandbox sim; ADR filed in research |
| **P1 — Contract** | Frozen **sidecar API** | B1, B9 (schema only), D5 draft | OpenAPI + **mock** server; contract tests **green** in CI (no prod) |
| **P2 — Control plane MVP** | Tenant-safe run registry | B1–B3 (minimal), F1–F3, G2 rules doc | **RLS** stories written; **no** cross-tenant test failures |
| **P3 — Sidecar alpha** | Execute **one** world template | B2, B5, B8, C1–C2 (minimal), D2 | **Replay** works for **3** ticks; **abort** works; **cost** within pilot budget |
| **P4 — Product alpha** | **Enterprise** entry only | E (Enterprise + Library subset), D1 | **10** design partners; **zero** critical governance incidents |
| **P5 — Nexus / AI explain** | Read-only explain + enqueue | E (AI), B9 | User can **summarize** run + **cannot** bypass **budget** UI |
| **P6 — Calibration beta** | Outcome linkage | A2, H2, H3 | **≥ X** hypotheses tracked; first **calibration** report published internally |
| **P7 — MCP + tasks binding** | IDE + task integration | A6, E (Tasks), MCP tools | PAT tools in **`verify:cursor-syncscript-mcp`** extended; docs in **openapi** |
| **P8 — GA hardening** | Scale + SLO | F2, F5, H1, G6 | Load test **N** concurrent runs; **SLO** met; **rollback** drill passed |

**Kill signals (any → pause program):** median **$/run** exceeds **tier** economics; **misinformation** incident; **regulatory** letter; **security** finding on sidecar; **< 20%** pilot users derive **actionable** value (define rubric in P4).

---

## 15. Success metrics catalog

| Metric | Definition | Owner |
|--------|------------|-------|
| **Time-to-first-rehearsal** | Minutes from **seed upload** to **first readable report** | PM |
| **Calibration drift** | Error of **rehearsal-implied** vs **realized** metrics over **90d** | Data |
| **Cost per insight** | **$ / user-reported** decision changed | Finance |
| **Governance pass rate** | % runs passing **policy scanner** before execution | Security |
| **Replay fidelity** | Bit-identical **re-run** on pinned digest (where deterministic) | Eng |
| **NPS (enterprise pilot)** | Qual after P4 | PM |

---

## 16. Explicit non-goals

1. **Replacing** weather, calendar sync, or **energy physics** with simulations.  
2. **Claiming** verified **prediction** of real markets or elections **without** licensed data + **statistical** governance.  
3. **Embedding** AGPL **code paths** inside **`build/`** without **legal** completion.  
4. **Silent** outbound **email/sms/social** from synthetic personas.  
5. **Training** global foundation models on **customer** seeds **by default**.

---

## 17. Appendix — repo pointers for implementation

| Concern | Where to start (existing repo) |
|---------|--------------------------------|
| **Routing / surfaces** | `SYNCSCRIPT_FULL_FEATURE_CATALOG.md`, `App.tsx`, `Sidebar.tsx` |
| **Productivity / PAT** | `integrations/cursor-syncscript-mcp/`, Edge productivity routes |
| **Multi-agent ops** | `.cursor/rules/09-multi-agent-orchestration.mdc`, `integrations/agent-playbooks/` |
| **Trust + skills hygiene** | `.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`, `AGENT_SKILL_PREFLIGHT_CHECKLIST.md` |
| **Context discipline** | `.cursor/rules/16-agent-output-discipline-and-context.mdc` |
| **Long-term memory** | `MEMORY.md`, `integrations/research/INDEX.md` |
| **Simulation research (short)** | `MIROFISH_SYNCSCRIPT_STRATEGIC_PLAN.md` |

---

**Revision policy:** Bump **Date** and add a **Revision** subsection when phases complete or kill signals trigger — keep **one** canonical program file until a future ADR explicitly splits “v2 program.”
