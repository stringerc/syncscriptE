# Idle CPU / main-thread profiling (SyncScript)

**Purpose:** Reproduce “the site slows my computer” with evidence before changing timers, rAF, or WebGL.

## Chrome DevTools (recommended)

1. Open **Chrome** → **DevTools** → **Performance**.
2. Enable **CPU: 4× slowdown** (throttling dropdown).
3. **Record ~10 s** on each surface:
   - **`/`** (marketing + orb layers)
   - **`/dashboard`** (signed-in shell)
4. Stop recording. In the **Main** thread flame:
   - Expand long tasks; look for **`requestAnimationFrame`** (rAF), **`Timer fired`** (`setInterval` / `setTimeout`), **`Function call`** into **`three`**, **`gsap`**, or **`canvas`**.
5. Repeat with the tab **backgrounded** (another window focused). rAF/canvas should **not** dominate if visibility guards are working.

## What we already hardened (repo)

- **`FloatingOrbs`**: rAF chain stops when `document.hidden`; resumes on `visibilitychange`; throttle does not schedule 60 Hz while skipping frames.
- **`HeroScene`**: rAF scheduled after frame work / throttle; hidden tab stops the chain.
- **`SharedMarketingOrb`**: skips WebGL + noise canvas when reduced-motion, Save-Data, low battery, or slow-2g/2g.
- **`UserRealtimeBus`**: tears down Supabase Realtime when tab hidden (existing).
- **`ml-position-prediction`**: removed global 30s `setInterval` (persist on `beforeunload` only).

## Rational next targets (if profiling still shows heat)

| Area | What to grep | Note |
|------|----------------|------|
| Calendar | `setInterval` under `src/components/calendar/` | Callbacks skip work when `document.hidden`. |
| Nexus voice (active call) | `NexusVoiceCallContext` | Typewriter skips ticks when hidden; duration uses **wall clock** so background throttling does not skew limit. |
| PWA install | `vite.config.ts` → `VitePWA` `workbox.globIgnores` | Large optional chunks may be excluded from **precache** (still fetched at runtime); trade offline-first vs. cache size. |
| **Continuity** | `ContinuityContext` | **Protected** in `.cursor/rules/02-protected-files-never-touch.mdc` — do not edit without explicit maintainer override; profile first, then propose a safe alternative. |

## PWA precache vs runtime CPU

Precache size mainly affects **install/update time** and **disk**, not steady-state FPS. Still worth keeping `maximumFileSizeToCacheInBytes` and `globIgnores` honest so the SW does not ship multi‑MB artifacts users never need offline.
