# Recovery System - Quick Start Guide

**Phase 4E: Job Recovery System**

This is a quick reference for developers and admins using the recovery system.

---

## For Developers

### Starting Worker with Recovery

```bash
# Start worker (recovery runs automatically)
cd backend
bun src/apps/pose-generator/worker.ts
```

**Expected Output:**
```
==================================================
🔄 Running startup recovery...
==================================================
[Recovery] Starting job recovery...
[Recovery] Found 2 stuck generations in database
[Recovery] Recovering generation abc123 (15/50 completed)
[Recovery] Successfully re-queued generation abc123 as job 456
✅ Recovery complete: 2 recovered, 0 failed
✅ Cleanup complete
==================================================
====================================
Pose Generator Worker
====================================
Worker is now listening for jobs...
```

### How Recovery Works (3 Steps)

1. **Detection:** Finds jobs stuck in "processing" for > 30 minutes
2. **Validation:** Checks if incomplete and no active queue job
3. **Resume:** Re-queues job with checkpoint data (skips completed poses)

### Automatic Recovery Triggers

- **On Startup:** Runs when worker starts
- **Every 30 Minutes:** Periodic check while running
- **Manual:** Admin can trigger via API endpoint

---

## For Admins

### Check Recovery Status

```bash
curl https://api.lumiku.com/api/apps/pose-generator/recovery/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "stalledGenerations": 0,
  "queuedGenerations": 5,
  "processingGenerations": 2,
  "lastRecoveryRun": "2025-10-14T10:30:00.000Z"
}
```

**What to Look For:**
- `stalledGenerations > 10`: Investigate worker health
- `processingGenerations > 50`: Check worker capacity
- `queuedGenerations` growing: Normal, jobs waiting for worker

### Manually Trigger Recovery

```bash
curl -X POST https://api.lumiku.com/api/apps/pose-generator/recovery/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "recovered": 3,
  "failed": 0
}
```

**When to Use:**
- Emergency: Worker crashed and didn't auto-recover
- Testing: Verify recovery system is working
- Monitoring: Check for stuck jobs manually

---

## Common Scenarios

### Scenario 1: Worker Crashed

**What Happens:**
1. Worker crashes mid-generation
2. Job stuck in "processing" status
3. On restart, recovery detects and re-queues
4. Worker resumes from checkpoint

**Your Action:** None needed (automatic)

**Verify:**
```bash
# Check logs
tail -f logs/worker.log | grep -i recovery
```

### Scenario 2: High Stalled Count

**What Happens:**
1. Many jobs stuck (> 10)
2. Indicates worker instability

**Your Action:**
1. Check recovery status
2. Review worker logs for errors
3. Restart worker if needed
4. Manually trigger recovery

**Commands:**
```bash
# Check status
curl /api/apps/pose-generator/recovery/status -H "Auth: $TOKEN"

# Trigger recovery
curl -X POST /api/apps/pose-generator/recovery/trigger -H "Auth: $TOKEN"

# Restart worker
pm2 restart pose-worker
```

### Scenario 3: User Reports Lost Job

**What Happens:**
1. User claims job disappeared
2. Check if job is stuck

**Your Action:**
1. Get generation ID from user
2. Check database status
3. Manually trigger recovery
4. Verify recovery in logs

**Commands:**
```bash
# Check database
psql $DATABASE_URL -c "
  SELECT id, status, poses_completed, total_expected_poses, started_at
  FROM pose_generation
  WHERE id = 'GENERATION_ID'
"

# Trigger recovery
curl -X POST /recovery/trigger -H "Auth: $ADMIN_TOKEN"
```

---

## Monitoring Dashboard

### Key Metrics

| Metric | Query | Alert Threshold |
|--------|-------|-----------------|
| Stalled Jobs | `/recovery/status` | > 10 |
| Processing Time | `MAX(NOW() - started_at)` | > 60 min |
| Recovery Rate | `recovered / (recovered + failed)` | < 90% |
| Queue Backlog | `/recovery/status` | > 100 |

### Health Check

```bash
# All-in-one health check
curl https://api.lumiku.com/api/apps/pose-generator/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "connected" },
    "redis": { "status": "connected" },
    "queue": {
      "status": "operational",
      "counts": {
        "waiting": 5,
        "active": 2,
        "failed": 0
      }
    }
  }
}
```

---

## Testing Recovery

### Test Recovery System

```bash
# 1. Start a generation
curl -X POST /api/apps/pose-generator/generate \
  -H "Auth: $TOKEN" \
  -d '{
    "projectId": "test-project",
    "generationType": "TEXT_DESCRIPTION",
    "textPrompt": "test pose",
    "variationCount": 50
  }'

# 2. Wait for 10 poses to complete
sleep 30

# 3. Kill worker
pkill -9 -f pose-generation.worker

# 4. Restart worker
bun src/apps/pose-generator/worker.ts

# 5. Verify recovery
# - Check logs for "RECOVERY MODE"
# - Verify generation completes
# - Check final pose count is 50
```

---

## Troubleshooting

### Problem: Recovery Not Working

**Check:**
1. Database connection: `psql $DATABASE_URL -c "SELECT 1"`
2. Redis connection: `redis-cli ping`
3. Worker logs: `tail -f logs/worker.log`
4. Manually trigger: `POST /recovery/trigger`

### Problem: Jobs Keep Failing

**Check:**
1. FLUX API status
2. Worker memory/CPU
3. Network connectivity
4. Database performance

**Commands:**
```bash
# Check worker resources
top -p $(pgrep -f pose-generation.worker)

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Check Redis memory
redis-cli info memory
```

### Problem: Duplicate Poses

**Check:**
1. Database pose records: Look for duplicates
2. Worker logs: Check checkpoint logic
3. Recovery logs: Verify recovery mode

**Fix:**
```sql
-- Find duplicates
SELECT generation_id, pose_library_id, COUNT(*)
FROM generated_pose
GROUP BY generation_id, pose_library_id
HAVING COUNT(*) > 1
```

---

## Configuration

### Recovery Thresholds

Edit `recovery.service.ts` to adjust:

```typescript
// Stalled threshold (default: 30 minutes)
const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

// Timeout threshold (default: 2 hours)
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
```

### Periodic Check Interval

Edit `worker.ts` to adjust:

```typescript
// Default: 30 minutes
setInterval(async () => {
  await jobRecoveryService.recoverStalledJobs()
}, 30 * 60 * 1000) // Change this value
```

---

## API Reference

### GET /recovery/status

**Authentication:** Admin only

**Response:**
```typescript
{
  stalledGenerations: number     // Jobs stuck > 30 min
  queuedGenerations: number       // Jobs waiting in queue
  processingGenerations: number   // Jobs currently processing
  lastRecoveryRun: string        // ISO timestamp
}
```

### POST /recovery/trigger

**Authentication:** Admin only

**Response:**
```typescript
{
  success: boolean
  recovered: number  // Number of jobs recovered
  failed: number     // Number of jobs that failed recovery
}
```

---

## Best Practices

1. **Monitor Daily**: Check `/recovery/status` once per day
2. **Alert on Threshold**: Set up alerts for > 10 stalled jobs
3. **Review Logs Weekly**: Look for patterns in recovery
4. **Test Monthly**: Run recovery test to verify system
5. **Keep Worker Healthy**: Monitor memory, CPU, network
6. **Document Issues**: Note any unusual recovery patterns

---

## Emergency Contacts

**For urgent recovery issues:**
- Engineering Lead: [Your Contact]
- DevOps Team: [Your Contact]
- On-Call: [Your Contact]

**Escalation Path:**
1. Check recovery status
2. Review worker logs
3. Manually trigger recovery
4. Restart worker if needed
5. Contact engineering if persists

---

## Quick Links

- **Full Documentation:** [RECOVERY.md](./RECOVERY.md)
- **Architecture:** [POSE_GENERATOR_ARCHITECTURE.md](../../../docs/POSE_GENERATOR_ARCHITECTURE.md)
- **Implementation Summary:** [PHASE_4E_IMPLEMENTATION_SUMMARY.md](../../../../PHASE_4E_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** 2025-10-14
**Phase:** 4E - Job Recovery System
**Status:** Production Ready ✅
