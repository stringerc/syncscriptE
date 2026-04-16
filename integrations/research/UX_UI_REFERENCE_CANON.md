# UX/UI reference canon (SyncScript)

**Purpose:** One durable list of **world-class** sources and a **Figma → code** workflow. Cursor rule **`.cursor/rules/11-ux-ui-excellence.mdc`** compresses behaviors; this file holds **links + checklist** so agents and humans do not re-research from scratch.

**Figma Community (UI kits entry — filter as needed):**  
[figma.com/community/ui-kits](https://www.figma.com/community/ui-kits?resource_type=files&editor_type=figma)

---

## How to use Figma kits without breaking the product

1. **Pick a kit** with clear **variables** (color, spacing, radius, typography) and a **component library** — prefer official **Apple** / **Material** or widely used systems (e.g. Tailwind-aligned community files).
2. **Duplicate** to your team space; **rename** tokens to your brand (avoid shipping vendor marketing copy into SyncScript UI).
3. **Export decisions, not frames:** document tokens in code (`index.css`, Tailwind theme, or CSS variables) — single source of truth lives in **git**, not only in Figma.
4. **Map 1:1** to implementation: spacing scale, radii, elevation (shadow + border), focus ring color.
5. **Accessibility pass** in code: contrast, focus, semantics, keyboard — Figma plugins help but **do not** replace browser/axe checks.
6. **Performance pass** per **04-perf-seo-gate**: images sized/lazy; fonts minimal; no new render-blocking assets on landing without justification.

---

## Reference stack (principles + patterns)

| Area | Why it matters | Starting URL |
|------|----------------|--------------|
| **Apple HIG** | Platform-native patterns, clarity, depth | [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) |
| **Material 3** | Systematic motion, shape, color roles | [Material Design 3](https://m3.material.io/) |
| **NN/g heuristics** | Usability baseline for any UI | [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) |
| **Laws of UX** | Psychology-backed design decisions | [lawsofux.com](https://lawsofux.com/) |
| **Refactoring UI** | Hierarchy, spacing, labels (tactical) | [refactoringui.com](https://www.refactoringui.com/) |
| **WCAG** | Legal/ethical baseline for accessibility | [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) |
| **web.dev a11y** | Practical web implementation | [Learn Accessibility](https://web.dev/learn/accessibility/) |
| **WAI-ARIA APG** | Composite widgets (dialogs, tabs) | [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) |

**Component primitives (this repo already leans Radix-style):** [Radix UI](https://www.radix-ui.com/primitives) — use for behavior; style to match tokens.

---

## “Other places like Figma” (curated discovery)

- **Figma Community — templates:** [Design templates](https://www.figma.com/community/design-templates) for flows and marketing layouts (still tokenize before code).
- **Mobbin** — real app patterns (inspiration; do not copy assets).
- **PageSpeed / Lighthouse** — UX is also **perceived performance**; same family as **04**.

---

## Straight talk: what “tokens” actually mean for top-tier UI

**Tokens are not magic colors.** They are **named decisions** so every screen stays consistent. A legendary system usually defines **semantic** tokens (what it *means*) mapped to **primitive** values (the actual hex/rem/ms).

| Layer | Examples | Why |
|--------|----------|-----|
| **Color — semantic** | `--color-bg-default`, `--color-bg-elevated`, `--color-text-primary`, `--color-text-muted`, `--color-border-subtle`, `--color-accent`, `--color-danger`, `--color-focus-ring` | UI references *role*, not “#3b82f6” scattered in components. |
| **Color — primitive** | Raw palette steps (neutral 50–950, brand 50–900) | Fewer arbitrary one-offs; easier dark mode (swap mappings, not every file). |
| **Space** | 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32 (×4px or ×0.25rem) | Rhythm beats “random 13px”. |
| **Radius** | `none`, `sm`, `md`, `lg`, `full` | Cards vs pills vs modals stay coherent. |
| **Typography** | Font families (sans/mono), **scale** (text-xs → text-4xl), **line-height** pairs, **font-weight** roles | Hierarchy without shouting. |
| **Elevation** | `0`–`3` levels (shadow + optional border) | Depth without muddy glass everywhere. |
| **Motion** | Durations (120/200/300ms), easing names, **respect `prefers-reduced-motion`** | Motion explains state; it does not decorate. |
| **Z-index** | Small named stack: base, sticky, dropdown, modal, toast | Stops z-index wars. |

**You do not need paid APIs for this.** Tokens live in **CSS variables** or **Tailwind theme extension** in git. Paid tools can *speed design*, but **discipline + measurement** (contrast, Lighthouse, keyboard) wins.

---

## v0.dev (Vercel) — where it fits

**[v0.dev](https://v0.dev)** is Vercel’s **generative UI** product: you describe UI in natural language; it outputs **React** components (often **Tailwind**-friendly), which you **copy into your repo** and then **normalize to your tokens**.

| Fact | Implication |
|------|-------------|
| Great for **fast exploration** and **layout iteration** | Use it to draft; still **refactor** to SyncScript tokens and **03/04** gates. |
| Not a substitute for a **design system** | Generated code can be verbose or off-brand — **review** like any PR. |
| Account | Typically tied to a **Vercel** account; check current **free tier** on Vercel’s pricing page. |
| **No special “API token” required for Cursor** to “use v0” — you use v0 in the **browser**, then paste or export into the codebase. | Don’t commit v0 account secrets; treat it like any other design tool. |

**Workflow:** v0 → rough component → **map to your semantic tokens** → **a11y pass** (labels, focus, contrast) → **perf pass** on marketing (**04**).

---

## Other “advancement” surfaces (fact-based)

| Tool / idea | What it is | Free baseline |
|-------------|------------|----------------|
| **shadcn/ui** (pattern) | Copy-in components on Radix — **you own the code** | Open source; no API key. |
| **Radix UI** | Accessible primitives | Open source. |
| **Figma** | Source for variables + components | Free tier exists; heavy teams pay. |
| **axe / Lighthouse** | Automated a11y + perf signals | Free (browser DevTools, CI can run Lighthouse). |
| **Real user metrics** | Posthog, Plausible, etc. | Some have generous free tiers; **optional**, not required to ship great UI. |

**You do not need to give Cursor API keys** for “legendary UI.” If you later want **live** contrast checks in CI or **screenshot** regression, we can wire tools — that’s optional automation, not a prerequisite.

---

## Antigravity vs Cursor-style agents (no embarrassment — different jobs)

| | **Typical Cursor coding agent** | **Products that emphasize “browser / computer use”** |
|--|--------------------------------|--------------------------------------------------------|
| **Primary surface** | Your **repo**: read/write files, terminal, tests | Often **another app**: driving UI automation, browser, OS-level actions (varies by product/version). |
| **Strength** | Refactors, contracts, git history, **consistent codebase** | Demos well for “watch it click around” **general** tasks. |
| **Limit** | Does **not** replace a dedicated **computer-use** harness for arbitrary web apps unless you add tools (Playwright, etc.) and run them **here**. | Weaker at **large-codebase** reasoning unless tightly integrated with your tree. |

**Straight talk:** use **Antigravity (or similar)** when the task is “operate this external surface like a user.” Use **Cursor + this repo** when the task is “ship SyncScript with tests, tokens, and rules.” They **complement**; “let Antigravity use Cursor” is a workflow choice, not a capability scoreboard. The durable win is **git + tokens + review**, not which IDE moved the mouse last.

---

## Maintenance

When you adopt a **new kit** or **token set**, add one line to **`MEMORY.md`** dated entry (which kit, which commit applied tokens) so the next session does not re-litigate spacing from memory.
