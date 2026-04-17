# Local agent / CLI tools (SyncScript workspace)

Cursor agents do **not** automatically see every binary on your machine. This file **wires** discovered paths so sessions can run them via **Terminal** when you ask.

## IDE-embedded AI (not CLI — still part of your “stack”)

These are **full editors** with built-in or extension AI — they are **not** the same as `openclaw` / `claude` in Terminal, and they **do not** read this repo’s `.cursor/rules` unless that folder is the workspace in **Cursor**.

| IDE | Notes |
|-----|--------|
| **Cursor** | Primary AI coding agent for this repo — rules: **`.cursor/rules/*.mdc`** (includes **`10-integrations-research-knowledge.mdc`**), optional user rules (**Settings → Rules for AI**). Universal pack: **`~/.cursor/rules-global/`** + **`~/.cursor/RULES_FOR_AI_GLOBAL_PASTE.txt`** (re-paste after it changes). |
| **Windsurf / VS Code + Copilot / Antigravity / others** | Each has **its own** AI rules UI — they **do not** read `.cursor/rules`. Paste the same policy from **`integrations/research/RULES_SNIPPET_FOR_OTHER_IDES.txt`** into each product’s **user/global instructions** so research behavior matches. |
| **Antigravity** | Google’s IDE (`/Applications/Antigravity.app`) — separate agent UX; keep **out of SyncScript source** unless you intentionally integrate. Logs often under `~/Library/Application Support/Antigravity/`. |
| **VS Code + Copilot / Chat** | Different Microsoft pipeline — don’t assume Cursor context carries over; paste snippet above if you use AI there. |

**Research playbook (all IDEs, conceptually):** Tracked catalog **`integrations/research/INDEX.md`** (`docs/` is gitignored — knowledge goes here). Cold archive template: **`integrations/research/ARCHIVE-README.template.md`**. Local handoff: **`MEMORY.md`** § *Knowledge vs disk* (gitignored but on disk).

**Deployment index (tracked):** **`integrations/DEPLOYMENT.md`** — links agent playbooks + Vercel/Edge; **`docs/`** is not used for this (gitignored).

**“One brain” across folders (Cursor):** use **User Rules** (paste file above) **plus** per-repo `.cursor/rules`. Run **`scripts/link-global-cursor-brain.sh`** after clone to symlink the universal rule (gitignored path — see `.gitignore`).

Update paths here if you move installs (Homebrew, nvm, etc.).

**Version radar (OpenClaw / CLIs vs npm):** `npm run tooling:radar` — details **`integrations/TOOLING_UPDATE_RADAR.md`**.

**UX tokens + Antigravity vs Cursor:** **`integrations/research/DESIGN_TOKENS_SYNCSCRIPT.md`**, **`integrations/research/ANTIGRAVITY_VS_CURSOR.md`**.

**OpenClaw + ClawHub + agent browser (architecture + local commands):** **`integrations/research/OPENCLAW_CLAWHUB_BROWSER_STACK.md`**.

**What is *not* OpenClaw:** **Playwright e2e** in this repo (**`npm run test:e2e:voice-visual`**, **`e2e/*.spec.ts`**) is **real browser automation + screenshots** for verification — separate from **`openclaw gateway`**. **Cursor** may use **MCP** (e.g. Playwright/Chrome DevTools) for ad-hoc browser checks in the IDE; that is **your Cursor MCP config**, not something checked into git. The **stack doc** maps roles: gateway browser (OpenClaw) vs dev-time MCP vs CI Playwright.

**Safe skill discovery / no mass-install on prod gateways:** **`integrations/research/SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md`**.

**Cursor always loads (local):** **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** — points the coding agent at the docs above + ClawHub **`inspect`** before install.

**Skill/MCP source audit (read-only, regenerable):** `npm run skill:source-audit` (full query list in **`scripts/skill-audit-queries-syncscript.txt`**), or **`npm run skill:source-audit:ci`** (subset for speed). Catalog **`integrations/research/AGENT_SKILL_MCP_SOURCES_CATALOG.md`**, matrix **`integrations/research/SKILL_DISCOVERY_QUERY_MATRIX.md`**, output **`reports/skill-audit/`** (gitignored). **No auto-install** — **`integrations/research/WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md`**. Triage: **`.github/ISSUE_TEMPLATE/skill_evaluation.md`**. **GitHub labels** for that template: **`npm run gh:labels`**.

**Lighthouse CI (landing `/`):** **`npm run lighthouse:ci`** — config **`lighthouserc.cjs`**; monthly GitHub Action **`.github/workflows/lighthouse-monthly.yml`**; local output **`.lighthouseci/`** (gitignored).

**Nexus App AI routes (same-origin):** **`src/config/nexus-vercel-ai-routes.ts`** — use **`NEXUS_USER_CHAT_PATH`** / **`NEXUS_GUEST_CHAT_PATH`** in dashboard code (not `https://www.syncscript.app/api/ai/...`). Ops + traces: **`integrations/research/NEXUS_OBSERVABILITY_AND_QUALITY.md`**.

## Discovered on this Mac (example paths)

| Capability | Typical path | Notes |
|------------|--------------|--------|
| **OpenClaw** | `~/.nvm/versions/node/*/bin/openclaw` or `$(which openclaw)` | Node shim |
| **ClawHub CLI** | `npx --yes clawhub@latest <command>` or `npm i -g clawhub` → `clawhub search "…"` | Registry search/install; **vet** community skills before enabling on gateway — see **`integrations/research/OPENCLAW_CLAWHUB_BROWSER_STACK.md`** |
| **Claude Code (CLI)** | `~/.local/bin/claude` | Anthropic CLI |
| **Gemini CLI** | `~/.npm-global/bin/gemini` | |
| **Aider** | `~/.local/bin/aider` | |
| **Cursor agent** | `~/.local/bin/cursor-agent` | |
| **Ollama** | `/opt/homebrew/bin/ollama` | Local LLM server — **not** SyncScript prod; keep models separate from site deploy |

**Hermes / Engram** — no single `hermes` binary in PATH here; use the repo playbook: `.cursor/commands/verify-hermes-engram.md` and `integrations/agent-playbooks/`. **Cursor rule:** `.cursor/rules/09-multi-agent-orchestration.mdc` (Hermes + Cursor + boundaries).

## How to “wire” more tools for Cursor

1. **MCP servers** — Cursor **Settings → MCP**: add official servers (GitHub, etc.). Project descriptors may appear under `.cursor/` or your user MCP config.
2. **21st.dev Magic (UI inspiration in chat)** — optional; keys from [Magic Console](https://21st.dev/magic/console). Install: `npx @21st-dev/cli@latest install cursor --api-key <key>` (writes user-level MCP config). **Do not commit API keys.** Analysis + visualizer fit for Nexus voice: **`integrations/research/TWENTY_FIRST_21ST_DEV.md`**.
3. **This file** — add a row with the **full path** from `which <tool>`.
4. **Slash commands** — add `.cursor/commands/<name>.md` with a short recipe (see `verify-hermes-engram.md`).
5. **Rules** — `.cursor/rules/08-local-agent-cli-paths.mdc` tells the agent to prefer these paths when you name a tool.

## Agent instruction

When the user says “use aider / claude / gemini / openclaw”, run the matching binary with **`run_terminal_cmd`**, using paths from this file or `which`, and **do not** claim the tool is unavailable without checking `TOOLS.md` and `$PATH` first.
