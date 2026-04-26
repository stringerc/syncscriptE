# Skill audit automation — policy (weekly job, no auto-ship)

## Allowed

- **Scheduled `npm run skill:source-audit`** (e.g. GitHub Actions **weekly**) to produce a **read-only report**: ClawHub search results, `inspect --files` (including `Security:` lines), and a small **official MCP registry** JSON sample.
- **Human triage** of that report: decide install vs skip vs fork vs open a tracked issue.

## Not allowed (without explicit human approval + design review)

- **Automatically installing** ClawHub skills on production OpenClaw gateways.
- **Automatically merging** skill code or MCP wrappers into **syncscript.app**, **Supabase Edge**, or **main** based on “looks good” heuristics.
- **Automatically exposing** new network tools to end users without security review.

## Why

Community registries include entries flagged **SUSPICIOUS** by ClawHub’s own checks. “Newest” ≠ “safe” or “on-brand for SyncScript.” Shipping must stay aligned with **tests**, **RLS**, **Edge auth**, and **product scope**.

## If you want more automation later

- Open a **manual** issue from the weekly artifact (copy/paste summary).
- Optional: workflow step that **comments** on a dedicated internal issue with the report hash — still **no** auto-merge.
