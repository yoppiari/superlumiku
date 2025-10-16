# Pose Generator - Phase 3 Implementation Guide

## Overview

Phase 3 implements the complete backend API and worker pipeline for asynchronous pose generation using:

- **BullMQ**: Job queue system backed by Redis
- **FLUX.1-dev**: AI image generation via Hugging Face
- **Socket.IO**: Real-time progress updates via WebSocket
- **Redis Pub/Sub**: Worker-to-WebSocket communication

## Architecture

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│ Client  │─────▶│   API   │─────▶│  BullMQ  │─────▶│  Worker  │
│         │◀─────│ Server  │      │  Queue   │      │  Pool    │
└─────────┘  │   └─────────┘      └──────────┘      └──────────┘
             │                           ▲                 │
             │                           │                 │
             │   ┌─────────┐      ┌──────────┐      ┌──────────┐
             └──▶│WebSocket│◀─────│  Redis   │◀─────│   FLUX   │
                 │ Server  │      │ Pub/Sub  │      │   API    │
                 └─────────┘      └──────────┘      └──────────┘
```

## Components

### 1. Queue System (`queue/queue.config.ts`)

Manages job queuing with Redis persistence:

- **Job persistence**: Survives server restarts
- **Automatic retry**: 3 attempts with exponential backoff
- **Priority queuing**: Pro users get higher priority
- **Job cleanup**: Auto-remove completed (24h) and failed (7d) jobs

### 2. FLUX API Service (`services/flux-api.service.ts`)

Handles AI image generation:

- **Text-to-image**: Basic FLUX.1-dev generation
- **Retry logic**: Handles rate limits (429), cold starts (503)
- **Error classification**: Refundable vs non-refundable errors
- **Prompt enhancement**: Adds quality boosters and avatar context

**Note**: ControlNet integration is simplified for Phase 3. Full pose guidance will be added in Phase 4.

### 3. Worker (`workers/pose-generation.worker.ts`)

Processes generation jobs:

- **Gallery mode**: Generate variations for selected poses
- **Text mode**: Generate poses from text description
- **Progress tracking**: Updates every 5 poses
- **Checkpoint recovery**: Resume from last completed pose
- **Partial failure**: Automatic refunds for failed poses

### 4. WebSocket Server (`websocket/pose-websocket.ts`)

Real-time progress updates:

- **User-specific channels**: Each user has dedicated Redis channel
- **JWT authentication**: Verify token on connection
- **Message types**: started, progress, completed, failed
- **Auto-reconnect**: Client should implement exponential backoff

### 5. Service Layer Updates (`services/pose-generator.service.ts`)

- **Job enqueueing**: Creates generation record and queues BullMQ job
- **Credit deduction**: Atomic credit deduction before queueing
- **Unlimited tier**: Checks daily quota for unlimited users
- **Priority handling**: Higher priority for pro/unlimited users

## Environment Variables

### Required

```bash
# Redis (for BullMQ and Pub/Sub)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optional for local dev

# FLUX API (Hugging Face)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/lumiku

# JWT
JWT_SECRET=your_jwt_secret_key

# CORS (for WebSocket)
CORS_ORIGIN=http://localhost:3000
```

### Optional

```bash
# Worker Configuration
WORKER_CONCURRENCY=5  # Number of parallel jobs (default: 5)

# Queue Configuration
QUEUE_MAX_RETRIES=3          # Max retry attempts (default: 3)
QUEUE_CLEANUP_INTERVAL=3600  # Cleanup interval in seconds
```

## Installation

### 1. Install Dependencies

Socket.IO is not yet in package.json. Run:

```bash
cd backend
bun add socket.io @types/socket.io
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
```

Add the environment variables listed above.

### 3. Start Redis

If not already running:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using local Redis
redis-server
```

## Running the System

### Development Mode

You need **TWO** terminal windows:

**Terminal 1 - API Server:**
```bash
cd backend
bun run dev
```

**Terminal 2 - Worker:**
```bash
cd backend
bun run worker:pose-generator:dev
```

### Production Mode

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start bun --name "lumiku-api" -- run start

# Start worker pool (5 instances)
pm2 start bun --name "lumiku-worker" --instances 5 -- run worker:pose-generator

# View logs
pm2 logs

# Monitor
pm2 monit
```

Or use Docker Compose (recommended):

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    command: bun run start
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://...
      - HUGGINGFACE_API_KEY=...
    ports:
      - "4000:4000"
    depends_on:
      - redis
      - postgres

  worker:
    build: ./backend
    command: bun run worker:pose-generator
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://...
      - HUGGINGFACE_API_KEY=...
      - WORKER_CONCURRENCY=5
    deploy:
      replicas: 3  # 3 worker instances
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=lumiku
      - POSTGRES_USER=lumiku
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
```

## API Usage

### 1. Start Generation

```bash
POST /api/apps/pose-generator/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "projectId": "proj_abc123",
  "generationType": "GALLERY_REFERENCE",
  "selectedPoseIds": ["pose_1", "pose_2", "pose_3"],
  "batchSize": 4,
  "useBackgroundChanger": false,
  "outputFormats": ["instagram_story"]
}
```

**Response:**
```json
{
  "generationId": "gen_xyz789",
  "status": "pending",
  "totalPosesExpected": 12,
  "creditCharged": 360,
  "estimatedCompletionTime": 360,
  "message": "Generation queued successfully. Processing will begin shortly."
}
```

### 2. Connect to WebSocket

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:4000/pose-generator', {
  auth: {
    token: jwtToken
  },
  transports: ['websocket']
})

socket.on('connected', (data) => {
  console.log('Connected:', data)
})

socket.on('pose-generation-update', (event) => {
  console.log('Update:', event)

  switch (event.type) {
    case 'started':
      console.log('Generation started')
      break

    case 'progress':
      console.log(`Progress: ${event.percentage}% (${event.completed}/${event.total})`)
      break

    case 'completed':
      console.log(`Completed: ${event.completed} poses, ${event.failed} failed`)
      if (event.creditRefunded > 0) {
        console.log(`Refunded: ${event.creditRefunded} credits`)
      }
      break

    case 'failed':
      console.error('Generation failed:', event.error)
      break
  }
})

socket.on('disconnect', () => {
  console.log('Disconnected')
})
```

### 3. Check Status

```bash
GET /api/apps/pose-generator/generations/:generationId
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "generation": {
    "id": "gen_xyz789",
    "status": "processing",
    "posesCompleted": 5,
    "posesFailed": 0,
    "totalExpectedPoses": 12,
    "creditCharged": 360,
    "creditRefunded": 0
  },
  "progress": {
    "percentage": 42,
    "posesCompleted": 5,
    "posesFailed": 0,
    "posesTotal": 12,
    "currentStatus": "processing",
    "estimatedTimeRemaining": 210
  }
}
```

### 4. Get Results

```bash
GET /api/apps/pose-generator/generations/:generationId/results
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "results": [
    {
      "id": "pose_001",
      "outputImageUrl": "https://cdn.lumiku.com/poses/...",
      "thumbnailUrl": "https://cdn.lumiku.com/thumbs/...",
      "promptUsed": "professional standing pose...",
      "seedUsed": 123456,
      "generationTime": 28.5,
      "status": "completed"
    }
  ],
  "generation": {
    "id": "gen_xyz789",
    "status": "completed",
    "totalPoses": 12,
    "successCount": 11,
    "failedCount": 1,
    "creditCharged": 360,
    "creditRefunded": 30
  }
}
```

## Monitoring

### Queue Metrics

Check queue health:

```javascript
import { getQueueMetrics } from './queue/queue.config'

const metrics = await getQueueMetrics()
console.log(metrics)
// {
//   waiting: 10,
//   active: 5,
//   completed: 1523,
//   failed: 23,
//   delayed: 0,
//   total: 1561
// }
```

### Worker Status

View active workers:

```bash
# With PM2
pm2 list

# Check logs
pm2 logs lumiku-worker --lines 50

# Monitor resources
pm2 monit
```

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Check queue size
LLEN bull:pose-generation:wait

# Check active jobs
ZCARD bull:pose-generation:active

# View pub/sub channels
PUBSUB CHANNELS pose-generation:*
```

## Error Handling

### Client-Side

```javascript
socket.on('pose-generation-update', (event) => {
  if (event.type === 'failed') {
    // Handle failure
    showError(`Generation failed: ${event.error}`)

    // Check if refunded
    if (event.creditRefunded > 0) {
      showNotification(`${event.creditRefunded} credits have been refunded`)
    }
  }
})
```

### Worker Errors

Workers automatically retry failed jobs (max 3 attempts). After exhausting retries:

1. Generation marked as `failed`
2. Credits automatically refunded
3. Error message stored in database
4. WebSocket event sent to client

## Performance

### Target Metrics

- **Single pose**: 20-30 seconds
- **Batch of 10**: 3-5 minutes
- **Concurrent users**: 50+ (with 5 workers)
- **Queue throughput**: 40-50 poses/minute

### Scaling

**Horizontal scaling** (recommended):
```bash
# Start 10 worker instances
pm2 start bun --name "worker" --instances 10 -- run worker:pose-generator
```

**Vertical scaling** (increase concurrency):
```bash
# Set WORKER_CONCURRENCY=10 for each worker
WORKER_CONCURRENCY=10 bun run worker:pose-generator
```

## Troubleshooting

### Worker Not Processing Jobs

1. **Check Redis connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check worker logs:**
   ```bash
   pm2 logs lumiku-worker --lines 100
   ```

3. **Verify FLUX API key:**
   ```bash
   curl -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
     https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev
   ```

### WebSocket Not Connecting

1. **Check CORS settings:**
   - Ensure `CORS_ORIGIN` includes your frontend URL
   - Check browser console for CORS errors

2. **Verify JWT token:**
   ```javascript
   jwt.verify(token, JWT_SECRET)
   ```

3. **Check WebSocket path:**
   - Frontend should connect to: `http://localhost:4000/pose-generator`
   - Not: `http://localhost:4000/pose-generator-ws`

### Credits Not Refunded

1. **Check generation status:**
   ```sql
   SELECT id, status, creditCharged, creditRefunded, posesFailed
   FROM pose_generations
   WHERE id = 'gen_xyz';
   ```

2. **Verify credit records:**
   ```sql
   SELECT *
   FROM credits
   WHERE referenceId = 'gen_xyz' AND type = 'refund';
   ```

3. **Manually trigger refund:**
   ```javascript
   await poseGeneratorService.handlePartialFailure('gen_xyz')
   ```

## Testing

### Manual Testing

```bash
# 1. Start API and worker
bun run dev
bun run worker:pose-generator:dev

# 2. Create a test generation
curl -X POST http://localhost:4000/api/apps/pose-generator/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_test",
    "generationType": "TEXT_DESCRIPTION",
    "textPrompt": "professional standing pose",
    "batchSize": 2
  }'

# 3. Watch worker logs for progress

# 4. Check results
curl http://localhost:4000/api/apps/pose-generator/generations/<generationId>/results \
  -H "Authorization: Bearer <token>"
```

### Integration Testing

Create test suite for:
- Credit deduction before job starts
- Job queueing and processing
- Progress updates via WebSocket
- Partial failure refunds
- Job recovery after worker restart

## Next Steps (Phase 4)

- [ ] Cloudflare R2 integration for image storage
- [ ] Full ControlNet pose guidance implementation
- [ ] Background changer pipeline (SAM + Inpainting)
- [ ] Export format generation (Instagram, TikTok, Shopee)
- [ ] Job recovery on worker startup
- [ ] Advanced monitoring and alerting
- [ ] Load testing and optimization

## Support

For issues or questions:
- Check architecture doc: `docs/POSE_GENERATOR_ARCHITECTURE.md`
- Review Phase 1 implementation: `docs/POSE_GENERATOR_PHASE_0_COMPLETE.md`
- Contact: System Architect Agent

---

**Phase 3 Status:** ✅ Complete
**Last Updated:** October 14, 2025
**Version:** 1.0.0
