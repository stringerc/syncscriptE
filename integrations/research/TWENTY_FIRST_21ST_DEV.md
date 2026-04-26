# 21st.dev (Magic + Agents): analysis and SyncScript UX/visualizer fit

## Security first (non-negotiable)

If API keys were pasted into **chat, tickets, or screenshots**, treat them as **compromised**:

1. **Revoke / rotate** in [21st.dev Magic Console](https://21st.dev/magic/console) and any **Agents** key UI.
2. **Never** commit keys to git, `.cursor/mcp.json`, or `.env` that ships to Vercel for **Magic MCP** — it is an **IDE-time** tool, not a production dependency for SyncScript’s web app.

This document references **capabilities only**; store secrets in OS keychain, Cursor’s secret UI, or a **local** `.env` that stays gitignored.

---

## What 21st.dev is (two lanes)

| Lane | Purpose | Typical credential |
|------|---------|----------------------|
| **Magic (MCP)** | In-editor UI inspiration: search a **curated component library**, generate snippets, refine components. Ships as **`@21st-dev/magic`** MCP server. | API key from Magic Console (`API_KEY` env for the MCP process). |
| **21st Agents SDK** | Hosted agents, sandboxes, skills — **backend/agent product** with keys like **`an_sk_…`** and token exchange (`/api/an/token` in their docs). | Not the same as dropping a React component into SyncScript — it is for building/running **agents** on their platform. |

The **hex-style** second key you mentioned may be a **Magic** or **dashboard** token — label keys in the 21st console so you know which is which.

---

## Magic MCP: what it actually does in Cursor

When enabled, the MCP exposes tools such as:

- **`21st_magic_component_inspiration`** — search the library; returns **snippets** (no automatic file write).
- **`21st_magic_component_builder`** — generate a component from a description + project paths.
- **`21st_magic_component_refiner`** — iterate on an existing component.
- **`logo_search`** — brand assets (SVGL integration).

**Workflow:** you (or the agent) call the tool → get code → **manually integrate** into `src/` following SyncScript patterns (Tailwind, `cn`, existing layout).

Official install (recommended):

```bash
npx @21st-dev/cli@latest install cursor --api-key YOUR_KEY_FROM_CONSOLE
```

That merges config into **user-level** Cursor MCP settings. Alternatively, configure **`command` + `npx @21st-dev/magic@latest`** with **`env.API_KEY`** per [magic-mcp README](https://github.com/21st-dev/magic-mcp).

This repo’s **`.cursor/mcp.json`** intentionally keeps only **Firma** (URL-based); add Magic via **CLI** or your **user** `~/.cursor/mcp.json` so secrets are not committed.

---

## Visualizer options that map to SyncScript (fact-based)

A live **Magic inspiration** query for **“audio visualizer”** surfaces several patterns relevant to **Nexus / voice**:

1. **Waveform family (canvas)** — `Waveform`, `ScrollingWaveform`, `MicrophoneWaveform`, `LiveMicrophoneWaveform`: Web Audio `AnalyserNode` → bar heights. **Best fit** if you want **classic** voice UI to match **real mic/TTS levels** (you already have `WaveformVisualizer` + orb HUD elsewhere).

2. **Bar Visualizer** — frequency bands + **agent states** (`connecting` | `listening` | `speaking` | `thinking`): aligns with **`NexusVoiceOrbPhase`** conceptually. Could inspire a **secondary** compact meter or a **debug** panel, not a full replacement for the branded orb without design review.

3. **Music toggle / decorative bars** — fine for **marketing** or **small controls**; not a substitute for Nexus voice semantics.

**Recommendation for SyncScript:**

- **Primary brand:** keep **`NexusVoiceResonanceOrb` + `NexusVoiceImmersiveHud`** as the hero (already wired to phase + levels).
- **Optional enhancement:** borrow **BarVisualizer**’s **state-driven bar animation** *ideas* or **canvas waveform** *data path* only if we need a **second** readout (e.g. strip under the orb) — implement by **feeding existing** `micLevel` / `ttsLevel` / `orbPhase`, not by mounting a second `getUserMedia` unless intentionally designed.
- **Do not** ship Magic-generated components verbatim without **SSR/perf** and **a11y** review (matches workspace Lighthouse / conversion guardrails).

---

## Why MCP is “implemented” at the IDE, not in `npm run build`

Magic MCP is a **development** integration: it helps **author** UI. The **SyncScript web app** does not call 21st.dev at runtime for Magic. If you need **runtime** generative UI, that is a different product (your own API + model).

---

## Quick reference

| Goal | Use |
|------|-----|
| IDE component inspiration | Magic MCP + `/ui`-style prompts in Cursor |
| Production voice UX | Existing Nexus voice stack + optional waveform strip fed by current levels |
| Agent hosting on 21st | Agents SDK docs — separate from Magic MCP |

---

## Changelog

- **2026-04-11** — Initial analysis: Magic vs Agents, MCP tools, visualizer mapping, security notes.
