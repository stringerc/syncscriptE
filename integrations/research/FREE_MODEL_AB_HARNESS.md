# Free-model quality harness (NIM + OpenRouter `:free`)

**Purpose:** Repeatable **3-task A/B** so “best model” means **measured**, not vibes. Use after changing **`MODEL*`** in **`~/src/free-claude-code/.env`**.

**Honest framing**

- **OpenRouter `:free`** — rate limits, queueing, churn; IDs change; good for **bulk / experiments**, not guaranteed SLA.
- **NVIDIA NIM** — catalog and free-tier availability change; you need **`NVIDIA_NIM_API_KEY`** from [build.nvidia.com](https://build.nvidia.com) and the **exact** **`nvidia_nim/...`** string from the model card for your tenant.
- **Rankings** — [Artificial Analysis](https://artificialanalysis.ai) (coding index, latency), [LMSYS Chatbot Arena](https://chat.lmsys.org/) (preference, not code-only), plus **this harness**.

---

## Prerequisites

1. **`free-claude-code`** running; **`ANTHROPIC_BASE_URL`** / **`ANTHROPIC_AUTH_TOKEN`** set for Antigravity or terminal **`claude`** (see runbook).
2. Keys only in **non-git** `.env` — never paste into chat or **MEMORY.md**.

---

## Three fixed prompts (same every run)

Score each **Pass / Partial / Fail**. Record **model id**, **date**, **latency feel** (optional).

### A — Strict spec adherence

```
You must follow every constraint.

Output exactly four sections with these titles on their own lines:
Goal
Assumptions
Plan
Verification

Rules:
1) Each section has at most 3 bullet lines (use "- " prefix).
2) Verification must list exactly 3 shell commands as separate bullet lines, each starting with "cd " or "npm " or "curl ", runnable from this machine. Do not invent repo paths: if you do not know the workspace root, write UNKNOWN for that bullet only.
3) Do not use the word "lane" unless quoting this prompt.
4) If you cannot read any project file, say UNKNOWN in Assumptions — do not guess file contents.

Task: one sentence describing what "Option B routing" means for Claude Code → free-claude-code → cloud providers.
```

### B — Multi-file refactor sketch (no execution)

```
Sketch a refactor plan (no code edits) to split a hypothetical 800-line React component into 3 files. Max 8 bullets total. Name files only as Foo.tsx / useFoo.ts / foo.test.tsx. End with one risk bullet.
```

### C — Grounded file read (SyncScript workspace)

```
Read the file integrations/research/CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md in the open workspace. Quote exactly one sentence from it (use quotation marks). If you cannot read files, reply only: UNKNOWN_FILE
```

---

## Catalog refresh (before locking `:free` ids)

From SyncScript repo root:

```bash
npm run research:openrouter-free-models
```

Compare candidates on [Artificial Analysis](https://artificialanalysis.ai), then update **`MODEL_SONNET` / `MODEL_HAIKU`** in **`~/src/free-claude-code/.env`** using **`open_router/<catalog_id>`** (underscore prefix).

---

## Related

- **`integrations/research/CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md`** — Option B section + wiring.
- **`scripts/templates/free-claude-code-option-b.env.fragment`** — paste-ready **`MODEL*`** block (no keys).
