# OpenClaw + ClawHub + browser — SyncScript stack (fact-based)

**Purpose:** Canonical architecture for **agent browser** capability, **ClawHub** discovery, and **Cursor** integration — without pretending two IDEs merge into one process.

**Last probed:** 2026-04-17 — OpenClaw **2026.3.13** on one dev machine (`openclaw --version`); **npm `openclaw` latest stable** was **2026.4.15** (`npm view openclaw version`). **Upgrade gateways** that sit behind SyncScript: `npm i -g openclaw@latest` then `openclaw doctor` (see [npm openclaw](https://www.npmjs.com/package/openclaw)).

---

## Recommended stack (roles)

| Layer | Role |
|-------|------|
| **OpenClaw gateway + bundled browser plugin** | Primary **agent browser** on the host/VM that runs `openclaw gateway` (isolated profile, CDP, SSRF policy). See [Browser (OpenClaw-managed)](https://docs.openclaw.ai/tools/browser), **`integrations/ENGRAM_OPENCLAW.md`**, **`MEMORY.md`** (ports, `OPENCLAW_BASE_URL`). |
| **ClawHub** | **Discovery + optional skills/plugins** — vet before install. Prefer **bundled** browser over duplicate ClawHub “browser automation” skills unless you need a specific CLI (Stagehand, CDP shim, etc.). Official docs: [ClawHub](https://docs.openclaw.ai/tools/clawhub), site [clawhub.ai](https://clawhub.ai/). |
| **Custom thin bridge** (future / gated) | If **Nexus in the app** must trigger checks: **one** trusted service with **3–5 audited endpoints** (e.g. `open_url`, `snapshot`, `screenshot`, `health`) calling **local** browser automation — **no** raw CDP exposed to the public internet. Reuse **`openclaw-bridge`** security patterns (`supabase/functions/.../openclaw-bridge.tsx`). |
| **Cursor** | **MCP browser** (e.g. Playwright / Chrome DevTools MCP) for **dev-time** parity, **or** invoke OpenClaw/bridge via **terminal + scripts** — not magic cross-IDE embedding. |

**Reasoning:** Reimplementing Chromium control from scratch is worse than composing **OpenClaw’s documented browser** + **allowlists** + existing **bridge discipline**.

---

## Local CLI facts (this repo / this Mac)

### `openclaw skills`

- **Docs** sometimes show `openclaw skills search "…"` — on **2026.3.13** the `skills` subcommand exposes **`check` | `info` | `list`** only (`openclaw skills --help`). There is **no** `search` subcommand in this build.
- **Workaround:** Use **`openclaw skills list`** (table: Status / Skill / Description / Source) and **`npx clawhub@latest search "<query>"`** for registry search without a global `clawhub` install.

### `openclaw skills list` (snapshot)

- Reported **35 / 56** skills **ready**; remainder **missing** deps (CLIs, tokens, etc.).
- **Notable for SyncScript-adjacent workflows:**
  - **Ready:** `github`, `gog` (Google Workspace), `himalaya`, `gemini`, `coding-agent`, `apple-notes`, `apple-reminders`, `blogwatcher`, `healthcheck`, …
  - **Missing here:** `clawhub` (**ClawHub CLI skill** — install global `clawhub` or use `npx`), `mcporter` (MCP CLI bridge), `1password`, `discord`, …
- **Browser:** First-party automation is the **bundled `browser` plugin** (see OpenClaw browser docs), not a row named “browser” in `skills list`. The **GitHub** skill explicitly says complex web UI flows should use **browser tooling** when available.

### `npx clawhub@latest search` (registry, embedding scores)

Run from repo root (needs network):

```bash
npx --yes clawhub@latest search "browser" --limit 15
npx --yes clawhub@latest search "nexus" --limit 12
npx --yes clawhub@latest search "voice" --limit 12
```

**2026-04-17 sample (browser):** hits include `agent-browser-clawdbot`, `browser-automation`, `ws-agent-browser`, `agent-browser-stagehand`, `browser-automation-cdp`, `browser-js`, etc. These are **community** packages — **overlap** with OpenClaw’s built-in browser; treat as **optional** after reading `SKILL.md` / source.

**`nexus` query:** names like `nexus-mcp-bridge`, `nexus-llm-gateway`, … are **generic** registry names — **not** SyncScript’s Nexus product. Do not install expecting our stack without reading the bundle.

**`syncscript` query:** **no** relevant hits in a short probe — expected (product-specific logic stays in this repo).

**`voice` query:** macOS / Telegram / TTS-related skills — compare to our **Kokoro / voice pipeline** before adopting.

---

## Similar discovery surfaces (cross-links)

| Resource | Use |
|----------|-----|
| [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) | Categorized index over the **official** registry — useful when ClawHub search is noisy. |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | Cross-tool skills (Claude Code, Gemini CLI, **Cursor**, etc.) — same **vet-before-install** rule. |
| [Model Context Protocol](https://modelcontextprotocol.io/) | Standard for **tool servers**; **mcporter** skill (when installed) helps list/call MCP from OpenClaw. |

**Security:** Community registries are **supply-chain surfaces**. Prefer **pinned versions**, read **`SKILL.md`**, and avoid **auto-install** in production gateways. See also OWASP discussion of agentic skills risk classes (search: *OWASP agentic skills*).

---

## Antigravity comparison (capabilities, not integration)

Google documents Antigravity’s **browser agent** as IDE-integrated, **separate Chrome profile**, artifacts, and user settings — [Antigravity browser docs](https://antigravity.google/docs/browser). **Parity** for us means **isolated agent browser + verification loop + artifacts**, implemented via **OpenClaw browser plugin** (+ optional **thin bridge**), not calling Antigravity from Cursor.

---

## “AGI” — straight talk

**No** combination of OpenClaw, Cursor, ClawHub, or MCP **produces AGI** in the scientific sense. What you *can* maximize is **reliable autonomy within boundaries**: memory, tools, verification (tests, browser snapshots, human review), and **least privilege**. Framing matters so the stack is judged on **outcomes** (fewer incidents, faster shipping), not hype.

---

## Mission Control naming (two different things)

| Name | What it is |
|------|------------|
| **Local / repo “Mission Control”** | Described in **`SYNCSCRIPT_MASTERGUIDE.md`** / **`SYNCSCRIPT_VISUAL_ARCHITECTURE.md`**: separate **local** stack (e.g. Vite **:5200** + Hono **:5211** under `mission-control/` in that guide). **Not** the same binary as the public site. |
| **Enterprise Mission Control (in-app)** | **syncscript.app** (and related) **Enterprise** workspace UI — orchestration tab, agents, etc. — see routing/discord refs in-repo (`EnterpriseToolsPage`, `EnterpriseChatTab`). |

**OpenClaw “mission control”** in **`integrations/TOOLING_UPDATE_RADAR.md`** means **runtime orchestration** around the **gateway + Edge bridge** — not a single dashboard name.

---

## Broader 2026 “AI possibilities” (nothing magical — complementary layers)

Use this as a **checklist** so you do not treat OpenClaw as the only knob.

| Layer | Role | Notes |
|-------|------|--------|
| **OpenClaw gateway** | Long-running agent, plugins, **bundled browser**, skills | Keep **updated** (`openclaw@latest`, `openclaw doctor`). |
| **ClawHub** | Extra skills/plugins | Vet every install; overlap with bundled tools is common. |
| **MCP** | Standard tool transport for IDEs and agents | **mcporter** skill when you need CLI↔MCP; Cursor **Settings → MCP** for dev. Spec: [modelcontextprotocol.io](https://modelcontextprotocol.io/). |
| **Cursor** | Repo editing, rules, terminal | **Rules** + **MCP** + **Composer** — orthogonal to OpenClaw; same git truth. |
| **Engram + Hermes** | Multi-agent routing / executor in *this* repo | `integrations/ENGRAM_OPENCLAW.md`, `integrations/HERMES.md`. |
| **Composio / integration hubs** | Many SaaS connectors via MCP-shaped flows | Useful for *breadth*; still **OAuth/secrets** and review — mentioned in **`MEMORY.md`** as a pattern. |
| **Evals & CI** | Prevent regressions | `npm test`, smoke tests, `verify:openclaw:edge-live` — “intelligence” without measurement drifts. |
| **Security** | Supply chain | OWASP-style **agentic skills** risk; don’t auto-install community skills on prod gateways. |

**“Anything new?”** — Treat **npm + GitHub releases** as ground truth for OpenClaw; treat **ClawHub + awesome lists** as discovery; treat **Cursor changelog** for IDE-side features. Re-run **`npm run tooling:radar`** periodically.

---

## Operator runbook (practical next steps)

Do these on the **machine that runs the OpenClaw gateway** (laptop, Oracle VM, etc.), not only on a random dev clone.

### 1) Stay on a current OpenClaw

```bash
npm view openclaw version
openclaw --version
npm i -g openclaw@latest
openclaw doctor
```

Pin or document the version you run in prod after upgrades (gateway + Supabase **`OPENCLAW_BASE_URL`** must match a healthy process).

### 2) ClawHub CLI (optional but unlocks bundled `clawhub` skill)

```bash
npm i -g clawhub
clawhub --version
openclaw skills check   # expect clawhub skill → ready when deps satisfied
```

Search without global install still works: `npx --yes clawhub@latest search "…"`.

### 3) Browser plugin (must not be accidentally disabled)

Per [Missing browser command or tool](https://docs.openclaw.ai/tools/browser#missing-browser-command-or-tool):

- `browser.enabled: true` in `~/.openclaw/openclaw.json`
- If `plugins.allow` is set, it **must** include **`browser`**
- Restart gateway after changes

**Token auth (local CLI ↔ gateway):** If `openclaw browser` fails with `gateway token mismatch`, the WebSocket client token must match `gateway.auth.token`. Align by exporting **`OPENCLAW_GATEWAY_TOKEN`** to the **same value** as `gateway.auth.token` in `~/.openclaw/openclaw.json` for the shell session (or fix drift with `openclaw gateway install --force` / `openclaw doctor` per its output). Do **not** paste tokens into git or chat logs.

Smoke:

```bash
export OPENCLAW_GATEWAY_TOKEN="<same as gateway.auth.token in openclaw.json>"
export NVIDIA_API_KEY=placeholder   # if your config references ${NVIDIA_API_KEY}
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

If **`openclaw browser … start`** errors on **Chrome CDP** (port `18800` by default) or **`running: false`** in `status`, check: only **one** gateway on **:18789**, Chrome installed at `browser.executablePath` if set, and macOS **Screen Recording / Automation** prompts for the agent browser. See gateway log under **`/tmp/openclaw/`** from the gateway banner.

### 4) Cursor (developer machine)

- Add **MCP** servers you trust (e.g. browser/Playwright) for **local** verification.
- Keep **secrets** in env / vaults — not in `.cursor` rules committed to public repos.

### 5) Nexus-triggered “thin bridge” (sketch — implement only with auth + allowlists)

When the **SyncScript app** (or Edge) needs **one** concrete automation (e.g. **screenshot staging after deploy**), prefer **a few POST actions** implemented **next to** the existing bridge discipline — **not** raw CDP on the public internet.

**Illustrative contract** (names are suggestions; align with `openclaw-bridge` security patterns):

| Endpoint | Body (JSON) | Returns |
|----------|-------------|---------|
| `POST /agent/browser/health` | `{}` | `{ ok, profile, version }` |
| `POST /agent/browser/open` | `{ "url": "https://…" }` (hostname allowlisted) | `{ ok, tabId }` |
| `POST /agent/browser/screenshot` | `{ "fullPage"?: boolean }` | `{ ok, imageBase64 \| storageUrl }` |
| `POST /agent/browser/snapshot` | `{}` | `{ ok, accessibilityTree \| domSummary }` |

**Requirements:** service auth (e.g. Supabase JWT + service role), **allowlisted hosts**, rate limits, **no** arbitrary URLs to internal IPs unless `ssrfPolicy` explicitly allows (mirror OpenClaw browser SSRF docs). Implement by **calling** local OpenClaw/browser automation on the gateway host, or a dedicated worker — same trust domain as `OPENCLAW_BASE_URL`.

---

## Incorporation checklist (short)

1. **Gateway:** `browser.enabled` + bundled **`browser` plugin** not blocked by `plugins.allow` — see [Missing browser command or tool](https://docs.openclaw.ai/tools/browser#missing-browser-command-or-tool).
2. **CLI smoke:** `openclaw browser --browser-profile openclaw status` → `start` → `open https://example.com` → `snapshot` (from official quick start).
3. **ClawHub:** `npx clawhub@latest search "…"` or **`npm i -g clawhub`** so the bundled **`clawhub` skill** can flip to **ready**.
4. **Cursor:** Add **MCP** browser for local dev if desired; keep **secrets** out of client-side prompts.
5. **SyncScript app:** Only add **thin bridge** endpoints after **threat model** (allowlisted hosts, auth, rate limits, audit log).

---

## Cursor 2026 checklist (playbook)

**Purpose:** One place to **turn on** Cursor’s Agent browser stack and avoid the usual “tools listed but agent can’t use them” drift. Official entry: [Browser | Cursor Docs](https://cursor.com/docs/agent/tools/browser). This checklist is **IDE-side**; OpenClaw gateway steps stay in **§ Operator runbook** above.

| Step | What to do |
|------|------------|
| 1 | **Cursor → Settings → Tools & MCP → Browser automation:** ensure it is **enabled** and **connected**. If the UI offers a mode, prefer **Browser tab** (matches common forum recovery steps). |
| 2 | **Use the Agent** (not only inline chat) for navigate / click / screenshot / console / network-style tools—community reports: capabilities are **Agent-oriented**. |
| 3 | **One browser stack in Cursor:** either **built-in automation** *or* a **single** extra MCP (e.g. Playwright). If automation breaks, **temporarily disable** third-party browser MCPs to rule out conflicts. |
| 4 | **When tools flake:** toggle Browser automation **off** → wait ~10s → **on** → **fully quit Cursor** (not only closing the window) → reopen → retry. |
| 5 | **npx / MCP cache:** if tools fail to spawn, try `rm -rf ~/.npm/_npx` (forum pattern), restart Cursor. |
| 6 | **Secrets:** keep tokens out of committed `.cursor` rules; use env / OS keychain for MCP and local servers. |
| 7 | **Parity with OpenClaw:** long-running or **non-IDE** automation stays on **`openclaw browser …`** + gateway config (`browser.enabled`, `plugins.allow` includes `browser`)—Cursor does **not** replace that process. |

**Expectations:** Console and network **summaries** are design goals; exact fidelity can **vary by Cursor version**. Treat regressions as **version + settings**, not “the model forgot.”

---

## References

- OpenClaw: [Browser](https://docs.openclaw.ai/tools/browser), [ClawHub](https://docs.openclaw.ai/tools/clawhub), [CLI skills](https://docs.openclaw.ai/cli/skills)
- Cursor: [Browser (Agent tools)](https://cursor.com/docs/agent/tools/browser)
- SyncScript: `integrations/ENGRAM_OPENCLAW.md`, `supabase/functions/make-server-57781ad9/openclaw-bridge.tsx`, `integrations/research/ANTIGRAVITY_VS_CURSOR.md`
- **Safe excellence / ClawHub audit process:** `integrations/research/SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md`
