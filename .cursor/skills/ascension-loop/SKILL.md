---
name: ascension-loop
description: Eval-driven Ascension Loop for Cursor — Plan, Critic, Act, Verify, Score, Repair or Raise bar, compounding in AGENT_ASCENSION_STATE.md. Use when the user @mentions this skill, says ascension mode, or wants score-and-repair until objective gates pass and the bar rises.
---

# Ascension Loop (Cursor + Antigravity)

## When to use

- User `@ascension-loop` or asks for **ascension / score-and-repair / raise the bar** agent mode.
- Non-trivial tasks needing **tests/build** as proof, not narrative “done.”

## Load (in order)

1. `integrations/research/ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md` — master prompt, rubric, SyncScript gates.
2. `AGENT_ASCENSION_STATE.md` if present; else copy fields from `AGENT_ASCENSION_STATE.template.md`.
3. `.cursor/rules/17-ascension-loop-eval-agent.mdc` — condensed protocol (this skill expands it).

## Operating mode

Run the **Master prompt** protocol from the research doc:

- Headings every iteration: Charter (once) → Plan → Critic → Act → Verify → Score → Decision → Compounding.
- **Pass:** weighted ≥ 8.5 and all Correctness gates PASS.
- **Raise bar** only after pass; then stricter acceptance criteria (bar v2+).
- **PLATEAU** if new bar cannot be beaten in 2 iterations.
- **BLOCKED** after 3 repairs on same root cause.

## SyncScript gates (pick applicable)

| Change type | Gate |
|-------------|------|
| Nexus / contracts | `npm test` |
| Build / landing | `CI=true npm run build` |
| Dashboard shell | `npm run guard:dashboard-route-shell` |
| Protected Nexus/energy/auth | **Do not edit** (rule 02) without explicit override |

## Compounding follow-ups

Prepend to user message (or read `scripts/ascension-compound-tail.txt`):

```text
ASCENSION COMPOUND — read AGENT_ASCENSION_STATE.md; continue from last ## Decision; do not reset unless RESET.
```

## Anti-patterns

- Skipping Verify/Score.
- Declaring success without command output.
- Editing `MEMORY.md` unless user asks (use state file during loop).

## Related

- `integrations/agent-playbooks/06-ascension-loop.md`
- `integrations/research/FREE_MODEL_AB_HARNESS.md` (optional 3-prompt quality A/B after plateau)
