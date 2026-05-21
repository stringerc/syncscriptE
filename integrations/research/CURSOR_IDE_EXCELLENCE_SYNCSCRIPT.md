# Cursor + this repo — practical “run at your best”

**Facts:** Cursor quality comes from **clear rules**, **correct MCP**, **tests**, and **small diffs** — not from installing every ClawHub skill.

## Always load project truth

- **`.cursor/rules/`** — especially **`07-syncscript-app-knowledge.mdc`**, **`08-local-agent-cli-paths.mdc`**, **`11-ux-ui-excellence.mdc`**, **`12-openclaw-clawhub-cursor-local.mdc`**.
- **`MEMORY.md`** — durable ops + integrations (update when workflows change).
- **`TOOLS.md`** — where CLIs and audits live on this machine.

## MCP (IDE)

- Use **official / vendor** MCP servers (GitHub, Playwright, etc.) in **Cursor Settings → MCP** — **pin versions** where possible (reduces surprise upgrades in long sessions).
- **Do not** confuse **OpenClaw ClawHub skills** (gateway) with **Cursor MCP** (IDE). Same words (“Playwright”) can mean different install paths.
- **Google Drive / Docs via Composio:** step-by-step **`integrations/research/CURSOR_MCP_COMPOSIO_GOOGLE_SETUP.md`** (`cursor://settings` → MCP; **`https://app.composio.dev`** → Integrations → Google; OAuth in browser; no secrets in chat).

## GitHub (skill triage)

- **`npm run gh:labels`** — creates or updates **`triage`** and **`skills`** labels so **`.github/ISSUE_TEMPLATE/skill_evaluation.md`** and **`gh issue create`** match the playbook.

## Landing quality (CI mirror)

- **`npm run lighthouse:ci`** — runs **Lighthouse CI** against **`lighthouserc.cjs`** (same targets as **`.cursor/rules/04-perf-seo-gate.mdc`**). Monthly workflow: **`.github/workflows/lighthouse-monthly.yml`**.

## OpenClaw (gateway)

- Skills: **`openclaw skills check`**; install only after **`clawhub inspect`** and **`WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md`** review.
- Read-only discovery: **`npm run skill:source-audit`** (full queries) or **`npm run skill:source-audit:ci`** (fast).

## Engineering bar (matches Fortune-tier discipline)

- **`npm test`** before Nexus/voice/tool changes; **`CI=true npm run build`** for risky UI.
- **No secrets** in rules or committed evals.

## Claw Code, OpenClaw split, resonance (A + B + C)

Always-on rule: **`.cursor/rules/15-claw-resonance-cursor-workflow.mdc`**. Narrative + Doc links + mapping to **`src/utils/resonance-calculus.ts`**: **`integrations/research/RESONANCE_DOCS_CURSOR_BRIDGE.md`**. Use this doc when you want **one place** that ties **IDE discipline**, **gateway orchestration**, and **optional circadian scheduling** (heuristic, not medical) without conflating Cursor MCP with ClawHub skills.
