# Playbook 05 — Claude Code hooks → SyncScript

| Upstream idea | Here |
|---------------|------|
| PreToolUse block | CI failure + protected `.cursor/rules` |
| Stop hook “run tests” | `npm run release:gate` / `npm test` before merge |
| Security substring reminders | Review + guards; optional ESLint/CodeQL |
| Strict permissions / sandbox | Cursor sandbox + user rules; CI clean runner |

We do not run Claude’s Python hooks in Cursor. Encode policy in **rules, MEMORY, and npm scripts**. See `CLAUDE_CODE_PYTHON_AUDIT.md` for exit-code vs JSON hook protocols.
