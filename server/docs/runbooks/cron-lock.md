# Cron Lock Runbook

## Overview

The cron lock system prevents concurrent execution of scheduled jobs using advisory database locks. This ensures that critical operations like daily energy resets don't run multiple times simultaneously.

## Architecture

- **Table**: `cron_locks` (SQLite)
- **Columns**: `id`, `jobName`, `lockedBy`, `lockedAt`, `expiresAt`, `metadata`
- **Service**: `cronLockService.ts`
- **Jobs**: Daily energy reset, budget monitoring, event dispatching

## Common Issues & Solutions

### 1. Cron Lock Stuck

**Symptoms:**
- Job appears to be running but never completes
- Logs show "Cron job already locked" repeatedly
- No new job executions for extended periods

**Diagnosis:**
```sql
-- Check active locks
SELECT * FROM cron_locks 
WHERE expiresAt > datetime('now') 
ORDER BY lockedAt DESC;

-- Check for stuck locks (expired but not cleaned up)
SELECT * FROM cron_locks 
WHERE expiresAt <= datetime('now') 
ORDER BY lockedAt DESC;
```

**Solutions:**

**Option A: Wait for Natural Expiration**
- Most locks expire within 30 minutes
- Check `expiresAt` column to see when lock will naturally release

**Option B: Manual Cleanup (Emergency)**
```sql
-- Remove expired locks
DELETE FROM cron_locks 
WHERE expiresAt <= datetime('now');

-- Remove specific stuck lock (use with caution)
DELETE FROM cron_locks 
WHERE id = 'stuck-lock-id';
```

**Option C: Restart Service**
- Graceful restart will release all locks
- Use `SIGTERM` to allow proper cleanup

### 2. Multiple Job Executions

**Symptoms:**
- Same job running multiple times
- Duplicate energy resets or budget checks
- Logs show multiple "Starting daily energy reset job" messages

**Diagnosis:**
```sql
-- Check for multiple active locks for same job
SELECT jobName, COUNT(*) as lockCount 
FROM cron_locks 
WHERE expiresAt > datetime('now') 
GROUP BY jobName 
HAVING COUNT(*) > 1;
```

**Solutions:**
- Verify only one instance of the service is running
- Check for multiple deployment environments
- Ensure proper process management (PM2, systemd, etc.)

### 3. Lock Acquisition Failures

**Symptoms:**
- Jobs never start
- Logs show "Failed to acquire cron lock" errors
- Database connection issues

**Diagnosis:**
```sql
-- Check database connectivity
SELECT COUNT(*) FROM cron_locks;

-- Check for database locks
PRAGMA database_list;
```

**Solutions:**
- Verify database connection
- Check for database file permissions
- Ensure no other processes are holding database locks

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Lock Acquisition Success Rate**
   - Should be > 99% for normal operations
   - Alert if < 95% over 1 hour

2. **Lock Hold Duration**
   - Energy reset: < 5 minutes
   - Budget monitoring: < 2 minutes
   - Event dispatcher: < 1 minute
   - Alert if > 2x expected duration

3. **Stuck Lock Count**
   - Should be 0 for expired locks
   - Alert if > 0 for > 5 minutes

### Alert Conditions

```yaml
# Example alert rules
- alert: CronLockStuck
  expr: cron_lock_held_seconds{job="daily-energy-reset"} > 600
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Energy reset job stuck for > 10 minutes"

- alert: CronLockAcquisitionFailure
  expr: rate(cron_lock_acquire_fail_total[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High cron lock acquisition failure rate"
```

## Maintenance Tasks

### Daily
- Check for stuck locks in logs
- Verify energy reset completed successfully
- Monitor lock acquisition metrics

### Weekly
- Review lock hold duration trends
- Check for any recurring lock issues
- Verify cleanup of expired locks

### Monthly
- Analyze lock contention patterns
- Review and update lock timeouts if needed
- Test lock recovery procedures

## Emergency Procedures

### Complete Lock System Reset

**⚠️ WARNING: This will stop all cron jobs until service restart**

```sql
-- Emergency: Remove all locks
DELETE FROM cron_locks;

-- Restart service to reinitialize
-- systemctl restart syncscript-server
```

### Force Job Execution

**⚠️ WARNING: Only use if you're certain no other instance is running**

```sql
-- Remove specific job lock
DELETE FROM cron_locks WHERE jobName = 'daily-energy-reset';

-- Job will acquire new lock on next cycle
```

## Troubleshooting Commands

```bash
# Check service status
systemctl status syncscript-server

# View recent logs
journalctl -u syncscript-server -f

# Check database file
ls -la /path/to/dev.db

# Test database connectivity
sqlite3 /path/to/dev.db "SELECT COUNT(*) FROM cron_locks;"

# Check for database locks
lsof /path/to/dev.db
```

## Prevention

1. **Proper Timeout Configuration**
   - Set appropriate lock durations
   - Don't set too short (causes frequent failures)
   - Don't set too long (causes stuck locks)

2. **Graceful Shutdown**
   - Always use SIGTERM for shutdown
   - Allow time for locks to be released
   - Implement proper cleanup in shutdown handlers

3. **Monitoring**
   - Set up alerts for lock metrics
   - Monitor job execution logs
   - Track lock hold duration trends

4. **Testing**
   - Run unit tests for lock acquisition
   - Test concurrent job scenarios
   - Verify lock cleanup on expiration
