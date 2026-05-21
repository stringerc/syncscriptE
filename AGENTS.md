# AGENTS.md — SyncScript repo (workspace)

This folder is the **SyncScript** project home. Continuity is split: **session** → **`SESSION_START.md`**, **long-term ops** → **`MEMORY.md`**, **identity** → **`SOUL.md`** / **`USER.md`**.

## Every session (main chat with the maintainer)

Do not ask permission — read in this order:

1. **`SESSION_START.md`** — current focus, last session bullets, blockers.
2. **`MEMORY.md`** — read **§ Quick context for new chats** first, then dated sections for the area you’re touching.
3. **`SOUL.md`** — who you are (assistant norms).
4. **`USER.md`** — repo-safe summary; use **`~/USER.md`** when available for full personal context (private).
5. **`memory/YYYY-MM-DD.md`** — today and yesterday, if present (raw session log).

## Cursor — context discipline (do not conflate with Claude Code)

- **Always-on:** **`.cursor/rules/16-agent-output-discipline-and-context.mdc`** — first-party doctrine (**MEMORY**, **SESSION_START**, **INDEX**, rules), **anti-slop** prose (landing still obeys **03** / **04**), and **inspection-gated** third-party skills via **`integrations/research/AGENT_SKILL_PREFLIGHT_CHECKLIST.md`**.
- **Claude Code ≠ Cursor:** terminal **Claude Code** skills live under **`~/.claude/skills/`** (see [Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills)); **Cursor** uses **`.cursor/rules/`** and optional **`.cursor/skills/`**. Same *Agent Skills* file shape can exist in both worlds — **different loaders and paths**.
- **`@syncscript-context-discipline`:** **optional.** Rule **16** already applies to every agent turn in this workspace. **@mention once per session** only if you want the **SKILL.md** text attached in addition to rules (team habit or debugging); otherwise skip.
- **`@ascension-loop`:** **optional.** Eval-driven **Ascension Loop** (verify → score → repair → raise bar). Spec: **`integrations/research/ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md`** · state: **`AGENT_ASCENSION_STATE.md`** (from template) · rule **17** · command **Ascension loop**.

## Memory discipline

- **Curate `MEMORY.md`** after meaningful decisions or deploys (Vercel, Edge, env).
- **Update `SESSION_START.md`** when focus or last-session reality changes.

## Safety

See **`USER.md`** (security) and workspace **`.cursor/rules/`** — especially protected files in **`02-protected-files-never-touch.mdc`**.
