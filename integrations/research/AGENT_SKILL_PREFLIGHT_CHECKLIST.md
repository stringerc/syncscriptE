# Agent Skill / third-party pack — preflight (before `npx skills add` or copy into repo)

**Use when:** Installing **Claude Code** skills, **Cursor** `.cursor/skills/*`, or any **`npx skills add <org/repo>`** flow. Same tiered caution as **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** (inspect before install).

**Related:** **`.cursor/rules/16-agent-output-discipline-and-context.mdc`**, **`integrations/research/CLAUDE_VIDEO_FIVE_SKILLS_CURSOR_MAP.md`**.

---

## Checklist (all should be true before you trust it)

1. **Source** — Clone or browse **GitHub** (or vendor) at a **pinned tag/commit**, not a moving `main` tip for first review.
2. **LICENSE** — File present and compatible with **how you use** it (internal only vs shipped to customers).
3. **`SKILL.md` (and any `reference.md`)** — Read full body; note **exfiltration** patterns (curl to unknown hosts, env harvesting, “paste your API key here”).
4. **Scripts** — If the pack runs **`scripts/`** or **shell hooks**, read every file; grep for **`curl`**, **`fetch`**, **`eval`**, **`base64`**, **`~/.ssh`**, **`process.env`**.
5. **Size / context** — Large data blobs in-repo **bloat** agent context; prefer **link + optional** install outside this repo unless the team adopts it.
6. **SyncScript product** — UI/copy still obeys **02**, **03**, **04**, **11**; skills do **not** override protected or marketing gates.
7. **One-skill trial** — Install **one** skill in a **throwaway clone** or personal `~/.claude/skills` before wiring into **team** `.cursor/skills` or CI.

---

## After install

- **Commit** only what you reviewed; **document** in **`integrations/research/INDEX.md`** if it becomes team canon.
- **Rotate** credentials if anything looked suspicious during review.
