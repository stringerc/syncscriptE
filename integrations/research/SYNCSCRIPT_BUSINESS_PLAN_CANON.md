# SyncScript business plan — research canon

**Canonical document (git):** [`../../BUSINESS_PLAN.md`](../../BUSINESS_PLAN.md) (repo root)

**In-app source of truth:** Signed-in **Enterprise → Plan** tab (`user_business_plans` via Edge `/business-plan`). Export: **Copy markdown** or `GET /business-plan/export.md` with PAT `business_plan:read`.

**Cursor:** `.cursor/rules/14-enterprise-business-plan-cursor.mdc` — read `BUSINESS_PLAN.md` before strategy/roadmap work.

## Methodology (elite bar, fact-based)

1. **Repo-grounded** — Pricing from `src/config/pricing.ts`; features from `SYNCSCRIPT_FULL_FEATURE_CATALOG.md`; positioning from `MEMORY.md`; shipped vs plan-only explicit.
2. **No invented traction** — Metrics framework + design-partner program; operator fills ARR/WAU from analytics.
3. **Market sizing** — Third-party syndicated reports cited with ranges; SAM/SOM reasoned, not hype.
4. **Competitive honesty** — Win on spine depth (energy + Nexus parity), not “we have more tabs.”
5. **Operating alignment** — Asks tie to known gaps (entitlement 5 vs 10 tasks, MiroFish deferred).

## Sections (Enterprise Plan UI)

| Key | Label |
|-----|--------|
| `problem` | Problem |
| `solution` | Solution |
| `market` | Market |
| `traction` | Traction |
| `team` | Team |
| `financials` | Financials |
| `asks` | Asks |

## Maintenance

- Update **`BUSINESS_PLAN.md`** when strategy, pricing, or verified traction changes.
- After edit: **Save in-app** or MCP `syncscript_put_business_plan` so dashboard and git stay aligned.
- Add INDEX row date when materially revised.
