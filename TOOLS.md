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

## Discovered on this Mac (example paths)

| Capability | Typical path | Notes |
|------------|--------------|--------|
| **OpenClaw** | `~/.nvm/versions/node/*/bin/openclaw` or `$(which openclaw)` | Node shim |
| **Claude Code (CLI)** | `~/.local/bin/claude` | Anthropic CLI |
| **Gemini CLI** | `~/.npm-global/bin/gemini` | |
| **Aider** | `~/.local/bin/aider` | |
| **Cursor agent** | `~/.local/bin/cursor-agent` | |
| **Ollama** | `/opt/homebrew/bin/ollama` | Local LLM server — **not** SyncScript prod; keep models separate from site deploy |

**Hermes / Engram** — no single `hermes` binary in PATH here; use the repo playbook: `.cursor/commands/verify-hermes-engram.md` and `integrations/agent-playbooks/`. **Cursor rule:** `.cursor/rules/09-multi-agent-orchestration.mdc` (Hermes + Cursor + boundaries).

## How to “wire” more tools for Cursor

1. **MCP servers** — Cursor **Settings → MCP**: add official servers (GitHub, etc.). Project descriptors may appear under `.cursor/` or your user MCP config.
2. **This file** — add a row with the **full path** from `which <tool>`.
3. **Slash commands** — add `.cursor/commands/<name>.md` with a short recipe (see `verify-hermes-engram.md`).
4. **Rules** — `.cursor/rules/08-local-agent-cli-paths.mdc` tells the agent to prefer these paths when you name a tool.

## Agent instruction

When the user says “use aider / claude / gemini / openclaw”, run the matching binary with **`run_terminal_cmd`**, using paths from this file or `which`, and **do not** claim the tool is unavailable without checking `TOOLS.md` and `$PATH` first.
