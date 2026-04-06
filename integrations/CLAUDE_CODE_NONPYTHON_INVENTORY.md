# Claude Code zip — non-Python inventory (analysis only)

**Source:** `claude-code-main.zip` (Anthropic; © Anthropic PBC — do not copy prose/config verbatim into shipping product docs without permission). This file is **our** factual inventory and integration notes.

## GitHub Actions (12 workflows)

All under `.github/workflows/`. **Theme:** issue lifecycle, `@claude` dispatch, duplicate detection, triage automation.

| Workflow | Role |
|----------|------|
| `claude.yml` | Runs `anthropics/claude-code-action@v1` when issue/comment contains `@claude`; needs `ANTHROPIC_API_KEY` |
| `claude-issue-triage.yml`, `claude-dedupe-issues.yml` | Claude-driven triage/dedupe |
| `issue-opened-dispatch.yml`, `issue-lifecycle-comment.yml`, `log-issue-events.yml` | Event plumbing |
| `auto-close-duplicates.yml`, `backfill-duplicate-comments.yml`, `lock-closed-issues.yml`, `remove-autoclose-label.yml`, `sweep.yml`, `non-write-users-check.yml` | Repo hygiene |

**SyncScript integration:** We did **not** copy these workflows. They require Anthropic secrets and `scripts/gh.sh` helpers that exist only in the upstream repo. Our **`ci.yml`** remains the single generic build gate. Optional future: add **`workflow_dispatch`** manual job that only runs existing `npm` verify scripts (no Claude action).

## Slash commands (3 markdown files)

`.claude/commands/*.md` — YAML frontmatter (`allowed-tools`, `description`) + tasks. Upstream **`triage-issue.md`** / **`dedupe.md`** depend on **`./scripts/gh.sh`** and label scripts.

**SyncScript integration:** Replaced with **`integrations/agent-playbooks/`** (original text) and **`.cursor/commands/*.md`** (thin pointers).

## `examples/settings/*.json`

`settings-lax.json`, `settings-strict.json`, `settings-bash-sandbox.json` — Claude Code **managed** permissions (ask/deny tools, sandbox network, hooks-only mode). **License:** all rights reserved; **do not vendor the files**.

**SyncScript integration:** Ideas summarized in **`agent-playbooks/05-guardrails-vs-claude-hooks.md`** and **`.cursor/rules/06-agent-workflow-playbooks.mdc`**. Use **our** CI + rules, not pasted JSON.

## Hookify examples (`plugins/hookify/examples/*.local.md`)

Markdown with YAML frontmatter: `name`, `enabled`, `event`, `pattern` or `conditions`, `action`, message body. Illustrates **block** vs **warn** and **stop**-event transcript rules.

**SyncScript integration:** Behavioral mapping in playbook 05; we do not load these files at runtime.

## Devcontainer

`.devcontainer/Dockerfile`, `devcontainer.json`, `init-firewall.sh` — isolated dev with firewall script.

**SyncScript integration:** Not copied; we use local Node + Vite. Optional later if team wants a standard container.

## Plugins (TS/MD/skills)

Large tree under `plugins/*` (code-review, feature-dev, frontend-design, etc.). **Integration:** Read for **ideas** only; SyncScript already has `.cursor/rules` and Cursor skills under user home.

## Summary

| Asset type | Integrated as |
|------------|----------------|
| Workflows | Not copied; documented here |
| Slash commands | `integrations/agent-playbooks/` + `.cursor/commands/` |
| Settings JSON | Paraphrased in rules + playbook 05 |
| Hook examples | Playbook 05 mapping |
| Devcontainer | N/A unless requested |
