# Cursor MCP + Composio + Google (Drive / Docs)

**Purpose:** Canonical steps so **this IDE** can call Google tools **only** when the right MCP integration is enabled and OAuth is complete. Agents do **not** read your Drive without that path.

## 1) Cursor — enable MCP

- Open **Cursor → Settings** (or use **`cursor://settings`**).
- Go to **Features** (or equivalent) → **MCP**.
- Confirm the **Composio / Rube** (or your chosen) server is listed, enabled, and healthy. Use each server’s **docs link** from that screen if the install shape changes.

## 2) Composio — connect Google

- Log in at **`https://app.composio.dev`**.
- Open **Integrations** (or **Connected accounts** / toolkit catalog — UI label may vary).
- Add or activate **Google** (scope at least **Drive** and **Google Docs** if you want doc search/read tools the agent used for resonance bridge work).

Complete any **Authorize** / **OAuth** flow in the browser. Tokens stay with **Composio** (and the MCP bridge Cursor uses); **do not** paste refresh tokens or client secrets into chat or git.

## 3) What “authorized” means for the agent

- **You** being logged into Composio in a browser tab does **not** by itself prove the **Cursor MCP session** has tool access. The check is: **Cursor MCP** shows the server as connected, and Composio shows **Google** as **active** for that workspace/account.
- Once both are true, **Cursor Agent** can invoke Composio-exposed tools **when this chat’s MCP wiring includes them** (tool list in the MCP filesystem / server config).

### Verified once in this repo (2026-05-08)

`RUBE_SEARCH_TOOLS` reported **`googledocs`** **`has_active_connection`: true**, and **`GOOGLEDOCS_GET_DOCUMENT_PLAINTEXT`** returned metadata + full plaintext for the **Resonance Homeostasis** doc (`1jMqn2EAFuhfQqW9A-UohxsWKLP7Cs_9OnsPWqu5JfkE`). If your agent cannot reproduce that, re-check **MCP** in Cursor and **Integrations → Google** on **`https://app.composio.dev`**, then reconnect via the auth link the MCP returns.

### Rube → Composio For You (deprecation)

Composio responses may include: **Rube is deprecated** with EOL **2026-05-15** — read **`https://rube.app/deprecation`** and plan **Composio For You** MCP or CLI from **`https://composio.dev`** so Google tools keep working after cutoff.

## 4) Security habits

- Prefer **least privilege** Google scopes (only what Drive/Docs tools need).
- Treat full document bodies as **sensitive**; prefer **links + short summaries** in git (see **`RESONANCE_DOCS_CURSOR_BRIDGE.md`**).

## 5) Related repo docs

- **`integrations/research/CURSOR_IDE_EXCELLENCE_SYNCSCRIPT.md`** — MCP hygiene, pins, OpenClaw vs IDE.
- **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`** — skills vs MCP; inspect-before-install.
