---
description: Start or continue Ascension Loop (eval-driven score, verify, repair, raise bar)
---

# Ascension Loop

**Full spec:** `integrations/research/ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md`  
**Playbook:** `integrations/agent-playbooks/06-ascension-loop.md`  
**Skill:** `@ascension-loop`

## Start

1. If missing: copy `AGENT_ASCENSION_STATE.template.md` → `AGENT_ASCENSION_STATE.md`.
2. Follow rule **17** and the **Master prompt** in the research doc.
3. Ask the user for `«TASK»` if not provided, then begin at **Charter**.

## Continue

Prepend `scripts/ascension-compound-tail.txt` and read `AGENT_ASCENSION_STATE.md` before acting.

## SyncScript verify (when code touched)

- `npm test` — Nexus/contracts
- `CI=true npm run build` — risky UI/build
- See gate table in research doc for `verify:*` / `guard:*`
