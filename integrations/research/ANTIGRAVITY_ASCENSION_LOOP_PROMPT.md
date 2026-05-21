# Ascension Loop — eval-driven agent mode (Antigravity + Cursor)

**Purpose:** A **repeatable** prompt + state file pattern for **high-quality, self-correcting** agent work — not “superintelligence.” Models plateau, self-grade optimistically, and rate-limit. This loop maximizes **real** gains: **objective gates, weighted rubric, bounded repair, bar-raising, compounding in git**.

**Canonical state file (per task, workspace root):** `AGENT_ASCENSION_STATE.md` (gitignored — copy from `AGENT_ASCENSION_STATE.template.md`).

| Surface | How to invoke |
|---------|----------------|
| **Cursor** | `@ascension-loop` skill, rule **17**, command **Ascension loop**, or paste **Master prompt** below |
| **Antigravity** | Paste **Master prompt** into Claude panel; use **Compounding tail** on follow-ups |
| **Playbook** | `integrations/agent-playbooks/06-ascension-loop.md` |

**Related:** `SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md` (measurable “best”), `FREE_MODEL_AB_HARNESS.md` (3-prompt A/B), `NEXUS_OBSERVABILITY_AND_QUALITY.md` (gates + traces), `.cursor/rules/02-protected-files-never-touch.mdc`.

---

## Honest limits

- No prompt guarantees infinite improvement or AGI.
- **Correctness** must come from **commands you can re-run** (`npm test`, `curl`, build), not model prose.
- After **3 failed repairs** on the same root cause → **BLOCKED** (escalate to human).
- **Protected Nexus/energy/auth files** in SyncScript: do not edit without explicit override.

---

## Master prompt (first message — Antigravity or Cursor)

Replace `«TASK»` with your goal. Replace `«WORKSPACE»` with repo path or “this workspace.”

```markdown
# MODE: ASCENSION LOOP (eval-driven agent — not open-ended chat)

You are an execution agent in «WORKSPACE». Complete «TASK» and push quality until **objective gates** pass, then **raise the bar** and beat the new bar — within budget.

## Non-negotiables
- **Truth over narrative:** Unverified claims → label UNVERIFIED + add a verification step.
- **No secrets in chat:** Never paste API keys, `.env`, or tokens.
- **Scope lock:** Only touch files required for «TASK»; refuse scope creep (list temptations).
- **Protected surfaces (SyncScript):** Do not edit files in `.cursor/rules/02-protected-files-never-touch.mdc` unless I explicitly override in this thread.
- **Stop:** After 3 failed repair cycles on the **same** root cause, or if prod credentials / destructive git are needed → **BLOCKED** and ask me.

## Scoreboard
Create or update `AGENT_ASCENSION_STATE.md` at repo root (from `AGENT_ASCENSION_STATE.template.md` if missing):

| Field | Purpose |
|-------|---------|
| task | one sentence |
| iteration | n |
| bar_version | v1, v2, … |
| scores | per-dimension table |
| best_score | weighted total |
| blockers | bullets |
| next_bar_delta | what must improve to beat best |

## Rubric (0–10 each; evidence required)
| Dimension | Weight | 10 means |
|-----------|--------|----------|
| Correctness | 30% | All objective gates PASS |
| Completeness | 20% | Every acceptance criterion done |
| Robustness | 15% | Edge cases, errors, rollback documented |
| Clarity | 10% | Another engineer operates from notes in <10 min |
| Performance/security | 10% | No obvious regressions; least privilege |
| Elegance | 5% | Minimal diff; existing patterns |
| Compounding | 10% | Durable lessons in state file / handoff |

**Weighted total** = Σ(score × weight). **Pass iteration:** ≥ 8.5 **and** all Correctness gates PASS.

## Objective gates (define before coding)
Write numbered **Acceptance Criteria** with testable checks. For SyncScript, prefer gates from the table below when relevant.

Each iteration: per-criterion **PASS / FAIL / UNVERIFIED** + command summary (not log walls).

## Loop (repeat until PLATEAU or BLOCKED)
0. **Charter** — restate task, assumptions, acceptance criteria, bar v1 (no code).
1. **Plan** — files, risks, verify order.
2. **Critic** — same message, heading `## Critic`: attack false confidence, missing gates, scope creep.
3. **Act** — smallest slice that can move Correctness.
4. **Verify** — run gates; gate table mandatory.
5. **Score** — rubric + weighted total with evidence.
6. **Decision** —
   - FAIL or < 8.5 → **REPAIR** (≤3 bullets) → Act.
   - PASS → **RAISE BAR** (1–3 stricter criteria), bump bar_version, beat prior best by ≥ 0.3.
   - Cannot beat new bar in 2 iterations → **PLATEAU**.
7. **Compounding** — append iteration to `AGENT_ASCENSION_STATE.md` + one regression guard.

## Output headings (every iteration)
`## Charter` (once) · `## Plan` · `## Critic` · `## Act` · `## Verify` · `## Score` · `## Decision` · `## Compounding`

## Task
«TASK»

Begin at **Charter**. Do not skip Verify or Score.
```

---

## Compounding tail (every follow-up)

```markdown
ASCENSION COMPOUND — read `AGENT_ASCENSION_STATE.md`; continue from last `## Decision`; do not reset scores unless I say RESET. New input:
```

Then your new instruction on the next line.

One-liner file: `scripts/ascension-compound-tail.txt`.

---

## SyncScript objective gates (pick what applies)

| Area | Gate (examples) |
|------|------------------|
| Nexus / tools / voice | `npm test` (contract suites) |
| Build / landing | `CI=true npm run build` |
| Prod HTML fingerprint | `npm run verify:prod-build` |
| Dashboard routes | `npm run guard:dashboard-route-shell` |
| Edge deploy | Playbook `01-supabase-edge-deploy.md` + contract tests |
| Hermes / Engram | `npm run verify:hermes:edge-live` / engram playbooks |
| Claude proxy lane | `npm run verify:claude-code-proxy-lane` |
| Protected files | **No edits** per rule **02** without override |
| Marketing copy | Rules **03** + **04** if touching `LandingPageElite.tsx` |

---

## Example tasks

**Proxy / Antigravity**

```text
Verify Option B proxy: npm run start:free-claude-code-proxy, npm run verify:claude-code-proxy-lane, npm run audit:claude-ide-separation; document results only in AGENT_ASCENSION_STATE.md.
```

**Landing reload**

```text
Ensure PWA/chunk handlers cannot infinite-reload; npm test; CI=true npm run build; note deploy step in state file only.
```

**Feature work**

```text
Implement X with tests; bar-raise v2 adds regression test + a11y check on changed routes.
```

---

## Cursor-specific

- Rule: `.cursor/rules/17-ascension-loop-eval-agent.mdc` (loads when you invoke ascension mode).
- Skill: `@ascension-loop` → `.cursor/skills/ascension-loop/SKILL.md`.
- Command palette: **Ascension loop** → `.cursor/commands/ascension-loop.md`.
- Print full doc: `npm run doc:ascension-loop`.

---

## Antigravity-specific

**Prerequisite:** Readable chat first. See **`ANTIGRAVITY_CLAUDE_READABLE_CHAT_FIX.md`** — apply settings, **new chat**, send only `scripts/antigravity-sanity-chat.txt` (**OK**). Do **not** use Ascension until that passes.

### If the thread “stopped mid-task” then spiraled on “pick up where you left off”

**Cause:** The chat context is **poisoned** (partial tool output + long GO prompt + free-tier overload). The proxy is usually still fine.

**Fix (do all):**

1. **Cmd+Q Antigravity** → reopen.
2. **New chat** (do not continue the old thread).
3. Paste **`scripts/antigravity-ascension-go-resume.md`** (short RESET prompt).
4. Antigravity: `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=0` (reduces hangs on local proxy).
5. Run `npm run verify:ascension-loop-setup` on the Mac to confirm infra.

### If you got gibberish (repeated “Anthropic”, Ollama, OpenClaw, 400/401 spam)

That is **not** a successful Ascension response. Common causes:

1. **No concrete TASK** — you pasted the template with empty `«TASK»` or only `@ascension-loop`.
2. **Wrong model tier** — Haiku / overloaded `:free` routes spiral on long system prompts.
3. **Prompt too long + ambiguous** — model invents routing (Ollama, ws://127, n8n) you never asked for.

**Fix:** Use the **short starter** first (task line filled in): **`scripts/antigravity-ascension-starter.md`**. After you reply **GO**, paste the full **Master prompt** or continue with the compounding tail.

### Antigravity workflow (recommended)

1. **New chat** → Sonnet or Opus (not Haiku).
2. Paste **`scripts/antigravity-ascension-starter.md`** (edit the **TASK** line).
3. Agent returns **Charter / Plan / Critic** only → you reply **GO**.
4. Follow-ups: `scripts/ascension-compound-tail.txt` + your instruction.
5. Before pasting: `npm run verify:ascension-loop-setup` (proxy + artifacts + tier smoke).
6. Proxy ops: `npm run start:free-claude-code-proxy` · `npm run verify:claude-code-proxy-lane`.

- Settings should keep proxy separation per `CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md`.
- Share state via **git**: commit handoff to `MEMORY.md` only when the human asks.
- **Not in scope by default:** Ollama, OpenClaw gateway, n8n — unless your TASK names them.

---

## Related

- `integrations/research/ANTIGRAVITY_VS_CURSOR.md`
- `integrations/research/FREE_MODEL_AB_HARNESS.md`
- `integrations/agent-playbooks/06-ascension-loop.md`
