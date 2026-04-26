# Agent skills + MCP — extended discovery catalog (read-only bias)

**Purpose:** Surfaces **beyond** ClawHub + VoltAgent awesome lists — for **manual** review or **`scripts/skill-source-audit.sh`**. Nothing here **auto-installs**; use **`clawhub inspect`** / vendor docs before enabling tools on a gateway.

**Safety:** Community registries carry **supply-chain risk**. Treat every entry like a new npm dependency with **network access**.

---

## A) OpenClaw / ClawHub ecosystem

| Surface | URL / command | Notes |
|---------|----------------|--------|
| **ClawHub** | [clawhub.ai](https://clawhub.ai/), `clawhub search`, `clawhub inspect`, `clawhub explore` | Primary OpenClaw skill/plugin registry. |
| **OpenClaw docs** | [docs.openclaw.ai](https://docs.openclaw.ai) | Browser plugin, gateway, skills CLI. |
| **VoltAgent — awesome-openclaw-skills** | [github.com/VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) | Categorized index. |
| **Sundial fork** | [github.com/sundial-org/awesome-openclaw-skills](https://github.com/sundial-org/awesome-openclaw-skills) | Alternate curated list — **diff** against VoltAgent if both claim “top”. |
| **VoltAgent — awesome-agent-skills** | [github.com/VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | Cross-tool (Cursor, Claude Code, Gemini CLI, …). |

---

## B) Model Context Protocol (MCP) — tools for Cursor / IDEs

MCP is **not** the same format as ClawHub skills, but it is how **Cursor** often gets “more capabilities”. Discover, then **pin** server versions and **limit** env/secrets.

| Surface | URL | Notes |
|---------|-----|--------|
| **Official MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | Machine-readable; script samples first page via HTTPS. |
| **MCP spec** | [modelcontextprotocol.io](https://modelcontextprotocol.io/) | Protocol reference. |
| **Smithery** | [smithery.ai](https://smithery.ai/) | Large MCP marketplace — **vet** publishers. |
| **Glama** | [glama.ai/mcp/servers](https://glama.ai/mcp/servers) | Directory + previews (verify claims). |
| **PulseMCP** | [pulsemcp.com](https://pulsemcp.com) | Curated-style listings. |
| **MCP.so** | [mcp.so](https://mcp.so) | Community submissions — higher noise. |
| **mcp.directory** | [mcp.directory](https://mcp.directory) | IDE-oriented listings. |
| **mcpservers.org** | [mcpservers.org](https://mcpservers.org) | GitHub-oriented index. |
| **Automation Switch meta-index** | [automationswitch.com/ai-workflows/where-to-find-mcp-servers-2026](https://automationswitch.com/ai-workflows/where-to-find-mcp-servers-2026) | Roundup of directories (secondary source). |

---

## C) “Skills” naming (non–OpenClaw)

| Surface | URL | Notes |
|---------|-----|--------|
| **Skills.sh** | [skills.sh](https://skills.sh) | Referenced in ecosystem articles — **verify** alignment with your stack before use. |
| **Anthropic — Agent Skills** | [anthropic.com](https://www.anthropic.com) product/docs | Different packaging from ClawHub; follow Anthropic’s install path for Claude apps. |

---

## D) Claude Mythos (context — not something this repo “beats”)

**Claude Mythos Preview** is an **Anthropic research / preview model** (see Anthropic’s [system card](https://www.anthropic.com/claude-mythos-preview-system-card) and related announcements). It is a **frontier-model** capability line, not a skill marketplace. This repo’s leverage is **engineering**: tests, bridges, MCP choices, and **inspect-before-install** discipline — orthogonal to whether a lab model exists.

---

## E) Automation in this repo

- **`scripts/skill-source-audit.sh`** — re-runnable **read-only** audit (ClawHub search + optional `inspect`, optional MCP registry sample). Output under **`reports/skill-audit/`** (gitignored).

See also: **`SYNCSCRIPT_OPENCLAW_EXCELLENCE_FRAMEWORK.md`**, **`.cursor/rules/12-openclaw-clawhub-cursor-local.mdc`**.
