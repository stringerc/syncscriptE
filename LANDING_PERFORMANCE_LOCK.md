# Landing Performance Lock (Phase 5)

This document locks the landing page quality bar reached in Phase 5 and defines the non-negotiable checks before any future landing changes ship.

## 1) Before/After Metrics Table

### Lighthouse progression across phases

| Phase | Source artifact | Render mode status | Performance | Accessibility | Best Practices | SEO | FCP (ms) | LCP (ms) | CLS |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline (pre-SSR work) | `reports/lighthouse-landing.report.json` | CSR shell (hydration-heavy) | 48 | 86 | 100 | 100 | 4337.4 | 5010.6 | 0.358507 |
| Baseline desktop pass | `reports/lighthouse-landing-desktop.report.json` | CSR shell (hydration-heavy) | 81 | 94 | 100 | 100 | 823.7 | 980.9 | 0.182973 |
| After SSR/prerender + perf fixes v1 | `reports/lighthouse-final.report.json` | Prerendered HTML (marketing copy in built HTML) | 90 | 94 | 100 | 100 | 780.5 | 820.5 | 0.182973 |
| Phase 5 locked state | `reports/lighthouse-final-v2` | Prerendered HTML + overlay suppression + CLS lock | **97** | **100** | **100** | **100** | **636.6** | **636.6** | **0** |

### SSR status progression

| Check | Before | After |
|---|---|---|
| Built HTML contains marketing copy in `build/index.html` | No (CSR shell dominated output) | Yes (full hero + sections present pre-hydration) |
| Route rendering strategy for `/` | Client-rendered shell | Prerendered route with deterministic snapshot event |

### Gemini QA progression (by check)

| Gemini check | Early QA (from session logs) | Current QA (`gemini-qa-report.md`) | Trend |
|---|---:|---:|---|
| 1. Core copy in raw built HTML | 1/10 | 10/10 | Fixed by prerender correctness |
| 2. No banned words in H1/H2/H3 | 10/10 | 10/10 | Stable |
| 3. Exactly one primary CTA | 4/10 | 9/10 | Improved; hierarchy tightened |
| 4. JSON-LD SoftwareApplication present | 10/10 | 10/10 | Stable |
| 5. you/your ratio >= 3:1 | 10/10 | 10/10 | Stable |
| 6. H1 <= 8 words | 10/10 | 10/10 | Stable |
| 7. Meta description quality + keyword | 9/10 | 6/10 | Needs copy tightening (quality, not presence) |
| 8. OG image tag points to valid asset | 2/10 | 9/10 | Improved |

---

## 2) What Was Changed and Why

### Core files changed

1. `src/components/pages/LandingPageElite.tsx`
   - **What changed**
     - Added deterministic prerender-ready event dispatch (`syncscript-landing-ready`).
     - Tightened hero CTA hierarchy to one dominant above-the-fold primary action.
     - Removed animation wrappers that injected inline transform/opacity artifacts into prerender snapshot.
     - Added `content-visibility` + `contain-intrinsic-size` on below-fold sections.
   - **Why it improved metrics**
     - Ensured complete prerender capture (fixed raw HTML content visibility).
     - Reduced CTA competition in the hero (conversion clarity).
     - Lowered snapshot noise and avoided style churn.
     - Improved speed-index and rendering efficiency by deferring below-fold paint work.

2. `src/App.tsx`
   - **What changed**
     - Added prerender/runtime guards for global overlays.
     - Introduced route-aware suppression of cookie banner, PWA install banner, and toaster on `/`.
     - Replaced static toaster usage with client-loaded `ClientToaster`.
     - Ensured suspense fallback does not pollute prerender snapshots.
   - **Why it improved metrics**
     - Eliminated overlay-induced LCP/CLS regressions.
     - Prevented non-essential global UI from becoming largest paint candidates.
     - Removed injected toaster CSS behavior from critical landing path.

3. `vite.config.ts`
   - **What changed**
     - Configured `vite-plugin-prerender` for `/` with event-driven rendering.
     - Added injected prerender flag and reliable Chromium launch settings.
     - Added `postProcess` sanitization for rendered HTML to remove injected sonner style block from prerender output.
   - **Why it improved metrics**
     - Converted landing from shell-style CSR output to crawlable prerendered HTML.
     - Made prerender stable in CI/local.
     - Removed non-critical style payload from prerendered HTML.

4. `index.html`
   - **What changed**
     - Metadata improvements, JSON-LD schema, OG/Twitter updates.
     - Font loading optimizations and script loading improvements.
   - **Why it improved metrics**
     - Better SEO/crawlability and improved render path behavior.

### What failed first (and why)

1. **First prerender pass still looked like CSR shell**
   - **Why it failed:** Snapshot timing occurred before complete route content was ready.
   - **Fix:** Event-driven snapshot trigger from landing page (`syncscript-landing-ready`).

2. **Overlay suppression in prerender only was not enough**
   - **Why it failed:** Lighthouse measures runtime behavior; cookie/PWA/toaster on real route still affected LCP/CLS.
   - **Fix:** Route-level suppression for `/` in `src/App.tsx`.

3. **Removing toaster component alone did not remove toaster CSS from prerender**
   - **Why it failed:** CSS injection side effects persisted in final HTML.
   - **Fix:** `postProcess` cleanup in `vite.config.ts` and client-only toaster behavior.

4. **Desktop score improved to low 90s but not lock-level**
   - **Why it failed:** Remaining visual completion overhead and below-fold work.
   - **Fix:** `content-visibility` / intrinsic size constraints to keep first paint path lean.

---

## 3) Regression Lock Checklist

Run from repo root: `/Users/Apple/syncscript`.

1. `- [ ] Performance >= 95`
   - `npx lighthouse http://localhost:4175 --preset=desktop --output=json --output-path=reports/lighthouse-lock && python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));print(round(d['categories']['performance']['score']*100));assert round(d['categories']['performance']['score']*100) >= 95"`
2. `- [ ] Accessibility = 100`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));print(round(d['categories']['accessibility']['score']*100));assert round(d['categories']['accessibility']['score']*100) == 100"`
3. `- [ ] Best Practices = 100`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));print(round(d['categories']['best-practices']['score']*100));assert round(d['categories']['best-practices']['score']*100) == 100"`
4. `- [ ] SEO = 100`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));print(round(d['categories']['seo']['score']*100));assert round(d['categories']['seo']['score']*100) == 100"`
5. `- [ ] FCP <= 800ms`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));v=d['audits']['first-contentful-paint']['numericValue'];print(v);assert v <= 800"`
6. `- [ ] LCP <= 800ms`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));v=d['audits']['largest-contentful-paint']['numericValue'];print(v);assert v <= 800"`
7. `- [ ] CLS = 0`
   - `python3 -c "import json;d=json.load(open('reports/lighthouse-lock'));v=d['audits']['cumulative-layout-shift']['numericValue'];print(v);assert v == 0"`
8. `- [ ] build/index.html contains H1 text`
   - `rg "Plan Work When You're Sharp" build/index.html`
9. `- [ ] build/index.html contains JSON-LD schema`
   - `rg "\"@type\"\\s*:\\s*\"SoftwareApplication\"" build/index.html`
10. `- [ ] build/index.html contains meta description`
    - `rg "<meta name=\"description\"" build/index.html`
11. `- [ ] No banned words in H1/H2/H3`
    - `python3 -c "import re,sys;h=open('build/index.html').read();heads=' '.join(re.findall(r'<h[1-3][^>]*>(.*?)</h[1-3]>',h,re.I|re.S));txt=re.sub('<[^<]+?>',' ',heads).lower();bad=['seamless','powerful','intuitive','robust','leverage','unlock','supercharge','next-level','game-changer','ai-powered','revolutionize'];hit=[w for w in bad if w in txt];print('hits=',hit);assert not hit"`
12. `- [ ] Nexus files untouched`
    - `test -z "$(git diff --name-only -- src/contexts/useNexusVoiceCall.ts src/contexts/AIContext.tsx src/DashboardApp.tsx)" && echo "PASS" || (echo "FAIL"; git diff --name-only -- src/contexts/useNexusVoiceCall.ts src/contexts/AIContext.tsx src/DashboardApp.tsx; exit 1)`
13. `- [ ] energy-system.ts untouched`
    - `test -z "$(git diff --name-only -- src/utils/energy-system.ts)" && echo "PASS" || (echo "FAIL"; git diff --name-only -- src/utils/energy-system.ts; exit 1)`

---

## 4) Protected Files List (Exact 7)

These files require explicit approval before any modification:

1. `src/native/capacitor-adapter.ts`
   - Native runtime bridge; changes can break mobile boot/runtime parity.
2. `src/contexts/ContinuityContext.tsx`
   - Cross-session continuity state; high blast radius for app behavior.
3. `src/DashboardApp.tsx`
   - Authenticated app shell/router; landing work must not regress product routes.
4. `src/contexts/AIContext.tsx`
   - Core AI orchestration context; changes can alter app-wide AI behaviors.
5. `src/contexts/useNexusVoiceCall.ts`
   - Voice-call control logic; sensitive to state/stream lifecycle bugs.
6. `src/utils/energy-system.ts`
   - Core differentiation logic for energy-aware scheduling.
7. `src/hooks/useEnergyPrediction.ts`
   - Prediction pipeline feeding energy behaviors; high product correctness risk.

---

## 5) What Remains for Top 0.01% Conversion

1. **Real testimonials**
   - **Format:** Full name, role, company/type, measurable outcome, optional headshot.
   - **Placement:** One in hero-adjacent trust strip, two in social proof section.
   - **Copy rule:** Every testimonial must include a concrete time/value outcome.

2. **Interactive energy demo widget (next session spec)**
   - **Goal:** 45 to 60 second first-wow experience without signup.
   - **Spec:** Three-step guided demo with energy selector, task input, instant reorder, confidence explanation, and optional one-click export to signup.
   - **Instrumentation:** Track `demo_started`, `demo_completed`, `cta_clicked_after_demo`.

3. **Concrete metric in hero copy**
   - **Data to collect:** Median planning time reduction, completion lift for top 3 tasks, and week-1 retention after first energy-plan run.
   - **Hero insertion:** Replace generic support copy with one quantified statement once n is statistically credible.

---

## 6) Next Session Quick-Start

Paste this as the first message in a fresh session:

`Read LANDING_PERFORMANCE_LOCK.md. We are continuing from Phase 5 complete. Scores are locked at Performance 97, Accessibility 100, Best Practices 100, SEO 100. Today's task is conversion proof pack: real testimonials + interactive demo instrumentation + hero metric insertion.`

---

## Path Lock

This lock file is canonical and stored at:

`/Users/Apple/syncscript/LANDING_PERFORMANCE_LOCK.md`
