# watchOS — platform expectations (SyncScript)

## Hardware and OS reality

- **Apple Watch Series 3** (and older) **cannot** run current watchOS / Xcode minimums required for new App Store submissions. Treat legacy hardware as **reference only**, not a ship blocker.
- **Shipping verification** must use **Apple Watch Simulator** (watchOS version matching your deployment target) and/or **Apple Watch SE / Series 8+** on a supported watchOS.

## UX model (what Apple allows)

- Third-party apps **cannot** replace **Siri’s side button** long-press. Nexus voice on wrist is **in-app** or **Siri Shortcuts** that open the iPhone app or a Watch extension.
- **v1:** Complications, **Shortcuts**, **push notifications** with `deepLink` — fastest path.
- **v2:** Native Watch app: mic → Speech / streaming STT → **same** `GET /resources/search` and action endpoints as iPhone (thin client; no duplicate business logic).

## APIs (same as phone)

- Library search: `GET /make-server-57781ad9/resources/search?q=...` with user JWT.
- Email link to self: `POST .../resources/file/:id/email-self`
- Pin to library: `POST .../resources/file/:id/pin-to-library`

## Minimum deployment target

Set **watchOS Deployment Target** in Xcode to the **oldest watchOS** you are willing to support that still runs on your test hardware. Document that version in TestFlight notes and [`MEMORY.md`](../../MEMORY.md).

## Xcode UI tests

Add a **Watch target UI test** in Xcode for smoke flows once the Watch app target exists. Until then, use **Simulator + manual checklist** in [`VERIFY_UNIFIED_PLATFORM.md`](../../integrations/research/VERIFY_UNIFIED_PLATFORM.md).
