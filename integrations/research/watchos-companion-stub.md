# watchOS native app (optional second target)

A **standalone Watch app** (mic → Speech → your APIs) requires an **Xcode watchOS target** paired with the iOS app. That is best created with **Xcode → File → New → Target → Watch App** so signing, embedding, and lifecycle are correct.

**What you already have without a Watch binary**

- **App Intents** in `ios/App/App/SyncScriptAppShortcuts.swift` surface in **Shortcuts** on iPhone; many shortcuts **sync to Apple Watch** when “Show on Apple Watch” is enabled in the Shortcuts app.
- **Push**: `POST /make-server-57781ad9/push/register` stores the **iPhone** token; for Watch-specific pushes you would add a second token field or separate KV key in a future iteration.

**When you add the Watch target**

1. Create the target in Xcode (watchOS 10+ recommended; **Series 3 cannot run current minimums**).
2. Reuse the same **library search** contract: `GET .../resources/search?q=` with the user’s JWT (hand off token from iPhone via **WatchConnectivity** if needed).
3. Add **Speech** / **SFSpeechRecognizer** (where available) or send PCM to your STT Edge route — keep **one** search backend.

Source stub (reference only — paste into the Watch extension after Xcode creates the target):

- Prefer **SwiftUI** `App` entry, one `TextField` + “Search” button calling your Edge URL with `URLSession` and `Authorization: Bearer <token>` from WatchConnectivity.

This file intentionally does **not** ship a second `.xcodeproj` fragment in git — Xcode’s wizard stays the source of truth for provisioning.
