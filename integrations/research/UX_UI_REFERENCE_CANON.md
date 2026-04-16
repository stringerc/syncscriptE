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

## Maintenance

When you adopt a **new kit** or **token set**, add one line to **`MEMORY.md`** dated entry (which kit, which commit applied tokens) so the next session does not re-litigate spacing from memory.
