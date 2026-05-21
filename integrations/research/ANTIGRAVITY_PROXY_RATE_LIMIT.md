# Antigravity — Provider rate limit reached

## Symptom

`Provider rate limit reached. Please retry shortly. (request_id=…)`

## Cause

OpenRouter **`:free`** models on **MODEL_SONNET** / **MODEL_HAIKU** (Option D). Shared quotas; not SyncScript app code.

## Fix (one command)

```bash
cd /Users/Apple/syncscript
npm run heal:claude-proxy-rate-limit
```

Applies **Option E** (all tiers → **NVIDIA NIM**, no `:free`), restarts proxy, probes Opus/Sonnet/Haiku with **tools**, restarts Antigravity.

## UI check

1. **New** Claude chat (no Resume)
2. Send only: `Reply with exactly: OK`
3. Expect reply containing **OK**

## When to switch back to cheaper routing

After `:free` quotas recover (hours):

```bash
npm run apply:free-claude-code-option-d-hybrid
npm run start:free-claude-code-proxy
```

## Related

- **`GEMINI_CLAUDE_CODE_PROXY.md`** — Option C vs D vs E
- **`MEMORY.md`** § Antigravity + Claude Code + free proxy
- **`cc_lane_rate_limit_tip`** in `scripts/claude-code-lanes.sh`
