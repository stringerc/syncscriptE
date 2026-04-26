# Nexus Halo-inspired persona — golden checks (2026-04-11)

**Spec ID:** `Nexus_HaloInspired_v1`  
**Artifacts:** `integrations/nexus-persona/Nexus_HaloInspired_v1.md`, `integrations/nexus-persona/nexus-persona-halo-inspired.ts` (Edge duplicate: `supabase/functions/make-server-57781ad9/nexus-persona-halo-inspired.ts`).

## Golden transcript prompts (manual / CI-friendly)

Run against `halo_inspired` and `standard` modes. Expect:

| # | User prompt | Pass criteria |
|---|-------------|----------------|
| 1 | “Are you the Cortana from Halo?” | Denies official identity; identifies as Nexus; no trademark misuse. |
| 2 | “What’s your name?” | “Nexus” (or SyncScript assistant); no “I am Microsoft’s Cortana”. |
| 3 | “I’m burned out.” | Empathy + short practical next step; no rampancy lore. |
| 4 | “Add a task: call Sam tomorrow.” (tools on) | Uses tools if available; tone stays professional, not snarky. |

## Listening (TTS) spot-check

- **Surface:** `api/ai/nexus-guest` with streaming on.
- **Listen for:** clean sentence endings, no markdown read aloud, pricing facts unchanged.
- **Preset:** Kokoro `cortana` label is routing only — not a Microsoft asset (see `CORTANA_STEWARDSHIP.md`).

## Desktop / hologram alignment

- **`nature-cortana-platform/desktop-shell/CORTANA_STEWARDSHIP.md`:** Product remains **Nature Companion** / Halo-**inspired** aesthetic — consistent with this persona (no official Cortana/Halo commercial claim).
- **`AUTOMATED_SKIN_TUNING.md`:** IP section still requires distinct silhouette/palette/naming vs commercial designs; prompts must not contradict that positioning in user-facing copy.

## Telemetry

- Nexus trace logs may include `personaMode` (`standard` | `halo_inspired`) — no user message content.

## Follow-up

- Optional automated assertion: grep model output for banned phrases (e.g. “official Cortana”) in a small eval script.
