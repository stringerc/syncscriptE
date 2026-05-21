# Claude Code + `free-claude-code` proxy — operator runbook (SyncScript repo)

**Purpose:** One **git-safe** place for **Lane L1 / L2 / L3**, **machine facts**, **model shortlists**, and **upstream env var names** — **no API keys** in this file or in git.

**Upstream project:** [Alishahryar1/free-claude-code](https://github.com/Alishahryar1/free-claude-code) — read its **README** and **`.env.example`** as the source of truth; this runbook is **opinionated routing** only.

**SyncScript repo wiring (tracked):**

| Artifact | Path |
|----------|------|
| This runbook | `integrations/research/CLAUDE_CODE_FREE_PROXY_OPERATOR_RUNBOOK.md` |
| Shell lane helpers | `scripts/claude-code-lanes.sh` (`source` → `cc_lane_native`, `cc_lane_proxy`, `cc_lane_verify`, `cc_lane_help`, …) |
| Proxy preflight (TCP/HTTP) | `scripts/verify-claude-code-proxy-lane.sh` — also **`cc_lane_verify`** after sourcing |
| Option B env fragment (no keys) | `scripts/templates/free-claude-code-option-b.env.fragment` — merge into upstream **`.env`** |
| Apply Option B to proxy `.env` | **`npm run apply:free-claude-code-option-b`** or **`cc_lane_apply_option_b`** (backs up, updates `MODEL*` only) |
| Separation audit | **`npm run audit:claude-ide-separation`** or **`cc_lane_audit_separation`** (Antigravity / Cursor / SyncScript / shared OpenRouter key) |
| OpenRouter `:free` catalog dump | `npm run research:openrouter-free-models` → `scripts/list-openrouter-free-models.sh` |
| 3-task A/B harness | `integrations/research/FREE_MODEL_AB_HARNESS.md` |
| Research catalog row | `integrations/research/INDEX.md` |
| Long-form strategy + machine scan | `MEMORY.md` → **§ Antigravity + Claude Code + free proxy (2026-05-09)** |
| Session handoff | `SESSION_START.md` → **IDE discipline** (Claude Code lanes bullet) |

---

## Definition of done (repo + operator)

**Repo side (complete — nothing left to “finish” in git):** runbook (incl. **Option B**), lane script, **preflight**, **`scripts/templates/free-claude-code-option-b.env.fragment`**, **`FREE_MODEL_AB_HARNESS.md`**, **`list-openrouter-free-models.sh`**, npm **`research:openrouter-free-models`**, npm **`verify:claude-code-proxy-lane`**, INDEX row, MEMORY + SESSION_START + TOOLS pointers — **done**.

**Operator side (you still execute on your Mac — cannot be automated from this repo):**

| # | Check | Evidence |
|---|--------|----------|
| 1 | **`free-claude-code` cloned outside** SyncScript (e.g. `~/src/free-claude-code`) | Folder exists; `git remote -v` shows upstream |
| 2 | **`.env` only in non-git paths** (`~/src/.../.env` or `~/.config/free-claude-code/.env` via `fcc-init`) | `git status` in SyncScript shows **no** new secrets |
| 3 | **Keys rotated** if ever pasted in chat | OpenRouter / NVIDIA key UI shows old key **revoked** |
| 4 | **Proxy listens** on `127.0.0.1:${FCC_PROXY_PORT:-8082}` | **`cc_lane_verify`** or **`bash scripts/verify-claude-code-proxy-lane.sh`** exits **0** (HTTP answer, not connection refused) |
| 5 | **`cc_lane_proxy` + `claude`** returns real model traffic | Proxy log `POST /v1/messages` + NIM/OpenRouter dashboard spike |
| 6 | **`cc_lane_native`** restores L1 | `cc_lane_proxy_status` / env show `ANTHROPIC_BASE_URL` unset |
| 7 | **Post-upgrade smoke** after Antigravity or Claude Code updates | Repeat rows 4–5; watch for [upstream `ANTHROPIC_BASE_URL` / CLI regressions](https://github.com/Alishahryar1/free-claude-code/issues/168) class issues |

---

## Security (non-negotiable)

- **Never** commit **`NVIDIA_NIM_API_KEY`**, **`OPENROUTER_API_KEY`**, or **`ANTHROPIC_AUTH_TOKEN`** (if reused) to **git** or **`MEMORY.md`**.
- Prefer **macOS Keychain**, **1Password CLI inject**, or a **non-tracked** `~/.config/free-claude-code/.env`** (see upstream `fcc-init`).
- **Revoke and rotate** any key that has appeared in **chat**, screenshots, or screen shares.

---

## This Mac (facts — 2026-05-09)

| Resource | Value | Implication |
|----------|--------|-------------|
| CPU | Apple **M1 Pro** | Fine for **proxy + Claude Code**; avoid default **Ollama** bulk load if you want a cool machine. |
| RAM | **16 GiB** | Same — **cloud-first L2**. |
| Tooling | **Node 24**, **Python 3.14**, **Docker**, **Ollama** installed | You *can* use L3 locally; **default L2 in cloud** (NIM → OpenRouter). |

---

## Lanes (recap)

| Lane | Use | Routing |
|------|-----|---------|
| **L1** | Short planning, security, final review | **Antigravity / native** — **no** `ANTHROPIC_BASE_URL` override (or IDE default). |
| **L2** | Bulk coding | **`free-claude-code`** proxy on **`http://127.0.0.1:<port>`** — see below. |
| **L2c** | Claude Code on **Gemini 3.1** (OpenRouter) | **`npm run apply:free-claude-code-option-c-gemini`** — see **`GEMINI_CLAUDE_CODE_PROXY.md`**. |
| **L3** | Offline / zero paid API | **Ollama** via proxy — **last** choice on this hardware for heavy runs. |

---

## Upstream config — **NIM first**, **OpenRouter second** (cloud-first)

`free-claude-code` uses **`provider_id/model/...`** strings (see upstream **Choose a provider** table). OpenRouter’s prefix in that repo is **`open_router/`** (underscore). NVIDIA is **`nvidia_nim/`**.

**Example `.env` shape (placeholders only — copy to your non-git config):**

```dotenv
# Keys live ONLY in Keychain / ~/.config/free-claude-code/.env — never in SyncScript git.
NVIDIA_NIM_API_KEY="nvapi-…"
OPENROUTER_API_KEY="sk-or-…"

# Shared secret Claude Code sends to the proxy (any non-empty string you configure both sides).
ANTHROPIC_AUTH_TOKEN="freecc"

# Tier routing: Opus-shaped → NIM; Sonnet/Haiku → OpenRouter :free (refresh ids with npm run research:openrouter-free-models).
MODEL="nvidia_nim/z-ai/glm-5.1"
MODEL_OPUS="nvidia_nim/z-ai/glm-5.1"
MODEL_SONNET="open_router/deepseek/deepseek-v4-flash:free"
MODEL_HAIKU="open_router/minimax/minimax-m2.5:free"

# Paid / lower-latency alternative (not :free): open_router/deepseek/deepseek-v4-flash
# If a model rejects “thinking”, try upstream README’s “(no thinking)” picker variants or disable thinking flags per upstream docs.
```

**Why these models:** **`nvidia_nim/z-ai/glm-5.1`** is the current **NIM** Z.ai GLM card (older **`glm4.7`** ids may fail startup validation); confirm on [build.nvidia.com](https://build.nvidia.com); **`open_router/deepseek/deepseek-v4-flash`** is a **low $/token** OpenRouter workhorse (re-check **openrouter.ai/models** before locking). Swap **`MODEL_*`** after your own **A/B** on three fixed tasks (refactor, fix tests, multi-file feature).

**Free / experimental OpenRouter IDs** (rate-limited; rotate if flaky): e.g. **`open_router/minimax/minimax-m2.5:free`**, **`open_router/qwen/qwen3-coder:free`** — see OpenRouter **free models** collection.

**Discover current `:free` slugs (no API key):** `GET https://openrouter.ai/api/v1/models` then filter `id` containing `:free`. Example (coding-ish subset only — re-run when you change tiers):

```bash
curl -sS "https://openrouter.ai/api/v1/models" | python3 -c "import json,sys; d=json.load(sys.stdin); free=[m['id'] for m in d.get('data',[]) if ':free' in m.get('id','')]; print('\\n'.join(sorted(free)))"
```

Wire any chosen **`provider/model`** as **`open_router/<same slashes as catalog id>`** (underscore after `open_router`, rest matches OpenRouter’s id).

SyncScript shortcut: **`npm run research:openrouter-free-models`** (same data, sorted).

---

## Option B — “best free” cloud routing (NIM + OpenRouter `:free`)

**What “best free” means (honest)**

| Surface | Reality |
|---------|---------|
| **OpenRouter `:free`** | Rate limits, queueing, churn; **ids change**; great for **bulk / experiments**, not guaranteed prod SLA. Refresh with **`npm run research:openrouter-free-models`** before locking **`MODEL_*`**. |
| **NVIDIA NIM** | Catalog / free-endpoint availability **changes**; you still need **`NVIDIA_NIM_API_KEY`** from [build.nvidia.com](https://build.nvidia.com) and the **exact** **`nvidia_nim/...`** string from the **model card** for your tenant. |
| **Rankings** | [Artificial Analysis](https://artificialanalysis.ai) (coding index, latency), [LMSYS Chatbot Arena](https://chat.lmsys.org/) (preference, not code-only), plus **`integrations/research/FREE_MODEL_AB_HARNESS.md`** (3 fixed prompts, pass/fail). |

**Concrete routing (paste into `~/src/free-claude-code/.env` — keys only there, never in git)**

Use the tracked fragment (**no secrets**): **`scripts/templates/free-claude-code-option-b.env.fragment`** — uncomment / fill **`NVIDIA_NIM_API_KEY`**, **`OPENROUTER_API_KEY`**, keep **`ANTHROPIC_AUTH_TOKEN`** in sync with Antigravity / `cc_lane_proxy`.

Default tier shape in that fragment:

- **`MODEL`** + **`MODEL_OPUS`** → **`nvidia_nim/z-ai/glm-5.1`** (confirm slug on NVIDIA model card; **`glm4.7`** may be delisted).
- **`MODEL_SONNET`** + **`MODEL_HAIKU`** → **different** `:free` ids (e.g. deepseek-v4-flash + minimax-m2.5) — same slug on both tiers doubles rate-limit pressure.

**`ENABLE_MODEL_THINKING=false`** in the fragment — reduces Antigravity / Claude Code vs-provider thinking mismatches until you A/B-enable per tier.

**After every `.env` change:** restart the proxy with a **clean process env** (exported **`MODEL*`** from an old `source .env` overrides the file):

```bash
cd /Users/Apple/syncscript && npm run start:free-claude-code-proxy
npm run verify:claude-code-proxy-lane
```

Manual equivalent: stop anything on **8082**, then `env -u MODEL -u MODEL_OPUS -u MODEL_SONNET -u MODEL_HAIKU uv run uvicorn server:app --host 127.0.0.1 --port 8082` in **`~/src/free-claude-code`**.

**Research loop (~15 min, repeatable)**

| Step | Action |
|------|--------|
| 1 | [Artificial Analysis](https://artificialanalysis.ai) — shortlist 2–3 coding candidates in your budget / free tier. |
| 2 | **`npm run research:openrouter-free-models`** — confirm `:free` ids still exist. |
| 3 | [build.nvidia.com](https://build.nvidia.com) — copy exact **`nvidia_nim/...`** for **`MODEL` / `MODEL_OPUS`**. |
| 4 | Run **`integrations/research/FREE_MODEL_AB_HARNESS.md`** three prompts; score Pass / Partial / Fail. |

**Three literal lines from SyncScript repo root (smoke + catalog + IDE)**

```bash
npm run verify:claude-code-proxy-lane
npm run research:openrouter-free-models
open -a Antigravity "/Users/Apple/syncscript"
```

---

## Run proxy + Claude Code (exact env names from upstream)

1. Clone **`free-claude-code`** **outside** this app repo (e.g. `~/src/free-claude-code`), `cp .env.example .env`, fill keys **only** there.
2. Start: `uv run uvicorn server:app --host 127.0.0.1 --port 8082` (or upstream’s `free-claude-code` command).
3. **Claude Code** must use **proxy root** — **`ANTHROPIC_BASE_URL=http://127.0.0.1:8082`** — **do not** append **`/v1`** (upstream README warning).
4. Match **`ANTHROPIC_AUTH_TOKEN`** in the shell to the value in proxy `.env`.
5. Optional **`CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`** for **`/model`** discovery (see upstream **Model Picker** section).

**Shell (from upstream README):**

```bash
ANTHROPIC_AUTH_TOKEN="freecc" ANTHROPIC_BASE_URL="http://127.0.0.1:8082" CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1 claude
```

**Same variables in VS Code (Claude Code extension)** — upstream README pattern; paste into user `settings.json` under `claudeCode.environmentVariables`:

```json
"claudeCode.environmentVariables": [
  { "name": "ANTHROPIC_BASE_URL", "value": "http://127.0.0.1:8082" },
  { "name": "ANTHROPIC_AUTH_TOKEN", "value": "freecc" },
  { "name": "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY", "value": "1" }
]
```

**Antigravity** (VS Code–family): Claude Code picks up **`claudeCode.environmentVariables`** from Antigravity’s user **`settings.json`**. On macOS that file is **`~/Library/Application Support/Antigravity/User/settings.json`**. Backup before edits (e.g. copy to **`settings.json.bak.syncscript-claude-proxy`**). Example keys (mirror **`cc_lane_proxy`**: port **8082**, token **`freecc`**):

```json
"claudeCode.environmentVariables": [
  { "name": "ANTHROPIC_BASE_URL", "value": "http://127.0.0.1:8082" },
  { "name": "ANTHROPIC_AUTH_TOKEN", "value": "freecc" },
  { "name": "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY", "value": "1" }
]
```

**Quit and reopen Antigravity** after saving so the Claude Code integration reloads env. Smoke: proxy log should show **`GET /v1/models`** then **`POST /v1/messages`** when you send a prompt; preflight (**`npm run verify:claude-code-proxy-lane`**) sends **`x-api-key`** aligned with **`ANTHROPIC_AUTH_TOKEN`** so **`/v1/models`** returns **200** when the proxy enforces auth.

**JetBrains ACP:** set the **same three** env vars in that product’s documented env surface (see upstream **JetBrains ACP** section).

**Prefer repo script (bash):** from repo root:

```bash
source scripts/claude-code-lanes.sh
cc_lane_help
cc_lane_proxy    # L2 — proxy must already be running
cc_lane_verify   # exits 0 only if something answers HTTP (not “silent hang” debugging)
claude
```

**Or npm (same script):** `npm run verify:claude-code-proxy-lane`

---

## Preflight (automated — fixes “nothing on 8082” ambiguity)

Before blaming **`claude`** for a hang, confirm the proxy answers on the wire:

```bash
# From repo root (no need to source first; uses FCC_PROXY_PORT or 8082)
bash scripts/verify-claude-code-proxy-lane.sh

# After lanes (uses ANTHROPIC_BASE_URL from cc_lane_proxy)
source scripts/claude-code-lanes.sh
cc_lane_proxy
cc_lane_verify
```

- **Exit 0:** at least one of **`GET /v1/models`**, **`GET /`**, **`GET /health`**, **`GET /v1/health`** returned an HTTP status (any code). That rules out “connection refused / nothing listening.”
- **Exit 1:** prints **FAIL** + fix steps (start upstream `uvicorn` / CLI on the right host/port).

This does **not** prove NIM/OpenRouter keys or model routing — only that the **local** Anthropic-shaped endpoint is up.

---

## Manual E2E (after preflight passes)

Use a **non-interactive** one-shot so you know within **~60 seconds** whether the client + proxy path works:

```bash
source scripts/claude-code-lanes.sh
cc_lane_proxy
cc_lane_verify
claude -p "Reply with exactly: PONG" --max-turns 1 --no-session-persistence
```

- **Expect:** a short **`PONG`** (or model text containing it) in roughly **5–30 seconds** once upstream keys and models are valid.
- **If it prints nothing for >60 seconds:** **Ctrl+C** — treat as **proxy or upstream provider** issue, not the lane script. Re-run **`cc_lane_verify`**, read **proxy logs**, confirm **`.env`** in the **non-git** clone.

Then complete the checklist in **Verification** below (logs + dashboards).

---

## SyncScript vs Antigravity — do they affect each other?

| Surface | What it uses | Touches SyncScript deploy? |
|---------|----------------|----------------------------|
| **Cursor** (this repo) | `.cursor/rules`, `npm test`, Vercel/Supabase when you deploy | **No** proxy env in app source; workspace `.env` is separate from `~/src/free-claude-code/.env` |
| **Antigravity + Claude Code** | `~/Library/Application Support/Antigravity/User/settings.json` → `ANTHROPIC_BASE_URL=http://127.0.0.1:8082` | **No** — only if you point both at the **same** third-party API key (see below) |
| **syncscript.app prod** | Vercel `api/*`, optional `OPENROUTER_API_KEY` / `NVIDIA_API_KEY` for Nexus/agent | **Independent** from the local proxy unless you **reuse the same OpenRouter key** for both |

**Rule:** Keep **`~/src/free-claude-code/.env`** (proxy keys) **outside git**. Keep **SyncScript** secrets in **Vercel / Supabase** only. If Antigravity shows **Provider rate limit reached**, that is almost always **NIM or OpenRouter quota on the proxy path**, not the Vite app or landing page.

**Lanes (recommended split):**

| Lane | When | Command / IDE |
|------|------|----------------|
| **L1** | Planning, security review, or when **:free** is rate-limited and you have native Anthropic access | Antigravity **without** proxy env, or `cc_lane_native` in Terminal |
| **L2** | Bulk coding via **free/cheap** cloud | Proxy running + Antigravity `claudeCode.environmentVariables` or `cc_lane_proxy` |
| **Cursor** | Ship SyncScript | Open **this repo in Cursor** — do **not** set `ANTHROPIC_BASE_URL` in Cursor user settings unless you intentionally want the proxy there too |

---

## Troubleshooting — **Provider rate limit reached** (`req_…`)

**Symptom:** Antigravity / Claude Code shows *Provider rate limit reached. Please retry shortly.* with a `request_id=req_…`.

**Meaning:** The **upstream** behind `free-claude-code` (usually **OpenRouter `:free`** or **NVIDIA NIM**) rejected the call for quota/rate — not a SyncScript bug.

**Fix (no SyncScript code changes):**

1. **Restart proxy** after any `.env` edit: `uv run uvicorn server:app --host 127.0.0.1 --port 8082` in `~/src/free-claude-code`.
2. **Split Sonnet vs Haiku** — do **not** point both at the same `:free` model (e.g. two `qwen3-coder:free` lines hit one bucket twice). Use **`scripts/templates/free-claude-code-option-b.env.fragment`** (diversified defaults) or run **`npm run research:openrouter-free-models`** and pick two different `open_router/...:free` ids.
3. **Wait 1–5 minutes** — `:free` tiers often reset quickly; retry with a smaller prompt.
4. **Fall back to L1** for critical work: remove proxy env in Antigravity (or `cc_lane_native`), use native Anthropic/IDE auth until `:free` cools down.
5. **Separate API keys** — if **Vercel** `OPENROUTER_API_KEY` and **`~/src/free-claude-code/.env`** use the **same** OpenRouter key, **prod traffic + Antigravity share one quota**. Prefer a **second key** for local proxy experiments (OpenRouter dashboard → create another key).
6. **NIM headroom** — keep **`MODEL` / `MODEL_OPUS`** on **`nvidia_nim/...`**; if only Sonnet/Haiku fail, the limit is likely **OpenRouter**, not NIM.

**One-command apply (repo → proxy `.env`, keys preserved):**

```bash
npm run apply:free-claude-code-option-b
npm run audit:claude-ide-separation
```

**Smoke after changes:**

```bash
npm run verify:claude-code-proxy-lane
source scripts/claude-code-lanes.sh && cc_lane_proxy && claude -p "Reply PONG" --max-turns 1 --no-session-persistence
```

---

## Troubleshooting — Antigravity chat shows **gibberish** (token soup, mixed languages)

**Canonical fix (2026-05-18):** **`integrations/research/ANTIGRAVITY_CLAUDE_READABLE_CHAT_FIX.md`**

```bash
npm run apply:antigravity-claude-settings
npm run start:free-claude-code-proxy
npm run verify:antigravity-claude-compat
# Cmd+Q Antigravity → reopen → NEW chat → scripts/antigravity-sanity-chat.txt only
```

**Cause:** Client extended thinking (`max-thinking-tokens`) + free-tier backends + poisoned **Resume** sessions — not a dead proxy.

---

## Troubleshooting — Antigravity / Claude Code UI: **invalid response**, **request to provider**, **`req_…`**

**Observation:** Proxy access logs often show **`POST /v1/messages`** **200 OK** while the **IDE still shows an error** — that usually means the **client rejected the streamed SSE / message shape**, not that nothing reached the proxy.

**Likely causes** (when upstream is **Ollama** `/v1/messages`):

| Cause | Why | Mitigation |
|--------|-----|------------|
| **`output_config`, `context_management`, `mcp_servers`** on the wire | Newer Claude Code sends these; **Ollama’s Anthropic shim is partial**; streams can violate what the client expects. | Use a proxy build that **drops those keys** before calling Ollama (local patch to `OllamaProvider._build_request_body`), or use **NIM / OpenRouter** for full native compatibility. |
| **HTTP 400 → IDE shows “Invalid request sent to provider”** | Mapped from **`openai.BadRequestError`** / **HTTP 400** in **`free-claude-code`** — upstream **rejected the JSON**. Common with **Ollama**: **`type: ["string","null"]`** in tool **`input_schema`**, **`cache_control`** on prompts, **hosted server tools** in `tools`. | Local **`OllamaProvider`** patch: strip **`cache_control`**, coerce schema **`type` unions** to a string, drop **server tools** without **`input_schema`**, remove empty **`tools`/`tool_choice`**. For heavy agent use, prefer **NIM/OpenRouter** instead of Ollama. |
| **Extended thinking** | Thinking deltas + **Antigravity** validation are strict; local models are uneven. | **`ENABLE_MODEL_THINKING=false`**; pick **`(no thinking)`** model ids if using discovery. |
| **Vision / non-tool models** | e.g. **`llava`** — **Ollama returns HTTP 400** *“does not support tools”* when Claude Code / Antigravity sends **`tools`** (they always do in agent mode). UI shows **Invalid request sent to provider.** | Use a **tool-capable** tag (**`ollama pull qwen2.5-coder:…`**, **`llama3.1`**, etc.) and set **`MODEL=ollama/…`** to that tag. |

**Recovery:** Change **`.env`** or provider code → **restart Uvicorn** → **Cmd+Q** quit Antigravity → reopen → retry.

---

## Verification (after every Claude Code / Antigravity / proxy update)

1. **Preflight:** **`cc_lane_verify`** exit **0** (or npm script above).
2. **Proxy log** shows requests hitting **`/v1/messages`**.
3. **NIM** and/or **OpenRouter** dashboards show matching traffic — not “UI says Opus” alone.
4. If errors mention **`speed`**, **`undefined … input_tokens`**, or malformed SSE — follow upstream **Troubleshooting**; often **`ANTHROPIC_BASE_URL`** shape or **thinking** flags.
5. If Claude Code **ignores** `ANTHROPIC_BASE_URL` after an upgrade, check upstream issues (e.g. **[free-claude-code #168](https://github.com/Alishahryar1/free-claude-code/issues/168)** class) and release notes — **do not** assume the proxy is broken until the client path is confirmed.

---

## Evaluation (pick models with evidence)

- **Artificial Analysis** — coding / LiveCodeBench views: **`https://artificialanalysis.ai`**
- **OpenRouter catalog** — `GET https://openrouter.ai/api/v1/models` (no key required for listing)
- **NVIDIA** — **`https://build.nvidia.com`** model cards for exact **`nvidia_nim/...`** ids

---

## Repo helpers (this workspace)

- **`scripts/claude-code-lanes.sh`** — `source` it for **`cc_lane_native`** / **`cc_lane_proxy`** / **`cc_lane_verify`** (no secrets inside).
- **`scripts/verify-claude-code-proxy-lane.sh`** — standalone preflight; **`npm run verify:claude-code-proxy-lane`** from repo root.

---

## Policy

Routing Anthropic-shaped clients through a **non-Anthropic** backend may violate **ToS** for **Claude Code**, **Antigravity**, **Anthropic**, **NVIDIA**, **OpenRouter**, or the **proxy** — **operator risk**; re-read terms before client work.
