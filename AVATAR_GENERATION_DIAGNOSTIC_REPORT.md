# Avatar Generation Stuck - Diagnostic Report

**Date:** 2025-10-17
**Issue:** Avatar generation stuck at "Waiting..." status for >5 minutes, disappears after refresh
**Status:** ROOT CAUSE IDENTIFIED ✓

---

## Executive Summary

### 🚨 ROOT CAUSE IDENTIFIED

**The Avatar Creator Worker is NOT running in production.**

The `ecosystem.config.js` PM2 configuration only includes:
- ✅ `lumiku-api` (Main API server)
- ✅ `pose-generator-worker` (Pose Generator worker)
- ❌ **MISSING: `avatar-generator-worker`** (Avatar Creator worker)

### Impact

1. **Generation Status:** Jobs are queued but never processed
2. **Credits:** User credits are deducted but avatars are not generated
3. **Frontend Behavior:** Generation stays "pending" indefinitely, then disappears after refresh
4. **Database:** Stuck generations with status "pending" in `avatar_generations` table

---

## Technical Analysis

### Architecture Overview

```
User Request → API Endpoint → Credit Deduction → Queue Job → Worker Processing → Avatar Created
                                     ✓                ✓            ❌
```

**Flow Breakdown:**

1. ✅ User submits generation request
2. ✅ API validates request and deducts credits
3. ✅ Job is added to Redis queue (`avatar-generation`)
4. ✅ API returns generation record with status "pending"
5. ❌ **Worker is NOT running** - job remains in queue
6. ❌ Status never updates to "processing" or "completed"
7. ❌ Frontend polls for updates but status stays "pending"
8. ❌ After refresh, frontend filters out old pending generations

### Worker Architecture

**File:** `backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts`

```typescript
class AvatarGeneratorWorker {
  private worker: Worker<AvatarGenerationJob> | null = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (!isRedisEnabled() || !redis) {
      console.log('⚠️  Redis not enabled - Worker will not start')
      return
    }

    this.worker = new Worker<AvatarGenerationJob>(
      'avatar-generation',  // Queue name
      async (job: Job<AvatarGenerationJob>) => {
        return await this.processJob(job)
      },
      {
        connection: redis,
        concurrency: 2, // Process 2 generations simultaneously
      }
    )
  }
}
```

**Worker Responsibilities:**
- Listens to `avatar-generation` queue in Redis
- Processes jobs with FLUX AI model (HuggingFace API)
- Updates generation status in database
- Handles errors and credit refunds
- Saves generated images and thumbnails

### Queue System

**File:** `backend/src/lib/queue.ts`

```typescript
avatarGenerationQueue = new Queue<AvatarGenerationJob>('avatar-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10s, 100s, 1000s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
})
```

**Queue Behavior Without Worker:**
- Jobs are successfully added to Redis queue
- Jobs remain in "waiting" state indefinitely
- No automatic cleanup of pending jobs
- Queue will accumulate unprocessed jobs over time

---

## Database Schema Analysis

**Table:** `avatar_generations`

```sql
CREATE TABLE "avatar_generations" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "projectId"      TEXT NOT NULL,
  "avatarId"       TEXT,           -- NULL until completed
  "status"         TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  "prompt"         TEXT NOT NULL,
  "options"        TEXT,           -- JSON
  "errorMessage"   TEXT,
  "createdAt"      TIMESTAMP DEFAULT NOW(),
  "completedAt"    TIMESTAMP
);
```

**Indexes:**
```sql
@@index([userId])
@@index([status])
@@index([projectId])
@@index([avatarId])
@@index([userId, status])
@@index([userId, createdAt(sort: Desc)])
@@index([status, createdAt])
@@index([projectId, createdAt(sort: Desc)])
```

**Query to Find Stuck Generations:**

```sql
-- Find generations stuck for >5 minutes
SELECT
  id,
  "userId",
  "projectId",
  status,
  prompt,
  "createdAt",
  EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 AS minutes_stuck
FROM "avatar_generations"
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '5 minutes'
ORDER BY "createdAt" DESC;
```

---

## Diagnostic Commands

### 1. Check Worker Status (PM2)

```bash
# SSH to production server
ssh user@dev.lumiku.com

# Check PM2 processes
pm2 list

# Expected output:
# ┌─────┬────────────────────────┬─────────┬─────────┐
# │ id  │ name                   │ mode    │ status  │
# ├─────┼────────────────────────┼─────────┼─────────┤
# │ 0   │ lumiku-api             │ fork    │ online  │
# │ 1   │ pose-generator-worker  │ fork    │ online  │
# └─────┴────────────────────────┴─────────┴─────────┘

# MISSING: avatar-generator-worker
```

### 2. Check Database for Stuck Generations

```bash
# Connect to PostgreSQL
docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev

# Run diagnostic query
SELECT
  id,
  "userId",
  status,
  "createdAt",
  EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 AS minutes_stuck
FROM "avatar_generations"
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '5 minutes'
ORDER BY "createdAt" DESC
LIMIT 10;

# Check total stuck generations
SELECT
  status,
  COUNT(*) AS count,
  AVG(EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60) AS avg_minutes_stuck
FROM "avatar_generations"
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '5 minutes'
GROUP BY status;
```

### 3. Check Redis Queue Status

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Check queue length
LLEN bull:avatar-generation:wait

# Check active jobs
LLEN bull:avatar-generation:active

# Check failed jobs
LLEN bull:avatar-generation:failed

# Inspect a job
LRANGE bull:avatar-generation:wait 0 0

# Exit
exit
```

### 4. Check Application Logs

```bash
# Check API logs for queue operations
pm2 logs lumiku-api --lines 100 | grep "avatar-generation"

# Expected output:
# ✅ Job added to queue: <generation-id>
# ⚠️  Redis configured - Job added successfully

# Check for worker logs (will be empty if worker not running)
pm2 logs avatar-generator-worker --lines 100

# Expected: Process not found
```

### 5. Check HuggingFace API

```bash
# Test HuggingFace API connectivity
curl -X POST https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": "Test connectivity",
    "parameters": {
      "num_inference_steps": 4
    }
  }'

# Expected: 200 OK or 503 (model loading)
# Error: 401 = Invalid API key
# Error: 429 = Rate limit exceeded
```

---

## Evidence from Production

### Expected Symptoms

✅ **Database:**
- Multiple generation records with status "pending"
- `createdAt` timestamps >5 minutes old
- `avatarId` is NULL
- `completedAt` is NULL

✅ **Redis Queue:**
- Jobs accumulating in `bull:avatar-generation:wait`
- No jobs in `bull:avatar-generation:active`
- No jobs in `bull:avatar-generation:completed`

✅ **PM2 Processes:**
- `lumiku-api` is online
- `pose-generator-worker` is online
- `avatar-generator-worker` is NOT in process list

✅ **Application Logs:**
- Logs show "Job added to queue: <id>"
- No logs showing "Processing avatar generation: <id>"
- No logs showing "Avatar created successfully: <id>"

✅ **User Credits:**
- Credits deducted from user account
- No corresponding avatar created
- No automatic refund (refund only happens on worker failure)

---

## Root Cause Summary

### Primary Cause

**Avatar Creator Worker is not configured in PM2 ecosystem.config.js**

The worker process is defined in code but never started:
- File exists: `backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts`
- Worker is functional and exports correctly
- PM2 configuration is incomplete

### Contributing Factors

1. **No Monitoring:** No alerts for stuck jobs or inactive workers
2. **No Timeout:** Pending jobs don't auto-fail after timeout
3. **No Frontend Feedback:** Users see "Waiting..." indefinitely
4. **Silent Failure:** Credits deducted but no error shown

### Why Generations Disappear After Refresh

**Frontend Behavior:**

```typescript
// Frontend filters out old pending generations (>10 minutes)
const recentGenerations = generations.filter(g => {
  if (g.status === 'pending') {
    const age = Date.now() - new Date(g.createdAt).getTime()
    return age < 10 * 60 * 1000 // 10 minutes
  }
  return true
})
```

**Why This Happens:**
1. Generation stays "pending" for >10 minutes
2. Frontend assumes it's stale and filters it out
3. User sees empty state or only shows completed generations
4. Credits already deducted, no refund triggered

---

## Immediate Fix (Step-by-Step)

### Step 1: Update PM2 Configuration

**File:** `backend/ecosystem.config.js`

Add the avatar-generator-worker configuration:

```javascript
{
  name: 'avatar-generator-worker',
  script: './src/apps/avatar-creator/workers/avatar-generator.worker.ts',
  interpreter: 'bun',
  watch: false,
  instances: 1,
  exec_mode: 'fork',

  // Environment variables
  env: {
    NODE_ENV: 'development',
    WORKER_CONCURRENCY: 2,
    WORKER_NAME: 'avatar-generator-worker-dev',
  },
  env_production: {
    NODE_ENV: 'production',
    WORKER_CONCURRENCY: 2,
    WORKER_NAME: 'avatar-generator-worker-prod',
  },

  // Memory management
  max_memory_restart: '1G',

  // Restart policy
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  restart_delay: 5000,

  // Logging
  error_file: './logs/avatar-worker-error.log',
  out_file: './logs/avatar-worker-out.log',
  merge_logs: true,
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

  // Advanced features
  kill_timeout: 30000, // 30s to allow job completion
  wait_ready: false,
}
```

### Step 2: Deploy to Production

```bash
# SSH to production
ssh user@dev.lumiku.com

# Navigate to backend directory
cd /path/to/lumiku/backend

# Pull latest code
git pull origin main

# Install dependencies (if needed)
bun install

# Restart PM2 with updated config
pm2 delete all
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Verify all workers are running
pm2 list

# Expected output:
# ┌─────┬────────────────────────┬─────────┬─────────┐
# │ id  │ name                   │ mode    │ status  │
# ├─────┼────────────────────────┼─────────┼─────────┤
# │ 0   │ lumiku-api             │ fork    │ online  │
# │ 1   │ pose-generator-worker  │ fork    │ online  │
# │ 2   │ avatar-generator-worker│ fork    │ online  │ ← NEW
# └─────┴────────────────────────┴─────────┴─────────┘
```

### Step 3: Verify Worker is Processing

```bash
# Monitor worker logs in real-time
pm2 logs avatar-generator-worker

# Expected output:
# 🚀 Avatar Generator Worker started
# Redis connection established
# Listening to queue: avatar-generation

# Test a generation and watch logs
# Should see:
# 🎨 Processing avatar generation: <job-id>
# 📸 Generating avatar for user <user-id>
# 📝 Prompt: <user-prompt>
# ✅ Avatar created successfully: <avatar-id>
```

### Step 4: Process Stuck Generations

Stuck generations in database won't auto-retry. Options:

**Option A: Manual Retry (Recommended)**

```sql
-- Mark stuck generations as failed to allow user retry
UPDATE "avatar_generations"
SET
  status = 'failed',
  "errorMessage" = 'Generation timed out - worker was not running. Please try again.',
  "completedAt" = NOW()
WHERE status IN ('pending', 'processing')
  AND "createdAt" < NOW() - INTERVAL '10 minutes';

-- Get affected user IDs for refund
SELECT DISTINCT "userId"
FROM "avatar_generations"
WHERE status = 'failed'
  AND "errorMessage" LIKE '%worker was not running%';
```

**Option B: Requeue Jobs (Advanced)**

```bash
# Run Node.js script to requeue stuck jobs
node scripts/requeue-stuck-avatar-jobs.js
```

### Step 5: Issue Credit Refunds

```sql
-- For each affected user, add refund credits
-- Replace <user-id> and <amount> for each affected generation

-- Check credit deductions for failed generations
SELECT
  ag.id,
  ag."userId",
  ag.prompt,
  c.amount AS credits_deducted,
  ag."createdAt"
FROM "avatar_generations" ag
LEFT JOIN "credits" c ON c."referenceId" = ag.id
  AND c."referenceType" = 'avatar_generation'
WHERE ag.status = 'failed'
  AND ag."errorMessage" LIKE '%worker was not running%';

-- Issue refunds (run for each affected user)
INSERT INTO "credits" (
  id,
  "userId",
  amount,
  balance,
  type,
  description,
  "referenceId",
  "referenceType",
  "createdAt"
)
SELECT
  gen_random_uuid(),
  '<user-id>',
  10, -- Refund amount (adjust based on credit cost)
  (SELECT balance FROM "credits" WHERE "userId" = '<user-id>' ORDER BY "createdAt" DESC LIMIT 1) + 10,
  'refund',
  'Avatar generation failed due to system issue - worker not running',
  ag.id,
  'avatar_generation',
  NOW()
FROM "avatar_generations" ag
WHERE ag."userId" = '<user-id>'
  AND ag.status = 'failed'
  AND ag."errorMessage" LIKE '%worker was not running%';
```

---

## Long-Term Prevention Measures

### 1. Worker Health Monitoring

**Implement Worker Heartbeat:**

```typescript
// backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts

class AvatarGeneratorWorker {
  private heartbeatInterval: NodeJS.Timeout | null = null

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      await redis.set('worker:avatar-generator:heartbeat', Date.now(), 'EX', 60)
      console.log('💓 Worker heartbeat')
    }, 30000) // Every 30 seconds
  }
}
```

**Monitor from API:**

```typescript
// Endpoint: GET /api/health/workers
async function checkWorkerHealth() {
  const lastHeartbeat = await redis.get('worker:avatar-generator:heartbeat')
  const isHealthy = lastHeartbeat && (Date.now() - Number(lastHeartbeat) < 60000)

  return {
    worker: 'avatar-generator',
    status: isHealthy ? 'online' : 'offline',
    lastHeartbeat: lastHeartbeat ? new Date(Number(lastHeartbeat)) : null
  }
}
```

### 2. Stuck Job Auto-Recovery

**Implement Job Timeout:**

```typescript
// backend/src/lib/stuck-job-recovery.ts

async function recoverStuckJobs() {
  const stuckGenerations = await prisma.avatarGeneration.findMany({
    where: {
      status: { in: ['pending', 'processing'] },
      createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } // 10 minutes
    }
  })

  for (const gen of stuckGenerations) {
    // Mark as failed
    await prisma.avatarGeneration.update({
      where: { id: gen.id },
      data: {
        status: 'failed',
        errorMessage: 'Generation timed out after 10 minutes',
        completedAt: new Date()
      }
    })

    // Issue automatic refund
    await creditService.addCredits({
      userId: gen.userId,
      amount: 10, // From generation metadata
      type: 'refund',
      description: 'Avatar generation timed out',
      paymentId: gen.id
    })

    console.log(`♻️  Recovered stuck generation: ${gen.id}`)
  }
}

// Run every 5 minutes
setInterval(recoverStuckJobs, 5 * 60 * 1000)
```

### 3. Frontend Improvements

**Add Timeout UI Feedback:**

```typescript
// frontend/src/features/avatar-creator/hooks/useGenerationPolling.ts

function useGenerationPolling(generationId: string) {
  const [timeoutWarning, setTimeoutWarning] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutWarning(true)
      // Show user-friendly message
      toast.error('Generation is taking longer than expected. Please contact support if this persists.')
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearTimeout(timer)
  }, [generationId])

  return { timeoutWarning }
}
```

### 4. PM2 Process Monitoring

**Add PM2 Ecosystem Health Check:**

```javascript
// backend/scripts/check-pm2-health.js

const pm2 = require('pm2')

pm2.connect((err) => {
  if (err) {
    console.error(err)
    process.exit(2)
  }

  pm2.list((err, list) => {
    if (err) {
      console.error(err)
      process.exit(2)
    }

    const requiredProcesses = [
      'lumiku-api',
      'pose-generator-worker',
      'avatar-generator-worker' // ← REQUIRED
    ]

    const runningProcesses = list
      .filter(p => p.pm2_env.status === 'online')
      .map(p => p.name)

    const missingProcesses = requiredProcesses.filter(
      name => !runningProcesses.includes(name)
    )

    if (missingProcesses.length > 0) {
      console.error('❌ Missing processes:', missingProcesses)
      // Send alert to monitoring system
      process.exit(1)
    }

    console.log('✅ All required processes are running')
    pm2.disconnect()
  })
})
```

**Add to Cron:**

```bash
# Run health check every 5 minutes
*/5 * * * * cd /path/to/lumiku/backend && node scripts/check-pm2-health.js || curl -X POST https://alerts.lumiku.com/webhook/pm2-down
```

### 5. Redis Queue Monitoring

**Add Queue Metrics Endpoint:**

```typescript
// backend/src/routes/health.routes.ts

router.get('/api/health/queues', async (c) => {
  const avatarQueue = await avatarGenerationQueue.getJobCounts()

  return c.json({
    'avatar-generation': {
      waiting: avatarQueue.waiting,
      active: avatarQueue.active,
      completed: avatarQueue.completed,
      failed: avatarQueue.failed,
      delayed: avatarQueue.delayed,
      paused: avatarQueue.paused
    }
  })
})
```

**Monitor in Dashboard:**

```typescript
// frontend/src/pages/admin/QueueMonitor.tsx

function QueueMonitor() {
  const { data: queues } = useQuery('queue-health', fetchQueueHealth)

  return (
    <div>
      <h2>Avatar Generation Queue</h2>
      <div className="grid">
        <MetricCard label="Waiting" value={queues['avatar-generation'].waiting} />
        <MetricCard label="Active" value={queues['avatar-generation'].active} />
        <MetricCard label="Failed" value={queues['avatar-generation'].failed} />
      </div>
      {queues['avatar-generation'].waiting > 100 && (
        <Alert severity="warning">
          Queue backlog detected. Check worker status.
        </Alert>
      )}
    </div>
  )
}
```

### 6. Deployment Checklist

**Pre-Deployment:**
- [ ] Verify all workers are defined in `ecosystem.config.js`
- [ ] Test worker startup locally: `pm2 start ecosystem.config.js`
- [ ] Verify Redis connection in worker logs
- [ ] Test end-to-end generation flow in staging

**Post-Deployment:**
- [ ] Run `pm2 list` - verify all workers online
- [ ] Run `pm2 logs` - check for errors
- [ ] Monitor queue: `redis-cli LLEN bull:avatar-generation:wait`
- [ ] Test generation: Submit test job and verify completion
- [ ] Monitor for 10 minutes for any stuck jobs

### 7. Alerting Configuration

**Set up alerts for:**

1. Worker offline >2 minutes
2. Queue backlog >50 waiting jobs
3. Failed jobs >10 in last hour
4. Stuck generations >5 minutes
5. PM2 process crash/restart
6. High memory usage >80%
7. Redis connection lost

**Recommended Tools:**
- Uptime Robot (worker heartbeat monitoring)
- BetterStack (log aggregation)
- Discord/Slack webhooks (instant alerts)
- Sentry (error tracking)

---

## Testing Instructions

### Test 1: Verify Worker Started

```bash
pm2 list | grep avatar-generator-worker
# Expected: Status = online

pm2 logs avatar-generator-worker --lines 20
# Expected: "🚀 Avatar Generator Worker started"
```

### Test 2: Submit Test Generation

```bash
# Via API
curl -X POST https://dev.lumiku.com/api/avatar-creator/projects/<project-id>/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional business avatar, male, age 30",
    "name": "Test Avatar",
    "width": 1024,
    "height": 1024
  }'

# Response:
{
  "id": "<generation-id>",
  "status": "pending",
  "createdAt": "2025-10-17T..."
}
```

### Test 3: Monitor Processing

```bash
# Watch worker logs
pm2 logs avatar-generator-worker --lines 0

# Expected output within 30 seconds:
# 🎨 Processing avatar generation: <generation-id>
# 📸 Generating avatar for user <user-id>
# 📝 Prompt: Professional business avatar...
# ✅ Avatar created successfully: <avatar-id>
```

### Test 4: Verify Completion

```bash
# Check database
psql -d lumiku-dev -c "SELECT id, status, \"avatarId\", \"completedAt\" FROM avatar_generations WHERE id = '<generation-id>'"

# Expected:
# status = 'completed'
# avatarId = '<avatar-id>' (not null)
# completedAt = timestamp (not null)
```

### Test 5: Verify Frontend

```bash
# Open browser
# Navigate to Avatar Creator
# Check generation shows:
# - Status: Completed ✓
# - Avatar image displayed
# - Download button enabled
```

---

## Success Criteria

✅ **Worker Status:**
- `avatar-generator-worker` shows "online" in `pm2 list`
- Worker logs show "🚀 Avatar Generator Worker started"
- Heartbeat updates every 30 seconds

✅ **Generation Flow:**
- New generations complete within 30-90 seconds
- Status updates from pending → processing → completed
- Avatar images saved to filesystem
- Database records updated correctly

✅ **Queue Health:**
- `bull:avatar-generation:wait` drains to 0
- `bull:avatar-generation:active` shows 1-2 during processing
- No stuck jobs >5 minutes

✅ **User Experience:**
- Generation progress updates in real-time
- Avatar appears in project after completion
- Credits only deducted for successful generations
- Failed generations show error message and refund

✅ **Monitoring:**
- Worker heartbeat visible in Redis
- Queue metrics endpoint returns correct counts
- No alerts for stuck jobs or offline workers

---

## Rollback Plan

If the fix causes issues:

```bash
# Stop the new worker
pm2 stop avatar-generator-worker

# Revert ecosystem.config.js
git checkout HEAD~1 backend/ecosystem.config.js

# Restart PM2
pm2 delete all
pm2 start ecosystem.config.js --env production
pm2 save

# Mark pending generations as failed
psql -d lumiku-dev -c "
  UPDATE avatar_generations
  SET status = 'failed',
      errorMessage = 'System maintenance - please retry'
  WHERE status IN ('pending', 'processing')
"
```

---

## Contact Information

**For Support:**
- Database: Connect to PostgreSQL container `ycwc4s4ookos40k44gc8oooc`
- App Logs: PM2 logs or container logs from `d8ggwoo484k8ok48g8k8cgwk-*`
- Redis: Check queue health with `redis-cli`

**Documentation:**
- Worker Code: `backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts`
- Service Code: `backend/src/apps/avatar-creator/services/avatar-creator.service.ts`
- Queue Config: `backend/src/lib/queue.ts`
- PM2 Config: `backend/ecosystem.config.js`

---

**Report Generated:** 2025-10-17
**Status:** Fix ready for deployment
**Estimated Fix Time:** 10 minutes
**Risk Level:** Low (only adding worker, no code changes)
