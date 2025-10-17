# Background Remover Pro - Complete Documentation Package
## Queue System, Deployment, Testing, Integration, Frontend & Risk Mitigation

This consolidated document covers the remaining 6 documentation files for Background Remover Pro.

---

# PART 1: QUEUE SYSTEM (BULLMQ)

## Queue Architecture

Background Remover Pro uses BullMQ + Redis for batch processing up to 500 images concurrently.

### Key Features
- **Persistence**: Jobs survive crashes (Redis persistence)
- **Scalability**: Add worker processes horizontally
- **Priority**: Smaller batches processed first
- **Progress**: Real-time tracking via Redis
- **Retries**: Automatic retry with exponential backoff

### Queue Flow

```
Client Upload → API (Create Batch) → Add to Queue → Workers Process → ZIP + Email → Complete
```

### Redis Configuration

```typescript
// config/redis.config.ts
export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
}

export const QUEUE_NAMES = {
  BATCH_REMOVAL: 'background-remover:batch',
}
```

### Worker Setup

```typescript
// workers/batch-processor.worker.ts
import { Worker } from 'bullmq'
import os from 'os'

const concurrency = Math.min(Math.max(os.cpus().length - 1, 5), 20)

const worker = new Worker('background-remover:batch', async (job) => {
  const { batchId, tier, userId } = job.data

  // Process items in chunks
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    await Promise.all(chunk.map(item => processItem(item, tier)))

    // Update progress
    await job.updateProgress((i / items.length) * 100)
  }
}, { concurrency })
```

### Starting Workers

```bash
# Start 4 worker processes with PM2
pm2 start src/worker.ts --name bg-remover-worker -i 4

# Monitor workers
pm2 logs bg-remover-worker
pm2 monit
```

---

# PART 2: DEPLOYMENT

## Production Deployment Guide

### Environment Variables

```bash
# .env.production

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/lumiku

# Redis
REDIS_URL=redis://prod-redis:6379
REDIS_PASSWORD=secure_redis_password

# AI APIs
HUGGINGFACE_API_KEY=hf_prod_xxxxx
SEGMIND_API_KEY=SG_prod_xxxxx

# Storage
STORAGE_DIR=/var/lumiku/storage
S3_BUCKET=lumiku-production  # Optional

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxx

# App
NODE_ENV=production
PORT=3000
JWT_SECRET=prod_secret_key
FRONTEND_URL=https://lumiku.com
```

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: lumiku/background-remover-api:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres

  worker:
    image: lumiku/background-remover-api:latest
    command: bun run worker.ts
    deploy:
      replicas: 4
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: lumiku
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

### Coolify Deployment

```bash
# 1. Connect repository
git remote add coolify ssh://coolify@app.coolify.io/lumiku-bg-remover

# 2. Push to deploy
git push coolify main

# 3. Coolify auto-detects Dockerfile and deploys
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    workers: await checkWorkers(),
    storage: await checkStorage(),
  }

  const healthy = Object.values(checks).every(c => c === true)

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  })
})
```

### Scaling Strategy

```bash
# Horizontal scaling

# Add more API servers (behind load balancer)
pm2 scale lumiku-api +2

# Add more workers
pm2 scale bg-remover-worker +4

# Monitor performance
pm2 monit
```

---

# PART 3: TESTING STRATEGY

## Test Pyramid

```
           ┌────────────┐
          /   E2E (5%)   \
         /─────────────────\
        /  Integration (15%) \
       /──────────────────────\
      /     Unit Tests (80%)    \
     /────────────────────────────\
```

### Unit Tests

```typescript
// pricing.service.test.ts
import { describe, it, expect } from 'bun:test'
import { calculateBatchCost } from '../pricing.service'

describe('Pricing Service', () => {
  it('should calculate cost with 10% discount for 100 images', () => {
    const result = calculateBatchCost('standard', 100)

    expect(result.baseTotal).toBe(800)
    expect(result.discountPercentage).toBe(10)
    expect(result.finalTotal).toBe(720)
  })

  it('should apply 20% discount for 250 images', () => {
    const result = calculateBatchCost('professional', 250)

    expect(result.baseTotal).toBe(3750)
    expect(result.discountPercentage).toBe(20)
    expect(result.finalTotal).toBe(3000)
  })
})
```

### Integration Tests

```typescript
// batch-removal.integration.test.ts
import { describe, it, expect, beforeAll } from 'bun:test'
import { api } from '../test-utils'

describe('Batch Removal Integration', () => {
  let authToken: string

  beforeAll(async () => {
    const login = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })
    authToken = login.data.token
  })

  it('should process batch of 10 images', async () => {
    const formData = new FormData()
    formData.append('tier', 'standard')

    for (let i = 0; i < 10; i++) {
      formData.append('images', testImages[i])
    }

    const response = await api.post('/background-remover/batch', formData, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    expect(response.status).toBe(201)
    expect(response.data.batchId).toBeDefined()
    expect(response.data.totalImages).toBe(10)

    // Wait for completion (with timeout)
    const batchId = response.data.batchId
    let completed = false

    for (let i = 0; i < 60; i++) {
      const status = await api.get(`/background-remover/batch/${batchId}`)
      if (status.data.status === 'completed') {
        completed = true
        break
      }
      await new Promise(r => setTimeout(r, 1000))
    }

    expect(completed).toBe(true)
  }, 120000) // 2 minute timeout
})
```

### Load Tests

```typescript
// load-test.ts using k6
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
}

export default function() {
  const formData = {
    field: 'tier',
    file: http.file(testImage, 'image.jpg'),
  }

  const res = http.post('http://api.lumiku.com/background-remover/remove', formData, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'processing time < 5s': (r) => r.json('processingTimeMs') < 5000,
  })

  sleep(1)
}
```

### Run Tests

```bash
# Unit tests
bun test

# Integration tests
bun test --integration

# Load tests
k6 run load-test.ts

# Coverage
bun test --coverage
```

---

# PART 4: INTEGRATION GUIDE

## Cross-App Integrations

### 1. Avatar Creator Integration

Remove backgrounds from all avatars in a project.

```typescript
// API Endpoint
POST /background-remover/integrations/avatar-creator/batch

// Request
{
  "projectId": "proj_abc123",
  "tier": "professional"
}

// Response
{
  "success": true,
  "batchId": "batch_xyz",
  "totalAvatars": 12,
  "totalCredits": 162
}
```

**Frontend Implementation:**

```svelte
<!-- AvatarCreator.svelte -->
<script lang="ts">
  async function removeAllBackgrounds() {
    const response = await fetch('/api/background-remover/integrations/avatar-creator/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId: currentProject.id,
        tier: 'professional'
      })
    })

    const { batchId } = await response.json()

    // Poll for progress
    pollBatchProgress(batchId)
  }
</script>

<button on:click={removeAllBackgrounds}>
  Remove All Backgrounds (Professional)
</button>
```

### 2. Pose Generator Integration

Auto-remove background after pose generation.

```typescript
// API Endpoint
POST /background-remover/integrations/pose-generator/auto-remove

// Request
{
  "generatedImageId": "pose_gen_001",
  "tier": "standard"
}

// Backend Implementation
async function generatePose(params) {
  // Generate pose
  const poseResult = await poseGeneratorService.generate(params)

  // Auto-remove background if requested
  if (params.autoRemoveBackground) {
    const removalResult = await fetch('/background-remover/integrations/pose-generator/auto-remove', {
      method: 'POST',
      body: JSON.stringify({
        generatedImageId: poseResult.id,
        tier: params.removalTier || 'standard'
      })
    })

    poseResult.backgroundRemovedUrl = removalResult.processedUrl
  }

  return poseResult
}
```

### 3. Image Upscaler Pipeline

Chain upscaling and background removal.

```typescript
// Pipeline: Remove → Upscale
POST /background-remover/integrations/upscaler/pipeline

{
  "imageId": "img_001",
  "pipeline": "remove-then-upscale",
  "removalTier": "professional",
  "upscaleFactor": 4
}

// Pipeline: Upscale → Remove
{
  "imageId": "img_001",
  "pipeline": "upscale-then-remove",
  "upscaleFactor": 2,
  "removalTier": "standard"
}
```

---

# PART 5: FRONTEND COMPONENTS

## Component Structure

```
src/lib/components/background-remover/
├── BackgroundRemover.svelte        # Main container
├── TierSelector.svelte             # Quality tier picker
├── FileUploader.svelte             # Drag-drop upload (500 files)
├── PricingCalculator.svelte        # Real-time cost calculation
├── ProgressTracker.svelte          # Batch progress UI
├── QuotaDisplay.svelte             # Subscription usage
└── ResultGallery.svelte            # Before/after comparison
```

### Main Component

```svelte
<!-- BackgroundRemover.svelte -->
<script lang="ts">
  import { useBackgroundRemoverStore } from '../../stores/background-remover.store'
  import { backgroundRemoverAPI } from '../../api/background-remover.api'

  const store = useBackgroundRemoverStore()

  let mode: 'single' | 'batch' = 'single'
  let isProcessing = false

  async function handleBatchRemoval() {
    isProcessing = true

    try {
      const result = await backgroundRemoverAPI.removeBatch(
        $store.uploadedFiles,
        $store.selectedTier
      )

      store.setCurrentBatch({
        id: result.batchId,
        status: 'processing',
        totalImages: result.totalImages,
        processedImages: 0,
        progressPercentage: 0,
        totalCredits: result.totalCredits,
      })

      // Start polling
      startProgressPolling(result.batchId)
    } catch (error) {
      console.error('Batch failed:', error)
    } finally {
      isProcessing = false
    }
  }

  function startProgressPolling(batchId: string) {
    const interval = setInterval(async () => {
      const progress = await backgroundRemoverAPI.getBatchProgress(batchId)

      store.updateBatchProgress({
        processedImages: progress.processedImages,
        progressPercentage: progress.progressPercentage,
        status: progress.status,
        zipUrl: progress.zipUrl,
      })

      if (progress.status === 'completed' || progress.status === 'failed') {
        clearInterval(interval)
      }
    }, 2000)
  }
</script>

<div class="background-remover">
  <TierSelector bind:selected={$store.selectedTier} />

  <FileUploader
    multiple={mode === 'batch'}
    maxFiles={500}
    on:upload={(e) => store.addFiles(e.detail)}
  />

  {#if mode === 'batch'}
    <PricingCalculator
      imageCount={$store.uploadedFiles.length}
      tier={$store.selectedTier}
    />

    <button
      class="start-batch"
      disabled={isProcessing}
      on:click={handleBatchRemoval}
    >
      Process {$store.uploadedFiles.length} Images
    </button>
  {/if}

  {#if $store.currentBatch}
    <ProgressTracker batch={$store.currentBatch} />
  {/if}
</div>
```

### Zustand Store

```typescript
// stores/background-remover.store.ts
import { create } from 'zustand'

interface BackgroundRemoverStore {
  uploadedFiles: File[]
  selectedTier: 'basic' | 'standard' | 'professional' | 'industry'
  currentBatch: BatchJob | null

  addFiles: (files: File[]) => void
  setSelectedTier: (tier: string) => void
  updateBatchProgress: (progress: Partial<BatchJob>) => void
}

export const useBackgroundRemoverStore = create<BackgroundRemoverStore>((set) => ({
  uploadedFiles: [],
  selectedTier: 'standard',
  currentBatch: null,

  addFiles: (files) => set((state) => ({
    uploadedFiles: [...state.uploadedFiles, ...files].slice(0, 500)
  })),

  setSelectedTier: (tier) => set({ selectedTier: tier }),

  updateBatchProgress: (progress) => set((state) => ({
    currentBatch: state.currentBatch ? { ...state.currentBatch, ...progress } : null
  })),
}))
```

---

# PART 6: RISK MITIGATION

## Technical Risks

### Risk 1: API Rate Limiting

**Risk**: HuggingFace/Segmind rate limits causing failed batches.

**Mitigation**:
```typescript
// Implement exponential backoff
async function callAIWithRetry(imageBuffer: Buffer, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aiProvider.removeBackground(imageBuffer)
    } catch (error) {
      if (error.code === 'RATE_LIMIT' && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000) // 1s, 2s, 4s
        continue
      }
      throw error
    }
  }
}
```

### Risk 2: Out of Memory (OOM)

**Risk**: Processing 500 large images crashes worker.

**Mitigation**:
```typescript
// Limit concurrency based on memory
function calculateSafeConcurrency(): number {
  const freeMemGB = os.freemem() / (1024 ** 3)
  const memoryPerJob = 0.2 // 200MB per job
  const maxByMemory = Math.floor(freeMemGB / memoryPerJob)

  return Math.min(maxByMemory, 20)
}

// Stream process large images
async function processLargeImage(buffer: Buffer) {
  const resized = await sharp(buffer)
    .resize({ width: 4096, withoutEnlargement: true })
    .toBuffer()

  return await aiProvider.removeBackground(resized)
}
```

### Risk 3: Network Failures

**Risk**: Temporary network issues causing job failures.

**Mitigation**:
```typescript
// Retry failed items individually
const failedItems = items.filter(i => i.status === 'failed')

for (const item of failedItems) {
  if (item.retry_count < 3) {
    await retryItem(item)
  }
}
```

## Business Risks

### Risk 4: Subscription Abuse

**Risk**: Users create multiple accounts for free tier abuse.

**Mitigation**:
```typescript
// Device fingerprinting + email verification
async function checkSubscriptionEligibility(userId: string) {
  const existingSubscriptions = await prisma.subscriptions.count({
    where: {
      OR: [
        { user_id: userId },
        { device_fingerprint: deviceId },
        { payment_email: email }
      ]
    }
  })

  if (existingSubscriptions > 0) {
    throw new Error('Duplicate subscription detected')
  }
}
```

### Risk 5: Margin Erosion

**Risk**: API costs increase, reducing profit margins.

**Mitigation**:
- Monitor API costs daily
- Auto-adjust pricing if margin < 85%
- Negotiate volume discounts with providers

```typescript
// Daily margin check
async function checkMargins() {
  const costs = await getAPICoinsToday()
  const revenue = await getRevenueToday()
  const margin = ((revenue - costs) / revenue) * 100

  if (margin < 85) {
    await notifyAdmin(`Margin dropped to ${margin}%`)
  }
}
```

## UX Risks

### Risk 6: Confusing Pricing

**Risk**: Users don't understand credit vs subscription model.

**Mitigation**:
- Show real-time pricing calculator
- Add "Best Value" badges
- Provide ROI calculator

```svelte
<!-- PricingComparison.svelte -->
<div class="comparison">
  <div class="option credits">
    <h3>Pay Per Use</h3>
    <p>Rp {calculateCreditCost(usage)}/month</p>
  </div>

  <div class="option subscription recommended">
    <span class="badge">SAVE 78%</span>
    <h3>Pro Subscription</h3>
    <p>Rp 299,000/month</p>
    <small>Saves Rp {calculateSavings(usage)}</small>
  </div>
</div>
```

---

## Monitoring & Alerting

### Critical Metrics

```typescript
// Sentry integration
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})

// Custom metrics
Sentry.metrics.increment('batch.started', { tier })
Sentry.metrics.increment('batch.completed', { tier })
Sentry.metrics.distribution('batch.duration', duration, { tier })
Sentry.metrics.gauge('queue.waiting', queueSize)
```

### Alerts

```yaml
# alerts.yml
alerts:
  - name: HighFailureRate
    condition: batch_failure_rate > 5%
    action: notify_slack

  - name: QueueBacklog
    condition: queue_waiting > 1000
    action: scale_workers

  - name: LowMargin
    condition: profit_margin < 85%
    action: notify_admin
```

---

## Summary

This consolidated documentation covers:

1. **Queue System**: BullMQ setup, worker implementation, concurrency
2. **Deployment**: Docker, Coolify, health checks, scaling
3. **Testing**: Unit, integration, load testing strategies
4. **Integration**: Cross-app patterns for Avatar Creator, Pose Generator
5. **Frontend**: Svelte components, Zustand store, real-time updates
6. **Risk Mitigation**: Technical, business, and UX risks with solutions

**All 10 documentation files are now complete!**

Refer to:
- `IMPLEMENTATION_GUIDE.md` - Start here
- `DATABASE_SCHEMA.md` - Database design
- `BACKGROUND_REMOVER_API_DOCUMENTATION.md` - API reference
- `BACKGROUND_REMOVER_PRICING_LOGIC.md` - Pricing formulas
- This file - Everything else

Ready for production implementation!
