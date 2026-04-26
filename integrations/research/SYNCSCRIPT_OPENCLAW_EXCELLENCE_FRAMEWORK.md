# SyncScript × OpenClaw — excellence framework (safe, incremental, measurable)

**Purpose:** A **repeatable** way to discover skills and tools (ClawHub, awesome lists, first-party OpenClaw) **without** turning the gateway into an unaudited extension store. “Top tier” here means **reliability, security, observability, and product quality** — not raw skill count or marketing claims.

**Related:** `OPENCLAW_CLAWHUB_BROWSER_STACK.md`, `ENGRAM_OPENCLAW.md`, `deploy/oracle/README.md`, `npm run tooling:radar`.

**Cursor (IDE):** Always-on rule **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** points agents at these docs and the safe-skill policy so guidance is **local to the repo**, not only on syncscript.app.

**Extended discovery (MCP registries, more lists):** **`integrations/research/AGENT_SKILL_MCP_SOURCES_CATALOG.md`**.

**Re-run read-only audit:** `npm run skill:source-audit` → **`reports/skill-audit/audit-*.txt`** (gitignored). Override env: `SKILL_AUDIT_QUERIES`, `SKILL_AUDIT_INSPECT_SLUGS`, `LIMIT`, `OUT_DIR`.

---

## 1) What “best in the world” actually means (fact-based)

Software products win on **outcomes users feel**: uptime, latency, correctness, privacy, accessibility, and clear recovery when things fail. **Fortune 500** orgs vary wildly; comparing to them as a monolith is not a useful engineering target.

**Concrete bars for SyncScript:**

| Bar | How you prove it |
|-----|------------------|
| **Ship with confidence** | `npm test`, smoke tests, `CI=true npm run build`, `verify:openclaw:edge-live` where applicable |
| **No silent data leaks** | RLS, Edge auth, no secrets in client bundles — existing architecture |
| **Recoverable ops** | Health endpoints, logs, runbooks (`deploy/`, `integrations/agent-playbooks/`) |
| **Agent safety** | Least-privilege tools, allowlisted URLs for any browser automation, audit trails |

Skills and CLIs are **levers** on that — not a substitute for product and governance.

---

## 2) Safety hierarchy (never skip)

Use this order. **Do not** mass-install from ClawHub on production gateways.

| Tier | Source | When to use |
|------|--------|-------------|
| **A — First-party** | OpenClaw **bundled** plugins + `openclaw skills list` **ready** items | Default. Browser plugin, `github`, `gog`, etc. |
| **B — Inspected community** | ClawHub / awesome lists | After **`clawhub inspect <slug>`**, diff `SKILL.md`, pin version, test in **non-prod** workspace |
| **C — Repo-owned** | Copy patterns into **`integrations/`**, **`skills/`**, or a **fork** you control | Anything touching credentials, prod URLs, or SyncScript-specific contracts |

**Never:** `clawhub install` / `openclaw skills install` on a **production** gateway without the same review you’d give a new npm dependency with **network access**.

---

## 3) Discovery workflow (ClawHub + alternatives — “scrape” safely)

“Scrape” here means **systematic discovery with human review**, not unattended bulk install.

### ClawHub CLI (registry)

```bash
# Search (vector) — examples; adjust queries to your roadmap
npx --yes clawhub@latest search "github" --limit 15
npx --yes clawhub@latest search "browser" --limit 15
npx --yes clawhub@latest search "security audit" --limit 15

# Inspect without installing (read SKILL.md + metadata)
npx --yes clawhub@latest inspect <slug>

# Optional: explore (may return empty depending on registry/API state)
npx --yes clawhub@latest explore --limit 25 --sort newest
npx --yes clawhub@latest explore --limit 25 --sort trending
```

If **`explore`** returns no rows, rely on **`search`** + **`inspect`** — still valid.

### Curated indexes (cross-check ClawHub noise)

- [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) — categorized.
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — cross-tool (Cursor, Claude Code, etc.).

### In-repo radar

- **`npm run tooling:radar`** — OpenClaw / CLI version drift (`integrations/TOOLING_UPDATE_RADAR.md`).

---

## 4) Category checklist — map skills to SyncScript’s real needs

Use this when deciding **keep / skip / fork**. One row “yes” with good review beats twenty unchecked installs.

| Area | Question to ask | Typical lever |
|------|-----------------|---------------|
| **Deploy & CI** | Does it improve reproducible builds and smoke checks? | GitHub skill, existing workflows, Vercel verify scripts |
| **Security** | Does it reduce secret exposure and supply-chain risk? | `openclaw security audit`, minimal plugins, pin versions |
| **Browser / QA** | Does it duplicate bundled browser? Prefer **Tier A** first | OpenClaw browser plugin + allowlists |
| **Voice / TTS** | Does it conflict with Kokoro / Nexus voice pipeline? | Often **skip** generic voice packs; integrate in app |
| **Data / CRM** | Does it send PII to unknown endpoints? | **Tier C** only, with DPA-style review |
| **Hermes / Engram** | Does it overlap executor contracts? | Align with `integrations/HERMES.md`, not random MCP |
| **Observability** | Can we measure success/failure? | Health checks, structured logs, Edge telemetry |

---

## 5) Optional cleanup (local dev host) — **done in session**

Background OpenClaw gateway processes were stopped with:

```bash
pkill -f "openclaw.*gateway"
```

Verify: `lsof -iTCP:18789` should show **no listener** unless you intentionally started the gateway again.

Restart the gateway the way you operate in prod: **LaunchAgent**, **`npm run openclaw:gateway`**, or **systemd on the VM** (`deploy/oracle/README.md`).

---

## 6) Oracle / production gateway host — **you run this over SSH**

Cursor **cannot** SSH into your tenancy from here. On the **VM** (Ubuntu per `deploy/oracle/README.md`), after SSH:

```bash
# Node 22+ and global CLIs (paths may use nvm — match your server)
npm i -g openclaw@latest
npm i -g clawhub@latest

export NVIDIA_API_KEY=…   # only if your openclaw.json references it
export OPENCLAW_GATEWAY_TOKEN=…   # must match gateway.auth.token if using token auth

openclaw doctor
openclaw --version
clawhub --cli-version

# With gateway running and token aligned:
openclaw skills check
```

Then **restart** the gateway service (systemd unit or `openclaw gateway install` per doctor) so **`OPENCLAW_BASE_URL`** in Supabase matches a **healthy** process. Details: **`deploy/oracle/README.md`** (OpenClaw on **:18789**, Cloudflare tunnel, `ensure-openclaw-gateway-config.sh`).

---

## 7) Build-vs-buy for “incremental but safe”

| Situation | Prefer |
|-----------|--------|
| Skill is a thin wrapper around `curl` to unknown hosts | **Skip** or **Tier C** in-repo script with allowlist |
| Skill duplicates OpenClaw **browser** | Use **bundled browser** first |
| Skill adds OAuth to a service you already integrate in-app | **App or Edge** integration — don’t duplicate in gateway |
| Skill is documentation-only | **Fork** `SKILL.md` into repo and strip network calls |

---

## 8) Review cadence

- **Monthly:** `npm view openclaw version` vs gateway host; `npm run tooling:radar`.
- **Quarterly:** Re-scan ClawHub/awesome categories aligned to roadmap; **zero** bulk installs.
- **Per skill:** `inspect` → test workspace → prod gateway last.

---

## References

- OpenClaw: [docs.openclaw.ai](https://docs.openclaw.ai), [Browser](https://docs.openclaw.ai/tools/browser), [ClawHub](https://docs.openclaw.ai/tools/clawhub)
- SyncScript Edge bridge: `supabase/functions/make-server-57781ad9/openclaw-bridge.tsx`
- Oracle stack: `deploy/oracle/README.md`
