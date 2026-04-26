# Nexus / voice — capability manifest (contract)

**Source of truth (code):** [`src/config/nexus-tool-manifest.ts`](../../src/config/nexus-tool-manifest.ts)

Server-side agent prompts and OpenClaw tool allowlists should **deny by default** and only enable actions that map to this manifest. When adding a new tool, add a row here and in the TypeScript manifest first.

---

## Capabilities

<!-- synced from NEXUS_TOOL_MANIFEST — update the TS file, then refresh bullets here -->

- **Move inside SyncScript** — Opens sections you ask for inside the web or mobile app (tasks, calendar, library, settings).
- **Open links in your browser** — Opens HTTPS links in your default browser or new tab — same as tapping a link.
- **Search your file library** — Finds files you uploaded by name or extracted text (`GET /resources/search`).
- **Email a file link to you** — Sends a time-limited download link to your account email (`POST /resources/file/:id/email-self`).
- **Pin to your library** — Links a file to your library collection (`POST /resources/file/:id/pin-to-library`).
- **Focus desktop companion** — `syncscript-companion://focus` when Nature Companion is installed.
- **Open SyncScript in the browser** — `syncscript-companion://openweb?path=…`
- **Open SyncScript in Chrome** — `syncscript-companion://openchrome?path=…`
- **Open agent routes on the desktop** — `syncscript-companion://openagents?…` (trust + audit in Companion)

---

## Related

- Companion policy: [`studies/2026-04-11-companion-protocol-policy.md`](./studies/2026-04-11-companion-protocol-policy.md)
- Library API (Edge): [`supabase/functions/make-server-57781ad9/resources-library-routes.tsx`](../../supabase/functions/make-server-57781ad9/resources-library-routes.tsx)
