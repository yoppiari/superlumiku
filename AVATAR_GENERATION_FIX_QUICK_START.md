# Avatar Generation Fix - Quick Start Guide

**Issue:** Avatar generation stuck at "Waiting..." for >5 minutes, disappears after refresh
**Root Cause:** `avatar-generator-worker` not configured in PM2
**Status:** ✅ Fix ready to deploy

---

## 🚨 Quick Fix (5 Minutes)

### On Production Server (dev.lumiku.com)

```bash
# 1. SSH to server
ssh user@dev.lumiku.com

# 2. Navigate to backend
cd /path/to/lumiku/backend

# 3. Pull latest code
git pull origin main

# 4. Stop all PM2 processes
pm2 delete all

# 5. Start with new config
pm2 start ecosystem.config.js --env production

# 6. Save PM2 list
pm2 save

# 7. Verify worker is running
pm2 list | grep avatar-generator-worker
# Expected: Status = online

# 8. Check logs
pm2 logs avatar-generator-worker --lines 20
# Expected: "🚀 Avatar Generator Worker started"
```

---

## 📋 What Changed

**File Updated:** `backend/ecosystem.config.js`

**Added Configuration:**
```javascript
{
  name: 'avatar-generator-worker',
  script: './src/apps/avatar-creator/workers/avatar-generator.worker.ts',
  interpreter: 'bun',
  env_production: {
    NODE_ENV: 'production',
    WORKER_CONCURRENCY: 2,
  },
  max_memory_restart: '1G',
  error_file: './logs/avatar-worker-error.log',
  out_file: './logs/avatar-worker-out.log',
}
```

---

## 🔍 Verification Steps

### 1. Check Worker Status
```bash
pm2 list
```
Expected output:
```
┌─────┬────────────────────────┬──────┬─────────┐
│ id  │ name                   │ mode │ status  │
├─────┼────────────────────────┼──────┼─────────┤
│ 0   │ lumiku-api             │ fork │ online  │
│ 1   │ pose-generator-worker  │ fork │ online  │
│ 2   │ avatar-generator-worker│ fork │ online  │ ← NEW
└─────┴────────────────────────┴──────┴─────────┘
```

### 2. Check Redis Queue
```bash
redis-cli LLEN bull:avatar-generation:wait
```
Expected: Should drain to 0 as worker processes jobs

### 3. Test Generation
```bash
# Submit test avatar generation via frontend
# Watch worker logs:
pm2 logs avatar-generator-worker --lines 0

# Expected output within 30-90 seconds:
# 🎨 Processing avatar generation: <job-id>
# 📸 Generating avatar for user <user-id>
# ✅ Avatar created successfully: <avatar-id>
```

---

## 🧹 Cleanup Stuck Generations

### Option A: Using SQL Script

```bash
# Connect to database
docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev

# Run cleanup script
\i CLEANUP_STUCK_GENERATIONS.sql

# Follow prompts to:
# 1. View stuck generations
# 2. Mark as failed
# 3. Generate refund SQL
```

### Option B: Manual SQL

```sql
-- 1. View stuck generations
SELECT
  id,
  "userId",
  status,
  "createdAt",
  EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 AS minutes_stuck
FROM "avatar_generations"
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '10 minutes'
ORDER BY "createdAt" DESC;

-- 2. Mark as failed
UPDATE "avatar_generations"
SET
  status = 'failed',
  "errorMessage" = 'Generation timed out - please try again',
  "completedAt" = NOW()
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '10 minutes';

-- 3. Issue refunds (for each affected user)
INSERT INTO "credits" (
  id,
  "userId",
  amount,
  balance,
  type,
  description,
  "createdAt"
)
SELECT
  gen_random_uuid(),
  '<user-id>',
  10, -- Refund amount
  (SELECT balance FROM "credits" WHERE "userId" = '<user-id>' ORDER BY "createdAt" DESC LIMIT 1) + 10,
  'refund',
  'Avatar generation system issue - credits refunded',
  NOW();
```

---

## 📊 Monitoring Commands

### Worker Status
```bash
# List all processes
pm2 list

# Detailed worker info
pm2 info avatar-generator-worker

# Real-time logs
pm2 logs avatar-generator-worker

# Last 100 lines
pm2 logs avatar-generator-worker --lines 100
```

### Redis Queue Status
```bash
redis-cli

# Queue lengths
LLEN bull:avatar-generation:wait      # Pending jobs
LLEN bull:avatar-generation:active    # Currently processing
LLEN bull:avatar-generation:completed # Recently completed
LLEN bull:avatar-generation:failed    # Failed jobs

# Inspect a job
LRANGE bull:avatar-generation:wait 0 0
```

### Database Queries
```sql
-- Active generations
SELECT COUNT(*) FROM "avatar_generations" WHERE status = 'processing';

-- Recent completions
SELECT
  id,
  status,
  "createdAt",
  "completedAt",
  EXTRACT(EPOCH FROM ("completedAt" - "createdAt")) AS duration_seconds
FROM "avatar_generations"
WHERE status = 'completed'
  AND "completedAt" > NOW() - INTERVAL '1 hour'
ORDER BY "completedAt" DESC;

-- Failed generations
SELECT
  id,
  "userId",
  "errorMessage",
  "createdAt"
FROM "avatar_generations"
WHERE status = 'failed'
  AND "createdAt" > NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

---

## ⚠️ Troubleshooting

### Worker Won't Start

**Symptom:** Worker status shows "errored" or keeps restarting

**Check logs:**
```bash
pm2 logs avatar-generator-worker --err --lines 50
```

**Common issues:**
1. Redis not accessible
2. Environment variables missing
3. HuggingFace API key invalid
4. File system permissions

**Solution:**
```bash
# Check Redis connection
redis-cli ping  # Expected: PONG

# Check environment variables
pm2 env 2  # Replace 2 with worker's PM2 ID

# Restart worker
pm2 restart avatar-generator-worker
```

### Jobs Not Processing

**Symptom:** Worker online but jobs stay in queue

**Check:**
```bash
# Worker logs - should show "Listening to queue: avatar-generation"
pm2 logs avatar-generator-worker --lines 50

# Queue status
redis-cli LLEN bull:avatar-generation:wait

# Worker is connected to Redis?
pm2 logs avatar-generator-worker | grep "Redis"
```

**Solution:**
```bash
# Restart worker
pm2 restart avatar-generator-worker

# Clear stuck Redis jobs (CAUTION: This removes all queued jobs)
redis-cli DEL bull:avatar-generation:wait
redis-cli DEL bull:avatar-generation:active
```

### HuggingFace API Errors

**Symptom:** Worker processes jobs but all fail with API errors

**Check logs:**
```bash
pm2 logs avatar-generator-worker --lines 100 | grep "HuggingFace\|FLUX"
```

**Common errors:**
- 401 Unauthorized: Invalid API key
- 429 Rate Limited: Too many requests
- 503 Service Unavailable: Model loading or overloaded

**Solution:**
```bash
# Verify API key
curl -X POST https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  -d '{"inputs": "test"}'

# Update API key in production
# Add to .env or PM2 ecosystem config
```

---

## 📈 Success Metrics

After deploying the fix, you should see:

✅ **Worker Status:**
- `avatar-generator-worker` shows "online" in PM2
- No restarts or crashes
- Memory usage stable (<500MB)

✅ **Generation Performance:**
- New generations complete in 30-90 seconds
- Success rate >95%
- Queue drains to 0 within minutes

✅ **User Experience:**
- No stuck "Waiting..." states
- Avatars appear after generation
- Credits only deducted for successful generations

✅ **Queue Health:**
- Waiting jobs: 0-5
- Active jobs: 1-2 (during processing)
- Failed jobs: <5% of total

---

## 📞 Support

**Documentation:**
- Full diagnostic report: `AVATAR_GENERATION_DIAGNOSTIC_REPORT.md`
- Deployment script: `FIX_AVATAR_GENERATION_NOW.sh`
- SQL cleanup: `CLEANUP_STUCK_GENERATIONS.sql`

**Key Files:**
- Worker code: `backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts`
- PM2 config: `backend/ecosystem.config.js`
- Queue setup: `backend/src/lib/queue.ts`

**Database:**
- Container: `ycwc4s4ookos40k44gc8oooc`
- Database: `lumiku-dev`
- Table: `avatar_generations`

---

## ✅ Deployment Checklist

Pre-deployment:
- [ ] Read diagnostic report
- [ ] Review code changes
- [ ] Backup database (optional)
- [ ] Notify users of maintenance (if needed)

Deployment:
- [ ] SSH to production server
- [ ] Pull latest code
- [ ] Update PM2 configuration
- [ ] Restart services
- [ ] Verify worker is online

Post-deployment:
- [ ] Monitor worker logs for 10 minutes
- [ ] Submit test generation
- [ ] Verify generation completes
- [ ] Run cleanup script for stuck generations
- [ ] Issue credit refunds to affected users
- [ ] Monitor queue and worker metrics

Long-term:
- [ ] Set up worker health monitoring
- [ ] Add stuck job auto-recovery
- [ ] Implement frontend timeout warnings
- [ ] Create admin dashboard for queue monitoring
- [ ] Set up alerts for worker downtime

---

**Last Updated:** 2025-10-17
**Status:** Ready for production deployment
**Estimated Fix Time:** 10 minutes
**Risk Level:** Low
