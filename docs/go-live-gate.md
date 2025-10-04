# 🚀 SyncScript Go-Live Gate Checklist

**CRITICAL**: Do not flip global flags until every box below is checked and verified.

## Stage 0 — Freeze and Snapshot
- [ ] **Lock scope**: No net-new features until Step 6 is live
- [ ] **Branch created**: `hardening/master-plan` branch off main
- [ ] **Branch protections**: Required checks (typecheck, unit, e2e, axe, Lighthouse, bundle budgets) enabled on main
- [ ] **Staging ≠ prod**: Confirmed separate DBs, queues, storage buckets

## Stage 1 — Pre-flight Verification (prove what Cursor shipped)

### PF1. Outbox delivery
- [ ] **Unique constraint**: `(event_id, handler_name)` or `(idempotency_key)` enforced
- [ ] **Dead-letter path**: After max retries; admin requeue works
- [ ] **Metrics present**: `outbox_pending`, `outbox_retry`, `outbox_dead`

### PF2. Energy daily reset
- [ ] **Unique constraint**: `UserEnergyDailySnapshot` unique `(user_id, local_date)` exists
- [ ] **Reset tracking**: `lastEnergyResetLocalDate` set for all users
- [ ] **Timezone handling**: Job uses user IANA timezone; DST safe
- [ ] **Read-path guard**: Snaps+resets if job missed

### PF3. Idempotency
- [ ] **Keys enforced**: On `/calendar/write`, `/scripts/apply`, `/exports/generate` with ≥24h TTL
- [ ] **Replay test**: Same key twice → single side-effect; second call returns cached result

### PF4. Module boundaries
- [ ] **ESLint enforcement**: "no cross-imports" fails build on violation
- [ ] **Domain packages**: Export contracts only; CI boundary job active

**Gate**: All PF checks green. If any fails, fix before continuing.

## Stage 2 — Close low-cost gaps (four hardening PRs)

### PR G1: Outbox backoff + dead-letter
- [ ] **Jittered exponential**: 100ms→3.2s, max attempts, dead-letter topic/event
- [ ] **Gate**: Synthetic failure moves to dead-letter; metrics increment

### PR G2: Trace IDs end-to-end
- [ ] **Request/trace ID**: Added to HTTP, events, logs. Propagate across workers
- [ ] **Gate**: Trace visible in logs for a full suggest→apply→export flow

### PR G3: Cron idempotency locks
- [ ] **Advisory DB lock**: Per job/user-batch to prevent concurrent resets
- [ ] **Gate**: Simulated double-runner executes once

### PR G4: Security headers
- [ ] **CSP**: Nonce'd, X-Frame-Options: DENY, COOP/COEP/CORP, Referrer-Policy: strict-origin-when-cross-origin
- [ ] **Gate**: Headers present on all app routes; no console CSP violations for core flows

## Step 3 — Wire "almost-done" UI bits (tiny, isolated PRs)

### PR U1: Pin button in EventModal
- [ ] **Gate**: Click → rail updates; p95 <150ms; persists reload

### PR U2: TemplateRecommendations in EventModal + event detail
- [ ] **Gate**: Appears for ≤14-day events; Apply works; idempotency prevents dupes

### PR U3: SpeechToTextInput in task/event/challenge notes
- [ ] **Gate**: Permission denied doesn't crash; transcript editable; retry OK

### PR U4: Conflict Resolver dialog → scheduling service
- [ ] **Gate**: Conflicts rendered; "Fix" commits a valid reschedule; no dupes

### PR U5: Outlook OAuth UI + Apple ICS subscribe
- [ ] **Gate**: Connect/disconnect flows complete; ICS imports in Apple/Outlook; no route 404

## Step 4 — Exports v1 (server + modal)

### PR E1: Export modal + renderers
- [ ] **Formats**: PDF Run-of-Show, PDF Briefing Pack, CSV/XLSX Tasks/Budget, ICS feeds, JSON bundle
- [ ] **Presets**: Owner/Team/Vendor/Attendee/Personal with redaction toggles
- [ ] **Gate**: `export-runbook.spec.ts` passes; ICS imports cleanly in Google/Apple/Outlook; PII redaction verified; RBAC enforced on restricted items

## Step 5 — Observability + SLO alarms

### PR O1: Dashboards + alerts
- [ ] **Metrics**: Outbox success/fail, idempotency hits, energy resets/day, export success, calendar dupes, p95 API, 5xx rate
- [ ] **SLOs**: p95 API <300ms; job failure <0.5%/day; calendar dupes = 0; export failure <1%
- [ ] **Auto-disable**: Feature flag on SLO breach (tested in staging)
- [ ] **Gate**: Synthetic failures trigger alerts and auto-disable

## Step 6 — UX/UI revamp (flagged canary)

### PR UX1: New shell + tokens + three critical screens
- [ ] **Screens**: Dashboard, Tasks, Calendar under `new_ui` flag. Keep old shell intact
- [ ] **Budgets**: LCP ≤2.5s p95, TBT ≤200ms, CLS ≤0.1, axe = 0 criticals
- [ ] **Gate**: Perf and a11y budgets pass in canary; toggle off rolls back instantly

## Step 7 — Calendar soak (parallel)

### PR CSoak: Turn Google 100% prod; Outlook/Apple at 10% behind flags for 7 days
- [ ] **Gate**: 0 dupes; conflict dialog use recorded; retries with jitter visible

## Step 8 — Friends privacy enforcement

### PR F1: Enforce global/per-friend energy/emblem visibility
- [ ] **Gate**: Pickers show accepted only; privacy toggles honored; axe = 0 criticals

## Step 9 — Template/Script Gallery wiring

### PR TGal1: Mount recommendations on New Event + Event pages
- [ ] **Gate**: Apply success ≥95% in staging cohort; no dupes across refresh

## Step 10 — ShareScript collaboration (vertical slices)

### PR S1: Invites + RBAC matrix (Owner/Admin/Editor/Contributor/Viewer)
- [ ] **Gate**: Role tests pass; negative tests enforce access

### PR S2: Assignments + shared event trees
- [ ] **Gate**: Provenance breadcrumbs render; viewers cannot edit

### PR S3: Privacy (Project vs Restricted) + audit trail
- [ ] **Gate**: Audit entries for every mutation; restricted items invisible to unauthorized

### PR S4: Provenance (created from ScriptVersion, promoted task, imported from provider)
- [ ] **Gate**: Provenance chain displays consistently

## Step 11 — Production epilogue locks

### PR P1: Infra locks
- [ ] **Secrets**: Rotated to vault; HSTS; TLS 1.2+; IPv6/AAAA; OCSP stapling

### PR P2: Database safety
- [ ] **Backups**: Nightly + 15-min PITR; restore drill on staging documented
- [ ] **Migration**: Preflight with --dry-run; rollback playbook committed

### PR P3: Security scans
- [ ] **SAST**: CodeQL/Semgrep, dependency audit, DAST on staging. Fix criticals

### PR P4: Performance budgets in CI
- [ ] **Budgets**: Per-route JS ≤180KB gz; emblem Lottie ≤80KB gz; lazy-load images

### PR P5: Privacy/legal
- [ ] **Legal**: Live Privacy Policy, Terms, data export/delete docs; cookie consent if marketing analytics

### PR P6: Runbooks
- [ ] **Runbooks**: Calendar dupes, export stuck, outbox backlog, energy reset failures, OAuth failures. Link in ops README

**Gate**: All epilogue checks green before public beta.

## Step 12 — Release protocol + 72-hour watch

### Deploy sequence
- [ ] **Staging soak**: 24h with all flags on for admin + test user
- [ ] **Canary to prod**: 5% → 20% → 100% with auto-rollback on SLO breach

### Smoke script (run on every deploy)
- [ ] **Create task** → complete → EP accrues
- [ ] **Apply script** to event twice → no duplicates
- [ ] **Export Run-of-Show PDF** (Viewer vs Owner) → redaction enforced
- [ ] **Calendar write** with simulated retry → one event only
- [ ] **Midnight simulation** → energy snapshot + reset
- [ ] **Pin event** → rail updates → persists reload

### 72-hour watch
- [ ] **Pager**: Outbox delays, export errors, calendar dupes, 5xx spikes, p95 API spikes
- [ ] **Daily check**: Energy resets ≈ active users; 0 duplicate snapshots; feedback triaged

### Flag rollout matrix (prod defaults)
- [ ] **ON**: Core planning loop, Google Calendar, Exports v1, Outbox/Events, Idempotency, Energy daily reset, Registry nav
- [ ] **Canary**: New UI shell, Outlook, Apple ICS, Friends privacy enforcement, Recommendations
- [ ] **OFF** (until validated): Any marketplace/payment, creator uploads

---

## Final Go-Live Gate

**🚨 CRITICAL**: Do not proceed to public beta until ALL boxes above are checked.

**Last Updated**: [DATE]
**Verified By**: [NAME]
**Approved By**: [NAME]

---

## Rollback Instructions

If any gate fails:
1. **Immediate**: Revert the failing PR
2. **Investigate**: Fix off the critical path
3. **Re-test**: Ensure gate passes before continuing
4. **Document**: Update this checklist with lessons learned

## Notes

- Every PR: one concern, behind a flag, with E2E covering the primary click-path, and a rollback instruction in the description
- Keep the "no cross-imports" ESLint rule mandatory; block merges on violations
- Energy is a daily meter: snapshot at local midnight, reset to 0; achievements and levels persist; UI shows 0–10 mapped from 0–100 engine
