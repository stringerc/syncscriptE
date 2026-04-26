# SyncScript Jarvis Runbook

## Components
- Mission graph runtime: `/openclaw/missions/*`
- Policy engine and approvals: `/openclaw/missions/policy*`, `/openclaw/approvals/*`
- Home executor broker: `/openclaw/executor/*`
- Artifact/report pipeline: `/openclaw/missions/:missionId/report`
- Camera and tactical voice events: `/openclaw/camera/*`

## Bring-Up
1. Open `Mission Cockpit` in app route `/mission-cockpit`.
2. Register home executor from cockpit, then start local runner:
   - `npm run mission:executor`
3. Create mission and verify nodes begin advancing.
4. Resolve any guarded approvals from Settings or Mission Cockpit.

## Smoke Test
- Run `npm run mission:smoke` with:
  - `SYNCSCRIPT_ANON_KEY`
  - `SYNCSCRIPT_USER_ID`
  - optional `SYNCSCRIPT_WORKSPACE_ID`

## Failure Injection Drills
- **Policy lockdown drill**
  - Enable emergency lockdown in Mission Cockpit.
  - Attempt `missions/advance` with `nextStatus=running`.
  - Expect `423` block and no node execution.
- **Approval gate drill**
  - Turn on `requireCriticalApproval`.
  - Start high-risk node.
  - Confirm node transitions to `blocked` until approval resolves.
- **Executor lease rejection drill**
  - Modify local runner lease token.
  - Verify `/executor/heartbeat` returns unauthorized.

## Rollback Drills
- Approval inbox supports `rollback` response for guarded nodes.
- Executor kill switch endpoint:
  - `/openclaw/executor/kill-switch`
  - Forces executor status `locked` and rotates lease token.

## Observability
- Mission timeline events are stored in `mission_telemetry:*` KV keys.
- Artifact bundles are stored in `mission_artifact:*` KV keys.
