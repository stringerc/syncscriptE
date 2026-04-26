# SyncScript Native iOS Quickstart

This gives SyncScript a real iOS app shell while preserving one shared web codebase.

## What is included now
- Capacitor dependencies in `package.json`
- iOS native project in `ios/`
- Capacitor config in `capacitor.config.ts`
- Native bridge auto-detection via `nativeBridge` (`src/native/ios-watch-scaffold.ts`)
- Universal link + push entitlements scaffold in `ios/App/App/App.entitlements`
- URL schemes and remote notification background mode in `ios/App/App/Info.plist`
- Biometric gate for critical approvals in `src/native/biometric-gate.ts`

## Run locally
1. Build + sync web assets:
   - `npm run native:sync` (runs `python3 scripts/patch-ios-xcodeproj-native.py` after `cap sync` so **App Intents** stay registered in the Xcode project)
2. Open in Xcode:
   - `npm run native:open:ios`
3. In Xcode:
   - Choose a simulator/device
   - Run app

## Required Apple setup (must-do for real phone install + deep links + push)
1. In Apple Developer:
   - Enable **Associated Domains** for your app ID.
   - Enable **Push Notifications** for your app ID.
2. In Xcode -> Signing & Capabilities:
   - Add **Associated Domains**:
     - `applinks:syncscript.app`
     - `applinks:www.syncscript.app`
     - `webcredentials:syncscript.app`
   - Add **Push Notifications** capability.
3. Ensure `public/.well-known/apple-app-site-association` has your real team id + bundle id:
   - Replace `TEAMID.com.syncscript.app` with your actual values.
4. Configure APNs key/certificate and connect it to your push provider pipeline.

## Validate in app
- Open Mission Cockpit and create mission.
- Generate watch quick actions from Settings.
- Confirm continuity envelope persists after app restart.
- Trigger a push notification with `deepLink` and verify route restore works.
- Approve a high-risk mission step and verify biometric prompt appears.

## No-TeamID fallback mode (works now)
- If you do not have an Apple Team ID yet, use custom URL scheme deep links now:
  - `syncscript://open?path=%2Fagents%3Ftab%3Ddashboard`
- SyncScript now generates app-scheme launch links alongside web links in continuity flows.
- Notification clicks and watch quick actions use scheme-first routing with safe web fallback.
- This gives you installable app routing today; switch to full Universal Links later when your Team ID is ready.

## Personal Team install (no paid Apple Developer)
1. In Xcode, sign with your Apple ID under "Personal Team".
2. Run the app directly to your own iPhone.
3. Open SyncScript from the iPhone home screen icon (native app container).
4. In app Settings -> Phone Launch:
   - Generate QR Launcher (fast resume into current context)
   - Generate Watch Pack (paste into Siri Shortcuts on iPhone/Watch)
5. Use scheme links for continuity:
   - `syncscript://open?path=%2Fhandoff%2F...`
   - `syncscript://open?path=%2Fagents%3Fagent%3Dnexus`

## Recommended next hardening
- Add Universal Links entitlement for `syncscript.app`.
- Configure APNs credentials and push token registration.
- Handle background notification taps -> deep link route restore.
- Add biometric gate for critical mission approvals.

## Full shipping runbook

See **[`IOS_WATCH_SHIPPING.md`](./IOS_WATCH_SHIPPING.md)** for: pinned Xcode/Node versions, APNs payload contract (`deepLink`), App Intents (Swift) placement, and release verification. Watch-specific limits (e.g. Apple Watch Series 3 vs current minimums) are in **[`WATCH_OS_PLATFORM.md`](./WATCH_OS_PLATFORM.md)**.

## Xcode UI tests (template)

1. In Xcode: **File → New → Target → UI Testing Bundle** attached to the **App** target.
2. Record one test: **launch app → assert web view or root accessibility exists**.
3. Add a second test: open a **custom scheme URL** (`syncscript://open?path=%2F`) via `XCUIApplication` `launchEnvironment` / `open` — or use a **Siri Shortcut** handoff in manual QA until automated.

Store tests under `ios/App/AppUITests/` (gitignored paths may apply locally; keep sources in repo if your team commits the `ios/` tree).
