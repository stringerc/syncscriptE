# Agent Harmony Ledger (Global Scorecard)

This is the central, evergreen intelligence repository for SyncScript. It tracks the agent's historical performance trajectory, calculates the **Universal Capability Resonance Index (CRI)**, and lists all durable skills earned across all development cycles.

---

## ⚛️ Universal Capability Resonance Index (CRI)

To prevent self-grading complacency and push capabilities to their absolute limit, the **CRI** is calculated using a **Strict Asymptotic Progression**. Getting closer to a perfect `10.0` is exponentially harder:

$$\text{CRI} = \frac{\sum (\text{OQS}_k \times \text{Complexity}_k)}{N} \times (1 - \text{Decay Rate})^{\text{Regressions}}$$

### ⚙️ Strict Asymptotic Hardening
* **Score Capped at 8.0**: Simple documentation edits, syntax fixes, or file formatting. No matter how clean, these cannot score above 8.0.
* **Score 8.0 to 9.0**: Code generation or backend features containing robust unit tests (`npm test` passes).
* **Score 9.0 to 9.5**: Multi-layered features with complete error prevention, unified database migrations, or complex state routing.
* **Score above 9.5**: Highly complex, cross-system refactorings, automated visual-fidelity E2E verification, or self-healing error recovery.
* **Penalty Decay (Decay Rate = 0.05)**: Every regression caught in production or any task requiring more than 2 repairs applies a cumulative 5% decay penalty to the global CRI.

**Current Universal CRI**: `[8.8] / 10.0`  
*Resonance Tier: Level 3 (Optimized Systems Master)*  
*Last Calculated: 2026-05-24*

---

## 📈 Historical Ascension Runs

| Date | Task ID | Description | OQS | Δ (Fidelity) | Complexity (1-3) | Durable Skill Upgraded |
|---|---|---|---|---|---|---|
| 2026-05-24 | HARMONY-01 | Build & Prerender Puppeteer Optimization | 9.3 | +0.5 | 2.5 (Medium-High) | Headless Puppeteer GPU & Timeout Hardening |
| 2026-05-24 | BRIEF-01 | Harmony Daily Briefing System Unification | 9.1 | +0.3 | 2.0 (Medium) | Multi-Key KV Schedule & Dynamic TwiML Override |

---

## 🎓 Durable Skill Upgrades (Collective Memory)

These represent the absolute high-fidelity rules the agent has taught itself and will **never violate** in subsequent sessions:

### 1. Build & Prerender Safety (Vite/React)
* **Rule**: Prerendering routes via Puppeteer locally must default to `false` unless explicitly requested (`ENABLE_PRERENDER=true`). This saves precious development cycles and stops headless browser leaks.
* **Rule**: Headless Puppeteer configurations must always be launched with `--disable-gpu` and `--disable-software-rasterizer`, and governed by a strict 30-second hard timeout.

### 2. Twilio TwiML Greeting Override
* **Rule**: Outbound scheduled briefings must inspect local KV caches (`harmony_brief:${userId}`) before playing any prompt. If a structured daily brief exists, it must be spoken naturally within the initial `<Say>` tag to achieve personalized voice intelligence.

### 3. Pre-flight Circuit Breaker
* **Rule**: Never write code or execute changes on ambiguous, incomplete requests. If the **Input Quality Score (IQS)** falls below 7.0/10, halt instantly and prompt the user to resolve context or edge-case gaps.

### 4. Never Trust Agent Claims Without Code Verification (2026-05-25)
* **Rule**: When Gemini or any weaker model says "I implemented X," do NOT trust the claim. Verify by reading actual files, running tests, and checking that code does real work — not returning hardcoded arrays or animating buttons that do nothing. The Lucid sandbox (fake rubrics), Astral gateways (static dependency arrays), Get Out Of Jail Free app (REC button is a timer not a camera), and Gistly (sentence-splitting masquerading as AI summarization) are all documented examples. This is now Section 8 (Anti-Hallucination Contract) and Section 12 (No Mock Data) in `~/universal-agent-rules/CLAUDE.md`.

### 5. English Only — All Output (2026-05-25)
* **Rule**: All output visible to the user must be in English. No exceptions. The model previously output entire explanations in Chinese/Spanish, which the user could not read or trust. This is now Section 11 of `~/universal-agent-rules/CLAUDE.md`.

### 6. Persistence Must Be Verified, Not Assumed (2026-05-25)
* **Rule**: If you save data to KV, localStorage, or any store, READ IT BACK to confirm it was actually persisted. "I called the save function" is not verification. The SyncScript SettingsPage had email credentials and rhythm toggles that were never loaded back on mount — the save call worked but the data was invisible after reload. Fixed by adding a useEffect that reads from KV on mount.

### 7. Dead Code on Arrival Is a Bug (2026-05-25)
* **Rule**: If you add an import, function, or variable that is never used, remove it immediately. Get Out Of Jail Free has 4 files of dead code (useEvidenceRecorder, EmergencyAlertService, AttestyExportService, IncidentLogScreen) — written but never wired in. If code isn't connected, it isn't implemented.
