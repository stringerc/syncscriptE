# iOS + watchOS — shipping checklist (SyncScript)

**Companion doc:** [`README.md`](./README.md) · **Capacitor quickstart:** [`CAPACITOR_IOS_QUICKSTART.md`](./CAPACITOR_IOS_QUICKSTART.md) · **Watch constraints:** [`WATCH_OS_PLATFORM.md`](./WATCH_OS_PLATFORM.md)

## Build pipeline (repeatable)

1. **Web assets:** from repo root, `npm ci` (or `npm install`) then `npm run build` — output must land in `build/` per [`capacitor.config.ts`](../../capacitor.config.ts) `webDir: 'build'`.
2. **Sync to native:** `npm run native:sync` (runs `npx cap sync ios`).
3. **Xcode:** `npm run native:open:ios` — select scheme **App**, destination **iPhone 16 Pro** (or your device), **Release** for TestFlight-like behavior.

**Pin versions in release notes:** Xcode major.minor, CocoaPods (if used), Node LTS, Capacitor CLI from `package.json`.

## Universal Links

- Host `apple-app-site-association` at `https://www.syncscript.app/.well-known/apple-app-site-association` (and non-www if you serve both). Source in repo: [`public/.well-known/apple-app-site-association`](../../public/.well-known/apple-app-site-association).
- Replace **`TEAMID.com.syncscript.app`** with your **Apple Team ID + bundle id** before App Store submission.
- Xcode → Signing & Capabilities → **Associated Domains**: `applinks:syncscript.app`, `applinks:www.syncscript.app`.

## Custom URL scheme (fallback)

- `syncscript://open?path=...` — documented in [`CAPACITOR_IOS_QUICKSTART.md`](./CAPACITOR_IOS_QUICKSTART.md). Use when Team ID / AASA not yet wired; keep for dev and internal builds.

## Push notifications (APNs)

1. Enable **Push Notifications** capability on the App ID (Apple Developer).
2. Issue an **APNs key** (.p8) or certificates; store secrets outside git (CI env / Xcode Cloud).
3. **Capacitor Push Notifications:** register in app startup, POST device token to your backend with the user session.
4. **Payload contract:** include `deepLink` (path + query only, same-origin) so cold start / background tap restores the route. Align with [`continuity-contracts.ts`](./continuity-contracts.ts) `NATIVE_CONTINUITY_ROUTES`.

## App Intents & Siri Shortcuts (recommended)

Implement in **Swift** (AppIntents framework), not in the web bundle:

- **Open SyncScript path** — intent parameter: URL-encoded path (e.g. `/library`, `/agents?tab=tasks`).
- **Search library** — calls authenticated `GET .../resources/search?q=` (same as web).

Add an **Intents extension target** in Xcode; wire URLs to `AppDelegate` / SceneDelegate via `NSUserActivity` or `UIApplicationDelegate` `application(_:open:options:)`.

**Note:** Do not edit protected React entry files to satisfy Shortcuts; deep links should land in the Capacitor WebView with hash or path routing your SPA already understands.

## Verification (release gate)

| Step | Pass criteria |
|------|----------------|
| Fresh install | App launches, web shell loads `https://www.syncscript.app` or configured server URL |
| Universal link | Tap link in Notes/Mail opens app to correct path |
| Push | Token registered; test push with `deepLink` opens route |
| Offline | Graceful error; no white screen crash |

See repo root [`integrations/research/VERIFY_UNIFIED_PLATFORM.md`](../../integrations/research/VERIFY_UNIFIED_PLATFORM.md) for cross-surface matrix.
