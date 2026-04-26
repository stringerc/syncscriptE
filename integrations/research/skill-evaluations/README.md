# Skill evaluations (human triage log)

Filled **`skill_evaluation`** records for ClawHub (or MCP) candidates **after** `npm run skill:source-audit` (or the weekly CI artifact from **`skill:source-audit:ci`**) — **not** auto-merged into the app.

**Cadence:** **one slug per audit run** with **`clawhub inspect <slug> --files`** (capture **Security:** line). Optional **`gh issue create`** — labels **`triage`** + **`skills`** (run **`npm run gh:labels`** once per repo if missing).

Template source: **`.github/ISSUE_TEMPLATE/skill_evaluation.md`**.

Policy: **`integrations/research/WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md`**.
