# MiroFish-style swarm simulation ↔ SyncScript — strategic plan (research only)

**Status:** Plan and facts for decision-making — **no product implementation** in this pass.  
**Date:** 2026-05-09

**Canonical end-to-end program (capabilities only, P0–P8, no re-planning):** **`MIROFISH_SYNCSCRIPT_FULL_CAPABILITY_PROGRAM.md`** — use that document for **full SyncScript analysis frame**, **capability domains A–H**, **product binding**, **metrics**, **non-goals**, and **phase gates**. This file stays the **short fact anchor** + early roadmap sketch.

---

## 1. What the transcript describes (normalized)

A **seeded, multi-agent social simulation**: upload **seed material** (news, events, documents); build structured **world knowledge**; spawn **many personas** with memory and behavior; run them in a **simulation engine** where they interact over time; then a **reporting agent** summarizes **patterns** and outcomes so a human can interpret “what might happen next.”

That pattern is **not** the same as a single chat assistant or a deterministic dashboard — it is **generative + interactional + aggregate**.

---

## 2. Fact check — what **MiroFish** actually is (primary: upstream README)

**Source:** [666ghj/MiroFish](https://github.com/666ghj/MiroFish) `README.md` (English), retrieved 2026-05-09.

| Claim (video / social) | Grounded in README |
|------------------------|----------------------|
| Upload **seed material** | Yes — “Upload seed materials … describe your prediction requirements.” |
| **GraphRAG** / graph from input | Yes — workflow step **“Graph Building”**: “Seed extraction … GraphRAG construction.” |
| Many **personas** with memory | Yes — “thousands of intelligent agents with independent personalities, long-term memory, and behavioral logic.” |
| Engine called **OASIS** | Yes — simulation engine credited to **[OASIS (Open Agent Social Interaction Simulations)](https://github.com/camel-ai/oasis)** (CAMEL-AI). |
| **Report** agent after simulation | Yes — step **“Report Generation”**: “ReportAgent with rich toolset.” |
| Open source / self-host | Yes — GitHub repo, `npm run setup:all`, Docker option, `.env` for API keys. |
| **Zep** | Yes — `.env.example` pattern in README includes **ZEP_API_KEY** (Zep Cloud). |
| **“1 million agents”** / “Voices” | **Not verified** in the README excerpt reviewed here — treat as **marketing or external product** until traced to a specific subsystem with documented limits, cost model, and license. |
| **“Built in 10 days”** / **“3 hour course”** | **Narrative** — ignore for architecture; use only as social proof of team velocity, not a spec. |

**License:** Confirm in-repo **`LICENSE`** before any **derivative service** or **networked AGPL** coupling — AGPL-style obligations can affect how you **expose** a modified stack over a network. **Do not** assume MIT.

**Dependencies (operational):** README expects **LLM** (OpenAI-compatible API), **Zep**, Node **18+**, Python **3.11–3.12**, **uv**. Simulations are **high token / high cost**; README itself warns to try **&lt; 40 rounds** first.

---

## 3. What SyncScript is optimized for today (contrast)

| Dimension | SyncScript (this repo’s product thesis) | MiroFish-style stack |
|-----------|------------------------------------------|------------------------|
| **Primary job** | **Tenant-shaped work OS**: tasks, calendar, energy-aware scheduling, Nexus tools/voice, billing-adjacent flows, MCP bridge. | **Counterfactual social simulation** from seeds → aggregate “world” behavior → report. |
| **Truth source** | **User + org data** (Supabase), contracts, **`npm test`**, prod fingerprints. | **Synthetic agents** + graph from seeds; outcomes are **hypothetical**, not ground truth. |
| **Multi-agent today** | **Hermes / OpenClaw / Engram** as **orchestrated executors** with playbooks and gates — not 10⁴ autonomous personas in a social grid. | Large **population** of interacting personas in a **sim environment** (OASIS pattern). |
| **Risk posture** | Trust, PAT scopes, protected surfaces (**02**), Edge RLS. | **Epistemic risk** (“simulation said X”) + **misinformation** if outputs are treated as forecasts without calibration. |

So: **incorporation** should sharpen SyncScript’s **differentiation**, not turn the dashboard into an ungoverned “opinion factory.”

---

## 4. What we could do **differently** if we incorporate (design axes)

These are **optional directions**, not commitments.

### A. **Grounded rehearsal, not “magic prediction”**

- **Different:** Label outputs explicitly as **scenario rehearsal** with **assumptions**, **seed hash**, **model IDs**, and **run budget** — never as verified futures.
- **Ahead of naive tools:** Same UI pattern as **flight simulators** for policy/product: **replayable**, **diffable** runs (compare two seeds or two parameter injections).

### B. **Closed loop with real outcomes**

- **Different:** After a simulation recommends an action (e.g. messaging tone, launch timing), **log the hypothesis** in **`user_activity_events`** / research notes and **compare** to what actually happened (conversion, support load, calendar load).
- **Ahead:** Most swarm demos stop at a PDF report; SyncScript could **tie simulation artifacts to the same spine** that already tracks **work + calendar + activity** (where privacy allows).

### C. **Energy- and cost-aware orchestration**

- **Different:** Use **energy / circadian / cost** signals (existing **`resonance-calculus.ts`** *heuristic* layer + infra cron discipline) to **schedule** heavy swarm jobs off-peak or in **batch** with explicit **token ceilings** per tenant.
- **Ahead:** “Swarm” products often burn **unbounded LLM budget**; a work OS that **prices runs** against **tenant tier + time-of-day** is a real product wedge.

### D. **Governed personas inside **existing** agent tiers**

- **Different:** Do **not** ship anonymous internet-scale mobs inside Nexus chat. Instead: **named roles** (PM, Legal reviewer, Skeptic, Customer segment A…) with **tool allowlists**, **PAT scopes**, and **playbook tiers** (already aligned with concierge / policy thinking in **MEMORY**).
- **Ahead:** **Auditable** multi-agent traces (`emitNexusTrace`-style lineage) for **simulation steps**, not only final prose.

### E. **Legal / compliance boundary as a product feature**

- **Different:** **Enterprise** “scenario lab” with **data residency**, **no training on customer seeds** by default, **export controls** on reports, and **human sign-off** before any customer-facing action.
- **Ahead:** Consumer viral demos optimize for **wow**; B2B wins on **defensibility** and **audit**.

### F. **Integration shape: sidecar, not monolith**

- **Different:** Run MiroFish (or a **clean-room** OASIS-inspired worker) as a **separate deployable** with strict API; SyncScript UI is a **thin client** for **launch run → poll → attach report** to a **task** or **Plan** doc.
- **Ahead:** Avoids AGPL/coupling surprises in the main SPA; scales ops independently.

---

## 5. What would make SyncScript **structurally ahead** (defensible claims only)

Avoid “eons” as a literal claim; below is **sharp differentiation** that is **credible** if executed well.

1. **Prediction is labeled + measured** — Simulations are **hypotheses** with **logged assumptions** and **post-hoc scoring** against real metrics in-app.
2. **Work spine coupling** — Scenarios attach to **tasks**, **calendar holds**, **capture inbox**, and **business plan** exports — not a disconnected toy world.
3. **Cost + safety governance** — Per-tenant **budgets**, **role-based personas**, **no silent auto-post** to social media or email from sim agents without explicit gates (contrast open-ended “Twitter-like” sandboxes).
4. **Multi-runtime honesty** — Clear split: **Cursor** = repo editing; **Hermes** = long runs; **simulation worker** = batch world — already matches **09** / **12** philosophy; extend with one more **bounded** runtime.
5. **Research hygiene** — Any study lands in **`integrations/research/INDEX.md`** with **repro + limits** (same discipline as **Obsidian** / **Claude skills** maps).

---

## 6. Risks to name explicitly

| Risk | Mitigation (plan-level) |
|------|-------------------------|
| **Simulation mistaken for truth** | UI copy, disclaimers, confidence bands, mandatory “assumptions” block. |
| **Cost explosion** | Hard caps, queueing, preview with small N agents. |
| ** AGPL / license infection** | Legal review before embedding; prefer **API sidecar** or **clean-room** design inspired by OASIS concepts. |
| **Misinformation / reputation harm** | No default “public opinion” claims about real people; blocklists, human review for externalized content. |
| **Privacy** | Seeds must be **user-uploaded or licensed**; no scraping private calendars into a public graph without consent. |

---

## 7. Phased roadmap (plan only — no build here)

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **P0 — Research spike** | Read OASIS + MiroFish LICENSE; run **one** self-hosted sim in a **sandbox** project; document token cost per run. | Written limits + cost curve + license note in **INDEX**. |
| **P1 — Sidecar contract** | Define REST/queue API: `POST /runs` → `GET /runs/:id` → artifact URL + summary JSON. | Contract doc + mock server; no SyncScript UI yet. |
| **P2 — Product wedge** | “Scenario lab” for **Enterprise Plan** tab: attach report to **business plan** markdown export (**14** rule alignment). | Feature flag; PAT/JWT scoped; no Nexus protected edits. |
| **P3 — Closed loop** | Store **hypothesis vs outcome** rows; dashboard widget “calibration over time.” | Privacy review + minimal analytics. |

---

## 8. References (bookmark)

- [666ghj/MiroFish](https://github.com/666ghj/MiroFish) — README workflow, setup, acknowledgments.  
- [camel-ai/oasis](https://github.com/camel-ai/oasis) — OASIS engine.  
- SyncScript continuity: **`MEMORY.md`**, **`.cursor/rules/09-multi-agent-orchestration.mdc`**, **`.cursor/rules/16-agent-output-discipline-and-context.mdc`**, **`integrations/research/MCP_PARITY_AND_ROADMAP.md`**.

When this moves from plan → build, add a row to **`integrations/research/INDEX.md`** with **date**, **outcome**, and **artifact path**.
