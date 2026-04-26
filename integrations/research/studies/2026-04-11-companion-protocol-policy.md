# Nature Companion — `syncscript-companion://` policy matrix

**Purpose:** Single source of truth for **allowed actions**, **trust evaluation**, **audit events**, and **operational handling** for the Electron desktop shell (`nature-cortana-platform/desktop-shell`). Aligns with least-privilege “local agent” patterns: the web app stays sandboxed; the Companion performs **allowlisted** OS-adjacent actions only.

**Canonical URL builders:** [`src/config/public-links.ts`](../../../src/config/public-links.ts)  
**Handler implementation:** [`nature-cortana-platform/desktop-shell/src/main.cjs`](../../../nature-cortana-platform/desktop-shell/src/main.cjs) — `processCompanionProtocolUrl`

---

## Allowed protocol actions

| Action (hostname or `?action=`) | Behavior | Trust API | Audit (`emitRuntimeEvent`) |
|-----------------------------------|----------|-----------|----------------------------|
| `focus` / empty | Focus overlay | No | No (routine) |
| `hide` / `dismiss` / `minimize` | Hide window | No | No |
| `show` / `restore` | Show overlay | No | No |
| `quit` / `exit` | Quit app | No | No |
| `openweb` / `web` | `shell.openExternal(base + path)` — **default browser** | No | No |
| `openchrome` / `chromeweb` | Open **Google Chrome** (or `CORTANA_OPEN_CHROME_APP_NAME`) with same path rules as `openweb` | No (same surface as `openweb`) | Yes — `companion_chrome_opened` / `companion_chrome_failed` |
| `openagents` / `agents` | Resolve deep link, `shell.openExternal` to SyncScript | **Yes** — `authorizeDesktopAction` | Yes — `syncscript_route_opened` or `syncscript_route_blocked` |

**Path rules (openweb / openchrome):** Relative path only; must start with `/`; **blocked** if contains `..`, `//`, whitespace, or embedded `?` / `#` (query or fragment belongs in the app router, not the path param).

**Parsing:** `action` = `URL.searchParams.get('action')` **or** `URL.hostname` (case-insensitive, underscores normalized). Examples:

- `syncscript-companion://focus`
- `syncscript-companion://openweb?path=%2Fsettings`
- `syncscript-companion://?action=openChrome&path=%2Flibrary` (hostname style)

---

## Trust evaluation (`authorizeDesktopAction`)

Used when opening **agent / dashboard routes** via `openagents`, not for simple `openweb` / `openchrome`.

- **Endpoint:** `POST {platformBaseUrl}/api/trust/evaluate` (see `resolveRuntimeConfig()` in `main.cjs`).
- **Bypass:** `DESKTOP_TRUST_BYPASS=1` in dev only — **never** in production installs intended for real users.
- **Scopes:** `DESKTOP_ACTOR_SCOPES` (default includes `read.personal`, `write.desktop`).

If trust fails, the handler emits `syncscript_route_blocked` and focuses the overlay.

---

## Audit log (`runtime-reports/events.jsonl`)

- **Location:** `nature-cortana-platform/desktop-shell/runtime-reports/events.jsonl` (JSON lines).
- **Writer:** `emitRuntimeEvent(type, payload)` in `main.cjs`.
- **Retention / PII:** Treat as **local diagnostics**. Do not ship raw tokens or secrets. Rotate or truncate files on a schedule if disk growth is a concern; for support, users can attach redacted excerpts.

**Export for support:** Copy `events.jsonl` from the above path after reproducing an issue (Companion quit → file still on disk).

---

## Enterprise alignment (verifiable patterns)

- **Allowlist** of protocol actions (this doc + `main.cjs` switch).
- **Human-in-the-loop** for higher-risk routes via trust service.
- **Audit** for route opens and Chrome-specific opens.
- **No arbitrary shell** from untrusted web content — web pages cannot invoke the protocol unless the user clicks a registered link or the OS delivers a registered URL.

---

## Related

- Desktop README: [`nature-cortana-platform/desktop-shell/README.md`](../../../../nature-cortana-platform/desktop-shell/README.md)
- Stewardship / IP: [`nature-cortana-platform/desktop-shell/CORTANA_STEWARDSHIP.md`](../../../../nature-cortana-platform/desktop-shell/CORTANA_STEWARDSHIP.md)
