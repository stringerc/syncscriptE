# Gemini 3.1 in Claude Code (via proxy) — Option C

**What this is:** Claude Code in Antigravity still speaks the **Anthropic API** to `http://127.0.0.1:8082`. The **free-claude-code** proxy maps Claude model names to **OpenRouter** backends, including **`google/gemini-3.1-pro-preview`** and **`google/gemini-3.1-flash-lite`**.

**What this is not:** It does **not** merge Antigravity’s native **Gemini panel** (Google sign-in) into the Claude binary. That panel remains a **separate** chat.

**Critical (agent mode):** Claude Code in Antigravity **always sends `tools`**. **Gemini 3.1 Pro via OpenRouter fails** those requests (`Provider API request failed` in the stream). For daily Claude Code agent work use **Option D (hybrid)** — NIM + `:free` backends that support tools. Use **Option C** only for tool-less probes, or use Antigravity’s **native Gemini panel** for Gemini UI.

---

## Recommended default (Antigravity Claude Code)

**Rate limit (`Provider rate limit reached`):**

```bash
npm run heal:claude-proxy-rate-limit
```

Switches to **Option E** (NIM all tiers, no `:free`). Then **new chat** → `Reply with exactly: OK`.

**Automated fix + verify (includes Antigravity restart):**

```bash
npm run verify:antigravity-sanity-chat
```

**If you see `Provider API request failed`:** you are almost certainly on Option C or an old session — run:

```bash
npm run fix:claude-proxy-antigravity
```

Otherwise:

```bash
npm run apply:free-claude-code-option-d-hybrid
npm run start:free-claude-code-proxy
npm run verify:claude-proxy-full
```

## Apply Option C (tool-less / experimental)

```bash
cd /Users/Apple/syncscript
npm run apply:free-claude-code-option-c-gemini
npm run start:free-claude-code-proxy
npm run verify:antigravity-claude-compat
```

Cmd+Q Antigravity → reopen → **new** Claude chat → `Reply with exactly: OK`

**Requires:** `OPENROUTER_API_KEY` in `~/src/free-claude-code/.env` (Gemini preview tiers are **not** `:free`).

---

## Routing (default fragment)

| Claude tier | OpenRouter backend |
|-------------|-------------------|
| Opus / default | `google/gemini-3.1-pro-preview` |
| Sonnet | `google/gemini-3.1-pro-preview` |
| Haiku | `google/gemini-3.1-flash-lite` |

Revert to NIM + `:free` mix: `npm run apply:free-claude-code-option-b`

---

## Rate-limit failover

```bash
source scripts/claude-code-lanes.sh
cc_lane_failover_gemini
```

---

## Daily “best model” audit

```bash
npm run research:daily-claude-model-audit          # report only
npm run research:daily-claude-model-audit -- --apply --restart-proxy
npm run install:daily-claude-model-audit-launchd   # 21:00 daily (audit only)
```

Reports: `reports/claude-model-audit/audit-YYYY-MM-DD.txt`  
Preferences: `scripts/templates/claude-model-tier-preferences.json`

---

## Related

- `CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md`
- `ANTIGRAVITY_CLAUDE_READABLE_CHAT_FIX.md`
