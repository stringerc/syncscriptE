# Agent playbooks (SyncScript)

Bounded workflows for humans and coding agents. Inspired by [Claude Code](https://code.claude.com/docs/en/overview) command style; content is **original** for this repo.

## Index

| Playbook | Purpose |
|----------|---------|
| [00-git-commit-pr.md](./00-git-commit-pr.md) | Branch, one commit, push, optional PR |
| [01-supabase-edge-deploy.md](./01-supabase-edge-deploy.md) | Deploy Edge function + verify |
| [02-kokoro-tts-recovery.md](./02-kokoro-tts-recovery.md) | TTS / Kokoro outage recovery |
| [03-hermes-engram-contract-verify.md](./03-hermes-engram-contract-verify.md) | Contract + live smoke |
| [04-release-gate.md](./04-release-gate.md) | Local release gate |
| [05-guardrails-vs-claude-hooks.md](./05-guardrails-vs-claude-hooks.md) | Hooks → npm/CI mapping |

See also: `CLAUDE_CODE_PYTHON_AUDIT.md`, `CLAUDE_CODE_NONPYTHON_INVENTORY.md`, `MEMORY.md`.

**Automated live checks:** GitHub Actions **Edge bridges live verify** (`.github/workflows/edge-bridges-live.yml`) runs `verify-hermes-edge-live.mjs` and `verify-engram-edge-live.mjs` on a schedule, on push (when bridges/scripts change), and on manual dispatch.
