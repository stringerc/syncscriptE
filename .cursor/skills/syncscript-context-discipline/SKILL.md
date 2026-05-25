---
name: syncscript-context-discipline
description: >-
  Mirrors always-on workspace rule 16: context as a finite budget (SESSION_START
  then MEMORY then targeted reads), anti-slop prose outside landing 03/04 gates,
  and inspection-gated third-party Agent Skills per AGENT_SKILL_PREFLIGHT_CHECKLIST.
  Use when the user @mentions this skill, asks about Claude Code vs Cursor skills,
  or wants the SKILL body pinned in-thread. Not required every message — rule 16
  already applies globally in this repo.
---

# SyncScript — context discipline + anti-slop

## Doctrine (same as **`.cursor/rules/16-agent-output-discipline-and-context.mdc`**)

- **First-party in-repo:** MEMORY, SESSION_START, research INDEX, `.cursor/rules` are canonical.
- **Third-party packs:** **`integrations/research/AGENT_SKILL_PREFLIGHT_CHECKLIST.md`** before install.
- **Claude Code ≠ Cursor:** different paths (`~/.claude/skills` vs `.cursor/rules` + `.cursor/skills`); see rule **16** table.

## When this applies

- User **@syncscript-context-discipline** or asks for context / anti-slop / skill install hygiene.
- Long sessions where you want this checklist **explicitly** in the thread (optional; **rule 16** already covers policy).

## Do this

1. **Triage context:** `SESSION_START.md` → `MEMORY.md` quick context → targeted `read_file` / `grep`.
2. **Prefer pointers:** repo-relative paths + line citations.
3. **Anti-slop:** remove filler openers, engagement bait, em-dash overuse; keep claims falsifiable.
4. **Landing / SEO / Lighthouse:** obey **03**, **04**, **01** — this skill does **not** override them.

## Full policy + sources

**`.cursor/rules/16-agent-output-discipline-and-context.mdc`** · **`integrations/research/CLAUDE_VIDEO_FIVE_SKILLS_CURSOR_MAP.md`** · **`integrations/research/AGENT_SKILL_PREFLIGHT_CHECKLIST.md`**
