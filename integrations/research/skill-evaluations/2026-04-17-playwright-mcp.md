# Skill evaluation: `playwright-mcp` (ClawHub)

**Status:** **Recommend skip ClawHub install for SyncScript prod** — use **official Playwright MCP** in **Cursor Settings → MCP** for IDE browser automation; keep **OpenClaw bundled browser** for gateway. This record satisfies the human triage step from the audit playbook.

## Source

- **Slug:** `playwright-mcp`
- **Version:** 1.0.0 (latest)
- **Owner:** spiceman161
- **Summary:** Browser automation via Playwright MCP — navigate, click, forms, screenshots, workflows.

## Inspect (`clawhub inspect playwright-mcp --files`) — 2026-04-17

- **Security:** `CLEAN`
- **Warnings:** `yes` (still read `SKILL.md` before any install)
- **Files:** `SKILL.md` (~4KB), `examples.py` (~3.1KB)

## Fit for SyncScript

| Question | Answer |
|----------|--------|
| **Overlap** | Repo already uses **Playwright** for E2E (`e2e/`, `npm run test:e2e:*`). Cursor can add **Microsoft/playwright MCP** or vendor MCP — not required to install this ClawHub **skill** into OpenClaw. |
| **Touches prod / secrets?** | Any browser automation can hit **staging** or **prod** if misconfigured — **allowlist URLs**, never store creds in skills. |
| **Gateway vs IDE** | **OpenClaw** skills ≠ **Cursor MCP**. Don’t duplicate Playwright stacks without an owner. |

## Decision

- [x] **Skip** ClawHub install for OpenClaw gateway (use bundled browser + existing Playwright in CI).
- [x] **Cursor:** Prefer **official Playwright MCP** server if you want agent-driven browser in the IDE — configure in **Cursor**, not via ClawHub on the gateway.
- [ ] Fork / reimplement — not needed for this slug at this time.

## Owner

Session 2026-04-17 — follow-up if Playwright MCP version pinning is needed in team docs.
