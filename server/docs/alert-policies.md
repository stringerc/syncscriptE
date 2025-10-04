# Alert Policies & SLOs

## Service Level Objectives (SLOs)

### API Performance
- **p95 API latency < 300ms** on critical routes (`/api/tasks`, `/api/calendar`, `/api/export`)
- **p99 API latency < 1000ms** on all routes
- **Error rate < 0.1%** on all API endpoints

### Energy Reset System
- **energy_reset_error_rate < 0.5%/day**
- **cron_lock_held_seconds{energy_reset} < 600s** (10 minutes max)
- **Energy reset completion rate > 99.5%**

### Calendar Integration
- **calendar_dup_write_count == 0** (no duplicate calendar events)
- **Calendar sync success rate > 99%**

### Export System
- **export_error_rate < 1%**
- **Export generation time < 5s** for PDFs, < 2s for CSV/JSON

### Outbox & Event Delivery
- **outbox_pending == 0** for > 5 minutes → **PAGE**
- **outbox_dead_letter == 0** (no events in dead letter queue)
- **Event delivery success rate > 99.9%**

### Idempotency
- **idempotency_hit_count** should be > 0 for write operations
- **Duplicate request rate < 0.01%**

## Alert Rules

### Critical Alerts (Page)

```yaml
# Outbox stuck for too long
- alert: OutboxStuck
  expr: outbox_pending > 0
  for: 5m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "Outbox has pending events for more than 5 minutes"
    description: "{{ $value }} events stuck in outbox"
    runbook_url: "https://docs.syncscript.com/runbooks/outbox-stuck"

# Energy reset job stuck
- alert: EnergyResetStuck
  expr: cron_lock_held_seconds{job="daily-energy-reset"} > 600
  for: 2m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "Energy reset job stuck for more than 10 minutes"
    description: "Energy reset lock held for {{ $value }} seconds"
    runbook_url: "https://docs.syncscript.com/runbooks/cron-lock"

# High error rate
- alert: HighErrorRate
  expr: rate(http_request_duration_ms_count{code=~"5.."}[5m]) > 0.01
  for: 2m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second"
```

### Warning Alerts

```yaml
# API latency high
- alert: HighAPILatency
  expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 300
  for: 5m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "API latency is high"
    description: "p95 latency is {{ $value }}ms"

# Energy reset errors
- alert: EnergyResetErrors
  expr: rate(energy_reset_error_count[1h]) > 0.005
  for: 10m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "Energy reset error rate is high"
    description: "Error rate is {{ $value }} errors per hour"

# Export errors
- alert: ExportErrors
  expr: rate(export_error_count[1h]) > 0.01
  for: 10m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "Export error rate is high"
    description: "Error rate is {{ $value }} errors per hour"

# Calendar duplicates
- alert: CalendarDuplicates
  expr: increase(calendar_dup_write_count[1h]) > 0
  for: 0m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: "Calendar duplicate writes detected"
    description: "{{ $value }} duplicate writes in the last hour"
```

## Feature Flag Kill Switch

### Webhook Endpoint

```typescript
// POST /api/admin/feature-flag-kill
// Body: { featureFlag: string, reason: string }
// Response: { success: boolean, message: string }
```

### Auto-Kill Triggers

1. **OutboxStuck** → Kill `new_ui` flag
2. **HighErrorRate** → Kill `new_ui` flag  
3. **EnergyResetStuck** → Kill `energy_engine` flag
4. **ExportErrors** → Kill `export_v2` flag

### Manual Kill Commands

```bash
# Kill new UI flag
curl -X POST http://localhost:3001/api/admin/feature-flag-kill \
  -H "Content-Type: application/json" \
  -d '{"featureFlag": "new_ui", "reason": "High error rate detected"}'

# Kill energy engine flag
curl -X POST http://localhost:3001/api/admin/feature-flag-kill \
  -H "Content-Type: application/json" \
  -d '{"featureFlag": "energy_engine", "reason": "Energy reset stuck"}'
```

## Dashboard Queries

### Key Metrics Dashboard

```promql
# Request rate
rate(http_request_duration_ms_count[5m])

# Error rate
rate(http_request_duration_ms_count{code=~"5.."}[5m]) / rate(http_request_duration_ms_count[5m])

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))

# Energy reset success rate
rate(energy_reset_run_count[1h]) / (rate(energy_reset_run_count[1h]) + rate(energy_reset_error_count[1h]))

# Export success rate
rate(export_success_count[1h]) / (rate(export_success_count[1h]) + rate(export_error_count[1h]))

# Cron lock acquisition rate
rate(cron_lock_acquire_success[5m]) / (rate(cron_lock_acquire_success[5m]) + rate(cron_lock_acquire_fail[5m]))
```

## Runbook Links

- [Outbox Stuck](./runbooks/outbox-stuck.md)
- [Cron Lock Issues](./runbooks/cron-lock.md)
- [Energy Reset Problems](./runbooks/energy-reset.md)
- [Export Failures](./runbooks/export-failures.md)
- [Calendar Sync Issues](./runbooks/calendar-sync.md)

## Notification Channels

### Critical Alerts
- **Slack**: #platform-alerts
- **PagerDuty**: Platform Team
- **Email**: platform-team@syncscript.com

### Warning Alerts
- **Slack**: #platform-warnings
- **Email**: platform-team@syncscript.com

## Escalation Policy

1. **0-5 minutes**: On-call engineer
2. **5-15 minutes**: Team lead
3. **15+ minutes**: Engineering manager
4. **30+ minutes**: CTO
