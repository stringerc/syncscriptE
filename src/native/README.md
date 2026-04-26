# SyncScript Native Scaffold

This folder defines contracts for future native iOS/watchOS shells while keeping current PWA flows stable.

## Current state
- Production continuity runs through web + mobile PWA.
- Apple Watch quick path runs through iPhone notifications + Siri Shortcuts + deep links.
- Native implementation should consume the contracts in `continuity-contracts.ts`.
- Native bridge scaffold is available in `ios-watch-scaffold.ts` for drop-in Capacitor/watch adapters.
- Capacitor iOS shell has been bootstrapped in `/ios` with `capacitor.config.ts`.
- Runtime adapter now auto-selects native bridge (`nativeBridge`) when running inside Capacitor.

## Planned native milestones
1. Wire APNs + push registration and route `deepLink` payloads into agent threads.
2. Add watch companion app for one-tap approvals and timeline glance cards.
3. Expand native continuity envelope sync for launch-time route restoration.

## Shipping docs
- **iOS + watchOS checklist:** [`IOS_WATCH_SHIPPING.md`](./IOS_WATCH_SHIPPING.md)
- **watchOS constraints (Series 3, Simulator, APIs):** [`WATCH_OS_PLATFORM.md`](./WATCH_OS_PLATFORM.md)
- **Capacitor runbook:** [`CAPACITOR_IOS_QUICKSTART.md`](./CAPACITOR_IOS_QUICKSTART.md)
- **End-to-end verification matrix:** [`../../integrations/research/VERIFY_UNIFIED_PLATFORM.md`](../../integrations/research/VERIFY_UNIFIED_PLATFORM.md)
