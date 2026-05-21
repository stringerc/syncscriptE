# Antigravity Claude gibberish — root cause and fix (fact-based)

**Symptom:** Chat shows token soup (mixed languages, `isEmpty`, `Anthropic` spam, code fragments). Proxy logs may still show **`POST /v1/messages?beta=true` 200**.

**Not the problem:** SyncScript app, Cursor, or “Ascension prompt quality” alone.

---

## Root cause (verified 2026-05-18)

| Layer | Fact |
|-------|------|
| **Client** | Antigravity’s embedded Claude runs with **`--max-thinking-tokens 31999`** and **`stream-json`** (see `ps aux \| grep antigravity.*claude`). |
| **Proxy** | `ENABLE_MODEL_THINKING=false` in `~/src/free-claude-code/.env` — upstream **does not** emit valid extended-thinking SSE for **:free** OpenRouter / NIM models. |
| **Mismatch** | Client expects thinking + strict SSE; free backends return plain text or broken streams → **UI renders garbage**. |
| **Poisoned session** | **`--resume <uuid>`** on a failed thread makes every follow-up worse. |
| **Long prompts** | Ascension / GO blocks on **:free** tiers increase collapse rate (separate from thinking). |

**Proof:** `curl` to `http://127.0.0.1:8082/v1/messages?beta=true` **without** thinking returns **`OK`**. Infrastructure is healthy.

---

## Fix ladder (do in order — stop when chat is readable)

### 1. Apply Antigravity env (automated)

```bash
cd /Users/Apple/syncscript
npm run apply:free-claude-code-option-b    # if proxy models drifted
npm run start:free-claude-code-proxy
npm run apply:antigravity-claude-settings
npm run verify:antigravity-claude-compat
```

Sets in Antigravity `settings.json`:

- `CLAUDE_CODE_DISABLE_THINKING=1`
- `MAX_THINKING_TOKENS=0`
- `DISABLE_INTERLEAVED_THINKING=1`
- `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=0`
- `ANTHROPIC_BASE_URL=http://127.0.0.1:8082`
- `ANTHROPIC_AUTH_TOKEN=freecc`

### 2. Hard reset IDE session

1. **Cmd+Q Antigravity** (full quit).
2. Reopen SyncScript workspace.
3. **New Claude chat** — do **not** click **Resume** on old threads.
4. Paste **only** `scripts/antigravity-sanity-chat.txt` → send.

**Pass:** reply is literally **`OK`** (or one short sentence).  
**Fail:** gibberish → step 3.

### 3. L1 native (reliable chat, paid Anthropic)

Remove proxy env from Antigravity (or run):

```bash
source /Users/Apple/syncscript/scripts/claude-code-lanes.sh
cc_lane_native
```

Then remove the three `ANTHROPIC_*` / proxy entries from Antigravity settings and sign in with **native** Claude/Anthropic auth. Use **L2 proxy** only for bulk terminal `claude` when you accept `:free` flakiness.

### 4. Ascension Loop (only after step 2 passes)

- **Cursor:** `@ascension-loop` or rule 17 — works on repo + tests.
- **Antigravity:** use for **short** coding tasks; avoid megaprompts on `:free`.

---

## What not to do

- Continue a **spiraled** thread (“pick up where you left off”).
- Paste **Ascension master prompt** before sanity **OK** works.
- Use **Haiku** / overloaded `:free` for long agent prompts.
- Assume **OpenClaw / Ollama / ws://127** without evidence.

---

## Verify commands

| Command | Pass |
|---------|------|
| `npm run verify:antigravity-claude-compat` | Summary: PASSED |
| `npm run verify:ascension-loop-setup` | Summary: PASSED |

---

## Related

- `CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md` — lanes L1/L2, thinking table
- `ANTIGRAVITY_ASCENSION_LOOP_PROMPT.md` — after chat is sane
- Claude Code env docs: `CLAUDE_CODE_DISABLE_THINKING`, `MAX_THINKING_TOKENS`
