# Viral “five Claude skills” video — fact map ↔ Cursor + SyncScript

**Purpose:** Decompose a typical **social clip** (“install these now / get ahead of 99%”) into **verifiable sources**, **what actually exists**, and **what this repo implements** so operators do not confuse **Claude Code skills** with **Cursor Agent Skills** or ship unvetted prompt packs.

**Date:** 2026-05-09

---

## 1. Product vocabulary (do not conflate)

| Term | What it is | Where it runs |
|------|------------|----------------|
| **Claude Code skills** | Folders with **`SKILL.md`** (+ optional assets); **progressive disclosure** — body loads when relevant. Open **Agent Skills** standard + Claude Code extensions. | **Claude Code** CLI; paths like **`~/.claude/skills/`** or project **`.claude/skills/`**. Official: [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills). Standard hub: [agentskills.io](https://agentskills.io/). |
| **Cursor Agent Skills** | Same *idea* (markdown instructions for the agent), different **install path** and discovery — see Cursor **create-skill** workflow; project: **`.cursor/skills/<name>/SKILL.md`**. | **Cursor IDE** agent only (not Claude Code). |
| **Cursor Rules (`.mdc`)** | Always-on or glob-scoped **policy** for this workspace. | This repo **`.cursor/rules/`**. |

**Takeaway:** The video’s “install” recipes target **Claude Code / Agent Skills installers** (`npx skills add …`, marketplaces). **Cursor** benefits from **rules + optional project skills + MEMORY**, not from blindly pasting influencer lists into production.

---

## 2. The five named items — what checks out (2026-05-09)

### (1) Marketing Skills — Corey Haines

- **Exists:** Open MIT-style collection **`coreyhaines31/marketingskills`** on GitHub; marketed as **dozens** of marketing-oriented skills (SEO, CRO, copy, etc.); Agent Skills / multi-IDE framing appears on aggregator pages and **`marketing-skills.com`**.
- **Cursor use:** Treat as **optional** `npx skills add` / manual copy of **one** `SKILL.md` into **`.cursor/skills/`** only after **read + trust** — same hygiene as ClawHub (**inspect before install**; see **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** mindset).
- **SyncScript:** Marketing **surface** is already gated by **`.cursor/rules/03-landing-conversion-guardrails.mdc`**, **04-perf-seo-gate**, **01-marketing-ssr-boundary** — external “agents” do **not** override those; use them for **drafts in `integrations/research/`** or internal briefs, not unreviewed landing edits.

### (2) Stop Slop

- **Exists:** Public repos (e.g. **`hardikpandya/stop-slop`**, MIT) and forks; described as cutting **LLM-tell** phrasing, filler openers, overused **em dash** cadence, etc.
- **Cursor use:** Encode **short** bans + “sound human” guidance in **workspace rules** (this repo: **`.cursor/rules/16-agent-output-discipline-and-context.mdc`**) so **Cursor** agents inherit it without vendoring a whole third-party tree into git.
- **SyncScript:** Aligns with **03** (banned hype words, Hemingway-ish copy) for **`LandingPageElite.tsx`**; rule **16** covers **general prose** and internal docs.

### (3) UI / UX “Pro Max”

- **Exists:** **`nextlevelbuilder/ui-ux-pro-max-skill`** (large **`SKILL.md`** + data files) — public repo; claims **many** UI styles, palettes, UX checklist items (exact counts vary by version).
- **Cursor use:** **Do not duplicate** SyncScript’s canon: prefer **`.cursor/rules/11-ux-ui-excellence.mdc`** + **`integrations/research/UX_UI_REFERENCE_CANON.md`** + **`integrations/research/DESIGN_TOKENS_SYNCSCRIPT.md`**. If you install the upstream skill for **non-SyncScript** projects, keep it **out of this repo** or as a **read-only** reference after license review.
- **SyncScript:** Product UI must match **semantic tokens** (`globals.css`) and **protected surfaces** (**02**).

### (4) Remotion

- **Exists:** **Official** Remotion documentation for **AI / skills**: [Remotion — Agent Skills](https://remotion.dev/docs/ai/skills) and [Prompting with coding agents](https://remotion.dev/docs/ai/claude-code) — programmatic video as **React code**, not a magic black-box editor inside Claude.
- **Cursor use:** **Separate repo** (e.g. `npx create-video@latest`) + Remotion skill in **that** project’s Claude/Cursor config — **not** a dependency of the SyncScript app (no Remotion in this Vite dashboard today).
- **SyncScript:** If marketing wants **motion**, use **approved** pipelines (design handoff **13**, perf **04**); do not add Remotion to **`package.json`** here without an explicit product decision.

### (5) Context Engineering

- **Exists (first-party):** Anthropic’s engineering article [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — context as **finite**, **budgeted**, subject to **rot**; prefer **curated** injection over “dump everything.”
- **Claude Code alignment:** Skills doc states long **`CLaude.md`** blocks cost more than **skills loaded on demand** — same *progressive disclosure* idea ([Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills)).
- **Cursor use:** **`SESSION_START.md` → `MEMORY.md` quick context → grep/read files** instead of pasting whole trees; **rule 16** + **00-session-bootstrap** reinforce that for this workspace.

---

## 3. What we implemented in-repo (operator-visible)

| Artifact | Role |
|----------|------|
| **`.cursor/rules/16-agent-output-discipline-and-context.mdc`** | **Always-on:** workspace doctrine (first-party in-repo, inspect third-party, Claude Code vs Cursor table), anti-slop, context engineering links; **`@syncscript-context-discipline`** documented as **optional** (rule already global). |
| **`integrations/research/AGENT_SKILL_PREFLIGHT_CHECKLIST.md`** | Concrete **inspect-before-install** steps for any skill pack or `npx skills add`. |
| **`.cursor/skills/syncscript-context-discipline/SKILL.md`** | Optional **Cursor** project skill — **@mention once per session** only if you want SKILL body pinned; redundant with rule **16** for policy. |
| **`AGENTS.md`** / **`SESSION_START.md`** | Human + agent onboarding: same doctrine in prose. |
| **`integrations/research/INDEX.md`** | Catalog rows pointing here + preflight. |
| **`MEMORY.md` quick context** | One bullet → this doc + rule **16** + preflight. |

---

## 4. Security / quality bar (non-negotiable)

- **No** “install 23 agents” bulk into prod or shared **`.cursor`** without **file-by-file** review — supply-chain and prompt-injection risk. Use **`integrations/research/AGENT_SKILL_PREFLIGHT_CHECKLIST.md`** as the minimum gate.
- **Influencer CTAs** (“comment skills”) are **growth mechanics**, not engineering approvals — ignore for procurement.
- **Rotate / revoke** if a skill ever asked for **secrets** or exfiltration — same as any npm package.

---

## 5. Optional installs (personal machine / other repos)

If you use **Claude Code** elsewhere: follow **official** docs + **MIT** repos you have read; for **Cursor** on this repo, prefer **rules + MEMORY** first. Third-party skill names and counts change — always open the **GitHub `SKILL.md`** and **LICENSE** before `npx skills add`.
