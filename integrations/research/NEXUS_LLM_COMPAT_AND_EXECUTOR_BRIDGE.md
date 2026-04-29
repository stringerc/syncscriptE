# Nexus — OpenAI-compat model policy + optional executor bridge

**Date:** 2026-04-26  
**Outcome:** Single source of truth for provider quirks on the OpenAI Chat Completions wire, plus an authenticated Vercel path to probe/invoke an external gateway (Hermes/OpenClaw-shaped) without vendoring third-party agent runtimes.

## 1. Model compatibility (`api/_lib/openai-compat-model-policy.ts`)

| Rule | Models (heuristic) | Behavior |
|------|-------------------|----------|
| Tool `is_error` | `kimi-*` (incl. OpenRouter `…/kimi-…`) | Strip `is_error` from `role: tool` messages before POST — Moonshot/Kimi reject unknown fields with 400. |
| Token field | `gpt-5*`, `o1*`, `o3*`, `o4*` | Use `max_completion_tokens` instead of `max_tokens`. |
| Sampling | `o1*`, `o3*`, `o4*` | Omit `temperature`, `top_p`, frequency/presence penalties — reasoning APIs often reject them. |

**Wired into:**

- `api/_lib/ai-service.ts` — `callAI`, `callChatCompletion` (Nexus tool loop, guest, phone helpers), `callAIStream`.
- `api/_lib/agent-llm-adapter.ts` — `callAgentChat` (BYOK + Oracle runner LLM path).

**BYOK priority:** When multiple BYOK keys exist, resolution prefers **`groq` before `openrouter` and `anthropic`** (fast/cheap volume before frontier-shaped providers).

**Agent platform fallback:** With no BYOK, **`resolveAgentLLMConfig`** uses the first set env among `NVIDIA_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` (same order spirit as platform `ai-service`). Error: `no_byok_and_no_platform_llm_key` if none are set.

**Platform provider chain:** After the `AI_PROVIDER` primary, fallbacks follow `PROVIDER_FAILOVER_ORDER` in `ai-service.ts` (NVIDIA → Groq → optional Anthropic Haiku → …) among providers with env keys.

## 2. Health / diagnostics (`GET /api/agent/llm-stack`)

Authenticated users receive a JSON snapshot:

- `platform_llm`: `ai_provider_env`, ordered `chain`, `keys_present` booleans (never secret values), `any_provider_ready` (`isAIConfigured()`), **`primary_is_nvidia`** (true when `chain[0]` is `nvidia` — typical if `AI_PROVIDER` is unset or explicitly `nvidia`).
- `agent_runner`: whether `AGENT_RUNNER_BASE_URL` / token envs are set (DB `runner_endpoints` URL is not echoed — security + shape stability).
- `executor_bridge`: whether `NEXUS_EXECUTOR_BRIDGE_URL` / secret / invoke path are configured; host parsed when URL is valid.

**Client usage:** call from Settings or internal ops dashboards with the user session JWT (same auth as other `/api/agent/*` routes).

## 3. Executor bridge (optional gateway worker)

**Purpose:** Same *architectural role* as Supabase Edge `hermes-bridge` — SyncScript stays the product shell; a **separate** long-lived host runs tools / MCP / OpenClaw. Vercel forwards **server-to-server** calls with a shared secret so the gateway can trust `X-SyncScript-User-Id` without exposing operator keys to the browser.

| Env | Role |
|-----|------|
| `NEXUS_EXECUTOR_BRIDGE_URL` | Gateway origin (no trailing slash). |
| `NEXUS_EXECUTOR_BRIDGE_SECRET` | Bearer token on probe + invoke. **Invoke requires this.** |
| `NEXUS_EXECUTOR_BRIDGE_INVOKE_PATH` | Default `/v1/invoke` (Hermes-style POST body: `{ tool, arguments?, idempotency_key? }`). |

**Endpoints (same `[action]` dispatcher):**

- `GET /api/agent/executor-bridge` — probes `GET /health`, `/healthz`, `/` on the gateway (with `Authorization: Bearer` when secret is set).
- `POST /api/agent/executor-bridge` — JSON body forwarded to `{URL}{INVOKE_PATH}` with `Authorization: Bearer {secret}` and `X-SyncScript-User-Id: {supabase user id}`.

**Gateway implementer contract:** Accept Bearer auth, implement at least one health route returning 2xx, implement `POST /v1/invoke` (or override path) compatible with your tool host. Log `X-SyncScript-User-Id` for audit; enforce your own authorization vs SyncScript user ids if multi-tenant.

## 4. Tests

- `tests/nexus-openai-compat-policy.test.ts` — pure policy assertions (Kimi strip, GPT-5 token field, o-series sampling).
- `tests/agent-mode-foundation-contract.test.mjs` — dispatcher actions list, BYOK order, bridge wiring grep.

## 5. Relation to external repos (e.g. claw-code)

We **do not** embed the Rust `claw` CLI or its Discord/OmX stack. We **reuse the engineering idea**: explicit model compatibility table + health probes + explicit HTTP bridge to an executor. Operational detail stays in git-backed TS + this doc.
