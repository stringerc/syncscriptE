# SAM.gov Automated Caller — Build-Complete Product & Architecture Specification

**Codename:** `sam-gov-automated-caller`  
**Purpose:** Single source of truth for an **external** product (govcon opportunity → qualification → outreach → RFQ → pricing → approval → follow-up). Optional **SyncScript** integration at the edges only.

**Last updated:** 2026-04-16 (v3 — automation maximization addendum)  
**Document type:** Implementation specification — sections below are intentionally exhaustive so implementation does not rediscover gaps later.

**Not legal advice** — engage counsel for TCPA, government ethics, contracting fraud, and state telemarketing rules.

---

## How to use this document (definition of “spec complete”)

A build is **spec-aligned** when:

1. Every **§5 entity** exists in the database (or an explicit “deferred” list is empty).  
2. Every **§6 state machine** transition is implemented or explicitly rejected with rationale.  
3. **§7 ingestion** handles pagination, rate limits, idempotency, and failure modes.  
4. **§8–9** comms (email + optional voice) meet security and compliance checklists.  
5. **§10** human gates cannot be bypassed by API.  
6. **§11–12** observability and backup allow incident response and audit.  
7. **§13** SyncScript contract is versioned if webhooks ship.  
8. **§23–26** automation tiers, policy-as-code, and operational self-healing are implemented or explicitly deferred.

---

## 1. Executive summary

**Goal:** Automate **discover → qualify → contact → collect requirements → source suppliers → price → human approval → (assist) submission → follow-up**, with **maximum safe automation** and **minimum surprise cost**.

**Core thesis:** Automate **data motion and workflow**; use **LLMs for drafts**; use **deterministic code** for money, dates, and submission readiness; use **humans** for binding commitments and government-facing representations.

**Automation principle:** Anything **deterministic** (rules, schedules, comparisons, document assembly from approved inputs) should be **100% automated**. Anything that creates **legal exposure**, **regulatory risk**, or **binding commercial terms** stays **gated** — automation **prepares** and **queues**; humans **approve** or **click submit**. See **§23**.

---

## 2. Product boundary

### 2.1 In scope

- SAM.gov **opportunity** ingestion and ongoing sync.  
- Optional SAM.gov **contract awards** ingestion for **incumbent / competitor** research.  
- Internal **CRM/deal** pipeline with audit trail.  
- **Email-first** outbound; optional **programmatic voice** (CPaaS).  
- **Supplier RFQ** tracking (email-thread ID, structured responses).  
- **Margin / fee** math with approver sign-off.  
- **Document generation** (PDF/HTML) from templates; **checklists** for human submission.  
- **Webhooks** to SyncScript (or other systems).

### 2.2 Out of scope (unless explicitly added later)

- **Automatic** submission to **SAM.gov** or **agency** portals without a logged human action (most workflows require authenticated human attestations).  
- **Guaranteed** win rates or automated **bid decision** without human review.  
- **Scraping** SAM.gov HTML (use **published APIs** only).  
- **E-signature** binding the **government** (use agency tools).  
- Full **ERP** (NetSuite, etc.) — integrate via export only unless budgeted.

---

## 3. Stakeholders & roles (RBAC)

| Role | Capabilities |
|------|----------------|
| **Admin** | All settings, API keys, user management, delete PII export. |
| **BD user** | Create/edit deals, approve outreach within policy, run RFQs. |
| **Legal / compliance** | Approve **first-contact** templates, voice scripts, supplier terms. |
| **Read-only** | Dashboards, reports, no sends. |

**Rule:** Destructive actions (delete deal, bulk email) require **Admin** or **two-person** rule (optional flag).

---

## 4. External systems matrix

| System | Purpose | Auth | Notes |
|--------|---------|------|--------|
| **SAM.gov Get Opportunities v2** | Active opportunities | `api_key` query param | Production: `https://api.sam.gov/opportunities/v2/search`; Alpha: `https://api-alpha.sam.gov/opportunities/v2/search`. **Mandatory:** `postedFrom`, `postedTo` (MM/dd/yyyy), range ≤ 1 year. **Pagination:** `limit` max 1000, `offset`. |
| **SAM.gov Contract Awards v1** | Awards / IDV / competitor intel | `api_key` | Production: `https://api.sam.gov/contract-awards/v1/search`. **Revealed vs unrevealed:** DoD &lt;90d may be restricted per GSA; parent UEI behavior differs — read current GSA doc. **Pagination:** default 10, up to **100** via `limit`; max **400k** records per search. **Extract** mode: async file link; up to **1M** records. **Forbidden chars** in params: `& | { } ^ \` per GSA. |
| **Transactional email** | RFQ, notices | Provider API key | Prefer **Amazon SES** (often cheapest at scale) or **Resend** (simple). Requires domain **SPF + DKIM**. |
| **CPaaS voice** | Outbound calls | Account + subaccount | Twilio / Telnyx / Bandwidth — **paid** account for non-verified destinations. |
| **LLM API** (optional) | Summaries, draft emails | API key | Cache aggressively; cap tokens per opportunity. |
| **SyncScript** | Tasks / voice UX | JWT or webhook secret | See §15. |

**Free / cheapest operational defaults (philosophy):**

- **Compute:** **Oracle Cloud Always Free** ARM VM (or your existing VM) running **Docker** + **Postgres** self-managed — $0 within published caps; monitor OCPU/RAM. Alternative: **Neon/Supabase** free tiers with **cold starts / limits** understood.  
- **Scheduler:** **Cron on VM** (`curl` + bearer) or **GitHub Actions** for low-frequency jobs — avoid paid orchestration until revenue.  
- **Email:** **SES** often lowest $/email at volume; validate with current AWS pricing in your region.  
- **Files:** **Cloudflare R2** or **S3** — compare egress; store **hashes** for dedupe.  
- **LLM:** **Self-host small models** on the same VM for classification only if latency acceptable; otherwise **pay-per-token** APIs with **hard budgets**.

---

## 5. Canonical data model (minimum tables)

Implement as **Postgres** (recommended). All timestamps **UTC**.

### 5.1 `ingestion_runs`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| source | text | `opportunities_v2` \| `contract_awards_v1` |
| started_at | timestamptz | |
| finished_at | timestamptz | |
| window_from | date | Posted-from window used |
| window_to | date | Posted-to window used |
| status | text | `running` \| `success` \| `partial` \| `failed` |
| error_summary | text | Truncated |
| rows_upserted | int | |
| api_calls | int | For quota tracking |

### 5.2 `opportunities`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | Internal |
| sam_notice_id | text | Stable key if provided by API |
| solicitation_number | text | Dedupe helper |
| title | text | |
| raw_json | jsonb | **Full** API row — audit |
| posted_at | timestamptz | Normalized |
| response_deadline | timestamptz | Nullable |
| naics | text | |
| set_aside | text | |
| poc_json | jsonb | Point-of-contact array |
| description_url | text | If API returns link |
| description_fetched_at | timestamptz | |
| description_text | text | Nullable; if downloaded |
| hash_content | text | Deterministic hash of normalized fields for change detection |
| first_seen_at | timestamptz | |
| last_seen_at | timestamptz | |

**Indexes:** `(sam_notice_id)`, `(solicitation_number, posted_at)`, `(last_seen_at)`.

### 5.3 `deals`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| opportunity_id | uuid FK | |
| stage | text | See §6 |
| fit_score | numeric | 0–100 rules-based |
| owner_user_id | uuid | |
| lost_reason | text | |
| created_at | timestamptz | |

### 5.4 `approvals`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| deal_id | uuid FK | |
| approval_type | text | `first_email` \| `voice_script` \| `binding_quote` \| `gov_submission_packet` |
| status | text | `pending` \| `approved` \| `rejected` |
| approver_id | uuid | |
| payload_snapshot | jsonb | What was approved |
| decided_at | timestamptz | |

### 5.5 `comms_jobs`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| deal_id | uuid FK | |
| channel | text | `email` \| `voice` |
| state | text | See §6 |
| scheduled_at | timestamptz | |
| idempotency_key | text UNIQUE | Prevent double-send |
| provider_message_id | text | SES MessageId / Twilio CallSid |
| error | text | |
| created_at | timestamptz | |

### 5.6 `suppliers` & `rfqs`

**suppliers:** id, name, email, phone_e164, notes, created_at.  
**rfqs:** id, deal_id, supplier_id, state (`draft` → `sent` → `responded` → `closed`), thread_id or `message_ids[]`, due_at, raw_quote_json.

### 5.7 `audit_events`

| Column | Type | Notes |
|--------|------|--------|
| id | bigserial | |
| actor | text | user id or `system` |
| action | text | e.g. `deal.stage_changed` |
| entity_type | text | |
| entity_id | uuid | |
| metadata | jsonb | |
| at | timestamptz | |

**Append-only** — no updates/deletes in app code (DB permissions enforce if possible).

### 5.8 `pricing_snapshots`

deal_id, line_items jsonb, supplier_subtotal, fee_pct, fee_abs, grand_total, currency, computed_at, approved_approval_id (nullable until approved).

---

## 6. State machines (normative)

### 6.1 Deal `stage`

`new` → `qualified` → `contacted` → `requirements_draft` → `rfq_out` → `pricing` → `legal_review` → `ready_to_submit` → `submitted` → `won` | `lost`

**Allowed transitions:** Enforce in application layer + DB check constraint or enum.

**Rules:**

- `contacted` requires at least one **sent** comms_job (email or voice) **or** manual override by Admin with reason.  
- `ready_to_submit` requires **approval** record type `gov_submission_packet` **approved**.  
- `submitted` requires **human** timestamp + optional attachment URLs (proof of upload).

### 6.2 Comms job `state`

`queued` → `sending` → `sent` → `delivered?` (email) / `completed` (voice) → `failed`  
**Retries:** Max **N** (e.g. 5) with exponential backoff; then `failed` + alert.

### 6.3 RFQ `state`

See §5.6 — no orphan `sent` without `comms_jobs` link or SMTP log.

---

## 7. Ingestion specification (opportunities)

### 7.1 Sync strategy (watermark)

1. Persist **`last_successful_posted_to`** per environment.  
2. Each run: set `postedFrom` = `last_watermark - overlap_days` (e.g. **3 days overlap**) to catch late updates; `postedTo` = today.  
3. Upsert by **`sam_notice_id`** or composite `(solicitation_number, posted_at, notice id if stable)`.  
4. If API returns **totalRecords** > page size, iterate **offset** until no rows.

### 7.2 Description fetch

- If `description` is a **URL**, fetch with **API key** appended per GSA documentation; store `description_text` + `description_fetched_at`.  
- **Backoff** on 429/5xx; **do not** hammer (respect daily limits).

### 7.3 Idempotency

- `ingestion_runs` row created **before** work; mark `partial` if crash mid-run.  
- Upserts use **ON CONFLICT** on natural keys.

### 7.4 Alpha vs production

- Use **Alpha** (`api-alpha.sam.gov`) for integration tests; **rotate keys**; never load-test production.

### 7.5 Contract awards (optional module)

- Separate worker; same **API key** mechanics; mind **400k** / **1M** caps and **revealed/unrevealed** behavior.  
- Store **raw** + indexed fields for “who won NAICS X in region Y” queries.

---

## 8. Email subsystem (required before scale)

### 8.1 Domain auth

- **SPF**, **DKIM**, **DMARC** on sending domain — without these, deliverability fails.  
- **From** address matches verified domain.

### 8.2 Content

- **List-Unsubscribe** for marketing-like blasts (even B2B best practice).  
- Physical address / entity name in footer (CAN-SPAM alignment).

### 8.3 Idempotency

- `idempotency_key` = hash(deal_id + template_version + day_bucket) for recurring digests.

---

## 9. Voice subsystem (optional)

### 9.1 Account

- **Paid** CPaaS; **verified** caller ID; **geo permissions** for countries dialed.

### 9.2 Webhooks

- Validate **Twilio signature** (or provider equivalent) on status callbacks.  
- Log **CallSid**, duration, outcome — link to `comms_jobs`.

### 9.3 Script versioning

- Store **script_id + text** in `approvals` snapshot for every outbound voice template.

### 9.4 Cost controls

- Per-deal **max minutes**; global **monthly budget** hard stop in config.

---

## 10. Human approval gates (cannot bypass)

| Gate | Blocks |
|------|--------|
| First email to **new** agency domain | `comms_jobs` enqueue |
| Voice script version change | First call using new script |
| Binding quote to supplier or gov-facing total | `pricing_snapshots` freeze |
| Gov submission packet | `deal.stage` → `submitted` |

Implement: **server-side** check on API that creates comms_jobs or moves stage — UI-only hidden fields are insufficient.

---

## 11. Supplier RFQ & pricing (deterministic core)

### 11.1 RFQ email

- Template variables: deal summary, deadline, line items, reply-to tokenized address or **portal link** for structured response.  
- Track **In-Reply-To** / **thread** for status.

### 11.2 Price comparison

- Parse structured quotes (CSV upload fallback if email is messy).  
- **Outlier** detection (>2σ from median) → requires **human** flag.

### 11.3 Margin

- `grand_total = supplier_subtotal * (1 + fee_pct) + fee_abs` — version **fee_pct** in config with approver on change.

---

## 12. Documents & submission assist

- **Artifact store:** PDFs generated from approved templates; versioned S3 keys.  
- **Submission checklist:** JSON checklist per agency type (manual curation).  
- **No auto-click** through agency portals — provide **deep links + checklist** only.

---

## 13. Security & privacy

- **Secrets:** Vault or env on VM; **never** commit API keys; rotate SAM.gov key if leaked.  
- **Encryption:** TLS in transit; disk encryption at rest (cloud provider or LUKS on VM).  
- **PII:** Minimize; retention policy per jurisdiction; **export** and **delete** for GDPR-like requests if you serve EU persons.  
- **Tenant isolation:** If multi-tenant later, row-level security from day one is easier than retrofit.

---

## 14. Observability & operations

- **Structured logs** (JSON): `ingestion_run_id`, `deal_id`, `comms_job_id`.  
- **Metrics:** `api_calls_remaining` (estimated), `emails_sent`, `voice_minutes`, `llm_tokens`, `error_rate`.  
- **Alerts:** Ingestion **failed** 2x; email bounce rate spike; voice budget **80%**.  
- **Runbook:** “SAM.gov 401/403” → key rotation; “429” → backoff; “empty window” → overlap widen.

---

## 15. Backup, DR, and audit retention

- **Postgres:** nightly **pg_dump** or managed snapshots; test restore **quarterly**.  
- **RPO/RTO targets:** Document (e.g. RPO 24h, RTO 4h for MVP).  
- **Audit:** retain `audit_events` ≥ **7 years** if your counsel advises for gov-adjacent business — confirm.

---

## 16. Testing strategy (before production sends)

- **Contract tests** against **Alpha** SAM.gov with **fixture JSON** in CI (no key in logs).  
- **Dry-run** mode: comms_jobs build payload but do not call SES/Twilio.  
- **Load:** Never load-test SAM.gov production.

---

## 17. SyncScript integration contract (optional)

**Outbound webhook** (your product → SyncScript):  
`POST /api/.../webhooks/sam-deal` with HMAC signature header `X-Syncscript-Signature` and body:

```json
{
  "event": "deal.stage_changed",
  "deal_id": "uuid",
  "stage": "qualified",
  "opportunity_sam_notice_id": "string",
  "title": "string",
  "ts": "ISO-8601"
}
```

**Inbound** (SyncScript → your product): only **pre-shared secret** or **OAuth2** client credentials — document in both codebases.

**Version:** `integration_version: 1` in payload; bump on breaking changes.

---

## 18. Phased delivery (with exit criteria)

| Phase | Deliverables | Exit criteria |
|-------|----------------|----------------|
| **0** | DB schema, migrations, `ingestion_runs`, opportunities upsert, admin config for API key | One successful **production** sync (read-only) with overlap logic |
| **1** | `deals` + scoring rules + internal UI | User can qualify/discard without external send |
| **2** | SES/Resend + templates + `comms_jobs` email + approvals for first contact | Dry-run + one **manual** approval path end-to-end |
| **3** | RFQ + supplier tables + pricing snapshot | Two mock suppliers, quote compare, approval |
| **4** | Voice (optional) + budget caps | Scripted call in **staging** with Twilio test creds |
| **5** | Submission checklist artifacts | Human marks submitted with uploaded proof |

---

## 19. Open decisions (resolve before coding; defaults suggested)

| Question | Default if unsure |
|----------|-------------------|
| Multi-tenant? | **No** (single org) until second paying customer |
| LLM vendor? | Cheapest that meets quality bar; **cache** summaries |
| Host Postgres where? | **Same Oracle VM** as workers if cost-sensitive |
| Mobile app? | **No** — responsive web |

---

## 20. Glossary

- **UEI:** Unique Entity Identifier (SAM).  
- **IDV:** Indefinite Delivery Vehicle.  
- **RFQ:** Request for Quote (commercial sense).  
- **CPaaS:** Communications Platform as a Service.

---

## 21. References (primary)

- **Get Opportunities Public API v2** — [open.gsa.gov](https://open.gsa.gov/api/get-opportunities-public-api/)  
- **Contract Awards API v1** — [open.gsa.gov](https://open.gsa.gov/api/contract-awards/)  
- **SAM.gov Data Services** — [sam.gov/data-services](https://sam.gov/data-services)  
- **Twilio Voice (US)** — [twilio.com](https://www.twilio.com/en-us/voice/pricing/us)  

---

## 22. Memory hook

**File:** `integrations/research/sam-gov-automated-caller-plan.md`  
**MEMORY.md** points here under codename **`sam-gov-automated-caller`**.

---

## 23. Automation maximization (normative addendum)

This section answers: *“What else can run without a human every time?”* without weakening **§10** gates.

### 23.1 Automation tiers

| Tier | Meaning | Examples |
|------|---------|----------|
| **A — Full auto** | System runs continuously; humans only on exception alerts | Ingestion, dedupe, hash-based change detection, scoring, internal digests, retries, DLQ replay |
| **B — Auto + policy** | Automation follows versioned rules; humans edit **policy**, not each row | NAICS allowlist, keyword boosts, deadline thresholds for “urgent” flags |
| **C — Human-in-the-loop** | System proposes; human confirms once per **class** of action | First-contact to new domain, new voice script version, binding totals |
| **D — Human-only** | No steady-state automation | Portal login as your business, attestations, wet signatures |

### 23.2 Matrix — what to automate (by subsystem)

| Subsystem | Tier | Automate |
|-----------|------|----------|
| **SAM ingestion** | A | Scheduled sync, pagination, overlap watermark, 429 backoff, `ingestion_runs` lifecycle, **alert** on 2 consecutive failures |
| **Opportunity change detection** | A | Recompute `hash_content`; on change → `audit_events` + optional webhook (`opportunity.updated`) |
| **Deal creation** | B | **Auto-create** `deal` from opportunity when `fit_score ≥ threshold` *if* `automation_policies.auto_create_deal` enabled (default off) |
| **Scoring** | B | **Rules engine** (JSON/YAML in `scoring_rule_sets` table): NAICS, set-aside, $ band, keywords, geography — **versioned**; no deploy to tweak weights |
| **Internal alerts** | A | Email/Slack/webhook when: new high-fit deal, deadline &lt; N days, stage stuck &gt; M days |
| **Email send (transactional)** | C for first domain; A afterward | After **first-contact approval** for `(agency_domain)`, subsequent emails to same domain **auto-queue** within template family |
| **RFQ send** | B | Auto-send RFQ from approved template + supplier list; **pause** if bounce rate &gt; X% |
| **Quote intake** | B | **LLM or parser** extracts line items → structured JSON; if `confidence &lt; τ` → queue for human; else auto-fill `rfqs.raw_quote_json` |
| **Price compare** | A | Deterministic median/min; **flag** outliers (already in §11); auto-exclude until human clears |
| **Margin math** | A | Formula in code; **freeze** only after approval gate |
| **PDF / packet generation** | A | From approved snapshot + templates; regenerate on snapshot version bump |
| **Submission checklist** | B | Auto-check items when linked artifacts exist; **never** auto-submit |
| **Voice** | C | Script version approval; then IVR/outbound **auto** within budget caps |
| **SyncScript webhooks** | A | Emit on **every** `deal.stage` change + opportunity updates (configurable filter) |
| **Ops** | A | Nightly backup success alert; disk/RAM threshold alerts on VM |

### 23.3 What stays non-automated (unchanged from §10, reinforced)

- **Binding** quote or representation to **government** or **supplier**.  
- **First** outbound to a **new** external domain (email) or **new** script rev (voice).  
- **Portal submission** button in agency systems (human performs authenticated action).

### 23.4 Policy-as-code (avoid “change code to change rules”)

- Store **`scoring_rule_sets`** (version, JSON rules, `effective_from`).  
- Store **`automation_policies`** per org: `auto_create_deal`, `fit_threshold`, `deadline_warn_days[]`, `max_rfqs_per_deal`, `llm_confidence_threshold τ`.  
- **Audit** every policy change to `audit_events`.

### 23.5 Self-healing & safety automation

- **Comms DLQ:** After max retries, move to `comms_jobs_dead` with reason; **Admin digest** daily.  
- **Circuit breaker:** If SES bounce rate &gt; threshold in 1h → **pause** outbound comms for domain until Admin clears.  
- **Ingestion:** If window returns 0 rows unexpectedly, **widen overlap** once (config flag); log warning.  
- **Cost:** If projected LLM monthly &gt; cap → **disable** summarization for low-fit deals only.

### 23.6 CI/CD and quality automation (free where possible)

- **Migrations:** Applied in CI against ephemeral Postgres; **block** merge on failure.  
- **Contract tests:** Golden JSON fixtures for SAM response shapes (no live key in CI).  
- **Dry-run:** `COMMS_DRY_RUN=1` in staging — mandatory before first prod send.

---

## 24. Optional schema extensions (for §23)

Add when implementing automation depth (can be Phase 1b):

| Table | Purpose |
|-------|---------|
| `scoring_rule_sets` | id, version, rules jsonb, effective_from, created_by |
| `automation_policies` | org_id, key, value jsonb, updated_at |
| `comms_jobs_dead` | mirror failed terminal state + reason (or partition `comms_jobs` by state) |
| `webhook_subscriptions` | url, secret_hmac, event_filters jsonb, enabled |

---

## 25. Webhook events (automation surface)

Emit (HTTPS POST with HMAC) for:

- `opportunity.created` \| `opportunity.updated`  
- `deal.created` \| `deal.stage_changed`  
- `comms_job.sent` \| `comms_job.failed`  
- `rfq.responded` \| `pricing.snapshot_pending_approval`

Payload includes `integration_version`, `event_id` (uuid), `occurred_at` — **idempotent** on consumer side.

---

## 26. Reasoning summary (why this is “max safe” automation)

- **Facts:** SAM.gov data access is **API-key-based** and **rate-limited** — automation must include **backoff** and **quota accounting**, not naive loops.  
- **Economics:** Email + rules + document generation are **cheap to automate**; voice and LLM are **metered** — caps and tiered use (§23.5) prevent runaway cost.  
- **Law/ethics:** TCPA and misrepresentation risk concentrate on **voice** and **first contact** — **Tier C** gates stay.  
- **Engineering:** **Policy-as-code** and **webhooks** maximize automation **without** redeploying app code for every BD tweak.

---

## Appendix A — SAM.gov Opportunities API quick reference (non-normative)

Production search: `GET https://api.sam.gov/opportunities/v2/search?api_key=KEY&postedFrom=MM/dd/yyyy&postedTo=MM/dd/yyyy&limit=&offset=`  
Alpha host: `api-alpha.sam.gov`. **Date window ≤ 1 year.** `limit` max **1000**.

## Appendix B — Cost worksheet (fill at planning time)

| Line item | Monthly estimate | Source |
|-----------|------------------|--------|
| VM / DB | | Oracle / Neon pricing |
| SAM.gov | $0 | API key |
| Email | | SES/Resend calculator |
| Voice minutes | | CPaaS pricing page × minutes |
| LLM | | Token estimate × price |
| Humans (BD/legal) | | Internal |

---

*End of build-complete specification v3 (includes automation maximization addendum §23–26).*
