# SyncScript semantic design tokens

**Source of truth in code:** `src/styles/globals.css` — variables under **Semantic design tokens (legendary UI discipline)**.

## What we encoded

| Category | CSS variables | Notes |
|----------|---------------|--------|
| **Surface / color roles** | `--surface`, `--surface-elevated`, `--text-primary`, `--text-muted`, `--border-default`, `--semantic-accent`, `--semantic-danger`, `--focus-ring-color` | Map to existing shadcn-style primitives (`--background`, `--card`, etc.) so **roles** stay stable if hex values change. |
| **Space** | `--space-0` … `--space-12` | **4px rhythm** (0.25rem base). Prefer these over arbitrary `13px`. |
| **Elevation** | `--elev-0` … `--elev-3` | Limited shadow **ladder**; `.dark` uses stronger shadows for depth. |
| **Motion** | `--ease-standard`, `--ease-emphasized`, `--duration-instant` … `--duration-slow` | Short, purposeful; pair with existing **`prefers-reduced-motion`** rules in the same file. |
| **Z-index** | `--z-base` … `--z-tooltip`, `--z-skip-link` | Named stack — use instead of magic `99999`. |

Tailwind `@theme` exposes **`--color-surface`** and **`--color-surface-elevated`** for utilities like `bg-surface`.

## v0.dev workflow (recap)

1. Generate UI in **[v0.dev](https://v0.dev)** (browser; Vercel account / pricing is yours).
2. Paste or export into the repo.
3. **Replace** hard-coded colors/spacing with **tokens above** + existing `--primary`, `rounded-lg`, etc.
4. Run **a11y** + **03/04** checks on marketing surfaces.

## Migration tip

New components should use **`bg-surface`**, **`bg-surface-elevated`**, **`p-[length:var(--space-4)]`** or Tailwind spacing that matches the scale — gradually retire one-off values during edits.
