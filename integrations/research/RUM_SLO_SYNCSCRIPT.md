# PostHog RUM — suggested SLOs (SyncScript)

**Purpose:** Synthetic Lighthouse gates **labcraft**; RUM is **user reality**. Review monthly; tune thresholds when product changes.

| SLO | Suggested target | PostHog / source |
|-----|-----------------|------------------|
| **LCP p75 (marketing `/`)** | ≤ 2.5 s (good), alert if > 3.5 s for 2 weeks | Web vitals in PostHog, path filtered `/` |
| **INP p75 (app logged-in or guest shell)** | ≤ 200 ms (good) | Interactions on `/dashboard`, `/app` |
| **JS error rate** | < 0.1% of sessions; spike alert vs 7d baseline | Sentry (primary) or PostHog `exception` if wired |

**Monthly ritual (15 min):** Open PostHog “Web vitals” + Sentry issue trend; if SLO breached, file one issue with **before/after** commit and top URL.

**Not in CI:** p75 is product analytics — automation would duplicate vendor dashboards; the **Lighthouse** job in `ci.yml` + **`npm run verify:post-deploy-checklist`** cover deploy truth + synthetic headroom.
