# Ascension Loop (eval-driven agent)

Bounded **Plan → Act → Verify → Score → Repair / Raise bar** loop for Cursor and Antigravity. Full prompts and SyncScript gates: **`../research/ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md`**.

## When to use

- Non-trivial tasks where quality matters more than speed.
- You want **objective gates** (tests, build) before the agent declares “done.”
- You want **compounding** across messages via `AGENT_ASCENSION_STATE.md`.

## Quick start (Cursor)

1. Copy template: `cp AGENT_ASCENSION_STATE.template.md AGENT_ASCENSION_STATE.md`
2. In Agent chat: `@ascension-loop` or run command **Ascension loop**, or paste the **Master prompt** from the research doc with your `«TASK»`.
3. Follow-ups: prepend text from `scripts/ascension-compound-tail.txt`.

## Quick start (Antigravity)

1. Same state file in repo root.
2. **First message:** paste **`scripts/antigravity-ascension-starter.md`** (edit **TASK** line). Use **Sonnet/Opus**.
3. Reply **GO** after Charter/Plan/Critic — then full loop or compounding tail.
4. **Do not** paste only `@ascension-loop` or an empty template (causes gibberish spirals).
5. **GO / resume:** **`scripts/antigravity-ascension-go-resume.md`** in a **new chat** (never “pick up” a spiraled thread).
6. Follow-ups: **Compounding tail** from research doc.

## Stop conditions

- 3 repairs, same root cause → **BLOCKED** (human).
- **PLATEAU** after bar-raise fails twice → summarize; optional `MEMORY.md` update if human asks.
- SyncScript **02** protected files → no edits without explicit override.

## Verify (SyncScript)

Pick gates from research doc table; minimum for code changes: `npm test` when Nexus/contracts touched; `CI=true npm run build` for risky UI/build.
