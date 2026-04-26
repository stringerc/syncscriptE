# Nexus Concierge Playbooks — Build-Complete Specification (SyncScript)

**Codename:** `nexus-concierge-playbooks`  
**Purpose:** Trust-first **playbooks** (Scripts tab / automation) that extend Nexus from **subscriber-facing** productivity into **bounded third-party actions** (venue calls, distributor RFQs, confirmations) with **audit**, **gates**, and **honest status** — without claiming OpenTable/GDS magic.

**Last updated:** 2026-04-16  
**Document type:** Implementation specification — exhaustive so design is not rediscovered in fragments.

**Not legal advice** — counsel for TCPA, call recording, commercial representation, and state laws.

**Relationship to code today:** Nexus tools (`api/_lib/nexus-tools.ts`) cover **create_task**, **add_note**, **propose_calendar_hold**, **create_document**, **send_invoice**, **send_document_for_signature**. **Third-party** outbound call + **inbound confirmation email** loop is **specified here**; **runtime wiring** ships in phased PRs per **§18**.

---

## How to use this document (definition of “spec complete”)

A build is **spec-aligned** when:

1. **§5–6** entities exist in the database (or deferred list is empty).  
2. **§7** playbook DAG + step states are enforced in the worker.  
3. **§8** human gates cannot be bypassed by API or LLM.  
4. **§9–10** third-party voice + email ingestion meet security checklists.  
5. **§11** observability + DLQ + audit support incident and dispute review.  
6. **§12** SyncScript integration contract is versioned.  
7. **Appendix C** implementation checklist has every row completed or **WONTFIX** with rationale.

---

## 1. Executive summary

**Goal:** Let users run **repeatable scripts** (weddings, venues, distributors) from anywhere they use SyncScript: **capture intent** → **execute approved steps** → **wait for evidence** (email, human) → **notify** → **update calendar/tasks** — with **no false “confirmed”** without **evidence** or **human ack**.

**Trust thesis (competitive moat vs opaque “AI booked it”):**

- **Verifiable evidence** in-app (email snippet hash, CallSid, template version).  
- **Tiered autonomy** — default conservative; power users opt into more automation.  
- **Graceful degradation** — venue says “Resy only” → scripted branch, task for human.  
- **Audit trail** — dispute-ready.

**What we do *not* claim:** Relationships and leverage of **human** concierge desks at Fortune-500 card programs; we compete on **transparency**, **playbooks**, **price**, and **integration** with SyncScript workflows.

---

## 2. Product boundary

### 2.1 In scope

- **Playbook definition** (YAML/JSON): steps, inputs, outputs, gates.  
- **Runs** with correlation ids across **email + voice + tasks**.  
- **Third-party outbound call** (CPaaS) using **approved TwiML templates** + disclosure.  
- **Third-party outbound email** (RFQ, venue inquiry) via transactional provider.  
- **Inbound email** matching (webhook/IMAP) + **structured extraction** (regex + LLM schema).  
- **Notifications** (in-app, push, email) — reuse existing channels where present.  
- **Integration** with existing Nexus tools for **subscriber** state (tasks, calendar holds, docs).

### 2.2 Out of scope (v1)

- **Guaranteed** reservation without venue cooperation.  
- **Auto-login** to Resy/OpenTable/OTA (brittle, ToS).  
- **Full duplex** “negotiate like a human” voice without **Phase** rollout (§18).  
- Merging **unrelated** third-party PII into protected Nexus contexts without DPA — see workspace rules.

---

## 3. Autonomy tiers (normative)

| Tier | Meaning | Example |
|------|---------|---------|
| **T0 — Notify only** | System creates tasks/reminders; user acts | “Remind me to call Carbone” |
| **T1 — Draft** | create_document + queue for user send | RFQ draft |
| **T2 — Send email** | After **template + domain** approval | Distributor RFQ |
| **T3 — Outbound voice (scripted)** | TwiML read + Gather; **recording disclosure** | Venue inquiry |
| **T4 — Auto-confirm** | Only if **parser confidence ≥ τ** *or* **human** ack in inbox | “Confirmed” badge |

**Default for new orgs:** T2 max until **trust metrics** justify T3/T4.

---

## 4. Canonical data model (Postgres)

### 4.1 `playbook_definitions`

| Column | Notes |
|--------|--------|
| id | uuid PK |
| slug | unique text |
| name | text |
| version | int |
| definition | jsonb — DAG of steps (see §7) |
| max_tier | int 0–4 |
| created_by | user id |
| created_at | timestamptz |

### 4.2 `playbook_runs`

| Column | Notes |
|--------|--------|
| id | uuid PK |
| playbook_id | FK |
| user_id | owner |
| status | `running` \| `waiting` \| `completed` \| `failed` \| `cancelled` |
| correlation_id | text UNIQUE — email Reply-To token, subject tag |
| current_step_id | text |
| context | jsonb — filled inputs |
| created_at | timestamptz |
| updated_at | timestamptz |

### 4.3 `playbook_steps` (materialized rows per run, optional)

step_id, run_id, state, started_at, finished_at, error, evidence_ref.

### 4.4 `third_party_calls`

| Column | Notes |
|--------|--------|
| id | uuid PK |
| run_id | FK |
| to_e164 | |
| twilio_call_sid | |
| template_id | versioned |
| template_snapshot | jsonb |
| status | `queued` \| `ringing` \| `completed` \| `failed` |
| recording_url | nullable; policy |
| duration_sec | |

### 4.5 `email_expectations`

| Column | Notes |
|--------|--------|
| id | uuid PK |
| run_id | FK |
| match_mode | `subject_token` \| `reply_to` \| `header` |
| pattern | text |
| timeout_at | timestamptz |
| status | `open` \| `matched` \| `expired` |

### 4.6 `confirmation_evidence`

| Column | Notes |
|--------|--------|
| id | uuid PK |
| run_id | FK |
| source | `email` \| `human` |
| raw_hash | sha256 of raw body |
| extracted | jsonb — schema: venue, datetime, party_size, confidence |
| created_at | timestamptz |

### 4.7 `audit_events` (append-only)

Reuse pattern from gov spec: actor, action, entity, metadata, at.

---

## 5. Playbook DAG schema (normative JSON shape)

```json
{
  "version": 1,
  "inputs": [
    { "id": "venue_phone", "type": "e164", "required": true },
    { "id": "party_size", "type": "int", "required": true },
    { "id": "when_iso", "type": "datetime", "required": true }
  ],
  "steps": [
    { "id": "s1", "type": "nexus_tool", "tool": "create_task", "map": { "title": "Call venue for reservation" } },
    { "id": "s2", "type": "third_party_call", "template_id": "venue_reservation_v1", "requires_tier": 3 },
    { "id": "s3", "type": "wait_email", "expectation_id": "e1", "timeout_hours": 72 },
    { "id": "s4", "type": "notify_user", "channel": "push", "if": "evidence.confidence >= 0.85" },
    { "id": "s5", "type": "nexus_tool", "tool": "propose_calendar_hold", "if": "evidence.confidence >= 0.85" }
  ],
  "on_failure": { "type": "create_task", "title": "Playbook needs human — venue booking" }
}
```

**Worker** validates DAG acyclic, step types registered, tier ≤ playbook max_tier.

---

## 6. State machines

### 6.1 `playbook_runs.status`

- `running` → `waiting` (on wait_email / external) → `completed` | `failed` | `cancelled`  
- **Timeout:** `waiting` + email_expectation expired → branch `on_failure` or `failed`.

### 6.2 Third-party call

`queued` → `initiated` → `completed` | `failed` (map Twilio terminal states).

---

## 7. Nexus tool extensions (future PRs — schemas only here)

New tools **must** be allowlisted in `NEXUS_TOOL_DEFINITIONS` **and** implemented in `nexus-actions-executor` **or** invoked only from **worker** (recommended: worker for long I/O; Nexus enqueues).

**Recommended split:**

- **Nexus (chat):** `enqueue_playbook`, `get_playbook_status` — short, idempotent.  
- **Worker:** executes `third_party_call`, `wait_email`, heavy lifting.

This avoids serverless timeouts and keeps **subscriber** Nexus responsive.

| Tool name | Args | Behavior |
|-----------|------|----------|
| `enqueue_playbook` | slug, inputs json | Creates `playbook_runs`, returns run_id |
| `cancel_playbook_run` | run_id | User cancel |

**Do not** expose raw “dial arbitrary number” to LLM without **template** + **rate limits**.

---

## 8. Human gates (cannot bypass)

| Gate | Blocks |
|------|--------|
| First **third_party_call** template per org | Legal review approval record |
| First email to **new** external domain | Template approval |
| Tier T4 auto-confirm | Parser calibration + Admin enables |

Server-side enforcement on enqueue APIs.

---

## 9. Voice (third party)

### 9.1 Isolation

- **Separate Twilio subaccount** or **Messaging Service** from **subscriber** Nexus phone — different **trust** and **billing**.

### 9.2 TwiML

- **Phase 1:** `<Say>` + `<Gather>` DTMF or limited speech; **short**.  
- **Disclosure:** “This is an automated call on behalf of [Client Name], arranged through SyncScript. To reach a human, press 0.”  
- **Recording:** Jurisdiction-dependent — default **off** until counsel approves.

### 9.3 Limits

- Max duration, max calls/day/org, quiet hours (timezone aware).

---

## 10. Email loop

### 10.1 Outbound

- **From** verified domain; SPF/DKIM/DMARC.  
- **Reply-To** or **plus-address** embedding `correlation_id`.

### 10.2 Inbound

- SES inbound / Gmail webhook / Microsoft Graph — **one** primary integration per deployment doc.  
- **Parse:** Extract JSON schema `{ venue, datetime_iso, party_size, confidence }`; **confidence < τ** → **Review queue**, not “confirmed”.

### 10.3 Idempotency

- Dedupe by **Message-Id** header.

---

## 11. Observability

- Metrics: `playbook_runs_total`, `step_failures`, `email_parse_confidence_histogram`, `tp_call_duration`.  
- Alerts: spike in failures, **zero** confirmations after N calls (quality regression).

---

## 12. SyncScript integration

- **Deep link:** `/scripts/playbooks/:runId`  
- **Webhook (optional):** `playbook.completed` to external systems with HMAC.  
- **Existing tools:** Playbook steps may call **create_task**, **propose_calendar_hold**, **create_document** via **internal** executor with **service** principal — same user_id as run owner.

---

## 13. Security

- **Secrets:** Twilio subaccount, email provider, LLM keys — env / vault.  
- **RLS:** `playbook_runs.user_id` = auth.uid() pattern if Supabase.  
- **No** logging full email bodies in production logs — **hash** + **extracted** only.

---

## 14. Failure modes (first-class)

| Failure | System response |
|---------|-------------------|
| Venue hangs up | Step failed → on_failure task |
| “Use Resy only” | Regex/LLM branch → user task + link |
| No email in 72h | Timeout → notify + task |
| Parser low confidence | Review queue |
| Twilio errors | Retry with backoff; DLQ |

---

## 15. Phased delivery (ship order)

| Phase | Deliverable | Exit |
|-------|-------------|------|
| **P0** | This spec + DB migrations + `playbook_definitions` CRUD (admin) | Migrations apply |
| **P1** | Worker skeleton + `enqueue_playbook` + T0/T1 only (task + doc) | E2E dry run |
| **P2** | Outbound email + expectations + inbound parse (T2) | RFQ happy path |
| **P3** | Third-party TwiML calls (T3) | Staging venue test number |
| **P4** | T4 + confidence tuning + review UI | Production pilot |

---

## 16. Cost notes

- **Twilio:** usage-based; **third-party** calls same meter as other PSTN.  
- **Email:** cheaper than voice; prefer **email-first** playbooks.  
- **LLM extraction:** cap tokens; cache by `raw_hash`.

---

## 17. References

- Twilio Programmable Voice — [twilio.com/docs/voice](https://www.twilio.com/docs/voice)  
- Existing Nexus tools — `api/_lib/nexus-tools.ts`  
- Phone helpers — `api/phone/_helpers.ts`  

---

## Appendix A — Example correlation_id format

`pb_{run_id_short}_{random8}` — embed in Subject: `[SyncScript pb_abc12_x7k9]` for matching.

## Appendix B — Parser JSON schema (illustrative)

```json
{
  "type": "object",
  "properties": {
    "venue_name": { "type": "string" },
    "reservation_time_iso": { "type": "string", "format": "date-time" },
    "party_size": { "type": "integer" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  },
  "required": ["confidence"]
}
```

## Appendix C — Implementation checklist (every row must be ✓ or WONTFIX)

- [ ] DB migrations for §4 tables  
- [ ] RLS / auth on playbook APIs  
- [ ] Worker process (VM, Edge, or queue consumer)  
- [ ] Playbook JSON validator  
- [ ] Twilio subaccount + TwiML templates for T3  
- [ ] Inbound email route + parser  
- [ ] Review UI for low-confidence  
- [ ] Metrics + alerts  
- [ ] Legal copy for disclosure templates  
- [ ] Contract tests (fixtures)  
- [ ] Documentation in app (Scripts tab)  

---

*End of specification v1.*
