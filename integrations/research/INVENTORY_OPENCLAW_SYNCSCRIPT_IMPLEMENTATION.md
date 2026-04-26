# What we actually implemented (OpenClaw / skills / Cursor) — inventory

**Read this first:** We did **not** bulk-install ClawHub skills into **syncscript.app** or your OpenClaw gateway. “Making SyncScript the best” here means **governance, documentation, audit automation, and Cursor rules** — not merging arbitrary third-party skill code into production.

---

## A) In this git repo (tracked)

| Item | What it does |
|------|----------------|
| **`integrations/research/SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md`** | Safety tiers (bundled → inspect → fork); category checklist; Oracle SSH runbook; honest scope vs hype. |
| **`integrations/research/OPENCLAW_CLAWHUB_BROWSER_STACK.md`** | Gateway + browser plugin + ClawHub + thin-bridge sketch + token notes. |
| **`integrations/research/AGENT_SKILL_MCP_SOURCES_CATALOG.md`** | Extended URLs: ClawHub alternatives, MCP registries (official, Smithery, Glama, …), Mythos **context** (model vs tools). |
| **`integrations/research/INDEX.md`** | Catalog rows pointing at the above. |
| **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** | Always-on: tells Cursor agents to read those docs + `inspect` before install + `TOOLS.md`. |
| **`TOOLS.md`** (sections added) | Paths for `openclaw`, `clawhub`, links to framework + `npm run skill:source-audit`. |
| **`integrations/ENGRAM_OPENCLAW.md`** | Reference line to browser stack doc. |
| **`scripts/skill-source-audit.sh`** | **Read-only** audit: `clawhub search` + `clawhub inspect … --files` + optional MCP registry `curl` sample. **Does not install** anything. |
| **`package.json` scripts `skill:source-audit` / `skill:source-audit:ci`** | Default uses **`skill-audit-queries-syncscript.txt`**; `:ci` uses **`skill-audit-queries-ci.txt`**. |
| **`.gitignore`** | `reports/skill-audit/` — audit output stays local/CI artifact, not committed by default. |
| **`.github/workflows/skill-source-audit-weekly.yml`** | **Weekly** scheduled run (Mondays ~15:15 UTC) — uploads **audit artifact**; **does not** deploy or merge skills into the app. |
| **`integrations/research/SKILL_AUDIT_AUTOMATION_POLICY.md`** | Why we **never** auto-install or auto-ship skills from audits. |
| **`integrations/research/WHY_WE_DO_NOT_AUTO_SHIP_SKILLS.md`** | Policy-as-docs: **no** bulk ClawHub / **no** auto-merge into app / **no** replacing `openclaw-bridge` with unvetted bundles. |
| **`integrations/research/SKILL_DISCOVERY_QUERY_MATRIX.md`** | Maps search phrases → in-repo capabilities (avoid duplicate installs). |
| **`integrations/research/SKILL_TRIAGE_PLAYBOOK.md`** | Human steps after each audit. |
| **`scripts/skill-audit-queries-syncscript.txt`** | Full read-only query list (UX, deploy, test, security, agents). |
| **`scripts/skill-audit-queries-ci.txt`** | Smaller subset for **weekly GitHub Action** runtime. |
| **`.github/ISSUE_TEMPLATE/skill_evaluation.md`** | Issue template for skill/MCP triage. |

**Local cron (optional, Mac/Linux):** same as CI — run `npm run skill:source-audit` on a schedule from the repo root; output still goes to `reports/skill-audit/`. Example: `15 15 * * 1 cd /path/to/syncscript && npm run skill:source-audit` (adjust path).

---

## B) What runs on your machines (not fully described in git)

| Item | Role |
|------|------|
| **OpenClaw gateway** | Still **your** install (`openclaw gateway`, Oracle VM, etc.). Bundled **plugins** (e.g. browser) come from OpenClaw — we documented how to enable them, not replaced them. |
| **`npm i -g openclaw@latest` / `clawhub`** | Performed locally in a session; not pinned in this repo’s `package.json` as app dependencies. |
| **ClawHub skills** | **Not** installed into the repo as application code. **`skill-creator`** / **`openclaw-github-assistant`** were **inspected**; registry marked at least one **SUSPICIOUS** — explicit **no** to blind install. |

---

## C) SyncScript.app product integration (pre-existing / separate)

The **web app** talks to **OpenClaw** through **Supabase Edge** (`openclaw-bridge`) and product routes — that architecture **predates** this skills-audit work. We **did not** add new ClawHub skill bundles into the Vercel/Edge bundle as part of this effort.

---

## D) Weekly automation — what runs vs what we refuse

- **Runs:** `npm run skill:source-audit` on a schedule (GitHub Actions) → **artifact** with search + inspect output for human review.
- **Does not run:** **No** cron/Action that **auto-implements** or **auto-installs** skills into **syncscript.app** or production gateways. That would be unsafe (supply chain, `SUSPICIOUS` skills, breaking changes). See **`integrations/research/SKILL_AUDIT_AUTOMATION_POLICY.md`**.

---

## E) Quick command reference

```bash
npm run skill:source-audit
# Optional:
# SKILL_AUDIT_QUERIES="github mcp" SKILL_AUDIT_INSPECT_SLUGS="foo,bar" LIMIT=5 bash scripts/skill-source-audit.sh
```

Reports: **`reports/skill-audit/audit-*.txt`** (gitignored).
