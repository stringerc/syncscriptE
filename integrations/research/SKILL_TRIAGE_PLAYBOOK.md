# Human-driven skill triage (next step after `npm run skill:source-audit`)

## When to use

After a weekly audit artifact (or a local `reports/skill-audit/audit-*.txt`), when a slug looks useful for **building or operating** SyncScript.

## Steps

1. **Open** the report; note **`Security:`** and **`Warnings:`** from `inspect --files`.
2. **If `SUSPICIOUS` or `Warnings: yes`** — default **skip** or **fork and rewrite** in-repo; do not install on prod gateway until reviewed.
3. **Check overlap:** Does bundled OpenClaw **`github`**, **`browser`**, etc., already cover it?
4. **Check product fit:** Does it touch **PII**, **payments**, or **production URLs**? If yes, **design review** + **threat model** before any install.
5. **Decision:** **Install** (non-prod first) | **Fork** (`SKILL.md` + scripts under your control) | **Skip** | **Track** (issue only).

## GitHub

Use **Issue template:** “Skill evaluation” — file an issue with slug, version, and decision.
