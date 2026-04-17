# Smoke test: Nexus voice — map embed + document update

## Preconditions

- Deploy includes: `update_document` in `api/_lib/nexus-tools.ts` + handler in `nexus-actions-executor.ts`, voice UI in `VoiceConversationEngine.tsx`, map helpers in `src/utils/map-url-embed.mjs`.
- Signed-in app session with Nexus chat/voice available.

## Automated checks (local / CI)

```bash
node --test tests/map-url-embed.test.mjs tests/nexus-update-document-contract.test.mjs tests/nexus-map-csp-and-resolve-contract.test.mjs
npx tsx --test tests/nexus-document-intent.test.ts
```

Full suite: `npm test` (includes `nexus-tools-contract`, map + CSP contract, document-edit intent, and map tests).

**Deploy / CSP:** Production `vercel.json` must include `https://www.openstreetmap.org` in `Content-Security-Policy` → `frame-src` so the OSM iframe is not blank.

**Short links:** Voice UI calls `GET /api/map/resolve-map-url?url=…` for `goo.gl` / `maps.app.goo.gl` when coordinates are not in the URL string (server follows HTTPS redirects on an allowlisted host chain).

## Manual smoke (production or staging)

### A — Embedded map (coordinates in URL)

1. Open **App AI** → **Voice** (immersive orb).
2. Ask Nexus for a restaurant and insist the reply include a **full Google Maps URL** with **`@lat,lng`** in the path (example shape: `https://www.google.com/maps/@37.77,-122.41,15z`).
3. **Pass:** Artifact rail shows a **place** card with an **inline map** (OpenStreetMap iframe) and “Open in Google Maps”.
4. **Short links:** With `GET /api/map/resolve-map-url`, short links **may** produce an inline map after redirect resolution. If resolution fails, **Open in Maps** still works.

### B — Document canvas refresh (`update_document`)

1. Ask Nexus to **create** a short document (e.g. “two-paragraph memo about X”) so **`create_document`** runs and the **canvas opens**.
2. Without closing the canvas, ask aloud: “**Change the second paragraph to …**” or “**Make it one paragraph**.”
3. **Pass:** Nexus calls **`update_document`** (check network response `toolTrace` if needed); canvas **content changes** (editor remounts via key).
4. **Fail modes:** Model pastes revision **only in chat** — prompt/system should prefer `update_document`; if it persists, tighten instructions or add a follow-up nudge in product.

## Architecture audit notes (fact-based)

| Layer | Responsibility | Verified by |
|--------|----------------|-------------|
| Tool definition | `NEXUS_TOOL_DEFINITIONS` includes `update_document` | `nexus-tools-contract.test.mjs`, `nexus-update-document-contract.test.mjs` |
| Execution | Stateless OK trace with `title`, `content`, `format` | Executor string match in contract test |
| Chat UI | `AppAIPage` applies last `update_document` to `canvasDoc` + key bump | Code review / manual |
| Voice UI | `VoiceConversationEngine` merges trace into `voiceCanvasDoc`, opens canvas, key bump | Code review / manual |
| Map URL | `extractFirstMapUrl` + `parseLatLngFromMapUrl` | `map-url-embed.test.mjs` |
| Embed | OSM `export/embed.html` iframe; `frame-src` CSP on host must allow `openstreetmap.org` | Manual if iframe blank |

### Parser precedence (maps)

`parseLatLngFromMapUrl` evaluates **`@lat,lng` before `!3d` / `!4d`**. If a single URL contains both a camera `@` position and place `!3d`/`!4d` coordinates, the **`@` pair is used** for the embed. Smoke-test with URLs where the authoritative position is in **`@lat,lng`** (recommended for consistency).

## Deploy

This repository does not auto-deploy from this workspace. After merge: run your pipeline (e.g. Vercel/GitHub Actions), then execute manual smokes above on the deployed URL.
