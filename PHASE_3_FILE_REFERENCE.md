# Phase 3: Complete File Reference

## Files Created (Phase 3)

### 1. Queue Configuration
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\queue\queue.config.ts`
**Purpose:** BullMQ queue configuration with Redis connection
**Lines:** 219
**Key Exports:**
- `poseGenerationQueue` - Queue instance
- `enqueuePoseGeneration()` - Add job to queue
- `getGenerationJob()` - Get job status
- `getQueueMetrics()` - Queue statistics
- `redisConnection` - Redis connection for other modules

### 2. FLUX API Service
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\services\flux-api.service.ts`
**Purpose:** Hugging Face FLUX.1-dev API integration
**Lines:** 365
**Key Exports:**
- `FluxApiService` - Service class
- `fluxApiService` - Singleton instance
- `AIGenerationError` - Custom error class

**Key Methods:**
- `generateImage()` - Text-to-image generation
- `generateWithControlNet()` - ControlNet mode (placeholder)
- `buildEnhancedPrompt()` - Prompt enhancement
- `validatePrompt()` - Basic NSFW check
- `healthCheck()` - API health check

### 3. Pose Generation Worker
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\workers\pose-generation.worker.ts`
**Purpose:** Background job processor
**Lines:** 425
**Key Exports:**
- `poseGenerationWorker` - Worker instance

**Helper Functions:**
- `generateSinglePose()` - Generate one pose
- `updateProgress()` - Update database progress
- `publishProgress()` - Publish to WebSocket
- `handlePartialFailure()` - Refund failed poses

### 4. WebSocket Server
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\websocket\pose-websocket.ts`
**Purpose:** Real-time progress updates
**Lines:** 278
**Key Exports:**
- `setupPoseWebSocket()` - Initialize WebSocket server
- `publishPoseProgress()` - Publish progress (for workers)
- `shutdownWebSocket()` - Graceful shutdown

### 5. Worker Entry Point
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\worker.ts`
**Purpose:** Start worker process
**Lines:** 50
**Usage:** `bun src/apps/pose-generator/worker.ts`

### 6. Documentation Files

**README:**
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\README.md`
**Lines:** 650+
**Contents:** Complete implementation guide

**Installation Guide:**
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\PHASE_3_INSTALLATION.md`
**Lines:** 250+
**Contents:** Quick start guide

**Completion Report:**
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\POSE_GENERATOR_PHASE_3_COMPLETE.md`
**Lines:** 550+
**Contents:** Detailed completion report

**Implementation Summary:**
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\PHASE_3_IMPLEMENTATION_SUMMARY.md`
**Lines:** 500+
**Contents:** High-level implementation overview

---

## Files Modified (Phase 3)

### 1. Pose Generator Service
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\pose-generator\services\pose-generator.service.ts`
**Changes:**
- Line 24: Added `enqueuePoseGeneration` import
- Lines 434-486: Added job queueing logic in `startGeneration()`

**Before:**
```typescript
// TODO Phase 4: Queue BullMQ job here
```

**After:**
```typescript
// Get avatar attributes if available
let avatarAttributes = null
if (data.avatarId) {
  const avatar = await prisma.avatar.findUnique({
    where: { id: data.avatarId },
    select: { gender: true, ageRange: true, ethnicity: true, style: true }
  })
  if (avatar) {
    avatarAttributes = JSON.stringify(avatar)
  }
}

// Queue BullMQ job for processing
const job = await enqueuePoseGeneration({
  generationId: generation.id,
  userId,
  projectId: data.projectId,
  generationType: data.generationType,
  selectedPoseIds: data.selectedPoseIds,
  textPrompt: data.textPrompt,
  batchSize: data.batchSize || 4,
  totalExpectedPoses: poseCount,
  useBackgroundChanger: data.useBackgroundChanger || false,
  backgroundMode: data.backgroundMode,
  backgroundPrompt: data.backgroundPrompt,
  backgroundColor: data.backgroundColor,
  backgroundImageUrl: data.backgroundImageUrl,
  exportFormats: data.outputFormats,
  avatarId: data.avatarId,
  avatarAttributes,
  creditCharged: creditCost,
}, usedUnlimitedQuota ? 10 : 5)

// Update generation with job ID
await prisma.poseGeneration.update({
  where: { id: generation.id },
  data: { queueJobId: job.id as string }
})

console.log(`[PoseGenerator] Queued generation ${generation.id} (job ${job.id}) with ${poseCount} poses`)
```

### 2. Package Configuration
**Full Path:** `C:\Users\yoppi\Downloads\Lumiku App\backend\package.json`
**Changes:**
- Lines 9-10: Added worker scripts

**Added:**
```json
"worker:pose-generator": "bun src/apps/pose-generator/worker.ts",
"worker:pose-generator:dev": "bun --watch src/apps/pose-generator/worker.ts",
```

---

## Directory Structure

```
Lumiku App/
├── backend/
│   ├── src/
│   │   └── apps/
│   │       └── pose-generator/
│   │           ├── queue/
│   │           │   └── queue.config.ts ⭐ NEW
│   │           ├── services/
│   │           │   ├── export.service.ts (existing)
│   │           │   ├── flux-api.service.ts ⭐ NEW
│   │           │   ├── pose-generator.service.ts ✏️ MODIFIED
│   │           │   └── validation.service.ts (existing)
│   │           ├── websocket/
│   │           │   └── pose-websocket.ts ⭐ NEW
│   │           ├── workers/
│   │           │   └── pose-generation.worker.ts ⭐ NEW
│   │           ├── plugin.config.ts (existing)
│   │           ├── routes.ts (existing)
│   │           ├── types.ts (existing)
│   │           ├── worker.ts ⭐ NEW
│   │           └── README.md ⭐ NEW
│   ├── package.json ✏️ MODIFIED
│   └── PHASE_3_INSTALLATION.md ⭐ NEW
├── POSE_GENERATOR_PHASE_3_COMPLETE.md ⭐ NEW
├── PHASE_3_IMPLEMENTATION_SUMMARY.md ⭐ NEW
└── PHASE_3_FILE_REFERENCE.md ⭐ NEW (this file)
```

**Legend:**
- ⭐ NEW - Created in Phase 3
- ✏️ MODIFIED - Modified in Phase 3
- (existing) - Existed before Phase 3

---

## Import Graph

```
worker.ts
  └── workers/pose-generation.worker.ts
       ├── queue/queue.config.ts
       ├── services/flux-api.service.ts
       └── prisma

routes.ts
  └── services/pose-generator.service.ts
       └── queue/queue.config.ts

main server (to be integrated)
  └── websocket/pose-websocket.ts
       └── ioredis (Redis Pub/Sub)
```

---

## Dependencies

### New Runtime Dependencies (Need to Install)
```json
{
  "socket.io": "^4.7.0"
}
```

### Already Installed ✅
```json
{
  "bullmq": "^5.59.0",
  "ioredis": "^5.8.0",
  "@huggingface/inference": "^4.11.1",
  "@prisma/client": "^5.7.1"
}
```

---

## Environment Variables

### Required
```bash
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
```

### Optional
```bash
REDIS_PASSWORD=
WORKER_CONCURRENCY=5
CORS_ORIGIN=http://localhost:3000
```

---

## Running the System

### Development
```bash
# Terminal 1: API Server
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run dev

# Terminal 2: Worker
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run worker:pose-generator:dev
```

### Production
```bash
# Using PM2
pm2 start bun --name "lumiku-api" -- run start
pm2 start bun --name "lumiku-worker" --instances 3 -- run worker:pose-generator

# Or using Docker Compose
docker-compose up -d
```

---

## Key Endpoints

### API Endpoints (Existing)
- `GET /api/apps/pose-generator/library` - Browse poses
- `GET /api/apps/pose-generator/categories` - Get categories
- `POST /api/apps/pose-generator/projects` - Create project
- `POST /api/apps/pose-generator/generate` - Start generation ✏️ Now queues job
- `GET /api/apps/pose-generator/generations/:id` - Get status
- `GET /api/apps/pose-generator/generations/:id/results` - Get results

### WebSocket Endpoint (New)
- `ws://localhost:4000/pose-generator` - Real-time updates
  - Auth: JWT token in `socket.handshake.auth.token`
  - Events: `pose-generation-update`

---

## Testing Checklist

### Manual Testing
- [ ] Install Socket.IO: `bun add socket.io`
- [ ] Configure environment variables
- [ ] Start Redis
- [ ] Start API server
- [ ] Start worker
- [ ] Create test project
- [ ] Start generation
- [ ] Connect WebSocket
- [ ] Verify progress updates
- [ ] Check completion

### Integration Testing (Phase 4)
- [ ] End-to-end generation flow
- [ ] Partial failure refunds
- [ ] Checkpoint recovery
- [ ] Multiple workers
- [ ] Rate limit handling
- [ ] WebSocket reconnection

---

## Monitoring

### Queue Metrics
```bash
redis-cli
> LLEN bull:pose-generation:wait
> ZCARD bull:pose-generation:active
```

### Worker Status
```bash
pm2 list
pm2 logs lumiku-worker
```

### Database Queries
```sql
SELECT status, COUNT(*) FROM pose_generations GROUP BY status;
```

---

## Next Steps

1. ✅ Phase 3 implementation complete
2. 🔧 Install Socket.IO
3. 🔧 Integrate WebSocket server
4. 🧪 Run integration tests
5. 🚀 Deploy to staging
6. 🎯 Begin Phase 4 (Cloudflare R2 + ControlNet)

---

**Last Updated:** October 14, 2025
**Status:** ✅ Phase 3 Complete
**Next Phase:** Phase 4 - Storage & ControlNet
