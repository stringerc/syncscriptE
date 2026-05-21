# Resonance docs (Drive) ↔ Cursor / repo — operational bridge

**Purpose:** Map your **Google Docs** (authoritative narrative + math) to **what agents and humans actually do in Cursor** and in **SyncScript code**, without pasting full copyrighted text into git.

**Operator setup (Drive/Docs tools in Cursor):** **`integrations/research/CURSOR_MCP_COMPOSIO_GOOGLE_SETUP.md`**.

**Source documents (owner: Christopher A. Stringer; retrieved via connected Google account, 2026-05-08):**

| Doc | Canonical link |
|-----|------------------|
| **RESONANCE CALCULUS AND RESONANCE ALGEBRA** — unified framework for coherence, timing, tail-aware optimization | [Google Doc](https://docs.google.com/document/d/1-M0e5W48ex953U6K3ImueSMNXco12lEPP2Pxs4oP3Ug/edit) |
| **Resonance Homeostasis** — self-validating architecture for monotonic improvement in autonomous agent systems | [Google Doc](https://docs.google.com/document/d/1jMqn2EAFuhfQqW9A-UohxsWKLP7Cs_9OnsPWqu5JfkE/edit) |

### Verified MCP access (2026-05-08)

This doc was **read successfully** from Cursor using the **Composio-backed** MCP server (**user-rube**) with toolkit **`googledocs`** in **ACTIVE** status (no extra login in that session).

| Field | Value |
|--------|--------|
| **Document ID** | `1jMqn2EAFuhfQqW9A-UohxsWKLP7Cs_9OnsPWqu5JfkE` |
| **Plain-text size** (tool output) | ~39.6k characters, ~5.4k words — **not** pasted into git (copyright + size). |
| **Title quirk** | Google’s **metadata `title`** field may show **“Archtecture”**; the **body** heading uses **“Architecture”**. |

**Spine (outline only, no verbatim body):** Numbered flow includes **1 Introduction** (explicit link to **Resonance Calculus** as substrate), material on **checkpoint-restore** (distributed systems) and **Lyapunov** stability in the opening framing, a **formal guarantees** block with **Theorem 1 — Monotonic Improvement**, **11 Conclusion**, and a **References** section (e.g. opens with Cannon, *The Wisdom of the Body*).

**Abstract, paraphrased (not a paste):** The paper defines **Resonance Homeostasis (RH)** for persistent autonomous agents that hold memory, corrections, models, and config over time—therefore exposed to **cognitive regression**. RH is framed as an **immune-style** architecture with three design goals: **monotonic improvement** (or controlled tracking) of a composite **resonance health** signal over rolling windows, **bounded degradation** from any single bad event, and **convergent self-repair** within bounded time after detected regression. It composes biology/homeostasis, Lyapunov-style stability intuition, checkpoint/restore practice, and **Resonance Calculus** as the measurement layer (checkpoints, validation gates, surveillance, revert, adaptive incident memory).

**If access fails later:** follow **`CURSOR_MCP_COMPOSIO_GOOGLE_SETUP.md`** — Composio **`https://app.composio.dev`** (Google integration active) **and** Cursor **MCP** server healthy. **Rube deprecation:** Composio’s API surfaces **`https://rube.app/deprecation`** (Rube EOL **2026-05-15**); migrate toward **Composio For You** MCP / CLI per **`https://composio.dev`**.

**In-repo implementation (product / dashboard, not the IDE):** `src/utils/resonance-calculus.ts` — cosinor **β(t)** circadian curve, coherence-style components, **`calculateResonanceScore`**, used by charts such as `ResonanceTimelineChart.tsx` and gamification hooks.

---

## How concepts land in Cursor (IDE discipline)

These are **engineering metaphors + habits**, not medical or financial advice.

### From calculus / algebra (coherence · timing · tails)

| Doc theme | Cursor / agent behavior |
|-----------|---------------------------|
| **Coherence** | Align work with **repo truth**: `.cursor/rules/`, `MEMORY.md`, `SESSION_START.md`, `AGENTS.md`, `integrations/agent-playbooks/` before large edits. |
| **Timing** | Prefer **long, high-blast-radius agent runs** in local daytime windows where **β(t)** is typically higher (see cosinor in `getCircadianCurve` / `getPersonalizedCircadianCurve` in `resonance-calculus.ts`). **Heuristic only** — deadlines override. |
| **Tail-aware** | Treat risky changes (auth, billing, migrations, **protected files**) as **tail events**: smaller diffs, tests first, explicit verification steps. |

### From homeostasis (self-validation · monotonicity)

| Doc theme | Cursor / agent behavior |
|-----------|---------------------------|
| **Immune / validation** | **Hooks + CI + contract tests** reject bad state before merge (`npm test`, `CI=true npm run build`, `verify:*` scripts). Same spirit as “reject pathogens,” implemented as gates. |
| **Monotonic improvement** | Do not **merge known regressions** without an explicit exception and a repair plan; keep **MEMORY / SESSION** updated when ops reality changes. |
| **Separation of concerns** | Keep **notifications and long-run orchestration** out of the editor’s “hot path”: use **Hermes / OpenClaw gateway** for executor loops; Cursor for **file + git + local verify** (see `09-multi-agent-orchestration.mdc`, `12-openclaw-clawhub-cursor-local.mdc`). |

---

## Claw Code (`claw-code-main`) — what transfers

**Facts:** `claw-code` is a **Rust CLI harness** (`PHILOSOPHY.md`: OmX / clawhip / OmO — plan, route noise out of context, multi-agent coordination). It is **not** a Cursor plugin.

**Transferable patterns (already echoed in `SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md` + `CURSOR_IDE_EXCELLENCE_SYNCSCRIPT.md`):**

- **clawhip →** curated markdown + hooks summaries instead of re-scraping the repo every turn.
- **OmX-style loops →** plan → implement → **`npm test`** / build → retry.
- **Inspect-before-install →** MCP pins, `clawhub inspect`, no mass skill install on prod gateways.

Rule **`.cursor/rules/15-claw-resonance-cursor-workflow.mdc`** encodes A + B + C in one place for agents.

---

## Maintenance

When the Drive docs change materially, update this bridge (one paragraph + any new link). For **equation-level parity** between Doc and `resonance-calculus.ts`, run a diff in a private session or export a short appendix you are comfortable committing.
